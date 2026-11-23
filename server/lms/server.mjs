#!/usr/bin/env node
/**
 * 아터스 로그인·수업관리(LMS) 서버 — 외부 서비스 없이 Node.js 기본 기능만 사용
 *
 *   npm run lms                 → http://localhost:8787
 *   npm run lms:admin -- …      → 관리자 계정 만들기 등 (cli.mjs)
 *
 * 데이터: LMS_DATA 폴더(기본 server/data) 안의 lms.db(SQLite) + files/(첨부 파일). git에 올라가지 않음.
 * 환경 변수: PORT(8787), LMS_DATA, LMS_ORIGINS(허용할 사이트 주소, 쉼표로), LMS_SITE(초대 링크에 쓸 사이트 주소)
 *
 * 역할: admin(학원) · coach(강사) · student(학생)
 * - 계정은 학원이 만들고, 초대 코드로 본인이 비밀번호를 정한다(미성년자 공개 가입 없음).
 * - 비밀번호는 scrypt 로 저장, 로그인 토큰은 해시만 저장, 로그인 실패 5번이면 15분 잠금.
 */
import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDb, uid, now } from './db.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(process.env.LMS_DATA || path.join(here, '..', 'data'));
const FILES = path.join(DATA, 'files');
fs.mkdirSync(FILES, { recursive: true });
const db = openDb(path.join(DATA, 'lms.db'));
const PORT = Number(process.env.PORT || 8787);
const ORIGINS = (process.env.LMS_ORIGINS || 'http://localhost:5173,https://new.c-art.co.kr,https://www.c-art.co.kr,https://c-art.co.kr').split(',').map((s) => s.trim()).filter(Boolean);
const SITE = process.env.LMS_SITE || 'https://www.c-art.co.kr';
const TOKEN_DAYS = 30;
const MAX_FILE = 25 * 1024 * 1024;

/* ── 공통 ── */
class HttpError extends Error { constructor(code, msg) { super(msg); this.code = code; } }
const bad = (msg) => new HttpError(400, msg);
const deny = () => new HttpError(403, '권한이 없습니다.');
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  return `scrypt$${salt}$${crypto.scryptSync(pw, salt, 64).toString('hex')}`;
}
function checkPassword(pw, stored) {
  const [, salt, hash] = String(stored || '').split('$');
  if (!salt || !hash) return false;
  const a = crypto.scryptSync(pw, salt, 64), b = Buffer.from(hash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function validPassword(pw) {
  if (typeof pw !== 'string' || pw.length < 8) throw bad('비밀번호는 8자 이상으로 정해 주세요.');
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) throw bad('비밀번호에 영문과 숫자를 함께 넣어 주세요.');
}
const publicUser = (u) => u && ({ id: u.id, username: u.username, name: u.name, role: u.role, phone: u.phone || '', active: !!u.active, invited: !u.password_hash, lastLogin: u.last_login || null, createdAt: u.created_at });
const readJson = (req, limit = 1024 * 1024) => new Promise((resolve, reject) => {
  let n = 0; const chunks = [];
  req.on('data', (c) => { n += c.length; if (n > limit) { reject(new HttpError(413, '요청이 너무 큽니다.')); req.destroy(); } else chunks.push(c); });
  req.on('end', () => { try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); } catch { reject(bad('잘못된 요청입니다.')); } });
  req.on('error', reject);
});
const readRaw = (req, limit) => new Promise((resolve, reject) => {
  let n = 0; const chunks = [];
  req.on('data', (c) => { n += c.length; if (n > limit) { reject(new HttpError(413, '파일은 25MB까지 올릴 수 있어요.')); req.destroy(); } else chunks.push(c); });
  req.on('end', () => resolve(Buffer.concat(chunks)));
  req.on('error', reject);
});
const str = (v, max = 200) => String(v ?? '').trim().slice(0, max);
const audit = (userId, action, detail = '') => db.prepare('insert into audit(id,user_id,action,detail,at) values(?,?,?,?,?)').run(uid(), userId || '', action, String(detail).slice(0, 500), now());

/* ── 로그인 실패 잠금 (메모리) ── */
const fails = new Map();
function guardLogin(key) {
  const f = fails.get(key);
  if (f && f.count >= 5 && Date.now() - f.at < 15 * 60 * 1000) throw new HttpError(429, '로그인 실패가 많아 15분 동안 막혔어요. 잠시 뒤 다시 시도하거나 학원에 문의하세요.');
}
const failLogin = (key) => { const f = fails.get(key) || { count: 0, at: 0 }; f.count++; f.at = Date.now(); fails.set(key, f); };

/* ── 토큰 ── */
function issueToken(user, req) {
  const token = crypto.randomBytes(32).toString('base64url');
  db.prepare('insert into tokens(token_hash,user_id,created_at,expires_at,agent) values(?,?,?,?,?)')
    .run(sha(token), user.id, now(), new Date(Date.now() + TOKEN_DAYS * 864e5).toISOString(), str(req.headers['user-agent'], 200));
  db.prepare('update users set last_login=? where id=?').run(now(), user.id);
  return token;
}
function authUser(req) {
  const m = String(req.headers.authorization || '').match(/^Bearer\s+(.+)$/);
  if (!m) return null;
  const row = db.prepare('select u.* from tokens t join users u on u.id=t.user_id where t.token_hash=? and t.expires_at>? and u.active=1').get(sha(m[1]), now());
  return row || null;
}

/* ── 권한 도우미 ── */
const getClass = (id) => db.prepare('select * from classes where id=?').get(id);
function classAccess(user, classId) {
  const c = getClass(classId); if (!c) throw new HttpError(404, '수업이 없습니다.');
  if (user.role === 'admin') return { c, as: 'admin' };
  if (user.role === 'coach' && c.coach_id === user.id) return { c, as: 'coach' };
  if (user.role === 'student' && db.prepare("select 1 from enrollments where class_id=? and student_id=? and status='active'").get(classId, user.id)) return { c, as: 'student' };
  throw deny();
}
const staff = (a) => a.as === 'admin' || a.as === 'coach';
function lessonClass(id) { const l = db.prepare('select * from lessons where id=?').get(id); if (!l) throw new HttpError(404, '회차가 없습니다.'); return l; }
function assignmentRow(id) { const a = db.prepare('select * from assignments where id=?').get(id); if (!a) throw new HttpError(404, '과제가 없습니다.'); return a; }
const userName = (id) => db.prepare('select name from users where id=?').get(id)?.name || '';

function classDetail(user, classId) {
  const a = classAccess(user, classId); const c = a.c;
  const students = db.prepare("select u.id,u.name,u.username,u.phone from enrollments e join users u on u.id=e.student_id where e.class_id=? and e.status='active' order by u.name").all(classId);
  const lessons = db.prepare('select * from lessons where class_id=? order by num').all(classId).map((l) => {
    const att = db.prepare('select student_id,status,note from attendance where lesson_id=?').all(l.id);
    return { id: l.id, num: l.num, date: l.date, topic: l.topic, log: staff(a) ? l.log : (l.public_note || ''),
      attendance: staff(a) ? att : att.filter((x) => x.student_id === user.id) };
  });
  const assignments = db.prepare('select * from assignments where class_id=? order by due_date desc, created_at desc').all(classId).map((x) => {
    const subs = db.prepare('select student_id,submitted_at from submissions where assignment_id=?').all(x.id);
    return { id: x.id, title: x.title, description: x.description, dueDate: x.due_date, createdAt: x.created_at,
      submitted: staff(a) ? subs.length : undefined, mine: a.as === 'student' ? subs.find((s) => s.student_id === user.id) || null : undefined };
  });
  const notices = db.prepare('select * from notices where class_id=? order by pinned desc, created_at desc').all(classId)
    .map((n) => ({ id: n.id, title: n.title, body: n.body, pinned: !!n.pinned, createdAt: n.created_at, author: userName(n.created_by) }));
  const feedback = db.prepare(`select * from feedback where class_id=? ${a.as === 'student' ? 'and student_id=?' : ''} order by created_at desc limit 200`).all(...(a.as === 'student' ? [classId, user.id] : [classId]))
    .map((f) => ({ id: f.id, studentId: f.student_id, studentName: userName(f.student_id), lessonId: f.lesson_id, assignmentId: f.assignment_id, body: f.body, nextFocus: f.next_focus, rating: f.rating, coach: userName(f.coach_id), createdAt: f.created_at }));
  return { class: { id: c.id, name: c.name, program: c.program, schedule: c.schedule, startDate: c.start_date, endDate: c.end_date, status: c.status, description: c.description, coachId: c.coach_id, coachName: userName(c.coach_id) },
    as: a.as, students: staff(a) ? students : [], studentCount: students.length, lessons, assignments, notices, feedback };
}

/* ── 라우트 ── */
const routes = [];
const route = (method, pattern, roles, fn) => routes.push({ method, re: new RegExp('^' + pattern.replace(/:(\w+)/g, '(?<$1>[\\w-]+)') + '$'), roles, fn });

// 인증
route('POST', '/api/auth/login', null, async (req) => {
  const b = await readJson(req); const username = str(b.username, 60).toLowerCase(); const ip = req.socket.remoteAddress || '';
  const key = `${ip}|${username}`; guardLogin(key);
  const u = db.prepare('select * from users where username=?').get(username);
  if (!u || !u.active || !u.password_hash || !checkPassword(String(b.password || ''), u.password_hash)) { failLogin(key); throw new HttpError(401, '아이디 또는 비밀번호가 맞지 않아요.'); }
  fails.delete(key); audit(u.id, 'login');
  return { token: issueToken(u, req), user: publicUser(u) };
});
route('POST', '/api/auth/logout', ['admin', 'coach', 'student'], async (req) => {
  const m = String(req.headers.authorization).match(/^Bearer\s+(.+)$/); db.prepare('delete from tokens where token_hash=?').run(sha(m[1])); return { ok: true };
});
route('GET', '/api/auth/me', ['admin', 'coach', 'student'], async (req, p, user) => ({ user: publicUser(user) }));
route('GET', '/api/auth/invite/:code', null, async (req, p) => {
  const u = db.prepare('select * from users where invite_code=? and invite_expires>? and active=1').get(p.code, now());
  if (!u) throw new HttpError(404, '초대 코드가 없거나 기간이 지났어요. 학원에 새 초대 코드를 요청하세요.');
  return { name: u.name, username: u.username, role: u.role };
});
route('POST', '/api/auth/invite/accept', null, async (req) => {
  const b = await readJson(req); validPassword(b.password);
  const u = db.prepare('select * from users where invite_code=? and invite_expires>? and active=1').get(str(b.code, 40), now());
  if (!u) throw new HttpError(404, '초대 코드가 없거나 기간이 지났어요.');
  db.prepare('update users set password_hash=?, invite_code=null, invite_expires=null where id=?').run(hashPassword(b.password), u.id);
  audit(u.id, 'invite_accept');
  return { token: issueToken(u, req), user: publicUser({ ...u, password_hash: 'x' }) };
});
route('POST', '/api/auth/password', ['admin', 'coach', 'student'], async (req, p, user) => {
  const b = await readJson(req);
  if (!checkPassword(String(b.current || ''), user.password_hash)) throw bad('지금 비밀번호가 맞지 않아요.');
  validPassword(b.next);
  db.prepare('update users set password_hash=? where id=?').run(hashPassword(b.next), user.id);
  db.prepare('delete from tokens where user_id=?').run(user.id); audit(user.id, 'password_change');
  return { token: issueToken(user, req) };
});

// 관리자: 계정
function newInvite(userId) {
  const code = crypto.randomBytes(6).toString('base64url').replace(/[-_]/g, 'x');
  db.prepare('update users set invite_code=?, invite_expires=? where id=?').run(code, new Date(Date.now() + 14 * 864e5).toISOString(), userId);
  return { code, link: `${SITE}/#/login?invite=${code}`, expiresInDays: 14 };
}
route('GET', '/api/admin/users', ['admin'], async () => db.prepare('select * from users order by role, name').all().map(publicUser));
route('POST', '/api/admin/users', ['admin'], async (req, p, me) => {
  const b = await readJson(req);
  const role = ['admin', 'coach', 'student'].includes(b.role) ? b.role : 'student';
  const username = str(b.username, 40).toLowerCase();
  if (!/^[a-z0-9._-]{3,40}$/.test(username)) throw bad('아이디는 영문 소문자·숫자·.-_ 3자 이상으로 정해 주세요.');
  if (db.prepare('select 1 from users where username=?').get(username)) throw bad('이미 있는 아이디예요.');
  const name = str(b.name, 40); if (!name) throw bad('이름을 넣어 주세요.');
  const id = uid();
  db.prepare('insert into users(id,username,name,role,phone,active,created_at) values(?,?,?,?,?,1,?)').run(id, username, name, role, str(b.phone, 20), now());
  audit(me.id, 'user_create', `${username} ${role}`);
  return { user: publicUser(db.prepare('select * from users where id=?').get(id)), invite: newInvite(id) };
});
route('PUT', '/api/admin/users/:id', ['admin'], async (req, p, me) => {
  const b = await readJson(req); const u = db.prepare('select * from users where id=?').get(p.id); if (!u) throw new HttpError(404, '계정이 없습니다.');
  if (u.id === me.id && (b.active === false || (b.role && b.role !== 'admin'))) throw bad('내 계정의 관리자 권한은 끌 수 없어요.');
  db.prepare('update users set name=?, role=?, phone=?, active=? where id=?').run(str(b.name ?? u.name, 40), ['admin', 'coach', 'student'].includes(b.role) ? b.role : u.role, str(b.phone ?? u.phone, 20), b.active === undefined ? u.active : (b.active ? 1 : 0), u.id);
  if (b.active === false) db.prepare('delete from tokens where user_id=?').run(u.id);
  audit(me.id, 'user_update', u.username);
  return publicUser(db.prepare('select * from users where id=?').get(u.id));
});
route('POST', '/api/admin/users/:id/invite', ['admin'], async (req, p, me) => {
  const u = db.prepare('select * from users where id=?').get(p.id); if (!u) throw new HttpError(404, '계정이 없습니다.');
  db.prepare('update users set password_hash=null where id=?').run(u.id); db.prepare('delete from tokens where user_id=?').run(u.id);
  audit(me.id, 'user_reinvite', u.username);
  return newInvite(u.id);
});
// 관리자: 수업
route('GET', '/api/admin/classes', ['admin'], async () => db.prepare('select * from classes order by status, name').all().map((c) => ({
  id: c.id, name: c.name, program: c.program, schedule: c.schedule, startDate: c.start_date, endDate: c.end_date, status: c.status, coachId: c.coach_id, coachName: userName(c.coach_id),
  students: db.prepare("select u.id,u.name from enrollments e join users u on u.id=e.student_id where e.class_id=? and e.status='active' order by u.name").all(c.id) })));
async function saveClass(req, id, me) {
  const b = await readJson(req); const name = str(b.name, 60); if (!name) throw bad('수업 이름을 넣어 주세요.');
  if (b.coachId && !db.prepare("select 1 from users where id=? and role in ('coach','admin')").get(b.coachId)) throw bad('강사를 찾지 못했어요.');
  const vals = [name, str(b.program, 40), b.coachId || null, str(b.schedule, 60), str(b.startDate, 10), str(b.endDate, 10), ['active', 'ended'].includes(b.status) ? b.status : 'active', str(b.description, 2000)];
  if (id) db.prepare('update classes set name=?,program=?,coach_id=?,schedule=?,start_date=?,end_date=?,status=?,description=? where id=?').run(...vals, id);
  else { id = uid(); db.prepare('insert into classes(name,program,coach_id,schedule,start_date,end_date,status,description,id,created_at) values(?,?,?,?,?,?,?,?,?,?)').run(...vals, id, now()); }
  audit(me.id, 'class_save', name); return { id };
}
route('POST', '/api/admin/classes', ['admin'], async (req, p, me) => saveClass(req, null, me));
route('PUT', '/api/admin/classes/:id', ['admin'], async (req, p, me) => { if (!getClass(p.id)) throw new HttpError(404, '수업이 없습니다.'); return saveClass(req, p.id, me); });
route('PUT', '/api/admin/classes/:id/students', ['admin'], async (req, p, me) => {
  const b = await readJson(req); if (!getClass(p.id)) throw new HttpError(404, '수업이 없습니다.');
  const ids = (Array.isArray(b.studentIds) ? b.studentIds : []).filter((x) => db.prepare("select 1 from users where id=? and role='student'").get(x));
  db.prepare("update enrollments set status='left' where class_id=?").run(p.id);
  for (const sid of ids) db.prepare("insert into enrollments(class_id,student_id,status,created_at) values(?,?,'active',?) on conflict(class_id,student_id) do update set status='active'").run(p.id, sid, now());
  audit(me.id, 'enroll', `${p.id} ${ids.length}`); return { ok: true, count: ids.length };
});
route('POST', '/api/notices', ['admin'], async (req, p, me) => {
  const b = await readJson(req); const id = uid();
  db.prepare('insert into notices(id,class_id,title,body,pinned,created_by,created_at) values(?,?,?,?,?,?,?)').run(id, null, str(b.title, 100), str(b.body, 5000), b.pinned ? 1 : 0, me.id, now());
  return { id };
});

// 공통: 내 화면
route('GET', '/api/me/overview', ['admin', 'coach', 'student'], async (req, p, user) => {
  const classes = user.role === 'admin' ? db.prepare("select * from classes where status='active' order by name").all()
    : user.role === 'coach' ? db.prepare("select * from classes where coach_id=? and status='active' order by name").all(user.id)
    : db.prepare("select c.* from enrollments e join classes c on c.id=e.class_id where e.student_id=? and e.status='active' order by c.name").all(user.id);
  const ids = classes.map((c) => c.id); const ph = ids.map(() => '?').join(',') || "''";
  const today = now().slice(0, 10);
  const upcoming = ids.length ? db.prepare(`select l.*, c.name class_name from lessons l join classes c on c.id=l.class_id where l.class_id in (${ph}) and l.date>=? order by l.date limit 10`).all(...ids, today) : [];
  const assignments = ids.length ? db.prepare(`select a.*, c.name class_name from assignments a join classes c on c.id=a.class_id where a.class_id in (${ph}) order by (a.due_date<?) , a.due_date limit 30`).all(...ids, today).map((a) => ({
    id: a.id, classId: a.class_id, className: a.class_name, title: a.title, dueDate: a.due_date,
    submitted: user.role === 'student' ? !!db.prepare('select 1 from submissions where assignment_id=? and student_id=?').get(a.id, user.id) : db.prepare('select count(*) n from submissions where assignment_id=?').get(a.id).n,
  })) : [];
  const feedback = user.role === 'student' ? db.prepare('select f.*, c.name class_name from feedback f join classes c on c.id=f.class_id where f.student_id=? order by f.created_at desc limit 10').all(user.id).map((f) => ({ id: f.id, className: f.class_name, body: f.body, nextFocus: f.next_focus, coach: userName(f.coach_id), createdAt: f.created_at })) : [];
  let attendance = null;
  if (user.role === 'student') {
    const rows = db.prepare('select status, count(*) n from attendance where student_id=? group by status').all(user.id);
    attendance = Object.fromEntries(rows.map((r) => [r.status, r.n]));
  }
  const notices = db.prepare(`select n.*, c.name class_name from notices n left join classes c on c.id=n.class_id where n.class_id is null ${ids.length ? `or n.class_id in (${ph})` : ''} order by n.pinned desc, n.created_at desc limit 10`).all(...ids)
    .map((n) => ({ id: n.id, title: n.title, body: n.body, className: n.class_name || '전체', pinned: !!n.pinned, createdAt: n.created_at }));
  return { user: publicUser(user), classes: classes.map((c) => ({ id: c.id, name: c.name, program: c.program, schedule: c.schedule, coachName: userName(c.coach_id) })),
    upcoming: upcoming.map((l) => ({ id: l.id, classId: l.class_id, className: l.class_name, num: l.num, date: l.date, topic: l.topic })), assignments, feedback, attendance, notices };
});
route('GET', '/api/classes/:id', ['admin', 'coach', 'student'], async (req, p, user) => classDetail(user, p.id));
route('GET', '/api/coaches', ['admin'], async () => db.prepare("select id,name from users where role in ('coach','admin') and active=1 order by name").all());

// 강사: 회차·출결
route('POST', '/api/classes/:id/lessons', ['admin', 'coach'], async (req, p, user) => {
  const a = classAccess(user, p.id); if (!staff(a)) throw deny(); const b = await readJson(req);
  const num = (db.prepare('select max(num) m from lessons where class_id=?').get(p.id).m || 0) + 1; const id = uid();
  db.prepare('insert into lessons(id,class_id,num,date,topic,log,public_note,created_at) values(?,?,?,?,?,?,?,?)').run(id, p.id, num, str(b.date, 10) || now().slice(0, 10), str(b.topic, 120), '', '', now());
  return { id, num };
});
route('PUT', '/api/lessons/:id', ['admin', 'coach'], async (req, p, user) => {
  const l = lessonClass(p.id); const a = classAccess(user, l.class_id); if (!staff(a)) throw deny(); const b = await readJson(req);
  db.prepare('update lessons set date=?, topic=?, log=?, public_note=? where id=?').run(str(b.date ?? l.date, 10), str(b.topic ?? l.topic, 120), str(b.log ?? l.log, 10000), str(b.publicNote ?? l.public_note, 3000), l.id);
  return { ok: true };
});
route('DELETE', '/api/lessons/:id', ['admin', 'coach'], async (req, p, user) => {
  const l = lessonClass(p.id); const a = classAccess(user, l.class_id); if (!staff(a)) throw deny();
  db.prepare('delete from attendance where lesson_id=?').run(l.id); db.prepare('delete from lessons where id=?').run(l.id); return { ok: true };
});
route('PUT', '/api/lessons/:id/attendance', ['admin', 'coach'], async (req, p, user) => {
  const l = lessonClass(p.id); const a = classAccess(user, l.class_id); if (!staff(a)) throw deny(); const b = await readJson(req);
  for (const r of Array.isArray(b.records) ? b.records : []) {
    if (!['present', 'late', 'absent', 'excused'].includes(r.status)) continue;
    if (!db.prepare("select 1 from enrollments where class_id=? and student_id=? and status='active'").get(l.class_id, r.studentId)) continue;
    db.prepare('insert into attendance(lesson_id,student_id,status,note) values(?,?,?,?) on conflict(lesson_id,student_id) do update set status=excluded.status, note=excluded.note').run(l.id, r.studentId, r.status, str(r.note, 200));
  }
  return { ok: true };
});
// 공지(수업)
route('POST', '/api/classes/:id/notices', ['admin', 'coach'], async (req, p, user) => {
  const a = classAccess(user, p.id); if (!staff(a)) throw deny(); const b = await readJson(req); const id = uid();
  db.prepare('insert into notices(id,class_id,title,body,pinned,created_by,created_at) values(?,?,?,?,?,?,?)').run(id, p.id, str(b.title, 100), str(b.body, 5000), b.pinned ? 1 : 0, user.id, now());
  return { id };
});
route('DELETE', '/api/notices/:id', ['admin', 'coach'], async (req, p, user) => {
  const n = db.prepare('select * from notices where id=?').get(p.id); if (!n) throw new HttpError(404, '공지가 없습니다.');
  if (n.class_id) { if (!staff(classAccess(user, n.class_id))) throw deny(); } else if (user.role !== 'admin') throw deny();
  db.prepare('delete from notices where id=?').run(n.id); return { ok: true };
});
// 과제
route('POST', '/api/classes/:id/assignments', ['admin', 'coach'], async (req, p, user) => {
  const a = classAccess(user, p.id); if (!staff(a)) throw deny(); const b = await readJson(req);
  const title = str(b.title, 120); if (!title) throw bad('과제 제목을 넣어 주세요.'); const id = uid();
  db.prepare('insert into assignments(id,class_id,title,description,due_date,created_by,created_at) values(?,?,?,?,?,?,?)').run(id, p.id, title, str(b.description, 5000), str(b.dueDate, 10), user.id, now());
  return { id };
});
route('PUT', '/api/assignments/:id', ['admin', 'coach'], async (req, p, user) => {
  const x = assignmentRow(p.id); if (!staff(classAccess(user, x.class_id))) throw deny(); const b = await readJson(req);
  db.prepare('update assignments set title=?, description=?, due_date=? where id=?').run(str(b.title ?? x.title, 120), str(b.description ?? x.description, 5000), str(b.dueDate ?? x.due_date, 10), x.id);
  return { ok: true };
});
route('DELETE', '/api/assignments/:id', ['admin', 'coach'], async (req, p, user) => {
  const x = assignmentRow(p.id); if (!staff(classAccess(user, x.class_id))) throw deny();
  db.prepare('delete from submissions where assignment_id=?').run(x.id); db.prepare('delete from assignments where id=?').run(x.id); return { ok: true };
});
route('GET', '/api/assignments/:id', ['admin', 'coach', 'student'], async (req, p, user) => {
  const x = assignmentRow(p.id); const a = classAccess(user, x.class_id);
  const map = (s) => ({ id: s.id, studentId: s.student_id, studentName: userName(s.student_id), text: s.text, files: JSON.parse(s.files || '[]').map((fid) => db.prepare('select id,name,type,size from files where id=?').get(fid)).filter(Boolean), submittedAt: s.submitted_at });
  const subs = staff(a) ? db.prepare('select * from submissions where assignment_id=? order by submitted_at').all(x.id).map(map)
    : db.prepare('select * from submissions where assignment_id=? and student_id=?').all(x.id, user.id).map(map);
  const fb = db.prepare(`select * from feedback where assignment_id=? ${staff(a) ? '' : 'and student_id=?'} order by created_at desc`).all(...(staff(a) ? [x.id] : [x.id, user.id]))
    .map((f) => ({ id: f.id, studentId: f.student_id, body: f.body, nextFocus: f.next_focus, rating: f.rating, coach: userName(f.coach_id), createdAt: f.created_at }));
  const students = staff(a) ? db.prepare("select u.id,u.name from enrollments e join users u on u.id=e.student_id where e.class_id=? and e.status='active' order by u.name").all(x.class_id) : [];
  return { assignment: { id: x.id, classId: x.class_id, className: getClass(x.class_id).name, title: x.title, description: x.description, dueDate: x.due_date }, as: a.as, submissions: subs, feedback: fb, students };
});
route('POST', '/api/assignments/:id/submit', ['student'], async (req, p, user) => {
  const x = assignmentRow(p.id); const a = classAccess(user, x.class_id); if (a.as !== 'student') throw deny(); const b = await readJson(req);
  const files = (Array.isArray(b.files) ? b.files : []).filter((fid) => db.prepare('select 1 from files where id=? and owner_id=?').get(fid, user.id)).slice(0, 10);
  const text = str(b.text, 20000); if (!text && !files.length) throw bad('내용이나 파일을 넣어 주세요.');
  db.prepare('insert into submissions(id,assignment_id,student_id,text,files,submitted_at) values(?,?,?,?,?,?) on conflict(assignment_id,student_id) do update set text=excluded.text, files=excluded.files, submitted_at=excluded.submitted_at')
    .run(uid(), x.id, user.id, text, JSON.stringify(files), now());
  return { ok: true };
});
// 피드백
route('POST', '/api/feedback', ['admin', 'coach'], async (req, p, user) => {
  const b = await readJson(req); const a = classAccess(user, b.classId); if (!staff(a)) throw deny();
  if (!db.prepare("select 1 from enrollments where class_id=? and student_id=?").get(b.classId, b.studentId)) throw bad('이 수업의 학생이 아니에요.');
  const body = str(b.body, 5000); if (!body) throw bad('피드백 내용을 넣어 주세요.'); const id = uid();
  db.prepare('insert into feedback(id,student_id,class_id,lesson_id,assignment_id,coach_id,body,next_focus,rating,created_at) values(?,?,?,?,?,?,?,?,?,?)')
    .run(id, b.studentId, b.classId, b.lessonId || null, b.assignmentId || null, user.id, body, str(b.nextFocus, 500), Number.isFinite(+b.rating) && b.rating !== '' && b.rating != null ? Math.max(1, Math.min(5, +b.rating)) : null, now());
  return { id };
});
route('DELETE', '/api/feedback/:id', ['admin', 'coach'], async (req, p, user) => {
  const f = db.prepare('select * from feedback where id=?').get(p.id); if (!f) throw new HttpError(404, '없음');
  if (!staff(classAccess(user, f.class_id))) throw deny(); db.prepare('delete from feedback where id=?').run(f.id); return { ok: true };
});
// 파일
const OK_TYPES = /^(image\/(png|jpeg|webp|gif|heic)|video\/(mp4|quicktime|webm)|audio\/(mpeg|mp4|x-m4a|wav|webm)|application\/pdf|text\/plain)$/;
route('POST', '/api/files', ['admin', 'coach', 'student'], async (req, p, user) => {
  const type = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
  if (!OK_TYPES.test(type)) throw new HttpError(415, '사진·영상·음성·PDF·텍스트만 올릴 수 있어요.');
  const buf = await readRaw(req, MAX_FILE); if (!buf.length) throw bad('빈 파일입니다.');
  const id = uid(); fs.writeFileSync(path.join(FILES, id), buf);
  const name = str(decodeURIComponent(String(req.headers['x-file-name'] || 'file')), 120);
  db.prepare('insert into files(id,owner_id,name,type,size,created_at) values(?,?,?,?,?,?)').run(id, user.id, name, type, buf.length, now());
  return { id, name, type, size: buf.length };
});
route('GET', '/api/files/:id', ['admin', 'coach', 'student'], async (req, p, user, res) => {
  const f = db.prepare('select * from files where id=?').get(p.id); if (!f) throw new HttpError(404, '파일이 없습니다.');
  let ok = user.role === 'admin' || f.owner_id === user.id;
  if (!ok) { // 그 파일이 제출된 과제의 강사
    for (const s of db.prepare("select a.class_id from submissions s join assignments a on a.id=s.assignment_id where s.files like ?").all(`%${f.id}%`)) {
      try { if (staff(classAccess(user, s.class_id))) { ok = true; break; } } catch {}
    }
  }
  if (!ok) throw deny();
  res.writeHead(200, { 'Content-Type': f.type, 'Content-Length': f.size, 'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(f.name)}`, 'Cache-Control': 'private, max-age=0' });
  fs.createReadStream(path.join(FILES, f.id)).pipe(res);
  return undefined;
});
route('GET', '/api/health', null, async () => ({ ok: true, users: db.prepare('select count(*) n from users').get().n }));

/* ── 서버 ── */
const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin;
  const headers = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'X-Frame-Options': 'DENY', Vary: 'Origin' };
  if (origin && ORIGINS.includes(origin)) Object.assign(headers, { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-File-Name', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Max-Age': '600' });
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  const url = new URL(req.url, 'http://x');
  try {
    for (const r of routes) {
      if (r.method !== req.method) continue;
      const m = url.pathname.match(r.re); if (!m) continue;
      let user = null;
      if (r.roles) { user = authUser(req); if (!user) throw new HttpError(401, '로그인이 필요해요.'); if (!r.roles.includes(user.role)) throw deny(); }
      const out = await r.fn(req, m.groups || {}, user, res);
      if (out === undefined) return;
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(JSON.stringify(out));
    }
    throw new HttpError(404, '없는 주소입니다.');
  } catch (e) {
    const code = e instanceof HttpError ? e.code : 500;
    if (code === 500) console.error('[lms]', req.method, url.pathname, e);
    if (!res.headersSent) res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: code === 500 ? '서버 오류가 났어요. 잠시 뒤 다시 시도하세요.' : e.message }));
  }
});
// 오래된 로그인 토큰 정리
setInterval(() => db.prepare('delete from tokens where expires_at<?').run(now()), 6 * 3600 * 1000).unref();
server.listen(PORT, () => console.log(`아터스 LMS 서버: http://localhost:${PORT}  (데이터: ${DATA})`));
