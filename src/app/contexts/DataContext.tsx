/**
 * 사이트 데이터 — 코치·프로그램·공지·LAB·웹진
 * 기존 Figma Make 사이트(Supabase)에서 옮긴 공개 내용을 src/content/site.json 에서 읽습니다.
 * 서버 연결 없이 사이트에 포함되어 배포됩니다. 내용을 바꾸려면 site.json 을 고치세요.
 */
import { createContext, useContext, type ReactNode } from 'react';
import content from '../../content/site.json';

export type Coach = {
  id: string;
  nameKo?: string;
  nameEn?: string;
  description?: string;
  specialty?: string;
  bio?: string;
  philosophy?: string;
  career?: string[] | string;
  photoUrl?: string;
  [key: string]: unknown;
};
export type Program = { id: string; title: string; tag: string; category: string; description: string; content: string };
export type LabItem = { id: string; title: string; status: string; category: string; description: string; content: string };
export type Notice = { id: string; title: string; content: string; is_pinned: boolean; created_at: string };
export type ZineArticle = { id: string; title: string; author: string; category: string; content: string; created_at: string };

const coaches: Coach[] = content.coaches.map((c) => ({
  id: c.id, nameKo: c.name_ko, nameEn: c.title, description: c.description, specialty: c.specialty,
  bio: c.bio, philosophy: c.philosophy, career: c.career, photoUrl: c.photo,
}));

type DataValue = { coaches: Coach[]; programs: Program[]; lab: LabItem[]; notices: Notice[]; zine: ZineArticle[] };
const value: DataValue = {
  coaches,
  programs: content.programs as Program[],
  lab: content.lab as LabItem[],
  notices: content.notices as Notice[],
  zine: content.zine as ZineArticle[],
};

const DataContext = createContext<DataValue>(value);

export function DataProvider({ children }: { children: ReactNode }) {
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = () => useContext(DataContext);
