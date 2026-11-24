import { useData, type Notice } from '../contexts/DataContext';

function NoticeRow({ notice, idx }: { notice: Notice; idx: number }) {
  const date = notice.created_at ? new Date(notice.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

  return (
    <article className="py-6 border-b border-[#153956]/10 last:border-b-0 flex items-start gap-4">
      <span className="text-[32px] font-black tracking-[-0.04em] text-[#153956]/10 leading-none shrink-0 w-10 text-right">
        {String(idx + 1).padStart(2, '0')}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          {notice.is_pinned && (
            <span className="text-[10px] font-black tracking-[0.1em] px-2.5 py-0.5 rounded-full bg-[#132B3F] text-[#F3F0EA] uppercase">공지</span>
          )}
          {date && <span className="text-[10px] font-semibold text-[#7A95A8] uppercase tracking-wider">{date}</span>}
        </div>
        <h2 className="keep-ko text-base sm:text-lg font-black text-[#132B3F] leading-[1.4]">{notice.title}</h2>
        {notice.content && <p className="keep-ko mt-1.5 text-[14px] sm:text-[15px] leading-[1.75] text-[#35526B]">{notice.content}</p>}
      </div>
    </article>
  );
}

export function NoticesPage() {
  const { notices } = useData();
  const pinned = notices.filter((n) => n.is_pinned);
  const rest = notices.filter((n) => !n.is_pinned);
  const sorted = [...pinned, ...rest];

  return (
    <div className="min-h-screen bg-[#F3F0EA] text-[#132B3F]">
      <section className="relative overflow-hidden bg-[#132B3F] text-white">
        <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
          <span className="text-[clamp(8rem,25vw,28rem)] font-black leading-[0.8] tracking-[-0.06em] text-white/[0.03] whitespace-nowrap" style={{ fontFamily: "'Syne', 'DM Sans', sans-serif" }}>NOTICE</span>
        </div>
        <div className="max-w-[1360px] mx-auto px-5 sm:px-8 py-16 sm:py-24 relative z-10">
          <p className="text-[10px] font-black tracking-[0.2em] text-[#A9C5D9] uppercase mb-4">Notice</p>
          <h1 className="keep-ko text-[36px] sm:text-[52px] lg:text-[64px] font-black leading-[1.05] tracking-[-0.04em] text-white">공지</h1>
          <p className="keep-ko mt-4 text-base sm:text-lg leading-[1.75] text-[#DCE9F2]/80">모집·일정 및 중요 안내입니다.</p>
        </div>
      </section>

      <section className="max-w-[960px] mx-auto px-5 sm:px-8 py-14 sm:py-20">
        {sorted.length === 0 ? (
          <p className="keep-ko text-base text-[#35526B]">공지사항이 없습니다.</p>
        ) : (
          <div className="rounded-2xl border border-[#153956]/15 bg-[#FAF8F4] px-6 sm:px-8">
            {sorted.map((notice, idx) => <NoticeRow key={notice.id} notice={notice} idx={idx} />)}
          </div>
        )}
      </section>
    </div>
  );
}
