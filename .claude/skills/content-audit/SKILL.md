---
name: content-audit
description: article.md 또는 기존 URL의 SEO·GEO 품질 검수 — 규칙 기반 점수(seo_lint.py) + 사실검증·E-E-A-T·AI 인용 가능성 LLM 리뷰, 자동 수정 루프. "검수", "SEO 점검", "GEO 점수", "AI 검색에 인용될까" 요청에 사용.
argument-hint: "<article.md 경로 | URL> [--fix]"
---

# 검수 (SEO + GEO)

## A. article.md 인 경우
1. 규칙 검사:
   ```bash
   python3 tools/geo-seo/scripts/seo_lint.py content/column/<slug>/article.md --out content/column/<slug>/audit.json
   ```
   (기준점수: config.quality.lint_threshold, 기본 80. `‼` = critical)
2. `geo-reviewer` 에이전트로 LLM 검수 (article 경로, brief 경로, audit.json 전달). 검수 항목:
   - **사실 검증**: 모든 수치·주장을 출처 링크와 대조 (web-fetch로 실제 페이지 확인). 불일치·죽은 링크·출처 없음 목록.
   - **의도 충족**: 브리프의 하위 질문이 모두 답해졌는가, 첫 문장 답이 정확한가.
   - **AI 인용 가능성**: 각 H2 첫 1–2문장을 단독으로 떼어도 정확한 답인가. 정의문·수치·엔티티 명확성.
   - **E-E-A-T**: 저자·경험·출처 신뢰도. YMYL이면 전문가 검수 문구 필요.
   - **네이버 적합성**: 광고성·키워드 과다·외부링크 과다·주제 일관성.
   - **문체**: AI 상투어, 번역투, 장황함.
   판정: PASS / FIX(수정 목록) / BLOCK(사실 오류 등 사람 확인 필요).
3. **수정 루프** (`--fix` 또는 파이프라인 실행 시): lint 실패 항목 + 리뷰 FIX 항목을 article.md에 반영 → 다시 1–2. 최대 3회. 3회 후에도 미달이면 남은 문제를 사용자에게 보고하고 멈춘다. BLOCK 이면 즉시 사용자에게 묻는다.
4. 보고: 점수 변화(예: 62 → 88), 통과 여부, 수정한 것, 사람이 해야 할 것(TODO 경험/사진, 미확인 수치).

## B. URL 인 경우 (기존 페이지 진단)
web-fetch 로 페이지를 가져와 본문을 Markdown으로, 메타(title, description, 스키마 유무)를 frontmatter로 구성해 `content/audits/<slug>.md` 로 저장 → A-1, A-2 실행 (수정은 하지 않음). GSC 데이터가 있으면 해당 URL의 검색어와 순위를 함께 보여주고 `refresh` 진행 여부를 묻는다.
