/** 수업 상세(학생·강사 공용) · 과제 상세(제출·채점) */
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, Paperclip } from 'lucide-react';
import { api, ATT_LABEL, fmtDate, openFile, uploadFile } from './api';
import { Badge, Btn, Card, Empty, ErrorBox, Field, inputCls, Page } from './ui';

type Detail = any;
const base = (as: string) => (as === 'student' ? '/my' : '/coach');

function useLoad<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null); const [err, setErr] = useState('');
  const reload = useCallback(() => { fn().then(setData).catch((e) => setErr(e.message)); }, deps); // eslint-disable-line
  useEffect(reload, [reload]);
  return { data, err, reload, setErr };
}
const Back = ({ to, children }: { to: string; children: ReactNode }) => (
  <Link to={to} className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#153956] hover:text-[#2D5E88]"><ArrowLeft className="w-4 h-4" aria-hidden="true" />{children}</Link>
);

export function ClassPage() {
  const { id = '' } = useParams();
  const { data: d, err, reload, setErr } = useLoad<Detail>(() => api(`/classes/${id}`), [id]);
  const [tab, setTab] = useState<'lessons' | 'assignments' | 'notices' | 'students'>('lessons');
  if (err) return <Page title="수업"><ErrorBox msg={err} /></Page>;
  if (!d) return <Page title="불러오는 중…"><span /></Page>;
  const staff = d.as !== 'student';
  const tabs = [['lessons', '회차·출결'], ['assignments', '과제'], ['notices', '공지'], ...(staff ? [['students', '학생·피드백']] : [['students', '받은 피드백']])] as [typeof tab, string][];
  const run = async (p: Promise<unknown>) => { try { await p; reload(); } catch (e: any) { setErr(e.message); } };
  return (
    <section className="max-w-[1140px] mx-auto px-5 sm:px-8 py-10 sm:py-14 min-h-[60vh]">
      <Back to={base(d.as)}>{staff ? '강사 콘솔' : '마이페이지'}</Back>
      <p className="text-xs font-semibold tracking-[0.16em] text-[#2D5E88] uppercase mb-2">{d.class.program || 'CLASS'}</p>
      <h1 className="keep-ko text-2xl sm:text-[34px] font-bold text-[#132B3F]">{d.class.name}</h1>
      <p className="keep-ko mt-2 text-[15px] text-[#35526B]">{[d.class.schedule, d.class.coachName && `강사 ${d.class.coachName}`, `학생 ${d.studentCount}명`].filter(Boolean).join(' · ')}</p>
      <div className="flex gap-2 overflow-x-auto mt-6 mb-6">
        {tabs.map(([k, label]) => <button key={k} onClick={() => setTab(k)} className={`shrink-0 min-h-[38px] px-4 rounded-full text-sm font-semibold ${tab === k ? 'bg-[#153956] text-[#F3F0EA]' : 'border border-[#153956]/20 text-[#153956]'}`}>{label}</button>)}
      </div>
      {tab === 'lessons' && <Lessons d={d} staff={staff} run={run} />}
      {tab === 'assignments' && <Assignments d={d} staff={staff} run={run} />}
      {tab === 'notices' && <Notices d={d} staff={staff} run={run} />}
      {tab === 'students' && <Students d={d} staff={staff} run={run} />}
    </section>
  );
}

function Lessons({ d, staff, run }: { d: Detail; staff: boolean; run: (p: Promise<unknown>) => void }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10)); const [topic, setTopic] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="grid gap-4">
      {staff && (
        <Card title="회차 추가">
          <div className="grid sm:grid-cols-[160px_1fr_auto] gap-3 items-end">
            <Field label="날짜"><input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
            <Field label="주제"><input className={inputCls} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="예: 장면 목표 찾기" /></Field>
            <Btn kind="primary" onClick={() => { run(api(`/classes/${d.class.id}/lessons`, { body: { date, topic } })); setTopic(''); }}>추가</Btn>
          </div>
        </Card>
      )}
      {!d.lessons.length && <Empty>아직 회차가 없어요.</Empty>}
      {[...d.lessons].reverse().map((l: any) => (
        <Card key={l.id} title={<>{l.num}회차 <span className="text-[#5B7285] font-medium">{fmtDate(l.date)}</span></>} sub={l.topic}>
          {staff ? (
            open === l.id ? <LessonEditor d={d} l={l} run={run} close={() => setOpen(null)} />
              : <div className="flex flex-wrap items-center gap-2 text-sm text-[#35526B]">
                  {Object.entries(l.attendance.reduce((a: any, x: any) => ({ ...a, [x.status]: (a[x.status] || 0) + 1 }), {})).map(([k, n]) => <Badge key={k} tone={k === 'present' ? 'ok' : k === 'absent' ? 'warn' : 'gray'}>{ATT_LABEL[k]} {String(n)}</Badge>)}
                  {!l.attendance.length && <span className="text-[#5B7285]">출결 미기록</span>}
                  <span className="flex-1" /><Btn onClick={() => setOpen(l.id)}>출결·기록</Btn>
                </div>
          ) : (
            <div className="grid gap-2 text-[15px] text-[#35526B] keep-ko">
              <div>내 출결: {l.attendance[0] ? <Badge tone={l.attendance[0].status === 'present' ? 'ok' : 'warn'}>{ATT_LABEL[l.attendance[0].status]}</Badge> : <span className="text-[#5B7285]">기록 전</span>}</div>
              {l.log && <p className="whitespace-pre-wrap">{l.log}</p>}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
function LessonEditor({ d, l, run, close }: { d: Detail; l: any; run: (p: Promise<unknown>) => void; close: () => void }) {
  const init = Object.fromEntries(d.students.map((s: any) => [s.id, l.attendance.find((a: any) => a.student_id === s.id)?.status || 'present']));
  const [att, setAtt] = useState<Record<string, string>>(init);
  const [topic, setTopic] = useState(l.topic || ''); const [log, setLog] = useState(l.log || ''); const [pub, setPub] = useState('');
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        {d.students.map((s: any) => (
          <div key={s.id} className="flex flex-wrap items-center gap-2">
            <span className="w-20 font-semibold text-[#132B3F]">{s.name}</span>
            {Object.entries(ATT_LABEL).map(([k, v]) => <button key={k} onClick={() => setAtt({ ...att, [s.id]: k })} className={`min-h-[34px] px-3 rounded-full text-[13px] ${att[s.id] === k ? 'bg-[#153956] text-[#F3F0EA]' : 'border border-[#153956]/20 text-[#35526B]'}`}>{v}</button>)}
          </div>
        ))}
        {!d.students.length && <Empty>이 수업에 배정된 학생이 없어요. 관리자 화면에서 배정하세요.</Empty>}
      </div>
      <Field label="주제"><input className={inputCls} value={topic} onChange={(e) => setTopic(e.target.value)} /></Field>
      <Field label="수업 기록 (강사만 봄)"><textarea className={inputCls + ' min-h-[90px]'} value={log} onChange={(e) => setLog(e.target.value)} /></Field>
      <Field label="학생에게 보일 안내 (선택)" hint="예: 다음 시간까지 독백 2개 골라 오기"><textarea className={inputCls + ' min-h-[60px]'} value={pub} onChange={(e) => setPub(e.target.value)} /></Field>
      <div className="flex flex-wrap gap-2">
        <Btn kind="primary" onClick={() => { run(Promise.all([api(`/lessons/${l.id}/attendance`, { method: 'PUT', body: { records: Object.entries(att).map(([studentId, status]) => ({ studentId, status })) } }), api(`/lessons/${l.id}`, { method: 'PUT', body: { topic, log, ...(pub ? { publicNote: pub } : {}) } })])); close(); }}>저장</Btn>
        <Btn onClick={close}>닫기</Btn><span className="flex-1" />
        <Btn kind="danger" onClick={() => { if (confirm('이 회차를 지울까요? 출결 기록도 지워져요.')) { run(api(`/lessons/${l.id}`, { method: 'DELETE' })); close(); } }}>회차 삭제</Btn>
      </div>
    </div>
  );
}

function Assignments({ d, staff, run }: { d: Detail; staff: boolean; run: (p: Promise<unknown>) => void }) {
  const [title, setTitle] = useState(''); const [desc, setDesc] = useState(''); const [due, setDue] = useState('');
  return (
    <div className="grid gap-4">
      {staff && (
        <Card title="과제 내기">
          <div className="grid gap-3">
            <Field label="제목"><input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 독백 2개 골라 오기" /></Field>
            <Field label="설명"><textarea className={inputCls + ' min-h-[70px]'} value={desc} onChange={(e) => setDesc(e.target.value)} /></Field>
            <div className="flex flex-wrap items-end gap-3"><Field label="마감일"><input type="date" className={inputCls} value={due} onChange={(e) => setDue(e.target.value)} /></Field>
              <Btn kind="primary" disabled={!title.trim()} onClick={() => { run(api(`/classes/${d.class.id}/assignments`, { body: { title, description: desc, dueDate: due } })); setTitle(''); setDesc(''); setDue(''); }}>과제 내기</Btn></div>
          </div>
        </Card>
      )}
      {!d.assignments.length && <Empty>아직 과제가 없어요.</Empty>}
      {d.assignments.map((a: any) => (
        <Link key={a.id} to={`${base(d.as)}/assignment/${a.id}`} className="block rounded-2xl border border-[#153956]/15 bg-[#FAF8F4] p-5 hover:border-[#2D5E88]">
          <div className="flex flex-wrap items-center gap-2"><b className="text-[#132B3F]">{a.title}</b>
            {a.dueDate && <span className="text-sm text-[#5B7285]">마감 {fmtDate(a.dueDate)}</span>}<span className="flex-1" />
            {staff ? <Badge>제출 {a.submitted}/{d.studentCount}</Badge> : a.mine ? <Badge tone="ok">제출함</Badge> : <Badge tone="warn">미제출</Badge>}</div>
          {a.description && <p className="keep-ko mt-2 text-sm text-[#35526B] line-clamp-2">{a.description}</p>}
        </Link>
      ))}
    </div>
  );
}

function Notices({ d, staff, run }: { d: Detail; staff: boolean; run: (p: Promise<unknown>) => void }) {
  const [title, setTitle] = useState(''); const [body, setBody] = useState('');
  return (
    <div className="grid gap-4">
      {staff && (
        <Card title="수업 공지 쓰기"><div className="grid gap-3">
          <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목" />
          <textarea className={inputCls + ' min-h-[70px]'} value={body} onChange={(e) => setBody(e.target.value)} placeholder="내용" />
          <div><Btn kind="primary" disabled={!title.trim()} onClick={() => { run(api(`/classes/${d.class.id}/notices`, { body: { title, body } })); setTitle(''); setBody(''); }}>올리기</Btn></div>
        </div></Card>
      )}
      {!d.notices.length && <Empty>공지가 없어요.</Empty>}
      {d.notices.map((n: any) => (
        <Card key={n.id} title={n.title} sub={`${fmtDate(n.createdAt)} · ${n.author}`}>
          <p className="keep-ko whitespace-pre-wrap text-[15px] text-[#35526B]">{n.body}</p>
          {staff && <div className="mt-3"><Btn kind="danger" onClick={() => confirm('공지를 지울까요?') && run(api(`/notices/${n.id}`, { method: 'DELETE' }))}>삭제</Btn></div>}
        </Card>
      ))}
    </div>
  );
}

function FeedbackList({ items }: { items: any[] }) {
  if (!items.length) return <Empty>아직 피드백이 없어요.</Empty>;
  return <div className="grid gap-3">{items.map((f) => (
    <div key={f.id} className="rounded-xl bg-white border border-[#153956]/10 p-4">
      <div className="text-xs text-[#5B7285] mb-1">{fmtDate(f.createdAt)} · {f.coach}{f.studentName ? ` → ${f.studentName}` : ''}{f.rating ? ` · ${'★'.repeat(f.rating)}` : ''}</div>
      <p className="keep-ko whitespace-pre-wrap text-[15px] text-[#132B3F]">{f.body}</p>
      {f.nextFocus && <p className="keep-ko mt-2 text-sm text-[#2D5E88]">다음 연습: {f.nextFocus}</p>}
    </div>))}</div>;
}
function FeedbackForm({ classId, studentId, assignmentId, run }: { classId: string; studentId: string; assignmentId?: string; run: (p: Promise<unknown>) => void }) {
  const [body, setBody] = useState(''); const [next, setNext] = useState(''); const [rating, setRating] = useState('');
  return (
    <div className="grid gap-2">
      <textarea className={inputCls + ' min-h-[70px]'} value={body} onChange={(e) => setBody(e.target.value)} placeholder="피드백 (학생에게 보여요)" />
      <div className="grid sm:grid-cols-[1fr_120px_auto] gap-2">
        <input className={inputCls} value={next} onChange={(e) => setNext(e.target.value)} placeholder="다음 연습에서 해볼 것 한 가지" />
        <select className={inputCls} value={rating} onChange={(e) => setRating(e.target.value)}><option value="">평점 없음</option>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{'★'.repeat(n)}</option>)}</select>
        <Btn kind="primary" disabled={!body.trim()} onClick={() => { run(api('/feedback', { body: { classId, studentId, assignmentId, body, nextFocus: next, rating } })); setBody(''); setNext(''); setRating(''); }}>남기기</Btn>
      </div>
    </div>
  );
}
function Students({ d, staff, run }: { d: Detail; staff: boolean; run: (p: Promise<unknown>) => void }) {
  const [sel, setSel] = useState<string | null>(null);
  if (!staff) return <FeedbackList items={d.feedback} />;
  return (
    <div className="grid gap-4">
      {d.students.map((s: any) => {
        const fb = d.feedback.filter((f: any) => f.studentId === s.id);
        const att = d.lessons.map((l: any) => l.attendance.find((a: any) => a.student_id === s.id)?.status).filter(Boolean);
        return (
          <Card key={s.id} title={s.name} sub={`출석 ${att.filter((x: string) => x === 'present').length}/${att.length} · 피드백 ${fb.length}`}>
            {sel === s.id ? <div className="grid gap-4"><FeedbackForm classId={d.class.id} studentId={s.id} run={run} /><FeedbackList items={fb} /><div><Btn onClick={() => setSel(null)}>닫기</Btn></div></div>
              : <Btn onClick={() => setSel(s.id)}>피드백 쓰기·보기</Btn>}
          </Card>
        );
      })}
      {!d.students.length && <Empty>배정된 학생이 없어요.</Empty>}
    </div>
  );
}

export function AssignmentPage() {
  const { id = '' } = useParams();
  const { data: d, err, reload, setErr } = useLoad<any>(() => api(`/assignments/${id}`), [id]);
  const [text, setText] = useState(''); const [files, setFiles] = useState<{ id: string; name: string }[]>([]); const [busy, setBusy] = useState(false);
  useEffect(() => { if (d?.as === 'student' && d.submissions[0]) { setText(d.submissions[0].text || ''); setFiles(d.submissions[0].files); } }, [d]);
  const run = async (p: Promise<unknown>) => { try { await p; reload(); } catch (e: any) { setErr(e.message); } };
  if (err && !d) return <Page title="과제"><ErrorBox msg={err} /></Page>;
  if (!d) return <Page title="불러오는 중…"><span /></Page>;
  const a = d.assignment; const staff = d.as !== 'student';
  return (
    <section className="max-w-[900px] mx-auto px-5 sm:px-8 py-10 sm:py-14 min-h-[60vh]">
      <Back to={`${staff ? '/coach' : '/my'}/class/${a.classId}`}>{a.className}</Back>
      <h1 className="keep-ko text-2xl sm:text-[30px] font-bold text-[#132B3F]">{a.title}</h1>
      {a.dueDate && <p className="mt-1 text-sm text-[#5B7285]">마감 {fmtDate(a.dueDate)}</p>}
      {a.description && <p className="keep-ko mt-4 whitespace-pre-wrap text-[15px] text-[#35526B]">{a.description}</p>}
      <div className="mt-8 grid gap-4">
        <ErrorBox msg={err} />
        {!staff ? (
          <>
            <Card title="내 제출" sub={d.submissions[0] ? `${fmtDate(d.submissions[0].submittedAt)} 제출함 · 다시 내면 바뀌어요` : '아직 안 냈어요'}>
              <div className="grid gap-3">
                <textarea className={inputCls + ' min-h-[140px]'} value={text} onChange={(e) => setText(e.target.value)} placeholder="고른 작품, 이유, 연습하며 느낀 점…" />
                <div className="flex flex-wrap items-center gap-2">
                  {files.map((f) => <span key={f.id} className="inline-flex items-center gap-1 text-sm bg-white border border-[#153956]/15 rounded-full px-3 py-1"><Paperclip className="w-3.5 h-3.5" />{f.name}<button className="ml-1 text-[#B23A32]" onClick={() => setFiles(files.filter((x) => x.id !== f.id))}>×</button></span>)}
                  <label className="inline-flex items-center gap-1.5 min-h-[36px] px-4 rounded-full border border-[#153956]/25 text-sm font-semibold text-[#153956] cursor-pointer">
                    <Paperclip className="w-4 h-4" />파일 (영상·사진·음성·PDF, 25MB)
                    <input type="file" hidden accept="image/*,video/*,audio/*,application/pdf" onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ''; if (!f) return; setBusy(true); try { const r = await uploadFile(f); setFiles([...files, r]); } catch (er: any) { setErr(er.message); } setBusy(false); }} />
                  </label>
                </div>
                <div><Btn kind="primary" disabled={busy} onClick={() => run(api(`/assignments/${id}/submit`, { body: { text, files: files.map((f) => f.id) } }))}>{busy ? '올리는 중…' : '제출하기'}</Btn></div>
              </div>
            </Card>
            <Card title="받은 피드백"><FeedbackList items={d.feedback} /></Card>
          </>
        ) : (
          <>
            <p className="text-sm text-[#5B7285]">제출 {d.submissions.length}/{d.students.length} · 안 낸 학생: {d.students.filter((s: any) => !d.submissions.some((x: any) => x.studentId === s.id)).map((s: any) => s.name).join(', ') || '없음'}</p>
            {d.submissions.map((s: any) => (
              <Card key={s.id} title={s.studentName} sub={fmtDate(s.submittedAt)}>
                {s.text && <p className="keep-ko whitespace-pre-wrap text-[15px] text-[#132B3F] mb-3">{s.text}</p>}
                <div className="flex flex-wrap gap-2 mb-4">{s.files.map((f: any) => <button key={f.id} onClick={() => openFile(f.id).catch((e) => setErr(e.message))} className="inline-flex items-center gap-1 text-sm bg-white border border-[#153956]/15 rounded-full px-3 py-1 hover:border-[#2D5E88]"><Paperclip className="w-3.5 h-3.5" />{f.name}</button>)}</div>
                <FeedbackForm classId={a.classId} studentId={s.studentId} assignmentId={a.id} run={run} />
                <div className="mt-3"><FeedbackList items={d.feedback.filter((f: any) => f.studentId === s.studentId)} /></div>
              </Card>
            ))}
            <div><Btn kind="danger" onClick={() => { if (confirm('과제를 지울까요? 제출물도 지워져요.')) api(`/assignments/${id}`, { method: 'DELETE' }).then(() => history.back()).catch((e) => setErr(e.message)); }}>과제 삭제</Btn></div>
          </>
        )}
      </div>
    </section>
  );
}
