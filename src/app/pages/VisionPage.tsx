import { useSiteContent } from '../hooks/useSiteContent';
import { InstagramConsultButton } from '../components/InstagramConsultButton';

export function VisionPage() {
  const { content } = useSiteContent();

  const timeline = (() => {
    try { const v = (content as any).vision_timeline; if (Array.isArray(v)) return v; return JSON.parse(v); } catch { return []; }
  })();

  const stats = [
    { num: content.vision_stat1_num, label: content.vision_stat1_label },
    { num: content.vision_stat2_num, label: content.vision_stat2_label },
    { num: content.vision_stat3_num, label: content.vision_stat3_label },
    { num: content.vision_stat4_num, label: content.vision_stat4_label },
  ];

  const values = [
    { title: content.vision_value1_title, desc: content.vision_value1_desc },
    { title: content.vision_value2_title, desc: content.vision_value2_desc },
    { title: content.vision_value3_title, desc: content.vision_value3_desc },
    { title: content.vision_value4_title, desc: content.vision_value4_desc },
  ];

  return (
    <div className="min-h-screen bg-[#F3F0EA] text-[#132B3F]">
      {/* 매거진 히어로 */}
      <section className="relative overflow-hidden bg-[#132B3F] text-white">
        <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
          <span className="text-[clamp(8rem,25vw,28rem)] font-black leading-[0.8] tracking-[-0.06em] text-white/[0.03] whitespace-nowrap" style={{ fontFamily: "'Syne', 'DM Sans', sans-serif" }}>VISION</span>
        </div>
        <div className="max-w-[1360px] mx-auto px-5 sm:px-8 py-16 sm:py-24 relative z-10">
          <p className="text-[10px] font-black tracking-[0.2em] text-[#A9C5D9] uppercase mb-4">Vision</p>
          <h1 className="keep-ko text-[36px] sm:text-[52px] lg:text-[64px] font-black leading-[1.05] tracking-[-0.04em] text-white whitespace-pre-line">{content.vision_headline}</h1>
          <p className="keep-ko mt-6 text-base sm:text-lg leading-[1.75] text-[#DCE9F2]/80 max-w-2xl">{content.vision_text}</p>
        </div>
      </section>

      {/* 스탯 — 스코어보드 */}
      <section className="bg-[#153956]">
        <div className="max-w-[1360px] mx-auto px-5 sm:px-8 py-10 sm:py-14">
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0">
            {stats.map((s, i) => (
              <div key={i} className={`text-center ${i > 0 ? 'md:border-l md:border-white/10' : ''}`}>
                <dd className="text-4xl sm:text-5xl font-black tracking-[-0.03em] text-white">{s.num}</dd>
                <dt className="text-[10px] font-bold tracking-[0.15em] text-[#A9C5D9] uppercase mt-2">{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* 스토리 — 에디토리얼 */}
      <section className="max-w-[1360px] mx-auto px-5 sm:px-8 py-16 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          <div className="lg:col-span-4">
            <p className="text-[10px] font-black tracking-[0.2em] text-[#2D5E88] uppercase mb-3">Our Story</p>
            <h2 className="keep-ko text-3xl sm:text-[40px] font-black tracking-[-0.03em] text-[#132B3F] leading-[1.1]">왜<br />아터스인가</h2>
          </div>
          <div className="lg:col-span-8 keep-ko text-base sm:text-[17px] leading-[1.9] text-[#35526B] whitespace-pre-line lg:border-l lg:border-[#153956]/15 lg:pl-16">
            {content.vision_story}
          </div>
        </div>
      </section>

      {/* 가치 — 매거진 그리드 */}
      <section className="border-t border-[#153956]/15 bg-[#FAF8F4]">
        <div className="max-w-[1360px] mx-auto px-5 sm:px-8 py-16 sm:py-24">
          <p className="text-[10px] font-black tracking-[0.2em] text-[#2D5E88] uppercase mb-3">Core Values</p>
          <h2 className="keep-ko text-3xl sm:text-[40px] font-black tracking-[-0.03em] text-[#132B3F] mb-12">핵심 가치</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-[#153956]/15 rounded-2xl overflow-hidden">
            {values.map((v, i) => (
              <div key={i} className={`p-6 sm:p-10 ${i < 2 ? 'border-b border-[#153956]/15' : ''} ${i % 2 === 0 ? 'md:border-r md:border-[#153956]/15' : ''}`}>
                <span className="text-[48px] font-black tracking-[-0.04em] text-[#153956]/10 leading-none">0{i + 1}</span>
                <h3 className="keep-ko mt-2 text-lg sm:text-xl font-black text-[#132B3F] leading-[1.35]">{v.title}</h3>
                <p className="keep-ko mt-3 text-[15px] leading-[1.8] text-[#35526B]">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 타임라인 */}
      {timeline.length > 0 && (
        <section className="max-w-[1360px] mx-auto px-5 sm:px-8 py-16 sm:py-24 border-t border-[#153956]/15">
          <p className="text-[10px] font-black tracking-[0.2em] text-[#2D5E88] uppercase mb-3">Timeline</p>
          <h2 className="keep-ko text-3xl sm:text-[40px] font-black tracking-[-0.03em] text-[#132B3F] mb-12">걸어온 길</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {timeline.map((t: { year: string; event: string; detail: string }, i: number) => (
              <div key={i} className="rounded-2xl border border-[#153956]/15 bg-[#FAF8F4] p-6 sm:p-8">
                <p className="text-[48px] font-black tracking-[-0.04em] text-[#153956]/15 leading-none">{t.year}</p>
                <h3 className="keep-ko mt-2 text-base sm:text-lg font-black text-[#132B3F]">{t.event}</h3>
                <p className="keep-ko mt-2 text-[14px] leading-[1.7] text-[#35526B]">{t.detail}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-[#132B3F] text-white">
        <div className="max-w-[1360px] mx-auto px-5 sm:px-8 py-16 sm:py-24 text-center">
          <p className="text-[10px] font-black tracking-[0.2em] text-[#A9C5D9] uppercase mb-4">Get Started</p>
          <h2 className="keep-ko text-3xl sm:text-[40px] font-black leading-[1.15] tracking-[-0.03em] text-white">artheus와 함께 시작하세요.</h2>
          <div className="w-16 h-0.5 bg-[#A9C5D9]/40 mx-auto my-6" />
          <p className="keep-ko text-base leading-[1.75] text-[#DCE9F2]/80">인스타그램 DM으로 상담을 시작할 수 있습니다.</p>
          <div className="mt-8 flex justify-center">
            <InstagramConsultButton location="vision_cta" label="상담 문의하기" tone="on-blue" className="px-8 py-3.5" />
          </div>
        </div>
      </section>
    </div>
  );
}
