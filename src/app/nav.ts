export type PageKey =
  | 'home' | 'vision' | 'programs' | 'programs-admission'
  | 'program-detail'
  | 'coaches' | 'coach-detail'
  | 'lab' | 'lab-detail'
  | 'column' | 'column-detail'
  | 'zine' | 'zine-detail'
  | 'notices' | 'notice-detail'
  | 'community' | 'contact' | 'consult' | 'scholarship'
  | 'login' | 'signup' | 'my' | 'admin' | 'coach' | 'setup' | 'research' | 'dashboard';

type NavHandler = (page: PageKey, id?: string) => void;
let _handler: NavHandler | null = null;
let _currentPage: PageKey = 'home';

export function _registerNavHandler(fn: NavHandler) {
  _handler = fn;
  (window as any).__nav = fn;
}

export function getCurrentPage(): PageKey { return _currentPage; }

// 컬럼은 검색엔진이 읽을 수 있는 정적 페이지(/column/)로 따로 발행됩니다 (tools/geo-seo/scripts/build_site.py).
const STATIC_PAGES: Partial<Record<PageKey, (id?: string) => string>> = {
  column: () => '/column/',
  'column-detail': (id) => (id ? `/column/${id}/` : '/column/'),
};

export function go(page: PageKey, id?: string) {
  const staticUrl = STATIC_PAGES[page];
  if (staticUrl) { window.location.assign(staticUrl(id)); return; }
  _currentPage = page;
  (window as any).__currentPage = page;
  const fn = _handler ?? (window as any).__nav as NavHandler | undefined;
  if (fn) { fn(page, id); return; }
  window.location.hash = '/' + page;
}
