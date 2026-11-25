/**
 * 아터스 스튜디오 — 학원 운영(Admin) 서버
 *
 * 화면: /__studio (브라우저형 셸) → /__studio/app/<앱> (각 앱) · /__studio/work (페이지·칼럼·매니저 작업실)
 * 데이터: .studio/data/<컬렉션>.json — 이 컴퓨터에만 저장 (git에 올라가지 않음, 원생 개인정보 보호)
 *         하루 한 번 .studio/backup/<날짜>/ 로 자동 백업
 * 연동 키: .studio/config/integrations.json — 화면에는 가린 값만 보냄
 * 연동: 카카오 알림톡(솔라피 API), 유튜브 Data API, 인스타그램 Graph API.
 *       네이버 스마트플레이스 예약은 공개 API가 없어 예약 파트너센터 엑셀을 가져온다(화면에서 변환 후 bulk 저장).
 * AI 도우미: 광고 대본·웹진 슬라이드·상담 후속 메시지 초안을 Claude에게 JSON으로 받아 온다(파일 수정 없음).
 * 문체: content/style/voice.md(배준우 문체 가이드)를 모든 AI 글쓰기에 넣는다. 첨삭(AI 원문 → 사람 수정본)을
 *       .studio 에 모아 분기마다 학습 → 초안 → 사람이 검토·적용하면 voice.md 와 history/<분기>.md 가 바뀐다.
 */
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { JobManager } from './jobs';

type Json = Record<string, any>;
const COLLECTIONS = new Set(['contacts', 'consults', 'bookings', 'invoices', 'messages', 'templates', 'ads', 'webzines', 'notes', 'style_samples']);
const APPS = new Set(['home', 'crm', 'consult', 'booking', 'kakao', 'billing', 'youtube', 'instagram', 'ads', 'webzine', 'settings', 'style']);
const KIT = new Set(['kit.js', 'kit.css', 'draw.js']);
const MEDIA_TYPES: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif', 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov' };
const MIME: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime' };

function send(res: ServerResponse, code: number, body: unknown) {
  res.statusCode = code; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}
function file(res: ServerResponse, p: string) {
  if (!fs.existsSync(p) || !fs.statSync(p).isFile()) { res.statusCode = 404; return res.end('not found'); }
  res.setHeader('Content-Type', MIME[path.extname(p).toLowerCase()] || 'application/octet-stream'); res.setHeader('Cache-Control', 'no-store');
  res.end(fs.readFileSync(p));
}
function body(req: IncomingMessage, limit = 5 * 1024 * 1024): Promise<any> {
  return new Promise((resolve) => {
    let s = ''; let n = 0;
    req.on('data', (c) => { n += c.length; if (n <= limit) s += c; });
    req.on('end', () => { try { resolve(JSON.parse(s || '{}')); } catch { resolve({}); } });
  });
}
function raw(req: IncomingMessage, limit: number): Promise<Buffer | null> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = []; let n = 0; let over = false;
    req.on('data', (c: Buffer) => { n += c.length; if (n > limit) over = true; else chunks.push(c); });
    req.on('end', () => resolve(over ? null : Buffer.concat(chunks)));
  });
}
const uid = () => Date.now().toString(36) + crypto.randomBytes(3).toString('hex');
const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

/* ── 로컬 저장소 ── */
class Store {
  dir: string; backupDir: string; cfgFile: string;
  constructor(root: string) {
    this.dir = path.join(root, '.studio', 'data');
    this.backupDir = path.join(root, '.studio', 'backup');
    this.cfgFile = path.join(root, '.studio', 'config', 'integrations.json');
    fs.mkdirSync(this.dir, { recursive: true });
  }
  read(col: string): Json[] {
    const f = path.join(this.dir, col + '.json');
    try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return []; }
  }
  write(col: string, items: Json[]) {
    this.backupOnce();
    const f = path.join(this.dir, col + '.json'); const tmp = f + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(items, null, 1)); fs.renameSync(tmp, f);
  }
  backupOnce() {
    const d = path.join(this.backupDir, today());
    if (fs.existsSync(d) || !fs.readdirSync(this.dir).length) return;
    fs.mkdirSync(d, { recursive: true });
    for (const f of fs.readdirSync(this.dir)) if (f.endsWith('.json')) fs.copyFileSync(path.join(this.dir, f), path.join(d, f));
    const all = fs.readdirSync(this.backupDir).sort();
    for (const old of all.slice(0, Math.max(0, all.length - 60))) fs.rmSync(path.join(this.backupDir, old), { recursive: true, force: true });
  }
  config(): Json { try { return JSON.parse(fs.readFileSync(this.cfgFile, 'utf8')); } catch { return {}; } }
  saveConfig(c: Json) {
    fs.mkdirSync(path.dirname(this.cfgFile), { recursive: true });
    fs.writeFileSync(this.cfgFile, JSON.stringify(c, null, 1), { mode: 0o600 });
  }
}

const SECRET_KEYS = ['solapi.apiKey', 'solapi.apiSecret', 'youtube.apiKey', 'instagram.accessToken', 'image.geminiKey', 'image.openaiKey'];
function getPath(o: Json, p: string) { return p.split('.').reduce((a, k) => (a ? a[k] : undefined), o); }
function mask(c: Json) {
  const out = JSON.parse(JSON.stringify(c));
  for (const k of SECRET_KEYS) {
    const [a, b] = k.split('.'); const v = out[a]?.[b];
    if (v) out[a][b] = '••••' + String(v).slice(-4);
  }
  return out;
}

/* ── 외부 API ── */
async function getJson(url: string, init?: RequestInit) {
  const r = await fetch(url, init);
  const t = await r.text(); let j: any; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 300) }; }
  if (!r.ok) throw new Error(j?.error?.message || j?.errorMessage || j?.message || `HTTP ${r.status}`);
  return j;
}
async function youtubeSummary(c: Json) {
  const key = c.youtube?.apiKey; let ch = String(c.youtube?.channel || '').trim();
  if (!key || !ch) throw new Error('설정 › 유튜브에서 API 키와 채널(ID 또는 @핸들)을 넣어 주세요.');
  const q = ch.startsWith('UC') ? `id=${encodeURIComponent(ch)}` : `forHandle=${encodeURIComponent(ch.replace(/^@?/, '@'))}`;
  const chj = await getJson(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&${q}&key=${key}`);
  const it = chj.items?.[0]; if (!it) throw new Error('채널을 찾지 못했습니다.');
  const up = it.contentDetails.relatedPlaylists.uploads;
  const pl = await getJson(`https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=12&playlistId=${up}&key=${key}`);
  const ids = (pl.items || []).map((x: any) => x.contentDetails.videoId).join(',');
  const vids = ids ? await getJson(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${ids}&key=${key}`) : { items: [] };
  return {
    channel: { id: it.id, title: it.snippet.title, thumb: it.snippet.thumbnails?.default?.url, subscribers: +it.statistics.subscriberCount || 0, views: +it.statistics.viewCount || 0, videos: +it.statistics.videoCount || 0 },
    videos: vids.items.map((v: any) => ({ id: v.id, title: v.snippet.title, date: v.snippet.publishedAt, thumb: v.snippet.thumbnails?.medium?.url, views: +v.statistics.viewCount || 0, likes: +v.statistics.likeCount || 0, comments: +v.statistics.commentCount || 0, duration: v.contentDetails.duration })),
  };
}
async function instagramSummary(c: Json) {
  const tok = c.instagram?.accessToken; const id = c.instagram?.userId;
  if (!tok || !id) throw new Error('설정 › 인스타그램에서 액세스 토큰과 비즈니스 계정 ID를 넣어 주세요.');
  const base = 'https://graph.facebook.com/v21.0';
  const prof = await getJson(`${base}/${id}?fields=username,name,followers_count,follows_count,media_count,profile_picture_url&access_token=${tok}`);
  const media = await getJson(`${base}/${id}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=18&access_token=${tok}`);
  return { profile: prof, media: media.data || [] };
}
function solapiAuth(key: string, secret: string) {
  const date = new Date().toISOString(); const salt = crypto.randomBytes(16).toString('hex');
  const sig = crypto.createHmac('sha256', secret).update(date + salt).digest('hex');
  return `HMAC-SHA256 apiKey=${key}, date=${date}, salt=${salt}, signature=${sig}`;
}
async function kakaoSend(c: Json, msgs: { to: string; text: string; variables?: Json }[], templateId?: string) {
  const s = c.solapi || {};
  if (!s.apiKey || !s.apiSecret || !s.pfId || !s.from) throw new Error('설정 › 카카오(솔라피)에서 API 키·시크릿·채널 pfId·발신번호를 넣어 주세요.');
  const messages = msgs.map((m) => ({
    to: m.to.replace(/\D/g, ''), from: String(s.from).replace(/\D/g, ''), text: m.text,
    kakaoOptions: { pfId: s.pfId, ...(templateId ? { templateId, variables: m.variables || {} } : {}), disableSms: !s.smsFallback },
  }));
  return getJson('https://api.solapi.com/messages/v4/send-many/detail', {
    method: 'POST', headers: { Authorization: solapiAuth(s.apiKey, s.apiSecret), 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });
}

/* ── AI 도우미 프롬프트 (파일을 고치지 않고 JSON만 돌려받음) ── */
let VOICE_ROOT = '';
function voice() {
  try { return fs.readFileSync(path.join(VOICE_ROOT, 'content', 'style', 'voice.md'), 'utf8').slice(0, 6000); } catch { return ''; }
}
const V = () => { const v = voice(); return v ? `\n\n[문체 가이드 — 반드시 이 말투로 쓰세요]\n${v}\n` : ''; };
const BRAND = `브랜드: 아터스 ARTHEUS — 홍대 입시 연기학원(연극영화과 입시·배우 훈련). 인스타그램 @artheus_act. 청중: 연기 지망 고등학생~대학생과 학부모. 톤: 친근한 '~해요'체, 과장·합격 보장 표현 금지.`;
const TASKS: Record<string, (i: Json) => string> = {
  ad: (i) => `${BRAND}${V()}
세로형(9:16) 광고 영상의 대본과 장면을 만들어 주세요.
목적: ${i.goal || '상담 문의 늘리기'} / 타깃: ${i.target || '연기 입시 준비생'} / 길이: ${i.seconds || 20}초 / 핵심 메시지: ${i.message || ''} / 채널: ${i.channel || '인스타그램 릴스'}
규칙: 장면 4–7개, 첫 장면 2초 안에 시선을 끄는 질문이나 상황. 화면 글자는 짧게(제목 14자, 보조 28자 이내). 마지막 장면은 행동 유도(@artheus_act DM 상담).
반드시 아래 JSON만 출력:
{"title":"","hook":"","caption":"","hashtags":["#"],"scenes":[{"seconds":3,"headline":"","sub":"","visual":"촬영·이미지 제안","voiceover":""}]}`,
  webzine: (i) => `${BRAND}${V()}
인스타그램 캐러셀(1080×1350) 웹진을 만들어 주세요. 주제: ${i.topic || ''}
${i.slug ? `원문 칼럼: content/column/${i.slug}/article.md 를 Read로 읽고 핵심만 옮기세요.` : ''}
규칙: 7–9장. 1장 표지(질문형 제목), 마지막 장은 저장·DM 상담 유도. 솔루션은 3–5개. 한 장에 문장 3개 이내. 사실이 아닌 수치 금지.
반드시 아래 JSON만 출력:
{"title":"","caption":"","hashtags":["#"],"slides":[{"type":"cover|body|list|quote|cta","kicker":"짧은 머리말","title":"","body":"","items":["목록일 때"]}]}`,
  followup: (i) => `${BRAND}${V()}
아래 상담 메모를 바탕으로 상담 후 보낼 카카오톡 안내 메시지 초안 2개(짧은 것/자세한 것)를 써 주세요. 개인정보(전화번호 등)는 넣지 말고 이름 자리는 #{이름} 으로.
상담 유형: ${i.type || ''} / 관심 과정: ${i.program || ''} / 메모: ${String(i.notes || '').slice(0, 1500)}
반드시 아래 JSON만 출력: {"short":"","long":"","nextAction":"학원이 할 다음 행동 한 줄"}`,
  ytmeta: (i) => `${BRAND}${V()}
유튜브 영상의 제목·설명·태그를 검색에 잘 걸리게 다듬어 주세요. 현재 제목: ${i.title || ''} / 내용 메모: ${i.notes || ''}
반드시 아래 JSON만 출력: {"titles":["후보1","후보2","후보3"],"description":"","tags":[""]}`,
};

/* ── 문체 학습 ── */
export const quarterOf = (d = new Date()) => `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`;
const strip = (s: string) => String(s || '').replace(/^---[\s\S]*?\n---\n/, '').replace(/<!--[\s\S]*?-->/g, '').trim();
function paraDiff(before: string, after: string) {
  const a = strip(before).split(/\n{2,}/).map((x) => x.trim()).filter(Boolean);
  const b = strip(after).split(/\n{2,}/).map((x) => x.trim()).filter(Boolean);
  const sa = new Set(a), sb = new Set(b);
  return { removed: a.filter((x) => !sb.has(x)), added: b.filter((x) => !sa.has(x)) };
}
function styleMeta(root: string) {
  try { return JSON.parse(fs.readFileSync(path.join(root, 'content', 'style', 'meta.json'), 'utf8')); } catch { return {}; }
}
/** 마지막 학습 이후의 첨삭을 모은다: 직접 넣은 샘플 + 웹진·광고(AI 원문 vs 현재) + 칼럼(AI 마지막 버전 vs 현재) */
function collectSamples(root: string, store: Store, since: string) {
  const out: Json[] = [];
  for (const x of store.read('style_samples')) if (!since || String(x.createdAt) > since) out.push(x);
  const pairs = (src: string, title: string, a: any, b: any, field: string) => {
    if (typeof a === 'string' && typeof b === 'string' && a.trim() && a.trim() !== b.trim()) out.push({ kind: 'edit', source: src, title, field, before: a, after: b });
  };
  for (const w of store.read('webzines')) {
    if (!w.aiOriginal || (since && String(w.updatedAt) <= since)) continue;
    pairs('웹진', w.title, w.aiOriginal.caption, w.caption, '캡션');
    (w.aiOriginal.slides || []).forEach((o: Json, i: number) => { const c = (w.slides || [])[i] || {}; for (const f of ['kicker', 'title', 'body']) pairs('웹진', w.title, o[f], c[f], `${i + 1}장 ${f}`); });
  }
  for (const a of store.read('ads')) {
    if (!a.aiOriginal || (since && String(a.updatedAt) <= since)) continue;
    pairs('광고', a.title, a.aiOriginal.caption, a.caption, '캡션');
    (a.aiOriginal.scenes || []).forEach((o: Json, i: number) => { const c = (a.scenes || [])[i] || {}; for (const f of ['headline', 'sub', 'voiceover']) pairs('광고', a.title, o[f], c[f], `장면${i + 1} ${f}`); });
  }
  const dd = path.join(root, '.studio', 'style', 'drafts');
  if (fs.existsSync(dd)) for (const f of fs.readdirSync(dd)) {
    const slug = f.replace(/\.md$/, ''); const cur = path.join(root, 'content', 'column', slug, 'article.md');
    if (!fs.existsSync(cur)) continue;
    const st = fs.statSync(cur); if (since && st.mtime.toISOString() <= since) continue;
    const d = paraDiff(fs.readFileSync(path.join(dd, f), 'utf8'), fs.readFileSync(cur, 'utf8'));
    if (d.removed.length || d.added.length) out.push({ kind: 'edit', source: '칼럼', title: slug, field: '본문 문단', before: d.removed.join('\n\n').slice(0, 3000), after: d.added.join('\n\n').slice(0, 3000) });
  }
  return out;
}
/** 칼럼 AI 작업이 끝날 때마다 그 시점 원고를 "AI 버전"으로 보관 → 이후 사람이 직접 고친 부분만 첨삭으로 잡힘 */
export function rememberAiDrafts(root: string, slugs: string[]) {
  const dd = path.join(root, '.studio', 'style', 'drafts'); fs.mkdirSync(dd, { recursive: true });
  for (const slug of slugs) {
    const f = path.join(root, 'content', 'column', slug, 'article.md');
    if (/^[a-z0-9-]+$/.test(slug) && fs.existsSync(f)) fs.copyFileSync(f, path.join(dd, slug + '.md'));
  }
}
export function addStyleSample(root: string, sample: Json) {
  const st = new Store(root); const items = st.read('style_samples');
  items.push({ ...sample, id: uid(), createdAt: new Date().toISOString() }); st.write('style_samples', items);
}

export function createAdmin(root: string, here: string, jm: JobManager) {
  VOICE_ROOT = root;
  const store = new Store(root);
  const mediaDir = path.join(root, '.studio', 'media');

  return async function handle(req: IncomingMessage, res: ServerResponse, url: string): Promise<boolean> {
    const m = req.method || 'GET';

    /* 화면 */
    if (url === '/__studio' || url === '/__studio/') { file(res, path.join(here, 'shell.html')); return true; }
    if (url === '/__studio/work') { file(res, path.join(here, 'ui.html')); return true; }
    let mm = url.match(/^\/__studio\/app\/([a-z]+)$/);
    if (mm && APPS.has(mm[1])) { file(res, path.join(here, 'apps', mm[1] + '.html')); return true; }
    mm = url.match(/^\/__studio\/kit\/([a-z.]+)$/);
    if (mm && KIT.has(mm[1])) { file(res, path.join(here, 'apps', mm[1])); return true; }
    mm = url.match(/^\/__studio\/media\/([\w.-]+)$/);
    if (mm) { file(res, path.join(mediaDir, mm[1])); return true; }

    /* 미디어 업로드 (광고·웹진용, 이 컴퓨터에만) */
    if (url === '/__studio/api/media' && m === 'POST') {
      const type = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
      const ext = MEDIA_TYPES[type]; if (!ext) { send(res, 415, { error: '이미지(PNG·JPG·WebP·GIF) 또는 영상(MP4·WebM·MOV)만 올릴 수 있습니다.' }); return true; }
      const buf = await raw(req, 200 * 1024 * 1024); if (!buf?.length) { send(res, 413, { error: '파일이 비었거나 200MB를 넘습니다.' }); return true; }
      fs.mkdirSync(mediaDir, { recursive: true });
      const name = `${uid()}.${ext}`; fs.writeFileSync(path.join(mediaDir, name), buf);
      send(res, 200, { url: `/__studio/media/${name}`, type }); return true;
    }

    /* 데이터: /__studio/api/db/<컬렉션>[/<id>|/bulk] */
    mm = url.match(/^\/__studio\/api\/db\/([a-z]+)(?:\/([\w-]+))?$/);
    if (mm) {
      const col = mm[1]; const id = mm[2];
      if (!COLLECTIONS.has(col)) { send(res, 404, { error: '없는 데이터입니다.' }); return true; }
      let items = store.read(col);
      if (m === 'GET' && !id) { send(res, 200, items); return true; }
      if (m === 'GET') { const it = items.find((x) => x.id === id); send(res, it ? 200 : 404, it || { error: '없음' }); return true; }
      if (m === 'POST' && id === 'bulk') {
        const b = await body(req); const key = String(b.key || 'id'); let added = 0, updated = 0;
        for (const raw of Array.isArray(b.items) ? b.items : []) {
          const it = { ...raw }; const k = it[key];
          const ex = k != null && k !== '' ? items.find((x) => x[key] === k) : null;
          if (ex) { Object.assign(ex, it, { id: ex.id, updatedAt: new Date().toISOString() }); updated++; }
          else { items.push({ ...it, id: it.id || uid(), createdAt: new Date().toISOString() }); added++; }
        }
        store.write(col, items); send(res, 200, { added, updated }); return true;
      }
      if (m === 'POST') {
        const b = await body(req); const it = { ...b, id: uid(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        items.push(it); store.write(col, items); send(res, 200, it); return true;
      }
      if (m === 'PUT' && id) {
        const b = await body(req); const i = items.findIndex((x) => x.id === id);
        if (i < 0) { send(res, 404, { error: '없음' }); return true; }
        items[i] = { ...items[i], ...b, id, updatedAt: new Date().toISOString() }; store.write(col, items); send(res, 200, items[i]); return true;
      }
      if (m === 'DELETE' && id) {
        items = items.filter((x) => x.id !== id); store.write(col, items); send(res, 200, { ok: true }); return true;
      }
    }

    /* 백업 내보내기·가져오기 */
    if (url === '/__studio/api/backup' && m === 'GET') {
      const out: Json = { exportedAt: new Date().toISOString() };
      for (const c of COLLECTIONS) out[c] = store.read(c);
      res.setHeader('Content-Disposition', `attachment; filename="artheus-studio-backup-${today()}.json"`);
      send(res, 200, out); return true;
    }
    if (url === '/__studio/api/backup' && m === 'POST') {
      const b = await body(req, 50 * 1024 * 1024); let n = 0;
      for (const c of COLLECTIONS) if (Array.isArray(b[c])) { store.write(c, b[c]); n++; }
      send(res, 200, { restored: n }); return true;
    }

    /* 연동 설정 */
    if (url === '/__studio/api/integrations' && m === 'GET') {
      const c = store.config();
      send(res, 200, { config: mask(c), status: {
        kakao: !!(c.solapi?.apiKey && c.solapi?.apiSecret && c.solapi?.pfId && c.solapi?.from),
        youtube: !!(c.youtube?.apiKey && c.youtube?.channel), instagram: !!(c.instagram?.accessToken && c.instagram?.userId),
        naver: !!c.naver?.placeUrl, image: !!(c.image?.geminiKey || c.image?.openaiKey),
      } }); return true;
    }
    if (url === '/__studio/api/integrations' && m === 'POST') {
      const b = await body(req); const c = store.config();
      for (const [sec, vals] of Object.entries(b || {})) {
        if (typeof vals !== 'object' || !vals) continue;
        c[sec] = c[sec] || {};
        for (const [k, v] of Object.entries(vals as Json)) {
          if (typeof v === 'string' && v.startsWith('••••')) continue; // 가린 값은 그대로 둠
          c[sec][k] = typeof v === 'string' ? v.trim() : v;
        }
      }
      store.saveConfig(c); send(res, 200, { ok: true }); return true;
    }

    /* 유튜브 · 인스타 */
    if (url === '/__studio/api/youtube') { try { send(res, 200, await youtubeSummary(store.config())); } catch (e: any) { send(res, 400, { error: e.message }); } return true; }
    if (url === '/__studio/api/instagram') { try { send(res, 200, await instagramSummary(store.config())); } catch (e: any) { send(res, 400, { error: e.message }); } return true; }

    /* 카카오 알림톡 발송 (솔라피) */
    if (url === '/__studio/api/kakao/send' && m === 'POST') {
      const b = await body(req);
      const msgs = (Array.isArray(b.messages) ? b.messages : []).filter((x: Json) => x.to && x.text).slice(0, 500);
      if (!msgs.length) { send(res, 400, { error: '보낼 대상이 없습니다.' }); return true; }
      const log = store.read('messages');
      try {
        const r = await kakaoSend(store.config(), msgs, b.templateId || undefined);
        for (const x of msgs) log.push({ id: uid(), channel: 'kakao', contactId: x.contactId, name: x.name, text: x.text, templateId: b.templateId || '', status: 'sent', at: new Date().toISOString() });
        store.write('messages', log);
        send(res, 200, { ok: true, count: msgs.length, groupId: r?.groupInfo?._id || r?.groupId });
      } catch (e: any) { send(res, 400, { error: e.message }); }
      return true;
    }

    /* 문체 */
    if (url === '/__studio/api/style' && m === 'GET') {
      const meta = styleMeta(root); const q = quarterOf();
      const hist = fs.existsSync(path.join(root, 'content', 'style', 'history')) ? fs.readdirSync(path.join(root, 'content', 'style', 'history')).filter((f) => f.endsWith('.md')).sort().reverse() : [];
      const samples = collectSamples(root, store, meta.learnedUntil || '');
      const draftF = path.join(root, '.studio', 'style', 'draft.json');
      send(res, 200, { quarter: q, meta, needsUpdate: meta.quarter !== q, guide: voice(), history: hist,
        pending: samples.length, bySource: samples.reduce((a: Json, x) => { a[x.source || x.kind] = (a[x.source || x.kind] || 0) + 1; return a; }, {}),
        recent: samples.slice(-12).reverse(), draft: fs.existsSync(draftF) ? JSON.parse(fs.readFileSync(draftF, 'utf8')) : null });
      return true;
    }
    mm = url.match(/^\/__studio\/api\/style\/history\/([\w.-]+\.md)$/);
    if (mm) { const f = path.join(root, 'content', 'style', 'history', mm[1]); if (fs.existsSync(f)) { res.setHeader('Content-Type', 'text/plain; charset=utf-8'); res.end(fs.readFileSync(f, 'utf8')); } else send(res, 404, { error: '없음' }); return true; }
    if (url === '/__studio/api/style/sample' && m === 'POST') {
      const b = await body(req);
      if (!String(b.after || b.text || '').trim()) { send(res, 400, { error: '내용이 비어 있습니다.' }); return true; }
      addStyleSample(root, { kind: b.kind === 'writing' ? 'writing' : b.kind === 'instruction' ? 'instruction' : 'edit', source: String(b.source || '직접 입력').slice(0, 30), title: String(b.title || '').slice(0, 80), before: String(b.before || '').slice(0, 6000), after: String(b.after || b.text || '').slice(0, 8000), note: String(b.note || '').slice(0, 500) });
      send(res, 200, { ok: true }); return true;
    }
    if (url === '/__studio/api/style/learn' && m === 'POST') {
      if (jm.conflict('style')) { send(res, 409, { error: '문체 학습이 이미 진행 중입니다.' }); return true; }
      const meta = styleMeta(root); const samples = collectSamples(root, store, meta.learnedUntil || '');
      if (samples.length < 3) { send(res, 400, { error: `학습할 첨삭이 ${samples.length}건뿐입니다. 3건 이상 모이면 학습하세요(문체 앱에서 직접 추가할 수도 있어요).` }); return true; }
      const dir = path.join(root, '.studio', 'style'); fs.mkdirSync(dir, { recursive: true });
      let batch = `# ${quarterOf()} 학습 자료 (${samples.length}건)\n\n`;
      for (const [i, x] of samples.entries()) {
        const block = x.kind === 'edit' ? `## ${i + 1}. 첨삭 · ${x.source}${x.title ? ' · ' + x.title : ''}${x.field ? ' · ' + x.field : ''}\n[AI·원문]\n${x.before}\n[배준우 수정]\n${x.after}\n${x.note ? '[메모] ' + x.note + '\n' : ''}\n`
          : x.kind === 'instruction' ? `## ${i + 1}. 수정 지시 · ${x.source}${x.title ? ' · ' + x.title : ''}\n${x.after}\n\n`
          : `## ${i + 1}. 직접 쓴 글 · ${x.source}${x.title ? ' · ' + x.title : ''}\n${x.after}\n\n`;
        if (batch.length + block.length > 90000) break; batch += block;
      }
      fs.writeFileSync(path.join(dir, 'batch.md'), batch);
      const q = quarterOf();
      const prompt = `당신은 한국어 편집자입니다. 아터스 대표 코치 배준우의 문체 가이드를 이번 분기(${q}) 첨삭 자료로 업데이트하세요.
1. Read로 content/style/voice.md (현재 가이드)와 .studio/style/batch.md (이번 분기 첨삭·수정 지시·직접 쓴 글)를 읽으세요.
2. 첨삭에서 "AI가 쓴 것 → 배준우가 고친 것"의 반복되는 패턴(어휘, 문장 길이, 어미, 구조, 빼는 말, 넣는 말)을 찾으세요. 한두 번만 나온 건 규칙으로 만들지 말고 경향으로만 적으세요.
3. 기존 가이드의 형식(제목·말투·자주 쓰는 말·피하는 말·구조·첨삭 예시)을 유지하며 고치세요. 근거 없는 규칙은 추가하지 마세요. 첨삭 예시는 실제 자료에서 3~6개를 "전 → 후" 형태로 짧게 옮기세요(학생 이름 등 개인정보는 빼고).
4. 버전 줄은 "> 버전: ${q} (첨삭 ${samples.length}건 학습)" 으로.
파일을 만들거나 고치지 말고, 아래 JSON 한 덩어리만 출력하세요:
{"markdown":"새 voice.md 전체","summary":"이번 분기에 바뀐 점 3~5줄","changes":["바뀐 규칙 하나씩"]}`;
      const args = ['-p', '--output-format', 'stream-json', '--verbose', '--include-partial-messages', '--permission-mode', 'default', '--allowedTools', 'Read'];
      const j = jm.start({ kind: 'assist', title: `문체 학습 ${q}`, lane: 'style', userText: `문체 학습 ${q} (${samples.length}건)`, prompt, args });
      send(res, 200, { id: j.id, samples: samples.length }); return true;
    }
    if (url === '/__studio/api/style/draft' && m === 'POST') {
      const b = await body(req); const dir = path.join(root, '.studio', 'style'); fs.mkdirSync(dir, { recursive: true });
      if (b.discard) { fs.rmSync(path.join(dir, 'draft.json'), { force: true }); send(res, 200, { ok: true }); return true; }
      if (!String(b.markdown || '').includes('#')) { send(res, 400, { error: '가이드 내용이 비어 있습니다.' }); return true; }
      fs.writeFileSync(path.join(dir, 'draft.json'), JSON.stringify({ quarter: quarterOf(), markdown: b.markdown, summary: b.summary || '', changes: b.changes || [], samples: b.samples || 0, at: new Date().toISOString() }));
      send(res, 200, { ok: true }); return true;
    }
    if (url === '/__studio/api/style/apply' && m === 'POST') {
      const b = await body(req); const dir = path.join(root, 'content', 'style');
      const draftF = path.join(root, '.studio', 'style', 'draft.json');
      if (!fs.existsSync(draftF)) { send(res, 400, { error: '적용할 초안이 없습니다.' }); return true; }
      const d = JSON.parse(fs.readFileSync(draftF, 'utf8')); const md = String(b.markdown || d.markdown);
      fs.mkdirSync(path.join(dir, 'history'), { recursive: true });
      let name = `${d.quarter}.md`; let n = 2; while (fs.existsSync(path.join(dir, 'history', name))) name = `${d.quarter}-${n++}.md`;
      fs.writeFileSync(path.join(dir, 'voice.md'), md); fs.writeFileSync(path.join(dir, 'history', name), md);
      fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify({ quarter: d.quarter, version: name.replace('.md', ''), appliedAt: today(), learnedUntil: d.at, samples: d.samples, summary: d.summary }, null, 2));
      fs.rmSync(draftF, { force: true });
      const steps: string[] = [`content/style/voice.md 적용 · 기록 ${name}`];
      if (b.push) {
        const git = (...a: string[]) => { const r = spawnSync('git', a, { cwd: root, encoding: 'utf8' }); return { ok: r.status === 0, out: ((r.stdout || '') + (r.stderr || '')).trim() }; };
        git('add', 'content/style');
        const c = git('commit', '-m', `문체 가이드 ${d.quarter} 적용`); steps.push(c.ok ? '커밋했습니다.' : c.out.includes('nothing to commit') ? '바뀐 내용 없음' : '커밋 실패: ' + c.out.slice(-200));
        if (git('remote').out) { git('pull', '--rebase', '--autostash'); const p = git('push'); steps.push(p.ok ? 'GitHub에 올렸습니다(휴대폰·서버 작업도 새 문체를 씁니다).' : 'push 실패: ' + p.out.slice(-200)); }
      }
      send(res, 200, { ok: true, file: `content/style/history/${name}`, steps }); return true;
    }

    /* AI 도우미: 작업으로 띄우고 화면이 /__studio/api/jobs/<id> 로 결과를 받아 감 */
    if (url === '/__studio/api/ai' && m === 'POST') {
      const b = await body(req); const task = String(b.task || '');
      if (!TASKS[task]) { send(res, 400, { error: '알 수 없는 작업입니다.' }); return true; }
      if (jm.running().length >= jm.max) { send(res, 429, { error: `동시에 ${jm.max}개까지 돌릴 수 있습니다.` }); return true; }
      const input = b.input || {};
      if (input.slug && !/^[a-z0-9-]+$/.test(input.slug)) delete input.slug;
      const prompt = TASKS[task](input) + '\n\n파일을 만들거나 고치지 마세요. 질문하지 말고, JSON 한 덩어리만 출력하세요.';
      const tools = task === 'webzine' ? ['Read', 'Glob', 'WebSearch', 'WebFetch'] : ['WebSearch', 'WebFetch'];
      const lane = `assist:${uid()}`;
      const title = { ad: '광고 대본', webzine: '웹진 슬라이드', followup: '상담 후속 메시지', ytmeta: '유튜브 제목·설명' }[task] + (input.topic || input.goal || input.title ? ': ' + String(input.topic || input.goal || input.title).slice(0, 30) : '');
      const args = ['-p', '--output-format', 'stream-json', '--verbose', '--include-partial-messages', '--permission-mode', 'default', '--allowedTools', tools.join(',')];
      if (b.model && /^[\w.-]+$/.test(b.model)) args.push('--model', b.model);
      const j = jm.start({ kind: 'assist', title, lane, userText: title, prompt, args });
      send(res, 200, { id: j.id }); return true;
    }

    return false;
  };
}
