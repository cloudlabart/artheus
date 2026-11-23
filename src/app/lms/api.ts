/**
 * 아터스 LMS 서버와 통신 (server/lms/server.mjs)
 * 주소: VITE_LMS_API 환경 변수 → 없으면 개발 중엔 http://localhost:8787, 배포에선 https://api.c-art.co.kr
 */
const env = (import.meta as any).env?.VITE_LMS_API as string | undefined;
export const API_BASE = env || (location.hostname === 'localhost' || location.hostname === '127.0.0.1' ? 'http://localhost:8787' : 'https://api.c-art.co.kr');
const KEY = 'artheus_token';

export const tokenStore = {
  get: () => { try { return localStorage.getItem(KEY); } catch { return null; } },
  set: (t: string | null) => { try { t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY); } catch {} },
};

export class ApiError extends Error { status: number; constructor(status: number, msg: string) { super(msg); this.status = status; } }

export async function api<T = any>(path: string, opts: { method?: string; body?: unknown; raw?: Blob; headers?: Record<string, string> } = {}): Promise<T> {
  const tok = tokenStore.get();
  let res: Response;
  try {
    res = await fetch(API_BASE + '/api' + path, {
      method: opts.method || (opts.body || opts.raw ? 'POST' : 'GET'),
      headers: { ...(tok ? { Authorization: `Bearer ${tok}` } : {}), ...(opts.body ? { 'Content-Type': 'application/json' } : {}), ...(opts.headers || {}) },
      body: opts.raw ?? (opts.body ? JSON.stringify(opts.body) : undefined),
    });
  } catch {
    throw new ApiError(0, '수업관리 서버에 연결하지 못했어요. 잠시 뒤 다시 시도하세요.');
  }
  const j = await res.json().catch(() => ({}));
  if (!res.ok) { if (res.status === 401 && tok) tokenStore.set(null); throw new ApiError(res.status, j.error || `요청 실패 (${res.status})`); }
  return j as T;
}

export async function uploadFile(file: File) {
  return api<{ id: string; name: string; type: string; size: number }>('/files', { raw: file, headers: { 'Content-Type': file.type || 'application/octet-stream', 'X-File-Name': encodeURIComponent(file.name) } });
}
export async function openFile(id: string) {
  const r = await fetch(`${API_BASE}/api/files/${id}`, { headers: { Authorization: `Bearer ${tokenStore.get()}` } });
  if (!r.ok) throw new ApiError(r.status, '파일을 열 수 없어요.');
  const url = URL.createObjectURL(await r.blob()); window.open(url, '_blank'); setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export type LmsUser = { id: string; username: string; name: string; role: 'admin' | 'coach' | 'student'; phone?: string; active: boolean; invited: boolean; lastLogin: string | null };
export const ROLE_LABEL = { admin: '관리자', coach: '강사', student: '학생' } as const;
export const ATT_LABEL: Record<string, string> = { present: '출석', late: '지각', absent: '결석', excused: '공결' };
export const fmtDate = (d?: string | null) => { if (!d) return ''; const x = new Date(d.length === 10 ? d + 'T00:00' : d); return isNaN(+x) ? d : `${x.getMonth() + 1}.${x.getDate()} (${'일월화수목금토'[x.getDay()]})`; };
