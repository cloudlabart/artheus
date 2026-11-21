# ARTHEUS — Design System

> **Based on**: PRD.md, plan.md  
> **Theme**: Classy / Urban / Spatial / Quiet Luxury  
> **Last Updated**: 2026-06-08

---

## 🎨 Design Philosophy

**브랜드 톤**: Classy / Urban / Spatial / Quiet Luxury  
**금지 요소**: 네온·웜오렌지  
**핵심 컨셉**: 글래스모피즘 + 소프트 포그 spatial gradient

---

## 1. Color Palette

### 1.1 Primary Colors

| 토큰 | HSL | HEX | 용도 |
|------|-----|-----|------|
| **Ivory Mist** (Background) | `30 50% 99%` | `#F6F3EE` | 본문 배경 |
| **Charcoal Black** (Foreground) | `0 0% 4%` | `#050506` | 텍스트·다크 패널 |
| **Cloud Blue** (Primary) | `217 91% 60%` | `#3F7DF5` | 액센트·CTA |
| **Glass Blue** (Accent) | `220 27% 93%` | `#DCE8FF` | 글래스모피즘 표면 |
| **Mist White** | `43 14% 90%` | `#E5E5E1` | 무드 표면 |

### 1.2 VIDEO3 Extended Colors

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

### 1.3 배경 시스템

**글래스모피즘 + 소프트 포그 spatial gradient**:

```css
body {
  background: fixed 
    radial-gradient(circle at 30% 20%, rgba(220, 232, 255, 0.3), transparent 50%),
    radial-gradient(circle at 70% 80%, rgba(229, 229, 225, 0.4), transparent 50%),
    linear-gradient(180deg, #F6F3EE 0%, #FDFCFA 100%);
}
```

---

## 2. Typography

### 2.1 폰트 패밀리

| 폰트 | 용도 | Weight | 특징 |
|------|------|--------|------|
| **DM Sans Black** | 헤딩 | 900 | 히어로는 `.text-3d` 적용 |
| **IBM Plex Sans KR** | 본문/한글 | 400, 500, 700 | 가독성 우선 |
| **Instrument Serif** | 에디토리얼 액센트 | 400, 600 | 인덱스 번호, 큰 숫자 |
| **Gmarket Sans** | 내비게이션 카테고리 | 500, 700 | 한글 강조 |
| **Pretendard Variable** | VIDEO3 (한글) | 400-700 | 깔끔한 SaaS 스타일 |
| **Inter** | VIDEO3 (숫자) | 400-700 | 메트릭 숫자용 |

### 2.2 타이포그래피 스케일

```css
/* Heading */
.text-hero {
  font-size: 4.3em;        /* 68.8px */
  font-family: 'DM Sans Black';
  line-height: 1.1;
}

.text-3d {
  text-shadow: 
    2px 2px 4px rgba(0, 0, 0, 0.1),
    4px 4px 8px rgba(0, 0, 0, 0.05);
}

/* Heading */
.text-heading-1 { font-size: 2.5rem; }   /* 40px */
.text-heading-2 { font-size: 2rem; }     /* 32px */
.text-heading-3 { font-size: 1.5rem; }   /* 24px */

/* Body */
.text-body-lg { font-size: 1.125rem; }   /* 18px */
.text-body { font-size: 1rem; }          /* 16px */
.text-body-sm { font-size: 0.875rem; }   /* 14px */

/* Label */
.text-label { font-size: 0.75rem; }      /* 12px */
.text-label-xs { font-size: 0.6875rem; } /* 11px */

/* Metric (VIDEO3) */
.text-metric {
  font-size: 1.75rem;      /* 28px */
  font-weight: 700;
  font-family: 'Inter', 'Instrument Serif';
}
.text-metric-lg {
  font-size: 2rem;         /* 32px */
}
```

---

## 3. Layout & Spacing

### 3.1 레이아웃 사이즈

```css
/* Desktop */
--desktop-width: 1440px - 1600px;
--admin-sidebar-width: 260px - 280px;
--public-header-height: 68px;
--right-drawer-width: 360px - 420px;

/* Card */
--card-radius: 12px - 16px;
--card-radius-sharp: 2px;     /* 에디토리얼 프레스 스타일 */

/* Border */
--border-width: 1px;
```

### 3.2 Spacing Scale

```css
/* Tailwind 기본 스케일 사용 */
.space-xs { margin: 0.25rem; }   /* 4px */
.space-sm { margin: 0.5rem; }    /* 8px */
.space-md { margin: 1rem; }      /* 16px */
.space-lg { margin: 1.5rem; }    /* 24px */
.space-xl { margin: 2rem; }      /* 32px */
.space-2xl { margin: 3rem; }     /* 48px */
.space-3xl { margin: 4rem; }     /* 64px */

/* 넉넉한 수직 여백 (VIDEO3) */
.section-spacing {
  padding-top: 3rem;    /* 48px */
  padding-bottom: 3rem; /* 48px */
}
```

---

## 4. UI Components

### 4.1 버튼

```css
/* Sharp Button (에디토리얼) */
.btn-sharp {
  border-radius: 2px;
  border: 1px solid var(--border-color);
  padding: 0.5rem 1.5rem;
}

/* Glass Button */
.btn-glass {
  background: rgba(220, 232, 255, 0.15);
  backdrop-filter: blur(12px);
  border-radius: 2px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

/* Cloud Blue CTA */
.btn-primary {
  background: var(--accent-blue);
  color: white;
  border-radius: 2px;
  padding: 0.75rem 2rem;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.btn-primary:hover {
  background: hsl(217, 91%, 55%);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(63, 125, 245, 0.3);
}
```

### 4.2 카드

```css
/* 에디토리얼 프레스 카드 */
.card-editorial {
  background: white;
  border-radius: 2px;
  border: 1px solid var(--border-color);
  padding: 1.5rem;
  position: relative;
}

/* 카드 인덱스 번호 (상단) */
.card-editorial::before {
  content: attr(data-index);
  position: absolute;
  top: -1px;
  left: 1rem;
  font-family: 'Instrument Serif';
  font-size: 0.75rem;
  color: var(--accent-blue);
  background: white;
  padding: 0 0.5rem;
}

/* Glass Panel */
.glass-panel {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.glass-panel-strong {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(40px);
}

/* VIDEO3 Card */
.card-video3 {
  background: white;
  border-radius: 12px;
  border: 1px solid #E5E7EB;
  padding: 1rem 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}
```

### 4.3 모바일 컴포넌트 (plan.md)

```css
/* 모바일 Surface (차콜 솔리드) */
.m-surface {
  background: var(--foreground);
  color: var(--background);
  border-radius: 2px;
  border: 1px solid var(--accent-blue);
}

/* 모바일 Chip */
.m-chip {
  background: var(--foreground);
  color: var(--accent-blue);
  font-size: 0.5rem;
  letter-spacing: 0.18em;
  padding: 0.25rem 0.5rem;
  border-radius: 2px;
}

/* 모바일 Divider */
.m-divider {
  border-bottom: 1px solid rgba(var(--foreground-rgb), 0.15);
}

/* 모바일 Accent */
.m-accent {
  color: var(--accent-blue);
}

/* 모바일 Stat Number */
.m-stat-num {
  font-family: 'Instrument Serif';
  font-size: 2rem;
  color: var(--accent-blue);
  text-shadow: 0 0 20px rgba(63, 125, 245, 0.5);
}
```

---

## 5. 모션 & 애니메이션

### 5.1 이징 함수

```css
/* Expo Out (기본) */
--ease-expo-out: cubic-bezier(0.16, 1, 0.3, 1);

/* Smooth */
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
```

### 5.2 페이지 전환

```tsx
// framer-motion AnimatePresence
<AnimatePresence mode="wait">
  <motion.div
    key={location.pathname}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ 
      duration: 0.3, 
      ease: [0.16, 1, 0.3, 1] 
    }}
  >
    {children}
  </motion.div>
</AnimatePresence>
```

### 5.3 Hero 애니메이션

- **3D Tilt 타이틀**: Three.js/R3F
- **4.3em 롤링 키워드**: Framer Motion
- **Preloader**: Dot → Logo → Slogan, 위로 슬라이드 업

### 5.4 인터랙션

```css
/* 카드 호버 (6-step invert) */
.card-invert:hover {
  background: var(--foreground);
  color: var(--background);
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  transition: all 0.4s var(--ease-expo-out);
}

/* 마퀴 네온 글로우 */
.marquee-neon {
  color: var(--accent-blue);
  text-shadow: 
    0 0 10px rgba(63, 125, 245, 0.6),
    0 0 20px rgba(63, 125, 245, 0.4),
    0 0 30px rgba(63, 125, 245, 0.2);
}
```

---

## 6. Vision Motion Language

**From**: `src/lib/vision-motion.ts`

```typescript
// Blur-emerge effect
const blurEmerge = {
  initial: { opacity: 0, filter: 'blur(20px)' },
  animate: { 
    opacity: 1, 
    filter: 'blur(0px)',
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
  }
};

// Glow orb effect
const glowOrb = {
  animate: {
    scale: [1, 1.2, 1],
    opacity: [0.5, 0.8, 0.5],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};
```

---

## 7. Lumos Cursor

**캔버스 라디얼 네온 글로우 커서** (z-index: 9999)

```typescript
// CursorDebug component
const cursor = {
  x: mousePosition.x,
  y: mousePosition.y,
  gradient: `radial-gradient(
    circle 200px at ${mousePosition.x}px ${mousePosition.y}px,
    rgba(63, 125, 245, 0.3),
    transparent
  )`
};
```

---

## 8. 유틸리티 클래스

### 8.1 배경

```css
.bg-soft-fog {
  background: linear-gradient(
    180deg,
    rgba(246, 243, 238, 0.95) 0%,
    rgba(253, 252, 250, 0.98) 100%
  );
}

.bg-spatial {
  background: 
    radial-gradient(circle at 30% 20%, rgba(220, 232, 255, 0.3), transparent 50%),
    radial-gradient(circle at 70% 80%, rgba(229, 229, 225, 0.4), transparent 50%);
}

.grid-overlay {
  background-image: 
    linear-gradient(rgba(0, 0, 0, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 0, 0.02) 1px, transparent 1px);
  background-size: 20px 20px;
}
```

### 8.2 텍스트

```css
.text-3d {
  text-shadow: 
    2px 2px 4px rgba(0, 0, 0, 0.1),
    4px 4px 8px rgba(0, 0, 0, 0.05);
}

.text-cloud-blue {
  color: var(--accent-blue);
}

.text-charcoal {
  color: var(--foreground);
}
```

---

## 9. Responsive Breakpoints

```css
/* Tailwind 기본 브레이크포인트 */
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px

/* 모바일 우선 규칙 (plan.md) */
/* 320×568 (소형) */
/* 375×812 (iPhone Mini) */
/* 390×844 (iPhone) */
/* 414×896 (Plus) */
/* 768×1024 (태블릿 경계) */
```

---

## 10. 모바일 UI 톤 (차콜 × 블루)

> **From**: plan.md

### 디자인 원칙

1. **배경(Ivory Mist)과의 대비를 강하게**: 차콜 솔리드 패널 사용
2. **정보 위계 분명**: Cloud Blue로 액센트 강조
3. **모던 톤**: 글래스 → 솔리드 전환으로 선명함 확보

### 주요 컴포넌트

- **MobileQuickDock**: 하단 차콜 도크, 4 아이콘 (상담/카톡/Insta/YT)
- **Navbar (모바일)**: 차콜 솔리드 (`bg-foreground/95 backdrop-blur`)
- **Hero CTA (모바일)**: 차콜 솔리드 + Cloud Blue 액센트
- **GalleryCard (모바일)**: 이미지 하단 차콜 인포 바
- **Footer (모바일)**: 2×2 차콜 솔리드 그리드

---

## 11. 비변경 영역

⚠️ **데스크톱(md 이상) UI는 손대지 않음**  
⚠️ **비즈니스 로직, Supabase 스키마, 라우팅, 메모리 룰 유지**

---

## 📚 참조 문서

- [PRD.md](/src/imports/PRD.md) - 제품 요구사항 문서
- [plan.md](/src/imports/plan.md) - 모바일 UI 톤 통일 가이드
- [VIDEO3_UI_GUIDE.md](/docs/VIDEO3_UI_GUIDE.md) - VIDEO3 디자인 시스템
- [VIDEO3_SELECTED_SCENES.md](/docs/VIDEO3_SELECTED_SCENES.md) - 컴포넌트 디자인 패턴

---

**Last Updated**: 2026-06-08  
**Version**: 1.0.0
