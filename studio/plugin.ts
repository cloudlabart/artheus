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
 * 공개 발행(git commit·push)은 [발행] 버튼으로만 합니다.
 */
import type { Plugin, ViteDevServer } from 'vite';
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { IncomingMessage, ServerResponse } from 'node:http';

const here = path.dirname(fileURLToPath(import.meta.url));

const SYSTEM_NOTE = `
You are working inside "아터스 스튜디오 (artheus Studio)", a visual vibe-coding tool for the ARTHEUS acting-studio website.
Project: Vite + React 18 + TypeScript + Tailwind CSS v4 (utility classes), react-router HashRouter, motion/react, lucide-react.
Main files: src/app/App.tsx (routes and the PAGES table), src/app/pages/*.tsx, src/app/components/*.tsx, src/styles/*.css.
The user sees a live preview that hot-reloads as you edit files, so:
- Edit files directly. Do not run the dev server, builds, installs or git.
- Never modify anything under studio/.
- Keep the existing design language (ivory #F3F0EA, deep blue #153956, ink #132B3F, keep-ko class for Korean line breaks) unless asked to change it.
- When the user selected an element, its source location is given; change that place first.
- Reply in Korean, briefly: what you changed and in which files. No long explanations.
`.trim();

const NESTED_MSG = '스튜디오가 Claude Code 안에서 실행되고 있어 Claude를 부를 수 없습니다.\n\n해결: Claude Code 창에서 Ctrl+C로 개발 서버를 끄고, 새 터미널 창을 열어 프로젝트 폴더에서 npm run dev 를 다시 실행한 뒤 이 화면을 새로고침하세요.';

const ALLOWED_TOOLS = ['Read', 'Edit', 'MultiEdit', 'Write', 'Glob', 'Grep'];

/* 칼럼 작업용: 웹 조사 + 칼럼 스크립트만 추가로 허용 (git·배포는 버튼으로만) */
const PY = process.platform === 'win32' ? 'python' : 'python3';
const COLUMN_TOOLS = [...ALLOWED_TOOLS, 'WebSearch', 'WebFetch', 'Task', 'Agent', 'Skill', 'TodoWrite',
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
- Final reply in Korean, short: 무엇을 했는지, 검수 점수, 확인 필요.
`.trim();

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function runPy(root: string, args: string[]) {
  const r = spawnSync(PY, args, { cwd: root, encoding: 'utf8', shell: process.platform === 'win32' });
  return { ok: r.status === 0, out: (r.stdout || '') + (r.stderr || ''), error: r.error?.message };
}
function runGit(root: string, args: string[]) {
  const r = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
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

/* ── 되돌리기용 스냅샷: 요청마다 src/ 와 index.html 을 복사해 둠 ── */
function snapshotDir(root: string) { return path.join(root, '.studio', 'snapshots'); }
function takeSnapshot(root: string, label: string) {
  const dir = path.join(snapshotDir(root), String(Date.now()));
  fs.mkdirSync(dir, { recursive: true });
  fs.cpSync(path.join(root, 'src'), path.join(dir, 'src'), { recursive: true });
  if (fs.existsSync(path.join(root, 'index.html'))) fs.copyFileSync(path.join(root, 'index.html'), path.join(dir, 'index.html'));
  if (fs.existsSync(path.join(root, 'content'))) fs.cpSync(path.join(root, 'content'), path.join(dir, 'content'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'label.txt'), label.slice(0, 200));
  const all = fs.readdirSync(snapshotDir(root)).sort();
  for (const old of all.slice(0, Math.max(0, all.length - 30))) fs.rmSync(path.join(snapshotDir(root), old), { recursive: true, force: true });
}
function listSnapshots(root: string) {
  const d = snapshotDir(root);
  if (!fs.existsSync(d)) return [];
  return fs.readdirSync(d).sort().reverse().map((id) => ({
    id, label: fs.existsSync(path.join(d, id, 'label.txt')) ? fs.readFileSync(path.join(d, id, 'label.txt'), 'utf8') : '',
  }));
}
function restoreSnapshot(root: string, id: string) {
  const dir = path.join(snapshotDir(root), id);
  if (!/^\d+$/.test(id) || !fs.existsSync(dir)) throw new Error('snapshot not found');
  fs.rmSync(path.join(root, 'src'), { recursive: true, force: true });
  fs.cpSync(path.join(dir, 'src'), path.join(root, 'src'), { recursive: true });
  if (fs.existsSync(path.join(dir, 'index.html'))) fs.copyFileSync(path.join(dir, 'index.html'), path.join(root, 'index.html'));
  if (fs.existsSync(path.join(dir, 'content'))) {
    fs.rmSync(path.join(root, 'content'), { recursive: true, force: true });
    fs.cpSync(path.join(dir, 'content'), path.join(root, 'content'), { recursive: true });
  }
  fs.rmSync(dir, { recursive: true, force: true });
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
  let running: ChildProcess | null = null;

  return {
    name: 'artheus-studio', // 아터스 스튜디오
    apply: 'serve',
    configureServer(s) {
      server = s;
      const root = s.config.root;

      s.middlewares.use(async (req, res, next) => {
        const url = (req.url || '').split('?')[0];
        // 발행된 칼럼(public/column/…/index.html)을 개발 서버에서도 배포와 똑같이 보여 줌
        if (/^\/column(\/[a-z0-9-]*)?\/?$/.test(url)) {
          const file = path.join(root, 'public', url.replace(/\/?$/, '/index.html'));
          if (fs.existsSync(file)) return serveFile(res, file);
          return next();
        }
        if (!url.startsWith('/__studio')) return next();
        if (!isLocal(req)) return json(res, 403, { error: '스튜디오는 이 컴퓨터에서만 열 수 있습니다.' });

        if (url === '/__studio' || url === '/__studio/') {
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          return res.end(fs.readFileSync(path.join(here, 'ui.html'), 'utf8'));
        }

        if (url === '/__studio/api/status') {
          const version = await claudeAvailable();
          return json(res, 200, { claude: version, loggedIn: version ? await claudeLoggedIn() : null, nested: !!process.env.CLAUDECODE, busy: !!running, snapshots: listSnapshots(root).slice(0, 10) });
        }

        if (url === '/__studio/api/undo' && req.method === 'POST') {
          if (running) return json(res, 409, { error: '작업 중에는 되돌릴 수 없습니다.' });
          const snaps = listSnapshots(root);
          const body = await readBody(req);
          const id = body.id || snaps[0]?.id;
          if (!id) return json(res, 404, { error: '되돌릴 기록이 없습니다.' });
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
          if (running) return json(res, 409, { error: '작업이 끝난 뒤에 받으세요.' });
          if (!runGit(root, ['remote']).out) return json(res, 400, { error: 'GitHub 원격 저장소가 연결되어 있지 않습니다.' });
          const r = runGit(root, ['pull', '--rebase', '--autostash']);
          return json(res, r.ok ? 200 : 500, r.ok ? { ok: true, out: r.out } : { error: r.out.slice(-500) });
        }

        if (url === '/__studio/api/columns/publish' && req.method === 'POST') {
          if (running) return json(res, 409, { error: 'Claude 작업이 끝난 뒤에 발행하세요.' });
          const { slug, unpublish, push } = await readBody(req);
          if (!SLUG_RE.test(String(slug))) return json(res, 400, { error: 'slug가 올바르지 않습니다.' });
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
          takeSnapshot(root, (unpublish ? '발행 취소: ' : '발행: ') + slug);
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

        if (url === '/__studio/api/stop' && req.method === 'POST') {
          running?.kill('SIGTERM');
          return json(res, 200, { ok: true });
        }

        if (url === '/__studio/api/chat' && req.method === 'POST') {
          if (running) return json(res, 409, { error: '이전 요청이 아직 진행 중입니다.' });
          const body = await readBody(req);
          const attachments = (Array.isArray(body.attachments) ? body.attachments : [])
            .filter((a: any) => typeof a?.path === 'string' && /^public\/uploads\/[^/\\]+$/.test(a.path) && fs.existsSync(path.join(root, a.path)))
            .slice(0, 8);
          const prompt = String(body.prompt || '').trim() || (attachments.length ? '첨부한 이미지를 보고 알맞게 반영해줘.' : '');
          if (!prompt) return json(res, 400, { error: '요청 내용이 비어 있습니다.' });

          const column = body.mode === 'column';
          const colSlug = column && SLUG_RE.test(String(body.slug || '')) ? String(body.slug) : '';
          let full = column
            ? `[스튜디오 작업 지침 — 반드시 따를 것]\n${COLUMN_NOTE}\n\n${colSlug ? `[현재 칼럼]\ncontent/column/${colSlug}/article.md\n\n` : ''}[사용자 요청]\n${prompt}`
            : `[스튜디오 작업 지침 — 반드시 따를 것]\n${SYSTEM_NOTE}\n\n[사용자 요청]\n${prompt}`;
          if (body.selection) {
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

          takeSnapshot(root, prompt);

          const args = ['-p', '--output-format', 'stream-json', '--verbose', '--include-partial-messages',
            '--permission-mode', 'acceptEdits', '--allowedTools', (column ? COLUMN_TOOLS : ALLOWED_TOOLS).join(',')];
          if (body.sessionId && /^[\w-]+$/.test(body.sessionId)) args.push('--resume', body.sessionId);
          if (body.model && /^[\w.-]+$/.test(body.model)) args.push('--model', body.model);

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
          res.setHeader('Cache-Control', 'no-cache');
          const send = (o: unknown) => res.write(JSON.stringify(o) + '\n');

          const child = spawn('claude', args, { cwd: root, shell: process.platform === 'win32', env: process.env });
          running = child;
          child.stdin?.end(full);

          let buf = '';
          child.stdout?.on('data', (chunk) => {
            buf += chunk;
            let i;
            while ((i = buf.indexOf('\n')) >= 0) {
              const line = buf.slice(0, i).trim();
              buf = buf.slice(i + 1);
              if (!line) continue;
              let ev: any;
              try { ev = JSON.parse(line); } catch { continue; }
              if (ev.type === 'system' && ev.subtype === 'init') send({ kind: 'session', sessionId: ev.session_id, model: ev.model });
              else if (ev.type === 'stream_event' && ev.event?.type === 'content_block_delta' && ev.event.delta?.type === 'text_delta') send({ kind: 'delta', text: ev.event.delta.text });
              else if (ev.type === 'assistant') {
                for (const b of ev.message?.content || []) {
                  if (b.type === 'tool_use') {
                    const fp = b.input?.file_path || b.input?.path || '';
                    const other = b.input?.pattern || b.input?.query || b.input?.url || b.input?.description || b.input?.skill || String(b.input?.command || '').replace(/^python3?\s+tools\/geo-seo\/scripts\//, '');
                    send({ kind: 'tool', name: b.name, target: fp ? path.relative(root, path.resolve(root, String(fp))) || String(fp) : String(other || '').slice(0, 120) });
                  } else if (b.type === 'text') send({ kind: 'text', text: b.text });
                }
              } else if (ev.type === 'result') {
                send({ kind: 'done', ok: !ev.is_error, sessionId: ev.session_id, result: ev.result, costUsd: ev.total_cost_usd, ms: ev.duration_ms });
              }
            }
          });
          let errText = '';
          child.stderr?.on('data', (c) => (errText += c));
          child.on('error', (e) => { s.config.logger.error(`[아터스 스튜디오] Claude Code 실행 실패: ${e.message}`); send({ kind: 'error', message: `Claude Code를 실행하지 못했습니다: ${e.message}` }); });
          child.on('close', (code) => {
            running = null;
            if (code !== 0 && code !== null) {
              const nested = /inside another Claude Code session|CLAUDECODE/i.test(errText);
              s.config.logger.error(`[아터스 스튜디오] Claude Code 오류 (코드 ${code}):\n${errText.trim().slice(-2000)}`);
              send({ kind: 'error', message: nested ? NESTED_MSG : (errText.trim().slice(-600) || `Claude Code가 코드 ${code}로 끝났습니다.`) });
            }
            if (code === null) send({ kind: 'error', message: '중지했습니다.' });
            res.end();
          });
          req.on('close', () => { if (!res.writableEnded) child.kill('SIGTERM'); });
          return;
        }

        return json(res, 404, { error: 'not found' });
      });

      s.httpServer?.once('listening', () => {
        setTimeout(() => {
          const port = (s.httpServer?.address() as any)?.port ?? 5173;
          s.config.logger.info(`\n  🎬 아터스 스튜디오:  http://localhost:${port}/__studio\n`);
          if (process.env.CLAUDECODE) s.config.logger.warn('  ⚠  Claude Code 안에서 실행 중이라 스튜디오의 채팅이 동작하지 않습니다.\n     새 터미널 창에서 npm run dev 를 실행하세요.\n');
        }, 50);
      });
    },
  };
}
