#!/usr/bin/env python3
"""Rule-based SEO + GEO audit for an article.md (frontmatter + markdown).

Usage:
  python3 scripts/seo_lint.py content/articles/<slug>/article.md [--json] [--out audit.json]

Exit code 0 when score >= pass threshold (default 80) and no 'critical' failures, else 1.
The LLM review (skills/content-audit) covers what rules can't: factual accuracy, E-E-A-T, tone.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "lib"))
from mdkit import load_article, parse_blocks, strip_md  # noqa: E402

QUESTION_RE = re.compile(r"(\?|까요|나요|인가요|일까|무엇|뭐|어떻게|왜|언제|어디|얼마|차이|방법|비교|추천)")
DEFINITION_RE = re.compile(r"(이란|란\s|이라\s?함은|는\s.*?(을|를)\s?말합니다|(이)?다\.|입니다\.)")
STAT_RE = re.compile(r"(\d[\d,.]*\s?(%|퍼센트|배|명|원|만|억|건|개|위|시간|분|일|년|개월|달러|USD|KRW))")
YEAR_RE = re.compile(r"20\d{2}")


def hangul_len(s: str) -> int:
    return len(re.sub(r"\s", "", s))


STORE_RE = re.compile(r"(aladin\.co\.kr|yes24\.com|kyobobook\.co\.kr|ridibooks\.com|millie\.co\.kr|"
                      r"amazon\.|penguinrandomhouse\.com|wiley\.com|routledge\.com|bookshop\.org|barnesandnoble\.com)")
BOOK_SECTION = "추천 도서"
SKIP_SECTIONS = ("추천 도서", "참고 자료", "자주 묻는 질문", "FAQ")


def load_editorial(config_path: str | None) -> dict:
    for p in [config_path, "geo-seo.config.json", "content/geo-seo.config.json"]:
        if p and os.path.exists(p):
            try:
                return json.load(open(p, encoding="utf-8")).get("editorial", {}) or {}
            except Exception:
                return {}
    return {}


def check(path: str, threshold: int = 80, config_path: str | None = None):
    meta, body = load_article(path)
    editorial = load_editorial(config_path)
    blocks = parse_blocks(body)
    text = strip_md(body)
    results = []

    def add(rule_id, ok, weight, msg, severity="normal", fix=""):
        results.append({"id": rule_id, "pass": bool(ok), "weight": weight, "severity": severity,
                        "message": msg, "fix": "" if ok else fix})

    kw = (meta.get("primary_keyword") or "").strip()
    title = str(meta.get("title") or "")
    desc = str(meta.get("description") or "")
    secondary = meta.get("secondary_keywords") or []

    # ------------------------------------------------------------ metadata
    add("meta.title", 15 <= len(title) <= 45, 6,
        f"제목 길이 {len(title)}자 (권장 15–45자, 구글 SERP 잘림·네이버 노출 기준)", "critical",
        "제목을 핵심 키워드 앞쪽 배치 + 45자 이내로 줄이세요.")
    add("meta.title_kw", bool(kw) and kw.replace(" ", "") in title.replace(" ", ""), 6,
        f"제목에 주 키워드('{kw}') 포함", "critical", "주 키워드를 제목 앞부분에 넣으세요.")
    add("meta.description", 70 <= len(desc) <= 160, 4,
        f"메타 설명 {len(desc)}자 (권장 70–160자)", "normal", "답을 먼저 주는 1–2문장으로 70–160자 작성.")
    add("meta.desc_kw", bool(kw) and kw.replace(" ", "") in desc.replace(" ", ""), 2,
        "메타 설명에 주 키워드 포함", fix="메타 설명에 주 키워드를 자연스럽게 포함.")
    slug = str(meta.get("slug") or "")
    add("meta.slug", bool(re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", slug)) and len(slug) <= 60, 2,
        f"슬러그 '{slug}' (영문 소문자·하이픈, 60자 이하)", fix="영문 소문자-하이픈 슬러그로 변경.")
    add("meta.dates", bool(meta.get("date")), 2, "작성일(date)/수정일(updated) 명시 — AI 검색은 최신성 신호를 중시",
        fix="frontmatter에 date, updated 추가.")
    add("meta.author", bool(meta.get("author")), 3, "저자(author) 명시 — E-E-A-T", fix="실명/전문가 저자와 author_bio 추가.")

    # ------------------------------------------------------------ structure
    h1 = [b for b in blocks if b["type"] == "heading" and b["level"] == 1]
    h2 = [b for b in blocks if b["type"] == "heading" and b["level"] == 2]
    h3 = [b for b in blocks if b["type"] == "heading" and b["level"] == 3]
    add("struct.h1", len(h1) == 1, 4, f"H1 {len(h1)}개 (정확히 1개)", "critical", "본문 H1을 1개로 맞추세요.")
    add("struct.h2", len(h2) >= 4, 4, f"H2 {len(h2)}개 (4개 이상 권장)", fix="검색 의도별 하위 질문을 H2로 분리.")
    # hierarchy: no H3 before first H2, no skipping
    levels = [b["level"] for b in blocks if b["type"] == "heading"]
    skip = any(b - a > 1 for a, b in zip(levels, levels[1:]))
    add("struct.hierarchy", not skip, 2, "제목 계층 건너뛰기 없음 (H2→H4 금지)", fix="헤딩 레벨을 순서대로 사용.")
    q_h2 = [b for b in h2 + h3 if QUESTION_RE.search(b["text"])]
    add("geo.question_headings", len(q_h2) >= 2, 5,
        f"질문형/의도형 소제목 {len(q_h2)}개 (2개 이상) — AI가 질문-답 단위로 인용", fix="'~란?', '~하는 방법', '~차이' 형태의 소제목 추가.")

    # ------------------------------------------------------------ answer-first
    first_para = next((b["text"] for b in blocks if b["type"] in ("paragraph",)), "")
    first_quote = next((b for b in blocks if b["type"] == "quote"), None)
    idx_first_h2 = next((n for n, b in enumerate(blocks) if b["type"] == "heading" and b["level"] == 2), len(blocks))
    pre_h2 = blocks[:idx_first_h2]
    summary_box = any(b["type"] == "quote" or (b["type"] == "heading" and "요약" in b["text"]) or
                      (b["type"] == "list") for b in pre_h2) or "핵심 요약" in body[:1500]
    add("geo.summary_box", summary_box, 6, "도입부(첫 H2 이전)에 핵심 요약/TL;DR 블록", "critical",
        "H1 바로 아래 '> 핵심 요약' 인용 블록에 3–5줄 결론을 넣으세요.")
    lead_text = " ".join(b.get("text", "") for b in pre_h2 if b["type"] == "paragraph")
    if first_quote and first_quote in pre_h2:
        lead_text += " " + " ".join(c.get("text", "") for c in first_quote["children"] if "text" in c)
    add("seo.kw_intro", bool(kw) and kw.replace(" ", "") in lead_text.replace(" ", ""), 4,
        "도입부(첫 H2 이전)에 주 키워드 등장", "normal", "첫 문단 첫 1–2문장에 키워드와 직접 답 배치.")
    add("geo.direct_answer", 40 <= len(first_para) <= 300 if first_para else False, 3,
        f"첫 문단 길이 {len(first_para)}자 (40–300자, 바로 답하는 문장)", fix="첫 문단을 질문에 대한 직접 답 2–3문장으로.")
    kw_h2 = [b for b in h2 if kw and any(tok in b["text"] for tok in kw.split())]
    add("seo.kw_h2", len(kw_h2) >= 1, 3, f"H2 중 키워드 포함 {len(kw_h2)}개", fix="최소 1개 H2에 키워드/변형어 포함.")
    if secondary:
        hit = [s for s in secondary if str(s).replace(" ", "") in text.replace(" ", "")]
        add("seo.secondary_kw", len(hit) >= max(1, len(secondary) // 2), 3,
            f"보조 키워드 {len(hit)}/{len(secondary)}개 사용", fix=f"미사용: {', '.join(str(s) for s in secondary if s not in hit)}")

    # ------------------------------------------------------------ depth & extractability
    n = hangul_len(text)
    target = int(meta.get("target_length") or 2500)
    add("seo.length", n >= target * 0.8, 5, f"본문 {n}자 (목표 {target}자의 80% 이상)", fix="부족한 하위 의도 섹션을 보강.")
    paras = [b["text"] for b in blocks if b["type"] == "paragraph"]
    long_paras = [p for p in paras if len(p) > 400]
    add("geo.chunking", len(long_paras) <= 1, 4, f"400자 초과 긴 문단 {len(long_paras)}개 (≤1) — 짧은 문단이 인용·모바일 가독성↑",
        fix="긴 문단을 2–4문장 단위로 나누세요.")
    lists = [b for b in blocks if b["type"] == "list"]
    tables = [b for b in blocks if b["type"] == "table"]
    add("geo.lists", len(lists) >= 2, 3, f"목록 {len(lists)}개 (2개 이상)", fix="단계·체크리스트를 목록으로.")
    add("geo.table", len(tables) >= 1, 4, f"표 {len(tables)}개 (비교/스펙 표 1개 이상) — AI Overview·스마트블록 추출에 유리",
        fix="비교·가격·스펙 정보를 표로 정리.")
    defs = DEFINITION_RE.findall(" ".join(paras[:6]))
    add("geo.definition", len(defs) >= 1, 3, "핵심 개념의 정의 문장('X란 ~입니다') 존재", fix="'○○란 ~를 말합니다.' 정의문 추가.")
    stats = STAT_RE.findall(text)
    add("geo.statistics", len(stats) >= 3, 5, f"구체 수치/통계 {len(stats)}개 (3개 이상) — 수치는 인용 확률을 높임",
        fix="출처 있는 수치·통계·가격·기간을 추가.")
    links = re.findall(r"\[([^\]]+)\]\((https?://[^)\s]+)\)", body)
    site = (meta.get("site_domain") or "").lower()
    ext = [u for _, u in links if not site or site not in u.lower()]
    internal = re.findall(r"\]\((/[^)\s]*)\)", body) + [u for _, u in links if site and site in u.lower()]
    add("geo.citations", len(ext) >= 2, 5, f"외부 출처 링크 {len(ext)}개 (2개 이상, 공신력 있는 1차 출처)", "critical",
        "통계·주장마다 공식 기관/1차 자료 링크를 다세요.")
    add("seo.internal_links", len(internal) >= 1 or meta.get("internal_links_todo"), 2,
        f"내부 링크 {len(internal)}개", fix="관련 글/클러스터 필러 페이지로 내부 링크 2–3개.")
    imgs = re.findall(r"!\[([^\]]*)\]\(([^)]+)\)", body)
    no_alt = [u for a, u in imgs if not a.strip()]
    add("seo.images", len(imgs) >= 1 or meta.get("cover"), 2, f"이미지 {len(imgs)}개", fix="대표 이미지/도식 추가 (네이버는 이미지 수가 체류에 영향).")
    add("seo.img_alt", not no_alt, 2, f"alt 없는 이미지 {len(no_alt)}개", fix="모든 이미지에 설명형 alt.")

    # ------------------------------------------------------------ FAQ & schema
    faq = meta.get("faq") or []
    add("geo.faq", len(faq) >= 3, 5, f"FAQ {len(faq)}개 (3개 이상, FAQPage 스키마 자동 생성)", fix="검색자가 실제로 묻는 질문 3–6개.")
    add("geo.faq_in_body", "자주 묻는 질문" in body or "FAQ" in body, 2, "본문에 FAQ 섹션 노출 (스키마만 있고 본문에 없으면 안 됨)",
        fix="본문 하단에 '## 자주 묻는 질문' 섹션 추가.")
    fresh = YEAR_RE.findall(title + " " + lead_text)
    add("geo.freshness", bool(fresh) or bool(meta.get("updated")), 2, "최신성 표기(연도 또는 updated)", fix="'2026년 기준' 등 기준 시점 명시.")

    # ------------------------------------------------------------ naver specifics
    if "naver" in (meta.get("channels") or []):
        tags = meta.get("tags") or []
        add("naver.tags", 3 <= len(tags) <= 10, 2, f"네이버 태그 {len(tags)}개 (3–10)", fix="태그 5–10개 지정.")
        kw_count = text.replace(" ", "").count(kw.replace(" ", "")) if kw else 0
        add("naver.kw_density", 3 <= kw_count <= 12, 3,
            f"본문 키워드 반복 {kw_count}회 (3–12회, 과도하면 저품질 판정 위험)", fix="키워드 반복 수 조정, 동의어 활용.")

    # ------------------------------------------------------------ editorial (config.editorial)
    max_sol = int(editorial.get("max_solutions") or 5)
    add("reader.audience", bool(meta.get("audience") or editorial.get("audience")), 3,
        "청중 정의(frontmatter audience 또는 config.editorial.audience)", "critical",
        "audience: '누가·언제·읽고 무엇을 할 수 있어야 하나' 한 문장 추가.")
    section, over = "", []
    for b in blocks:
        if b["type"] == "heading" and b["level"] == 2:
            section = b["text"]
        elif b["type"] == "list" and not any(k in section for k in SKIP_SECTIONS) and len(b["items"]) > max_sol:
            over.append(f"'{section or '도입부'}' {len(b['items'])}개")
    m_n = re.search(r"(\d+)\s*(가지|단계|개|원칙|팁|방법)", title)
    if m_n and int(m_n.group(1)) > max_sol:
        over.append(f"제목 {m_n.group(0)}")
    add("reader.solution_count", not over, 5,
        f"솔루션·목록은 손에 꼽을 개수(≤{max_sol}) — 초과: {', '.join(over) or '없음'}", "critical",
        "항목을 묶거나 덜 중요한 것을 빼서 3–5개로 줄이세요.")
    if editorial.get("require_recommended_books", True):
        min_books = int(editorial.get("min_recommended_books") or 2)
        book_items, section = [], ""
        for b in blocks:
            if b["type"] == "heading" and b["level"] == 2:
                section = b["text"]
            elif b["type"] == "list" and BOOK_SECTION in section:
                book_items += [it["text"] for it in b["items"]]
        linked = [t for t in book_items if STORE_RE.search(t)]
        add("reader.recommended_books", len(linked) >= min_books, 6,
            f"'## {BOOK_SECTION}' {len(book_items)}권, 구매 링크 있는 책 {len(linked)}권 (≥{min_books})", "critical",
            "추천 도서 2–3권을 저자·출판사·ISBN·추천 이유·구매 링크(알라딘/예스24/교보)와 함께 추가.")

    # ------------------------------------------------------------ scoring
    total = sum(r["weight"] for r in results)
    got = sum(r["weight"] for r in results if r["pass"])
    score = round(got / total * 100) if total else 0
    critical_fail = [r for r in results if not r["pass"] and r["severity"] == "critical"]
    return {
        "file": path, "score": score, "threshold": threshold,
        "passed": score >= threshold and not critical_fail,
        "stats": {"chars": n, "h2": len(h2), "lists": len(lists), "tables": len(tables), "faq": len(faq),
                  "external_links": len(ext), "statistics": len(stats)},
        "failures": [r for r in results if not r["pass"]],
        "checks": results,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("article")
    ap.add_argument("--threshold", type=int, default=80)
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--out")
    ap.add_argument("--config", default=None, help="geo-seo.config.json (기본: 현재 폴더)")
    a = ap.parse_args()
    rep = check(a.article, a.threshold, a.config)
    if a.out:
        with open(a.out, "w", encoding="utf-8") as f:
            json.dump(rep, f, ensure_ascii=False, indent=2)
    if a.json:
        print(json.dumps(rep, ensure_ascii=False, indent=2))
    else:
        print(f"점수 {rep['score']}/100 (기준 {rep['threshold']}) → {'통과' if rep['passed'] else '보완 필요'}")
        print("통계:", json.dumps(rep["stats"], ensure_ascii=False))
        for r in rep["failures"]:
            mark = "‼" if r["severity"] == "critical" else "-"
            print(f" {mark} [{r['id']}] {r['message']}\n     → {r['fix']}")
    sys.exit(0 if rep["passed"] else 1)


if __name__ == "__main__":
    main()
