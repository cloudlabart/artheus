# Coach Dashboard Save Reliability — 원인 및 예방 정리

## 1. 대상 기능

강사 대시보드의 회차 상세 화면(`/coach/sessions/:id`)에서 사용하는 저장 기능입니다.

- **수업 일지:** `session_logs`
- **출결:** `session_attendance`
- **학생 공개 피드백:** `student_session_feedback`
- **강사간 공유 메모:** `session_feedback_coach_notes`
- **저장 실패 백업 큐:** `failed_saves`

---

## 2. 확인된 직접 원인

### 2.1 저장 요청이 끝나지 않으면 화면이 계속 잠기는 구조

기존 저장 함수는 네트워크 지연, 브라우저 탭 전환, 백엔드 응답 지연, RLS 실패 응답 누락 같은 상황에서 `setSaving(false)`까지 도달하지 못할 수 있었습니다.

그 결과:

- 저장 버튼이 계속 비활성화됨
- 사용자가 “페이지가 멈췄다”고 느끼는 상태 발생
- 다음 저장 시도를 막음

### 2.2 피드백 저장은 성공해도 공유 메모 저장 실패가 조용히 묻히는 구조

학생 공개 피드백은 `safeUpsert`로 백업 처리했지만, 강사간 공유 메모는 일반 `upsert` 후 오류를 확인하지 않았습니다.

그 결과:

- 공개 피드백만 저장되고 공유 메모는 누락될 수 있음
- UI에서는 “저장됨”으로 보일 수 있음
- 다음 조회 시 일부 내용이 사라진 것처럼 보임

### 2.3 업로드 중 예외 발생 시 업로드 상태가 남을 수 있는 구조

첨부 업로드 중 예외가 발생하면 `uploading` 상태가 해제되지 않을 위험이 있었습니다.

그 결과:

- 파일 선택/자동 저장 흐름이 막힘
- 사용자가 새로고침하기 전까지 멈춘 것처럼 보임

---

## 3. 유사 현상 패턴

| 현상 | 가능한 원인 | 예방 방식 |
|---|---|---|
| 저장 버튼이 계속 비활성화 | 저장 Promise 미종료 | `try/finally`로 상태 해제 보장 |
| 저장 토스트가 안 뜸 | 네트워크 요청 장기 대기 | 클라이언트 타임아웃 적용 |
| 일부 필드만 저장 | 여러 테이블 중 한쪽 실패 | 각 테이블 저장 결과 개별 검증 |
| 새로고침하면 내용 사라짐 | 실패했지만 UI가 성공 처리 | 실패 시 `failed_saves` + localStorage 백업 |
| 파일 첨부 후 저장 꼬임 | 업로드 예외 후 상태 미해제 | 업로드도 `try/catch/finally` 적용 |
| 여러 번 클릭 후 데이터 충돌 | 중복 저장 요청 | 저장 중 재진입 차단 |

---

## 4. 적용한 예방 조치

### 4.1 `safeUpsert` 클라이언트 타임아웃 추가

모든 안전 저장 요청에 기본 12초 제한을 추가했습니다.

- 응답이 오래 걸리면 `CLIENT_TIMEOUT`으로 실패 처리
- 실패 payload는 `failed_saves`와 브라우저 localStorage에 백업
- 백업 요청 자체도 6초 제한을 둬서 2차 멈춤을 방지

### 4.2 회차 상세 저장 흐름을 `runSave`로 통합

수업 일지, 출결, 피드백 저장이 모두 같은 안전 래퍼를 사용합니다.

- 저장 중 중복 클릭 방지
- 성공/실패와 무관하게 `saving=false` 보장
- 현재 저장 중이면 사용자에게 안내

### 4.3 피드백 + 공유 메모를 모두 안전 저장으로 변경

`student_session_feedback`과 `session_feedback_coach_notes`를 각각 `safeUpsert`로 처리합니다.

- 공개 피드백 실패 시 백업 및 오류 안내
- 공유 메모 실패 시 백업 및 오류 안내
- 두 요청은 병렬 실행해 전체 대기 시간을 줄임

### 4.4 첨부 업로드 상태 해제 보장

첨부 업로드 루프를 `try/catch/finally`로 감쌌습니다.

- 업로드 오류가 나도 `uploading=false` 보장
- 실패 파일은 토스트로 안내
- 성공한 파일만 자동 저장

---

## 5. DB/백엔드 점검 결과

확인한 항목:

- `session_logs.session_id` unique 제약 존재
- `session_attendance(session_id, student_id)` unique 제약 존재
- `student_session_feedback(session_id, student_id)` unique 제약 존재
- `session_feedback_coach_notes(session_id, student_id)` unique 제약 존재
- 관련 FK 및 기본 인덱스 존재
- 최근 24시간 관련 DB 로그에서 `statement timeout`, `deadlock`, `RLS violation` 흔적 없음

즉, 현재 관찰된 멈춤의 1차 원인은 DB 구조보다는 **클라이언트 저장 제어/오류 처리 부족** 쪽이었습니다.

---

## 6. 운영 규칙

앞으로 강사/관리자 저장 기능을 추가할 때는 아래 규칙을 반드시 적용합니다.

1. 저장 mutation은 `safeUpsert` 또는 동일 수준의 실패 백업 래퍼를 사용한다.
2. 저장 UI 상태는 반드시 `try/finally`로 해제한다.
3. 여러 테이블을 저장하면 각 테이블 결과를 개별 검증한다.
4. `.single()` 대신 빈 결과 가능성이 있으면 `.maybeSingle()`을 사용한다.
5. 대량 저장/첨부 저장은 타임아웃과 부분 실패 안내를 둔다.
6. “성공” 토스트는 모든 필수 저장이 성공한 뒤에만 띄운다.
7. 실패한 payload는 `failed_saves` 또는 localStorage에 남긴다.

---

## 7. 문제가 다시 보일 때 확인할 곳

- **Admin → Failed Saves:** 백업된 저장 payload 확인/재처리
- **브라우저 콘솔:** `[safeSave]` 로그 확인
- **DB 로그:** timeout/deadlock/RLS 메시지 확인
- **사용자 화면:** 저장 실패 토스트의 백업 ID 확인
