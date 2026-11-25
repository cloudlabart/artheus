#!/usr/bin/env node
/**
 * 아터스 스튜디오 — 화면 캡처 (Claude가 만든 화면을 직접 보고 검토하도록)
 *   node tools/studio/shot.mjs [경로=/] [폭=1440,390] [--full]
 * 예: node tools/studio/shot.mjs /programs 1440,390
 * 개발 서버(npm run dev, 기본 http://localhost:5173)가 켜져 있어야 합니다.
 * 이 Mac의 Google Chrome을 씁니다(playwright-core). 결과: .studio/shots/*.png → Read 도구로 열어 보기
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const argv = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const full = process.argv.includes('--full');
const route = (argv[0] || '/').replace(/^#/, '');
const widths = String(argv[1] || '1440,390').split(',').map(Number).filter((n) => n >= 320 && n <= 2560);
const origin = process.env.STUDIO_ORIGIN || 'http://localhost:5173';

let chromium;
try { ({ chromium } = await import('playwright-core')); } catch {
  try { ({ chromium } = await import('playwright')); } catch { console.error('playwright-core가 없어요. 프로젝트 폴더에서 npm install 을 실행하세요.'); process.exit(1); }
}
let browser;
for (const opt of [{ channel: 'chrome' }, { channel: 'msedge' }, {}, { executablePath: '/opt/pw-browsers/chromium' }]) {
  try { browser = await chromium.launch({ headless: true, ...opt }); break; } catch {}
}
if (!browser) { console.error('브라우저를 찾지 못했어요. Google Chrome을 설치하세요.'); process.exit(1); }

const dir = path.join(root, '.studio', 'shots'); fs.mkdirSync(dir, { recursive: true });
const tag = route.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home';
const out = [];
for (const w of widths) {
  const page = await browser.newPage({ viewport: { width: w, height: w < 600 ? 844 : 900 }, deviceScaleFactor: 1 });
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${origin}/#${route.startsWith('/') ? route : '/' + route}`, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(800);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  const file = path.join(dir, `${tag}-${w}.png`);
  await page.screenshot({ path: file, fullPage: full || w < 600 });
  out.push({ width: w, file: path.relative(root, file), horizontalOverflowPx: Math.max(0, overflow), errors });
  await page.close();
}
await browser.close();
for (const o of out) console.log(`${o.width}px → ${o.file}${o.horizontalOverflowPx ? ` · 가로 넘침 ${o.horizontalOverflowPx}px` : ''}${o.errors.length ? ` · 화면 오류 ${o.errors.length}: ${o.errors[0]}` : ''}`);
console.log('Read 도구로 위 png를 열어 직접 보세요.');
