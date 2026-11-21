# ARTHEUS — Detail Pages Fix Upload Guide

이 ZIP은 기존에 라우트는 잡혀 있지만 실제 상세 페이지 컴포넌트가 없어서
카드/목록 요소를 클릭해도 상세 화면이 나오지 않던 문제를 해결하기 위한 교체 파일 세트입니다.

## 1. 업로드/덮어쓰기 파일

프로젝트 루트 기준으로 아래 파일들을 같은 경로에 넣고 덮어쓰세요.

```txt
src/App.tsx
src/data/detailContent.ts
src/components/detail/DetailFrame.tsx

src/pages/Programs.tsx
src/pages/ProgramDetail.tsx
src/pages/Coaches.tsx
src/pages/CoachDetail.tsx
src/pages/Zine.tsx
src/pages/ZineDetail.tsx
src/pages/Lab.tsx
src/pages/LabDetail.tsx
src/pages/Column.tsx
src/pages/ColumnDetail.tsx
src/pages/Notices.tsx
src/pages/NoticeDetail.tsx
src/pages/Community.tsx
src/pages/CommunityDetail.tsx

src/pages/AppHome.tsx
src/pages/AppPrograms.tsx
src/pages/AppCoaches.tsx
src/pages/AppZine.tsx
src/pages/AppCommunity.tsx
src/pages/AppLayout.tsx
src/pages/AppContact.tsx
src/pages/AppConsult.tsx
src/pages/AppLearn.tsx
```

## 2. 새로 연결되는 상세 라우트

```txt
/programs/:id
/coaches/:id
/zine/:id
/zine/:category/:slug
/lab/:id
/column/:id
/columns/:id
/notices/:id
/notice/:id
/community/:id

/app/programs/:id
/app/coaches/:id
/app/zine/:id
/app/zine/:category/:slug
/app/community/:id
```

## 3. 클릭 연결 수정 내용

- 프로그램 카드 → `/programs/:slug`, `/app/programs/:slug`
- 코치 카드 → `/coaches/:slug`, `/app/coaches/:slug`
- ZINE 카드 → `/zine/:category/:slug`, `/app/zine/:category/:slug`
- LAB 카드 → `/lab/:slug`
- COLUMN 리스트 → `/column/:slug`
- NOTICE 리스트 → `/notices/:slug`
- COMMUNITY 글 → `/community/:slug`, `/app/community/:slug`

## 4. 확인 순서

```bash
pnpm install
pnpm dev
```

아래 주소를 직접 열어 확인하세요.

```txt
/programs/acting
/programs/adult
/coaches/bjjwoo
/zine/audition/audition-camera
/lab/breath-lab
/column/coach-note-interview
/notices/2026-summer-registration
/community/post-first-class
/app/programs/acting
/app/coaches/bjjwoo
/app/zine/audition/audition-camera
/app/community/post-first-class
```

## 5. 주의

이 파일들은 우선 클릭/라우트/상세 화면이 모두 연결되도록 만든 안정화 버전입니다.
나중에 Supabase CMS 실데이터와 완전히 연결하려면 `src/data/detailContent.ts`를
DB fetch 로직과 병합하면 됩니다.
