#!/usr/bin/env python3
"""Render the final, publish-ready page design for an article.md.

  python3 scripts/render_page.py content/articles/<slug>/article.md [--config geo-seo.config.json] [--screenshot]

Outputs to content/articles/<slug>/final/:
  page.html          완성 페이지(헤더·히어로·목차·본문 컴포넌트·도서 카드·FAQ·저자·CTA·푸터, 반응형, SEO 메타/JSON-LD 포함)
  fragment.html      CMS 본문에 넣는 부분만 (scoped <style> 포함) — WordPress styled_content 에서 사용
  layout-spec.md     섹션별 레이아웃·서식 명세 + 디자인 토큰 + 네이버 스마트에디터 서식 가이드 + 채워야 할 자리
  desktop.png / mobile.png   (--screenshot, Node + Playwright 가 있을 때)

Markdown → component conventions (writer follows these, see references/layout-guide.md):
  > **핵심 요약** ...            → 요약 카드
  > **이름**: 대사 (여러 줄)      → 대본 박스
  > 💡 / > **팁**                 → 팁 콜아웃,  > ⚠️ / > **주의** → 주의 콜아웃, 그 외 인용 → 노트 콜아웃
  1. **제목** — 설명              → 단계 카드
  ## 추천 도서 아래 목록          → 도서 카드 (구매 버튼)
  ## 자주 묻는 질문 아래 ### 질문 → 아코디언
  <!-- IMAGE: 설명 -->            → 이미지 자리(최종본에 크기 안내 표시)
  <!-- TODO: 설명 -->             → 작성 필요 자리(점선 박스)
"""
from __future__ import annotations

import argparse
import datetime as dt
import html
import json
import os
import re
import shutil
import subprocess
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "lib"))
from mdkit import build_jsonld, inline_html, load_article, parse_blocks, slugify_heading, strip_md  # noqa: E402

DEFAULT_DESIGN = {
    "brand_name": "",
    "logo_url": "",
    "primary": "#2F5BEA",
    "primary_ink": "#FFFFFF",
    "accent": "#FFB020",
    "text": "#1A1D23",
    "muted": "#6B7280",
    "bg": "#FFFFFF",
    "surface": "#F6F7F9",
    "line": "#E5E7EB",
    "radius": "14px",
    "font_family": "'Pretendard Variable', Pretendard, -apple-system, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif",
    "font_css": "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css",
    "body_size": "17px",
    "line_height": "1.85",
    "content_width": "720px",
    "show_toc": True,
    "show_reading_time": True,
    "footer_text": "",
    "cta": {},
}

e = html.escape


def section_kind(title: str) -> str:
    if "추천 도서" in title:
        return "books"
    if "자주 묻는 질문" in title or title.strip().upper() == "FAQ":
        return "faq"
    if "참고 자료" in title or "출처" in title:
        return "sources"
    return "body"


# ---------------------------------------------------------------- components

def c_summary(raw: str):
    lines = [l.strip() for l in raw.split("\n") if l.strip()]
    title = re.sub(r"\*\*|\(.*?\)", "", lines[0]).strip() or "핵심 요약"
    items = [re.sub(r"^[-*]\s+", "", l) for l in lines[1:]]
    lis = "".join(f"<li>{inline_html(i)}</li>" for i in items)
    return f'<aside class="gs-summary"><p class="gs-summary__label">{e(title)}</p><ul>{lis}</ul></aside>'


SCRIPT_LINE = re.compile(r"^\*\*([^*]+)\*\*\s*[:：]\s*(.*)$")


def c_script(raw: str):
    rows = []
    for l in [x.strip() for x in raw.split("\n") if x.strip()]:
        m = SCRIPT_LINE.match(l)
        if m:
            rows.append(f'<div class="gs-script__line"><span class="gs-script__who">{e(m.group(1))}</span>'
                        f'<span class="gs-script__say">{inline_html(m.group(2))}</span></div>')
        else:
            rows.append(f'<div class="gs-script__direction">{inline_html(l)}</div>')
    return f'<figure class="gs-script"><figcaption>예시 장면</figcaption>{"".join(rows)}</figure>'


def c_callout(raw: str):
    first = raw.strip().split("\n")[0]
    kind, label = "note", "참고"
    if first.startswith("💡") or first.startswith("**팁"):
        kind, label = "tip", "팁"
    elif first.startswith("⚠") or first.startswith("**주의"):
        kind, label = "warn", "주의"
    text = re.sub(r"^(💡|⚠️?)\s*", "", raw.strip())
    paras = "".join(f"<p>{inline_html(p.strip())}</p>" for p in re.split(r"\n\s*\n", text) if p.strip())
    return f'<aside class="gs-callout gs-callout--{kind}"><span class="gs-callout__tag">{label}</span>{paras}</aside>'


def c_steps(items):
    out = []
    for n, it in enumerate(items, 1):
        t = it["text"]
        m = re.match(r"^\*\*(.+?)\*\*\s*[—–-]?\s*(.*)$", t, re.S)
        head, rest = (m.group(1), m.group(2)) if m else (t, "")
        out.append(f'<li class="gs-step"><span class="gs-step__num">{n}</span><div><p class="gs-step__title">'
                   f'{inline_html(head)}</p>{f"<p>{inline_html(rest)}</p>" if rest else ""}</div></li>')
    return f'<ol class="gs-steps">{"".join(out)}</ol>'


def c_books(items):
    cards = []
    for it in items:
        lines = [l.strip() for l in it["text"].split("\n") if l.strip()]
        head = re.sub(r"\*\*", "", lines[0])
        parts = re.split(r"\s+[—–]\s+", head, maxsplit=1)
        title = parts[0].strip()
        byline = parts[1].strip() if len(parts) > 1 else ""
        buy, desc, isbn = [], [], ""
        for l in lines[1:]:
            if l.startswith("구매"):
                buy = re.findall(r"\[([^\]]+)\]\((https?://[^)\s]+)\)", l)
            else:
                m = re.search(r"ISBN\s*([0-9Xx\-]{10,17})", l)
                if m:
                    isbn = m.group(1)
                    l = l.replace(m.group(0), "").strip()
                if l:
                    desc.append(l)
        spine = re.sub(r"[『』「」<>]", "", title)[:30]
        btns = "".join(f'<a class="gs-btn {"gs-btn--primary" if i == 0 else ""}" href="{e(u)}" target="_blank" rel="noopener">{e(n)}</a>'
                       for i, (n, u) in enumerate(buy))
        cards.append(f'''<article class="gs-book"><div class="gs-book__cover" aria-hidden="true"><span>{e(spine)}</span></div>
<div class="gs-book__body"><h3 class="gs-book__title">{e(title)}</h3><p class="gs-book__by">{e(byline)}</p>
<p class="gs-book__desc">{inline_html(" ".join(desc))}</p>{f'<p class="gs-book__isbn">ISBN {e(isbn)}</p>' if isbn else ""}
<div class="gs-book__buy">{btns}</div></div></article>''')
    return f'<div class="gs-books">{"".join(cards)}</div>'


def c_list(b, cls="gs-list"):
    tag = "ol" if b["ordered"] else "ul"
    lis = []
    for it in b["items"]:
        sub = ""
        if it["children"]:
            sub = "<ul>" + "".join(f"<li>{inline_html(c['text'])}</li>" for c in it["children"]) + "</ul>"
        lis.append(f"<li>{inline_html(it['text'])}{sub}</li>")
    return f'<{tag} class="{cls}">{"".join(lis)}</{tag}>'


def c_table(b):
    th = "".join(f"<th>{inline_html(c)}</th>" for c in b["header"])
    trs = "".join("<tr>" + "".join(f"<td>{inline_html(c)}</td>" for c in r) + "</tr>" for r in b["rows"])
    return f'<div class="gs-table"><table><thead><tr>{th}</tr></thead><tbody>{trs}</tbody></table></div>'


def c_placeholder(kind, text):
    if kind == "IMAGE":
        return f'<div class="gs-ph gs-ph--image"><strong>이미지 자리</strong><span>{e(text)}</span><small>권장 1200×800 · 설명형 alt 필수</small></div>'
    return f'<div class="gs-ph"><strong>작성 필요</strong><span>{e(text)}</span></div>'


# ---------------------------------------------------------------- body walk

def render_body(body: str):
    blocks = parse_blocks(body)
    out, toc, spec, holes = [], [], [], []
    section, kind = "도입부", "body"
    i = 0
    while i < len(blocks):
        b = blocks[i]
        t = b["type"]
        if t == "heading" and b["level"] == 1:
            i += 1
            continue
        if t == "heading" and b["level"] == 2:
            section, kind = b["text"], section_kind(b["text"])
            hid = slugify_heading(b["text"])
            toc.append((hid, b["text"]))
            out.append(f'<h2 id="{hid}" class="gs-h2">{inline_html(b["text"])}</h2>')
            spec.append((section, "H2 소제목", "24px Bold · 위 56px 여백 · 아래 브랜드색 짧은 밑줄"))
            i += 1
            continue
        if kind == "faq" and t == "heading" and b["level"] == 3:
            q, ans = b["text"], []
            i += 1
            while i < len(blocks) and not (blocks[i]["type"] == "heading" and blocks[i]["level"] <= 3):
                if blocks[i]["type"] == "paragraph":
                    ans.append(f"<p>{inline_html(blocks[i]['text'])}</p>")
                i += 1
            out.append(f'<details class="gs-faq"><summary>{inline_html(q)}</summary><div>{"".join(ans)}</div></details>')
            if not spec or spec[-1][1] != "FAQ 아코디언":
                spec.append((section, "FAQ 아코디언", "질문 클릭 시 펼침 · FAQPage 스키마 자동"))
            continue
        if t == "heading":
            out.append(f'<h{b["level"]} class="gs-h{b["level"]}">{inline_html(b["text"])}</h{b["level"]}>')
        elif t == "paragraph":
            im = re.fullmatch(r"!\[([^\]]*)\]\(([^)\s]+)\)", b["text"].strip())
            if im:
                out.append(f'<figure class="gs-figure"><img src="{e(im.group(2))}" alt="{e(im.group(1))}" loading="lazy">'
                           f'<figcaption>{e(im.group(1))}</figcaption></figure>')
                spec.append((section, "이미지", "본문 폭 꽉 채움 · 둥근 모서리 · 캡션"))
            else:
                cls = ' class="gs-lead"' if section == "도입부" else ""
                out.append(f"<p{cls}>{inline_html(b['text'])}</p>")
        elif t == "quote":
            raw = b.get("raw", "")
            if "핵심" in raw.split("\n")[0]:
                out.append(c_summary(raw))
                spec.append((section, "요약 카드", "브랜드색 연한 배경 · 굵은 라벨 · 3줄 목록"))
            elif sum(1 for l in raw.split("\n") if SCRIPT_LINE.match(l.strip())) >= 2:
                out.append(c_script(raw))
                spec.append((section, "대본 박스", "종이 질감 배경 · 인물명 굵게 왼쪽 정렬 · 지문은 이탤릭 회색"))
            else:
                out.append(c_callout(raw))
                spec.append((section, "콜아웃", "팁/주의/참고 라벨 · 왼쪽 강조선"))
        elif t == "list":
            if kind == "books":
                out.append(c_books(b["items"]))
                spec.append((section, f"도서 카드 ×{len(b['items'])}", "표지 자리 · 제목/저자 · 추천 이유 · 구매 버튼"))
            elif kind == "sources":
                out.append(c_list(b, "gs-sources"))
                spec.append((section, "출처 목록", "14px 회색 · 링크 밑줄"))
            elif b["ordered"] and all(it["text"].startswith("**") for it in b["items"]):
                out.append(c_steps(b["items"]))
                spec.append((section, f"단계 카드 ×{len(b['items'])}", "번호 원형 배지 · 굵은 제목 + 설명"))
            else:
                out.append(c_list(b))
                spec.append((section, "목록", "브랜드색 불릿 · 항목 간 8px"))
        elif t == "table":
            out.append(c_table(b))
            spec.append((section, f"표 ({len(b['rows'])}행)", "머리행 브랜드색 연한 배경 · 모바일 가로 스크롤"))
        elif t == "html":
            for m in re.finditer(r"<!--\s*(TODO|IMAGE)\s*:\s*(.*?)\s*-->", b["text"], re.S):
                out.append(c_placeholder(m.group(1), m.group(2)))
                holes.append((section, m.group(1), m.group(2)))
                spec.append((section, "이미지 자리" if m.group(1) == "IMAGE" else "작성 필요 자리", m.group(2)))
            if "<script" not in b["text"] and "<!--" not in b["text"]:
                out.append(b["text"])
        elif t == "hr":
            out.append('<hr class="gs-hr">')
        elif t == "code":
            out.append(f"<pre class=\"gs-code\"><code>{e(b['text'])}</code></pre>")
        i += 1
    return "\n".join(out), toc, spec, holes


# ---------------------------------------------------------------- css

def css(d):
    return f"""
:root{{--gs-primary:{d['primary']};--gs-primary-ink:{d['primary_ink']};--gs-accent:{d['accent']};--gs-text:{d['text']};
--gs-muted:{d['muted']};--gs-bg:{d['bg']};--gs-surface:{d['surface']};--gs-line:{d['line']};--gs-radius:{d['radius']};
--gs-tint:color-mix(in srgb,var(--gs-primary) 8%,white);--gs-width:{d['content_width']}}}
.gs-article{{font-family:{d['font_family']};font-size:{d['body_size']};line-height:{d['line_height']};color:var(--gs-text);
word-break:keep-all;overflow-wrap:break-word}}
.gs-article p{{margin:0 0 1.1em}}
.gs-article a{{color:var(--gs-primary);text-underline-offset:3px}}
.gs-lead{{font-size:1.06em}}
.gs-h2{{font-size:1.45em;line-height:1.4;font-weight:800;margin:2.6em 0 .8em;padding-bottom:.45em;position:relative;letter-spacing:-.01em}}
.gs-h2::after{{content:"";position:absolute;left:0;bottom:0;width:40px;height:4px;border-radius:2px;background:var(--gs-primary)}}
.gs-h3{{font-size:1.15em;font-weight:700;margin:1.8em 0 .6em}}
.gs-summary{{background:var(--gs-tint);border-radius:var(--gs-radius);padding:22px 24px;margin:0 0 1.8em;border:1px solid color-mix(in srgb,var(--gs-primary) 18%,white)}}
.gs-summary__label{{font-weight:800;color:var(--gs-primary);margin:0 0 .5em!important;font-size:.9em;letter-spacing:.02em}}
.gs-summary ul{{margin:0;padding-left:1.1em}} .gs-summary li{{margin:.3em 0}}
.gs-script{{margin:1.4em 0 1.8em;background:#FBF8F1;border:1px solid #EEE6D3;border-radius:var(--gs-radius);padding:20px 22px;font-size:.96em}}
.gs-script figcaption{{font-size:.78em;font-weight:700;color:#9A8A62;letter-spacing:.08em;margin-bottom:10px}}
.gs-script__line{{display:grid;grid-template-columns:4.5em 1fr;gap:10px;margin:.35em 0}}
.gs-script__who{{font-weight:800}} .gs-script__direction{{color:#7C7465;font-style:italic;margin:.35em 0}}
.gs-callout{{border-left:4px solid var(--gs-primary);background:var(--gs-surface);border-radius:0 var(--gs-radius) var(--gs-radius) 0;padding:16px 20px;margin:1.4em 0}}
.gs-callout--warn{{border-color:#E5484D}} .gs-callout--tip{{border-color:var(--gs-accent)}}
.gs-callout__tag{{display:inline-block;font-size:.75em;font-weight:800;padding:2px 8px;border-radius:99px;background:var(--gs-primary);color:var(--gs-primary-ink);margin-bottom:6px}}
.gs-callout p:last-child{{margin:0}}
.gs-list{{padding-left:1.2em;margin:0 0 1.3em}} .gs-list li{{margin:.4em 0}} .gs-list li::marker{{color:var(--gs-primary);font-weight:700}}
.gs-steps{{list-style:none;padding:0;margin:1.2em 0 1.6em;display:grid;gap:12px}}
.gs-step{{display:flex;gap:14px;align-items:flex-start;background:var(--gs-bg);border:1px solid var(--gs-line);border-radius:var(--gs-radius);padding:16px 18px}}
.gs-step__num{{flex:0 0 34px;height:34px;border-radius:50%;background:var(--gs-primary);color:var(--gs-primary-ink);display:grid;place-items:center;font-weight:800}}
.gs-step p{{margin:0}} .gs-step__title{{font-weight:800;margin-bottom:4px!important}}
.gs-table{{overflow-x:auto;margin:1.2em 0 1.6em;border:1px solid var(--gs-line);border-radius:var(--gs-radius)}}
.gs-table table{{border-collapse:collapse;width:100%;min-width:520px;font-size:.92em}}
.gs-table th{{background:var(--gs-tint);text-align:left;font-weight:800;padding:12px 14px;border-bottom:1px solid var(--gs-line)}}
.gs-table td{{padding:12px 14px;border-bottom:1px solid var(--gs-line);vertical-align:top}} .gs-table tr:last-child td{{border-bottom:0}}
.gs-faq{{border:1px solid var(--gs-line);border-radius:var(--gs-radius);margin:10px 0;background:var(--gs-bg)}}
.gs-faq summary{{cursor:pointer;font-weight:700;padding:16px 44px 16px 18px;list-style:none;position:relative}}
.gs-faq summary::-webkit-details-marker{{display:none}}
.gs-faq summary::after{{content:"+";position:absolute;right:18px;top:12px;font-size:1.4em;color:var(--gs-primary)}}
.gs-faq[open] summary::after{{content:"–"}} .gs-faq div{{padding:0 18px 4px;color:#374151}}
.gs-books{{display:grid;gap:14px;margin:1.2em 0 1.6em}}
.gs-book{{display:grid;grid-template-columns:96px 1fr;gap:18px;border:1px solid var(--gs-line);border-radius:var(--gs-radius);padding:18px;background:var(--gs-bg)}}
.gs-book__cover{{aspect-ratio:2/3;border-radius:6px;background:linear-gradient(160deg,var(--gs-primary),color-mix(in srgb,var(--gs-primary) 55%,black));
color:var(--gs-primary-ink);display:flex;align-items:flex-end;padding:10px;font-weight:800;font-size:13px;line-height:1.3;box-shadow:inset 6px 0 0 rgba(0,0,0,.15)}}
.gs-book__title{{margin:0 0 2px;font-size:1.05em;font-weight:800}} .gs-book__by{{margin:0 0 8px!important;color:var(--gs-muted);font-size:.88em}}
.gs-book__desc{{font-size:.94em;margin-bottom:6px!important}} .gs-book__isbn{{font-size:.78em;color:var(--gs-muted);margin-bottom:10px!important}}
.gs-book__buy{{display:flex;flex-wrap:wrap;gap:8px}}
.gs-btn{{display:inline-block;font-size:.84em;font-weight:700;padding:7px 14px;border-radius:99px;border:1px solid var(--gs-line);text-decoration:none!important;color:var(--gs-text)!important;background:var(--gs-bg)}}
.gs-btn--primary{{background:var(--gs-primary);border-color:var(--gs-primary);color:var(--gs-primary-ink)!important}}
.gs-sources{{font-size:.86em;color:var(--gs-muted);padding-left:1.1em}} .gs-sources a{{color:var(--gs-muted)}}
.gs-ph{{border:2px dashed #F0A43A;background:#FFF8EC;border-radius:var(--gs-radius);padding:16px 18px;margin:1.4em 0;display:flex;flex-direction:column;gap:4px;font-size:.92em}}
.gs-ph strong{{color:#B45309}} .gs-ph small{{color:#92400E}}
.gs-ph--image{{min-height:200px;justify-content:center;align-items:center;text-align:center;border-color:#C7CCD6;background:var(--gs-surface)}}
.gs-ph--image strong{{color:var(--gs-muted)}} .gs-ph--image small{{color:var(--gs-muted)}}
.gs-figure{{margin:1.4em 0}} .gs-figure img{{width:100%;border-radius:var(--gs-radius)}} .gs-figure figcaption{{font-size:.84em;color:var(--gs-muted);text-align:center;margin-top:6px}}
.gs-hr{{border:0;border-top:1px solid var(--gs-line);margin:2.4em 0}}
@media (max-width:640px){{.gs-article{{font-size:16px}} .gs-book{{grid-template-columns:72px 1fr;gap:14px;padding:14px}}
.gs-script__line{{grid-template-columns:1fr;gap:0}} .gs-summary{{padding:18px}}}}
"""


PAGE_CSS = """
*{box-sizing:border-box} body{margin:0;background:var(--gs-bg);color:var(--gs-text);font-family:inherit}
.pg-header{position:sticky;top:0;z-index:10;background:rgba(255,255,255,.92);backdrop-filter:blur(8px);border-bottom:1px solid var(--gs-line)}
.pg-header__in{max-width:1120px;margin:0 auto;padding:14px 20px;display:flex;align-items:center;gap:12px}
.pg-logo{display:flex;align-items:center;gap:10px;font-weight:800;font-size:18px;color:var(--gs-text);text-decoration:none}
.pg-logo__mark{width:30px;height:30px;border-radius:8px;background:var(--gs-primary);color:var(--gs-primary-ink);display:grid;place-items:center;font-size:14px}
.pg-logo img{height:30px}
.pg-wordmark{font-weight:900;letter-spacing:.1em;font-size:16px;color:var(--gs-text)}
.pg-nav a{color:var(--gs-text);text-decoration:none;font-weight:500} .pg-nav a:hover{color:var(--gs-accent)}
.pg-crumb a{color:inherit;text-decoration:none} .pg-crumb a b{color:var(--gs-primary)}
.pg-related__list{list-style:none;padding:0;margin:0;display:grid;gap:8px} .pg-related__list a{display:block;padding:14px 16px;border:1px solid var(--gs-line);border-radius:var(--gs-radius);background:var(--gs-surface);color:var(--gs-text);text-decoration:none;font-weight:600}
.pg-nav{margin-left:auto;display:flex;gap:18px;font-size:14px;color:var(--gs-muted)}
.pg-hero{background:linear-gradient(180deg,var(--gs-tint),var(--gs-bg));padding:48px 0 28px}
.pg-grid{max-width:1120px;margin:0 auto;padding:0 20px;display:grid;grid-template-columns:minmax(0,var(--gs-width));justify-content:center;column-gap:48px}
@media (min-width:1100px){.pg-grid{grid-template-columns:minmax(0,var(--gs-width)) 240px}}
.pg-crumb{font-size:13px;color:var(--gs-muted);margin-bottom:14px} .pg-crumb b{color:var(--gs-primary)}
.pg-title{font-size:clamp(26px,4.4vw,38px);line-height:1.3;font-weight:900;letter-spacing:-.02em;margin:0 0 14px;word-break:keep-all}
.pg-desc{font-size:17px;color:#4B5563;margin:0 0 20px;line-height:1.7;word-break:keep-all}
.pg-meta{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:13px;color:var(--gs-muted);align-items:center}
.pg-meta .pg-avatar{width:26px;height:26px;border-radius:50%;background:var(--gs-primary);display:inline-grid;place-items:center;color:var(--gs-primary-ink);font-size:12px;font-weight:800}
.pg-tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:16px} .pg-tags span{font-size:12px;background:var(--gs-bg);border:1px solid var(--gs-line);padding:3px 10px;border-radius:99px;color:var(--gs-muted)}
.pg-cover{margin-bottom:8px}
.pg-cover img,.pg-cover .gs-ph{width:100%;aspect-ratio:1200/630;border-radius:var(--gs-radius);object-fit:cover;margin:0}
.pg-layout{max-width:1120px;margin:0 auto;padding:24px 20px 60px;display:grid;grid-template-columns:minmax(0,var(--gs-width));justify-content:center;gap:48px}
.pg-toc{display:none}
@media (min-width:1100px){.pg-layout{grid-template-columns:minmax(0,var(--gs-width)) 240px}
.pg-toc{display:block;position:sticky;top:84px;align-self:start;font-size:13.5px;border-left:2px solid var(--gs-line);padding-left:16px}
.pg-toc p{font-weight:800;margin:0 0 10px} .pg-toc a{display:block;color:var(--gs-muted);text-decoration:none;padding:5px 0;line-height:1.45} .pg-toc a:hover{color:var(--gs-primary)}}
.pg-toc-inline{border:1px solid var(--gs-line);border-radius:var(--gs-radius);padding:14px 18px;margin:0 0 28px;font-size:15px}
.pg-toc-inline summary{font-weight:800;cursor:pointer} .pg-toc-inline ol{margin:10px 0 0;padding-left:1.2em} .pg-toc-inline a{color:var(--gs-text);text-decoration:none}
@media (min-width:1100px){.pg-toc-inline{display:none}}
.pg-author{display:flex;gap:16px;align-items:flex-start;border-top:1px solid var(--gs-line);margin-top:48px;padding-top:28px}
.pg-author__pic{flex:0 0 56px;height:56px;border-radius:50%;background:var(--gs-tint);display:grid;place-items:center;font-weight:900;color:var(--gs-primary);font-size:20px}
.pg-author__name{font-weight:800;margin:0 0 4px} .pg-author__bio{margin:0;color:var(--gs-muted);font-size:15px;line-height:1.6}
.pg-cta{margin-top:28px;border-radius:calc(var(--gs-radius) + 4px);padding:28px;background:var(--gs-primary);color:var(--gs-primary-ink)}
.pg-cta h3{margin:0 0 6px;font-size:21px} .pg-cta p{margin:0 0 16px;opacity:.9;line-height:1.6}
.pg-cta a{display:inline-block;background:var(--gs-primary-ink);color:var(--gs-primary);font-weight:800;padding:11px 20px;border-radius:99px;text-decoration:none}
.pg-related{margin-top:28px} .pg-related h3{font-size:17px;margin:0 0 10px}
.pg-footer{border-top:1px solid var(--gs-line);padding:28px 20px;text-align:center;font-size:13px;color:var(--gs-muted)}
"""


# ---------------------------------------------------------------- page

def build(article_path, cfg, screenshot=False, out_dir=None, page_name="page.html", noindex=False,
          final=False, canonical=None, related_links=None, write_spec=True):
    """final=True: 발행본 — 비어 있는 자리(대표 이미지·CTA·관련 글·저자)를 자리표시 대신 숨긴다."""
    meta, body = load_article(article_path)
    d = {**DEFAULT_DESIGN, **(cfg.get("design") or {})}
    brand = d.get("brand_name") or cfg.get("brand") or ""
    author = meta.get("author") or cfg.get("author") or ""
    bio = meta.get("author_bio") or cfg.get("author_bio") or ""
    frag, toc, spec, holes = render_body(body)
    chars = len(re.sub(r"\s", "", strip_md(body)))
    minutes = max(1, round(chars / 500))
    date = str(meta.get("date", ""))
    upd = str(meta.get("updated", ""))
    cat = (meta.get("categories") or [""])[0]
    tags = meta.get("tags") or []
    graph = build_jsonld(meta, cfg.get("site_url", ""), author)
    jsonld = "\n".join('<script type="application/ld+json">' + json.dumps(g, ensure_ascii=False) + "</script>" for g in graph)
    site_name = cfg.get("brand") or brand
    page_title = (meta.get("seo_title") or meta.get("title", "")) + (f" | {site_name}" if site_name else "")
    if canonical is None:
        base = cfg.get("site_url", "").rstrip("/")
        col = cfg.get("column_path", "/").strip("/")
        canonical = meta.get("canonical") or (f"{base}/{col + '/' if col else ''}{meta.get('slug', '')}/" if base else "")

    if not author:
        holes.append(("저자 박스", "TODO", "저자 이름·약력 (config.author / author_bio)"))
    if not meta.get("cover"):
        holes.append(("대표 이미지", "IMAGE", "1200×630 대표 이미지(OG 겸용)"))
    if not brand:
        holes.append(("헤더", "TODO", "브랜드명·로고 (config.design.brand_name / logo_url)"))

    cta = d.get("cta") or {}
    cta_html = ""
    if cta.get("title"):
        cta_html = (f'<section class="pg-cta"><h3>{e(cta["title"])}</h3><p>{e(cta.get("text", ""))}</p>'
                    f'<a href="{e(cta.get("url", "#"))}">{e(cta.get("button", "자세히 보기"))}</a></section>')
    else:
        cta_html = c_placeholder("TODO", "브랜드 안내 박스(CTA): 제목·한 줄 설명·버튼 문구·링크 → config.design.cta")
        holes.append(("CTA", "TODO", "브랜드 안내 박스 내용 (config.design.cta)"))
    related = ""
    if related_links:
        related = ('<section class="pg-related"><h3>함께 읽으면 좋은 글</h3><ul class="pg-related__list">' +
                   "".join(f'<li><a href="{e(u)}">{e(t)}</a></li>' for t, u in related_links) + "</ul></section>")
    elif meta.get("internal_links_todo") and not final:
        related = '<section class="pg-related"><h3>함께 읽으면 좋은 글</h3>' + c_placeholder("TODO", "관련 글 2–3개 (같은 주제 클러스터 글 링크)") + "</section>"

    logo = (f'<img src="{e(d["logo_url"])}" alt="{e(brand)}">' if d.get("logo_url")
            else f'<span class="pg-wordmark">{e(brand)}</span>' if brand
            else '<span class="pg-logo__mark">B</span><span>브랜드명</span>')
    nav_links = d.get("nav") or []
    nav_html = ("".join(f'<a href="{e(n.get("url", "#"))}">{e(n.get("label", ""))}</a>' for n in nav_links)
                or f"<span>{e(cat)}</span>")
    col_url = "/" + cfg.get("column_path", "/").strip("/") + "/" if cfg.get("column_path") else ""
    crumb = (f'<a href="/">홈</a> › <a href="{e(col_url)}"><b>{e(cat or "컬럼")}</b></a>' if col_url
             else f'홈 › <b>{e(cat)}</b>')
    gtm_id = cfg.get("gtm_id", "")
    gtm_head = (f"<script>(function(w,d,s,l,i){{w[l]=w[l]||[];w[l].push({{'gtm.start':new Date().getTime(),event:'gtm.js'}});"
                f"var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;"
                f"j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);}})"
                f"(window,document,'script','dataLayer','{e(gtm_id)}');</script>") if gtm_id and not noindex else ""
    if final:
        if not cta.get("title"):
            cta_html = ""
        if not author:
            pass
    author_box = (f'<section class="pg-author"><div class="pg-author__pic">{e((author or "?")[:1])}</div><div>'
                  f'<p class="pg-author__name">{e(author or "저자 이름")}</p><p class="pg-author__bio">{e(bio or "저자 약력을 입력하세요.")}</p></div></section>')
    toc_side = "".join(f'<a href="#{h}">{e(t)}</a>' for h, t in toc if section_kind(t) not in ("sources",))
    toc_inline = "".join(f'<li><a href="#{h}">{e(t)}</a></li>' for h, t in toc if section_kind(t) not in ("sources",))
    cover = (f'<img src="{e(meta["cover"])}" alt="{e(meta.get("cover_alt", meta.get("title", "")))}">' if meta.get("cover")
             else "" if final
             else '<div class="gs-ph gs-ph--image"><strong>대표 이미지 자리</strong><span>썸네일·OG 이미지 겸용</span><small>1200×630 · 텍스트는 이미지 중앙 60% 안에</small></div>')
    if final and not author:
        author_box = ""
    og_image = meta.get("cover", "")
    if og_image and not og_image.startswith("http") and canonical:
        og_image = canonical.rstrip("/") + "/" + og_image.lstrip("./")
    style_tag = f"<style>{css(d)}</style>"
    fragment = f'{style_tag}\n<div class="gs-article">\n{frag}\n</div>'

    page = f"""<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e(page_title)}</title>
<meta name="description" content="{e(meta.get('description', ''))}">
<meta name="robots" content="{'noindex, nofollow' if noindex else 'index, follow, max-image-preview:large'}">
{gtm_head}
<link rel="icon" type="image/png" href="/favicon.png">
{f'<link rel="canonical" href="{e(canonical)}">' if canonical else ''}
<meta property="og:type" content="article"><meta property="og:title" content="{e(meta.get('title', ''))}">
<meta property="og:description" content="{e(meta.get('description', ''))}">{f'<meta property="og:image" content="{e(og_image)}">' if og_image else ''}{f'<meta property="og:url" content="{e(canonical)}">' if canonical else ''}
{f'<meta property="og:site_name" content="{e(site_name)}">' if site_name else ''}
<meta property="article:published_time" content="{e(date)}"><meta property="article:modified_time" content="{e(upd)}">
<link rel="stylesheet" href="{e(d['font_css'])}">
{style_tag}<style>{PAGE_CSS}</style>
{jsonld}
</head><body class="gs-article" style="font-size:16px">
<header class="pg-header"><div class="pg-header__in"><a class="pg-logo" href="/">{logo}</a>
<nav class="pg-nav">{nav_html}</nav></div></header>
<section class="pg-hero"><div class="pg-grid"><div>
<div class="pg-crumb">{crumb}</div>
<h1 class="pg-title">{e(meta.get('title', ''))}</h1>
<p class="pg-desc">{e(meta.get('description', ''))}</p>
<div class="pg-meta"><span class="pg-avatar">{e((author or "?")[:1])}</span><span>{e(author or "저자")}</span><span>·</span>
<span>{e(date)} 작성{f" · {e(upd)} 수정" if upd and upd != date else ""}</span>{f"<span>·</span><span>읽는 시간 {minutes}분</span>" if d.get("show_reading_time") else ""}</div>
<div class="pg-tags">{"".join(f"<span>#{e(str(t))}</span>" for t in tags)}</div>
</div></div></section>
{f'<div class="pg-cover pg-grid"><div>{cover}</div></div>' if cover else ''}
<div class="pg-layout"><main>
{f'<details class="pg-toc-inline"><summary>목차</summary><ol>{toc_inline}</ol></details>' if d.get("show_toc") else ''}
<article class="gs-article">
{frag}
</article>
{author_box}
{cta_html}
{related}
</main>
{f'<nav class="pg-toc"><p>목차</p>{toc_side}</nav>' if d.get("show_toc") else '<span></span>'}
</div>
<footer class="pg-footer">{e(d.get("footer_text") or (f"© {dt.date.today().year} {brand}" if brand else "푸터 · 사업자 정보"))}</footer>
</body></html>"""

    final_dir = os.path.join(os.path.dirname(article_path), "final")
    out = out_dir or final_dir
    os.makedirs(out, exist_ok=True)
    open(os.path.join(out, page_name), "w", encoding="utf-8").write(page)
    if write_spec:
        os.makedirs(final_dir, exist_ok=True)
        open(os.path.join(final_dir, "fragment.html"), "w", encoding="utf-8").write(fragment)
        open(os.path.join(final_dir, "layout-spec.md"), "w", encoding="utf-8").write(spec_md(meta, d, brand, spec, holes, minutes, chars))
    shots = []
    if screenshot:
        shots = take_screenshots(os.path.join(out, page_name), out)
    return out, holes, shots


NAVER_MAP = {
    "요약 카드": "인용구 → 스타일 '포스트잇' 또는 '라인&따옴표', 첫 줄 굵게",
    "대본 박스": "인용구 → 스타일 '말풍선' 또는 '버티컬 라인', 인물명 굵게",
    "콜아웃": "인용구 → '버티컬 라인'",
    "단계 카드": "번호 목록 + 각 항목 제목 굵게 (필요 시 구분선)",
    "도서 카드": "글감 › 책 검색으로 책 카드 삽입 → 아래에 추천 이유 1–2줄",
    "FAQ 아코디언": "소제목(본문2) + 일반 문단 (네이버는 접기 기능 없음)",
    "H2 소제목": "글자 '소제목' 스타일 + 위에 구분선",
    "표": "표 삽입 후 머리행 배경색 브랜드색 10%",
    "이미지 자리": "직접 촬영 사진 업로드(3–5장 이상), 대표사진 지정",
    "작성 필요 자리": "발행 전 반드시 채우기",
    "목록": "글머리 기호 목록",
    "출처 목록": "본문 맨 아래 작은 글씨 · 링크",
}


def spec_md(meta, d, brand, spec, holes, minutes, chars):
    rows = []
    for n, (sec, comp, fmt) in enumerate(spec, 1):
        rows.append(f"| {n} | {sec} | {comp} | {fmt} |")
    nav = []
    seen = set()
    for _, comp, _ in spec:
        key = re.sub(r"\s*[×(].*$", "", comp)
        if key in NAVER_MAP and key not in seen:
            seen.add(key)
            nav.append(f"| {key} | {NAVER_MAP[key]} |")
    hole_rows = "\n".join(f"- [ ] **{s}** · {'이미지' if k == 'IMAGE' else '작성'}: {t}" for s, k, t in holes) or "- 없음"
    return f"""# 레이아웃·서식 명세 — {meta.get('title', '')}

- 브랜드: {brand or '(미정)'} · 분량 {chars}자 · 읽는 시간 약 {minutes}분
- 최종 디자인: `final/page.html` (데스크톱 1100px 이상에서 오른쪽 고정 목차, 모바일에서 접는 목차)
- CMS 본문용: `final/fragment.html` (scoped CSS 포함) · 네이버용: `naver/naver_copy.html`

## 페이지 골격
1. 헤더 — 로고 · 브랜드명 · 카테고리
2. 히어로 — 경로(홈 › {(meta.get('categories') or [''])[0]}) · 제목 H1 · 설명 · 저자/날짜/읽는 시간 · 태그
3. 대표 이미지 — 1200×630
4. 본문 ({d['content_width']}) + 목차(데스크톱 사이드)
5. 저자 박스 → 브랜드 안내(CTA) → 함께 읽을 글 → 푸터

## 본문 섹션별 서식
| # | 섹션 | 컴포넌트 | 서식 |
|---|---|---|---|
{chr(10).join(rows)}

## 디자인 토큰
| 토큰 | 값 |
|---|---|
| 브랜드 주색 | `{d['primary']}` |
| 보조색 | `{d['accent']}` |
| 본문 글자색 / 보조 글자색 | `{d['text']}` / `{d['muted']}` |
| 서체 | Pretendard (본문 {d['body_size']}, 행간 {d['line_height']}) |
| 모서리 | {d['radius']} |
| 본문 폭 | {d['content_width']} |

## 네이버 스마트에디터 서식 가이드
붙여넣기 하면 CSS 서식 일부가 빠지므로 아래 에디터 기능으로 다시 적용합니다.

| 컴포넌트 | 스마트에디터에서 |
|---|---|
{chr(10).join(nav)}

## 발행 전 채워야 할 자리
{hole_rows}
"""


SHOT_JS = r"""
const { chromium } = require('playwright');
(async () => {
  const [file, out] = process.argv.slice(2);
  const b = await chromium.launch();
  for (const [name, vp] of [['desktop', {width: 1280, height: 900}], ['mobile', {width: 390, height: 844}]]) {
    const p = await b.newPage({viewport: vp, deviceScaleFactor: 2});
    await p.goto('file://' + file, {waitUntil: 'networkidle'}).catch(() => {});
    await p.waitForTimeout(400);
    await p.screenshot({path: out + '/' + name + '.png', fullPage: true});
    await p.close();
  }
  await b.close();
})();
"""


def take_screenshots(page, out):
    if not shutil.which("node"):
        print("스크린샷 생략: node 가 없습니다.")
        return []
    js = os.path.join(out, ".shot.js")
    open(js, "w").write(SHOT_JS)
    env = {**os.environ}
    try:
        subprocess.run(["node", js, os.path.abspath(page), os.path.abspath(out)], check=True, capture_output=True, text=True,
                       timeout=120, env=env)
        return [os.path.join(out, "desktop.png"), os.path.join(out, "mobile.png")]
    except Exception as ex:  # playwright missing etc.
        print(f"스크린샷 생략: {getattr(ex, 'stderr', '') or ex}"[:300])
        return []
    finally:
        os.remove(js)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("article")
    ap.add_argument("--config", default="content/geo-seo.config.json" if os.path.exists("content/geo-seo.config.json") else "geo-seo.config.json")
    ap.add_argument("--screenshot", action="store_true")
    a = ap.parse_args()
    cfg = json.load(open(a.config, encoding="utf-8")) if os.path.exists(a.config) else {}
    out, holes, shots = build(a.article, cfg, a.screenshot)
    print(f"최종 디자인 → {out}/page.html")
    print(f"레이아웃 명세 → {out}/layout-spec.md")
    for s in shots:
        print(f"스크린샷 → {s}")
    if holes:
        print(f"발행 전 채울 자리 {len(holes)}곳:")
        for s, k, t in holes:
            print(f"  - [{s}] {t}")


if __name__ == "__main__":
    main()
