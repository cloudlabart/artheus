# 아터스 스튜디오 · artheus 웹

> 페이지 디자인(바이브 코딩)과 칼럼(GEO·SEO 콘텐츠)을 한 곳에서 만드는 작업실입니다.
> `npm run dev` → http://localhost:5173/__studio → 위쪽 **[페이지 | 칼럼]** 탭.

## 칼럼 탭
- **+ 새 칼럼**: 키워드(와 메모)를 넣으면 리서치 → 원고 → 검수 → 미리보기까지 진행합니다. 10–20분.
- **CSV / 주제 추천**: Search Console › 실적 › 내보내기 CSV를 올리면 실제 검색 데이터로 주제를 추천합니다.
- **칼럼 선택 → 채팅**: "도입부를 바꿔줘"처럼 말하면 그 칼럼을 고치고 미리보기를 다시 만듭니다.
- **미리보기**: 오른쪽 화면이 실제 발행될 `/column/<slug>/` 페이지입니다. 데스크톱·모바일 버튼으로 확인합니다.
- **네이버용 열기**: 네이버 블로그에 붙여넣을 제목·본문·태그 복사 페이지.
- **발행**: 검수 통과 · 채울 자리 없음 · 저자 있음일 때만 됩니다. `public/column/`·사이트맵·RSS를 만들고 GitHub에 올리면 Vercel이 배포합니다.
- 칼럼 작업에는 Python 3이 필요합니다(Mac은 기본 설치. `python3 --version`으로 확인).

## 서버 정기 SEO (GitHub Actions)
스튜디오를 켜지 않아도 GitHub에서 자동으로 돌아갑니다. 결과는 저장소의 **Issues › SEO 주간 리포트**에 쌓이고, 스튜디오 칼럼 탭의 **SEO 현황**(최신 받기 후)에도 보입니다.

| 작업 | 언제 | 하는 일 | 사이트 반영 |
|---|---|---|---|
| SEO 주간 점검 (`.github/workflows/seo-weekly.yml`) | 매주 월 09:17 | Search Console 최근 28일 vs 이전 28일, 칼럼별 순위·클릭 변화, 본문에 없는 검색어, 오래된 내용(120일), 지난 연도 제목, 깨진 링크, 사이트맵·canonical 점검, 새 주제 후보 → `content/reports/` | 사이트맵·칼럼 페이지 재생성만 |
| 칼럼 현행화 (`.github/workflows/seo-refresh.yml`) | 매월 1일 10:37 | 점검의 "보강 필요" 상위 2편을 Claude가 보강 → **PR** 생성 | PR을 병합해야 반영 |

**처음 한 번 설정 (GitHub 저장소 › Settings › Secrets and variables › Actions › New repository secret)**
1. `ANTHROPIC_API_KEY` — https://console.anthropic.com 에서 발급. 칼럼 현행화에 필요(사용량만큼 과금).
2. `GSC_SA_KEY` (선택이지만 권장) — 검색 성과 점검용.
   - Google Cloud 콘솔에서 프로젝트 생성 → **Google Search Console API** 사용 설정 → 서비스 계정 만들기 → 키(JSON) 생성.
   - Search Console › 설정 › 사용자 및 권한 › 사용자 추가 → 서비스 계정 이메일을 **제한됨** 권한으로 추가.
   - 키 JSON 내용을 통째로 Secret 값에 붙여넣기.
3. Actions 탭 › **SEO 주간 점검** › Run workflow 로 한 번 실행해 확인.

설정값(`content/geo-seo.config.json › maintenance`): `refresh_after_days`(오래됨 기준 일수), `auto_refresh_per_month`(월 자동 보강 편수), `min_impressions`.
리포트·검색 데이터만 바뀐 커밋은 Vercel이 다시 배포하지 않습니다(`vercel.json › ignoreCommand`).

# artheus 웹 (Figma 독립 버전)

Figma Make "아터스" 프로젝트에서 뼈대만 가져와, Figma 없이 어디서나 실행·배포할 수 있게 만든 프로젝트입니다.

## 실행

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:5173 을 엽니다. 배포용 빌드는 `npm run build` → `dist/` 폴더를 Vercel·Netlify·Cloudflare Pages 등에 올리면 됩니다.

## 들어 있는 것 (원본 그대로)

| 영역 | 파일 |
|---|---|
| 홈 화면 전체 (히어로, 수업 방식, 강사·수강료, artheus ON 배너, 합격 대학 로고, 상담) | `src/app/pages/Home.tsx` |
| 상단 메뉴 · 모바일 메뉴 | `src/app/components/Header.tsx` |
| 푸터 · 오른쪽 빠른 상담 메뉴 · 커서 빛 효과 | `Footer.tsx`, `QuickMenu.tsx`, `CursorGlow.tsx` |
| 인스타그램 상담 버튼 (GTM 클릭 기록 포함) | `InstagramConsultButton.tsx` |
| 디자인 토큰 · 글꼴 · 공통 스타일 | `src/styles/` |
| 대학 로고 11개 | `src/assets/` |
| Google Tag Manager (GTM-N6Z4Q7MX), 파비콘, SNS 공유 이미지 | `index.html`, `public/` |

Figma가 배포할 때만 넣어 주던 GTM·파비콘·공유 이미지를 `index.html`과 `public/`에 직접 넣었습니다.

## 자리표시로 둔 것

- **공개 페이지:** 비전, 코치, 프로그램, LAB, 컬럼, Zine, 공지, 문의 등은 메뉴는 동작하지만 화면은 자리표시입니다. 이름표는 `src/app/App.tsx`의 `PAGES` 표에 있습니다.
- **로그인 이후 화면:** 로그인, 회원가입, 마이페이지, 관리자, 강사 콘솔, artheus ON도 자리표시입니다.
- **로그인 상태와 데이터:** `contexts/AuthContext.tsx`는 항상 로그아웃 상태, `DataContext.tsx`는 빈 목록입니다.

원본의 해당 페이지가 필요하면 Figma Make에서 그 파일만 다시 가져올 수 있습니다.

## Supabase

`utils/supabase/info.tsx`에 기존 Supabase 프로젝트 연결 정보가 그대로 있습니다. 홈의 강사 사진과 푸터 연락처는 기존 서버에서 불러오고, 실패하면 기본값으로 표시됩니다.

## 원본과 달라진 점

- `package.json`: Figma 전용 설정(`vite.figma.config.ts`)을 쓰지 않고, 실제로 쓰는 패키지만 남겼습니다.
- `App.tsx`: 자리표시 페이지로 연결하도록 단순화했습니다. 원본의 신규 강사 팝업은 빠졌습니다.
- `docs-original/`: 원본 문서를 참고용으로 보관했습니다.

## 바이브 코딩 스튜디오 (artheus Studio)

`npm run dev`를 켜고 **http://localhost:5173/__studio** 를 열면, 왼쪽 채팅창에 말로 요청하고 오른쪽 미리보기 모니터에서 바로 결과를 보는 화면이 나옵니다.

- **요소 선택**: 미리보기에서 고칠 부분을 클릭하면, 그 요소를 만드는 코드 위치(예: `src/app/pages/Home.tsx:205`)를 찾아 Claude에게 함께 전달합니다.
- **실시간 반영**: Claude가 파일을 저장하는 즉시 미리보기가 바뀝니다. 새로고침이 필요 없습니다.
- **되돌리기**: 요청할 때마다 직전 상태를 `.studio/snapshots/`에 저장합니다. 화면 아래 ‘되돌리기 기록’에서 원하는 시점으로 돌아갈 수 있습니다(최근 30개).
- **이미지 첨부**: ‘이미지’ 버튼, 붙여넣기(⌘V), 끌어다 놓기로 한 번에 8장까지 첨부합니다. 참고 캡처(“이 화면처럼 만들어줘”)로도, 사이트에 넣을 사진(“이 사진을 강사 소개에 넣어줘”)으로도 쓸 수 있습니다. 첨부한 이미지는 `public/uploads/`에 저장되고, 사이트에서는 `/uploads/파일이름` 주소로 쓰입니다.
- **기기 크기**: 데스크톱 1440 · 태블릿 820 · 모바일 390 화면으로 바꿔 볼 수 있습니다.
- **대화 이어가기**: 같은 대화 안에서는 앞선 요청을 기억합니다. ‘새 대화’로 초기화합니다.

### 준비물
이 컴퓨터에 **Claude Code**가 설치되어 있고 로그인되어 있어야 합니다. 별도의 API 키는 필요 없고, 본인 Claude 계정 사용량으로 동작합니다.

```bash
npm install -g @anthropic-ai/claude-code
claude
```
처음 한 번 `claude`를 실행해 로그인하면 됩니다.

### 안전장치
- Claude는 파일 읽기·검색·수정만 할 수 있습니다. 명령 실행(설치, 삭제, git 등)은 막혀 있습니다.
- `studio/` 폴더는 고치지 않도록 지시되어 있습니다.
- 스튜디오는 이 컴퓨터(localhost)에서 열 때만 동작합니다. 같은 와이파이의 다른 기기에서 접근하면 거부합니다.
- 개발 서버 전용입니다. `npm run build`로 만드는 배포 파일에는 스튜디오가 들어가지 않습니다.
