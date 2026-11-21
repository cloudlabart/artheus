# ARTHEUS — Backend Architecture

> **Based on**: SUPABASE.md  
> **Stack**: Supabase (Auth · Postgres + RLS · Storage · Edge Functions · pgmq)  
> **Last Updated**: 2026-06-08

---

## 🎯 Overview

ARTHEUS는 **Supabase (Lovable Cloud)** 백엔드를 사용하여 인증, 데이터베이스, 스토리지, 서버리스 함수를 통합 관리합니다.

---

## 1. 인증 (Authentication)

### 로그인 방식

- **Username + Password**: 서버에서 username → email 해석
- **Google OAuth**: 소셜 로그인 지원
- **이메일 인증 필수**: 자동 가입 비활성화

### 회원가입 필드

```typescript
{
  username: string;      // 고유 사용자명
  email: string;         // 실제 이메일
  password: string;      // 비밀번호
  real_name: string;     // 실명
  birthdate: date;       // 생년월일
  phone: string;         // 전화번호
}
```

### 역할 시스템

- **역할**: `app_role` enum (`admin | coach | user`)
- **저장**: `user_roles` 별도 테이블 (profile과 분리)
- **헬퍼**: `has_role(uid, role)` SECURITY DEFINER 함수 (재귀 RLS 방지)
- **최초 가입자 자동 admin**: `auto_assign_first_admin` 트리거

---

## 2. 데이터베이스 구조 (public schema)

### 2.1 사용자 & 권한

| 테이블 | 용도 |
|--------|------|
| `profiles` | 사용자 프로필 (username·real_name·phone·coach 필드·온보딩) |
| `user_roles` | (user_id, role) — 권한 분리 |
| `notification_preferences` | 푸시·이메일 알림 설정 |
| `device_tokens` | FCM 푸시 토큰 (Capacitor) |

### 2.2 콘텐츠 (CMS)

| 테이블 | 용도 |
|--------|------|
| `programs` | 프로그램 (curriculum/steps/reviews JSONB) |
| `coaches` | 코치 프로필 (timeline JSONB, sns JSONB) |
| `notices` | 일반 공지 (pinned/published) |
| `lms_notices` | LMS 전용 공지 (audience: all / class별) |

### 2.3 LMS (수업 운영)

| 테이블 | 용도 |
|--------|------|
| `classes` | 강좌 (coach_id·program_id·quarter·track·weekday·time_slot) |
| `class_enrollments` | 학생-강좌 매핑 (status=active/...) |
| `class_sessions` | 회차 (auto-create 트리거: start_date 기준 4회) |
| `session_attendance` | 출결 (present/absent/...) |
| `session_logs` | 회차 종합 로그 (코치 작성, 첨부) |
| `session_feedback_coach_notes` | 코치 → 학생 개별 피드백 |
| `session_prep_checklist` | 회차 준비 체크리스트 (JSONB items) |
| `student_assignments` | 과제 (class별) |
| `assignment_submissions` | 학생 제출 (file_urls 배열) |
| `assignment_feedback` | 코치 채점·코멘트·next_focus |
| `learning_messages` | 클래스 내부 메시지 (voice_url·attachments) |

### 2.4 학습 기록 (Student-side)

| 테이블 | 용도 |
|--------|------|
| `practice_logs` | 통합 Practice Journal — daily/weekly/monthly/quarterly |
| `acting_notes` | 자유 형식 연기 메모 |
| `monthly_reflections` | 월간 셀프 평가 (rating_self) |
| `portfolio_items` | 학생 포트폴리오 (storage:`portfolios` 버킷) |
| `coach_feedback` | 코치가 학습자/포트폴리오에 남기는 피드백 |

### 2.5 CRM / 상담

| 테이블 | 용도 |
|--------|------|
| `consultations` | 무료 상담 신청 (`/consult` 폼) |
| `customer_notes` | 관리자용 고객 메모 (consultation/user 연결) |

### 2.6 입시 & 추천 시스템

| 테이블 | 용도 |
|--------|------|
| `school_admissions` | 학교/전공 모집 정보 (연도·전형) |
| `designated_works` | 학교별 지정 작품 |
| `admission_results` | 합격 실적 (year·school·major·admitted_count) |
| `recommendation_results` | 코치-AI 작품 추천 결과 (ranked_works·monologues·trainings JSONB) |

### 2.7 매거진 / 커뮤니티

| 테이블 | 용도 |
|--------|------|
| `article_scraps` | Zine 아티클 스크랩 |

### 2.8 운영 인프라

| 테이블 | 용도 |
|--------|------|
| `failed_saves` | 클라이언트 저장 실패 큐 (Admin "Failed Saves" 탭에서 재시도) |
| `email_send_log` | 이메일 발송 결과 로그 |
| `email_send_state` | 전송 쓰로틀 / TTL / 재시도 윈도우 (싱글톤 id=1) |
| `email_unsubscribe_tokens` | 1회용 수신거부 토큰 |

---

## 3. RLS (Row Level Security) 정책

### 권한 체크 헬퍼 함수

| 함수 | 용도 |
|------|------|
| `has_role(uid, role)` | 역할 확인 (admin/coach) |
| `is_class_coach(class_id, uid)` | 본인이 해당 클래스의 코치인가 |
| `is_class_student(class_id, uid)` | 본인이 해당 클래스 수강생인가 |
| `is_student_of_coach(student_id, coach_id)` | 코치-학생 관계 확인 |
| `email_for_username` | username→email (로그인 전용) |
| `is_duplicate_real_name` | 동명이인 체크 |

### 전형적 RLS 정책 패턴

```sql
-- 자기 데이터
CREATE POLICY "Users can view own data"
ON profiles FOR SELECT
USING (auth.uid() = user_id);

-- 코치는 본인 클래스/학생만
CREATE POLICY "Coaches can view own students"
ON class_enrollments FOR SELECT
USING (is_class_coach(class_id, auth.uid()));

-- 관리자 ALL
CREATE POLICY "Admins can do everything"
ON classes FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- 공개 콘텐츠
CREATE POLICY "Published content is public"
ON programs FOR SELECT
USING (published = true OR has_role(auth.uid(), 'admin'));

-- 상담 신청은 anon INSERT만
CREATE POLICY "Anyone can submit consultation"
ON consultations FOR INSERT
WITH CHECK (length(name) > 0);
```

---

## 4. Database Functions / Triggers

| 함수 | 트리거 | 역할 |
|------|--------|------|
| `handle_new_user()` | `auth.users` 신규 | profiles row 생성 + 메타데이터 매핑 |
| `auto_assign_first_admin()` | `auth.users` 신규 | admin 부재 시 첫 사용자에게 admin 부여 |
| `sync_profile_email()` | `auth.users` 이메일 변경 | profiles.email 동기화 |
| `auto_create_class_sessions()` | `classes` insert | 4회차 자동 생성 (주간격) |
| `update_updated_at()` | 다수 테이블 BEFORE UPDATE | updated_at 갱신 |

### 이메일 큐 헬퍼

- `enqueue_email`
- `read_email_batch`
- `delete_email`
- `move_to_dlq`

---

## 5. Storage Buckets

| 버킷 | 공개 | 용도 |
|------|------|------|
| `avatars` | Public | 사용자 프로필 사진 |
| `coach-images` | Public | 코치 프로필/배경 |
| `content-images` | Public | Zine/프로그램/공지 본문 이미지 |
| `email-assets` | Public | 트랜잭셔널 이메일 이미지 |
| `portfolios` | **Private** | 학생 포트폴리오 (RLS 보호) |
| `assignments` | **Private** | 과제 제출물 |

---

## 6. Edge Functions (`supabase/functions/`)

### 인증 관련

| 함수 | 호출 시점 | 역할 |
|------|-----------|------|
| `username-login` | 로그인 폼 | username → email 서버 측 해석 |
| `auth-email-hook` | Supabase Auth webhook | 가입/복구/이메일변경 메일 발송 큐잉 |

### 이메일 & 알림

| 함수 | 호출 시점 | 역할 |
|------|-----------|------|
| `process-email-queue` | cron | pgmq 큐 처리 → Resend 발송 + 재시도/DLQ |
| `send-learning-notification` | 코치 액션 후 | 학생에게 LMS 알림 메일/푸시 |
| `send-push-notification` | 범용 | FCM 푸시 (device_tokens 대상) |
| `practice-journal-reminder` | cron (daily/주·월·분기) | 저널 미작성 학생에게 FCM 리마인더 |

### 관리자 도구

| 함수 | 호출 시점 | 역할 |
|------|-----------|------|
| `admin-create-student` | Admin UI | service_role로 학생 계정 생성 |
| `admin-reset-password` | Admin UI | 비밀번호 강제 재설정 |
| `admin-delete-user` | Admin UI | 사용자 + 관련 데이터 삭제 |

### AI & 운영

| 함수 | 호출 시점 | 역할 |
|------|-----------|------|
| `recommend-works` | 코치 추천 폼 | AI Gateway 호출 → recommendation_results 저장 |
| `coach-associator` | 운영 도구 | 코치-수강생 자동 매핑 |

---

## 7. 데이터 채널 & 통합

### 서비스 통합

- **Supabase Auth**: 이메일/비번 + Google OAuth + username 로그인
- **Supabase Realtime**: (현재 미사용 — 폴링/SWR 기반)
- **pgmq**: `email_queue`, `email_dlq` (트랜잭셔널·인증 메일)
- **Resend**: 메일 실제 발송 (process-email-queue)
- **FCM**: 푸시 (Capacitor 모바일 앱)
- **Lovable AI Gateway**: `recommend-works` 작품 추천 LLM 호출
- **IndexedDB SWR Cache**: 오프라인 데이터 (`src/lib/offlineCache.ts`)

---

## 8. 환경 변수 / 시크릿

### Server-side (Edge Functions)

```bash
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_DB_URL
SUPABASE_JWKS
LOVABLE_API_KEY          # AI Gateway
FCM_SERVICE_ACCOUNT_JSON  # 푸시
RESEND_API_KEY           # 메일
```

### Client (.env, VITE_*)

```bash
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_PROJECT_ID
```

---

## 9. 저장 신뢰성 (Coach Save Reliability)

### 문제 패턴

| 현상 | 가능한 원인 | 예방 방식 |
|------|-------------|-----------|
| 저장 버튼이 계속 비활성화 | 저장 Promise 미종료 | `try/finally`로 상태 해제 보장 |
| 저장 토스트가 안 뜸 | 네트워크 요청 장기 대기 | 클라이언트 타임아웃 적용 |
| 일부 필드만 저장 | 여러 테이블 중 한쪽 실패 | 각 테이블 저장 결과 개별 검증 |
| 새로고침하면 내용 사라짐 | 실패했지만 UI가 성공 처리 | 실패 시 `failed_saves` + localStorage 백업 |
| 파일 첨부 후 저장 꼬임 | 업로드 예외 후 상태 미해제 | 업로드도 `try/catch/finally` 적용 |

### 예방 조치

#### 1. `safeUpsert` 클라이언트 타임아웃

```typescript
// 모든 안전 저장 요청에 기본 12초 제한
const result = await safeUpsert({
  table: 'session_logs',
  data: { ... },
  timeout: 12000
});
```

#### 2. 저장 흐름 통합

```typescript
async function runSave(saveAction: () => Promise<void>) {
  if (saving) {
    toast.error('이미 저장 중입니다');
    return;
  }
  
  try {
    setSaving(true);
    await saveAction();
    toast.success('저장되었습니다');
  } catch (error) {
    toast.error('저장 실패');
    // failed_saves 백업
  } finally {
    setSaving(false); // 반드시 해제
  }
}
```

#### 3. 운영 규칙

1. 저장 mutation은 `safeUpsert` 또는 동일 수준의 실패 백업 래퍼를 사용한다.
2. 저장 UI 상태는 반드시 `try/finally`로 해제한다.
3. 여러 테이블을 저장하면 각 테이블 결과를 개별 검증한다.
4. `.single()` 대신 빈 결과 가능성이 있으면 `.maybeSingle()`을 사용한다.
5. 대량 저장/첨부 저장은 타임아웃과 부분 실패 안내를 둔다.
6. "성공" 토스트는 모든 필수 저장이 성공한 뒤에만 띄운다.
7. 실패한 payload는 `failed_saves` 또는 localStorage에 남긴다.

---

## 10. 비변경 영역

⚠️ **절대 수정 금지**:
- `auth`, `storage`, `realtime`, `supabase_functions`, `vault` 스키마
- `src/integrations/supabase/client.ts`
- `src/integrations/supabase/types.ts` (자동 생성 파일)

---

## 📚 참조 문서

- [SUPABASE.md](/src/imports/SUPABASE.md) - 원본 상세 문서
- [COACH_SAVE_RELIABILITY.md](/src/imports/COACH_SAVE_RELIABILITY.md) - 저장 신뢰성 가이드
- [PRD.md](/src/imports/PRD.md) - 제품 요구사항

---

**Last Updated**: 2026-06-08  
**Version**: 1.0.0
