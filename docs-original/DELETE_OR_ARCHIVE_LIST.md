# 삭제/보관 권장 목록

## 운영에서 제거

- `api.ts` — localStorage mock 저장소
- `seed-data.ts` — localStorage mock seed
- `App-2.tsx` — 구 BrowserRouter 버전 중복 App
- `index(2).tsx` / `make-server-cc669d66` — 구 Hanyang Actors Lab 서버 prefix
- `kv_store(1).tsx` 원본 — 반환 형식 불일치 때문에 ZIP 내 교체본 사용
- `package-lock.json` — pnpm 기준이면 제거
- `postcss.config.js` — Tailwind v4 기준이면 제거

## archive로 이동

- 중복 README 계열
- 중복 SUPABASE 계열
- 중복 UI_ROUTES 계열
- 중복 COACH_SAVE_RELIABILITY 계열
- Figma Make 원본 프롬프트/가이드 파일은 `/docs/reference`로 보관

## 남기는 기준

- 실제 운영 라우터: `src/App.tsx`
- 실제 엔트리: `src/main.tsx`
- 실제 스타일 엔트리: `src/styles/index.css`
- 실제 Supabase client: `src/integrations/supabase/client.ts`
- 서버 보조 API: `supabase/functions/make-server-d46327e9/*`
