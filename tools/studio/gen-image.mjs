#!/usr/bin/env node
/**
 * 아터스 스튜디오 — 이미지 생성
 *   node tools/studio/gen-image.mjs --prompt "..." [--aspect 16:9] [--name hero-stage] [--provider gemini|openai] [--no-brand]
 *
 * 키는 스튜디오 › 설정 › 이미지 생성 (.studio/config/integrations.json, git에 올라가지 않음).
 * 결과: public/images/gen/<name>.(jpg|png) → 사이트 주소 /images/gen/<name>.jpg
 * 출력: 마지막 줄에 JSON {"ok":true,"path":"public/images/gen/…","url":"/images/gen/…"}
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const ASPECTS = ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '4:5', '5:4', '21:9'];

// 브랜드 이미지 스타일 (tools/studio/brand-visual.md 와 같은 내용의 요약)
export const BRAND_STYLE = [
  'Editorial photography for a Korean acting academy in Hongdae, Seoul.',
  'Calm, cinematic, natural light; muted palette of warm ivory (#F3F0EA), deep navy blue (#153956) and soft light blue (#A9C5D9); subtle film grain.',
  'Rehearsal rooms, black-box stages, scripts, chairs, light through windows, hands and silhouettes rather than identifiable faces.',
  'No text, no letters, no logos, no watermarks. Not cartoonish, not glossy stock-photo look.',
].join(' ');

function args(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]; if (!a.startsWith('--')) continue;
    const k = a.slice(2); const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true; o[k] = v;
  }
  return o;
}
function config() {
  try { return JSON.parse(fs.readFileSync(path.join(root, '.studio', 'config', 'integrations.json'), 'utf8')).image || {}; } catch { return {}; }
}
const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

async function gemini(cfg, prompt, aspect) {
  const model = cfg.geminiModel || 'gemini-2.5-flash-image';
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': cfg.geminiKey },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: aspect } } }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Gemini ${r.status}: ${j.error?.message || r.statusText}${r.status === 404 ? ' (설정에서 모델 이름을 확인하세요)' : ''}`);
  const part = (j.candidates?.[0]?.content?.parts || []).find((p) => p.inlineData?.data);
  if (!part) throw new Error('Gemini가 이미지를 돌려주지 않았어요. ' + (j.candidates?.[0]?.finishReason || '') + ' 프롬프트를 바꿔 보세요.');
  return { buf: Buffer.from(part.inlineData.data, 'base64'), ext: (part.inlineData.mimeType || 'image/png').includes('jpeg') ? 'jpg' : 'png' };
}
async function openai(cfg, prompt, aspect) {
  const [w, h] = aspect.split(':').map(Number);
  const size = w > h ? '1536x1024' : w < h ? '1024x1536' : '1024x1024';
  const r = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${cfg.openaiKey}` },
    body: JSON.stringify({ model: cfg.openaiModel || 'gpt-image-1', prompt, size, n: 1 }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`OpenAI ${r.status}: ${j.error?.message || r.statusText}`);
  const b64 = j.data?.[0]?.b64_json; if (!b64) throw new Error('OpenAI가 이미지를 돌려주지 않았어요.');
  return { buf: Buffer.from(b64, 'base64'), ext: 'png' };
}

export async function generate({ prompt, aspect = '16:9', name, provider, brand = true }) {
  const cfg = config();
  prompt = String(prompt || '').trim(); if (!prompt) throw new Error('프롬프트가 비어 있어요.');
  if (!ASPECTS.includes(aspect)) aspect = '16:9';
  provider = provider || cfg.provider || (cfg.geminiKey ? 'gemini' : cfg.openaiKey ? 'openai' : '');
  if (provider === 'gemini' && !cfg.geminiKey) throw new Error('Gemini 키가 없어요. 스튜디오 › 설정 › 이미지 생성에 넣어 주세요.');
  if (provider === 'openai' && !cfg.openaiKey) throw new Error('OpenAI 키가 없어요. 스튜디오 › 설정 › 이미지 생성에 넣어 주세요.');
  if (!provider) throw new Error('이미지 생성 키가 없어요. 스튜디오 › 설정 › 이미지 생성에서 Gemini 또는 OpenAI 키를 넣어 주세요. (키 없이 하려면 SVG 그래픽으로 만들어 달라고 요청하세요)');
  const full = brand ? `${prompt}\n\nStyle: ${BRAND_STYLE}` : prompt;
  const { buf, ext } = provider === 'openai' ? await openai(cfg, full, aspect) : await gemini(cfg, full, aspect);

  const dir = path.join(root, 'public', 'images', 'gen'); fs.mkdirSync(dir, { recursive: true });
  let base = slugify(name || prompt) || 'image'; let n = 1;
  while (fs.existsSync(path.join(dir, `${base}.jpg`)) || fs.existsSync(path.join(dir, `${base}.png`))) base = `${slugify(name || prompt) || 'image'}-${++n}`;
  let file = path.join(dir, `${base}.${ext}`); fs.writeFileSync(file, buf);
  // Mac: 내장 sips 로 가로 최대 1920px JPEG(품질 82)로 줄여 사이트 속도 유지
  if (process.platform === 'darwin' && ext === 'png') {
    const out = path.join(dir, `${base}.jpg`);
    const r = spawnSync('sips', ['-Z', '1920', '-s', 'format', 'jpeg', '-s', 'formatOptions', '82', file, '--out', out], { encoding: 'utf8' });
    if (r.status === 0 && fs.existsSync(out)) { fs.rmSync(file); file = out; }
  }
  // 생성 기록 (이 Mac에만)
  const logF = path.join(root, '.studio', 'images.json'); fs.mkdirSync(path.dirname(logF), { recursive: true });
  let logA = []; try { logA = JSON.parse(fs.readFileSync(logF, 'utf8')); } catch {}
  const rel = path.relative(root, file).split(path.sep).join('/');
  const rec = { path: rel, url: '/' + rel.replace(/^public\//, ''), prompt, aspect, provider, createdAt: new Date().toISOString(), size: fs.statSync(file).size };
  logA.unshift(rec); fs.writeFileSync(logF, JSON.stringify(logA.slice(0, 300), null, 2));
  return rec;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const a = args(process.argv.slice(2));
  generate({ prompt: a.prompt, aspect: a.aspect, name: a.name, provider: a.provider, brand: !a['no-brand'] })
    .then((r) => { console.log(`이미지를 만들었어요: ${r.path} (사이트 주소 ${r.url})`); console.log(JSON.stringify({ ok: true, ...r })); })
    .catch((e) => { console.error(e.message); console.log(JSON.stringify({ ok: false, error: e.message })); process.exit(1); });
}
