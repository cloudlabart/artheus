import { motion } from 'motion/react';
import { useData, type ZineArticle } from '../contexts/DataContext';

function ZineCard({ article, idx }: { article: ZineArticle; idx: number }) {
  const date = article.created_at ? new Date(article.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' }) : '';
  const paragraphs = article.content.split('\n\n').filter(Boolean);
  const isFeature = idx === 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: (idx % 2) * 0.1, duration: 0.6 }}
      className={`court-card overflow-hidden ${isFeature ? 'md:col-span-2' : ''}`}
    >
      <div className="p-6 sm:p-8 border-b border-[#A9C5D9]/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black tracking-[0.14em] px-2.5 py-1 rounded-full bg-[#A9C5D9]/10 text-[#A9C5D9]/70 uppercase">{article.category}</span>
            {date && <span className="text-[10px] font-semibold text-[#A9C5D9]/40 uppercase tracking-wider">{date}</span>}
          </div>
          <span className="text-[48px] font-black tracking-[-0.04em] text-[#A9C5D9]/[0.06] leading-none">0{idx + 1}</span>
        </div>
        <h2 className={`keep-ko font-black text-[#F3F0EA] leading-[1.2] tracking-[-0.02em] ${isFeature ? 'text-2xl sm:text-[36px]' : 'text-xl sm:text-2xl'}`}>{article.title}</h2>
        <p className="mt-2 text-xs font-bold text-[#A9C5D9]/60 uppercase tracking-wider">{article.author}</p>
      </div>
      <div className="p-6 sm:p-8">
        {paragraphs.map((para, i) => (
          <p key={i} className="keep-ko text-[15px] leading-[1.9] text-[#8CADC8]/70 mb-4 last:mb-0">{para}</p>
        ))}
      </div>
    </motion.article>
  );
}

export function ZinePage() {
  const { zine } = useData();
  const sorted = [...zine].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="min-h-screen text-[#F3F0EA] pt-20 lg:pt-24">
      {/* 히어로 */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
          <span className="text-[clamp(10rem,30vw,32rem)] font-black leading-[0.8] tracking-[-0.06em] text-[#A9C5D9]/[0.03] whitespace-nowrap">ZINE</span>
        </div>
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-16 sm:py-24 relative z-10">
          <span className="court-label block mb-4">Magazine</span>
          <h1 className="keep-ko text-[36px] sm:text-[52px] lg:text-[64px] font-black leading-[1.05] tracking-[-0.04em] text-[#F3F0EA]">Zine</h1>
          <p className="keep-ko mt-4 text-base sm:text-lg leading-[1.75] text-[#8CADC8]/80 max-w-xl">artheus 코치진이 쓰는 연기·무브먼트·실전 이야기.</p>
        </div>
      </section>

      {/* 카드 */}
      <section className="max-w-[1200px] mx-auto px-5 sm:px-8 py-14 sm:py-20">
        {sorted.length === 0 ? (
          <p className="keep-ko text-base text-[#8CADC8]/70">아직 발행된 글이 없습니다.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {sorted.map((article, idx) => <ZineCard key={article.id} article={article} idx={idx} />)}
          </div>
        )}
      </section>
    </div>
  );
}
