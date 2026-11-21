# ARTHEUS — 상단 카테고리 클릭 이동 수정

## 증상

홈페이지 상단 카테고리 또는 CTA 버튼을 클릭하면  
해당 페이지로 이동하지 않고 랜딩 페이지(`/`)로 돌아가는 문제.

## 원인

Figma Make / Lovable preview / 정적 배포 환경에서  
`Link to="/programs"` 같은 BrowserRouter 방식 경로가 서버 rewrite 없이 처리되면  
라우트가 유지되지 않고 홈으로 복귀할 수 있습니다.

또는 프로젝트 안에 `HashRouter` 기준 App.tsx와  
`BrowserRouter`/일반 `<Link>` 기준 Header/Navbar가 섞여 있을 때도 같은 증상이 생깁니다.

## 교체 파일

아래 파일을 그대로 덮어쓰세요.

```txt
src/nav.ts
src/components/Header.tsx
src/components/Navbar.tsx
src/pages/Home.tsx
```

## 적용 후 확인

HashRouter 기준이면 주소가 다음처럼 보여야 정상입니다.

```txt
/#/vision
/#/coaches
/#/programs
/#/lab
/#/column
/#/notices
```
