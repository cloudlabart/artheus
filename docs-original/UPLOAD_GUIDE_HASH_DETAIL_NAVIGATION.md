# ARTHEUS — 상세 페이지 클릭 이동 재수정 안내

## 증상

목록 페이지 내부 카드 클릭 시 `/programs/acting`, `/coaches/bjjwoo` 같은 상세 경로로 가야 하는데
랜딩 페이지(`/`)로 돌아가는 현상이 발생했습니다.

## 원인

Figma Make / Lovable 미리보기 / 정적 배포 환경에서는 `BrowserRouter`가 서버 fallback과 충돌하면
깊은 경로 이동이 루트 랜딩 페이지로 복귀하는 것처럼 보일 수 있습니다.

이번 수정은 라우터를 `HashRouter` 기준으로 다시 고정합니다.
따라서 실제 이동 주소는 아래처럼 보입니다.

```txt
/#/programs/acting
/#/coaches/bjjwoo
/#/zine/audition/audition-camera
/#/lab/breath-lab
```

브라우저 주소창에는 `#`이 붙지만,
정적 프리뷰 환경에서 가장 안정적으로 상세 페이지가 유지됩니다.

## 업로드/덮어쓰기 대상

아래 폴더와 파일을 프로젝트의 동일 경로에 덮어쓰세요.

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
src/pages/AppLayout.tsx
src/pages/AppHome.tsx
src/pages/AppPrograms.tsx
src/pages/AppCoaches.tsx
src/pages/AppZine.tsx
src/pages/AppCommunity.tsx
src/pages/AppContact.tsx
src/pages/AppConsult.tsx
src/pages/AppLearn.tsx
```

## 확인할 주소

업로드 후에는 브라우저 주소가 아래처럼 hash 형태로 바뀌는지 확인하세요.

```txt
/#/programs/acting
/#/programs/adult
/#/coaches/bjjwoo
/#/zine/audition/audition-camera
/#/lab/breath-lab
/#/column/coach-note-interview
/#/notices/2026-summer-registration
/#/community/post-first-class
/#/app/programs/acting
/#/app/coaches/bjjwoo
/#/app/zine/audition/audition-camera
/#/app/community/post-first-class
```

## 중요

카드 클릭 시 여전히 랜딩으로 돌아가면,
현재 프로젝트가 이 ZIP의 `Programs.tsx`, `Coaches.tsx`, `Zine.tsx`가 아니라
기존 목록 페이지 파일을 계속 import하고 있는 상태일 가능성이 큽니다.

그 경우 `src/App.tsx`의 import 경로와 실제 파일 위치를 먼저 맞춰야 합니다.
