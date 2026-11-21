#!/usr/bin/env python3
"""Build static column pages for the site (run from the project root).

  python3 tools/geo-seo/scripts/build_site.py                 # 발행본 전체 → public/
  python3 tools/geo-seo/scripts/build_site.py --preview <slug> # 초안 미리보기 → .studio/preview/<slug>/
  python3 tools/geo-seo/scripts/build_site.py --list           # 칼럼 목록 JSON (스튜디오용)

Input : content/column/<slug>/article.md (frontmatter status: draft | published), images/ 폴더
Config: content/geo-seo.config.json
Output (발행본만, status: published):
  public/column/<slug>/index.html (+ images/)   검색엔진이 바로 읽는 완성 HTML
  public/column/index.html                      칼럼 목록
  public/sitemap.xml · public/rss.xml · public/robots.txt
"""
from __future__ import annotations

import argparse
import datetime as dt
import html
import json
import os
import re
import shutil
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, "lib"))
from mdkit import load_article  # noqa: E402
from render_page import DEFAULT_DESIGN, PAGE_CSS, build, css  # noqa: E402

e = html.escape
CONTENT = os.path.join("content", "column")
PUBLIC = "public"
PREVIEW = os.path.join(".studio", "preview")


def load_cfg():
    p = os.path.join("content", "geo-seo.config.json")
    return json.load(open(p, encoding="utf-8")) if os.path.exists(p) else {}


def articles():
    out = []
    if not os.path.isdir(CONTENT):
        return out
    for slug in sorted(os.listdir(CONTENT)):
        path = os.path.join(CONTENT, slug, "article.md")
        if not os.path.isfile(path):
            continue
        meta, body = load_article(path)
        audit_p = os.path.join(CONTENT, slug, "audit.json")
        audit = json.load(open(audit_p, encoding="utf-8")) if os.path.exists(audit_p) else {}
        todos = re.findall(r"<!--\s*TODO\s*:\s*(.*?)\s*-->", body, re.S)
        out.append({"slug": meta.get("slug") or slug, "dir": slug, "path": path, "meta": meta,
                    "status": meta.get("status", "draft"), "title": meta.get("title", slug),
                    "description": meta.get("description", ""), "date": str(meta.get("date", "")),
                    "updated": str(meta.get("updated", meta.get("date", ""))),
                    "score": audit.get("score"), "passed": audit.get("passed"),
                    "todos": todos, "author": meta.get("author", "")})
    return sorted(out, key=lambda a: a["date"], reverse=True)


def col_base(cfg):
    return "/" + (cfg.get("column_path") or "/column/").strip("/") + "/"


def copy_images(a, dest):
    src = os.path.join(CONTENT, a["dir"], "images")
    if os.path.isdir(src):
        shutil.copytree(src, os.path.join(dest, "images"), dirs_exist_ok=True)


def related_for(a, published, cfg, n=3):
    base = col_base(cfg)
    tags = set(map(str, a["meta"].get("tags") or []))
    others = [p for p in published if p["slug"] != a["slug"]]
    others.sort(key=lambda p: -len(tags & set(map(str, p["meta"].get("tags") or []))))
    return [(p["title"], f"{base}{p['slug']}/") for p in others[:n]]


def index_page(published, cfg):
    d = {**DEFAULT_DESIGN, **(cfg.get("design") or {})}
    brand = d.get("brand_name") or cfg.get("brand", "")
    base = col_base(cfg)
    site = cfg.get("site_url", "").rstrip("/")
    nav = "".join(f'<a href="{e(n["url"])}">{e(n["label"])}</a>' for n in d.get("nav") or [])
    cards = "".join(f'''<a class="ci-card" href="{base}{e(a["slug"])}/"><p class="ci-date">{e(a["date"])}</p>
<h2>{e(a["title"])}</h2><p class="ci-desc">{e(a["description"])}</p><span class="ci-more">읽기 →</span></a>''' for a in published)
    empty = '<p class="ci-empty">아직 발행된 칼럼이 없습니다.</p>' if not published else ""
    jsonld = json.dumps({"@context": "https://schema.org", "@type": "Blog", "name": f"{brand} 컬럼",
                         "url": f"{site}{base}", "blogPost": [{"@type": "BlogPosting", "headline": a["title"],
                         "url": f"{site}{base}{a['slug']}/", "datePublished": a["date"]} for a in published]}, ensure_ascii=False)
    gtm = cfg.get("gtm_id", "")
    gtm_head = (f"<script>(function(w,d,s,l,i){{w[l]=w[l]||[];w[l].push({{'gtm.start':new Date().getTime(),event:'gtm.js'}});"
                f"var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;"
                f"j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);}})"
                f"(window,document,'script','dataLayer','{e(gtm)}');</script>") if gtm else ""
    desc = f"{brand} 코치진이 쓰는 연기·입시 칼럼. 대본 분석, 실기 준비, 오디션 팁을 정리합니다."
    return f"""<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>컬럼 | {e(cfg.get('brand', brand))}</title><meta name="description" content="{e(desc)}">
<meta name="robots" content="index, follow">{gtm_head}<link rel="icon" type="image/png" href="/favicon.png">
<link rel="canonical" href="{e(site + base)}"><link rel="alternate" type="application/rss+xml" title="{e(brand)} 컬럼" href="{e(site)}/rss.xml">
<meta property="og:type" content="website"><meta property="og:title" content="컬럼 | {e(cfg.get('brand', brand))}"><meta property="og:description" content="{e(desc)}">
<link rel="stylesheet" href="{e(d['font_css'])}"><style>{css(d)}</style><style>{PAGE_CSS}
.ci-wrap{{max-width:1120px;margin:0 auto;padding:48px 20px 80px}} .ci-eyebrow{{font-size:12px;letter-spacing:.14em;color:var(--gs-accent);font-weight:700;margin:0 0 8px}}
.ci-title{{font-size:clamp(28px,4vw,40px);font-weight:900;margin:0 0 10px;letter-spacing:-.02em}} .ci-lead{{color:var(--gs-muted);margin:0 0 32px;word-break:keep-all}}
.ci-grid{{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(300px,1fr))}}
.ci-card{{display:flex;flex-direction:column;gap:8px;padding:24px;border:1px solid var(--gs-line);border-radius:var(--gs-radius);background:var(--gs-surface);color:var(--gs-text);text-decoration:none;transition:border-color .2s}}
.ci-card:hover{{border-color:var(--gs-accent)}} .ci-card h2{{font-size:19px;line-height:1.45;margin:0;word-break:keep-all}}
.ci-date{{font-size:12px;color:var(--gs-muted);margin:0}} .ci-desc{{font-size:14.5px;color:var(--gs-muted);margin:0;line-height:1.65;word-break:keep-all}}
.ci-more{{margin-top:auto;font-size:13px;font-weight:700;color:var(--gs-primary)}} .ci-empty{{color:var(--gs-muted)}}
</style><script type="application/ld+json">{jsonld}</script></head>
<body class="gs-article" style="font-size:16px"><header class="pg-header"><div class="pg-header__in"><a class="pg-logo" href="/"><span class="pg-wordmark">{e(brand)}</span></a><nav class="pg-nav">{nav}</nav></div></header>
<main class="ci-wrap"><p class="ci-eyebrow">COLUMN</p><h1 class="ci-title">컬럼</h1><p class="ci-lead">{e(desc)}</p>
<div class="ci-grid">{cards}</div>{empty}</main>
<footer class="pg-footer">{e(d.get('footer_text') or brand)}</footer></body></html>"""


def sitemap(published, cfg):
    site = cfg.get("site_url", "").rstrip("/")
    base = col_base(cfg)
    today = dt.date.today().isoformat()
    urls = [(f"{site}/", today), (f"{site}{base}", published[0]["updated"] if published else today)]
    urls += [(f"{site}{base}{a['slug']}/", a["updated"]) for a in published]
    body = "".join(f"<url><loc>{e(u)}</loc><lastmod>{e(m)}</lastmod></url>" for u, m in urls)
    return f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{body}</urlset>\n'


def rss(published, cfg):
    site = cfg.get("site_url", "").rstrip("/")
    base = col_base(cfg)
    brand = cfg.get("brand", "")

    def rfc(d):
        try:
            return dt.datetime.fromisoformat(d).strftime("%a, %d %b %Y 09:00:00 +0900")
        except ValueError:
            return ""
    items = "".join(f"""<item><title>{e(a['title'])}</title><link>{e(site + base + a['slug'])}/</link><guid>{e(site + base + a['slug'])}/</guid>
<description>{e(a['description'])}</description><pubDate>{rfc(a['date'])}</pubDate></item>""" for a in published[:30])
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>{e(brand)} 컬럼</title><link>{e(site + base)}</link><description>{e(brand)} 연기·입시 칼럼</description><language>ko</language>
{items}</channel></rss>
"""


ROBOTS = """User-agent: *
Allow: /
Disallow: /admin
Disallow: /coach
Disallow: /my
Disallow: /__studio

# AI 검색 수집기 허용 (ChatGPT·Claude·Perplexity 답변에 인용되려면 필요)
User-agent: GPTBot
Allow: /
User-agent: OAI-SearchBot
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: PerplexityBot
Allow: /

Sitemap: {site}/sitemap.xml
"""


def build_all(cfg):
    all_a = articles()
    published = [a for a in all_a if a["status"] == "published"]
    base_dir = os.path.join(PUBLIC, (cfg.get("column_path") or "/column/").strip("/"))
    # 발행 취소된 글의 오래된 페이지 정리
    if os.path.isdir(base_dir):
        keep = {a["slug"] for a in published}
        for name in os.listdir(base_dir):
            if os.path.isdir(os.path.join(base_dir, name)) and name not in keep:
                shutil.rmtree(os.path.join(base_dir, name))
    os.makedirs(base_dir, exist_ok=True)
    for a in published:
        dest = os.path.join(base_dir, a["slug"])
        os.makedirs(dest, exist_ok=True)
        build(a["path"], cfg, out_dir=dest, page_name="index.html", final=True,
              related_links=related_for(a, published, cfg), write_spec=False)
        copy_images(a, dest)
    open(os.path.join(base_dir, "index.html"), "w", encoding="utf-8").write(index_page(published, cfg))
    open(os.path.join(PUBLIC, "sitemap.xml"), "w", encoding="utf-8").write(sitemap(published, cfg))
    open(os.path.join(PUBLIC, "rss.xml"), "w", encoding="utf-8").write(rss(published, cfg))
    robots_p = os.path.join(PUBLIC, "robots.txt")
    if not os.path.exists(robots_p):
        open(robots_p, "w", encoding="utf-8").write(ROBOTS.format(site=cfg.get("site_url", "").rstrip("/")))
    print(f"발행 칼럼 {len(published)}편 → {base_dir}/ · sitemap.xml · rss.xml")
    return published


def build_preview(cfg, slug):
    a = next((x for x in articles() if x["slug"] == slug or x["dir"] == slug), None)
    if not a:
        sys.exit(f"칼럼을 찾지 못했습니다: {slug}")
    dest = os.path.join(PREVIEW, a["slug"])
    os.makedirs(dest, exist_ok=True)
    _, holes, _ = build(a["path"], cfg, out_dir=dest, page_name="index.html", noindex=True, final=False)
    copy_images(a, dest)
    print(f"미리보기 → {dest}/index.html")
    for s, k, t in holes:
        print(f"  채울 자리 [{s}] {t}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--preview")
    ap.add_argument("--list", action="store_true")
    a = ap.parse_args()
    cfg = load_cfg()
    if a.list:
        print(json.dumps([{k: v for k, v in x.items() if k not in ("meta", "path")} for x in articles()], ensure_ascii=False))
    elif a.preview:
        build_preview(cfg, a.preview)
    else:
        build_all(cfg)


if __name__ == "__main__":
    main()
