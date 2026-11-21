# ARTHEUS — Documentation Index

> **프로젝트 전체 문서 통합 인덱스**  
> **Last Updated**: 2026-06-08

---

## 📚 문서 구조

ARTHEUS 프로젝트는 다음과 같이 체계적으로 문서화되어 있습니다.

```
📁 /
├── README.md                    # 프로젝트 메인 개요
├── SETUP.md                     # 빠른 시작 가이드
├── CHANGELOG.md                 # 변경 이력
├── PROJECT_STRUCTURE.md         # 프로젝트 구조
│
└── 📁 /docs/
    ├── INDEX.md                 # 이 파일 - 문서 인덱스
    │
    ├── 🎬 VIDEO3 UI Implementation
    │   ├── VIDEO3_UI_GUIDE.md              # 전체 49 scene 분석
    │   ├── VIDEO3_IMPLEMENTATION_STATUS.md # 구현 현황 추적
    │   ├── VIDEO3_SELECTED_SCENES.md       # 우선 구현 5개 scene
    │   └── VIDEO3_QUICK_START.md           # 빠른 시작 가이드
    │
    ├── 🏗️ Architecture & Backend
    │   ├── BACKEND_ARCHITECTURE.md         # Supabase 백엔드 구조
    │   └── ROUTES_REFERENCE.md             # 전체 라우트 레퍼런스
    │
    └── 🎨 Design & Frontend
        └── DESIGN_SYSTEM.md                # 디자인 시스템 전체
```

---

## 🎯 문서별 용도

### 1. 시작하기

| 문서 | 용도 | 독자 |
|------|------|------|
| [README.md](../README.md) | 프로젝트 전체 개요 | 모든 사람 |
| [SETUP.md](../SETUP.md) | 개발 환경 설정 | 개발자 |
| [VIDEO3_QUICK_START.md](./VIDEO3_QUICK_START.md) | VIDEO3 UI 빠른 시작 | 프론트엔드 개발자 |

### 2. 프로젝트 이해

| 문서 | 용도 | 독자 |
|------|------|------|
| [PROJECT_STRUCTURE.md](../PROJECT_STRUCTURE.md) | 파일 구조 및 디렉토리 설명 | 개발자 |
| [CHANGELOG.md](../CHANGELOG.md) | 변경 이력 추적 | 모든 사람 |

### 3. VIDEO3 UI 구현

| 문서 | 용도 | 독자 |
|------|------|------|
| [VIDEO3_UI_GUIDE.md](./VIDEO3_UI_GUIDE.md) | 전체 49 scene 상세 분석 | UI/UX 개발자 |
| [VIDEO3_IMPLEMENTATION_STATUS.md](./VIDEO3_IMPLEMENTATION_STATUS.md) | 구현 진행률 및 체크리스트 | PM, 개발자 |
| [VIDEO3_SELECTED_SCENES.md](./VIDEO3_SELECTED_SCENES.md) | 우선 구현 5개 scene 가이드 | 프론트엔드 개발자 |
| [VIDEO3_QUICK_START.md](./VIDEO3_QUICK_START.md) | VIDEO3 빠른 시작 | 프론트엔드 개발자 |

### 4. 백엔드 & 아키텍처

| 문서 | 용도 | 독자 |
|------|------|------|
| [BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md) | Supabase 백엔드 전체 구조 | 백엔드 개발자 |
| [ROUTES_REFERENCE.md](./ROUTES_REFERENCE.md) | 모든 라우트 및 권한 매핑 | 풀스택 개발자 |

### 5. 디자인 시스템

| 문서 | 용도 | 독자 |
|------|------|------|
| [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) | 컬러, 타이포, 컴포넌트 전체 | 프론트엔드, 디자이너 |

---

## 📖 원본 소스 문서 (`/src/imports/`)

프로젝트 초기 기획 및 상세 요구사항은 다음 원본 문서에서 확인할 수 있습니다:

| 문서 | 내용 | 통합 문서 |
|------|------|-----------|
| `PRD.md` | Product Requirements Document | [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) |
| `SUPABASE.md` | Supabase 백엔드 상세 | [BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md) |
| `UI_ROUTES.md` | 전체 라우트 및 화면 | [ROUTES_REFERENCE.md](./ROUTES_REFERENCE.md) |
| `COACH_SAVE_RELIABILITY.md` | 저장 신뢰성 가이드 | [BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md) |
| `plan.md` | 모바일 UI 톤 통일 | [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) |
| `README-1.md` | Lovable 프로젝트 설명 | [README.md](../README.md) |
| `cloud_acting_lab_video3_figma_make_prompt.md` | VIDEO3 프롬프트 | [VIDEO3_UI_GUIDE.md](./VIDEO3_UI_GUIDE.md) |
| `cloud_acting_lab_video3_scene_capture_index.csv` | VIDEO3 scene 인덱스 | [VIDEO3_UI_GUIDE.md](./VIDEO3_UI_GUIDE.md) |

---

## 🎯 역할별 추천 독서 경로

### 🆕 신규 팀원 (첫 방문)

1. [README.md](../README.md) - 프로젝트 전체 파악
2. [SETUP.md](../SETUP.md) - 개발 환경 세팅
3. [PROJECT_STRUCTURE.md](../PROJECT_STRUCTURE.md) - 파일 구조 이해
4. [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) - 디자인 언어 학습

### 🎨 프론트엔드 개발자

1. [VIDEO3_QUICK_START.md](./VIDEO3_QUICK_START.md) - 빠른 시작
2. [VIDEO3_SELECTED_SCENES.md](./VIDEO3_SELECTED_SCENES.md) - 우선 구현 가이드
3. [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) - 디자인 토큰 및 컴포넌트
4. [ROUTES_REFERENCE.md](./ROUTES_REFERENCE.md) - 라우트 구조
5. [VIDEO3_UI_GUIDE.md](./VIDEO3_UI_GUIDE.md) - 전체 scene 참조

### 🔧 백엔드 개발자

1. [BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md) - Supabase 구조
2. [ROUTES_REFERENCE.md](./ROUTES_REFERENCE.md) - API 엔드포인트 이해
3. `/src/imports/SUPABASE.md` - 원본 상세 스펙

### 📱 풀스택 개발자

1. [VIDEO3_QUICK_START.md](./VIDEO3_QUICK_START.md) - UI 빠른 시작
2. [BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md) - 백엔드 이해
3. [ROUTES_REFERENCE.md](./ROUTES_REFERENCE.md) - 전체 라우트 매핑
4. [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) - UI 규칙

### 🎯 PM / 기획자

1. [README.md](../README.md) - 프로젝트 개요
2. [VIDEO3_IMPLEMENTATION_STATUS.md](./VIDEO3_IMPLEMENTATION_STATUS.md) - 진행 현황
3. [ROUTES_REFERENCE.md](./ROUTES_REFERENCE.md) - 기능 및 화면 구조
4. `/src/imports/PRD.md` - 원본 제품 요구사항

### 🎨 UI/UX 디자이너

1. [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) - 디자인 시스템 전체
2. [VIDEO3_UI_GUIDE.md](./VIDEO3_UI_GUIDE.md) - UI 컴포넌트 스펙
3. [VIDEO3_SELECTED_SCENES.md](./VIDEO3_SELECTED_SCENES.md) - 레퍼런스 이미지

---

## 🔍 주제별 문서 찾기

### 인증 & 권한

- [BACKEND_ARCHITECTURE.md § 1. 인증](./BACKEND_ARCHITECTURE.md#1-인증-authentication)
- [ROUTES_REFERENCE.md § 9. 권한 매트릭스](./ROUTES_REFERENCE.md#9-라우트--권한-매트릭스)

### 데이터베이스 스키마

- [BACKEND_ARCHITECTURE.md § 2. 데이터베이스 구조](./BACKEND_ARCHITECTURE.md#2-데이터베이스-구조-public-schema)
- `/src/imports/SUPABASE.md`

### RLS (Row Level Security)

- [BACKEND_ARCHITECTURE.md § 3. RLS 정책](./BACKEND_ARCHITECTURE.md#3-rls-row-level-security-정책)

### Edge Functions

- [BACKEND_ARCHITECTURE.md § 6. Edge Functions](./BACKEND_ARCHITECTURE.md#6-edge-functions-supabasefunctions)

### 저장 신뢰성 (Coach Save)

- [BACKEND_ARCHITECTURE.md § 9. 저장 신뢰성](./BACKEND_ARCHITECTURE.md#9-저장-신뢰성-coach-save-reliability)
- `/src/imports/COACH_SAVE_RELIABILITY.md`

### 컬러 팔레트

- [DESIGN_SYSTEM.md § 1. Color Palette](./DESIGN_SYSTEM.md#1-color-palette)

### 타이포그래피

- [DESIGN_SYSTEM.md § 2. Typography](./DESIGN_SYSTEM.md#2-typography)

### 컴포넌트 스펙

- [DESIGN_SYSTEM.md § 4. UI Components](./DESIGN_SYSTEM.md#4-ui-components)
- [VIDEO3_UI_GUIDE.md § Core Components](./VIDEO3_UI_GUIDE.md#🧩-core-components)
- [VIDEO3_SELECTED_SCENES.md § Common Design Patterns](./VIDEO3_SELECTED_SCENES.md#🎨-common-design-patterns)

### 모션 & 애니메이션

- [DESIGN_SYSTEM.md § 5. 모션 & 애니메이션](./DESIGN_SYSTEM.md#5-모션--애니메이션)
- [ROUTES_REFERENCE.md § 10. 모션 규칙](./ROUTES_REFERENCE.md#10-모션--인터랙션-규칙)

### 모바일 UI

- [DESIGN_SYSTEM.md § 8. 모바일 UI 톤](./DESIGN_SYSTEM.md#10-모바일-ui-톤-차콜--블루)
- `/src/imports/plan.md`

### 라우트 권한

- [ROUTES_REFERENCE.md § 9. 권한 매트릭스](./ROUTES_REFERENCE.md#9-라우트--권한-매트릭스)

### VIDEO3 구현 우선순위

- [VIDEO3_IMPLEMENTATION_STATUS.md § 구현 로드맵](./VIDEO3_IMPLEMENTATION_STATUS.md#📊-구현-로드맵)
- [VIDEO3_SELECTED_SCENES.md § Implementation Order](./VIDEO3_SELECTED_SCENES.md#🚀-implementation-order)

---

## 📅 문서 업데이트 이력

| 날짜 | 문서 | 변경 내용 |
|------|------|-----------|
| 2026-06-08 | 전체 | VIDEO3 가이드 통합, 백엔드/라우트/디자인 문서 생성 |
| 2026-06-05 | VIDEO3_UI_GUIDE.md | 49 scene 분석 완료 |
| 2026-06-01 | PRD.md, SUPABASE.md | 초기 기획 문서 작성 |

---

## 🆘 도움말

### 문서를 찾을 수 없나요?

1. 이 INDEX.md에서 Ctrl+F로 키워드 검색
2. 각 문서의 목차(TOC) 활용
3. `/src/imports/` 디렉토리의 원본 문서 확인

### 문서가 최신이 아닌가요?

- [CHANGELOG.md](../CHANGELOG.md)에서 최근 변경사항 확인
- 각 문서 하단의 "Last Updated" 날짜 확인

### 새 문서를 추가하고 싶나요?

1. `/docs/` 디렉토리에 `.md` 파일 생성
2. 이 `INDEX.md`에 링크 추가
3. `CHANGELOG.md`에 변경 이력 기록

---

## 📞 문의

- **프로젝트**: ARTHEUS
- **Website**: https://www.c-art.co.kr
- **문서 관리자**: Development Team

---

**Last Updated**: 2026-06-08  
**Version**: 1.0.0
