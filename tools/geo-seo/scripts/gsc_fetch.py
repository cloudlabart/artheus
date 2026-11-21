#!/usr/bin/env python3
"""Fetch Google Search Console search analytics (query x page) to a normalized CSV.

Auth (first match wins):
  1. env GSC_ACCESS_TOKEN                      (OAuth access token with webmasters.readonly scope)
  2. `gcloud auth application-default print-access-token`
     (one-time: gcloud auth application-default login \
        --scopes=https://www.googleapis.com/auth/webmasters.readonly,https://www.googleapis.com/auth/cloud-platform)

Alternatives without API access:
  - Windsor.ai / Supermetrics connector (google-search-console skill) -> save rows as CSV/JSON
  - GSC UI: 실적 > 내보내기 > CSV (Queries.csv)
  Both can be fed straight into gsc_opportunities.py.

Usage:
  python3 scripts/gsc_fetch.py --site sc-domain:example.com --days 90 --out data/gsc.csv
"""
from __future__ import annotations

import argparse
import csv
import datetime as dt
import json
import os
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request

API = "https://www.googleapis.com/webmasters/v3/sites/{site}/searchAnalytics/query"


def token() -> str:
    t = os.environ.get("GSC_ACCESS_TOKEN")
    if t:
        return t.strip()
    try:
        return subprocess.check_output(["gcloud", "auth", "application-default", "print-access-token"],
                                       text=True, stderr=subprocess.DEVNULL).strip()
    except Exception:
        sys.exit("인증 토큰이 없습니다. GSC_ACCESS_TOKEN을 설정하거나 gcloud ADC 로그인을 하세요 (스크립트 상단 참고).")


def query(site: str, start: str, end: str, dims: list[str], country: str | None, tok: str):
    rows, start_row = [], 0
    while True:
        body = {"startDate": start, "endDate": end, "dimensions": dims, "rowLimit": 25000,
                "startRow": start_row, "dataState": "final"}
        if country:
            body["dimensionFilterGroups"] = [{"filters": [{"dimension": "country", "operator": "equals",
                                                           "expression": country}]}]
        req = urllib.request.Request(API.format(site=urllib.parse.quote(site, safe="")),
                                     data=json.dumps(body).encode(), method="POST",
                                     headers={"Authorization": f"Bearer {tok}", "Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                data = json.load(r)
        except urllib.error.HTTPError as e:
            sys.exit(f"GSC API 오류 {e.code}: {e.read().decode()[:500]}")
        batch = data.get("rows", [])
        rows += batch
        if len(batch) < 25000:
            return rows
        start_row += 25000


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--site", required=True, help="sc-domain:example.com 또는 https://example.com/")
    ap.add_argument("--days", type=int, default=90)
    ap.add_argument("--country", default=None, help="ISO-3166 alpha-3, 예: kor")
    ap.add_argument("--out", default="data/gsc.csv")
    ap.add_argument("--end-offset", type=int, default=0, help="이 일수만큼 이전 기간 (전 기간 비교용, 예: 28)")
    a = ap.parse_args()
    end = dt.date.today() - dt.timedelta(days=3 + a.end_offset)  # GSC final data lag
    start = end - dt.timedelta(days=a.days)
    rows = query(a.site, start.isoformat(), end.isoformat(), ["query", "page"], a.country, token())
    os.makedirs(os.path.dirname(a.out) or ".", exist_ok=True)
    with open(a.out, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["query", "page", "clicks", "impressions", "ctr", "position"])
        for r in rows:
            q, p = r["keys"]
            w.writerow([q, p, r["clicks"], r["impressions"], round(r["ctr"], 4), round(r["position"], 2)])
    print(f"{len(rows)}행 저장 → {a.out} ({start}~{end})")


if __name__ == "__main__":
    main()
