---
name: content-plan
description: Google Search Console 데이터로 콘텐츠 기회(순위 4–20위 보강, 저CTR 제목 개선, 질문형 GEO 글, 신규 주제, 카니발리제이션)를 찾고 주제 클러스터·발행 캘린더(content/plan.md)를 만든다. "GSC 분석해서 뭐 쓸지", "콘텐츠 캘린더", "키워드 기회" 요청에 사용.
argument-hint: "[--days 90] [--csv 경로]"
---

# 콘텐츠 기획 (Search Console 기반)

먼저 `tools/geo-seo/references/geo-seo-playbook.md` 를 읽는다. `content/geo-seo.config.json` 이 없으면 `tools/geo-seo/templates/geo-seo.config.example.json` 을 복사하고 사이트 URL·GSC 속성·저자·블로그 주제를 사용자에게 묻는다.

## 1. 데이터 확보 (위에서부터 가능한 것)
1. **사용자가 CSV/JSON 경로를 줬다** → 그대로 사용.
2. **Windsor.ai / Supermetrics 커넥터가 연결됨** → `windsor-ai:google-search-console` 또는 `supermetrics-marketing:google-search-console` 스킬로 최근 90일 `query, page, clicks, impressions, ctr, position` 을 받아 `content/data/gsc.csv` 로 저장. (커넥터 도구가 안 보이면 ToolSearch로 `search console` 검색. 연결 실패면 사용자에게 알리고 다음 방법으로.)
3. **API 직접** → `python3 tools/geo-seo/scripts/gsc_fetch.py --site <config.gsc.site> --days 90 --country kor --out content/data/gsc.csv`
   (GSC_ACCESS_TOKEN 또는 gcloud ADC 필요. 실패 메시지를 그대로 사용자에게 전달.)
4. **수동** → 사용자에게 안내: Search Console › 실적 › 기간 3개월 › 내보내기 › CSV, 그 안의 `Queries.csv`(또는 `검색어.csv`)를 업로드.
5. 신규 사이트라 데이터가 없으면 → 웹검색 기반 시드 키워드 조사로 대체하고 그 사실을 plan에 명시.

## 2. 분석
```bash
python3 tools/geo-seo/scripts/gsc_opportunities.py content/data/gsc.csv --min-impr 30 --out content/data/opportunities.json
```
결과를 읽고 LLM 판단으로 보정한다:
- 브랜드 검색어·무관 검색어 제외.
- 같은 의도의 검색어는 하나의 글로 묶는다 (clusters 참고). 이미 이 의도를 다루는 URL이 있으면 **신규 대신 보강**.
- 네이버 블로그 주제(config.naver.blog_topic)에서 벗어나는 키워드는 네이버 채널에서 빼고 사이트(WordPress/Markdown)로만 배정 (C-Rank 보호).
- 우선순위 = 예상 추가 클릭 × 비즈니스 관련성(상/중/하) ÷ 난이도(보강 < CTR 개선 < 신규).

## 3. 산출물: `content/plan.md`
```markdown
# 콘텐츠 계획 (YYYY-MM-DD, GSC 기간)
## 요약 — 검색어 N개 분석, 빠른 승리 N, 신규 N
## 빠른 승리 (제목·메타만 수정)
| URL | 검색어 | 순위 | CTR | 기대 CTR | 새 제목 제안 |
## 기존 글 보강 (순위 4–20위)
| URL | 대표 검색어 | 노출 | 순위 | 추가할 섹션/FAQ |
## 신규 글
| 우선 | 주 키워드 | 묶을 검색어 | 의도 | 형식 | 채널 | 목표 발행일 |
## 카니발리제이션
| 검색어 | 경쟁 URL들 | 조치 |
## 클러스터 맵 (필러 ↔ 클러스터 글 내부 링크 구조)
```
주 2–3편 페이스로 4주 캘린더를 제안한다. 끝나면 상위 3개 주제를 보여주고 "어느 것부터 진행할까요?" 를 묻는다 (`--auto` 면 1순위로 `content-brief` 진행).
