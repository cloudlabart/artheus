---
name: content-publish
description: 검수를 통과한 아터스 칼럼을 c-art.co.kr/column 에 발행(정적 페이지 생성 → git 커밋 → push → Vercel 자동 배포)하고 네이버 블로그 붙여넣기 파일을 만든다. "칼럼 발행", "올려줘" 요청에 사용.
argument-hint: "<slug>"
---

# 칼럼 발행

스튜디오에서는 칼럼 탭의 **[발행]** 버튼이 이 절차를 그대로 실행한다. 대화형 Claude Code에서 쓸 때는 각 단계를 사용자에게 보여 주고 승인을 받은 뒤 진행한다(공개 사이트 반영).

1. **사전 확인**
   - `content/column/<slug>/audit.json` 의 `passed: true`. 아니면 `content-audit` 먼저.
   - 원고에 `<!-- TODO` 가 남아 있으면 발행하지 않고 목록을 보여 준다.
   - frontmatter `author` 가 비어 있으면 발행하지 않는다.
2. **상태 변경** — `article.md` frontmatter `status: published`, `updated` 를 오늘 날짜로.
3. **사이트 생성** — `python3 tools/geo-seo/scripts/build_site.py`
   → `public/column/<slug>/index.html`, `public/column/index.html`, `public/sitemap.xml`, `public/rss.xml`, `public/robots.txt`.
4. **배포** — `git add content/column/<slug> public/column public/sitemap.xml public/rss.xml public/robots.txt` → `git commit -m "칼럼: <제목>"` → `git push`. Vercel이 자동 배포한다. 원격 저장소가 없으면 커밋까지만 하고 알린다.
5. **네이버** — `python3 tools/geo-seo/scripts/publish.py naver content/column/<slug>/article.md --config content/geo-seo.config.json`
   → `naver/naver_copy.html`. 네이버 판은 도입부와 사례를 바꾼 변형본이 좋고, 끝에 사이트 원문 링크(`https://www.c-art.co.kr/column/<slug>/`)를 건다.
6. **보고** — 칼럼 주소, 네이버 파일 위치, 도메인 이전 후 할 일(Search Console·네이버 서치어드바이저에 사이트맵 `https://www.c-art.co.kr/sitemap.xml` 제출).
