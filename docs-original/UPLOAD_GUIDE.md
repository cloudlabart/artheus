# ARTHEUS — 라우트/페이지 연결 수정 업로드 가이드

## 먼저 업로드/교체해야 하는 파일

아래 파일을 현재 프로젝트의 같은 경로에 덮어쓰기 하세요.

### 1) 라우팅 핵심

- `src/App.tsx`
- `src/main.tsx`
- `package.json`

수정 내용:

- `HashRouter` → `BrowserRouter`로 전환
- 누락 경로 클릭 시 `* → /` 강제 이동 제거
- `/columns`, `/mypage`, `/notice/:id`, `/zine/:category/:slug`, `/director/dashboard`, `/teacher/*`, `/student/*`, `/app/tasks`, `/app/messages`, `/app/report` 등 누락 route alias 추가
- 아직 실제 화면이 없는 경로는 홈으로 보내지 않고 `ComingSoonPage`를 보여주도록 처리

### 2) 모바일 앱 연결

- `src/pages/AppLayout.tsx`
- `src/components/app/AppLayout.tsx`
- `src/pages/AppHome.tsx`
- `src/pages/AppPrograms.tsx`
- `src/pages/AppCoaches.tsx`
- `src/pages/AppCommunity.tsx`
- `src/pages/AppZine.tsx`
- `src/pages/AppLearn.tsx`
- `src/pages/AppContact.tsx`
- `src/pages/AppConsult.tsx`

수정 내용:

- 모바일 하단 탭이 `/`, `/programs`로 빠져서 데스크톱/홈으로 튀는 문제 수정
- 모바일 HOME/PROGRAMS/ZINE/COACHES/CONSULT는 `/app/...` 경로로 연결
- `/app/tasks`, `/app/messages`, `/app/report` 클릭 시 홈으로 돌아가지 않도록 route 추가

### 3) 라우터 import 통일

- `src/components/Header.tsx`
- `src/components/Footer.tsx`
- `src/components/QuickMenu.tsx`
- `src/components/ProtectedRoute.tsx`
- `src/components/Navbar.tsx`가 프로젝트에 있다면 동일하게 `react-router-dom` 기준으로 맞추세요.

이 ZIP에는 `Header`, `Footer`, `QuickMenu`, `ProtectedRoute` 교체본이 포함되어 있습니다.

### 4) Supabase 연결 파일

- `src/integrations/supabase/client.ts`
- `src/utils/supabase/info.ts`

수정 내용:

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_ANON_KEY`가 있으면 env 우선 사용
- env가 없을 때만 업로드된 `projectId`, `publicAnonKey` fallback 사용

### 5) KV 서버 오류 수정

- `supabase/functions/make-server-d46327e9/kv_store.tsx`
- `supabase/functions/make-server-d46327e9/index.tsx`

수정 내용:

- `mget()` 반환값을 `index.tsx`가 기대하는 `{ key, value }` 형태로 수정
- `mset(entries)`와 `mset(keys, values)` 두 방식 모두 허용
- `getByPrefix()`가 `{ key, value }[]`를 반환하도록 수정

## 삭제 또는 archive 권장

아래 파일들은 운영 업로드에서 제외하세요.

- `api.ts`
- `seed-data.ts`
- `App-2.tsx`
- `index(2).tsx` 또는 `make-server-cc669d66` 계열
- `package-lock.json` — pnpm을 쓰면 제거
- `postcss.config.js` — Tailwind v4 기준이면 `postcss.config.mjs`만 유지
- 중복 문서: `README-1.md`, `README-2.md`, `SUPABASE-1.md`, `UI_ROUTES__2_.md`, 중복 `COACH_SAVE_RELIABILITY` 계열

## 확인 순서

1. `pnpm install`
2. `pnpm dev`
3. 아래 경로를 직접 열어 확인

- `/`
- `/vision`
- `/programs`
- `/programs/admission`
- `/coaches`
- `/zine`
- `/zine/breath/sample-slug`
- `/columns`
- `/notices`
- `/notice/sample-id`
- `/mypage`
- `/app/home`
- `/app/programs`
- `/app/learn`
- `/app/tasks`
- `/director/dashboard`

중요: 이제 없는 경로도 홈으로 자동 이동하지 않고 안내 화면을 보여줘야 합니다.
