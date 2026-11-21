# ARTHEUS — Video 3 UI Implementation Guide

> **Source**: 화면 기록 2026-06-08 오후 3.34.33.mov  
> **Analysis Method**: 첨부 영상 화면만 기준으로 장면을 추출하고 UI를 역설계함  
> **Note**: 영상에 브라우저 주소창이 보이지 않으므로 아래 route는 실제 URL 확정값이 아니라 **구현용 권장 페이지 경로**

---

## 📋 Overview

이 프로젝트는 세 가지 연결된 인터페이스로 구성됩니다:

1. **Public Website** - 방문자 및 회원용 공용 웹사이트
2. **Admin CMS / Operations Panel** - 관리자용 콘텐츠 관리 시스템
3. **Teacher / Student LMS Portal** - 강사 및 학생용 학습 관리 시스템

---

## 🎨 Core Visual System

### Colors

```css
/* Background & Surfaces */
--bg-primary: #FFFFFF;
--header-gradient-start: #EAF5FF;
--header-gradient-end: #FFFFFF;

/* Borders & Dividers */
--border-color: #E5E7EB;
--border-width: 1px;

/* Text Colors */
--text-primary: #0A0A0A;
--text-muted: #6B7280;

/* Accent Colors */
--accent-blue: #3B82F6;
--accent-blue-soft: #DBEAFE;
--accent-blue-light: #EAF5FF;

/* Status Colors */
--error-bg: #FFF1F2;
--success-bg: #DBEAFE;
```

### Typography

- **Korean**: Pretendard Variable or Noto Sans KR
- **Numerals**: Inter-like sans-serif for metrics

### Layout

- **Desktop Width**: 1440–1600px canvas
- **Admin Sidebar Width**: 260–280px
- **Public Header Height**: ~68px
- **Card Radius**: 12–16px
- **Border**: 1px solid #E5E7EB
- **Spacing**: Generous vertical spacing, never crowd Korean paragraphs

### Visual Principles

- ✅ Clean Korean SaaS aesthetic
- ✅ White background with thin gray borders
- ✅ Light cloud-blue gradients
- ✅ Minimal shadows (only on selected/hover/modal)
- ✅ Large whitespace
- ✅ Rounded cards
- ✅ Precise table/card layouts

---

## 🧩 Core Components

### PublicHeader
- Light blue glass header
- Left: Logo (`ARTHEUS`)
- Center: Navigation (비전, 코치, 프로그램, LAB, 컬럼, 공지)
- Right: 마이페이지 / 수강생센터 buttons
- Height: ~68px

### AdminSidebar
- Fixed left sidebar
- Logo + Section labels (Overview/Content/Operations/CRM/System)
- Icon menu items
- Bottom: 로그아웃
- Width: 260–280px

### TeacherSidebar
- Teacher/Student left menu
- Active menu: black pill style
- Normal menu: thin icon + text

### MetricCard
- Number-centric KPI card
- Label: 12–13px
- Number: 28–32px
- Icon: top-right corner
- Border: #E5E7EB

### ProgressTable
- Class/student/schedule table
- Row height: 58–72px
- Progress bar: #3B82F6
- Status badge: "ACTIVE"

### ContentEditCard
- CMS editing card
- Label: blue uppercase
- Title: bold
- Hover/Selected: blue outline + "수정하기" button

### ProgramCard
- 2-column program card
- PAGE_SECTION label
- Title, description
- Edit CTA

### CoachCard
- Image placeholder
- "공개" badge
- Name / Role
- Action icons

### ModalShell
- Dim overlay
- Center rounded 16px modal
- Header + form controls
- Footer buttons

### RightDrawer
- Schedule creation, etc.
- Right slide panel
- Background dim
- Width: 360–420px
- Bottom fixed CTA

### CalendarMonth
- Monthly calendar
- Date cells
- Event chips
- Today highlight
- Toolbar buttons

### FloatingContactRail
- Right vertical floating buttons
- 4 items: 상담 문의 / 카카오톡 / INSTA / YOUTUBE

### AlertStack
- Top error/success alert stack
- Error: pink/red background
- Info: blue background
- z-index handling to not overlap footer

### EmptyState
- Centered small message or rounded empty container
- Minimal design, no unnecessary illustrations

---

## 📄 Page Routes & Components

### Public Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Home Hero | 공용 랜딩, 대형 워드마크, 중앙 타이틀, CTA, 우측 플로팅 rail |
| `/vision` | Vision | 비전 페이지 |
| `/coaches` | Coaches | 코치진 소개 |
| `/programs` | Programs | 프로그램 목록 (OUR TRACKS/프로그램 카드) |
| `/lab` | Lab | LAB 페이지 |
| `/columns` | Columns | 컬럼 |
| `/notices` | Notices | 공지사항 |
| `/mypage` | My Page | 마이페이지 |

### Director Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/director/dashboard` | Director Dashboard | 디렉터 대시보드, 운영 현황/KPI/상담/공지/제출물 통합 |

### Admin Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/admin/dashboard` | Admin Dashboard | 좌측 Admin Sidebar + KPI + 최근 활동 |
| `/admin/site-content/home` | Site Content - Home | Hero 키워드/타이틀/슬로건/CTA 카드 편집 |
| `/admin/site-content/programs` | Site Content - Programs | OUR TRACKS/THE COACHES/ZINE 섹션 카드 |
| `/admin/site-content/contact` | Site Content - Contact | Business/Contact 카드 편집 |
| `/admin/programs` | Programs Management | 프로그램 트랙 카드 2열 그리드, 편집 모달 |
| `/admin/coaches` | Coaches Management | 코치 카드 그리드, 등록/수정 모달 |
| `/admin/notices/new` | Notice Editor | 제목/본문/체크박스/저장 버튼 |
| `/admin/classes` | Classes Management | 강좌 카드/리스트, 강좌 편집/수업용 데크 모달 |
| `/admin/lms` | LMS Operations | KPI, 리스트/카드/캘린더 보기, 클래스 진행 현황 |
| `/admin/counseling` | Counseling Requests | 상태 필터, 검색, CSV 내보내기, 신청 카드 |
| `/admin/save-backups` | Save Failure Backups | 저장 실패 데이터/복구 액션/empty state |

### Teacher Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/teacher/dashboard` | Teacher Dashboard | 담당 클래스, 최근 피드백, KPI 요약 |
| `/teacher/lms` | Teacher LMS | LMS KPI, 카드/캘린더/수업 목록 |
| `/teacher/schedule` | Direct Counseling Schedule | 월간 캘린더, 새 일정 드로어 |
| `/teacher/students/:id/profile` | Student Profile Form | 아바타, 기본 정보, 연락처, SNS form |

### Student Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/student/classes/:classId` | Student Class Dashboard | 클래스 KPI, 과제 케어/일지 작성 폼 |
| `/student/assignments` | Assignments Management | 클래스 필터, KPI, 진행 클래스 행 |
| `/student/classes/:classId/curriculum` | Curriculum / Modules | 단계 탭, 발전 방향, 모듈 카드, 메시지 입력 |

---

## 🎯 Implementation Details

### Public Home `/`

**Hero Page Components:**
- Left logo: `ARTHEUS`
- Nav items: `비전`, `코치`, `프로그램`, `LAB`, `컬럼`, `공지`
- Right button: `마이페이지`
- Huge low-opacity background wordmark: `ARTHEUS`
- Small label: `ACTING ACADEMY`
- Main title: `THE WAY GOOD CLOUD LAB.`
- Slogan: `ALWAYS BREATH _ FOR MIND`
- CTAs: `클래스`, `LAB 둘러보기`
- Right floating rail: `상담 문의`, `카카오톡`, `INSTA`, `YOUTUBE`
- Bottom marquee text: `COMMUNICATION — REPETITION — FEEDBACK — PERCEPTION — COGNITION — ...`

### Admin Panel Shell

**Fixed Left Sidebar:**
- Logo block: `ARTHEUS / ADMIN PANEL`
- Sections: `OVERVIEW`, `CONTENT`, `OPERATIONS`, `CRM`, `SYSTEM`
- Menus:
  - 대시보드
  - 사이트 콘텐츠
  - 프로그램
  - 코치진
  - 공지사항
  - 강좌 관리
  - LMS 운영
  - 상담 신청
  - 회원 목록
  - 고객 메모
  - 저장 실패 백업
- Bottom: `로그아웃`

**Content Pages:**
- Dashboard KPI cards
- CMS editable content cards with blue uppercase labels
- Program cards in 2-column grid
- Coach cards in 4-column grid
- Notice editor
- Class management cards
- LMS operation views: dashboard/list/calendar/cards
- Counseling request list
- Save failure backup empty state

### Director Dashboard `/director/dashboard`

**Components:**
- Title: `배준우 디렉터 대시보드`
- Top action buttons: `CMS 관리`, `코치 콘솔 · LMS`, `강사 대시보드`, `LOGOUT`
- KPI cards:
  - 활성 클래스 9/9
  - 가입 학생 3
  - 활동 강사 6
  - 누적 세션 32
  - 신규 상담 1
  - 과제 지연 4
- Table: `전체 클래스 운영 현황`
- Side sections:
  - 최근 상담
  - 최근 제출물
  - 공지사항
- Lower analytics:
  - 강사별 진도 현황
  - 과제 지연 현황
  - 플랫폼 지표

### Teacher / Student Portal

**Shell:**
- Public header
- Left side navigation
- Active menu: black pill style

**Pages:**
- Teacher dashboard greeting: `안녕하세요, 배준우 선생님`
- KPI cards and two-column content cards
- LMS operating page with KPI cards and class progress cards
- Calendar monthly view with blue selected date
- Right drawer for `새 일정`
- Profile form with avatar and 2-column inputs
- Student class dashboard `입시반 · 연기1` with progress `93%`
- Assignments page `과제 관리`
- Curriculum page with 단계 탭 and module cards

---

## 🔄 Interaction States

### Loading State
- Center `Loading...` text
- Minimal, no skeleton
- White background (#FFFFFF)
- Center-aligned

### Empty State
- Small centered message or rounded empty container
- Minimal design
- No unnecessary illustrations

### Error Alert Stack
- Pink/red alerts stacked near top
- Blue info alert
- z-index handling for footer overlap prevention

### Modal Overlay
- Dark dim background: `rgba(0, 0, 0, 0.65)`
- Centered rounded modal (16px radius)
- Header + body + footer

### Right Drawer
- Dim background
- Panel slides from right
- Width: 360–420px
- Fixed bottom CTA

### Hover/Edit State for CMS Cards
- Blue border on hover
- `수정하기` button overlay
- Selected state: blue outline

---

## 📸 Scene Reference Index

| Scene | Timestamp | Screenshot | Route | Description |
|-------|-----------|------------|-------|-------------|
| 01 | 00:00 | 01_00m00s_director_admin_dashboard_top.jpg | /director/dashboard | 디렉터 운영 대시보드 / 상단 KPI |
| 02 | 00:05 | 02_00m05s_public_footer_error_alerts.jpg | / | 푸터 + 오류/알림 스택 |
| 03 | 00:10 | 03_00m10s_loading_empty_state.jpg | * | 로딩 상태 |
| 04 | 00:15 | 04_00m15s_site_page_editor_home.jpg | /admin/site-content/home | CMS 사이트 콘텐츠 / 홈 Hero 편집 |
| 05 | 00:20 | 05_00m20s_programs_page_editor_tracks_coaches_zine.jpg | /admin/site-content/programs | CMS 프로그램 페이지 편집 |
| 06 | 00:25 | 06_00m25s_program_cards_editor_modules.jpg | /admin/programs | CMS 프로그램 카드 편집 / 트랙 모듈 |
| 07 | 00:30 | 07_00m30s_program_category_contact_editor.jpg | /admin/site-content/contact | CMS 카테고리/Contact 편집 |
| 08 | 00:35 | 08_00m35s_link_edit_modal.jpg | /admin/site-content/home#modal-link-edit | 링크/키워드 편집 모달 |
| 09 | 00:45 | 09_00m45s_program_edit_modal.jpg | /admin/programs/:id/edit | 프로그램 편집 모달 |
| 10 | 00:50 | 10_00m50s_coach_grid_admin.jpg | /admin/coaches | 코치진 관리 그리드 |
| 11 | 00:55 | 11_00m55s_coach_add_edit_modal.jpg | /admin/coaches/new | 코치 등록/수정 모달 |
| 12 | 01:00 | 12_01m00s_notice_write_editor.jpg | /admin/notices/new | 공지사항 작성 에디터 |
| 13 | 01:05 | 13_01m05s_admin_dashboard_summary.jpg | /admin/dashboard | Admin Panel 대시보드 |
| 14 | 01:10 | 14_01m10s_class_management_cards.jpg | /admin/classes | 강좌 관리 / 카드 목록 |
| 15 | 01:15 | 15_01m15s_class_edit_modal.jpg | /admin/classes/:id/edit | 강좌 편집 모달 |
| 16 | 01:20 | 16_01m20s_class_deck_modal.jpg | /admin/classes/:id/decks | 수업용 데크 모달 |
| 17 | 01:25 | 17_01m25s_class_management_expanded.jpg | /admin/classes | 강좌 관리 / 확장 목록 |
| 18 | 01:30 | 18_01m30s_lms_admin_dashboard.jpg | /admin/lms | LMS 운영 / 운영 현황 대시보드 |
| 19 | 01:35 | 19_01m35s_lms_admin_list_empty.jpg | /admin/lms?view=list | LMS 운영 / 리스트 빈 상태 |
| 20 | 01:45 | 20_01m45s_lms_calendar_month.jpg | /admin/lms?view=calendar | LMS 운영 / 월간 캘린더 |
| 21 | 01:55 | 21_01m55s_counseling_request_list.jpg | /admin/counseling | 상담 신청 목록 |
| 22 | 02:00 | 22_02m00s_counseling_request_detail.jpg | /admin/counseling/:id | 상담 신청 상세/선택 |
| 23 | 02:05 | 23_02m05s_save_failure_backup.jpg | /admin/save-backups | 저장 실패 백업 |
| 24 | 02:20 | 24_02m20s_course_management_empty.jpg | /admin/classes?filtered=true | 강좌 관리 / 필터 빈 상태 |
| 25 | 02:25 | 25_02m25s_public_director_dashboard.jpg | /director/dashboard | 퍼블릭 쉘 디렉터 대시보드 |
| 26 | 02:30 | 26_02m30s_teacher_dashboard_sidebar_cards.jpg | /teacher/dashboard | 선생님/강사용 홈 대시보드 |
| 27 | 02:40 | 27_02m40s_daily_log_write_form.jpg | /teacher/logs | 일지/피드백 작성 폼 |
| 28 | 02:45 | 28_02m45s_student_class_dashboard_log.jpg | /student/classes/:classId | 학생 클래스 대시보드 / 일지 작성 |
| 29 | 02:50 | 29_02m50s_instructor_dashboard.jpg | /instructor/dashboard | 강사 대시보드 |
| 30 | 03:00 | 30_03m00s_teacher_home_dashboard.jpg | /teacher/dashboard | 선생님 홈 / 클래스·피드백 요약 |
| 31 | 03:10 | 31_03m10s_teacher_lms_detail_list.jpg | /teacher/lms/classes/:id | 선생님 LMS 상세 리스트 |
| 32 | 03:15 | 32_03m15s_calendar_schedule_panel.jpg | /teacher/schedule | 직접 상담 일정 / 캘린더 패널 |
| 33 | 03:20 | 33_03m20s_schedule_create_drawer.jpg | /teacher/schedule#drawer-new | 새 일정 생성 드로어 |
| 34 | 03:30 | 34_03m30s_class_dashboard_progress.jpg | /student/classes/:classId | 학생 클래스 진행률 대시보드 |
| 35 | 03:40 | 35_03m40s_long_feedback_text_cards.jpg | /teacher/lms/feedback | 긴 피드백/답변 카드 목록 |
| 36 | 03:45 | 36_03m45s_teacher_lms_operating_page.jpg | /teacher/lms | 강사용 LMS 운영 대시보드 |
| 37 | 03:55 | 37_03m55s_lms_cards_grid.jpg | /teacher/lms?view=cards | LMS 운영 / 카드 그리드 보기 |
| 38 | 04:05 | 38_04m05s_calendar_view_again.jpg | /teacher/lms?view=calendar | LMS 운영 / 캘린더 보기 |
| 39 | 04:10 | 39_04m10s_student_profile_form.jpg | /teacher/students/:id/profile | 학생/회원 프로필 폼 |
| 40 | 04:20 | 40_04m20s_director_dashboard_return.jpg | /director/dashboard | 디렉터 대시보드 재진입 |
| 41 | 04:25 | 41_04m25s_student_class_dashboard_return.jpg | /student/classes/:classId | 학생 클래스 대시보드 재진입 |
| 42 | 04:35 | 42_04m35s_student_dashboard_plan_summary.jpg | /student/assignments | 과제 관리 요약 |
| 43 | 04:45 | 43_04m45s_academy_curriculum_bottom_message.jpg | /student/classes/:classId/curriculum | 입시반 아카데미 커리큘럼 하단/메시지 |
| 44 | 05:00 | 44_05m00s_curriculum_modules_detail.jpg | /student/classes/:classId/curriculum | 커리큘럼 모듈 상세 |
| 45 | 05:10 | 45_05m10s_class_dashboard_scrolled_admin.jpg | /instructor/dashboard | 강사 대시보드 / 담당 클래스 |
| 46 | 05:15 | 46_05m15s_admin_dashboard_lower_tables.jpg | /director/dashboard#lower | 디렉터 대시보드 하단 통계 |
| 47 | 05:20 | 47_05m20s_footer_with_errors.jpg | / | 푸터 + 저장 실패 알림 재노출 |
| 48 | 05:25 | 48_05m25s_home_hero_large_wordmark.jpg | / | 홈 Hero / 배경 워드마크 상태 |
| 49 | 05:30 | 49_05m30s_home_hero_final.jpg | / | 홈 Hero / 최종 랜딩 |

---

## ✅ Implementation Quality Standards

1. **Route Separation**: 실제 서비스처럼 route별 frame을 분리
2. **Component Reuse**: 동일 컴포넌트는 반복 사용
3. **Content Fidelity**: 영상 속 텍스트와 수치가 보이는 장면은 최대한 그대로 구현
4. **Recommended Paths**: 주소창이 안 보이는 장면의 route는 이 문서의 recommended path 사용
5. **Component Reconstruction**: 스크린샷 이미지를 배경으로 깔지 말고, React component/layout으로 재구성
6. **State Management**: 페이지별 loading, empty, modal, drawer, alert state를 반드시 구현

---

**Reference**: Video recording analysis (2026-06-08)
