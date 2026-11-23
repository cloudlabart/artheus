---
name: content-write
description: 브리프(brief.md)를 바탕으로 GEO·SEO 최적화된 한국어 원고 article.md(frontmatter + Markdown)를 작성하거나 기존 글을 리라이트한다. 하나의 원본으로 WordPress·네이버·Markdown·Notion에 발행 가능. "글 써줘", "원고 작성", "리라이트" 요청에 사용.
argument-hint: "<slug 또는 brief.md 경로>"
---

# 원고 작성

입력: `content/column/<slug>/brief.md`. 출력: 같은 폴더의 `article.md`.
반드시 읽기: `tools/geo-seo/references/geo-seo-playbook.md`, `tools/geo-seo/templates/article.md`, `content/geo-seo.config.json`(author·tone·audience·site_domain).

`content-writer` 에이전트에 브리프 경로·config·플레이북 경로를 넘겨 작성시킨다. 에이전트가 없으면 직접 아래 규칙대로 쓴다.

## 작성 규칙 (요약 — 상세는 플레이북)
- **frontmatter** 는 `templates/article.md` 의 키를 모두 채운다. `faq` 는 `- q:` / `  a:` 블록 형식, 리스트는 `[a, b]` 인라인 형식. 날짜는 오늘(YYYY-MM-DD).
- **문체(항상)**: `content/style/voice.md`(배준우 문체 가이드)를 먼저 읽고 그 말투로 쓴다. 분기마다 첨삭으로 업데이트되므로 매번 새로 읽는다.
- **청중·편집 원칙(항상)**: 플레이북 7장. 청중에 맞는 쉬운 문체와 예시, 솔루션 3–5개, `## 추천 도서` 2–3권과 구매 링크.
- **구조**: H1 1개 → `> **핵심 요약**` 인용 블록(3–5줄, 수치 포함, 기준 시점) → 직접 답 첫 문단(정의문 포함) → 질문형 H2 4–8개 → `## 자주 묻는 질문`(frontmatter faq와 동일 내용) → `## 정리` → `## 추천 도서` → `## 참고 자료`(출처 링크 목록).
- 각 H2의 **첫 문장은 그 소제목 질문에 대한 답**. 문단은 2–4문장, 400자 이내.
- **컴포넌트 문법**: `tools/geo-seo/references/layout-guide.md` 의 Markdown 문법(요약 카드, 대본 박스, 콜아웃, 단계 카드, FAQ, 도서 카드, IMAGE/TODO 자리)을 지켜야 최종 디자인에 그대로 반영된다.
- 비교/가격/스펙 → 표, 절차 → 번호 목록(`howto_steps` 에도 기록).
- **모든 수치에 출처 링크**를 문장 안에 `[기관명](URL)` 형태로. 브리프에 없는 수치를 지어내지 않는다. 필요하면 웹검색으로 확인하고 확인 못 하면 수치를 빼고 표현한다.
- 경험·사례 부분은 config/사용자 제공 정보만 사용. 없으면 `<!-- TODO: 실제 경험/사진 추가 -->` 로 표시하고 마무리 보고에서 알린다 (가짜 경험 금지).
- 이미지: 넣을 위치에 `![설명형 alt](images/파일명.jpg)` 또는 `<!-- IMAGE: 무엇을 보여줄지 -->`.
- 내부 링크: 브리프/plan의 클러스터 글로 2–3개. URL을 모르면 `internal_links_todo: true` 설정.
- 톤: config.tone. AI 상투어 금지 ("다양한", "중요합니다" 남발, "결론적으로 ~라고 할 수 있습니다").
- `channels` 에 naver 가 있으면 `naver_tags` 5–10개(띄어쓰기 없이), 본문 키워드 반복 3–12회.

## 리라이트(refresh) 모드
기존 URL 본문을 가져와 `article.md` 로 변환한 뒤: 검색어 대비 빠진 하위 의도 섹션 추가, 오래된 수치 갱신, 요약 박스·FAQ·표 추가, `updated` 갱신. **slug와 URL은 유지**한다.

작성 후 바로 `content-audit` 단계로 넘긴다.
