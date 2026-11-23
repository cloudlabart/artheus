/** 아터스 LMS 데이터베이스 (Node 내장 SQLite, 파일 하나) */
import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const uid = () => Date.now().toString(36) + crypto.randomBytes(5).toString('hex');
export const now = () => new Date().toISOString();

const SCHEMA = `
create table if not exists users (
  id text primary key, username text unique not null, name text not null,
  role text not null check (role in ('admin','coach','student')),
  phone text, password_hash text, invite_code text unique, invite_expires text,
  active integer not null default 1, created_at text not null, last_login text);
create table if not exists tokens (token_hash text primary key, user_id text not null, created_at text, expires_at text not null, agent text);
create table if not exists classes (
  id text primary key, name text not null, program text, coach_id text, schedule text,
  start_date text, end_date text, status text not null default 'active', description text, created_at text);
create table if not exists enrollments (class_id text not null, student_id text not null, status text not null default 'active', created_at text, primary key (class_id, student_id));
create table if not exists lessons (id text primary key, class_id text not null, num integer, date text, topic text, log text, public_note text, created_at text);
create table if not exists attendance (lesson_id text not null, student_id text not null, status text not null check (status in ('present','late','absent','excused')), note text, primary key (lesson_id, student_id));
create table if not exists assignments (id text primary key, class_id text not null, title text not null, description text, due_date text, created_by text, created_at text);
create table if not exists submissions (id text primary key, assignment_id text not null, student_id text not null, text text, files text, submitted_at text, unique (assignment_id, student_id));
create table if not exists feedback (id text primary key, student_id text not null, class_id text not null, lesson_id text, assignment_id text, coach_id text, body text not null, next_focus text, rating integer, created_at text);
create table if not exists notices (id text primary key, class_id text, title text not null, body text, pinned integer default 0, created_by text, created_at text);
create table if not exists files (id text primary key, owner_id text not null, name text, type text, size integer, created_at text);
create table if not exists audit (id text primary key, user_id text, action text, detail text, at text);
create index if not exists idx_lessons_class on lessons(class_id);
create index if not exists idx_assign_class on assignments(class_id);
create index if not exists idx_fb_student on feedback(student_id);
create index if not exists idx_tokens_user on tokens(user_id);
`;

export function openDb(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('pragma journal_mode = wal; pragma foreign_keys = on; pragma busy_timeout = 5000;');
  db.exec(SCHEMA);
  return db;
}
