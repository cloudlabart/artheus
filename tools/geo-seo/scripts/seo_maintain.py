#!/usr/bin/env python3
"""정기 SEO 점검 (프로젝트 루트에서 실행). GitHub Actions 주간 작업과 스튜디오 [SEO 점검] 버튼이 사용.

  python3 tools/geo-seo/scripts/seo_maintain.py [--check-links] [--gsc content/data/gsc.csv] [--gsc-prev content/data/gsc_prev.csv]

점검 항목 (발행된 칼럼 기준)
  1. 검색 성과   GSC 최근 기간 vs 이전 기간: 클릭·노출·평균 순위 변화, 4–20위 검색어
  2. 빠진 검색어  칼럼이 노출되는 검색어 중 본문에 없는 말 → 보강 섹션·FAQ 후보
  3. 최신성      마지막 수정 후 경과일(config.maintenance.refresh_after_days), 제목의 지난 연도
  4. 품질        seo_lint 점수 재측정 (규칙 변경 반영)
  5. 링크        외부·구매 링크 상태 (--check-links)
  6. 사이트      발행 페이지·canonical·구조화 데이터·사이트맵 누락
  7. 새 주제      칼럼이 다루지 않는 검색어 (신규 칼럼 후보)

출력: content/reports/latest.json, content/reports/seo-YYYY-MM-DD.md
      (GitHub Actions 에서는 작업 요약 화면에도 표시)
보강 우선순위(refresh_candidates)는 월간 자동 보강 작업과 스튜디오가 읽습니다.
"""
from __future__ import annotations

import argparse
import concurrent.futures as cf
import datetime as dt
import json
import os
import re
import sys
import urllib.error
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, "lib"))
from build_site import articles, col_base, load_cfg  # noqa: E402
from gsc_opportunities import QUESTION_RE, aggregate, load as load_gsc, tokens  # noqa: E402
from mdkit import strip_md  # noqa: E402
from seo_lint import check as lint_check  # noqa: E402

REPORTS = os.path.join("content", "reports")
TODAY = dt.date.today()


def norm(u: str) -> str:
    return re.sub(r"^https?://(www\.)?", "", u.strip().lower()).rstrip("/")


def page_stats(rows, url):
    key = norm(url)
    sel = [r for r in rows if norm(r["page"]) == key]
    clicks = sum(r["clicks"] for r in sel)
    impr = sum(r["impressions"] for r in sel)
    pos = (sum(r["position"] * r["impressions"] for r in sel) / impr) if impr else None
    return {"clicks": int(clicks), "impressions": int(impr), "position": round(pos, 1) if pos else None}, sel


def check_link(u):
    req = urllib.request.Request(u, method="HEAD", headers={"User-Agent": "Mozilla/5.0 (compatible; artheus-seo-check)"})
    try:
        with urllib.request.urlopen(req, timeout=12) as r:
            return u, r.status
    except urllib.error.HTTPError as e:
        if e.code in (403, 405, 429):  # 일부 서점은 HEAD/봇을 막음 → GET 한 번 더
            try:
                with urllib.request.urlopen(urllib.request.Request(u, headers=req.headers), timeout=12) as r:
                    return u, r.status
            except urllib.error.HTTPError as e2:
                return u, e2.code
            except Exception:
                return u, e.code
        return u, e.code
    except Exception as ex:
        return u, f"error: {type(ex).__name__}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--gsc", default=os.path.join("content", "data", "gsc.csv"))
    ap.add_argument("--gsc-prev", default=os.path.join("content", "data", "gsc_prev.csv"))
    ap.add_argument("--check-links", action="store_true")
    ap.add_argument("--quiet", action="store_true")
    a = ap.parse_args()

    cfg = load_cfg()
    mcfg = {"refresh_after_days": 120, "min_impressions": 20, "max_candidates": 5, **(cfg.get("maintenance") or {})}
    site = cfg.get("site_url", "").rstrip("/")
    base = col_base(cfg)
    all_a = articles()
    published = [x for x in all_a if x["status"] == "published"]

    cur = load_gsc(a.gsc) if os.path.exists(a.gsc) else []
    prev = load_gsc(a.gsc_prev) if os.path.exists(a.gsc_prev) else []
    has_gsc = bool(cur)

    sitemap = open(os.path.join("public", "sitemap.xml"), encoding="utf-8").read() if os.path.exists(os.path.join("public", "sitemap.xml")) else ""
    site_issues, columns = [], []
    link_targets = {}

    for x in published:
        url = f"{site}{base}{x['slug']}/"
        meta = x["meta"]
        body = open(x["path"], encoding="utf-8").read()
        text = strip_md(body).replace(" ", "").lower()
        reasons, score = [], 0

        # 4. 품질
        lint = lint_check(x["path"])
        if not lint["passed"]:
            reasons.append(f"검수 {lint['score']}점(미달): " + ", ".join(f["id"] for f in lint["failures"] if f["severity"] == "critical")[:120])
            score += 30
        # 3. 최신성
        try:
            age = (TODAY - dt.date.fromisoformat(x["updated"])).days
        except ValueError:
            age = None
        if age is not None and age >= mcfg["refresh_after_days"]:
            reasons.append(f"마지막 수정 {age}일 전")
            score += min(30, age // 10)
        old_years = [y for y in re.findall(r"20\d{2}", x["title"]) if int(y) < TODAY.year]
        if old_years:
            reasons.append(f"제목에 지난 연도({', '.join(old_years)})")
            score += 25
        # 1·2. 검색 성과
        perf = None
        missing = []
        if has_gsc:
            now, rows = page_stats(cur, url)
            before, _ = page_stats(prev, url) if prev else ({"clicks": 0, "impressions": 0, "position": None}, [])
            perf = {"now": now, "before": before}
            if prev and before["clicks"] >= 10 and now["clicks"] < before["clicks"] * 0.7:
                reasons.append(f"클릭 감소 {before['clicks']}→{now['clicks']}")
                score += 25
            if now["position"] and before["position"] and now["position"] - before["position"] >= 3:
                reasons.append(f"평균 순위 하락 {before['position']}→{now['position']}")
                score += 20
            qs = [q for q in aggregate(rows) if q["impressions"] >= mcfg["min_impressions"]]
            striking = [q for q in qs if 4 <= q["position"] <= 20]
            if striking:
                reasons.append(f"4–20위 검색어 {len(striking)}개 (1페이지 상단 진입 여지)")
                score += min(25, 5 * len(striking))
            missing = [q["query"] for q in sorted(qs, key=lambda q: -q["impressions"])
                       if q["query"].replace(" ", "").lower() not in text][:8]
            if missing:
                reasons.append("본문에 없는 노출 검색어: " + ", ".join(missing[:4]))
                score += min(15, 3 * len(missing))
        # 6. 사이트
        page = os.path.join("public", base.strip("/"), x["slug"], "index.html")
        if not os.path.exists(page):
            site_issues.append(f"{x['slug']}: 발행 페이지 없음 (build_site.py 실행 필요)")
        else:
            h = open(page, encoding="utf-8").read()
            if 'rel="canonical"' not in h or "application/ld+json" not in h:
                site_issues.append(f"{x['slug']}: canonical 또는 구조화 데이터 누락")
            if "noindex" in h:
                site_issues.append(f"{x['slug']}: 발행 페이지에 noindex")
        if sitemap and url not in sitemap:
            site_issues.append(f"{x['slug']}: 사이트맵에 없음")
        # 5. 링크 수집
        for u in re.findall(r"\]\((https?://[^)\s]+)\)", body):
            link_targets.setdefault(u, []).append(x["slug"])
        columns.append({"slug": x["slug"], "title": x["title"], "url": url, "updated": x["updated"], "age_days": age,
                        "lint": lint["score"], "performance": perf, "missing_queries": missing,
                        "reasons": reasons, "priority": score})

    broken = []
    if a.check_links and link_targets:
        with cf.ThreadPoolExecutor(8) as ex:
            for u, st in ex.map(check_link, list(link_targets)):
                if not (isinstance(st, int) and st < 400):
                    broken.append({"url": u, "status": st, "columns": link_targets[u]})
        for b in broken:
            for c in columns:
                if c["slug"] in b["columns"]:
                    c["reasons"].append(f"깨진 링크 {b['status']}: {b['url'][:70]}")
                    c["priority"] += 15

    # 7. 새 주제 (칼럼이 다루지 않는 검색어)
    new_topics = []
    if has_gsc:
        covered = [tokens(x["title"] + " " + str(x["meta"].get("primary_keyword", ""))) for x in all_a]
        for q in sorted(aggregate(cur), key=lambda q: -q["impressions"]):
            if q["impressions"] < mcfg["min_impressions"] or base in q["page"]:
                continue
            tq = tokens(q["query"])
            if any(len(tq & c) / max(1, len(tq)) >= 0.5 for c in covered):
                continue
            new_topics.append({"query": q["query"], "impressions": q["impressions"], "position": q["position"],
                               "question": bool(QUESTION_RE.search(q["query"]))})
            if len(new_topics) >= 8:
                break

    columns.sort(key=lambda c: -c["priority"])
    candidates = [c["slug"] for c in columns if c["priority"] >= 20][: mcfg["max_candidates"]]
    totals = None
    if has_gsc:
        col_rows = [r for r in cur if base in r["page"]]
        totals = {"clicks": int(sum(r["clicks"] for r in col_rows)), "impressions": int(sum(r["impressions"] for r in col_rows))}
    report = {"date": TODAY.isoformat(), "gsc": has_gsc, "gsc_compare": bool(prev), "links_checked": a.check_links,
              "published": len(published), "drafts": len(all_a) - len(published), "column_totals": totals,
              "refresh_candidates": candidates, "columns": columns, "broken_links": broken,
              "site_issues": site_issues, "new_topics": new_topics}

    os.makedirs(REPORTS, exist_ok=True)
    json.dump(report, open(os.path.join(REPORTS, "latest.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    md = to_markdown(report)
    open(os.path.join(REPORTS, f"seo-{TODAY.isoformat()}.md"), "w", encoding="utf-8").write(md)
    if os.environ.get("GITHUB_STEP_SUMMARY"):
        open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8").write(md)
    if os.environ.get("GITHUB_OUTPUT"):
        open(os.environ["GITHUB_OUTPUT"], "a").write(f"candidates={' '.join(candidates)}\n")
    if not a.quiet:
        print(md)


def to_markdown(r):
    L = [f"# SEO 점검 리포트 · {r['date']}", ""]
    L.append(f"- 발행 칼럼 {r['published']}편 · 초안 {r['drafts']}편 · Search Console {'연결됨' if r['gsc'] else '데이터 없음'}"
             + (f" · 칼럼 클릭 {r['column_totals']['clicks']} / 노출 {r['column_totals']['impressions']}" if r["column_totals"] else ""))
    L.append(f"- 보강 추천: {', '.join(r['refresh_candidates']) or '없음'}")
    L.append("")
    if r["columns"]:
        L += ["## 칼럼별 상태 (보강 우선순위 순)", "", "| 우선 | 칼럼 | 검수 | 수정 후 | 클릭(이전→최근) | 순위 | 할 일 |", "|---|---|---|---|---|---|---|"]
        for c in r["columns"]:
            p = c["performance"]
            clicks = f"{p['before']['clicks']}→{p['now']['clicks']}" if p else "-"
            pos = f"{p['before']['position'] or '-'}→{p['now']['position'] or '-'}" if p else "-"
            L.append(f"| {c['priority']} | [{c['title']}]({c['url']}) | {c['lint']} | {c['age_days']}일 | {clicks} | {pos} | {'; '.join(c['reasons']) or '유지'} |")
        L.append("")
    if r["site_issues"]:
        L += ["## 사이트 문제", ""] + [f"- {s}" for s in r["site_issues"]] + [""]
    if r["broken_links"]:
        L += ["## 깨진 링크", ""] + [f"- {b['status']} · {b['url']} ({', '.join(b['columns'])})" for b in r["broken_links"]] + [""]
    if r["new_topics"]:
        L += ["## 새 칼럼 후보 (아직 다루지 않는 검색어)", "", "| 검색어 | 노출 | 현재 순위 |", "|---|---|---|"]
        L += [f"| {t['query']} | {t['impressions']} | {t['position']} |" for t in r["new_topics"]] + [""]
    if not r["gsc"]:
        L += ["> Search Console 데이터가 없어 검색 성과는 점검하지 않았습니다. GitHub Secrets에 `GSC_SA_KEY`를 넣거나, 스튜디오 칼럼 탭에서 CSV를 올리세요.", ""]
    return "\n".join(L)


if __name__ == "__main__":
    main()
