/**
 * 아터스 스튜디오 — 작업(Job) 관리자
 *
 * 요청 하나 = 작업 하나 = Claude Code 프로세스(`claude -p`) 하나.
 * 여러 작업을 동시에 돌리고, 같은 파일을 두 작업이 동시에 고치지 않도록 "구역(lane)"으로 막는다.
 *   site            사이트 코드(src/, index.html) — 페이지 탭
 *   column:<slug>   칼럼 하나 — 칼럼 탭
 *   new:<id>        새 칼럼 만들기(새 폴더라 서로 겹치지 않음)
 *   seo             주제 추천 등 리포트 작업
 *   manager         매니저(무엇이든 고칠 수 있음) — 다른 모든 작업과 겹침. 대신 안에서 서브에이전트를 병렬로 씀
 *   assist:<id>     AI 도우미(광고 대본·웹진·메시지 초안 JSON) — 파일을 고치지 않아 아무것과도 겹치지 않음
 * 작업 기록은 메모리에 두고 화면이 폴링(since=seq)으로 받아 간다. 서브에이전트(Task) 이벤트는 parent 로 묶는다.
 */
import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';

export type JobKind = 'page' | 'column' | 'manager' | 'assist';
export type JobStatus = 'running' | 'done' | 'error' | 'stopped';

export interface JobEvent { seq: number; t: number; kind: string; [k: string]: unknown }

export interface Job {
  id: string; kind: JobKind; title: string; lane: string; slug?: string;
  status: JobStatus; startedAt: number; endedAt?: number;
  sessionId?: string; model?: string; costUsd?: number;
  edited: string[]; snapshotId?: string; agents: number;
  events: JobEvent[]; child?: ChildProcess;
}

export function lanesConflict(a: string, b: string) {
  if (a.startsWith('assist:') || b.startsWith('assist:')) return a === b;
  if (a === 'manager' || b === 'manager') return true;
  return a === b;
}

const AGENT_TOOLS = new Set(['Task', 'Agent']);

export class JobManager {
  private jobs = new Map<string, Job>();
  private seq = 0;

  constructor(private root: string, private logger: { info: (m: string) => void; error: (m: string) => void }, public max = 3) {}

  running() { return [...this.jobs.values()].filter((j) => j.status === 'running'); }
  conflict(lane: string) { return this.running().find((j) => lanesConflict(j.lane, lane)); }
  get(id: string) { return this.jobs.get(id); }

  summary(j: Job) {
    const { child, events, ...rest } = j;
    const last = [...events].reverse().find((e) => e.kind === 'tool' || e.kind === 'agent');
    return { ...rest, lastSeq: events.length ? events[events.length - 1].seq : 0, activity: last ? (last.kind === 'agent' ? `🤖 ${last.agent}` : `${last.name} ${last.target || ''}`.trim()) : '' };
  }
  list() {
    return [...this.jobs.values()].sort((a, b) => b.startedAt - a.startedAt).slice(0, 30).map((j) => this.summary(j));
  }
  eventsSince(id: string, since: number) {
    const j = this.jobs.get(id);
    return j ? j.events.filter((e) => e.seq > since) : null;
  }

  private push(j: Job, ev: Record<string, unknown>) {
    j.events.push({ seq: ++this.seq, t: Date.now(), kind: String(ev.kind), ...ev });
    if (j.events.length > 4000) j.events.splice(1, j.events.length - 4000); // 첫 이벤트(요청 내용)는 남김
  }

  start(opts: { kind: JobKind; title: string; lane: string; slug?: string; userText: string; prompt: string; args: string[]; model?: string; snapshotId?: string; onExit?: (j: Job) => void }) {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const j: Job = { id, kind: opts.kind, title: opts.title, lane: opts.lane, slug: opts.slug, status: 'running', startedAt: Date.now(), model: opts.model, edited: [], snapshotId: opts.snapshotId, agents: 0, events: [] };
    this.jobs.set(id, j);
    for (const old of [...this.jobs.values()].sort((a, b) => a.startedAt - b.startedAt).slice(0, Math.max(0, this.jobs.size - 40))) {
      if (old.status !== 'running') this.jobs.delete(old.id);
    }
    this.push(j, { kind: 'user', text: opts.userText });

    const child = spawn('claude', opts.args, { cwd: this.root, shell: process.platform === 'win32', env: process.env });
    j.child = child;
    child.stdin?.end(opts.prompt);

    const agentIds = new Set<string>();
    let deltaBuf = ''; let flushT: NodeJS.Timeout | null = null;
    const flush = () => { if (deltaBuf) { this.push(j, { kind: 'delta', text: deltaBuf }); deltaBuf = ''; } flushT = null; };

    let buf = '';
    child.stdout?.on('data', (chunk) => {
      buf += chunk;
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
        if (!line) continue;
        let ev: any; try { ev = JSON.parse(line); } catch { continue; }
        const parent: string | null = ev.parent_tool_use_id || null;
        if (ev.type === 'system' && ev.subtype === 'init' && !parent) {
          j.sessionId = ev.session_id; this.push(j, { kind: 'session', sessionId: ev.session_id, model: ev.model });
        } else if (ev.type === 'stream_event' && !parent && ev.event?.type === 'content_block_delta' && ev.event.delta?.type === 'text_delta') {
          deltaBuf += ev.event.delta.text; if (!flushT) flushT = setTimeout(flush, 150);
        } else if (ev.type === 'assistant') {
          flush();
          for (const b of ev.message?.content || []) {
            if (b.type === 'tool_use' && AGENT_TOOLS.has(b.name)) {
              agentIds.add(b.id); j.agents++;
              this.push(j, { kind: 'agent', id: b.id, agent: b.input?.subagent_type || 'general', desc: String(b.input?.description || '').slice(0, 120), parent });
            } else if (b.type === 'tool_use') {
              const fp = b.input?.file_path || b.input?.path || '';
              const other = b.input?.pattern || b.input?.query || b.input?.url || b.input?.skill || String(b.input?.command || '').replace(/^python3?\s+tools\/geo-seo\/scripts\//, '');
              const target = fp ? (path.relative(this.root, path.resolve(this.root, String(fp))) || String(fp)) : String(other || '').slice(0, 120);
              if (/Edit|Write/.test(b.name) && fp && !j.edited.includes(target)) j.edited.push(target);
              this.push(j, { kind: 'tool', name: b.name, target, parent });
            } else if (b.type === 'text' && b.text?.trim()) {
              this.push(j, { kind: 'text', text: parent ? String(b.text).slice(0, 600) : b.text, parent });
            }
          }
        } else if (ev.type === 'user') {
          for (const b of ev.message?.content || []) {
            if (b.type === 'tool_result' && agentIds.has(b.tool_use_id)) this.push(j, { kind: 'agent_done', id: b.tool_use_id, error: !!b.is_error });
          }
        } else if (ev.type === 'result' && !parent) {
          flush();
          j.costUsd = ev.total_cost_usd; if (ev.session_id) j.sessionId = ev.session_id;
          this.push(j, { kind: 'done', ok: !ev.is_error, result: ev.result, costUsd: ev.total_cost_usd, ms: ev.duration_ms });
        }
      }
    });
    let errText = '';
    child.stderr?.on('data', (c) => (errText += c));
    child.on('error', (e) => { this.logger.error(`[아터스 스튜디오] Claude Code 실행 실패: ${e.message}`); this.push(j, { kind: 'error', message: `Claude Code를 실행하지 못했습니다: ${e.message}` }); });
    child.on('close', (code) => {
      flush();
      j.child = undefined; j.endedAt = Date.now();
      if (j.status === 'running') {
        if (code === 0) j.status = j.events.some((e) => e.kind === 'done' && e.ok === false) ? 'error' : 'done';
        else if (code === null) { j.status = 'stopped'; this.push(j, { kind: 'error', message: '중지했습니다.' }); }
        else {
          j.status = 'error';
          const nested = /inside another Claude Code session|CLAUDECODE/i.test(errText);
          this.logger.error(`[아터스 스튜디오] 작업 "${j.title}" 오류 (코드 ${code}):\n${errText.trim().slice(-2000)}`);
          this.push(j, { kind: 'error', message: nested ? '스튜디오가 Claude Code 안에서 실행되고 있어 Claude를 부를 수 없습니다. 새 터미널 창에서 npm run dev 를 다시 실행하세요.' : (errText.trim().slice(-600) || `Claude Code가 코드 ${code}로 끝났습니다.`) });
        }
      }
      try { opts.onExit?.(j); } catch {}
    });
    return j;
  }

  stop(id: string) {
    const j = this.jobs.get(id);
    if (!j || j.status !== 'running') return false;
    j.status = 'stopped';
    j.child?.kill('SIGTERM');
    this.push(j, { kind: 'error', message: '중지했습니다.' });
    return true;
  }
  stopAll() { for (const j of this.running()) this.stop(j.id); }
}
