/** LMS 공통 화면 조각 — CLAUDE.md 디자인 규칙(아이보리·딥블루, rounded-2xl, 버튼 rounded-full) */
import type { ReactNode } from 'react';

export const Page = ({ eyebrow, title, desc, actions, children }: { eyebrow?: string; title: string; desc?: string; actions?: ReactNode; children: ReactNode }) => (
  <section className="max-w-[1140px] mx-auto px-5 sm:px-8 py-10 sm:py-14 min-h-[60vh]">
    <div className="flex flex-wrap items-end gap-3 mb-8">
      <div className="flex-1 min-w-0 basis-full sm:basis-auto">
        {eyebrow && <p className="text-xs font-semibold tracking-[0.16em] text-[#2D5E88] uppercase mb-2">{eyebrow}</p>}
        <h1 className="keep-ko text-2xl sm:text-[34px] font-bold tracking-[-0.02em] text-[#132B3F] leading-tight">{title}</h1>
        {desc && <p className="keep-ko mt-2 text-[15px] text-[#35526B]">{desc}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
    {children}
  </section>
);
export const Card = ({ title, sub, children, className = '' }: { title?: ReactNode; sub?: ReactNode; children: ReactNode; className?: string }) => (
  <div className={`rounded-2xl border border-[#153956]/15 bg-[#FAF8F4] p-5 sm:p-6 min-w-0 ${className}`}>
    {title && <h2 className="text-[15px] font-bold text-[#132B3F] mb-3 flex items-center gap-2">{title}{sub && <span className="text-xs font-medium text-[#5B7285]">{sub}</span>}</h2>}
    {children}
  </div>
);
export const Btn = ({ children, onClick, kind = 'line', type = 'button', disabled }: { children: ReactNode; onClick?: () => void; kind?: 'primary' | 'line' | 'danger'; type?: 'button' | 'submit'; disabled?: boolean }) => (
  <button type={type} onClick={onClick} disabled={disabled}
    className={`inline-flex items-center justify-center gap-1.5 min-h-[40px] px-5 rounded-full text-sm font-semibold transition-colors disabled:opacity-40 ${kind === 'primary' ? 'bg-[#153956] text-[#F3F0EA] hover:bg-[#2D5E88]' : kind === 'danger' ? 'border border-[#B23A32]/40 text-[#B23A32] hover:bg-[#B23A32]/5' : 'border border-[#153956]/25 text-[#153956] hover:bg-[#153956]/5'}`}>{children}</button>
);
export const Field = ({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) => (
  <label className="grid gap-1.5 text-[13px] text-[#35526B]">{label}{children}{hint && <span className="text-xs text-[#5B7285]">{hint}</span>}</label>
);
export const inputCls = 'w-full rounded-xl border border-[#153956]/20 bg-white px-3.5 py-2.5 text-[15px] text-[#132B3F] outline-none focus:border-[#2D5E88]';
export const Empty = ({ children }: { children: ReactNode }) => <p className="keep-ko text-sm text-[#5B7285] py-3">{children}</p>;
export const Badge = ({ children, tone = 'blue' }: { children: ReactNode; tone?: 'blue' | 'ok' | 'warn' | 'gray' }) => (
  <span className={`inline-flex items-center text-[11.5px] font-semibold px-2 py-0.5 rounded-full ${{ blue: 'bg-[#DFE8EF] text-[#2D5E88]', ok: 'bg-[#E1F0E6] text-[#2F7A4F]', warn: 'bg-[#F6EAD9] text-[#A3621B]', gray: 'bg-[#153956]/8 text-[#5B7285]' }[tone]}`}>{children}</span>
);
export const ErrorBox = ({ msg }: { msg: string }) => msg ? <div className="keep-ko rounded-xl bg-[#F6E1DF] text-[#B23A32] text-sm px-4 py-3">{msg}</div> : null;
