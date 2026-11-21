# ARTHEUS — Routes Reference

> **Based on**: UI_ROUTES.md  
> **Framework**: React Router  
> **Last Updated**: 2026-06-08

---

## 📚 Overview

ARTHEUS의 모든 라우트, 화면, 권한, 핵심 컴포넌트를 정리한 레퍼런스입니다.

---

## 0. 글로벌 레이아웃 / 공통 UI

| 영역 | 컴포넌트 | 설명 |
|------|----------|------|
| 헤더 | `Navbar` | 투명 배경, 스크롤 시 페이드아웃. 로고 + 메인 네비 + 로그인/마이페이지 |
| 푸터 | `Footer` | 인덱스드 4-col 스탯 (SINCE / PROGRAMS / COACHES / ENROLLED) + 링크 그리드 + SNS |
| 모바일 독 | `MobileQuickDock` | 모바일 하단 빠른 이동 (홈/프로그램/코치/상담/마이) |
| 커서 | `CursorDebug` (Lumos) | 캔버스 라디얼 네온 글로우 커서 (z-9999) |
| 프리로더 | `Preloader` | Dot → Logo → Slogan, 위로 슬라이드 업 |
| SEO | `SEO` | 페이지별 title/description/canonical 메타 |
| 온보딩 가드 | `OnboardingGuard` | 신규 가입자를 `/onboarding`으로 강제 이동 |

### 디자인 토큰

- **배경**: Ivory Mist `#F6F3EE`
- **텍스트**: Charcoal `#1E2127`
- **액센트**: Cloud Blue
- **폰트**:
  - DM Sans Black (헤딩, `.text-3d`)
  - IBM Plex Sans KR (본문/한글)
  - Instrument Serif (에디토리얼 숫자)

### 유틸리티 클래스

`.glass-panel`, `.glass-panel-strong`, `.bg-soft-fog`, `.bg-spatial`, `.grid-overlay`, `.text-3d`, `.m-surface`, `.m-chip`, `.m-divider`, `.m-stat-num`, `.btn-glass`, `.btn-sharp`

---

## 1. 공개 마케팅 페이지 (Public)

### `/` — Home (랜딩)

**파일**: `src/pages/Index.tsx` (현재 `src/pages/Home.tsx`)  
**권한**: 누구나  
**구성**:
- 3D Hero (Three.js/R3F) + 4.3em 롤링 키워드
- 워터마크 UI
- 브랜드 인트로
- 프로그램 프리뷰
- 코치 프리뷰
- Zine 프리뷰
- CTA (상담)

### `/vision`

**권한**: 누구나  
**구성**:
- PageHeader + PageSection
- vision-motion (blur-emerge + glow orb)
- 비전·미션·철학

### `/programs`

**권한**: 누구나  
**구성**:
- 모든 프로그램 갤러리
- **GalleryCard** 이미지-퍼스트 그리드
- 트랙 필터: Admission(High/Adult/Grad) · Major — pill badge

### `/programs/admission`

**권한**: 누구나  
**구성**:
- 입시 전용 페이지
- 4-step Growth Process (Discover → Diagnose → Train → Deliver)
- 스크롤 페이드 없음, 즉시 배경색 전환

### `/programs/:course` — ProgramDetail

**권한**: 누구나  
**구성**:
- 다크모드 커리큘럼
- 6-step hover-invert 성장 카드
- FAQ
- CTA

### `/coaches`

**권한**: 누구나  
**구성**:
- 코치 갤러리 (GalleryCard 그리드)

### `/coaches/:slug` — CoachDetail

**권한**: 누구나  
**구성**:
- 세로 타임라인
- 대형 인용구 (철학)
- 작품/수업 이력

### `/zine`

**권한**: 누구나  
**구성**:
- 매거진/칼럼 갤러리
- 카테고리 탭

### `/zine/:cat/:slug` — ZineArticle

**권한**: 누구나  
**구성**:
- 본문
- 스티키 TL;DR
- 50% 스크롤 시 뉴스레터 CTA

### `/community`

**권한**: 누구나 (읽기), 코치/관리자 (쓰기)  
**구성**:
- 커뮤니티 피드
- 코치/관리자만 글 작성
- 일반 유저는 댓글/리액션만

### `/notices`

**권한**: 누구나  
**구성**:
- 공지사항 리스트

### `/consult`

**권한**: 누구나 (anon)  
**구성**:
- 상담 신청 3-step 폼
- 카카오 채널 리다이렉트

### `/lab`

**권한**: 누구나  
**구성**:
- 리서치/실험 페이지

### `/contact`

**권한**: 누구나  
**구성**:
- B2B/제휴 문의

### `/downloads`

**권한**: 누구나  
**구성**:
- 프로젝트 리소스 다운로드
- PRD·SUPABASE·UI_ROUTES·이미지·번들 ZIP

---

## 2. 인증 (Auth)

### `/login`

**권한**: 비로그인  
**기능**:
- 사용자명 + 비밀번호
- `username-login` 엣지함수로 username → email 서버사이드 해석
- 이메일 인증 필수

### `/signup`

**권한**: 비로그인  
**필드**:
- username
- 실명
- 이메일
- 비밀번호
- 생년월일
- 전화번호
- 최초 가입자 자동 admin 부여

### `/reset-password`

**권한**: 비로그인  
**기능**:
- 비밀번호 재설정 메일 발송
- 토큰 검증

### `/onboarding`

**권한**: 로그인 (1회)  
**기능**:
- 가입 직후 1회
- 관심 트랙·코치 선호 등 수집

### `/admin/login`

**권한**: 비로그인  
**기능**:
- 관리자 전용 로그인 게이트

---

## 3. 마이페이지 (학생 / 일반 사용자)

### `/my`, `/mypage` — MyPage 대시보드

**파일**: `src/pages/MyPage.tsx`  
**권한**: 로그인 사용자  
**구성**:
- 6 탭: Overview · Practice · Classes · Messages · Notes · Settings
- Cloud Blue 프로그레스 바
- 인터랙티브 카드
- 학생: 수업·과제·연습일지 (daily/weekly/monthly/quarterly) 확인
- 코치 뷰: `/mypage?view=coach`로 전환

---

## 4. 코치 콘솔 (Coach)

| 라우트 | 파일 | 설명 |
|--------|------|------|
| `/coach` | `CoachDashboard` | 코치 메인 대시보드 — 담당 클래스/학생/메시지 요약 |
| `/coach-console`, `/coach/console` | redirect → `/mypage?view=coach` | 레거시 경로 |
| `/coach/classes/:id` | `CoachClassDetail` | 클래스 상세 — 세션, 등록 학생, 과제 |
| `/coach/sessions/:id` | `CoachSessionDetail` | 세션 로그 + 학생별 피드백 노트 |
| `/coach/classes/:classId/students/:studentId` | `CoachStudentManage` | 학생 개별 관리 |
| `/coach/students` | `CoachStudents` | 담당 학생 목록 |
| `/coach/assignments` | `CoachAssignments` | 과제 출제/채점 |
| `/coach/associator` | `CoachAssociator` | 학생-클래스 연결 도구 |
| `/coach/recommend` | `RecommendList` | 작품 추천 리스트 |
| `/coach/recommend/new` | `RecommendProfileForm` | 추천 프로필 신규 |
| `/coach/recommend/:id` | `RecommendResult` | 추천 결과 |
| `/coach/recommend/:id/edit` | `RecommendProfileForm` | 추천 프로필 수정 |
| `/coach/recommend/data` | `RecommendDataAdmin` | 추천 데이터 관리 |

---

## 5. 학생 앱 / LMS

| 라우트 | 파일 | 설명 |
|--------|------|------|
| `/app/tasks` | `AppTasks` | 내 과제 리스트 |
| `/app/tasks/:id` | `AppTaskDetail` | 과제 상세 + 제출 |
| `/app/learn` | `AppLearn` | 학습 콘텐츠 |
| `/app/classroom/:classId` | `Classroom` | 모바일 교실 화면 |
| `/app/messages` | `AppMessages` | 코치 메시지함 |
| `/app/messages/:threadId` | `AppMessageThread` | 1:1 스레드 |
| `/app/report` | `AppReport` | 리포트/리플렉션 |

---

## 6. 관리자 (Admin)

### `/admin`

**권한**: admin  
**구성**:
- 통합 관리자 콘솔: CRM + CMS
- **CMS**: 프로그램, 코치, 공지, Zine, LMS 공지
- **CRM**: 상담 신청, 고객 노트, 회원 관리
- **학생/코치 계정**: `admin-create-student`, `admin-reset-password`, `admin-delete-user` 엣지함수 호출

---

## 7. VIDEO3 추가 라우트 (구현 예정)

### Director Routes

| 라우트 | 설명 | 우선순위 |
|--------|------|----------|
| `/director/dashboard` | 디렉터 대시보드 (운영 현황/KPI/상담/공지/제출물) | ⭐⭐⭐⭐⭐ |

### Admin Routes

| 라우트 | 설명 | 우선순위 |
|--------|------|----------|
| `/admin/dashboard` | Admin Panel 대시보드 | ⭐⭐⭐⭐⭐ |
| `/admin/site-content/home` | 사이트 콘텐츠 - 홈 Hero 편집 | ⭐⭐⭐⭐⭐ |
| `/admin/site-content/programs` | 사이트 콘텐츠 - 프로그램 페이지 | ⭐⭐⭐⭐ |
| `/admin/site-content/contact` | 사이트 콘텐츠 - Contact | ⭐⭐⭐ |
| `/admin/programs` | 프로그램 관리 | ⭐⭐⭐⭐ |
| `/admin/coaches` | 코치진 관리 | ⭐⭐⭐⭐ |
| `/admin/notices/new` | 공지사항 작성 | ⭐⭐⭐ |
| `/admin/classes` | 강좌 관리 | ⭐⭐⭐⭐ |
| `/admin/lms` | LMS 운영 | ⭐⭐⭐⭐ |
| `/admin/counseling` | 상담 신청 | ⭐⭐⭐ |
| `/admin/save-backups` | 저장 실패 백업 | ⭐⭐⭐ |

### Teacher Routes

| 라우트 | 설명 | 우선순위 |
|--------|------|----------|
| `/teacher/dashboard` | 강사 대시보드 | ⭐⭐⭐⭐ |
| `/teacher/lms` | 강사용 LMS 운영 | ⭐⭐⭐⭐ |
| `/teacher/schedule` | 직접 상담 일정 | ⭐⭐⭐⭐ |
| `/teacher/students/:id/profile` | 학생 프로필 폼 | ⭐⭐⭐ |
| `/teacher/logs` | 일지/피드백 작성 | ⭐⭐⭐ |

### Student Routes

| 라우트 | 설명 | 우선순위 |
|--------|------|----------|
| `/student/classes/:classId` | 학생 클래스 대시보드 | ⭐⭐⭐⭐ |
| `/student/assignments` | 과제 관리 | ⭐⭐⭐⭐ |
| `/student/classes/:classId/curriculum` | 커리큘럼/모듈 | ⭐⭐⭐⭐ |

---

## 8. 핵심 공용 컴포넌트

| 컴포넌트 | 위치 | 용도 |
|----------|------|------|
| `GalleryCard` | `src/components/GalleryCard.tsx` | 이미지-퍼스트 카테고리 카드 |
| `PageHeader` | `src/components/PageHeader.tsx` | 인덱스드 stat-number |
| `PageSection` | `src/components/PageSection.tsx` | vision-motion blur-emerge 섹션 |
| `MarqueeNeon` | — | Cloud Blue 다중 레이어 글로우 마퀴 |
| `Preloader` | — | Dot→Logo→Slogan 모션 |
| `CursorDebug` | — | Lumos 캔버스 커서 |
| `MobileQuickDock` | — | 모바일 하단 독 |
| `SEO` | — | 메타 태그 헬퍼 |
| `Toaster`, `Sonner` | shadcn | 토스트 알림 |

---

## 9. 라우트 → 권한 매트릭스

| 라우트 패턴 | Anon | User | Coach | Admin |
|-------------|:----:|:----:|:-----:|:-----:|
| `/`, `/vision`, `/programs/*`, `/coaches/*`, `/zine/*`, `/community`, `/notices`, `/consult`, `/lab`, `/contact`, `/downloads` | ✅ | ✅ | ✅ | ✅ |
| `/login`, `/signup`, `/reset-password` | ✅ | — | — | — |
| `/onboarding` | — | ✅ (1회) | — | — |
| `/my`, `/mypage` | — | ✅ | ✅ | ✅ |
| `/coach`, `/coach/*` | — | — | ✅ | ✅ |
| `/admin`, `/admin/login` | — | — | — | ✅ |
| `/app/*` (LMS) | — | ✅ (수강생) | ✅ | ✅ |
| `/director/*` | — | — | — | ✅ |
| `/teacher/*` | — | — | ✅ | ✅ |
| `/student/*` | — | ✅ | — | ✅ |

---

## 10. 모션 / 인터랙션 규칙

- **이징**: Expo Out 기본
- **페이지 진입**: `framer-motion` `AnimatePresence` (mode="wait")
- **Hero**: 3D tilt 타이틀 + 4.3em 롤링 키워드
- **스크롤**: 헤더 페이드아웃으로 몰입감 확보
- **카드 호버**: 6-step invert (다크 ↔ 라이트)
- **마퀴**: Cloud Blue 다중 레이어 네온 글로우 (선명한 텍스트 유지)

---

## 11. 오프라인 / 푸시

- **IndexedDB SWR 캐시**: `src/lib/offline-cache.ts`
- **Capacitor FCM 푸시**: 칼럼/Zine/연습일지 리마인더 구독
- **Cron**: `practice-journal-reminder` 엣지함수가 일/주/월/분기 알림 전송

---

## 📚 참조 문서

- [UI_ROUTES.md](/src/imports/UI_ROUTES.md) - 원본 상세 문서
- [VIDEO3_UI_GUIDE.md](/docs/VIDEO3_UI_GUIDE.md) - VIDEO3 49 scene 분석
- [VIDEO3_SELECTED_SCENES.md](/docs/VIDEO3_SELECTED_SCENES.md) - 우선 구현 가이드
- [PRD.md](/src/imports/PRD.md) - 제품 요구사항

---

**Last Updated**: 2026-06-08  
**Version**: 1.0.0
