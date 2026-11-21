# VIDEO3 Selected Scenes - Quick Reference

> **Purpose**: 5개의 핵심 scene 스크린샷을 우선 구현 가이드로 사용  
> **Source**: `/src/imports/selected_1.jpg` ~ `/src/imports/selected_5.jpg`  
> **Last Updated**: 2026-06-08

---

## 📸 Selected Scene Overview

VIDEO3 전체 49 scene 중 가장 중요한 5개 scene을 선별하여 우선 구현합니다.

---

## Selected Scene 1: Director Dashboard (디렉터 대시보드)

**파일**: `/src/imports/selected_1.jpg`  
**Route**: `/director/dashboard`  
**Scene Ref**: Scene 01, 25, 40

### 구현 요소

#### 상단 Public Header
- Logo: ARTHEUS
- Navigation: 비전, 코치, 프로그램, LAB, 컬럼, 공지
- Right buttons: 마이페이지

#### Dashboard Header
- Title: `배준우 디렉터 대시보드`
- Action buttons (우측):
  - CMS 관리
  - 코치 콘솔 · LMS
  - 강사 대시보드
  - LOGOUT

#### KPI Cards (6개, 2행 3열)
1. **활성 클래스**: 9/9 (green)
2. **가입 학생**: 3
3. **활동 강사**: 6
4. **누적 세션**: 32
5. **신규 상담**: 1 (yellow)
6. **과제 지연**: 4 (red)

#### Main Table: 전체 클래스 운영 현황
- Columns:
  - 클래스명
  - 담당강사
  - 기간
  - 정원/참여
  - 진행률 (progress bar, blue #3B82F6)
  - 상태 (ACTIVE badge)
  - 액션 (상세보기 link)

#### Right Sidebar Panels (3개)
1. **최근 상담**: 신청 카드
2. **최근 제출물**: 과제 카드
3. **공지사항**: 공지 리스트

#### Lower Analytics (하단)
- 강사별 진도 현황 (table)
- 과제 지연 현황 (table)
- 플랫폼 지표 (mini KPI cards)

### 구현 우선순위
⭐⭐⭐⭐⭐ (최우선)

---

## Selected Scene 2: Admin Site Content Editor - Home

**파일**: `/src/imports/selected_2.jpg`  
**Route**: `/admin/site-content/home`  
**Scene Ref**: Scene 04, 08

### 구현 요소

#### AdminSidebar (좌측 고정)
- Logo: ARTHEUS / ADMIN PANEL
- Sections:
  - **OVERVIEW**: 대시보드
  - **CONTENT**: 사이트 콘텐츠, 프로그램, 코치진, 공지사항
  - **OPERATIONS**: 강좌 관리, LMS 운영
  - **CRM**: 상담 신청, 회원 목록, 고객 메모
  - **SYSTEM**: 저장 실패 백업
- Bottom: 로그아웃

#### Content Area
- Page Title: `사이트 콘텐츠 관리 — 홈`

#### ContentEditCard Components (세로 배치)
각 카드는 hover 시 blue outline + "수정하기" 버튼

1. **HERO_KEYWORDS** (라벨: 파란색 대문자)
   - Title: Hero 키워드
   - Content preview
   - Edit button

2. **HERO_TITLE**
   - Title: Hero 메인 타이틀
   - THE WAY GOOD CLOUD LAB.

3. **HERO_SLOGAN**
   - Title: Hero 슬로건
   - ALWAYS BREATH _ FOR MIND

4. **HERO_CTA**
   - Title: CTA 버튼
   - 클래스, LAB 둘러보기

5. **THEME**
   - Title: 테마 설정
   - Background colors, etc.

#### Edit Modal (Scene 08)
- Dim overlay: rgba(0, 0, 0, 0.65)
- Centered modal (radius 16px)
- Header: 제목
- Input field
- Footer: 취소 / 저장 (blue button)

### 구현 우선순위
⭐⭐⭐⭐⭐ (최우선)

---

## Selected Scene 3: Admin Program Management

**파일**: `/src/imports/selected_3.jpg`  
**Route**: `/admin/programs`  
**Scene Ref**: Scene 06, 09

### 구현 요소

#### Page Layout
- AdminSidebar (좌측)
- Page Title: `프로그램 관리`
- Add button (우측 상단)

#### Program Cards (2열 그리드)
각 카드:
- PAGE_SECTION label (blue uppercase)
- Thumbnail placeholder (#E5E5E1)
- Title (bold, large)
- Description
- Edit icon (우상단)
- Selected state: blue outline + "수정하기" button

예시 카드:
1. **MOVEMENT ATLAS**
   - OUR TRACKS
   - 무브먼트 아틀라스
   
2. **VOICE PRINT**
   - OUR TRACKS
   - 보이스 프린트
   
3. **SCRIPT DECODER**
   - OUR TRACKS
   - 스크립트 디코더
   
4. **AUDITION OS**
   - OUR TRACKS
   - 오디션 OS

#### Edit Modal (Scene 09)
- Thumbnail upload area
- Form fields (2열):
  - 제목
  - Slug
  - 카테고리 (select)
  - 설명 (textarea, 전폭)
- 공개 checkbox
- Footer: 취소 / 저장

### 구현 우선순위
⭐⭐⭐⭐ (높음)

---

## Selected Scene 4: Teacher LMS Operating Page

**파일**: `/src/imports/selected_4.jpg`  
**Route**: `/teacher/lms`  
**Scene Ref**: Scene 36, 37, 38

### 구현 요소

#### Layout
- Public Header (상단)
- TeacherSidebar (좌측)
  - Active menu: black pill style
  - Normal menu: icon + text

#### Page Title
`LMS 운영`

#### KPI Cards (4개, 1행)
1. **Active Students**: 12
2. **Active Classes**: 3
3. **Upcoming Sessions**: 8
4. **Task Completion**: 78%

#### View Tabs
- 대시보드 (active: black fill)
- 리스트
- 카드
- 캘린더

#### Class Progress Cards (그리드)
각 카드:
- 클래스명
- 담당강사
- 기간
- Progress bar (#3B82F6)
- Overall completion %
- 과제 추가 button

#### Card View (Scene 37)
3열 그리드:
- 수업/과제 카드
- 태그/버튼 조합

#### Calendar View (Scene 38)
- Monthly calendar
- 월간 캘린더 (2026.06)
- Today highlight (blue square)
- Event chips (light blue)
- Toolbar: 월 이동, 오늘, 보기 모드

### 구현 우선순위
⭐⭐⭐⭐ (높음)

---

## Selected Scene 5: Student Class Dashboard

**파일**: `/src/imports/selected_5.jpg`  
**Route**: `/student/classes/:classId`  
**Scene Ref**: Scene 28, 34, 41

### 구현 요소

#### Layout
- Public Header (상단)
- Student content area (중앙 정렬)

#### Class Header
- 클래스명: `입시반 · 연기1`
- Progress pill: `93%` (green, prominent)

#### KPI Cards (5개, 1행)
1. **총 세션**: 24
2. **완료 세션**: 22
3. **남은 세션**: 2
4. **제출 과제**: 18
5. **피드백**: 16

#### Main Content: 전체 과제 케어 작성
Form container (light blue background):
- Section Title: `전체 과제 케어 작성`
- Form fields:
  - 제목 (input)
  - 제출자 (readonly)
  - 기록 (large textarea)
  - 감정/평가 chips
- Footer: 저장 button (light blue, large)

#### Lower Section
- 과제 목록 / 피드백 리스트
- Card style layout

### 구현 우선순위
⭐⭐⭐⭐ (높음)

---

## 🎨 Common Design Patterns

### Cards
- Radius: 12-16px
- Border: 1px solid #E5E7EB
- Padding: 16-24px
- Hover: blue outline (only for editable)
- Shadow: minimal or none (only on modal/selected)

### Buttons
- Primary: Light blue (#DBEAFE) → Hover: #3B82F6 white text
- Secondary: White with border
- Size: Medium padding (px-5 py-2)
- Radius: rounded-lg or rounded-full

### Typography
- Korean: Pretendard Variable
- Heading: bold, 18-24px
- Body: regular, 14-16px
- Label: medium, 12-13px
- Metric: bold, 28-32px

### Colors
```css
--accent-blue: #3B82F6;
--accent-blue-soft: #DBEAFE;
--border-color: #E5E7EB;
--text-primary: #0A0A0A;
--text-muted: #6B7280;
```

---

## 🚀 Implementation Order

### Phase 1: Foundation (Week 1)
1. **AdminSidebar** component ⭐⭐⭐⭐⭐
2. **MetricCard** component ⭐⭐⭐⭐⭐
3. **ContentEditCard** component ⭐⭐⭐⭐⭐

### Phase 2: Admin Pages (Week 2)
4. **Admin Site Content Editor** (Selected Scene 2) ⭐⭐⭐⭐⭐
5. **Admin Program Management** (Selected Scene 3) ⭐⭐⭐⭐

### Phase 3: Director Dashboard (Week 3)
6. **Director Dashboard** (Selected Scene 1) ⭐⭐⭐⭐⭐

### Phase 4: Teacher/Student Portal (Week 4)
7. **Teacher LMS** (Selected Scene 4) ⭐⭐⭐⭐
8. **Student Class Dashboard** (Selected Scene 5) ⭐⭐⭐⭐

---

## 📝 Notes

- 모든 selected scene은 **우선 구현 대상**입니다.
- 각 scene의 상세한 요구사항은 `/docs/VIDEO3_UI_GUIDE.md`를 참조하세요.
- CSV index는 `/src/imports/cloud_acting_lab_video3_scene_capture_index.csv`에서 전체 scene 정보 확인 가능합니다.
- 실제 이미지는 `/src/imports/selected_1.jpg` ~ `selected_5.jpg`에 있습니다.

---

**Priority**: ⭐⭐⭐⭐⭐ (Critical)  
**Target**: Implement all 5 scenes within 4 weeks  
**Last Updated**: 2026-06-08
