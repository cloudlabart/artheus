/**
 * 로그인 상태 (뼈대 버전)
 * 원본은 Supabase Auth로 로그인·역할(admin/coach/user)을 관리했습니다.
 * 지금은 항상 '로그아웃 상태'로 동작합니다. 로그인 기능을 다시 붙일 때 이 파일만 바꾸면
 * Header 등 useAuth()를 쓰는 곳은 그대로 동작합니다.
 */
import { createContext, useContext, type ReactNode } from 'react';

export type AuthUser = {
  id: string;
  email: string;
  username?: string;
  realName?: string;
  roles: string[];
};

type AuthValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthValue>({
  user: null,
  isAuthenticated: false,
  loading: false,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider value={{ user: null, isAuthenticated: false, loading: false, logout: async () => {} }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
