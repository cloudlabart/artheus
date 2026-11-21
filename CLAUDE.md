# artheus 웹 — 작업 안내

홍대 입시 연기학원 ARTHEUS(artheus) 홈페이지. Figma Make에서 독립시킨 Vite + React 18 + TypeScript + Tailwind CSS v4 프로젝트.

## 구조
- `src/app/App.tsx` — 라우팅. 공개 페이지는 `PAGES` 표와 `PublicPageRenderer`로 연결 (`nav.ts`의 `go('vision')` 방식).
- `src/app/pages/` — 페이지. `Home.tsx`만 원본, 나머지는 `Placeholder`.
- `src/app/components/` — Header, Footer, QuickMenu, InstagramConsultButton 등.
- `src/styles/` — `theme.css`(토큰), `public-ui.css`(브랜드 색), `fonts.css`.
- `utils/supabase/info.tsx` — 기존 Supabase 연결 정보(공개 anon 키).
- `studio/` — 아터스 스튜디오(개발 서버 전용, 페이지·칼럼 탭). 사이트 작업 중에는 고치지 않는다.
- `content/column/<slug>/article.md` — 칼럼 원고(frontmatter `status: draft|published`). `content/geo-seo.config.json` — 브랜드·저자·청중·칼럼 디자인 설정.
- `public/column/`, `public/sitemap.xml`, `public/rss.xml` — `python3 tools/geo-seo/scripts/build_site.py`가 만드는 칼럼 발행본. 직접 고치지 않는다.
- `.claude/skills/content-*`, `.claude/agents/` — 칼럼 기획·작성·검수·발행 스킬. `tools/geo-seo/` — 스크립트와 작성 기준.

## 디자인 규칙
- 색: 아이보리 `#F3F0EA`(배경), `#FAF8F4`(카드), 딥블루 `#153956`, 블루 `#2D5E88`, 라이트블루 `#A9C5D9`, 잉크 `#132B3F`, 본문 회청색 `#35526B`.
- 한글 문단에는 `keep-ko` 클래스(단어 단위 줄바꿈).
- 테두리는 얇은 1px `border-[#153956]/15`, 둥근 모서리 `rounded-2xl`, 버튼은 `rounded-full`.
- 상담 버튼은 `InstagramConsultButton`을 쓴다(GTM 클릭 기록 포함).
- 모바일(390px)에서 가로 스크롤이 생기지 않게 한다.

## 작업 방식
- 사용자는 주로 휴대폰에서 요청한다. 답은 한국어로 짧게: 무엇을 어느 파일에서 바꿨는지.
- 수정 후 `npm run build`로 빌드가 통과하는지 확인한다.
- `index.html`의 Google Tag Manager(GTM-N6Z4Q7MX) 코드는 지우지 않는다.

## 칼럼 (GEO·SEO)
- 칼럼 요청("○○ 칼럼 써줘")은 `content-pipeline` 스킬을 따른다. 청중은 연기 지망 고등학생~대학생, 솔루션은 3–5개, 추천 도서와 구매 링크 필수, 제휴 링크 없음.
- 칼럼은 SPA 화면이 아니라 정적 페이지 `/column/<slug>/`로 발행된다(검색엔진·AI 수집기가 읽을 수 있게). React 쪽 `go('column')`은 이 주소로 이동만 한다.
- 발행(`status: published` + git push)은 사용자가 명시적으로 요청했을 때만, `content-publish` 스킬 절차대로.
- 정기 SEO: `.github/workflows/seo-weekly.yml`(주간 점검 → `content/reports/latest.json`), `seo-refresh.yml`(월간 보강 → PR). 보강 요청을 받으면 `content/reports/latest.json`의 해당 칼럼 `reasons`·`missing_queries`를 근거로 삼는다.
- 배포: GitHub Pages(`.github/workflows/deploy-pages.yml`). 저장소가 공개라 Search Console 숫자·CSV는 커밋하지 않는다(`content/data/`는 gitignore, 서버 리포트는 `--public`).
