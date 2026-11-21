---
name: content-pipeline
description: 아터스 칼럼 전 과정 — Search Console 기회 발굴 → 브리프 → 원고 → 검수 → 칼럼 페이지 미리보기 → 발행(c-art.co.kr/column, 네이버 블로그 붙여넣기). "칼럼 써줘", "이 키워드로 글 써서 올려줘", "GSC 보고 주제 추천해줘" 요청에 사용.
argument-hint: "[키워드 | plan | refresh <slug>] [--auto]"
---

# 아터스 칼럼 파이프라인

아터스(홍대 입시 연기학원) 칼럼을 **네이버 + 구글 + AI 검색(ChatGPT·Perplexity·AI Overview)** 에서 노출·인용되도록 기획부터 발행까지 진행한다.

## 경로
```
content/geo-seo.config.json          브랜드·저자·청중·디자인 설정 (모든 단계에서 읽기)
content/data/gsc.csv                 Search Console 데이터 (스튜디오 칼럼 탭에서 올림)
content/plan.md                      칼럼 계획
content/column/<slug>/brief.md       브리프
content/column/<slug>/article.md     원고 (frontmatter status: draft | published)
content/column/<slug>/images/        칼럼에 넣을 사진
content/column/<slug>/audit.json     검수 결과
content/column/<slug>/naver/         네이버 붙여넣기 파일
public/column/...                    발행된 칼럼 정적 페이지 (build_site.py가 생성, 직접 고치지 않음)
tools/geo-seo/                       스크립트·작성 기준·템플릿
```
기준 문서: `tools/geo-seo/references/geo-seo-playbook.md`(작성 기준), `tools/geo-seo/references/layout-guide.md`(컴포넌트 문법). 모든 단계 전에 읽는다.

## 실행 모드
| 입력 | 실행 |
|---|---|
| `plan` 또는 인자 없음 | 1단계만 → 주제 3개 제안 |
| `<키워드>` | 2→5단계 (원고는 `status: draft`) |
| `refresh <slug>` | 기존 칼럼 보강: 브리프 → 리라이트 → 검수 → 미리보기 (slug 유지) |
| `--auto` | 단계 사이 확인 없이 진행 |

**스튜디오에서 실행될 때(헤드리스):** 사용자에게 질문할 수 없다. 확인이 필요한 점은 마지막 보고의 "확인 필요"에 적고 계속 진행한다. 발행(6단계)은 절대 하지 않는다 — 발행은 스튜디오의 [발행] 버튼만 한다.

## 단계
1. **기획** — `content-plan` 스킬 절차 (`content/data/gsc.csv` 없으면 웹검색 기반 시드 키워드).
2. **브리프** — `content-brief` 스킬 절차 → `brief.md`. 청중·솔루션 3–5개·추천 도서 포함.
3. **작성** — `content-write` 스킬 절차 → `article.md` (`status: draft`). 레이아웃 문법 준수.
4. **검수** — `content-audit` 스킬 절차. `python3 tools/geo-seo/scripts/seo_lint.py content/column/<slug>/article.md --out content/column/<slug>/audit.json` 점수 ≥ 80, critical 0까지 최대 3회 수정.
5. **미리보기** — `python3 tools/geo-seo/scripts/build_site.py --preview <slug>` 로 실제 칼럼 페이지 디자인을 `.studio/preview/<slug>/`에 만든다. `python3 tools/geo-seo/scripts/publish.py naver content/column/<slug>/article.md --config content/geo-seo.config.json` 로 네이버 파일도 만든다.
6. **발행** (대화형 Claude Code에서 사용자가 명시적으로 요청했을 때만) — `content-publish` 스킬 절차.

## 마무리 보고 (짧게)
```
✅ <제목>  (content/column/<slug>/)
- 키워드: <주 키워드> · 검수 NN/100
- 미리보기: 스튜디오 칼럼 탭 → <제목>
- 확인 필요: 저자·사진·실제 사례 TODO, 미확인 서지 등
```
