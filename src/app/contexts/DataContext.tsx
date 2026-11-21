/**
 * 사이트 데이터 (뼈대 버전)
 * 원본은 Supabase 서버에서 코치·프로그램 등을 불러왔습니다.
 * 지금은 빈 목록을 돌려주며, 홈 화면은 자체 기본값(배준우 경력 등)으로 표시됩니다.
 */
import { createContext, useContext, type ReactNode } from 'react';

export type Coach = {
  id: string;
  nameKo?: string;
  career?: string[] | string;
  photoUrl?: string;
  [key: string]: unknown;
};

type DataValue = { coaches: Coach[] };

const DataContext = createContext<DataValue>({ coaches: [] });

export function DataProvider({ children }: { children: ReactNode }) {
  return <DataContext.Provider value={{ coaches: [] }}>{children}</DataContext.Provider>;
}

export const useData = () => useContext(DataContext);
