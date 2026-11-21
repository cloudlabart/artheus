# 채널 연결 설정

비밀값은 환경변수로만 둔다 (`.env` 는 커밋 금지). 예:
```bash
export WP_URL=https://example.com
export WP_USER=editor
export WP_APP_PASSWORD="abcd efgh ijkl mnop qrst uvwx"
export NOTION_TOKEN=secret_xxx
export GSC_ACCESS_TOKEN=ya29.xxx   # 또는 gcloud ADC
```

## WordPress
1. 관리자 › 사용자 › 프로필 › **애플리케이션 비밀번호** 생성 (HTTPS 필수). 편집자(Editor) 이상 권한 계정 권장.
2. `geo-seo.config.json` › `wordpress.seo_plugin`:
   - `rankmath`: Rank Math › 일반 설정 › 기타에서 REST 메타 노출이 필요하거나, 아래 스니펫으로 메타 키 등록.
   - `yoast`: Yoast 메타 키는 기본적으로 REST 쓰기 불가 → 아래 스니펫 필요.
   - `none`: 메타 설명은 excerpt로 들어가고, JSON-LD를 본문에 삽입(`inject_jsonld: true`, 관리자 계정의 unfiltered_html 필요).
   ```php
   // functions.php 또는 코드 스니펫 플러그인
   add_action('init', function () {
     foreach (['rank_math_title','rank_math_description','rank_math_focus_keyword',
               '_yoast_wpseo_title','_yoast_wpseo_metadesc','_yoast_wpseo_focuskw'] as $k) {
       register_post_meta('post', $k, ['show_in_rest' => true, 'single' => true, 'type' => 'string',
         'auth_callback' => fn() => current_user_can('edit_posts')]);
     }
   });
   ```
3. 예약 발행: `--status future --schedule 2026-12-01T09:00:00` (사이트 타임존 기준).

## 네이버 블로그
- 글쓰기 Open API는 종료되어 자동 게시 수단이 없다. 이 플러그인은 붙여넣기용 파일을 만든다:
  `content/articles/<slug>/naver/naver_copy.html` → 브라우저에서 열기 → ①제목 ②본문(서식 유지) ③태그 복사 → 스마트에디터 ONE에 붙여넣기.
- 표는 붙여넣기 후 스마트에디터 표로 다시 정리해야 할 수 있다. 사진은 직접 업로드(경험 신호).
- 사이트 글과 동일 원고 동시 게시는 피하고 도입·사례를 바꾼 변형본을 권장.
- 브라우저 자동화로 게시하는 방식은 계정 보호조치 위험이 있어 기본 제공하지 않는다.

## Markdown (정적 사이트)
- `markdown.flavor`: `hugo`(lastmod, draft) · `astro`(pubDate, updatedDate, heroImage) · `next` · `jekyll`.
- `markdown.filename`: `{slug}.md`, `{date}-{slug}.md`(Jekyll), `{slug}/index.md`(Hugo page bundle).
- `--git-commit` 은 대상 폴더의 git 저장소에 커밋만 한다. push 는 직접.
- Astro content collection 스키마에 `faq`, `keywords` 필드가 없으면 스키마에 추가하거나 `inject_jsonld` 만 사용.

## Notion
- 방법 A (권장): Claude의 Notion 커넥터 연결 → `content-publish` 가 커넥터 도구로 DB에 페이지 생성.
- 방법 B: https://www.notion.so/profile/integrations 에서 내부 통합 생성 → 토큰을 `NOTION_TOKEN` 에 → 대상 DB의 `···` › 연결에 통합 추가 → DB URL의 32자리 ID를 `notion.database_id` 에.
- DB 속성 이름이 다르면 `notion.properties` 로 매핑. 상태 속성이 Notion "상태(status)" 타입이면 `status_type: "status"`.

## Google Search Console
- 방법 A: Windsor.ai 또는 Supermetrics 커넥터 연결 후 Search Console 계정 연동 (`/windsor-ai:setup`, `/supermetrics-marketing:setup`).
- 방법 B: `gcloud auth application-default login --scopes=https://www.googleapis.com/auth/webmasters.readonly,https://www.googleapis.com/auth/cloud-platform` 후 `gsc_fetch.py`.
- 방법 C: GSC UI 실적 보고서 › 내보내기 › CSV 업로드 (페이지×검색어 조합이 없어 카니발리제이션 분석은 제한됨).
