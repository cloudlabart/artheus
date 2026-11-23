/**
 * 로그인 상태 — 아터스 LMS 서버(server/lms)와 연결
 * 토큰은 브라우저(localStorage)에 두고, 처음 열 때 /auth/me 로 확인합니다.
 * Header 등은 기존처럼 useAuth().user.roles 를 씁니다.
 */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, tokenStore, type LmsUser } from '../lms/api';

export type AuthUser = {
  id: string;
  email: string;
  username?: string;
  realName?: string;
  roles: string[];
  role: LmsUser['role'];
};

type AuthValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<AuthUser>;
  acceptInvite: (code: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
};

const toAuth = (u: LmsUser): AuthUser => ({ id: u.id, email: u.username, username: u.username, realName: u.name, roles: [u.role], role: u.role });

const AuthContext = createContext<AuthValue>({
  user: null, isAuthenticated: false, loading: false,
  login: async () => { throw new Error('no auth'); }, acceptInvite: async () => { throw new Error('no auth'); }, logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(!!tokenStore.get());

  useEffect(() => {
    if (!tokenStore.get()) return;
    api<{ user: LmsUser }>('/auth/me').then((r) => setUser(toAuth(r.user))).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const r = await api<{ token: string; user: LmsUser }>('/auth/login', { body: { username, password } });
    tokenStore.set(r.token); const u = toAuth(r.user); setUser(u); return u;
  }, []);
  const acceptInvite = useCallback(async (code: string, password: string) => {
    const r = await api<{ token: string; user: LmsUser }>('/auth/invite/accept', { body: { code, password } });
    tokenStore.set(r.token); const u = toAuth(r.user); setUser(u); return u;
  }, []);
  const logout = useCallback(async () => {
    try { await api('/auth/logout', { method: 'POST' }); } catch {}
    tokenStore.set(null); setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, acceptInvite, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export const homeFor = (u: AuthUser | null) => (!u ? '/login' : u.role === 'admin' ? '/admin' : u.role === 'coach' ? '/coach' : '/my');
