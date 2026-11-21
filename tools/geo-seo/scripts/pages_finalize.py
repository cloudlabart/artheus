#!/usr/bin/env python3
"""GitHub Pages 배포 직전 마무리.  python3 tools/geo-seo/scripts/pages_finalize.py dist

- SEARCH_INDEXING 이 "on" 이 아니면: 모든 HTML 을 noindex 로, robots.txt 를 전체 차단으로 (미리보기 주소 보호)
- 404.html = index.html (잘못된 주소로 들어와도 홈이 보이게), .nojekyll
- PAGES_DOMAIN 이 있으면 CNAME 파일 기록 (참고용, 실제 도메인은 Settings › Pages 에서 지정)
"""
import os
import re
import shutil
import sys

dist = sys.argv[1] if len(sys.argv) > 1 else "dist"
indexing = os.environ.get("SEARCH_INDEXING", "").strip().lower() == "on"
domain = os.environ.get("PAGES_DOMAIN", "").strip()

if not indexing:
    n = 0
    for root, _, files in os.walk(dist):
        for f in files:
            if f.endswith(".html"):
                p = os.path.join(root, f)
                s = open(p, encoding="utf-8").read()
                s2, k = re.subn(r'<meta name="robots" content="[^"]*"\s*/?>', '<meta name="robots" content="noindex, nofollow">', s)
                if not k:
                    s2 = s.replace("<head>", '<head><meta name="robots" content="noindex, nofollow">', 1)
                if s2 != s:
                    open(p, "w", encoding="utf-8").write(s2)
                    n += 1
    open(os.path.join(dist, "robots.txt"), "w").write("User-agent: *\nDisallow: /\n")
    print(f"검색 제외 모드: HTML {n}개 noindex, robots.txt 전체 차단 (SEARCH_INDEXING=on 으로 해제)")
else:
    print("검색 허용 모드")

shutil.copyfile(os.path.join(dist, "index.html"), os.path.join(dist, "404.html"))
open(os.path.join(dist, ".nojekyll"), "w").close()
if domain:
    open(os.path.join(dist, "CNAME"), "w").write(domain + "\n")
print(f"배포 도메인: {domain or '(미설정 — 배포 건너뜀)'}")
