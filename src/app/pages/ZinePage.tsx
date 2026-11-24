import { useData, type ZineArticle } from '../contexts/DataContext';

function ZineCard({ article, idx }: { article: ZineArticle; idx: number }) {
  const date = article.created_at ? new Date(article.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' }) : '';
  const paragraphs = article.content.split('\n\n').filter(Boolean);
  const isFeature = idx === 0;

  return (
    <article className={`rounded-2xl border border-[#153956]/15 overflow-hidden ${isFeature ? 'md:col-span-2' : ''}`}>
      <div className="bg-[#132B3F] px-6 sm:px-8 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black tracking-[0.14em] px-2.5 py-1 rounded-full bg-white/10 text-[#A9C5D9] uppercase">{article.category}</span>
            {date && <span className="text-[10px] font-semibold text-[#A9C5D9]/60 uppercase tracking-wider">{date}</span>}
          </div>
          <span className="text-[48px] font-black tracking-[-0.04em] text-white/[0.06] leading-none">0{idx + 1}</span>
        </div>
        <h2 className={`keep-ko font-black text-white leading-[1.2] tracking-[-0.02em] ${isFeature ? 'text-2xl sm:text-[36px]' : 'text-xl sm:text-2xl'}`}>{article.title}</h2>
        <p className="mt-2 text-xs font-bold text-[#A9C5D9] uppercase tracking-wider">{article.author}</p>
      </div>
      <div className="bg-[#FAF8F4] px-6 sm:px-8 py-6 sm:py-8">
        {paragraphs.map((para, i) => (
          <p key={i} className="keep-ko text-[15px] leading-[1.9] text-[#35526B] mb-4 last:mb-0">{para}</p>
        ))}
      </div>
    </article>
  );
}

export function ZinePage() {
  const { zine } = useData();
  const sorted = [...zine].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="min-h-screen bg-[#F3F0EA] text-[#132B3F]">
      <section className="relative overflow-hidden bg-[#132B3F] text-white">
        <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
          <span className="text-[clamp(10rem,30vw,32rem)] font-black leading-[0.8] tracking-[-0.06em] text-white/[0.03] whitespace-nowrap" style={{ fontFamily: "'Syne', 'DM Sans', sans-serif" }}>ZINE</span>
        </div>
        <div className="max-w-[1360px] mx-auto px-5 sm:px-8 py-16 sm:py-24 relative z-10">
          <p className="text-[10px] font-black tracking-[0.2em] text-[#A9C5D9] uppercase mb-4">Magazine</p>
          <h1 className="keep-ko text-[36px] sm:text-[52px] lg:text-[64px] font-black leading-[1.05] tracking-[-0.04em] text-white">Zine</h1>
          <p className="keep-ko mt-4 text-base sm:text-lg leading-[1.75] text-[#DCE9F2]/80 max-w-xl">artheus 코치진이 쓰는 연기·무브먼트·실전 이야기.</p>
        </div>
      </section>

      <section className="max-w-[1360px] mx-auto px-5 sm:px-8 py-14 sm:py-20">
        {sorted.length === 0 ? (
          <p className="keep-ko text-base text-[#35526B]">아직 발행된 글이 없습니다.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {sorted.map((article, idx) => <ZineCard key={article.id} article={article} idx={idx} />)}
          </div>
        )}
      </section>
    </div>
  );
}
