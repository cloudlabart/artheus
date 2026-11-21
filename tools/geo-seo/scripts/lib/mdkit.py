"""Dependency-free helpers: YAML-subset frontmatter, Markdown -> HTML, Markdown -> Notion blocks.

Supported frontmatter YAML subset:
  key: scalar            (strings, numbers, true/false, quoted strings)
  key: [a, b, "c d"]     (inline list)
  key:                   (block list of scalars)
    - a
  key:                   (block list of maps, e.g. faq)
    - q: 질문
      a: 답변
  key:                   (one-level map)
    sub: value

Supported Markdown: ATX headings, paragraphs, **bold**, *italic*, `code`, [links](url),
![images](url), ordered/unordered lists (one nesting level), > blockquote, ``` fences,
GFM tables, --- rules, and raw HTML blocks passed through.
"""
from __future__ import annotations

import html
import json
import re

# ---------------------------------------------------------------- frontmatter

def _scalar(v: str):
    v = v.strip()
    if v == "":
        return ""
    if (v[0] == v[-1]) and v[0] in "\"'" and len(v) >= 2:
        inner = v[1:-1]
        return inner.replace('\\"', '"') if v[0] == '"' else inner.replace("''", "'")
    if v in ("true", "True"):
        return True
    if v in ("false", "False"):
        return False
    if v in ("null", "~"):
        return None
    if re.fullmatch(r"-?\d+", v):
        return int(v)
    if re.fullmatch(r"-?\d+\.\d+", v):
        return float(v)
    return v


def _split_inline_list(s: str):
    items, buf, quote = [], "", None
    for ch in s:
        if quote:
            buf += ch
            if ch == quote:
                quote = None
        elif ch in "\"'":
            quote = ch
            buf += ch
        elif ch == ",":
            items.append(buf)
            buf = ""
        else:
            buf += ch
    if buf.strip():
        items.append(buf)
    return [_scalar(i) for i in items if i.strip()]


def _value(v: str):
    v = v.strip()
    if v.startswith("[") and v.endswith("]"):
        return _split_inline_list(v[1:-1])
    return _scalar(v)


def parse_frontmatter(text: str):
    """Return (meta: dict, body: str)."""
    if not text.startswith("---"):
        return {}, text
    m = re.match(r"^---\s*\n(.*?)\n---\s*(?:\n|$)", text, re.S)
    if not m:
        return {}, text
    raw, body = m.group(1), text[m.end():]
    meta: dict = {}
    lines = raw.split("\n")
    i = 0
    while i < len(lines):
        line = lines[i]
        if not line.strip() or line.lstrip().startswith("#"):
            i += 1
            continue
        km = re.match(r"^([A-Za-z0-9_\-]+):\s*(.*)$", line)
        if not km:
            i += 1
            continue
        key, rest = km.group(1), km.group(2)
        if rest.strip() not in ("", "|", ">"):
            meta[key] = _value(rest)
            i += 1
            continue
        if rest.strip() in ("|", ">"):  # block scalar
            i += 1
            chunk = []
            while i < len(lines) and (lines[i].startswith(" ") or not lines[i].strip()):
                chunk.append(lines[i].strip())
                i += 1
            joiner = "\n" if rest.strip() == "|" else " "
            meta[key] = joiner.join(c for c in chunk).strip()
            continue
        # nested block
        i += 1
        block = []
        while i < len(lines) and (lines[i].startswith(" ") or lines[i].startswith("\t") or not lines[i].strip()):
            if lines[i].strip():
                block.append(lines[i])
            i += 1
        if not block:
            meta[key] = None
            continue
        if block[0].lstrip().startswith("- "):
            items: list = []
            cur = None
            for b in block:
                s = b.strip()
                if s.startswith("- "):
                    s = s[2:]
                    mm = re.match(r"^([A-Za-z0-9_\-]+):\s*(.*)$", s)
                    if mm and not s.startswith(("http:", "https:")):
                        cur = {mm.group(1): _value(mm.group(2))}
                        items.append(cur)
                    else:
                        cur = None
                        items.append(_value(s))
                else:
                    mm = re.match(r"^([A-Za-z0-9_\-]+):\s*(.*)$", s)
                    if mm and isinstance(cur, dict):
                        cur[mm.group(1)] = _value(mm.group(2))
            meta[key] = items
        else:
            sub = {}
            for b in block:
                mm = re.match(r"^\s*([A-Za-z0-9_\-]+):\s*(.*)$", b)
                if mm:
                    sub[mm.group(1)] = _value(mm.group(2))
            meta[key] = sub
    return meta, body


def _dump_scalar(v):
    if isinstance(v, bool):
        return "true" if v else "false"
    if v is None:
        return "null"
    if isinstance(v, (int, float)):
        return str(v)
    s = str(v)
    if s == "" or re.search(r"[:#\[\]{},&*!|>'\"%@`]", s) or s != s.strip():
        return json.dumps(s, ensure_ascii=False)
    return s


def dump_frontmatter(meta: dict) -> str:
    out = ["---"]
    for k, v in meta.items():
        if isinstance(v, list):
            if v and all(isinstance(x, dict) for x in v):
                out.append(f"{k}:")
                for d in v:
                    first = True
                    for kk, vv in d.items():
                        out.append(f"  {'- ' if first else '  '}{kk}: {_dump_scalar(vv)}")
                        first = False
            else:
                out.append(f"{k}: [{', '.join(_dump_scalar(x) for x in v)}]")
        elif isinstance(v, dict):
            out.append(f"{k}:")
            for kk, vv in v.items():
                out.append(f"  {kk}: {_dump_scalar(vv)}")
        else:
            out.append(f"{k}: {_dump_scalar(v)}")
    out.append("---")
    return "\n".join(out) + "\n"


def load_article(path: str):
    with open(path, encoding="utf-8") as f:
        return parse_frontmatter(f.read())

# ---------------------------------------------------------------- inline md

_INLINE_TOKEN = re.compile(r"`([^`]+)`")


def slugify_heading(text: str) -> str:
    s = re.sub(r"<[^>]+>", "", text)
    s = re.sub(r"[^\w\s\-가-힣]", "", s).strip().lower()
    return re.sub(r"\s+", "-", s)


def inline_html(text: str, style: dict | None = None) -> str:
    style = style or {}
    codes = []

    def keep_code(m):
        codes.append(m.group(1))
        return f"\x00{len(codes) - 1}\x00"

    text = _INLINE_TOKEN.sub(keep_code, text)
    text = html.escape(text, quote=False)
    a_style = f' style="{style["a"]}"' if "a" in style else ""
    text = re.sub(r"!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)",
                  lambda m: f'<img src="{m.group(2)}" alt="{m.group(1)}"' +
                  (f' title="{m.group(3)}"' if m.group(3) else "") +
                  (f' style="{style["img"]}"' if "img" in style else "") + ">", text)
    text = re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)", lambda m: f'<a href="{m.group(2)}"{a_style}>{m.group(1)}</a>', text)
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])", r"<em>\1</em>", text)
    text = re.sub(r"~~(.+?)~~", r"<del>\1</del>", text)
    c_style = f' style="{style["code"]}"' if "code" in style else ""
    text = re.sub(r"\x00(\d+)\x00", lambda m: f"<code{c_style}>{html.escape(codes[int(m.group(1))])}</code>", text)
    return text.replace("\n", "<br>")

# ---------------------------------------------------------------- block parse

def parse_blocks(md: str):
    """Tokenise markdown into a list of block dicts."""
    lines = md.replace("\r\n", "\n").split("\n")
    blocks = []
    i = 0
    while i < len(lines):
        line = lines[i]
        s = line.strip()
        if not s:
            i += 1
            continue
        if s.startswith("```"):
            lang = s[3:].strip()
            i += 1
            buf = []
            while i < len(lines) and not lines[i].strip().startswith("```"):
                buf.append(lines[i])
                i += 1
            i += 1
            blocks.append({"type": "code", "lang": lang, "text": "\n".join(buf)})
            continue
        hm = re.match(r"^(#{1,6})\s+(.*?)\s*#*$", s)
        if hm:
            blocks.append({"type": "heading", "level": len(hm.group(1)), "text": hm.group(2)})
            i += 1
            continue
        if re.fullmatch(r"(-{3,}|\*{3,}|_{3,})", s):
            blocks.append({"type": "hr"})
            i += 1
            continue
        if s.startswith("<") and not s.startswith("<http"):
            buf = []
            while i < len(lines) and lines[i].strip():
                buf.append(lines[i])
                i += 1
            blocks.append({"type": "html", "text": "\n".join(buf)})
            continue
        if s.startswith(">"):
            buf = []
            while i < len(lines) and lines[i].strip().startswith(">"):
                buf.append(re.sub(r"^\s*>\s?", "", lines[i]))
                i += 1
            blocks.append({"type": "quote", "raw": "\n".join(buf), "children": parse_blocks("\n".join(buf))})
            continue
        if "|" in s and i + 1 < len(lines) and re.fullmatch(r"\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?", lines[i + 1].strip()):
            def cells(r):
                r = r.strip()
                if r.startswith("|"):
                    r = r[1:]
                if r.endswith("|"):
                    r = r[:-1]
                return [c.strip() for c in r.split("|")]
            header = cells(s)
            i += 2
            rows = []
            while i < len(lines) and "|" in lines[i] and lines[i].strip():
                rows.append(cells(lines[i]))
                i += 1
            blocks.append({"type": "table", "header": header, "rows": rows})
            continue
        lm = re.match(r"^(\s*)([-*+]|\d+[.)])\s+(.*)$", line)
        if lm:
            ordered = lm.group(2)[0].isdigit()
            items = []
            while i < len(lines):
                lm2 = re.match(r"^(\s*)([-*+]|\d+[.)])\s+(.*)$", lines[i])
                if lm2 and len(lm2.group(1)) < 2:
                    items.append({"text": lm2.group(3), "children": []})
                    i += 1
                elif lm2 and items:
                    items[-1]["children"].append({"text": lm2.group(3),
                                                  "ordered": lm2.group(2)[0].isdigit()})
                    i += 1
                elif lines[i].startswith("  ") and lines[i].strip() and items:
                    items[-1]["text"] += "\n" + lines[i].strip()
                    i += 1
                else:
                    break
            blocks.append({"type": "list", "ordered": ordered, "items": items})
            continue
        buf = []
        while i < len(lines) and lines[i].strip() and not re.match(r"^(#{1,6}\s|```|>|\s*([-*+]|\d+[.)])\s)", lines[i]):
            buf.append(lines[i].strip())
            i += 1
        if not buf:  # safety
            buf.append(s)
            i += 1
        blocks.append({"type": "paragraph", "text": " ".join(buf)})
    return blocks

# ---------------------------------------------------------------- html render

def render_html(md: str, style: dict | None = None, heading_ids: bool = True) -> str:
    """style: optional dict tag -> inline css (used for Naver paste-friendly output)."""
    style = style or {}

    def st(tag):
        return f' style="{style[tag]}"' if tag in style else ""

    def render(blocks):
        out = []
        for b in blocks:
            t = b["type"]
            if t == "heading":
                tag = f"h{b['level']}"
                hid = f' id="{slugify_heading(b["text"])}"' if heading_ids and b["level"] > 1 else ""
                out.append(f"<{tag}{hid}{st(tag)}>{inline_html(b['text'], style)}</{tag}>")
            elif t == "paragraph":
                out.append(f"<p{st('p')}>{inline_html(b['text'], style)}</p>")
            elif t == "code":
                out.append(f"<pre{st('pre')}><code>{html.escape(b['text'])}</code></pre>")
            elif t == "hr":
                out.append(f"<hr{st('hr')}>")
            elif t == "html":
                out.append(b["text"])
            elif t == "quote":
                out.append(f"<blockquote{st('blockquote')}>{render(b['children'])}</blockquote>")
            elif t == "table":
                th = "".join(f"<th{st('th')}>{inline_html(c, style)}</th>" for c in b["header"])
                trs = "".join("<tr>" + "".join(f"<td{st('td')}>{inline_html(c, style)}</td>" for c in r) + "</tr>"
                              for r in b["rows"])
                out.append(f"<table{st('table')}><thead><tr>{th}</tr></thead><tbody>{trs}</tbody></table>")
            elif t == "list":
                tag = "ol" if b["ordered"] else "ul"
                lis = []
                for it in b["items"]:
                    sub = ""
                    if it["children"]:
                        stag = "ol" if it["children"][0]["ordered"] else "ul"
                        sub = f"<{stag}{st(stag)}>" + "".join(
                            f"<li{st('li')}>{inline_html(c['text'], style)}</li>" for c in it["children"]) + f"</{stag}>"
                    lis.append(f"<li{st('li')}>{inline_html(it['text'], style)}{sub}</li>")
                out.append(f"<{tag}{st(tag)}>{''.join(lis)}</{tag}>")
        return "\n".join(out)

    return render(parse_blocks(md))

# ---------------------------------------------------------------- notion blocks

def _rich_text(text: str):
    """Very small inline parser -> Notion rich_text (bold, italic, code, links)."""
    parts = []
    pattern = re.compile(r"(\*\*(.+?)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)|(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*]))")
    pos = 0
    for m in pattern.finditer(text):
        if m.start() > pos:
            parts.append(("plain", text[pos:m.start()], None))
        if m.group(2):
            parts.append(("bold", m.group(2), None))
        elif m.group(3):
            parts.append(("code", m.group(3), None))
        elif m.group(4):
            parts.append(("link", m.group(4), m.group(5)))
        elif m.group(6):
            parts.append(("italic", m.group(6), None))
        pos = m.end()
    if pos < len(text):
        parts.append(("plain", text[pos:], None))
    rt = []
    for kind, content, url in parts:
        for k in range(0, len(content), 1900):  # Notion 2000 char limit per text object
            chunk = content[k:k + 1900]
            obj = {"type": "text", "text": {"content": chunk}}
            if kind == "link" and url and url.startswith("http"):
                obj["text"]["link"] = {"url": url}
            ann = {}
            if kind == "bold":
                ann["bold"] = True
            if kind == "italic":
                ann["italic"] = True
            if kind == "code":
                ann["code"] = True
            if ann:
                obj["annotations"] = ann
            rt.append(obj)
    return rt or [{"type": "text", "text": {"content": ""}}]


def notion_blocks(md: str):
    def conv(blocks):
        out = []
        for b in blocks:
            t = b["type"]
            if t == "heading":
                lvl = min(max(b["level"] - 1, 1), 3) if b["level"] > 1 else 1
                key = f"heading_{lvl}"
                out.append({"object": "block", "type": key, key: {"rich_text": _rich_text(b["text"])}})
            elif t == "paragraph":
                im = re.fullmatch(r"!\[([^\]]*)\]\((https?://[^)\s]+)\)", b["text"].strip())
                if im:
                    out.append({"object": "block", "type": "image", "image": {
                        "type": "external", "external": {"url": im.group(2)},
                        "caption": _rich_text(im.group(1))}})
                else:
                    out.append({"object": "block", "type": "paragraph", "paragraph": {"rich_text": _rich_text(b["text"])}})
            elif t == "code":
                out.append({"object": "block", "type": "code", "code": {
                    "rich_text": [{"type": "text", "text": {"content": b["text"][:1990]}}],
                    "language": b["lang"] or "plain text"}})
            elif t == "hr":
                out.append({"object": "block", "type": "divider", "divider": {}})
            elif t == "quote":
                text = " ".join(c.get("text", "") for c in b["children"] if c["type"] == "paragraph")
                out.append({"object": "block", "type": "quote", "quote": {"rich_text": _rich_text(text)}})
            elif t == "list":
                key = "numbered_list_item" if b["ordered"] else "bulleted_list_item"
                for it in b["items"]:
                    blk = {"object": "block", "type": key, key: {"rich_text": _rich_text(it["text"])}}
                    if it["children"]:
                        blk[key]["children"] = [{
                            "object": "block",
                            "type": "numbered_list_item" if c["ordered"] else "bulleted_list_item",
                            ("numbered_list_item" if c["ordered"] else "bulleted_list_item"): {"rich_text": _rich_text(c["text"])}}
                            for c in it["children"]]
                    out.append(blk)
            elif t == "table":
                width = len(b["header"])
                rows = [b["header"]] + [(r + [""] * width)[:width] for r in b["rows"]]
                out.append({"object": "block", "type": "table", "table": {
                    "table_width": width, "has_column_header": True, "has_row_header": False,
                    "children": [{"object": "block", "type": "table_row",
                                  "table_row": {"cells": [_rich_text(c) for c in r]}} for r in rows]}})
            elif t == "html":
                if "application/ld+json" in b["text"]:
                    continue  # schema is meaningless inside Notion
                out.append({"object": "block", "type": "code", "code": {
                    "rich_text": [{"type": "text", "text": {"content": b["text"][:1990]}}], "language": "html"}})
        return out

    return conv(parse_blocks(md))

# ---------------------------------------------------------------- helpers

def strip_md(md: str) -> str:
    """Plain text approximation (for counting / Naver text mode)."""
    t = re.sub(r"```.*?```", "", md, flags=re.S)
    t = re.sub(r"<script.*?</script>", "", t, flags=re.S)
    t = re.sub(r"<[^>]+>", "", t)
    t = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", t)
    t = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", t)
    t = re.sub(r"[*_`#>|]", "", t)
    return t


def build_jsonld(meta: dict, site_url: str = "", author_default: str = "") -> list[dict]:
    """Article + FAQPage (+HowTo if steps given) JSON-LD from frontmatter."""
    url = meta.get("canonical") or (site_url.rstrip("/") + "/" + meta.get("slug", "") if site_url else "")
    author = meta.get("author") or author_default
    graph = []
    art = {
        "@context": "https://schema.org",
        "@type": meta.get("schema_type", "Article"),
        "headline": meta.get("title", ""),
        "description": meta.get("description", ""),
        "inLanguage": meta.get("lang", "ko-KR"),
        "datePublished": str(meta.get("date", "")),
        "dateModified": str(meta.get("updated", meta.get("date", ""))),
    }
    if author:
        art["author"] = {"@type": "Person", "name": author}
        if meta.get("author_url"):
            art["author"]["url"] = meta["author_url"]
    if url:
        art["mainEntityOfPage"] = url
    if meta.get("cover"):
        art["image"] = meta["cover"]
    if meta.get("keywords"):
        art["keywords"] = ", ".join(meta["keywords"]) if isinstance(meta["keywords"], list) else meta["keywords"]
    graph.append(art)
    faq = meta.get("faq") or []
    if faq:
        graph.append({
            "@context": "https://schema.org", "@type": "FAQPage",
            "mainEntity": [{"@type": "Question", "name": f.get("q", ""),
                            "acceptedAnswer": {"@type": "Answer", "text": f.get("a", "")}} for f in faq if isinstance(f, dict)]})
    steps = meta.get("howto_steps") or []
    if steps:
        graph.append({"@context": "https://schema.org", "@type": "HowTo", "name": meta.get("title", ""),
                      "step": [{"@type": "HowToStep", "position": n + 1, "text": s} for n, s in enumerate(steps)]})
    return graph


def jsonld_script(graph: list[dict]) -> str:
    return "\n".join(
        '<script type="application/ld+json">' + json.dumps(g, ensure_ascii=False) + "</script>" for g in graph)
