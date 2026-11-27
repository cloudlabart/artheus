/**
 * 아터스 스튜디오 — 페이지 디자인 + 칼럼(GEO·SEO) 작업실 (Vite 개발 서버 플러그인)
 *
 * npm run dev 를 켜면:
 *   http://localhost:5173/          → 사이트
 *   http://localhost:5173/__studio  → 스튜디오 (채팅 + 미리보기 모니터)
 *
 * 채팅으로 요청하면 이 컴퓨터의 Claude Code(`claude -p`)가 src/ 파일을 직접 고치고,
 * Vite가 바로 미리보기에 반영합니다. 개발 서버에서만 동작하며 배포 빌드에는 들어가지 않습니다.
 *
 * 칼럼 탭: content/column/<slug>/article.md 를 .claude/skills 의 칼럼 스킬로 만들고(리서치·작성·검수),
 * tools/geo-seo/scripts/build_site.py 로 미리보기·발행 페이지(public/column/)를 만듭니다.
 * 매니저 탭: 큰 요청을 받아 .claude/agents 의 서브에이전트(리서처·작가·검수·디자이너·SEO 분석가)에게 나눠 맡깁니다.
 * 요청마다 작업(Job)이 하나씩 생기고 여러 작업이 동시에 돕니다(studio/jobs.ts). 같은 구역은 한 번에 하나만.
 * 공개 발행(git commit·push)은 [발행] 버튼으로만 합니다.
 */
import type { Plugin, ViteDevServer } from 'vite';
import { spawn, spawnSync } from 'node:child_process';
import { JobManager, type JobKind } from './jobs';
import { createAdmin, rememberAiDrafts, addStyleSample } from './admin';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { IncomingMessage, ServerResponse } from 'node:http';

const here = path.dirname(fileURLToPath(import.meta.url));

const SYSTEM_NOTE = `
You are working inside "아터스 스튜디오 (artheus Studio)", a visual vibe-coding tool for the ARTHEUS acting-studio website.
Project: Vite + React 18 + TypeScript + Tailwind CSS v4 (utility classes), react-router HashRouter, motion/react, lucide-react.
Main files: src/app/App.tsx (routes and the PAGES table), src/app/pages/*.tsx, src/app/components/*.tsx, src/styles/*.css.
The user sees a live preview that hot-reloads as you edit files, so:
- Edit files directly. Do not run the dev server, builds, installs or git (only the two studio scripts above are allowed).
- Never modify anything under studio/.
- Keep the existing design language (ivory #F3F0EA, deep blue #153956, ink #132B3F, keep-ko class for Korean line breaks) unless asked to change it.
- When the user selected an element, its source location is given; change that place first.
- Design skills in .claude/skills: site-design-plan (plan before building), site-image (generate images with \`node tools/studio/gen-image.mjs\`), site-review (capture with \`node tools/studio/shot.mjs <route> 1440,390\` and Read the png to SEE your result), site-copy (UI text in voice.md). Also the frontend-design skill if installed. CLAUDE.md design rules and tools/studio/brand-visual.md always win.
- For any visible change bigger than a word or color, capture the page after editing (shot.mjs), Read the screenshots, and fix horizontal overflow or obvious layout breaks before you finish.
- Follow security-guidance warnings: no secrets in code, no dangerouslySetInnerHTML with user input, no personal data in src/ or public/.
- Reply in Korean, briefly: what you changed and in which files. No long explanations.
`.trim();

const NESTED_MSG = '스튜디오가 Claude Code 안에서 실행되고 있어 Claude를 부를 수 없습니다.\n\n해결: Claude Code 창에서 Ctrl+C로 개발 서버를 끄고, 새 터미널 창을 열어 프로젝트 폴더에서 npm run dev 를 다시 실행한 뒤 이 화면을 새로고침하세요.';

/* 디자인 도구: 이미지 생성(tools/studio/gen-image.mjs) · 화면 캡처(tools/studio/shot.mjs) — 스킬 site-design-plan · site-image · site-review · site-copy */
const DESIGN_TOOLS = ['Bash(node tools/studio/gen-image.mjs:*)', 'Bash(node tools/studio/shot.mjs:*)'];
/* 파일 수정은 허용한 경로에서만 (허용 목록 방식 · permission-mode default 라 그 밖은 자동 거부)
   → tools/·studio/·.git/·node_modules/·설정 파일·.studio/ 등 실행되는 코드와 키는 AI가 고칠 수 없음 */
const editIn = (paths: string[]) => paths.flatMap((p) => [`Edit(${p})`, `Write(${p})`, `MultiEdit(${p})`]);
const BASE_TOOLS = ['Read', 'Glob', 'Grep', 'Skill', 'TodoWrite'];
const SITE_EDIT = editIn(['./src/**', './index.html', './public/images/gen/**']);
const COLUMN_EDIT = editIn(['./content/column/**', './content/audits/**', './content/plan.md']);
const ALLOWED_TOOLS = [...BASE_TOOLS, ...SITE_EDIT, ...DESIGN_TOOLS];

/* 칼럼 작업용: 웹 조사 + 칼럼 스크립트만 추가로 허용 (git·배포는 버튼으로만) */
const PY = process.platform === 'win32' ? 'python' : 'python3';
const COLUMN_TOOLS = [...BASE_TOOLS, ...COLUMN_EDIT, 'WebSearch', 'WebFetch', 'Task', 'Agent', 'Skill', 'TodoWrite',
  `Bash(${PY} tools/geo-seo/scripts/seo_lint.py:*)`, `Bash(${PY} tools/geo-seo/scripts/build_site.py:*)`,
  `Bash(${PY} tools/geo-seo/scripts/publish.py naver:*)`, `Bash(${PY} tools/geo-seo/scripts/gsc_opportunities.py:*)`,
  `Bash(${PY} tools/geo-seo/scripts/render_page.py:*)`];

const COLUMN_NOTE = `
You are in the COLUMN tab of "아터스 스튜디오". Columns are SEO/GEO articles for c-art.co.kr/column, written for 고등학생~대학생 연기 지망생.
- Follow the project skills in .claude/skills (content-pipeline, content-brief, content-write, content-audit, content-design) and tools/geo-seo/references/*.md. Read content/geo-seo.config.json first.
- Run python with \`${PY}\` exactly as the skills show (e.g. \`${PY} tools/geo-seo/scripts/seo_lint.py ...\`).
- You run headless: never ask the user questions; put open questions under "확인 필요" in your final reply.
- Never publish, never set status: published, never run git. Publishing is done only by the studio's 발행 button.
- Never modify studio/ or public/column/ directly. Site React code (src/) is out of scope here unless the user explicitly asks.
- After changing an article, regenerate its preview: \`${PY} tools/geo-seo/scripts/build_site.py --preview <slug>\` and the Naver file: \`${PY} tools/geo-seo/scripts/publish.py naver content/column/<slug>/article.md\`.
- Write every Korean sentence in the voice of content/style/voice.md (배준우 문체 가이드). Read it before writing or rewriting.
- Final reply in Korean, short: 무엇을 했는지, 검수 점수, 확인 필요.
`.trim();

/* 매니저: 큰 요청을 쪼개 서브에이전트에게 맡김 (다른 작업과 동시에 돌지 않는 대신, 안에서 병렬) */
const MANAGER_TOOLS = [...COLUMN_TOOLS, ...SITE_EDIT, ...DESIGN_TOOLS, 'Bash(npm run build)', 'Bash(npm run type-check)'];
const MANAGER_NOTE = `
You are "아터스 매니저", the admin agent of 아터스 스튜디오 for the ARTHEUS acting-academy website (c-art.co.kr).
You coordinate work and delegate to subagents with the Task tool. Available subagents (.claude/agents):
- seo-researcher: keyword/SERP/AI-answer/Naver research for one keyword
- content-writer: writes or rewrites a column article.md from a brief
- geo-reviewer: fact-checks and reviews a column (PASS/FIX/BLOCK)
- site-designer: edits the React site (src/) following CLAUDE.md design rules
- seo-analyst: site-wide technical SEO and column performance analysis (reports, no edits)
Rules:
- First make a short plan (TodoWrite). Then delegate. Launch INDEPENDENT subagents in parallel (several Task calls in one message), e.g. research for two keywords at once.
- Never let two subagents edit the same file at the same time. Site edits (src/) go to one site-designer at a time.
- Columns follow CLAUDE.md and .claude/skills/content-pipeline (status: draft only). Never publish, never set status: published, never run git.
- After site edits, run \`npm run build\` once to verify. After column edits, run \`${PY} tools/geo-seo/scripts/build_site.py --preview <slug>\`.
- You run headless: never ask questions; list open questions under "확인 필요".
- All public copy (columns, site text, captions) follows content/style/voice.md (배준우 문체). Tell writing subagents to read it.
- Final reply in Korean, short: 무엇을 누구에게 맡겼고 결과가 무엇인지, 확인 필요.
`.trim();

/* ── 사이트 발행 버튼: 바뀐 파일을 검사 → 빌드 확인 → 커밋 → push ── */
// 공개 저장소에 올려도 되는 경로만 (운영 데이터 .studio/, server/data/, content/data/ 는 .gitignore 로도 막혀 있음)
const PUBLISH_PATHS = ['src', 'public', 'content/column', 'content/style', 'content/geo-seo.config.json', 'content/plan.md', 'index.html',
  'studio', 'tools', '.claude', '.github', 'server/lms', 'package.json', 'package-lock.json', 'vite.config.ts', 'tsconfig.json', 'postcss.config.mjs', 'CLAUDE.md', 'README.md'];
const BLOCK_PATHS = /^(\.studio|server\/data|content\/data|\.env)|(^|\/)\.env|\.(csv|xlsx|sqlite|db|pem|key)$/i;
const SECRET_RE = /(sk-ant-[A-Za-z0-9_-]{10,}|EAA[A-Za-z0-9]{40,}|AIza[0-9A-Za-z_-]{30,}|ghp_[A-Za-z0-9]{30,}|-----BEGIN [A-Z ]*PRIVATE KEY|(api[_-]?secret|apiKey|access[_-]?token)\s*[:=]\s*['"][A-Za-z0-9_\-]{24,}['"])/;
function siteChanges(root: string) {
  const st = spawnSync('git', ['-c', 'core.hooksPath=/dev/null', '-c', 'core.fsmonitor=false', '-c', 'core.quotepath=false', 'status', '--porcelain', '-uall'], { cwd: root, encoding: 'utf8' }).stdout || '';
  const all = st.split('\n').filter(Boolean).map((l) => ({ code: l.slice(0, 2).trim(), path: l.slice(3).replace(/^"|"$/g, '').split(' -> ').pop()! }));
  const inScope = (f: string) => PUBLISH_PATHS.some((p) => f === p || f.startsWith(p + '/'));
  return { files: all.filter((f) => inScope(f.path) && !BLOCK_PATHS.test(f.path)), skipped: all.filter((f) => !inScope(f.path) || BLOCK_PATHS.test(f.path)) };
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function runPy(root: string, args: string[]) {
  const r = spawnSync(PY, args, { cwd: root, encoding: 'utf8', shell: process.platform === 'win32' });
  return { ok: r.status === 0, out: (r.stdout || '') + (r.stderr || ''), error: r.error?.message };
}
function runGit(root: string, args: string[]) {
  const r = spawnSync('git', ['-c', 'core.hooksPath=/dev/null', '-c', 'core.fsmonitor=false', ...args], { cwd: root, encoding: 'utf8' });
  return { ok: r.status === 0, out: ((r.stdout || '') + (r.stderr || '')).trim() };
}
function articlePath(root: string, slug: string) { return path.join(root, 'content', 'column', slug, 'article.md'); }
function setFrontmatter(file: string, key: string, value: string) {
  let s = fs.readFileSync(file, 'utf8');
  const m = s.match(/^---\n([\s\S]*?)\n---/);
  if (!m) throw new Error('frontmatter가 없습니다');
  let fm = m[1];
  const re = new RegExp(`^${key}:.*$`, 'm');
  fm = re.test(fm) ? fm.replace(re, `${key}: ${value}`) : fm.replace(/^(slug:.*)$/m, `$1\n${key}: ${value}`);
  s = s.replace(m[0], `---\n${fm}\n---`);
  fs.writeFileSync(file, s);
}
const MIME: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.avif': 'image/avif' };
function serveFile(res: ServerResponse, file: string) {
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { res.statusCode = 404; return res.end('not found'); }
  res.setHeader('Content-Type', MIME[path.extname(file).toLowerCase()] || 'application/octet-stream');
  res.setHeader('Cache-Control', 'no-store');
  res.end(fs.readFileSync(file));
}

function isLocal(req: IncomingMessage) {
  const a = req.socket.remoteAddress || '';
  return a === '127.0.0.1' || a === '::1' || a === '::ffff:127.0.0.1';
}

const IMAGE_TYPES: Record<string, string> = {
  'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif', 'image/svg+xml': 'svg', 'image/avif': 'avif',
};
const MAX_UPLOAD = 15 * 1024 * 1024;

function readRaw(req: IncomingMessage, limit: number): Promise<Buffer | null> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = []; let size = 0; let over = false;
    req.on('data', (c: Buffer) => { size += c.length; if (size > limit) over = true; else chunks.push(c); });
    req.on('end', () => resolve(over ? null : Buffer.concat(chunks)));
    req.on('error', () => resolve(null));
  });
}

function readBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let s = '';
    req.on('data', (c) => (s += c));
    req.on('end', () => { try { resolve(JSON.parse(s || '{}')); } catch { resolve({}); } });
  });
}

function json(res: ServerResponse, code: number, body: unknown) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

/* ── 되돌리기용 스냅샷: 작업마다 "그 작업의 구역"만 복사해 둠 (동시에 도는 다른 작업을 건드리지 않게) ── */
function snapshotDir(root: string) { return path.join(root, '.studio', 'snapshots'); }
function takeSnapshot(root: string, label: string, paths: string[], lane: string) {
  let n = Date.now();
  while (fs.existsSync(path.join(snapshotDir(root), String(n)))) n++;
  const id = String(n);
  const dir = path.join(snapshotDir(root), id);
  fs.mkdirSync(dir, { recursive: true });
  const items = paths.map((p) => {
    const src = path.join(root, p); const existed = fs.existsSync(src);
    if (existed) fs.cpSync(src, path.join(dir, 'files', p), { recursive: true });
    return { p, existed };
  });
  fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify({ label: label.slice(0, 200), lane, items }));
  const all = fs.readdirSync(snapshotDir(root)).sort();
  for (const old of all.slice(0, Math.max(0, all.length - 40))) fs.rmSync(path.join(snapshotDir(root), old), { recursive: true, force: true });
  return id;
}
function readMeta(dir: string): { label: string; lane: string; items: { p: string; existed: boolean }[] } {
  try { return JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8')); }
  catch { return { label: '', lane: 'manager', items: [] }; }
}
function listSnapshots(root: string) {
  const d = snapshotDir(root);
  if (!fs.existsSync(d)) return [];
  return fs.readdirSync(d).sort().reverse().map((id) => { const m = readMeta(path.join(d, id)); return { id, label: m.label, lane: m.lane }; });
}
function restoreSnapshot(root: string, id: string) {
  const dir = path.join(snapshotDir(root), id);
  if (!/^\d+$/.test(id) || !fs.existsSync(dir)) throw new Error('snapshot not found');
  for (const { p, existed } of readMeta(dir).items) {
    const target = path.join(root, p);
    fs.rmSync(target, { recursive: true, force: true });
    if (existed) fs.cpSync(path.join(dir, 'files', p), target, { recursive: true });
  }
  fs.rmSync(dir, { recursive: true, force: true });
}
function laneOf(root: string, id: string) {
  return readMeta(path.join(snapshotDir(root), id)).lane;
}

function claudeLoggedIn(): Promise<boolean | null> {
  return new Promise((resolve) => {
    const p = spawn('claude', ['auth', 'status', '--json'], { shell: process.platform === 'win32' });
    let out = '';
    p.stdout?.on('data', (c) => (out += c));
    p.on('error', () => resolve(null));
    p.on('close', () => { try { resolve(!!JSON.parse(out).loggedIn); } catch { resolve(null); } });
  });
}

function claudeAvailable(): Promise<string | null> {
  return new Promise((resolve) => {
    const p = spawn('claude', ['--version'], { shell: process.platform === 'win32' });
    let out = '';
    p.stdout?.on('data', (c) => (out += c));
    p.on('error', () => resolve(null));
    p.on('close', (code) => resolve(code === 0 ? out.trim() : null));
  });
}

export function artheusStudio(): Plugin {
  let server: ViteDevServer;

  return {
    name: 'artheus-studio', // 아터스 스튜디오
    apply: 'serve',
    configureServer(s) {
      server = s;
      const root = s.config.root;
      let maxJobs = 3;
      try { maxJobs = JSON.parse(fs.readFileSync(path.join(root, 'content', 'geo-seo.config.json'), 'utf8')).studio?.max_jobs || 3; } catch {}
      s.httpServer?.once('listening', () => { const a: any = s.httpServer?.address(); if (a?.port) process.env.STUDIO_ORIGIN = `http://localhost:${a.port}`; });
      const jm = new JobManager(root, s.config.logger, maxJobs);
      s.httpServer?.once('close', () => jm.stopAll());
      const admin = createAdmin(root, here, jm);
      const busyMsg = (lane: string) => { const j = jm.conflict(lane); return j ? `“${j.title}” 작업이 같은 부분을 고치는 중입니다. 끝난 뒤에 하거나 그 작업을 중지하세요.` : ''; };

      s.middlewares.use(async (req, res, next) => {
        const url = (req.url || '').split('?')[0];
        // 스튜디오 API 보호: 이 컴퓨터(localhost)에서 연 스튜디오 화면만 허용
        // (DNS 리바인딩·다른 사이트에서 몰래 보내는 요청 차단 — 원생·상담 데이터와 연동 키가 있음)
        if (url.startsWith('/__studio')) {
          const host = String(req.headers.host || '').replace(/:\d+$/, '').replace(/^\[|\]$/g, '');
          if (!['localhost', '127.0.0.1', '::1'].includes(host)) { res.statusCode = 403; return res.end('스튜디오는 이 컴퓨터(localhost)에서만 열 수 있어요.'); }
          const m = (req.method || 'GET').toUpperCase();
          if (m !== 'GET' && m !== 'HEAD') {
            const site = String(req.headers['sec-fetch-site'] || '');
            const origin = String(req.headers.origin || '');
            let originOk = !origin;
            try { if (origin) { const o = new URL(origin); originOk = ['localhost', '127.0.0.1', '[::1]'].includes(o.hostname) && o.host === req.headers.host; } } catch {}
            if ((site && site !== 'same-origin' && site !== 'none') || !originOk) { res.statusCode = 403; return res.end('다른 사이트에서 보낸 요청은 막았어요.'); }
          }
        }
        // 발행된 칼럼(public/column/…/index.html)을 개발 서버에서도 배포와 똑같이 보여 줌
        if (/^\/column(\/[a-z0-9-]*)?\/?$/.test(url)) {
          const file = path.join(root, 'public', url.replace(/\/?$/, '/index.html'));
          if (fs.existsSync(file)) return serveFile(res, file);
          return next();
        }
        if (!url.startsWith('/__studio')) return next();
        if (!isLocal(req)) return json(res, 403, { error: '스튜디오는 이 컴퓨터에서만 열 수 있습니다.' });

        if (await admin(req, res, url)) return; // 셸·운영 앱·데이터·연동 (studio/admin.ts)

        if (url === '/__studio/api/status') {
          const version = await claudeAvailable();
          return json(res, 200, { claude: version, loggedIn: version ? await claudeLoggedIn() : null, nested: !!process.env.CLAUDECODE, busy: jm.running().length, maxJobs: jm.max, snapshots: listSnapshots(root).slice(0, 12) });
        }

        if (url === '/__studio/api/undo' && req.method === 'POST') {
          const snaps = listSnapshots(root);
          const body = await readBody(req);
          const id = body.id || snaps[0]?.id;
          if (!id) return json(res, 404, { error: '되돌릴 기록이 없습니다.' });
          if (!/^\d+$/.test(String(id))) return json(res, 400, { error: '잘못된 기록입니다.' });
          const lane = laneOf(root, id);
          if (jm.conflict(lane)) return json(res, 409, { error: busyMsg(lane) });
          try { restoreSnapshot(root, id); } catch (e: any) { return json(res, 400, { error: e.message }); }
          if (fs.existsSync(path.join(root, 'content', 'column'))) runPy(root, ['tools/geo-seo/scripts/build_site.py']);
          server.ws.send({ type: 'full-reload' });
          return json(res, 200, { ok: true, snapshots: listSnapshots(root).slice(0, 10) });
        }

        if (url === '/__studio/api/upload' && req.method === 'POST') {
          const type = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
          const ext = IMAGE_TYPES[type];
          if (!ext) return json(res, 415, { error: 'PNG, JPG, WebP, GIF, SVG, AVIF 이미지만 첨부할 수 있습니다.' });
          const buf = await readRaw(req, MAX_UPLOAD);
          if (!buf) return json(res, 413, { error: '이미지가 너무 큽니다. 15MB 이하로 올려 주세요.' });
          if (!buf.length) return json(res, 400, { error: '빈 파일입니다.' });
          const original = decodeURIComponent(String(req.headers['x-file-name'] || 'image'));
          const base = original.replace(/\.[^.]+$/, '').normalize('NFC').replace(/[^\p{L}\p{N}_-]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'image';
          const d = new Date();
          const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}${String(d.getSeconds()).padStart(2, '0')}`;
          const name = `${stamp}-${base}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
          const dir = path.join(root, 'public', 'uploads');
          fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(path.join(dir, name), buf);
          return json(res, 200, { path: `public/uploads/${name}`, url: `/uploads/${name}`, name: original, size: buf.length });
        }

        /* ── 칼럼 ── */
        if (url.startsWith('/__studio/preview/')) {
          const rel = decodeURIComponent(url.slice('/__studio/preview/'.length)).replace(/\/$/, '/index.html');
          const base = path.join(root, '.studio', 'preview');
          const file = path.resolve(base, rel);
          if (!file.startsWith(base + path.sep)) return json(res, 400, { error: 'bad path' });
          return serveFile(res, file);
        }
        if (url.startsWith('/__studio/naver/')) {
          const slug = decodeURIComponent(url.slice('/__studio/naver/'.length)).replace(/\/$/, '');
          if (!SLUG_RE.test(slug) || !fs.existsSync(articlePath(root, slug))) return json(res, 404, { error: '칼럼이 없습니다.' });
          const r = runPy(root, ['tools/geo-seo/scripts/publish.py', 'naver', path.join('content', 'column', slug, 'article.md')]);
          if (!r.ok) return json(res, 500, { error: r.error || r.out.slice(-600) });
          return serveFile(res, path.join(root, 'content', 'column', slug, 'naver', 'naver_copy.html'));
        }
        if (url === '/__studio/api/columns') {
          const r = runPy(root, ['tools/geo-seo/scripts/build_site.py', '--list']);
          if (!r.ok) return json(res, 500, { error: r.error ? `Python을 실행하지 못했습니다(${PY}). ${r.error}` : r.out.slice(-600) });
          const git = runGit(root, ['rev-parse', '--is-inside-work-tree']).ok;
          const remote = git && runGit(root, ['remote']).out.length > 0;
          const gsc = fs.existsSync(path.join(root, 'content', 'data', 'gsc.csv'));
          return json(res, 200, { columns: JSON.parse(r.out.trim().split('\n').pop() || '[]'), git, remote, gsc });
        }
        if (url === '/__studio/api/columns/preview' && req.method === 'POST') {
          const { slug } = await readBody(req);
          if (!SLUG_RE.test(String(slug))) return json(res, 400, { error: 'slug가 올바르지 않습니다.' });
          const r = runPy(root, ['tools/geo-seo/scripts/build_site.py', '--preview', slug]);
          if (!r.ok) return json(res, 500, { error: r.out.slice(-600) || r.error });
          const holes = r.out.split('\n').filter((l) => l.includes('채울 자리')).map((l) => l.replace(/^\s*채울 자리\s*/, ''));
          return json(res, 200, { url: `/__studio/preview/${slug}/`, holes });
        }
        if (url === '/__studio/api/columns/gsc' && req.method === 'POST') {
          const buf = await readRaw(req, 20 * 1024 * 1024);
          if (!buf || !buf.length) return json(res, 400, { error: 'CSV 파일을 읽지 못했습니다(20MB 이하).' });
          const dir = path.join(root, 'content', 'data');
          fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(path.join(dir, 'gsc.csv'), buf);
          const r = runPy(root, ['tools/geo-seo/scripts/gsc_opportunities.py', 'content/data/gsc.csv', '--out', 'content/data/opportunities.json']);
          return json(res, r.ok ? 200 : 400, r.ok ? { ok: true, summary: r.out.split('\n').slice(0, 2).join(' ') } : { error: r.out.slice(-600) });
        }
        /* ── 정기 SEO 점검 (서버의 주간 작업과 같은 스크립트) ── */
        if (url === '/__studio/api/seo') {
          // 서버 리포트(content/reports, 숫자 없음)와 이 Mac의 점검(.studio/reports, 숫자 포함) 중 최신 것
          const files = [path.join(root, '.studio', 'reports', 'latest.json'), path.join(root, 'content', 'reports', 'latest.json')]
            .filter((f) => fs.existsSync(f)).sort((x, y) => fs.statSync(y).mtimeMs - fs.statSync(x).mtimeMs);
          return json(res, 200, files.length ? { ...JSON.parse(fs.readFileSync(files[0], 'utf8')), source: files[0].includes('.studio') ? 'local' : 'server' } : {});
        }
        if (url === '/__studio/api/seo/check' && req.method === 'POST') {
          const { links } = await readBody(req);
          // 이 Mac에서만 보는 자세한 점검(클릭·순위 숫자 포함) → .studio/reports (git에 올라가지 않음)
          const r = runPy(root, ['tools/geo-seo/scripts/seo_maintain.py', '--quiet', '--out-dir', '.studio/reports', ...(links ? ['--check-links'] : [])]);
          if (!r.ok) return json(res, 500, { error: r.out.slice(-600) || r.error });
          return json(res, 200, { ...JSON.parse(fs.readFileSync(path.join(root, '.studio', 'reports', 'latest.json'), 'utf8')), source: 'local' });
        }
        if (url === '/__studio/api/git/pull' && req.method === 'POST') {
          if (jm.running().length) return json(res, 409, { error: '진행 중인 작업이 끝난 뒤에 받으세요.' });
          if (!runGit(root, ['remote']).out) return json(res, 400, { error: 'GitHub 원격 저장소가 연결되어 있지 않습니다.' });
          const r = runGit(root, ['pull', '--rebase', '--autostash']);
          return json(res, r.ok ? 200 : 500, r.ok ? { ok: true, out: r.out } : { error: r.out.slice(-500) });
        }

        /* ── 이미지 생성 (디자인 도구) ── */
        if (url === '/__studio/api/images' && req.method === 'GET') {
          let list: any[] = []; try { list = JSON.parse(fs.readFileSync(path.join(root, '.studio', 'images.json'), 'utf8')); } catch {}
          let style = ''; try { style = (await import(pathToFileURL(path.join(root, 'tools', 'studio', 'gen-image.mjs')).href)).BRAND_STYLE; } catch {}
          return json(res, 200, { images: list.filter((x) => fs.existsSync(path.join(root, x.path))).slice(0, 60), style });
        }
        // Gemini 앱(구독)에서 만든 이미지를 가져오기 — 키 없이
        if (url === '/__studio/api/images/import' && req.method === 'POST') {
          const buf = await readRaw(req, 15 * 1024 * 1024);
          if (!buf || !buf.length) return json(res, 400, { error: '이미지를 읽지 못했어요(15MB 이하).' });
          const ext = buf[0] === 0x89 && buf[1] === 0x50 ? 'png' : buf[0] === 0xff && buf[1] === 0xd8 ? 'jpg' : buf.slice(0, 4).toString() === 'RIFF' && buf.slice(8, 12).toString() === 'WEBP' ? 'webp' : '';
          if (!ext) return json(res, 400, { error: 'PNG·JPG·WEBP 이미지만 가져올 수 있어요.' });
          const raw = decodeURIComponent(String(req.headers['x-file-name'] || 'gemini')).replace(/\.[a-z0-9]+$/i, '');
          const prompt = decodeURIComponent(String(req.headers['x-prompt'] || '')).slice(0, 2000);
          const slug = (raw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)) || 'gemini';
          const dir = path.join(root, 'public', 'images', 'gen'); fs.mkdirSync(dir, { recursive: true });
          let base = slug, n = 1; while (['png', 'jpg', 'webp'].some((e) => fs.existsSync(path.join(dir, `${base}.${e}`)))) base = `${slug}-${++n}`;
          const rel = `public/images/gen/${base}.${ext}`; fs.writeFileSync(path.join(root, rel), buf);
          const logF = path.join(root, '.studio', 'images.json'); fs.mkdirSync(path.dirname(logF), { recursive: true });
          let logA: any[] = []; try { logA = JSON.parse(fs.readFileSync(logF, 'utf8')); } catch {}
          const rec = { path: rel, url: '/' + rel.replace(/^public\//, ''), prompt, provider: 'gemini-app', createdAt: new Date().toISOString(), size: buf.length };
          logA.unshift(rec); fs.writeFileSync(logF, JSON.stringify(logA.slice(0, 300), null, 2));
          return json(res, 200, rec);
        }
        if (url === '/__studio/api/images' && req.method === 'POST') {
          const b = await readBody(req);
          try {
            const mod = await import(pathToFileURL(path.join(root, 'tools', 'studio', 'gen-image.mjs')).href);
            return json(res, 200, await mod.generate({ prompt: String(b.prompt || '').slice(0, 2000), aspect: b.aspect, name: b.name, provider: b.provider, brand: b.brand !== false }));
          } catch (e: any) { return json(res, 400, { error: e.message }); }
        }
        if (url === '/__studio/api/site/status') {
          if (!runGit(root, ['rev-parse', '--is-inside-work-tree']).ok) return json(res, 400, { error: 'git 저장소가 아닙니다.' });
          const ahead = runGit(root, ['rev-list', '--count', '@{u}..HEAD']);
          return json(res, 200, { ...siteChanges(root), ahead: ahead.ok ? +ahead.out || 0 : 0, running: jm.running().length });
        }
        if (url === '/__studio/api/site/publish' && req.method === 'POST') {
          const { message } = await readBody(req);
          if (jm.running().length) return json(res, 409, { error: 'AI 작업이 진행 중이에요. 끝난 뒤에 발행하세요.' });
          if (!runGit(root, ['remote']).out) return json(res, 400, { error: 'GitHub 원격 저장소가 연결되어 있지 않습니다.' });
          const { files } = siteChanges(root);
          const ahead = +runGit(root, ['rev-list', '--count', '@{u}..HEAD']).out || 0;
          if (!files.length && !ahead) return json(res, 400, { error: '올릴 변경이 없어요.' });
          const steps: string[] = [];
          // 1) 비밀 키·큰 파일 검사
          const problems: string[] = [];
          for (const f of files) {
            const abs = path.join(root, f.path);
            if (!fs.existsSync(abs) || fs.statSync(abs).isDirectory()) continue;
            if (fs.statSync(abs).size > 20 * 1024 * 1024) problems.push(`${f.path}: 20MB가 넘어요.`);
            else if (!/\.(png|jpe?g|gif|webp|ico|mp4|woff2?|ttf|pdf)$/i.test(f.path) && SECRET_RE.test(fs.readFileSync(abs, 'utf8'))) problems.push(`${f.path}: 비밀 키처럼 보이는 글자가 있어요. 키는 설정 앱(.studio)에만 두세요.`);
          }
          if (problems.length) return json(res, 422, { error: '발행을 멈췄어요.', problems });
          // 2) 빌드 확인 (배포 폴더 dist/는 건드리지 않음)
          const b = spawnSync('npx', ['vite', 'build', '--outDir', '.studio/build-check', '--emptyOutDir', '--logLevel', 'error'], { cwd: root, encoding: 'utf8', shell: process.platform === 'win32' });
          if (b.status !== 0) return json(res, 422, { error: '빌드가 실패해서 올리지 않았어요.', problems: [((b.stdout || '') + (b.stderr || '')).slice(-800)] });
          steps.push('빌드 확인 통과');
          // 3) 커밋 → 받기 → 올리기
          if (files.length) {
            const add = runGit(root, ['add', '-A', '--', ...files.map((f) => f.path)]);
            if (!add.ok) return json(res, 500, { error: 'git add 실패', problems: [add.out] });
            const msg = String(message || '').trim().slice(0, 120) || `사이트 업데이트 (${files.length}개 파일)`;
            const c = runGit(root, ['commit', '-m', msg]);
            if (!c.ok && !/nothing to commit/.test(c.out)) return json(res, 500, { error: '커밋 실패', problems: [c.out.slice(-400)] });
            steps.push(`커밋: ${msg}`);
          }
          const pull = runGit(root, ['pull', '--rebase', '--autostash']);
          if (!pull.ok) return json(res, 500, { error: 'GitHub의 최신 내용과 합치지 못했어요. 커밋은 이 Mac에 남아 있어요.', problems: [pull.out.slice(-500)] });
          const p = runGit(root, ['push']);
          if (!p.ok) return json(res, 500, { error: 'push 실패. 커밋은 이 Mac에 남아 있어요.', problems: [p.out.slice(-500)] });
          steps.push('GitHub에 올렸어요. 2–3분 뒤 사이트에 반영돼요(GitHub › Actions › 사이트 배포).');
          return json(res, 200, { ok: true, steps });
        }

        if (url === '/__studio/api/columns/publish' && req.method === 'POST') {
          const { slug, unpublish, push } = await readBody(req);
          if (!SLUG_RE.test(String(slug))) return json(res, 400, { error: 'slug가 올바르지 않습니다.' });
          if (jm.conflict(`column:${slug}`)) return json(res, 409, { error: busyMsg(`column:${slug}`) });
          const file = articlePath(root, slug);
          if (!fs.existsSync(file)) return json(res, 404, { error: '칼럼이 없습니다.' });
          const text = fs.readFileSync(file, 'utf8');
          const steps: string[] = [];
          if (!unpublish) {
            const problems: string[] = [];
            const lint = runPy(root, ['tools/geo-seo/scripts/seo_lint.py', path.join('content', 'column', slug, 'article.md'), '--out', path.join('content', 'column', slug, 'audit.json')]);
            if (!lint.ok) problems.push('검수 미통과: ' + lint.out.split('\n')[0]);
            const todos = [...text.matchAll(/<!--\s*TODO\s*:\s*([\s\S]*?)\s*-->/g)].map((m) => m[1]);
            if (todos.length) problems.push('채울 자리 ' + todos.length + '곳: ' + todos.join(' / '));
            if (/^author:\s*("")?\s*$/m.test(text)) problems.push('저자(author)가 비어 있습니다.');
            if (problems.length) return json(res, 422, { error: '발행 전에 채워야 할 것이 있습니다.', problems });
            steps.push('검수 통과 · ' + lint.out.split('\n')[0]);
          }
          takeSnapshot(root, (unpublish ? '발행 취소: ' : '발행: ') + slug, [path.join('content', 'column', slug)], `column:${slug}`);
          const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
          setFrontmatter(file, 'status', unpublish ? 'draft' : 'published');
          if (!unpublish) setFrontmatter(file, 'updated', today);
          const b = runPy(root, ['tools/geo-seo/scripts/build_site.py']);
          if (!b.ok) return json(res, 500, { error: '사이트 생성 실패', problems: [b.out.slice(-600)] });
          steps.push(b.out.trim().split('\n').pop() || '사이트 생성');
          if (!runGit(root, ['rev-parse', '--is-inside-work-tree']).ok) {
            steps.push('git 저장소가 아니라 커밋은 건너뛰었습니다. public/ 폴더를 배포하면 반영됩니다.');
            return json(res, 200, { ok: true, steps });
          }
          const add = runGit(root, ['add', '--', path.join('content', 'column', slug), 'public/column', 'public/sitemap.xml', 'public/rss.xml', 'public/robots.txt']);
          if (!add.ok) return json(res, 500, { error: 'git add 실패', problems: [add.out] });
          const title = (text.match(/^title:\s*"?(.*?)"?\s*$/m) || [])[1] || slug;
          const commit = runGit(root, ['commit', '-m', `${unpublish ? '칼럼 발행 취소' : '칼럼'}: ${title}`]);
          steps.push(commit.ok ? '커밋했습니다.' : (/nothing to commit/.test(commit.out) ? '바뀐 내용이 없어 커밋하지 않았습니다.' : '커밋 실패: ' + commit.out.slice(-300)));
          if (push !== false && runGit(root, ['remote']).out) {
            runGit(root, ['pull', '--rebase', '--autostash']); // 서버의 주간 점검이 올린 커밋을 먼저 받음
            const p = runGit(root, ['push']);
            steps.push(p.ok ? 'GitHub에 올렸습니다. GitHub Pages가 2–3분 안에 배포합니다(Actions › 사이트 배포).' : 'push 실패: ' + p.out.slice(-400));
          } else steps.push('GitHub 원격 저장소가 없어 push는 하지 않았습니다.');
          return json(res, 200, { ok: true, steps });
        }

        /* ── 작업(Job): 여러 개 동시에 ── */
        if (url === '/__studio/api/columns/delete' && req.method === 'POST') {
          const { slug } = await readBody(req);
          if (!SLUG_RE.test(String(slug)) || !fs.existsSync(articlePath(root, slug))) return json(res, 404, { error: '칼럼이 없습니다.' });
          if (jm.conflict(`column:${slug}`)) return json(res, 409, { error: busyMsg(`column:${slug}`) });
          if (/^status:\s*published/m.test(fs.readFileSync(articlePath(root, slug), 'utf8'))) return json(res, 400, { error: '발행된 칼럼은 먼저 발행 취소하세요.' });
          takeSnapshot(root, '칼럼 삭제: ' + slug, [path.join('content', 'column', slug)], `column:${slug}`);
          fs.rmSync(path.join(root, 'content', 'column', slug), { recursive: true, force: true });
          fs.rmSync(path.join(root, '.studio', 'preview', slug), { recursive: true, force: true });
          return json(res, 200, { ok: true });
        }
        if (url === '/__studio/api/jobs' && req.method === 'GET') {
          return json(res, 200, { jobs: jm.list(), running: jm.running().length, max: jm.max });
        }
        const jm1 = url.match(/^\/__studio\/api\/jobs\/([a-z0-9]+)(\/stop)?$/);
        if (jm1) {
          const id = jm1[1];
          if (jm1[2] && req.method === 'POST') return json(res, jm.stop(id) ? 200 : 404, { ok: true });
          const since = Number(new URL(req.url || '', 'http://x').searchParams.get('since') || 0);
          const j = jm.get(id); const events = jm.eventsSince(id, since);
          if (!j || !events) return json(res, 404, { error: '작업이 없습니다.' });
          return json(res, 200, { job: jm.summary(j), events });
        }
        if (url === '/__studio/api/jobs' && req.method === 'POST') {
          const body = await readBody(req);
          const kind: JobKind = ['page', 'column', 'manager'].includes(body.kind) ? body.kind : 'page';
          const slug = kind === 'column' && SLUG_RE.test(String(body.slug || '')) ? String(body.slug) : '';
          const lane = kind === 'manager' ? 'manager' : kind === 'page' ? 'site' : slug ? `column:${slug}` : body.lane === 'seo' ? 'seo' : `new:${Date.now().toString(36)}`;
          if (jm.conflict(lane)) return json(res, 409, { error: busyMsg(lane) });
          if (jm.running().length >= jm.max) return json(res, 429, { error: `동시에 ${jm.max}개까지 돌릴 수 있습니다. 하나가 끝난 뒤에 보내세요.` });

          const attachments = kind === 'page' ? (Array.isArray(body.attachments) ? body.attachments : [])
            .filter((a: any) => typeof a?.path === 'string' && /^public\/uploads\/[^/\\]+$/.test(a.path) && fs.existsSync(path.join(root, a.path)))
            .slice(0, 8) : [];
          const prompt = String(body.prompt || '').trim() || (attachments.length ? '첨부한 이미지를 보고 알맞게 반영해줘.' : '');
          if (!prompt) return json(res, 400, { error: '요청 내용이 비어 있습니다.' });

          const note = kind === 'manager' ? MANAGER_NOTE : kind === 'column' ? COLUMN_NOTE : SYSTEM_NOTE;
          let full = `[스튜디오 작업 지침 — 반드시 따를 것]\n${note}\n\n${slug ? `[현재 칼럼]\ncontent/column/${slug}/article.md\n\n` : ''}[사용자 요청]\n${prompt}`;
          if (kind === 'page' && body.selection) {
            const sel = body.selection;
            full += `\n\n[미리보기에서 선택한 요소]\n위치: ${sel.source || '알 수 없음'}\n화면 경로: ${sel.route || '/'}\n태그: ${sel.tag}\n글자: ${sel.text || ''}\nHTML 일부: ${String(sel.html || '').slice(0, 1200)}`;
          }
          if (attachments.length) {
            full += `\n\n[첨부 이미지 ${attachments.length}개]\n` + attachments.map((a: any, i: number) =>
              `${i + 1}. 파일: ${a.path} (사이트에서 쓰는 주소: ${a.url})${a.name ? ` · 원래 이름: ${String(a.name).slice(0, 80)}` : ''}`).join('\n') +
              `\n먼저 Read 도구로 각 이미지를 열어 직접 보세요. 요청을 보고 판단하세요:\n` +
              `- 참고용(“이렇게 만들어줘”, 디자인 캡처, 시안)이면 이미지의 레이아웃·색·구성을 따라 코드를 고치고, 이미지 파일 자체는 사이트에 넣지 마세요.\n` +
              `- 사이트에 넣을 사진·로고(“이 사진 넣어줘”)이면 <img src="${attachments[0].url}"> 처럼 위 주소로 넣고, 알맞은 alt를 한국어로 쓰세요.`;
          }

          const scope = kind === 'manager' ? ['src', 'index.html', 'content'] : kind === 'page' ? ['src', 'index.html'] : slug ? [path.join('content', 'column', slug)] : [];
          const snapshotId = scope.length ? takeSnapshot(root, String(body.title || prompt), scope, lane) : undefined;

          const tools = kind === 'manager' ? MANAGER_TOOLS : kind === 'column' ? COLUMN_TOOLS : ALLOWED_TOOLS;
          const args = ['-p', '--output-format', 'stream-json', '--verbose', '--include-partial-messages',
            '--permission-mode', 'default', '--allowedTools', tools.join(',')];
          if (body.sessionId && /^[\w-]+$/.test(body.sessionId)) args.push('--resume', body.sessionId);
          if (body.model && /^[\w.-]+$/.test(body.model)) args.push('--model', body.model);

          const title = String(body.title || prompt).replace(/\s+/g, ' ').slice(0, 60);
          const j = jm.start({ kind, title, lane, slug: slug || undefined, userText: String(body.label || prompt), prompt: full, args, model: body.model, snapshotId,
            onExit: (job) => {
              if (job.kind !== 'page') server.ws.send({ type: 'custom', event: 'studio:job-done', data: { id: job.id } });
              if (job.status !== 'done' || (job.kind !== 'column' && job.kind !== 'manager')) return;
              // 문체 학습: AI가 손댄 칼럼은 "AI 버전"으로 보관(이후 사람이 직접 고친 것만 첨삭으로 잡힘), 수정 지시는 학습 자료로
              const slugs = new Set<string>(job.slug ? [job.slug] : []);
              for (const e of job.edited) { const mm2 = e.match(/^content\/column\/([a-z0-9-]+)\/article\.md$/); if (mm2) slugs.add(mm2[1]); }
              try { rememberAiDrafts(root, [...slugs]); } catch {}
              const isFollowUp = job.kind === 'manager' || (!!job.slug && !/^새 칼럼|^칼럼 주제 추천/.test(job.title));
              if (isFollowUp) try { addStyleSample(root, { kind: 'instruction', source: job.kind === 'manager' ? '매니저 지시' : '칼럼 수정 지시', title: job.slug || '', after: String(body.label || prompt).slice(0, 1500) }); } catch {}
            } });
          return json(res, 200, { id: j.id, lane });
        }

        return json(res, 404, { error: 'not found' });
      });

      s.httpServer?.once('listening', () => {
        setTimeout(() => {
          const port = (s.httpServer?.address() as any)?.port ?? 5173;
          s.config.logger.info(`\n  🎬 아터스 스튜디오:  http://localhost:${port}/__studio   (작업실만: /__studio/work)\n`);
          if (process.env.CLAUDECODE) s.config.logger.warn('  ⚠  Claude Code 안에서 실행 중이라 스튜디오의 채팅이 동작하지 않습니다.\n     새 터미널 창에서 npm run dev 를 실행하세요.\n');
        }, 50);
      });
    },
  };
}
