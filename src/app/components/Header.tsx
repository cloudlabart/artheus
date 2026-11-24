import { Link, useNavigate } from 'react-router';
import { go, PageKey } from '../nav';
import { useState, useEffect } from 'react';
import { Menu, X, ChevronDown, LayoutDashboard, Settings, LogOut, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Logo } from './Logo';
import { useAuth } from '../contexts/AuthContext';

// DB enum: admin | coach | user  — 'student'/'researcher'는 DB에 없음
function getRoleLabel(roles: string[]) {
  if (roles.includes('admin')) return { label: '관리자', color: 'text-red-500', path: '/admin' };
  if (roles.includes('coach')) return { label: '강사', color: 'text-[#2D5E88]', path: '/coach' };
  return { label: '일반 회원', color: 'text-[#2D5E88]', path: '/my' };
}

type NavItem = { to: string; label: string; highlight?: boolean };

function getNavItems(user: any): NavItem[] {
  const publicItems: NavItem[] = [
    { to: '/vision', label: '비전' },
    { to: '/coaches', label: '코치' },
    { to: '/programs', label: '프로그램' },
    { to: '/lab', label: 'LAB' },
    { to: '/column', label: '컬럼' },
    { to: '/notices', label: '공지' },
  ];

  const imuItem: NavItem = { to: '/practice', label: 'artheus ON', highlight: true };

  if (!user) return publicItems;

  if (user.roles.includes('admin')) {
    return [
      { to: '/admin', label: '관리자 대시보드', highlight: true },
      { to: '/coach', label: '강사 콘솔', highlight: true },
      imuItem,
      { to: '/vision', label: '비전' },
      { to: '/programs', label: '프로그램' },
      { to: '/lab', label: 'LAB' },
      { to: '/notices', label: '공지' },
    ];
  }

  if (user.roles.includes('coach')) {
    return [
      { to: '/coach', label: '강사 콘솔', highlight: true },
      imuItem,
      { to: '/vision', label: '비전' },
      { to: '/programs', label: '프로그램' },
      { to: '/lab', label: 'LAB' },
      { to: '/column', label: '컬럼' },
      { to: '/notices', label: '공지' },
    ];
  }

  return [...publicItems, imuItem];
}

// 공개 nav 경로 → PageKey 매핑
const NAV_PAGE_MAP: Record<string, string> = {
  '/vision': 'vision', '/coaches': 'coaches', '/programs': 'programs',
  '/lab': 'lab', '/column': 'column', '/notices': 'notices',
  '/community': 'community', '/zine': 'zine', '/contact': 'contact', '/consult': 'consult',
};

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [activePage, setActivePage] = useState<PageKey>('home');
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  // go() 호출 시 __currentPage가 업데이트되므로 감지해 활성 표시 갱신
  useEffect(() => {
    const check = () => {
      const p = (window as any).__currentPage as PageKey | undefined;
      if (p) setActivePage(p);
    };
    const id = setInterval(check, 100);
    return () => clearInterval(id);
  }, []);

  const roleInfo = user ? getRoleLabel(user.roles) : null;

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
    navigate('/login');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-header-court">
      <div className="max-w-[1470px] mx-auto px-4 sm:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">

          {/* Logo — 심볼 + 워드마크 */}
          <button onClick={() => { go('home'); navigate('/'); window.scrollTo(0, 0); }} className="hover:opacity-80 transition-opacity">
            <Logo variant="symbol" size="md" />
          </button>

          {/* Desktop Navigation */}
          <nav aria-label="주요 메뉴" className="hidden lg:flex items-center gap-6 xl:gap-8">
            {getNavItems(user).map(item => {
              const pageKey = NAV_PAGE_MAP[item.to];
              const isActive = pageKey === activePage;
              if (pageKey && !item.highlight) {
                return (
                  <button key={item.to}
                    onClick={() => go(pageKey as any)}
                    className={"text-sm font-medium transition-colors relative pb-0.5 " + (isActive ? 'text-[#A9C5D9]' : 'text-[#C8D9E8] hover:text-[#F3F0EA]')}>
                    {item.label}
                    {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#A9C5D9] rounded-full" />}
                  </button>
                );
              }
              // ARTHEUS ON 전용 스타일 (Syne italic)
              if (item.label === 'artheus ON') {
                return (
                  <Link key={item.to} to={item.to}
                    className="text-sm font-black italic transition-colors hover:opacity-80"
                    style={{ fontFamily: "'Syne', 'DM Sans', sans-serif", color: '#F3F0EA', letterSpacing: '-0.02em' }}>
                    artheus ON
                  </Link>
                );
              }
              return (
                <Link key={item.to} to={item.to}
                  className={"text-sm font-medium transition-colors " + (item.highlight ? 'text-[#A9C5D9] hover:text-[#F3F0EA]' : 'text-[#C8D9E8] hover:text-[#F3F0EA]')}>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User Section - Desktop */}
          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="relative">
                {/* 마이페이지 버튼 */}
                <button
                  onClick={() => setUserMenuOpen(v => !v)}
                  className="flex items-center gap-2.5 px-3 py-2 bg-[#F3F0EA]/10 border border-[#F3F0EA]/20 rounded-full hover:border-[#F3F0EA]/40 transition-all group"
                >
                  {/* 아바타 */}
                  <div className="w-8 h-8 rounded-full bg-[#153956] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {(user.realName || user.username || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex flex-col items-start leading-none">
                    <span className="text-sm font-bold text-[#F3F0EA]">{user.realName || user.username}</span>
                    <span className="text-[10px] font-medium mt-0.5 text-[#A9C5D9]">{roleInfo?.label}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-[#A9C5D9] transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* 드롭다운 메뉴 */}
                <AnimatePresence>
                  {userMenuOpen && (
                    <>
                      {/* 배경 클릭 닫기 */}
                      <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-52 bg-white border border-[#E5E5E5] rounded-2xl shadow-xl z-50 overflow-hidden"
                      >
                        {/* 프로필 */}
                        <div className="px-4 py-3.5 border-b border-[#F0F0F0]">
                          <div className="font-bold text-sm">{user.realName || user.username}</div>
                          <div className="text-xs text-[#777777] mt-0.5 truncate">{user.email}</div>
                        </div>

                        {/* 메뉴 */}
                        <div className="py-1.5">
                          <Link
                            to={roleInfo?.path || '/my'}
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[#F5F9FF] hover:text-[#3F7DF5] transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            {roleInfo?.label === '관리자' ? '관리자 대시보드' : roleInfo?.label === '강사' ? '강사 콘솔' : '마이페이지'}
                          </Link>
                          {/* 학생만 마이페이지 세부 메뉴 */}
                          {!user.roles.includes('admin') && !user.roles.includes('coach') && (
                            <>
                              <Link to="/my?tab=notes" onClick={() => setUserMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-2 text-sm text-[#555] hover:bg-[#F5F9FF] hover:text-[#3F7DF5] transition-colors pl-11">
                                연습 일지
                              </Link>
                              <Link to="/my?tab=assignments" onClick={() => setUserMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-2 text-sm text-[#555] hover:bg-[#F5F9FF] hover:text-[#3F7DF5] transition-colors pl-11">
                                과제
                              </Link>
                              <Link to="/my?tab=portfolio" onClick={() => setUserMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-2 text-sm text-[#555] hover:bg-[#F5F9FF] hover:text-[#3F7DF5] transition-colors pl-11">
                                포트폴리오
                              </Link>
                            </>
                          )}
                          <Link to="/my?tab=settings" onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[#F5F9FF] hover:text-[#3F7DF5] transition-colors">
                            <Settings className="w-4 h-4" />
                            설정
                          </Link>
                        </div>

                        <div className="border-t border-[#F0F0F0] py-1.5">
                          <button onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                            <LogOut className="w-4 h-4" />
                            로그아웃
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link to="/login"
                className="flex items-center gap-1.5 px-5 xl:px-6 py-2 rounded-full bg-[#F3F0EA] border border-[#F3F0EA]/30 text-[#132B3F] text-sm hover:bg-white transition-all font-medium">
                <User className="w-3.5 h-3.5" />
                로그인
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
            aria-expanded={mobileMenuOpen}
            className="lg:hidden w-11 h-11 flex items-center justify-center rounded-lg text-[#F3F0EA] hover:bg-white/10 transition-colors">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-[#F3F0EA]/10 bg-[#0A1F33]/95 backdrop-blur-xl overflow-hidden"
          >
            <nav className="max-w-[1470px] mx-auto px-4 sm:px-8 py-6 flex flex-col gap-1">
              {getNavItems(user).map(item => {
                const pageKey = NAV_PAGE_MAP[item.to];
                const isActive = pageKey === activePage;
                if (pageKey && !item.highlight) {
                  return (
                    <button key={item.to}
                      onClick={() => { go(pageKey as any); setMobileMenuOpen(false); }}
                      className={"text-base font-medium transition-colors py-3 border-b border-[#F3F0EA]/10 text-left " + (isActive ? 'text-[#A9C5D9]' : 'text-[#C8D9E8] hover:text-[#F3F0EA]')}>
                      {item.label}
                    </button>
                  );
                }
                if (item.label === 'artheus ON') {
                  return (
                    <Link key={item.to} to={item.to} onClick={() => setMobileMenuOpen(false)}
                      className="text-base font-black italic transition-colors py-3 border-b border-[#F3F0EA]/10"
                      style={{ fontFamily: "'Syne', 'DM Sans', sans-serif", color: '#F3F0EA', letterSpacing: '-0.02em' }}>
                      artheus ON
                    </Link>
                  );
                }
                return (
                <Link key={item.to} to={item.to} onClick={() => setMobileMenuOpen(false)}
                  className={`text-base font-medium transition-colors py-3 border-b border-[#F3F0EA]/10 ${item.highlight ? 'text-[#A9C5D9]' : 'text-[#C8D9E8] hover:text-[#F3F0EA]'}`}>
                  {item.label}
                </Link>
                );
              })}

              {isAuthenticated && user ? (
                <div className="mt-4 pt-2 space-y-2">
                  {/* 프로필 카드 */}
                  <Link to={roleInfo?.path || '/my'} onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-4 bg-gradient-to-r from-[#F7FBFF] to-[#EEF6FF] rounded-2xl border border-[#D8E8FF]">
                    <div className="w-12 h-12 rounded-full bg-[#3F7DF5] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {(user.realName || user.username || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold">{user.realName || user.username}</div>
                      <div className={`text-sm font-medium ${roleInfo?.color}`}>{roleInfo?.label}</div>
                    </div>
                    <LayoutDashboard className="w-5 h-5 text-[#3F7DF5]" />
                  </Link>

                  {/* 세부 링크 */}
                  {!user.roles.includes('admin') && !user.roles.includes('coach') && (
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { to: '/my?tab=notes', label: '연습 일지' },
                        { to: '/my?tab=assignments', label: '과제' },
                        { to: '/my?tab=portfolio', label: '포트폴리오' },
                      ].map(item => (
                        <Link key={item.to} to={item.to} onClick={() => setMobileMenuOpen(false)}
                          className="text-center py-2.5 bg-[#F5F5F5] rounded-xl text-xs font-medium hover:bg-[#DCE8FF] hover:text-[#3F7DF5] transition-colors">
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}

                  <button onClick={handleLogout}
                    className="w-full py-3 rounded-2xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
                    <LogOut className="w-4 h-4" /> 로그아웃
                  </button>
                </div>
              ) : (
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}
                  className="mt-4 px-6 py-3 rounded-full bg-[#F3F0EA] text-[#132B3F] text-center text-sm font-semibold hover:bg-white transition-all">
                  로그인
                </Link>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
