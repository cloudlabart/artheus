/** 마이페이지(학생) · 강사 콘솔 · 관리자 화면 + 로그인 가드 */
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router';
import { homeFor, useAuth } from '../contexts/AuthContext';
import { api, tokenStore, ATT_LABEL, fmtDate, ROLE_LABEL, type LmsUser } from './api';
import { Badge, Btn, Card, Empty, ErrorBox, Field, inputCls, Page } from './ui';
import { AssignmentPage, ClassPage } from './ClassPages';

type Role = LmsUser['role'];

/** 로그인·권한 확인. 관리자는 강사 화면도 볼 수 있어요. */
export function Guard({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user, loading } = useAuth(); const loc = useLocation();
  if (loading) return <Page title="확인 중…"><span /></Page>;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname)}`} replace />;
  if (!roles.includes(user.role)) return <Navigate to={homeFor(user)} replace />;
  return <>{children}</>;
}

function useOverview() {
  const [d, setD] = useState<any>(null); const [err, setErr] = useState('');
  useEffect(() => { api('/me/overview').then(setD).catch((e) => setErr(e.message)); }, []);
  return { d, err };
}
const Logout = () => { const { logout } = useAuth(); return <Btn onClick={() => logout()}>로그아웃</Btn>; };
const ClassCards = ({ classes, base }: { classes: any[]; base: string }) => (
  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {classes.map((c) => (
      <Link key={c.id} to={`${base}/class/${c.id}`} className="block rounded-2xl border border-[#153956]/15 bg-[#FAF8F4] p-5 hover:border-[#2D5E88]">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-[#2D5E88] uppercase">{c.program || 'CLASS'}</p>
        <b className="keep-ko block mt-1 text-[17px] text-[#132B3F]">{c.name}</b>
        <p className="keep-ko mt-1 text-sm text-[#35526B]">{[c.schedule, c.coachName].filter(Boolean).join(' · ')}</p>
      </Link>
    ))}
    {!classes.length && <Empty>아직 배정된 수업이 없어요.</Empty>}
  </div>
);
const Upcoming = ({ items }: { items: any[] }) => !items.length ? <Empty>예정된 수업이 없어요.</Empty> : (
  <ul className="grid gap-2">{items.map((l) => <li key={l.id} className="flex gap-3 text-[15px]"><span className="w-20 shrink-0 font-semibold text-[#153956]">{fmtDate(l.date)}</span><span className="keep-ko text-[#35526B]">{l.className} {l.num}회차{l.topic ? ` · ${l.topic}` : ''}</span></li>)}</ul>
);
const Notices = ({ items }: { items: any[] }) => !items.length ? <Empty>공지가 없어요.</Empty> : (
  <div className="grid gap-3">{items.map((n) => <details key={n.id} className="rounded-xl bg-white border border-[#153956]/10 px-4 py-3"><summary className="cursor-pointer keep-ko text-[15px] font-semibold text-[#132B3F]">{n.pinned && '📌 '}{n.title} <span className="text-xs font-medium text-[#5B7285]">{n.className} · {fmtDate(n.createdAt)}</span></summary><p className="keep-ko whitespace-pre-wrap mt-2 text-sm text-[#35526B]">{n.body}</p></details>)}</div>
);

/* ── 학생 ── */
function MyHome() {
  const { d, err } = useOverview(); const { user } = useAuth();
  return (
    <Page eyebrow="MY PAGE" title={`${user?.realName || ''}님의 수업`} desc="수업 일정, 과제, 강사 피드백을 여기서 확인하세요." actions={<><Link to="/my/password"><Btn>비밀번호 바꾸기</Btn></Link><Logout /></>}>
      <ErrorBox msg={err} />
      {d && (
        <div className="grid gap-6">
          <ClassCards classes={d.classes} base="/my" />
          <div className="grid lg:grid-cols-2 gap-4">
            <Card title="다가오는 수업"><Upcoming items={d.upcoming} /></Card>
            <Card title="내 출결">{d.attendance && Object.keys(d.attendance).length ? <div className="flex flex-wrap gap-2">{Object.entries(ATT_LABEL).map(([k, v]) => <Badge key={k} tone={k === 'present' ? 'ok' : k === 'absent' ? 'warn' : 'gray'}>{v} {d.attendance[k] || 0}</Badge>)}</div> : <Empty>아직 기록이 없어요.</Empty>}</Card>
            <Card title="과제">{!d.assignments.length ? <Empty>과제가 없어요.</Empty> : <ul className="grid gap-2">{d.assignments.map((a: any) => <li key={a.id}><Link to={`/my/assignment/${a.id}`} className="flex flex-wrap items-center gap-2 text-[15px] hover:text-[#2D5E88]"><span className="keep-ko font-semibold text-[#132B3F]">{a.title}</span><span className="text-xs text-[#5B7285]">{a.className}{a.dueDate ? ` · 마감 ${fmtDate(a.dueDate)}` : ''}</span>{a.submitted ? <Badge tone="ok">제출함</Badge> : <Badge tone="warn">미제출</Badge>}</Link></li>)}</ul>}</Card>
            <Card title="최근 피드백">{!d.feedback.length ? <Empty>아직 피드백이 없어요.</Empty> : <div className="grid gap-3">{d.feedback.map((f: any) => <div key={f.id} className="rounded-xl bg-white border border-[#153956]/10 p-4"><div className="text-xs text-[#5B7285] mb-1">{fmtDate(f.createdAt)} · {f.className} · {f.coach}</div><p className="keep-ko whitespace-pre-wrap text-[15px] text-[#132B3F]">{f.body}</p>{f.nextFocus && <p className="keep-ko mt-2 text-sm text-[#2D5E88]">다음 연습: {f.nextFocus}</p>}</div>)}</div>}</Card>
          </div>
          <Card title="공지"><Notices items={d.notices} /></Card>
        </div>
      )}
    </Page>
  );
}

/* ── 강사 ── */
function CoachHome() {
  const { d, err } = useOverview(); const { user } = useAuth();
  return (
    <Page eyebrow="COACH" title="강사 콘솔" desc={`${user?.realName || ''} 강사님 — 회차·출결 기록, 과제 내기, 피드백을 남겨요.`} actions={<>{user?.role === 'admin' && <Link to="/admin"><Btn>관리자 화면</Btn></Link>}<Link to="/coach/password"><Btn>비밀번호 바꾸기</Btn></Link><Logout /></>}>
      <ErrorBox msg={err} />
      {d && (
        <div className="grid gap-6">
          <ClassCards classes={d.classes} base="/coach" />
          <div className="grid lg:grid-cols-2 gap-4">
            <Card title="다가오는 수업"><Upcoming items={d.upcoming} /></Card>
            <Card title="과제 제출 현황">{!d.assignments.length ? <Empty>낸 과제가 없어요.</Empty> : <ul className="grid gap-2">{d.assignments.map((a: any) => <li key={a.id}><Link to={`/coach/assignment/${a.id}`} className="flex flex-wrap items-center gap-2 text-[15px] hover:text-[#2D5E88]"><span className="keep-ko font-semibold text-[#132B3F]">{a.title}</span><span className="text-xs text-[#5B7285]">{a.className}{a.dueDate ? ` · 마감 ${fmtDate(a.dueDate)}` : ''}</span><Badge>제출 {a.submitted}</Badge></Link></li>)}</ul>}</Card>
          </div>
          <Card title="공지"><Notices items={d.notices} /></Card>
        </div>
      )}
    </Page>
  );
}

function PasswordPage({ back }: { back: string }) {
  const [cur, setCur] = useState(''); const [next, setNext] = useState(''); const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  return (
    <Page eyebrow="ACCOUNT" title="비밀번호 바꾸기" actions={<Link to={back}><Btn>돌아가기</Btn></Link>}>
      <form className="grid gap-4 max-w-[420px]" onSubmit={async (e) => { e.preventDefault(); setErr(''); setMsg('');
        try { const r = await api<{ token: string }>('/auth/password', { body: { current: cur, next } }); tokenStore.set(r.token); setMsg('바꿨어요. 다른 기기에서는 다시 로그인해야 해요.'); setCur(''); setNext(''); } catch (er: any) { setErr(er.message); } }}>
        <ErrorBox msg={err} />{msg && <div className="rounded-xl bg-[#E1F0E6] text-[#2F7A4F] text-sm px-4 py-3">{msg}</div>}
        <Field label="지금 비밀번호"><input type="password" className={inputCls} value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" required /></Field>
        <Field label="새 비밀번호" hint="영문과 숫자를 섞어 8자 이상"><input type="password" className={inputCls} value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" required /></Field>
        <div><Btn type="submit" kind="primary">바꾸기</Btn></div>
      </form>
    </Page>
  );
}

/* ── 관리자 ── */
function InviteBox({ inv, name, onClose }: { inv: { link: string; code: string; expiresInDays: number }; name: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const text = `[아터스] ${name}님, 아래 링크에서 비밀번호를 정하고 로그인하세요 (${inv.expiresInDays}일 안에).\n${inv.link}`;
  return (
    <div className="rounded-2xl border border-[#2D5E88]/40 bg-[#DFE8EF]/60 p-5 grid gap-3">
      <b className="text-[#132B3F]">{name}님 초대 링크</b>
      <p className="keep-ko text-sm text-[#35526B]">카톡·문자로 보내 주세요. 링크로 들어가 비밀번호를 정하면 바로 로그인돼요. 이 링크는 지금만 보여요.</p>
      <code className="block break-all rounded-xl bg-white border border-[#153956]/15 px-3 py-2 text-[13px]">{inv.link}</code>
      <div className="flex flex-wrap gap-2"><Btn kind="primary" onClick={() => navigator.clipboard.writeText(text).then(() => setCopied(true))}>{copied ? '복사했어요' : '안내 문구와 함께 복사'}</Btn><Btn onClick={onClose}>닫기</Btn></div>
    </div>
  );
}

function AdminUsers() {
  const [users, setUsers] = useState<LmsUser[]>([]); const [err, setErr] = useState(''); const [q, setQ] = useState(''); const [roleF, setRoleF] = useState<'' | Role>('');
  const [f, setF] = useState({ username: '', name: '', role: 'student' as Role, phone: '' });
  const [invite, setInvite] = useState<{ inv: any; name: string } | null>(null);
  const load = useCallback(() => { api<LmsUser[]>('/admin/users').then(setUsers).catch((e) => setErr(e.message)); }, []);
  useEffect(load, [load]);
  const act = async (p: Promise<any>) => { setErr(''); try { const r = await p; load(); return r; } catch (e: any) { setErr(e.message); } };
  const list = users.filter((u) => (!roleF || u.role === roleF) && (!q || (u.name + u.username).toLowerCase().includes(q.toLowerCase())));
  return (
    <div className="grid gap-4">
      <ErrorBox msg={err} />
      {invite && <InviteBox inv={invite.inv} name={invite.name} onClose={() => setInvite(null)} />}
      <Card title="계정 만들기" sub="만들면 초대 링크가 나와요">
        <form className="grid sm:grid-cols-[1fr_1fr_120px_1fr_auto] gap-3 items-end" onSubmit={async (e) => { e.preventDefault(); const r = await act(api('/admin/users', { body: f })); if (r) { setInvite({ inv: r.invite, name: r.user.name }); setF({ ...f, username: '', name: '', phone: '' }); } }}>
          <Field label="이름"><input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required /></Field>
          <Field label="아이디 (영문 소문자·숫자)"><input className={inputCls} value={f.username} onChange={(e) => setF({ ...f, username: e.target.value.toLowerCase() })} autoCapitalize="none" required /></Field>
          <Field label="역할"><select className={inputCls} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as Role })}>{Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
          <Field label="연락처 (선택)"><input className={inputCls} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} inputMode="tel" /></Field>
          <Btn type="submit" kind="primary">만들기</Btn>
        </form>
      </Card>
      <div className="flex flex-wrap gap-2 items-center">
        <input className={inputCls + ' max-w-[240px]'} placeholder="이름·아이디 찾기" value={q} onChange={(e) => setQ(e.target.value)} />
        {(['', 'student', 'coach', 'admin'] as const).map((r) => <button key={r} onClick={() => setRoleF(r)} className={`min-h-[36px] px-4 rounded-full text-sm font-semibold ${roleF === r ? 'bg-[#153956] text-[#F3F0EA]' : 'border border-[#153956]/20 text-[#153956]'}`}>{r ? ROLE_LABEL[r] : '전체'} {users.filter((u) => !r || u.role === r).length}</button>)}
      </div>
      <div className="rounded-2xl border border-[#153956]/15 bg-[#FAF8F4] divide-y divide-[#153956]/10">
        {list.map((u) => (
          <div key={u.id} className={`flex flex-wrap items-center gap-2 px-5 py-3 ${u.active ? '' : 'opacity-50'}`}>
            <b className="text-[#132B3F]">{u.name}</b><span className="text-sm text-[#5B7285]">{u.username}</span><Badge tone={u.role === 'admin' ? 'warn' : u.role === 'coach' ? 'blue' : 'gray'}>{ROLE_LABEL[u.role]}</Badge>
            {u.invited && <Badge tone="warn">초대 대기</Badge>}{!u.active && <Badge tone="gray">사용 중지</Badge>}
            <span className="text-xs text-[#5B7285]">{u.lastLogin ? `최근 로그인 ${fmtDate(u.lastLogin)}` : ''}</span><span className="flex-1" />
            <select className="rounded-full border border-[#153956]/20 bg-white px-3 py-1.5 text-sm" value={u.role} onChange={(e) => act(api(`/admin/users/${u.id}`, { method: 'PUT', body: { role: e.target.value } }))}>{Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            <Btn onClick={async () => { if (!u.invited && !confirm(`${u.name}님의 비밀번호를 지우고 새 초대 링크를 만들까요? 지금 로그인된 기기도 로그아웃돼요.`)) return; const r = await act(api(`/admin/users/${u.id}/invite`, { method: 'POST' })); if (r) setInvite({ inv: r, name: u.name }); }}>{u.invited ? '초대 링크' : '비밀번호 초기화'}</Btn>
            <Btn kind={u.active ? 'danger' : 'line'} onClick={() => act(api(`/admin/users/${u.id}`, { method: 'PUT', body: { active: !u.active } }))}>{u.active ? '사용 중지' : '다시 사용'}</Btn>
          </div>
        ))}
        {!list.length && <div className="px-5"><Empty>계정이 없어요.</Empty></div>}
      </div>
    </div>
  );
}

function AdminClasses() {
  const [classes, setClasses] = useState<any[]>([]); const [users, setUsers] = useState<LmsUser[]>([]); const [err, setErr] = useState('');
  const blank = { name: '', program: '', coachId: '', schedule: '', startDate: '', endDate: '', status: 'active', description: '' };
  const [f, setF] = useState<any>(blank); const [edit, setEdit] = useState<string | null>(null); const [enroll, setEnroll] = useState<{ id: string; ids: string[] } | null>(null);
  const load = useCallback(() => { Promise.all([api('/admin/classes'), api('/admin/users')]).then(([c, u]) => { setClasses(c); setUsers(u); }).catch((e) => setErr(e.message)); }, []);
  useEffect(load, [load]);
  const act = async (p: Promise<any>) => { setErr(''); try { await p; load(); return true; } catch (e: any) { setErr(e.message); return false; } };
  const coaches = users.filter((u) => u.role !== 'student' && u.active); const students = users.filter((u) => u.role === 'student' && u.active);
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });
  return (
    <div className="grid gap-4">
      <ErrorBox msg={err} />
      <Card title={edit ? '수업 고치기' : '수업 만들기'}>
        <form className="grid gap-3" onSubmit={async (e) => { e.preventDefault(); if (await act(edit ? api(`/admin/classes/${edit}`, { method: 'PUT', body: f }) : api('/admin/classes', { body: f }))) { setF(blank); setEdit(null); } }}>
          <div className="grid sm:grid-cols-3 gap-3">
            <Field label="수업 이름"><input className={inputCls} value={f.name} onChange={set('name')} placeholder="예: 2027 입시 A반" required /></Field>
            <Field label="과정"><input className={inputCls} value={f.program} onChange={set('program')} placeholder="입시반 · 재수반 · 성인" /></Field>
            <Field label="담당 강사"><select className={inputCls} value={f.coachId || ''} onChange={set('coachId')}><option value="">미정</option>{coaches.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
            <Field label="시간"><input className={inputCls} value={f.schedule} onChange={set('schedule')} placeholder="예: 화·목 19:00–22:00" /></Field>
            <Field label="시작일"><input type="date" className={inputCls} value={f.startDate} onChange={set('startDate')} /></Field>
            <Field label="종료일"><input type="date" className={inputCls} value={f.endDate} onChange={set('endDate')} /></Field>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {edit && <select className={inputCls + ' max-w-[140px]'} value={f.status} onChange={set('status')}><option value="active">진행 중</option><option value="ended">종료</option></select>}
            <Btn type="submit" kind="primary">{edit ? '저장' : '만들기'}</Btn>{edit && <Btn onClick={() => { setEdit(null); setF(blank); }}>취소</Btn>}
          </div>
        </form>
      </Card>
      {classes.map((c) => (
        <Card key={c.id} title={<>{c.name}{c.status === 'ended' && <Badge tone="gray">종료</Badge>}</>} sub={[c.program, c.schedule, c.coachName ? `강사 ${c.coachName}` : '강사 미정'].filter(Boolean).join(' · ')}>
          {enroll?.id === c.id ? (
            <div className="grid gap-3">
              <p className="text-sm text-[#35526B]">이 수업 학생을 골라 주세요 ({enroll.ids.length}명)</p>
              <div className="flex flex-wrap gap-2">{students.map((s) => { const on = enroll.ids.includes(s.id); return <button key={s.id} onClick={() => setEnroll({ ...enroll, ids: on ? enroll.ids.filter((x) => x !== s.id) : [...enroll.ids, s.id] })} className={`min-h-[34px] px-3 rounded-full text-[13px] ${on ? 'bg-[#153956] text-[#F3F0EA]' : 'border border-[#153956]/20 text-[#35526B]'}`}>{s.name}</button>; })}{!students.length && <Empty>학생 계정을 먼저 만들어 주세요.</Empty>}</div>
              <div className="flex gap-2"><Btn kind="primary" onClick={async () => { if (await act(api(`/admin/classes/${c.id}/students`, { method: 'PUT', body: { studentIds: enroll.ids } }))) setEnroll(null); }}>저장</Btn><Btn onClick={() => setEnroll(null)}>취소</Btn></div>
            </div>
          ) : (
            <div className="grid gap-3">
              <p className="keep-ko text-sm text-[#35526B]">학생 {c.students.length}명{c.students.length ? `: ${c.students.map((s: any) => s.name).join(', ')}` : ''}</p>
              <div className="flex flex-wrap gap-2">
                <Btn onClick={() => setEnroll({ id: c.id, ids: c.students.map((s: any) => s.id) })}>학생 배정</Btn>
                <Btn onClick={() => { setEdit(c.id); setF({ ...blank, ...c, coachId: c.coachId || '' }); window.scrollTo(0, 0); }}>고치기</Btn>
                <Link to={`/coach/class/${c.id}`}><Btn>수업 열기</Btn></Link>
              </div>
            </div>
          )}
        </Card>
      ))}
      {!classes.length && <Empty>아직 수업이 없어요.</Empty>}
    </div>
  );
}

function AdminNotice() {
  const [title, setTitle] = useState(''); const [body, setBody] = useState(''); const [pinned, setPinned] = useState(false); const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  return (
    <Card title="전체 공지 올리기" sub="모든 학생·강사 화면에 보여요">
      <div className="grid gap-3">
        <ErrorBox msg={err} />{msg && <div className="rounded-xl bg-[#E1F0E6] text-[#2F7A4F] text-sm px-4 py-3">{msg}</div>}
        <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목" />
        <textarea className={inputCls + ' min-h-[100px]'} value={body} onChange={(e) => setBody(e.target.value)} placeholder="내용" />
        <label className="flex items-center gap-2 text-sm text-[#35526B]"><input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />맨 위에 고정</label>
        <div><Btn kind="primary" disabled={!title.trim()} onClick={() => api('/notices', { body: { title, body, pinned } }).then(() => { setMsg('올렸어요.'); setTitle(''); setBody(''); setPinned(false); }).catch((e) => setErr(e.message))}>올리기</Btn></div>
      </div>
    </Card>
  );
}

function AdminHome() {
  const [tab, setTab] = useState<'users' | 'classes' | 'notice'>('users');
  return (
    <Page eyebrow="ADMIN" title="관리자" desc="계정과 수업을 만들고, 학생을 수업에 배정해요. 수업 기록은 강사 화면에서 해요." actions={<><Link to="/coach"><Btn>강사 화면</Btn></Link><Link to="/admin/password"><Btn>비밀번호 바꾸기</Btn></Link><Logout /></>}>
      <div className="flex gap-2 overflow-x-auto mb-6">
        {([['users', '계정'], ['classes', '수업'], ['notice', '전체 공지']] as const).map(([k, v]) => <button key={k} onClick={() => setTab(k)} className={`shrink-0 min-h-[38px] px-4 rounded-full text-sm font-semibold ${tab === k ? 'bg-[#153956] text-[#F3F0EA]' : 'border border-[#153956]/20 text-[#153956]'}`}>{v}</button>)}
      </div>
      {tab === 'users' && <AdminUsers />}{tab === 'classes' && <AdminClasses />}{tab === 'notice' && <AdminNotice />}
    </Page>
  );
}

/* ── 라우트 묶음 (App.tsx에서 /my/*, /coach/*, /admin/* 에 연결) ── */
export const MyRoutes = () => (
  <Guard roles={['student']}><Routes>
    <Route index element={<MyHome />} /><Route path="class/:id" element={<ClassPage />} /><Route path="assignment/:id" element={<AssignmentPage />} /><Route path="password" element={<PasswordPage back="/my" />} />
    <Route path="*" element={<Navigate to="/my" replace />} />
  </Routes></Guard>
);
export const CoachRoutes = () => (
  <Guard roles={['coach', 'admin']}><Routes>
    <Route index element={<CoachHome />} /><Route path="class/:id" element={<ClassPage />} /><Route path="assignment/:id" element={<AssignmentPage />} /><Route path="password" element={<PasswordPage back="/coach" />} />
    <Route path="*" element={<Navigate to="/coach" replace />} />
  </Routes></Guard>
);
export const AdminRoutes = () => (
  <Guard roles={['admin']}><Routes>
    <Route index element={<AdminHome />} /><Route path="password" element={<PasswordPage back="/admin" />} />
    <Route path="*" element={<Navigate to="/admin" replace />} />
  </Routes></Guard>
);
