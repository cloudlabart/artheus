/**
 * ARTHEUS 웹 — 앱 뼈대
 *
 * 원본(Figma Make)의 구조를 그대로 따릅니다.
 *  - HashRouter: 주소가 /#/login 처럼 동작해 어느 호스팅에서도 새로고침이 깨지지 않습니다.
 *  - 공개 페이지(비전·코치·프로그램 등)는 nav.ts의 go('vision') 호출로 화면만 바뀝니다.
 *  - 로그인·마이페이지·강사 콘솔·관리자는 src/app/lms (서버: server/lms). artheus ON은 아직 자리표시 화면입니다.
 */
import { useState, useEffect, type ReactNode, startTransition } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { QuickMenu } from './components/QuickMenu';
import { CursorGlow } from './components/CursorGlow';
import { PageKey, _registerNavHandler } from './nav';
import { Home } from './pages/Home';
import { Placeholder } from './pages/Placeholder';
import { LoginPage } from './lms/LoginPage';
import { AdminRoutes, CoachRoutes, MyRoutes } from './lms/Dashboards';

// 로그인이 필요한 화면 → 주소 경로
const PROTECTED: Partial<Record<PageKey, string>> = {
  login: '/login', signup: '/signup', my: '/my',
  admin: '/admin', coach: '/coach', setup: '/setup', research: '/research',
};

// 공개 페이지 이름표 (원본 페이지를 옮기거나 새로 만들 때 이 표에서 하나씩 교체)
const PAGES: Partial<Record<PageKey, { title: string; eyebrow: string; desc: string }>> = {
  vision:               { eyebrow: 'VISION',    title: '비전',          desc: 'artheus가 연기를 가르치는 방식과 방향.' },
  programs:             { eyebrow: 'PROGRAMS',  title: '프로그램',      desc: '입시반 · 재수반 · 성인 전문 배우 과정 안내.' },
  'programs-admission': { eyebrow: 'ADMISSION', title: '입시 클래스',   desc: '대학별 실기에 맞춘 입시 연기 과정.' },
  'program-detail':     { eyebrow: 'PROGRAM',   title: '프로그램 상세', desc: '선택한 프로그램의 상세 안내.' },
  coaches:              { eyebrow: 'COACHES',   title: '코치진',        desc: '연습생·예고 출신 강사진 소개.' },
  'coach-detail':       { eyebrow: 'COACH',     title: '코치 상세',     desc: '코치 경력과 수업 방식.' },
  lab:                  { eyebrow: 'LAB',       title: 'LAB',           desc: '연구와 워크숍 기록.' },
  'lab-detail':         { eyebrow: 'LAB',       title: 'LAB 상세',      desc: 'LAB 글 상세.' },
  column:               { eyebrow: 'COLUMN',    title: '컬럼',          desc: '연기와 입시에 관한 글.' },
  'column-detail':      { eyebrow: 'COLUMN',    title: '컬럼 상세',     desc: '컬럼 글 상세.' },
  zine:                 { eyebrow: 'ZINE',      title: 'Zine',          desc: 'artheus 매거진.' },
  'zine-detail':        { eyebrow: 'ZINE',      title: 'Zine 상세',     desc: 'Zine 글 상세.' },
  notices:              { eyebrow: 'NOTICE',    title: '공지',          desc: '모집·일정 공지.' },
  'notice-detail':      { eyebrow: 'NOTICE',    title: '공지 상세',     desc: '공지 상세.' },
  community:            { eyebrow: 'COMMUNITY', title: '커뮤니티',      desc: '수강생 커뮤니티.' },
  contact:              { eyebrow: 'CONTACT',   title: '문의',          desc: '협업·제휴 문의.' },
  consult:              { eyebrow: 'CONSULT',   title: '상담 신청',     desc: '1:1 연기 상담 신청.' },
  scholarship:          { eyebrow: 'SCHOLARSHIP', title: '장학 지원',   desc: '장학 프로그램 지원.' },
};

const LIST_OF: Partial<Record<PageKey, PageKey>> = {
  'program-detail': 'programs', 'coach-detail': 'coaches', 'lab-detail': 'lab',
  'column-detail': 'column', 'zine-detail': 'zine', 'notice-detail': 'notices',
};

// 데스크톱 레이아웃
function DL({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F3F0EA] text-[#132B3F]">
      <Header />
      <main className="flex-1 pt-16 lg:pt-20">{children}</main>
      <Footer />
      <QuickMenu />
    </div>
  );
}

// 공개 사이트 페이지 렌더러
function PublicPageRenderer({ page, onBack }: { page: PageKey; onBack: (to: PageKey) => () => void }) {
  const meta = PAGES[page];
  if (!meta) return <Home />;
  const list = LIST_OF[page];
  return <Placeholder {...meta} onBack={list ? onBack(list) : undefined} />;
}

function AppRoutes() {
  const [page, setPage] = useState<PageKey>('home');
  const navigate = useNavigate();

  const navHandler = (p: PageKey, _id?: string) => {
    const protectedPath = PROTECTED[p];
    if (protectedPath) {
      startTransition(() => { navigate(protectedPath); });
      return;
    }
    startTransition(() => {
      setPage(p);
      navigate('/');
    });
    window.scrollTo(0, 0);
  };
  _registerNavHandler(navHandler);

  useEffect(() => {
    _registerNavHandler(navHandler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onBack = (to: PageKey) => () => {
    setPage(to);
    window.scrollTo(0, 0);
  };

  const later = (title: string, eyebrow: string) => (
    <DL>
      <Placeholder title={title} eyebrow={eyebrow} desc="원본에 있던 화면입니다. 뼈대에는 아직 옮기지 않았습니다." />
    </DL>
  );

  return (
    <>
      <CursorGlow />
      <Routes>
        <Route path="/login"    element={<DL><LoginPage /></DL>} />
        <Route path="/signup"   element={<Navigate to="/login" replace />} />
        <Route path="/my/*"     element={<DL><MyRoutes /></DL>} />
        <Route path="/admin/*"  element={<DL><AdminRoutes /></DL>} />
        <Route path="/coach/*"  element={<DL><CoachRoutes /></DL>} />
        <Route path="/practice/*" element={later('artheus ON', 'PRACTICE STUDIO')} />
        <Route path="/*" element={
          <DL>
            <PublicPageRenderer page={page} onBack={onBack} />
          </DL>
        } />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </DataProvider>
    </AuthProvider>
  );
}
