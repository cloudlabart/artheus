#!/usr/bin/env python3
"""Publish a canonical article.md to WordPress / Naver Blog / Markdown(static site) / Notion.

  python3 scripts/publish.py <channel> content/articles/<slug>/article.md [--dry-run] [--config geo-seo.config.json]

channels:
  wordpress  REST API (Application Password). Draft by default; --status publish|future.
  naver      Naver has no public posting API -> writes paste-ready naver.html (inline styles),
             naver_copy.html (one-click copy page), naver.txt, and tag list.
  markdown   Writes .md with SSG frontmatter (hugo|astro|next|jekyll) into the configured dir; --git-commit optional.
  notion     Notion API fallback (prefer the Notion MCP connector when connected). Needs NOTION_TOKEN.

Secrets come only from env vars: WP_URL, WP_USER, WP_APP_PASSWORD, NOTION_TOKEN.
Each successful publish is appended to <article dir>/publish.json.
"""
from __future__ import annotations

import argparse
import base64
import datetime as dt
import json
import mimetypes
import os
import re
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "lib"))
sys.path.insert(0, os.path.dirname(__file__))
from mdkit import (build_jsonld, dump_frontmatter, jsonld_script, load_article,  # noqa: E402
                   notion_blocks, parse_frontmatter, render_html, strip_md)

ROOT = os.getcwd()


# ---------------------------------------------------------------- utils

def load_config(path):
    if path and os.path.exists(path):
        return json.load(open(path, encoding="utf-8"))
    return {}


def strip_h1(body: str) -> str:
    """CMS renders the title as H1; drop the first markdown H1 from the body."""
    return re.sub(r"^\s*#\s+.*\n", "", body, count=1)


def http(method, url, headers=None, data=None, raw=None):
    body = raw if raw is not None else (json.dumps(data).encode() if data is not None else None)
    h = {"Accept": "application/json", "User-Agent": "geo-seo-publisher/0.1"}
    if data is not None:
        h["Content-Type"] = "application/json"
    h.update(headers or {})
    req = urllib.request.Request(url, data=body, method=method, headers=h)
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            txt = r.read().decode()
            return json.loads(txt) if txt else {}
    except urllib.error.HTTPError as e:
        sys.exit(f"{method} {url} → HTTP {e.code}: {e.read().decode()[:800]}")


def log_publish(article_path, channel, info):
    p = os.path.join(os.path.dirname(article_path), "publish.json")
    data = json.load(open(p, encoding="utf-8")) if os.path.exists(p) else {}
    info["at"] = dt.datetime.now().isoformat(timespec="seconds")
    data[channel] = info
    json.dump(data, open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=2)


def prior(article_path, channel):
    p = os.path.join(os.path.dirname(article_path), "publish.json")
    if os.path.exists(p):
        return json.load(open(p, encoding="utf-8")).get(channel, {})
    return {}


def env(name, required=True):
    v = os.environ.get(name, "").strip()
    if required and not v:
        sys.exit(f"환경변수 {name} 가 필요합니다.")
    return v

# ---------------------------------------------------------------- wordpress

def wordpress(path, meta, body, cfg, a):
    wcfg = cfg.get("wordpress", {})
    base = (os.environ.get("WP_URL") or wcfg.get("url", "")).rstrip("/")
    if not base and not a.dry_run:
        sys.exit("WP_URL (또는 config.wordpress.url) 이 필요합니다.")
    api = f"{base}/wp-json/wp/v2"
    auth = {}
    if not a.dry_run:
        tok = base64.b64encode(f"{env('WP_USER')}:{env('WP_APP_PASSWORD')}".encode()).decode()
        auth = {"Authorization": f"Basic {tok}"}

    def term_ids(kind, names):
        ids = []
        for name in names or []:
            if a.dry_run:
                ids.append(f"<{kind}:{name}>")
                continue
            found = http("GET", f"{api}/{kind}?search={urllib.parse.quote(str(name))}&per_page=20", auth)
            hit = next((t for t in found if t["name"].lower() == str(name).lower()), None)
            ids.append(hit["id"] if hit else http("POST", f"{api}/{kind}", auth, {"name": str(name)})["id"])
        return ids

    if wcfg.get("styled_content"):
        from render_page import build as render_final  # same design as final/page.html
        out_dir, _, _ = render_final(path, cfg)
        content = open(os.path.join(out_dir, "fragment.html"), encoding="utf-8").read()
    else:
        content = render_html(strip_h1(body))
    seo_plugin = wcfg.get("seo_plugin", "none")  # rankmath | yoast | none
    if wcfg.get("inject_jsonld", seo_plugin == "none"):
        content += "\n" + jsonld_script(build_jsonld(meta, cfg.get("site_url", ""), cfg.get("author", "")))
    post = {
        "title": meta.get("title", ""), "slug": meta.get("slug", ""), "content": content,
        "excerpt": meta.get("description", ""), "status": a.status or wcfg.get("default_status", "draft"),
        "categories": term_ids("categories", meta.get("categories") or wcfg.get("default_categories")),
        "tags": term_ids("tags", meta.get("tags")),
    }
    if post["status"] == "future":
        if not a.schedule:
            sys.exit("--status future 는 --schedule 2026-12-01T09:00:00 이 필요합니다.")
        post["date"] = a.schedule
    # SEO plugin meta (works only when the plugin exposes these keys via REST; see references/publishing.md)
    if seo_plugin == "rankmath":
        post["meta"] = {"rank_math_title": meta.get("seo_title", meta.get("title", "")),
                        "rank_math_description": meta.get("description", ""),
                        "rank_math_focus_keyword": meta.get("primary_keyword", "")}
    elif seo_plugin == "yoast":
        post["meta"] = {"_yoast_wpseo_title": meta.get("seo_title", meta.get("title", "")),
                        "_yoast_wpseo_metadesc": meta.get("description", ""),
                        "_yoast_wpseo_focuskw": meta.get("primary_keyword", "")}
    cover = meta.get("cover")
    if a.dry_run:
        print(json.dumps({**post, "content": post["content"][:600] + " …"}, ensure_ascii=False, indent=2))
        return
    if cover and os.path.exists(os.path.join(os.path.dirname(path), cover)):
        fp = os.path.join(os.path.dirname(path), cover)
        media = http("POST", f"{api}/media", {**auth, "Content-Type": mimetypes.guess_type(fp)[0] or "image/jpeg",
                                              "Content-Disposition": f'attachment; filename="{os.path.basename(fp)}"'},
                     raw=open(fp, "rb").read())
        http("POST", f"{api}/media/{media['id']}", auth, {"alt_text": meta.get("cover_alt", meta.get("title", ""))})
        post["featured_media"] = media["id"]
    existing = prior(path, "wordpress").get("id")
    url = f"{api}/posts/{existing}" if existing else f"{api}/posts"
    res = http("POST", url, auth, post)
    log_publish(path, "wordpress", {"id": res["id"], "url": res.get("link"), "status": res.get("status")})
    print(f"WordPress {'수정' if existing else '생성'} 완료: id={res['id']} status={res.get('status')} {res.get('link')}")

# ---------------------------------------------------------------- naver

NAVER_STYLE = {
    "h2": "font-size:22px;font-weight:700;margin:36px 0 12px;padding-bottom:6px;border-bottom:2px solid #03c75a;",
    "h3": "font-size:18px;font-weight:700;margin:24px 0 8px;",
    "h4": "font-size:16px;font-weight:700;margin:18px 0 6px;",
    "p": "font-size:16px;line-height:1.9;margin:0 0 14px;",
    "li": "font-size:16px;line-height:1.8;",
    "blockquote": "margin:16px 0;padding:14px 18px;background:#f5fbf7;border-left:4px solid #03c75a;",
    "table": "border-collapse:collapse;width:100%;margin:16px 0;",
    "th": "border:1px solid #ddd;background:#f2f2f2;padding:8px;font-weight:700;",
    "td": "border:1px solid #ddd;padding:8px;",
    "a": "color:#03c75a;",
    "img": "max-width:100%;",
}


def naver(path, meta, body, cfg, a):
    outdir = os.path.join(os.path.dirname(path), "naver")
    os.makedirs(outdir, exist_ok=True)
    nb = strip_h1(body)
    nb = re.sub(r"<script.*?</script>", "", nb, flags=re.S)
    # Naver: external links reduce dwell & can look spammy in excess — keep sources but as a compact list
    color = (cfg.get("design") or {}).get("primary", "#03c75a")
    style = {k: v.replace("#03c75a", color).replace("#f5fbf7", "#f6f7f9") for k, v in NAVER_STYLE.items()}
    html_body = render_html(nb, style, heading_ids=False)
    tags = [str(t).replace(" ", "") for t in (meta.get("naver_tags") or meta.get("tags") or [])][:10]
    open(os.path.join(outdir, "naver.html"), "w", encoding="utf-8").write(html_body)
    open(os.path.join(outdir, "naver.txt"), "w", encoding="utf-8").write(
        meta.get("title", "") + "\n\n" + re.sub(r"\n{3,}", "\n\n", strip_md(nb)).strip() + "\n\n" + " ".join("#" + t for t in tags))
    copy_page = f"""<!doctype html><html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>네이버 붙여넣기용 · {meta.get('title','')}</title>
<style>body{{font-family:-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;max-width:760px;margin:24px auto;padding:0 16px;background:#fff;color:#222}}
.bar{{position:sticky;top:0;background:#fff;padding:12px 0;border-bottom:1px solid #eee;display:flex;gap:8px;flex-wrap:wrap}}
button{{background:{color};color:#fff;border:0;border-radius:6px;padding:10px 14px;font-size:14px;cursor:pointer}}
.tags{{color:#555;font-size:14px}} #ok{{color:#555;font-size:13px;align-self:center}}</style></head><body>
<div class="bar"><button onclick="cp('title')">① 제목 복사</button><button onclick="cp('content')">② 본문 복사(서식 유지)</button>
<button onclick="cp('tags')">③ 태그 복사</button><span id="ok"></span></div>
<h1 id="title" style="font-size:26px">{meta.get('title','')}</h1>
<div id="content">{html_body}</div>
<p class="tags" id="tags">{' '.join('#' + t for t in tags)}</p>
<script>
async function cp(id){{const el=document.getElementById(id);try{{
if(id==='content'&&window.ClipboardItem){{await navigator.clipboard.write([new ClipboardItem({{'text/html':new Blob([el.innerHTML],{{type:'text/html'}}),'text/plain':new Blob([el.innerText],{{type:'text/plain'}})}})]);}}
else{{await navigator.clipboard.writeText(el.innerText);}}document.getElementById('ok').textContent='복사됨 → 스마트에디터에 붙여넣기';}}
catch(e){{const r=document.createRange();r.selectNodeContents(el);const s=getSelection();s.removeAllRanges();s.addRange(r);document.execCommand('copy');document.getElementById('ok').textContent='복사됨';}}}}
</script></body></html>"""
    open(os.path.join(outdir, "naver_copy.html"), "w", encoding="utf-8").write(copy_page)
    imgs = len(re.findall(r"!\[", nb))
    print(f"네이버용 파일 생성 → {outdir}/ (naver_copy.html 을 브라우저로 열어 ①②③ 순서로 복사·붙여넣기)")
    print(f"태그: {' '.join('#' + t for t in tags)} | 이미지 {imgs}개 (네이버는 직접 업로드 권장, 최소 3–5장)")
    if not a.dry_run:
        log_publish(path, "naver", {"export_dir": outdir, "tags": tags, "status": "exported-manual-post"})

# ---------------------------------------------------------------- markdown / SSG

def markdown_out(path, meta, body, cfg, a):
    mcfg = cfg.get("markdown", {})
    out_dir = a.out or mcfg.get("out_dir", "dist/markdown")
    flavor = mcfg.get("flavor", "hugo")  # hugo | astro | next | jekyll
    pattern = mcfg.get("filename", "{slug}.md")  # e.g. "{date}-{slug}.md" or "{slug}/index.md"
    fm = {
        "title": meta.get("title", ""), "description": meta.get("description", ""),
        "date": str(meta.get("date", dt.date.today().isoformat())),
    }
    if flavor == "astro":
        fm["pubDate"] = fm.pop("date")
    upd_key = {"hugo": "lastmod", "astro": "updatedDate", "next": "updated", "jekyll": "last_modified_at"}[flavor]
    if meta.get("updated"):
        fm[upd_key] = str(meta["updated"])
    fm["slug"] = meta.get("slug", "")
    if meta.get("tags"):
        fm["tags"] = meta["tags"]
    if meta.get("categories"):
        fm["categories"] = meta["categories"]
    if meta.get("author"):
        fm["author"] = meta["author"]
    if meta.get("cover"):
        fm["heroImage" if flavor == "astro" else "image"] = meta["cover"]
    if meta.get("primary_keyword"):
        fm["keywords"] = [meta["primary_keyword"]] + list(meta.get("secondary_keywords") or [])
    if meta.get("faq"):
        fm["faq"] = meta["faq"]
    if meta.get("canonical"):
        fm["canonical"] = meta["canonical"]
    if flavor == "hugo":
        fm["draft"] = bool(mcfg.get("draft", False))
    out_body = body if mcfg.get("keep_h1", False) else strip_h1(body)
    if mcfg.get("inject_jsonld", True):
        out_body += "\n\n" + jsonld_script(build_jsonld(meta, cfg.get("site_url", ""), cfg.get("author", ""))) + "\n"
    target = os.path.join(out_dir, pattern.format(slug=meta.get("slug", "post"), date=fm.get("date", fm.get("pubDate", ""))))
    doc = dump_frontmatter(fm) + "\n" + out_body.lstrip()
    if a.dry_run:
        print(f"[dry-run] → {target}\n" + doc[:800])
        return
    os.makedirs(os.path.dirname(target), exist_ok=True)
    open(target, "w", encoding="utf-8").write(doc)
    print(f"Markdown 저장 → {target}")
    info = {"path": target}
    if a.git_commit:
        repo = subprocess.run(["git", "-C", os.path.dirname(target), "rev-parse", "--show-toplevel"],
                              capture_output=True, text=True).stdout.strip()
        if repo:
            subprocess.run(["git", "-C", repo, "add", os.path.abspath(target)], check=True)
            subprocess.run(["git", "-C", repo, "commit", "-m", f"content: {meta.get('title','')}"], check=True)
            info["git_repo"] = repo
            print(f"커밋 완료 ({repo}) — push는 별도로 실행하세요.")
    log_publish(path, "markdown", info)

# ---------------------------------------------------------------- notion

def notion(path, meta, body, cfg, a):
    ncfg = cfg.get("notion", {})
    db = ncfg.get("database_id") or os.environ.get("NOTION_DATABASE_ID", "")
    props_map = {"title": "Name", "slug": "Slug", "status": "Status", "keyword": "Keyword",
                 "description": "Description", "tags": "Tags", "date": "Date", **ncfg.get("properties", {})}
    blocks = notion_blocks(strip_h1(body))
    props = {props_map["title"]: {"title": [{"text": {"content": meta.get("title", "")}}]}}

    def rt(v):
        return {"rich_text": [{"text": {"content": str(v)[:1900]}}]}
    if props_map.get("slug"):
        props[props_map["slug"]] = rt(meta.get("slug", ""))
    if props_map.get("keyword"):
        props[props_map["keyword"]] = rt(meta.get("primary_keyword", ""))
    if props_map.get("description"):
        props[props_map["description"]] = rt(meta.get("description", ""))
    if props_map.get("tags") and meta.get("tags"):
        props[props_map["tags"]] = {"multi_select": [{"name": str(t)[:100]} for t in meta["tags"]]}
    if props_map.get("date") and meta.get("date"):
        props[props_map["date"]] = {"date": {"start": str(meta["date"])}}
    if props_map.get("status"):
        status_type = ncfg.get("status_type", "select")  # select | status
        props[props_map["status"]] = {status_type: {"name": ncfg.get("default_status", "Draft")}}
    if a.dry_run:
        print(json.dumps({"parent": {"database_id": db or "<NOTION_DATABASE_ID>"}, "properties": props,
                          "children_count": len(blocks), "first_blocks": blocks[:3]}, ensure_ascii=False, indent=2))
        return
    if not db:
        sys.exit("config.notion.database_id 또는 NOTION_DATABASE_ID 가 필요합니다.")
    h = {"Authorization": f"Bearer {env('NOTION_TOKEN')}", "Notion-Version": "2022-06-28"}
    page = http("POST", "https://api.notion.com/v1/pages", h,
                {"parent": {"database_id": db}, "properties": props, "children": blocks[:100]})
    for k in range(100, len(blocks), 100):
        http("PATCH", f"https://api.notion.com/v1/blocks/{page['id']}/children", h, {"children": blocks[k:k + 100]})
    log_publish(path, "notion", {"id": page["id"], "url": page.get("url")})
    print(f"Notion 페이지 생성: {page.get('url')}")

# ---------------------------------------------------------------- main

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("channel", choices=["wordpress", "naver", "markdown", "notion", "all"])
    ap.add_argument("article")
    ap.add_argument("--config", default="content/geo-seo.config.json" if os.path.exists("content/geo-seo.config.json") else "geo-seo.config.json")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--status", choices=["draft", "publish", "future", "pending", "private"])
    ap.add_argument("--schedule", help="WordPress 예약 발행 시각 (사이트 타임존, ISO8601)")
    ap.add_argument("--out", help="markdown 출력 폴더 override")
    ap.add_argument("--git-commit", action="store_true")
    a = ap.parse_args()
    cfg = load_config(a.config)
    meta, body = load_article(a.article)
    fns = {"wordpress": wordpress, "naver": naver, "markdown": markdown_out, "notion": notion}
    channels = (meta.get("channels") or list(fns)) if a.channel == "all" else [a.channel]
    for ch in channels:
        print(f"\n=== {ch} ===")
        fns[ch](a.article, meta, body, cfg, a)


if __name__ == "__main__":
    main()
