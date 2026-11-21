---
name: content-design
description: 아터스 칼럼 원고를 실제 c-art.co.kr 칼럼 페이지 디자인으로 미리보기(.studio/preview)하고 레이아웃·서식 명세를 만든다. "칼럼 미리보기", "발행될 모습", "레이아웃·서식 정리" 요청에 사용.
argument-hint: "<slug>"
---

# 칼럼 최종 디자인

기준: `tools/geo-seo/references/layout-guide.md`. 디자인 토큰은 `content/geo-seo.config.json › design`(아터스 아이보리·딥블루).

1. `python3 tools/geo-seo/scripts/build_site.py --preview <slug>`
   → `.studio/preview/<slug>/index.html` (발행본과 같은 디자인, 검색 제외 표시)
   → `content/column/<slug>/final/layout-spec.md` (섹션별 서식, 네이버 스마트에디터 서식 가이드, 채울 자리)
2. 스튜디오 칼럼 탭에서 그 칼럼을 누르면 오른쪽 화면에 보인다(데스크톱·모바일 전환).
3. 디자인을 바꾸고 싶으면 원고의 컴포넌트 문법(layout-guide)이나 `design` 토큰을 고치고 1을 다시 실행한다. `public/column/` 은 직접 고치지 않는다.
