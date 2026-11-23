/* 아터스 스튜디오 운영 앱 공통 도구 (전역 K) */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  async function api(url, opts = {}) {
    const init = { ...opts, headers: { ...(opts.body && !(opts.body instanceof Blob) ? { 'Content-Type': 'application/json' } : {}), ...(opts.headers || {}) } };
    if (opts.body && typeof opts.body === 'object' && !(opts.body instanceof Blob)) init.body = JSON.stringify(opts.body);
    const r = await fetch(url, init);
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || `요청 실패 (${r.status})`);
    return j;
  }
  const db = (col) => ({
    list: () => api(`/__studio/api/db/${col}`),
    get: (id) => api(`/__studio/api/db/${col}/${id}`),
    add: (o) => api(`/__studio/api/db/${col}`, { method: 'POST', body: o }),
    put: (id, o) => api(`/__studio/api/db/${col}/${id}`, { method: 'PUT', body: o }),
    del: (id) => api(`/__studio/api/db/${col}/${id}`, { method: 'DELETE' }),
    bulk: (items, key) => api(`/__studio/api/db/${col}/bulk`, { method: 'POST', body: { items, key } }),
  });

  /* 날짜·돈 */
  const pad = (n) => String(n).padStart(2, '0');
  const DOW = ['일', '월', '화', '수', '목', '금', '토'];
  const d = (v) => (v instanceof Date ? v : new Date(v));
  const ymd = (v = new Date()) => { const x = d(v); return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`; };
  const month = (v = new Date()) => ymd(v).slice(0, 7);
  const fmtDate = (v) => { if (!v) return ''; const x = d(v); return isNaN(x) ? String(v) : `${x.getMonth() + 1}.${x.getDate()} (${DOW[x.getDay()]})`; };
  const fmtTime = (v) => { if (!v) return ''; const x = d(v); return isNaN(x) ? '' : `${pad(x.getHours())}:${pad(x.getMinutes())}`; };
  const fmtDT = (v) => (v ? `${fmtDate(v)} ${fmtTime(v)}` : '');
  const won = (n) => (Number(n) || 0).toLocaleString('ko-KR') + '원';
  const phone = (p) => { const s = String(p || '').replace(/\D/g, ''); return s.length === 11 ? `${s.slice(0, 3)}-${s.slice(3, 7)}-${s.slice(7)}` : s.length === 10 ? `${s.slice(0, 3)}-${s.slice(3, 6)}-${s.slice(6)}` : (p || ''); };
  const sameDay = (a, b) => ymd(a) === ymd(b);
  const addDays = (v, n) => { const x = new Date(d(v)); x.setDate(x.getDate() + n); return x; };

  /* 공통 목록 */
  const STAGES = ['문의', '상담예약', '상담완료', '등록', '수강중', '휴원', '수료', '이탈'];
  const STAGE_COLOR = { 문의: 'blue', 상담예약: 'blue', 상담완료: 'warn', 등록: 'ok', 수강중: 'ok', 휴원: '', 수료: '', 이탈: 'danger' };
  const SOURCES = ['인스타그램', '네이버 예약', '네이버 검색', '카카오톡', '유튜브', '지인 소개', '홈페이지', '기타'];
  const PROGRAMS = ['입시반', '재수반', '예고 입시반', '성인 배우반', '1:1 레슨', '원데이 클래스', '기타'];
  const stageBadge = (s) => `<span class="badge ${STAGE_COLOR[s] || ''}">${esc(s || '-')}</span>`;

  /* 셸 연동: 탭 열기·제목 */
  const inShell = window.parent !== window;
  function open(app, params = {}) {
    if (inShell) window.parent.postMessage({ type: 'studio:open', app, params }, location.origin);
    else window.open(`/__studio/app/${app}?${new URLSearchParams(params)}`, '_blank');
  }
  function openWork(mode) {
    if (inShell) window.parent.postMessage({ type: 'studio:open', app: 'work', params: { mode } }, location.origin);
    else window.open('/__studio/work', '_blank');
  }
  const param = (k) => new URLSearchParams(location.search).get(k);
  window.addEventListener('message', (e) => { if (e.origin === location.origin && e.data?.type === 'studio:params' && typeof window.onParams === 'function') window.onParams(e.data.params || {}); });

  /* 알림 */
  let tt;
  function toast(m) {
    let t = $('#__toast'); if (!t) { t = document.createElement('div'); t.id = '__toast'; t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = m; t.hidden = false; clearTimeout(tt); tt = setTimeout(() => (t.hidden = true), 2800);
  }

  /* 서랍·모달 */
  function overlay(cls, inner) {
    const o = document.createElement('div'); o.className = 'overlay' + (cls === 'modal' ? ' center' : '');
    o.innerHTML = `<div class="${cls}">${inner}</div>`;
    o.addEventListener('mousedown', (e) => { if (e.target === o) close(); });
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    function close() { o.remove(); document.removeEventListener('keydown', onKey); }
    document.addEventListener('keydown', onKey);
    document.body.appendChild(o);
    return { el: o.firstElementChild, close };
  }
  const drawer = (html) => overlay('drawer', html);

  /* 스키마 기반 입력 폼 → Promise<값|null> */
  function field(f, v) {
    const val = v ?? f.default ?? '';
    const req = f.required ? ' required' : '';
    if (f.type === 'select') return `<select class="in" name="${f.k}"${req}>${(f.options || []).map((o) => `<option${String(o) === String(val) ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
    if (f.type === 'textarea') return `<textarea class="in" name="${f.k}"${req} placeholder="${esc(f.ph || '')}">${esc(val)}</textarea>`;
    if (f.type === 'checkbox') return `<input type="checkbox" name="${f.k}"${val ? ' checked' : ''}>`;
    if (f.type === 'tags') return `<input class="in" name="${f.k}" value="${esc(Array.isArray(val) ? val.join(', ') : val)}" placeholder="${esc(f.ph || '쉼표로 구분')}">`;
    return `<input class="in" type="${f.type || 'text'}" name="${f.k}" value="${esc(val)}"${req} placeholder="${esc(f.ph || '')}"${f.type === 'number' ? ' inputmode="numeric"' : ''}>`;
  }
  function form({ title, fields, values = {}, submit = '저장', danger, note }) {
    return new Promise((resolve) => {
      const html = `<h3>${esc(title)}</h3>${note ? `<div class="notice">${note}</div>` : ''}<form class="fgrid">${fields.map((f) =>
        f.type === 'checkbox'
          ? `<label class="f check ${f.full ? 'full' : ''}">${field(f, values[f.k])}${esc(f.label)}</label>`
          : `<label class="f ${f.full || f.type === 'textarea' ? 'full' : ''}">${esc(f.label)}${f.required ? ' *' : ''}${field(f, values[f.k])}${f.help ? `<span class="help">${esc(f.help)}</span>` : ''}</label>`).join('')}
        <div class="row full" style="margin-top:4px">${danger ? `<button type="button" class="btn danger" data-act="del">${esc(danger)}</button>` : ''}<span class="spacer"></span><button type="button" class="btn" data-act="cancel">취소</button><button class="btn primary">${esc(submit)}</button></div></form>`;
      const m = overlay('modal', html);
      const f = $('form', m.el);
      setTimeout(() => $('input,select,textarea', f)?.focus(), 30);
      f.onsubmit = (e) => {
        e.preventDefault();
        const out = {};
        for (const fd of fields) {
          const el = f.elements[fd.k]; if (!el) continue;
          out[fd.k] = fd.type === 'checkbox' ? el.checked : fd.type === 'number' ? (el.value === '' ? '' : Number(String(el.value).replace(/[^\d.-]/g, ''))) : fd.type === 'tags' ? el.value.split(',').map((x) => x.trim()).filter(Boolean) : el.value.trim();
        }
        m.close(); resolve(out);
      };
      $('[data-act=cancel]', f).onclick = () => { m.close(); resolve(null); };
      const del = $('[data-act=del]', f); if (del) del.onclick = () => { if (confirm('정말 삭제할까요?')) { m.close(); resolve({ __delete: true }); } };
    });
  }

  /* 표 */
  function table(el, rows, cols, onRow) {
    if (!rows.length) { el.innerHTML = '<div class="empty">표시할 항목이 없습니다.</div>'; return; }
    el.innerHTML = `<div class="tblwrap"><table class="tbl"><thead><tr>${cols.map((c) => `<th class="${c.num ? 'num' : ''}">${esc(c.label)}</th>`).join('')}</tr></thead><tbody>${rows.map((r, i) =>
      `<tr class="${onRow ? 'click' : ''}" data-i="${i}">${cols.map((c) => `<td class="${c.num ? 'num' : ''}">${c.render ? c.render(r) : esc(r[c.k] ?? '')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    if (onRow) $$('tbody tr', el).forEach((tr) => (tr.onclick = (e) => { if (!e.target.closest('button,a,select,input')) onRow(rows[+tr.dataset.i]); }));
  }

  /* AI 도우미: 작업을 띄우고 끝나면 JSON 돌려줌 */
  function parseJson(text) {
    const s = String(text || '');
    try { return JSON.parse(s); } catch {}
    const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/); if (fence) { try { return JSON.parse(fence[1]); } catch {} }
    const a = s.indexOf('{'), b = s.lastIndexOf('}'); if (a >= 0 && b > a) { try { return JSON.parse(s.slice(a, b + 1)); } catch {} }
    throw new Error('AI 결과를 읽지 못했습니다. 다시 시도해 주세요.');
  }
  async function ai(task, input, onStatus = () => {}) {
    const { id } = await api('/__studio/api/ai', { method: 'POST', body: { task, input } });
    let since = 0, result = null;
    for (;;) {
      await new Promise((r) => setTimeout(r, 1200));
      const d = await api(`/__studio/api/jobs/${id}?since=${since}`);
      for (const ev of d.events) {
        since = ev.seq;
        if (ev.kind === 'tool') onStatus(`${ev.name} ${ev.target || ''}`.trim());
        if (ev.kind === 'done') { if (!ev.ok) throw new Error(ev.result || 'AI 작업이 실패했습니다.'); result = ev.result; }
        if (ev.kind === 'error') throw new Error(ev.message);
      }
      if (d.job.status !== 'running') break;
    }
    return parseJson(result);
  }

  const integrations = () => api('/__studio/api/integrations');
  function download(name, blob) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
  async function copy(text) { try { await navigator.clipboard.writeText(text); toast('복사했습니다'); } catch { prompt('복사해서 쓰세요', text); } }

  window.K = { $, $$, esc, api, db, ymd, month, fmtDate, fmtTime, fmtDT, won, phone, sameDay, addDays, STAGES, SOURCES, PROGRAMS, stageBadge, open, openWork, param, toast, drawer, form, table, ai, integrations, download, copy, inShell };
})();
