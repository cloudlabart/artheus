---
name: site-image
description: 아터스 사이트에 쓸 이미지를 만든다 — 브랜드 톤에 맞는 프롬프트 작성 → tools/studio/gen-image.mjs로 생성(Gemini/OpenAI) → 직접 열어 확인 → 사이트에 넣기. 키가 없으면 SVG 그래픽으로 대신한다. "이미지 만들어줘", "배경 사진", "일러스트", "히어로 이미지" 요청에 사용.
---

# 사이트 이미지 만들기

## 규칙 (tools/studio/brand-visual.md)
- 실존 인물 얼굴, 합격증·대학 로고 같은 가짜 성과 이미지, 이미지 속 글자는 만들지 않는다.
- 코치 사진은 `public/coaches/`의 실제 사진만 쓴다.

## 순서
1. 어디에 무엇을 넣을지 정하고 비율을 고른다(히어로 16:9, 카드 4:3, 세로 4:5).
2. 영문 프롬프트를 쓴다: 장면 · 빛 · 구도 · 분위기. 브랜드 스타일 문장은 도구가 자동으로 붙인다.
   예: `An empty black-box rehearsal room, a single wooden chair under a soft spotlight, script pages on the floor, morning light from a high window`
3. 생성:
   ```
   node tools/studio/gen-image.mjs --prompt "<프롬프트>" --aspect 16:9 --name <영문-이름>
   ```
   마지막 줄 JSON의 `path`(public/images/gen/…)와 `url`(/images/gen/…)을 쓴다.
4. **Read 도구로 이미지 파일을 열어 직접 본다.** 글자가 생겼거나, 얼굴이 또렷하거나, 톤이 다르면 프롬프트를 고쳐 한 번 더(최대 3번).
5. 코드에 넣는다: `<img src="/images/gen/…" alt="한국어 설명" loading="lazy" className="… object-cover">`. 히어로는 loading="eager".
6. 실패 메시지에 "키가 없어요"가 나오면 사진 대신 SVG/CSS 그래픽(무대 조명 원, 선, 대본 줄 패턴)을 `public/images/gen/<이름>.svg`로 직접 그려 넣고, 최종 답에 "설정 › 이미지 생성에 키를 넣으면 사진으로 바꿀 수 있어요"라고 적는다.

## 최종 답
만든 이미지 경로, 넣은 위치, 쓴 프롬프트 한 줄.
