#!/usr/bin/env node
/**
 * 아터스 LMS 관리 명령
 *   npm run lms:admin -- create-admin <아이디> <이름>   첫 관리자 계정 + 초대 링크
 *   npm run lms:admin -- invite <아이디>               비밀번호를 잊었을 때 새 초대 링크
 *   npm run lms:admin -- backup                         데이터 백업 파일 만들기
 */
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { openDb, uid, now } from './db.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(process.env.LMS_DATA || path.join(here, '..', 'data'));
const SITE = process.env.LMS_SITE || 'https://www.c-art.co.kr';
const db = openDb(path.join(DATA, 'lms.db'));
const [cmd, a1, a2] = process.argv.slice(2);
const invite = (id) => {
  const code = crypto.randomBytes(6).toString('base64url').replace(/[-_]/g, 'x');
  db.prepare('update users set invite_code=?, invite_expires=?, password_hash=null where id=?').run(code, new Date(Date.now() + 14 * 864e5).toISOString(), id);
  db.prepare('delete from tokens where user_id=?').run(id);
  return code;
};
if (cmd === 'create-admin') {
  const username = String(a1 || '').toLowerCase(); const name = a2 || username;
  if (!/^[a-z0-9._-]{3,40}$/.test(username)) { console.error('아이디는 영문 소문자·숫자 3자 이상'); process.exit(1); }
  let u = db.prepare('select * from users where username=?').get(username);
  if (!u) { const id = uid(); db.prepare("insert into users(id,username,name,role,active,created_at) values(?,?,?,'admin',1,?)").run(id, username, name, now()); u = { id }; }
  else db.prepare("update users set role='admin', active=1 where id=?").run(u.id);
  const code = invite(u.id);
  console.log(`관리자 ${username} 준비 완료.\n아래 주소에서 비밀번호를 정하세요 (14일 유효):\n  ${SITE}/#/login?invite=${code}\n  (개발 중: http://localhost:5173/#/login?invite=${code})`);
} else if (cmd === 'invite') {
  const u = db.prepare('select * from users where username=?').get(String(a1 || '').toLowerCase());
  if (!u) { console.error('그 아이디가 없습니다.'); process.exit(1); }
  console.log(`${SITE}/#/login?invite=${invite(u.id)}`);
} else if (cmd === 'backup') {
  const out = path.join(DATA, `lms-backup-${now().slice(0, 10)}.db`);
  db.exec(`vacuum into '${out.replace(/'/g, "''")}'`); console.log('백업:', out, '(첨부 파일은 files 폴더를 함께 복사하세요)');
} else {
  console.log('사용법: create-admin <아이디> <이름> | invite <아이디> | backup');
}
