#!/usr/bin/env python3
"""Turn Search Console rows into prioritized content opportunities.

Input: CSV or JSON with columns query[,page],clicks,impressions,ctr,position.
Accepts gsc_fetch.py output, GSC UI export (English or Korean headers), or connector dumps.

Opportunity types:
  striking   순위 4–20위, 노출 충분 → 기존 글 보강(리라이트)로 1페이지 상단 진입
  low_ctr    순위 1–5위인데 CTR이 기대치의 절반 이하 → 제목/메타 설명 개선
  question   질문형 검색어 → FAQ 추가 또는 GEO형 답변 글 신규
  new_topic  노출은 있는데 순위 20위 밖 → 전용 신규 글
  cannibal   한 검색어에 2개 이상 URL이 경쟁 → 통합/정규화
Also clusters queries into topic groups (token overlap) for a content calendar.

Usage:
  python3 scripts/gsc_opportunities.py data/gsc.csv --min-impr 50 --out data/opportunities.json
"""
from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from collections import defaultdict

# Approximate organic CTR by position (Korean+global blended, conservative)
EXPECTED_CTR = {1: .28, 2: .15, 3: .10, 4: .07, 5: .05, 6: .04, 7: .03, 8: .025, 9: .02, 10: .018}
QUESTION_RE = re.compile(r"(\?|까요|나요|인가요|하는법|하는 법|방법|뜻|의미|이란|란\b|차이|비교|추천|후기|가격|비용|얼마|어떻게|왜|언제|어디|무엇|뭐|how|what|why|which|best|vs)")
HEADER_MAP = {
    "query": "query", "top queries": "query", "인기 검색어": "query", "검색어": "query", "쿼리": "query", "keys": "query",
    "page": "page", "top pages": "page", "인기 페이지": "page", "페이지": "page", "url": "page",
    "clicks": "clicks", "클릭수": "clicks", "클릭": "clicks",
    "impressions": "impressions", "노출수": "impressions", "노출": "impressions",
    "ctr": "ctr", "position": "position", "게재순위": "position", "평균 게재순위": "position", "순위": "position",
}
STOP = {"방법", "추천", "후기", "가격", "비용", "뜻", "차이", "비교", "하는법", "the", "a", "for", "of", "in", "and", "2024", "2025", "2026"}


def num(v):
    if v is None or v == "":
        return 0.0
    s = str(v).replace(",", "").strip()
    pct = s.endswith("%")
    s = s.rstrip("%")
    try:
        f = float(s)
    except ValueError:
        return 0.0
    return f / 100 if pct else f


def load(path: str):
    if path.endswith(".json"):
        data = json.load(open(path, encoding="utf-8"))
        data = data.get("rows", data.get("data", data)) if isinstance(data, dict) else data
        raw = data
    else:
        with open(path, encoding="utf-8-sig") as f:
            raw = list(csv.DictReader(f))
    rows = []
    for r in raw:
        n = {}
        for k, v in r.items():
            key = HEADER_MAP.get(str(k).strip().lower(), HEADER_MAP.get(str(k).strip()))
            if key:
                n[key] = v
        if isinstance(n.get("query"), list):  # API style keys
            keys = n["query"]
            n["query"], n["page"] = keys[0], keys[1] if len(keys) > 1 else ""
        if not n.get("query"):
            continue
        ctr = num(n.get("ctr"))
        if ctr > 1:
            ctr /= 100
        rows.append({"query": str(n["query"]).strip(), "page": str(n.get("page", "")).strip(),
                     "clicks": num(n.get("clicks")), "impressions": num(n.get("impressions")),
                     "ctr": ctr, "position": num(n.get("position"))})
    return rows


def aggregate(rows):
    """query-level rollup; keep best page + page list."""
    by_q = defaultdict(lambda: {"clicks": 0, "impressions": 0, "pos_w": 0.0, "pages": defaultdict(float)})
    for r in rows:
        a = by_q[r["query"]]
        a["clicks"] += r["clicks"]
        a["impressions"] += r["impressions"]
        a["pos_w"] += r["position"] * r["impressions"]
        if r["page"]:
            a["pages"][r["page"]] += r["impressions"]
    out = []
    for q, a in by_q.items():
        imp = a["impressions"] or 1
        pages = sorted(a["pages"].items(), key=lambda x: -x[1])
        out.append({"query": q, "clicks": int(a["clicks"]), "impressions": int(a["impressions"]),
                    "ctr": round(a["clicks"] / imp, 4), "position": round(a["pos_w"] / imp, 1),
                    "page": pages[0][0] if pages else "", "pages": [p for p, _ in pages]})
    return out


def tokens(q):
    return {t for t in re.split(r"[\s\-_/]+", q.lower()) if t and t not in STOP and len(t) > 1}


def cluster(qs, min_overlap=0.5):
    clusters = []
    for q in sorted(qs, key=lambda x: -x["impressions"]):
        tq = tokens(q["query"])
        best, best_s = None, 0
        for c in clusters:
            inter = len(tq & c["tokens"])
            s = inter / max(1, min(len(tq), len(c["tokens"])))
            if s > best_s:
                best, best_s = c, s
        if best and best_s >= min_overlap:
            best["queries"].append(q["query"])
            best["impressions"] += q["impressions"]
            best["clicks"] += q["clicks"]
        else:
            clusters.append({"head": q["query"], "tokens": tq, "queries": [q["query"]],
                             "impressions": q["impressions"], "clicks": q["clicks"]})
    for c in clusters:
        c.pop("tokens")
    return sorted(clusters, key=lambda c: -c["impressions"])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("input")
    ap.add_argument("--min-impr", type=int, default=30)
    ap.add_argument("--top", type=int, default=30)
    ap.add_argument("--out", default=None)
    a = ap.parse_args()
    rows = load(a.input)
    if not rows:
        sys.exit("행이 없습니다. 헤더(query/clicks/impressions/ctr/position)를 확인하세요.")
    qs = [q for q in aggregate(rows) if q["impressions"] >= a.min_impr]
    opp = {"striking": [], "low_ctr": [], "question": [], "new_topic": [], "cannibal": []}
    for q in qs:
        pos, imp, ctr = q["position"], q["impressions"], q["ctr"]
        if 4 <= pos <= 20:
            gain = imp * max(0, EXPECTED_CTR[3] - ctr)
            opp["striking"].append({**q, "est_extra_clicks": round(gain), "action": "기존 글 보강: 하위 의도 섹션·표·FAQ·최신 수치 추가, 내부링크 강화"})
        if pos < 5.5:
            exp = EXPECTED_CTR.get(max(1, round(pos)), .05)
            if ctr < exp * 0.5:
                opp["low_ctr"].append({**q, "expected_ctr": exp, "est_extra_clicks": round(imp * (exp - ctr)),
                                       "action": "제목·메타 설명 리라이트 (숫자·연도·혜택, 검색어 정확 일치)"})
        if QUESTION_RE.search(q["query"]):
            opp["question"].append({**q, "action": "FAQ 항목 또는 답변 우선(Answer-first) 신규 글 — AI 검색 인용 타깃"})
        if pos > 20:
            opp["new_topic"].append({**q, "action": "전용 신규 글 작성 (현재 관련 없는 페이지가 노출 중)"})
        if len(q["pages"]) >= 2:
            opp["cannibal"].append({**q, "action": "대표 URL 하나로 통합(301/canonical) 또는 의도 분리"})
    for k in opp:
        key = "est_extra_clicks" if k in ("striking", "low_ctr") else "impressions"
        opp[k] = sorted(opp[k], key=lambda x: -x.get(key, 0))[:a.top]
    result = {"summary": {"queries": len(qs), **{k: len(v) for k, v in opp.items()}},
              "opportunities": opp, "clusters": cluster(qs)[:a.top]}
    txt = json.dumps(result, ensure_ascii=False, indent=2)
    if a.out:
        open(a.out, "w", encoding="utf-8").write(txt)
        print(f"저장 → {a.out}")
    print(json.dumps(result["summary"], ensure_ascii=False))
    for k, label in [("striking", "순위 4–20위 보강"), ("low_ctr", "CTR 개선"), ("question", "질문형"), ("new_topic", "신규 주제")]:
        print(f"\n## {label}")
        for x in opp[k][:8]:
            extra = f" +{x['est_extra_clicks']}클릭" if "est_extra_clicks" in x else ""
            print(f"  {x['query']} | 노출 {x['impressions']} | 순위 {x['position']} | CTR {x['ctr']:.1%}{extra}")


if __name__ == "__main__":
    main()
