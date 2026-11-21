# VIDEO3 Quick Start Guide

> **빠르게 VIDEO3 UI 구현을 시작하기 위한 가이드**  
> **Last Updated**: 2026-06-08

---

## 🎯 Overview

VIDEO3 가이드(화면 기록 2026-06-08 오후 3.34.33.mov)를 기반으로 ARTHEUS의 전체 UI 시스템을 구현합니다.

### 📚 필수 문서

1. **[VIDEO3_UI_GUIDE.md](./VIDEO3_UI_GUIDE.md)** - 전체 49 scene 분석 및 컴포넌트 스펙
2. **[VIDEO3_IMPLEMENTATION_STATUS.md](./VIDEO3_IMPLEMENTATION_STATUS.md)** - 현재 구현 상태 및 진행률
3. **[VIDEO3_SELECTED_SCENES.md](./VIDEO3_SELECTED_SCENES.md)** - 우선 구현 5개 scene 상세

---

## 🚀 빠른 시작

### 1️⃣ 프로젝트 설정 확인

```bash
# 의존성 설치
pnpm install

# 개발 서버 시작
pnpm dev

# 브라우저에서 확인
open http://localhost:8080
```

### 2️⃣ 이미지 파일 복사

```bash
# macOS / Linux
cp src/imports/favicon.png public/favicon.png
cp src/imports/icon-192.png public/icon-192.png
cp src/imports/icon-512.png public/icon-512.png
cp src/imports/cloud-lab-logo.png public/cloud-lab-logo.png

# Windows (PowerShell)
Copy-Item src/imports/favicon.png public/favicon.png
Copy-Item src/imports/icon-192.png public/icon-192.png
Copy-Item src/imports/icon-512.png public/icon-512.png
Copy-Item src/imports/cloud-lab-logo.png public/cloud-lab-logo.png
```

### 3️⃣ VIDEO3 참조 이미지 확인

5개의 핵심 scene 스크린샷 확인:

```bash
# macOS
open src/imports/selected_1.jpg  # Director Dashboard
open src/imports/selected_2.jpg  # Admin Site Content Editor
open src/imports/selected_3.jpg  # Admin Program Management
open src/imports/selected_4.jpg  # Teacher LMS Operating
open src/imports/selected_5.jpg  # Student Class Dashboard
```

---

## 🎨 핵심 디자인 시스템

### 컬러 팔레트

```css
/* Background & Surfaces */
--bg-primary: #FFFFFF;
--header-gradient-start: #EAF5FF;
--header-gradient-end: #FFFFFF;

/* Borders */
--border-color: #E5E7EB;

/* Text */
--text-primary: #0A0A0A;
--text-muted: #6B7280;

/* Accent */
--accent-blue: #3B82F6;
--accent-blue-soft: #DBEAFE;
--accent-blue-light: #EAF5FF;

/* Status */
--error-bg: #FFF1F2;
--success-bg: #DBEAFE;
```

### 레이아웃 사이즈

```css
--desktop-width: 1440px–1600px;
--admin-sidebar-width: 260px–280px;
--public-header-height: 68px;
--card-radius: 12px–16px;
--border-width: 1px;
--right-drawer-width: 360px–420px;
```

### 타이포그래피

- **Korean**: Pretendard Variable
- **Numerals**: Inter-like sans-serif
- **Heading**: 18-24px, bold
- **Body**: 14-16px, regular
- **Label**: 12-13px, medium
- **Metric**: 28-32px, bold

---

## 🧩 우선 구현 컴포넌트 (Phase 1)

### 1. AdminSidebar

```tsx
// /src/app/components/AdminSidebar.tsx

interface AdminSidebarProps {
  activeSection?: string;
  activeMenu?: string;
}

export function AdminSidebar({ activeSection, activeMenu }: AdminSidebarProps) {
  // Fixed left sidebar (260-280px)
  // Logo: ARTHEUS / ADMIN PANEL
  // Sections: OVERVIEW, CONTENT, OPERATIONS, CRM, SYSTEM
  // Menus with icons
  // Bottom: 로그아웃
}
```

**참조**: Scene 04, 05, 06, 13

### 2. MetricCard

```tsx
// /src/app/components/MetricCard.tsx

interface MetricCardProps {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

export function MetricCard({ label, value, icon, variant }: MetricCardProps) {
  // Label: 12-13px
  // Number: 28-32px
  // Icon: top-right corner
  // Border: #E5E7EB
}
```

**참조**: Scene 01, 18, 26, 28, 30, 34, 36

### 3. ContentEditCard

```tsx
// /src/app/components/ContentEditCard.tsx

interface ContentEditCardProps {
  label: string; // Blue uppercase
  title: string;
  content?: string;
  onEdit: () => void;
}

export function ContentEditCard({ label, title, content, onEdit }: ContentEditCardProps) {
  // Blue uppercase label
  // Title: bold
  // Hover: blue outline + 수정하기 button
  // Selected: blue outline
}
```

**참조**: Scene 04, 05, 07

---

## 📄 우선 구현 페이지 (Phase 1)

### 1. Director Dashboard

**Route**: `/director/dashboard`  
**Priority**: ⭐⭐⭐⭐⭐

```tsx
// /src/app/pages/DirectorDashboard.tsx

export function DirectorDashboard() {
  return (
    <>
      <PublicHeader />
      <div className="dashboard-container">
        {/* Header */}
        <h1>배준우 디렉터 대시보드</h1>
        <div className="action-buttons">
          <button>CMS 관리</button>
          <button>코치 콘솔 · LMS</button>
          <button>강사 대시보드</button>
          <button>LOGOUT</button>
        </div>

        {/* KPI Cards */}
        <div className="kpi-grid">
          <MetricCard label="활성 클래스" value="9/9" variant="success" />
          <MetricCard label="가입 학생" value={3} />
          <MetricCard label="활동 강사" value={6} />
          <MetricCard label="누적 세션" value={32} />
          <MetricCard label="신규 상담" value={1} variant="warning" />
          <MetricCard label="과제 지연" value={4} variant="error" />
        </div>

        {/* Main Table */}
        <ProgressTable title="전체 클래스 운영 현황" data={classes} />

        {/* Right Sidebar */}
        <div className="right-sidebar">
          <SidePanel title="최근 상담" data={counseling} />
          <SidePanel title="최근 제출물" data={submissions} />
          <SidePanel title="공지사항" data={notices} />
        </div>

        {/* Lower Analytics */}
        <div className="lower-analytics">
          <Table title="강사별 진도 현황" data={teacherProgress} />
          <Table title="과제 지연 현황" data={delayedTasks} />
          <MetricCards title="플랫폼 지표" data={platformMetrics} />
        </div>
      </div>
    </>
  );
}
```

**참조 이미지**: `/src/imports/selected_1.jpg`

### 2. Admin Site Content Editor - Home

**Route**: `/admin/site-content/home`  
**Priority**: ⭐⭐⭐⭐⭐

```tsx
// /src/app/pages/admin/SiteContentHome.tsx

export function AdminSiteContentHome() {
  return (
    <div className="admin-layout">
      <AdminSidebar activeSection="CONTENT" activeMenu="사이트 콘텐츠" />
      
      <main className="admin-content">
        <h1>사이트 콘텐츠 관리 — 홈</h1>

        <div className="content-cards">
          <ContentEditCard
            label="HERO_KEYWORDS"
            title="Hero 키워드"
            onEdit={() => openModal('keywords')}
          />
          <ContentEditCard
            label="HERO_TITLE"
            title="Hero 메인 타이틀"
            content="THE WAY GOOD CLOUD LAB."
            onEdit={() => openModal('title')}
          />
          <ContentEditCard
            label="HERO_SLOGAN"
            title="Hero 슬로건"
            content="ALWAYS BREATH _ FOR MIND"
            onEdit={() => openModal('slogan')}
          />
          <ContentEditCard
            label="HERO_CTA"
            title="CTA 버튼"
            content="클래스, LAB 둘러보기"
            onEdit={() => openModal('cta')}
          />
          <ContentEditCard
            label="THEME"
            title="테마 설정"
            onEdit={() => openModal('theme')}
          />
        </div>
      </main>
    </div>
  );
}
```

**참조 이미지**: `/src/imports/selected_2.jpg`

---

## 📊 구현 로드맵

### Week 1: Foundation Components
- [ ] `AdminSidebar` 컴포넌트 ⭐⭐⭐⭐⭐
- [ ] `MetricCard` 컴포넌트 ⭐⭐⭐⭐⭐
- [ ] `ContentEditCard` 컴포넌트 ⭐⭐⭐⭐⭐
- [ ] `ModalShell` 컴포넌트 ⭐⭐⭐⭐

### Week 2: Admin Pages
- [ ] Admin Site Content Editor - Home ⭐⭐⭐⭐⭐
- [ ] Admin Site Content Editor - Programs ⭐⭐⭐⭐
- [ ] Admin Site Content Editor - Contact ⭐⭐⭐
- [ ] Admin Program Management ⭐⭐⭐⭐

### Week 3: Director Dashboard
- [ ] Director Dashboard ⭐⭐⭐⭐⭐
- [ ] `ProgressTable` 컴포넌트 ⭐⭐⭐⭐
- [ ] `SidePanel` 컴포넌트 ⭐⭐⭐

### Week 4: Teacher/Student Portal
- [ ] `TeacherSidebar` 컴포넌트 ⭐⭐⭐⭐
- [ ] Teacher LMS Operating ⭐⭐⭐⭐
- [ ] `CalendarMonth` 컴포넌트 ⭐⭐⭐⭐
- [ ] Student Class Dashboard ⭐⭐⭐⭐

---

## 🎯 체크리스트

### 개발 환경
- [x] Node.js 18+ 설치
- [x] pnpm 설치
- [x] 의존성 설치 완료
- [ ] 이미지 파일 복사 완료
- [x] 개발 서버 정상 작동

### 문서 확인
- [x] VIDEO3_UI_GUIDE.md 읽기
- [ ] VIDEO3_SELECTED_SCENES.md 읽기
- [ ] selected_1.jpg ~ selected_5.jpg 확인

### 컴포넌트 구현
- [ ] AdminSidebar 완성
- [ ] MetricCard 완성
- [ ] ContentEditCard 완성
- [ ] ModalShell 완성
- [ ] ProgressTable 완성

### 페이지 구현
- [ ] Director Dashboard 완성
- [ ] Admin Site Content Home 완성
- [ ] Admin Program Management 완성
- [ ] Teacher LMS 완성
- [ ] Student Class Dashboard 완성

---

## 💡 팁 & 베스트 프랙티스

### 1. 컴포넌트 재사용
동일한 디자인 패턴은 반드시 컴포넌트로 분리하여 재사용합니다.

```tsx
// ✅ Good
<MetricCard label="활성 클래스" value={9} />
<MetricCard label="가입 학생" value={3} />

// ❌ Bad - 반복 코드
<div className="metric-card">...</div>
<div className="metric-card">...</div>
```

### 2. VIDEO3 가이드 준수
모든 UI 요소는 VIDEO3 가이드의 스펙을 정확히 따릅니다.

- Border: 1px solid #E5E7EB
- Radius: 12-16px
- Spacing: 넉넉한 여백
- Colors: 정확한 브랜드 컬러

### 3. 반응형 디자인
Desktop-first이지만 Tablet까지 반응형을 고려합니다.

```css
/* Desktop: 1440-1600px */
/* Tablet: 768-1024px */
/* Mobile: Optional (not in VIDEO3) */
```

### 4. 상태 관리
Loading, Empty, Error 상태를 반드시 구현합니다.

```tsx
{loading && <LoadingState />}
{!loading && data.length === 0 && <EmptyState />}
{error && <AlertStack type="error" message={error} />}
```

---

## 📞 도움말

### Q: VIDEO3 가이드의 route와 실제 URL이 다른가요?
A: 영상에 주소창이 보이지 않으므로, 가이드의 route는 **권장 경로**입니다. 프로젝트에 맞게 조정 가능합니다.

### Q: 모든 49 scene을 구현해야 하나요?
A: 아니요. **우선 구현 5개 scene** (selected_1.jpg ~ selected_5.jpg)부터 시작하세요.

### Q: 디자인이 완벽히 일치해야 하나요?
A: 핵심 레이아웃과 컬러는 일치해야 하지만, 세부 spacing은 조정 가능합니다.

### Q: Supabase 백엔드는 언제 연동하나요?
A: UI 구현 완료 후 Phase 2에서 진행합니다.

---

## 🔗 관련 링크

- [VIDEO3_UI_GUIDE.md](./VIDEO3_UI_GUIDE.md) - 전체 가이드
- [VIDEO3_IMPLEMENTATION_STATUS.md](./VIDEO3_IMPLEMENTATION_STATUS.md) - 구현 현황
- [VIDEO3_SELECTED_SCENES.md](./VIDEO3_SELECTED_SCENES.md) - 우선 구현 가이드
- [PROJECT_STRUCTURE.md](../PROJECT_STRUCTURE.md) - 프로젝트 구조
- [CHANGELOG.md](../CHANGELOG.md) - 변경 이력

---

**Ready to start?** 🚀  
**Begin with**: Director Dashboard (selected_1.jpg)  
**Last Updated**: 2026-06-08
