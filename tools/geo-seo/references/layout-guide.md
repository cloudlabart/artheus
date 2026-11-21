# 레이아웃·컴포넌트 가이드

`scripts/render_page.py` 가 article.md 를 최종 페이지 디자인으로 바꿀 때 쓰는 규칙입니다. 작가는 아래 Markdown 문법만 지키면 되고, 디자인은 `geo-seo.config.json › design` 토큰으로 정해집니다.

## 페이지 골격 (자동)
헤더(로고·브랜드명) → 히어로(경로·H1·설명·저자/날짜/읽는 시간·태그) → 대표 이미지(1200×630) → 본문 + 목차(PC 오른쪽 고정, 모바일 접힘) → 저자 박스 → 브랜드 안내(CTA) → 함께 읽을 글 → 푸터

## 본문 컴포넌트
| 쓰는 법 (Markdown) | 최종 디자인 |
|---|---|
| `> **핵심 요약**` + `> - 항목` | 요약 카드 (브랜드색 연한 배경) |
| `> 지문 한 줄` + `> **이름**: 대사` 여러 줄 | 대본 박스 (인물명 열 정렬, 지문은 이탤릭) |
| `> 💡 내용` / `> **팁** 내용` | 팁 콜아웃 |
| `> ⚠️ 내용` / `> **주의** 내용` | 주의 콜아웃 |
| 그 밖의 `> 인용` | 참고 콜아웃 |
| `1. **제목** — 설명` (모든 항목이 굵은 제목으로 시작) | 단계 카드 (번호 배지) |
| 일반 목록 | 브랜드색 불릿 목록 |
| 표 | 머리행 강조 · 모바일 가로 스크롤 |
| `## 자주 묻는 질문` 아래 `### 질문` + 답 문단 | FAQ 아코디언 |
| `## 추천 도서` 아래 번호 목록 (제목줄 / 설명·ISBN / `구매:` 링크줄) | 도서 카드 (표지 자리·구매 버튼) |
| `## 참고 자료` 아래 목록 | 작은 회색 출처 목록 |
| `![alt](url)` 단독 문단 | 캡션 있는 이미지 |
| `<!-- IMAGE: 설명 -->` | 이미지 자리 (크기 안내) |
| `<!-- TODO: 설명 -->` | 작성 필요 자리 (주황 점선) |

## 디자인 토큰 (config.design)
`brand_name`, `logo_url`, `primary`(주색), `primary_ink`(주색 위 글자색), `accent`, `text`, `muted`, `bg`, `surface`, `line`, `radius`, `body_size`, `line_height`, `content_width`, `show_toc`, `show_reading_time`, `footer_text`, `cta{title,text,button,url}`.
브랜드 정보가 정해지면 이 값만 바꾸고 다시 렌더링합니다. 네이버 붙여넣기 파일의 강조색도 `primary`를 따릅니다.

## 채널별 적용
- **최종 디자인 확인**: `final/page.html`, `final/desktop.png`, `final/mobile.png`
- **WordPress**: `wordpress.styled_content: true` 면 `final/fragment.html`(scoped CSS 포함)을 본문으로 보냅니다. 관리자 계정(unfiltered_html)이 아니면 `<style>` 이 제거되므로, 그때는 fragment의 CSS를 테마의 '추가 CSS'에 한 번 넣어 두세요.
- **Markdown(정적 사이트)**: fragment 의 CSS를 사이트 전역 CSS에 넣고, 본문은 같은 class 이름을 쓰는 컴포넌트로 렌더링합니다.
- **네이버**: 스마트에디터가 CSS를 대부분 지우므로 `final/layout-spec.md` › '네이버 스마트에디터 서식 가이드' 표대로 에디터 기능(인용구 스타일·글감 책·구분선)으로 다시 적용합니다.
- **Notion**: Notion 블록 서식(콜아웃·토글·표)으로 변환되며 페이지 디자인은 Notion 기본을 따릅니다.
