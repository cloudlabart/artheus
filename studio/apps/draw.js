/* 웹진·광고 영상 공통 그리기 도구 (전역 D) — 캔버스, 한글 줄바꿈, 브랜드 테마, ZIP */
window.D = (() => {
  const THEMES = {
    ivory: { name: '아이보리', bg: '#F3F0EA', fg: '#132B3F', sub: '#35526B', accent: '#153956', soft: '#DFE8EF', on: '#FAF8F4' },
    navy: { name: '딥블루', bg: '#153956', fg: '#FAF8F4', sub: '#A9C5D9', accent: '#A9C5D9', soft: '#1F4A6E', on: '#132B3F' },
    sky: { name: '라이트블루', bg: '#DFE8EF', fg: '#132B3F', sub: '#2D5E88', accent: '#2D5E88', soft: '#FAF8F4', on: '#FAF8F4' },
  };
  const FONT = '"IBM Plex Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
  async function fonts() {
    try { await Promise.all(['400', '600', '700'].map((w) => document.fonts.load(`${w} 48px "IBM Plex Sans KR"`, '가나다ABC'))); } catch {}
  }
  function lines(ctx, text, maxW) {
    const out = [];
    for (const para of String(text ?? '').split('\n')) {
      let line = '';
      for (let w of para.split(' ')) {
        const test = line ? line + ' ' + w : w;
        if (ctx.measureText(test).width <= maxW) { line = test; continue; }
        if (line) { out.push(line); line = ''; }
        while (w && ctx.measureText(w).width > maxW) { // 띄어쓰기 없는 긴 말은 글자 단위로
          let i = 1; while (i < w.length && ctx.measureText(w.slice(0, i + 1)).width <= maxW) i++;
          out.push(w.slice(0, i)); w = w.slice(i);
        }
        line = w;
      }
      out.push(line);
    }
    return out;
  }
  function text(ctx, str, x, y, { size = 40, weight = 400, color = '#000', maxW = 900, lh = 1.45, align = 'left', maxLines = 0, alpha = 1 } = {}) {
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.font = `${weight} ${size}px ${FONT}`; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'top';
    let ls = lines(ctx, str, maxW);
    if (maxLines && ls.length > maxLines) { ls = ls.slice(0, maxLines); ls[maxLines - 1] = ls[maxLines - 1].slice(0, -1) + '…'; }
    ls.forEach((l, i) => ctx.fillText(l, x, y + i * size * lh));
    ctx.restore();
    return y + ls.length * size * lh;
  }
  function measure(ctx, str, { size = 40, weight = 400, maxW = 900, lh = 1.45 } = {}) {
    ctx.save(); ctx.font = `${weight} ${size}px ${FONT}`; const n = lines(ctx, str, maxW).length; ctx.restore(); return n * size * lh;
  }
  function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }
  function cover(ctx, src, x, y, w, h, zoom = 1) {
    const iw = src.videoWidth || src.naturalWidth || src.width, ih = src.videoHeight || src.naturalHeight || src.height;
    if (!iw || !ih) return;
    const s = Math.max(w / iw, h / ih) * zoom; const dw = iw * s, dh = ih * s;
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.drawImage(src, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh); ctx.restore();
  }
  const cache = new Map();
  function loadImage(url) {
    if (!url) return Promise.resolve(null);
    if (cache.has(url)) return cache.get(url);
    const p = new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = url; });
    cache.set(url, p); return p;
  }
  /* ZIP (압축 없이 묶기) */
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = (d) => { let c = 0xffffffff; for (let i = 0; i < d.length; i++) c = CRC[(c ^ d[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  function zip(files) {
    const enc = new TextEncoder(); const parts = [], central = []; let off = 0;
    for (const f of files) {
      const name = enc.encode(f.name), crc = crc32(f.data), n = f.data.length;
      const h = new DataView(new ArrayBuffer(30));
      [[0, 0x04034b50, 4], [4, 20, 2], [6, 0x0800, 2], [12, 0x21, 2], [14, crc, 4], [18, n, 4], [22, n, 4], [26, name.length, 2]].forEach(([o, v, s]) => (s === 4 ? h.setUint32(o, v, true) : h.setUint16(o, v, true)));
      parts.push(new Uint8Array(h.buffer), name, f.data);
      const c = new DataView(new ArrayBuffer(46));
      [[0, 0x02014b50, 4], [4, 20, 2], [6, 20, 2], [8, 0x0800, 2], [14, 0x21, 2], [16, crc, 4], [20, n, 4], [24, n, 4], [28, name.length, 2], [42, off, 4]].forEach(([o, v, s]) => (s === 4 ? c.setUint32(o, v, true) : c.setUint16(o, v, true)));
      central.push(new Uint8Array(c.buffer), name);
      off += 30 + name.length + n;
    }
    const cs = central.reduce((s, p) => s + p.length, 0);
    const e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, cs, true); e.setUint32(16, off, true);
    return new Blob([...parts, ...central, new Uint8Array(e.buffer)], { type: 'application/zip' });
  }
  const toBytes = (canvas) => new Promise((res) => canvas.toBlob(async (b) => res(new Uint8Array(await b.arrayBuffer())), 'image/png'));
  async function upload(file) {
    const r = await fetch('/__studio/api/media', { method: 'POST', headers: { 'Content-Type': file.type }, body: file });
    const j = await r.json(); if (!r.ok) throw new Error(j.error || '올리지 못했습니다'); return j;
  }
  return { THEMES, FONT, fonts, lines, text, measure, rrect, cover, loadImage, zip, toBytes, upload };
})();
