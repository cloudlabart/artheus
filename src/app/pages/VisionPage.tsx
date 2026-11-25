import { motion } from 'motion/react';
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
    <div className="min-h-screen text-[#F3F0EA]">
      {/* 히어로 — 풀 블리드 이미지 */}
      <section className="relative overflow-hidden min-h-[60vh] lg:min-h-[70vh] flex items-end">
        <img
          src="/uploads/20261124-105231-파우더-블루-코트-생생한-한-점-0os2.png"
          alt="파우더 블루 코트 — ARTHEUS 비전"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A1F33] via-[#0A1F33]/40 to-transparent" />
        <div className="relative z-10 max-w-[1200px] mx-auto px-5 sm:px-8 pb-12 sm:pb-16 w-full">
          <span className="court-label block mb-4">Vision</span>
          <h1 className="keep-ko text-[36px] sm:text-[52px] lg:text-[64px] font-black leading-[1.05] tracking-[-0.04em] text-[#F3F0EA] whitespace-pre-line">{content.vision_headline}</h1>
          <p className="keep-ko mt-4 text-base sm:text-lg leading-[1.75] text-[#F3F0EA]/80 max-w-2xl">{content.vision_text}</p>
        </div>
      </section>

      {/* 스탯 */}
      <section className="border-y border-[#A9C5D9]/12">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-10 sm:py-14">
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0">
            {stats.map((s, i) => (
              <div key={i} className={`text-center ${i > 0 ? 'md:border-l md:border-[#A9C5D9]/12' : ''}`}>
                <dd className="text-4xl sm:text-5xl font-black tracking-[-0.03em] text-[#F3F0EA]">{s.num}</dd>
                <dt className="text-[10px] font-bold tracking-[0.15em] text-[#A9C5D9]/60 uppercase mt-2">{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* 스토리 + 사진 */}
      <section className="max-w-[1200px] mx-auto px-5 sm:px-8 py-16 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          <div className="lg:col-span-5">
            <span className="court-label block mb-3">Our Story</span>
            <h2 className="keep-ko text-3xl sm:text-[40px] font-black tracking-[-0.03em] text-[#F3F0EA] leading-[1.1]">왜<br />아터스인가</h2>
            <div className="mt-8 rounded-2xl overflow-hidden">
              <img
                src="/uploads/20261124-105219-아르테우스-하늘과-코트의-리듬-g8vm.png"
                alt="아터스, 하늘과 코트의 리듬"
                className="w-full aspect-[4/3] object-cover"
                draggable={false}
              />
            </div>
          </div>
          <div className="lg:col-span-7 keep-ko text-base sm:text-[17px] leading-[1.9] text-[#8CADC8]/80 whitespace-pre-line lg:border-l lg:border-[#A9C5D9]/12 lg:pl-16 flex items-center">
            <p>{content.vision_story}</p>
          </div>
        </div>
      </section>

      {/* 가치 */}
      <section className="border-t border-[#A9C5D9]/12">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-16 sm:py-24">
          <span className="court-label block mb-3">Core Values</span>
          <h2 className="keep-ko text-3xl sm:text-[40px] font-black tracking-[-0.03em] text-[#F3F0EA] mb-12">핵심 가치</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {values.map((v, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="court-grid-cell"
              >
                <span className="text-[48px] font-black tracking-[-0.04em] text-[#A9C5D9]/10 leading-none">0{i + 1}</span>
                <h3 className="keep-ko mt-2 text-lg sm:text-xl font-bold text-[#F3F0EA] leading-[1.35]">{v.title}</h3>
                <p className="keep-ko mt-3 text-[15px] leading-[1.8] text-[#8CADC8]/70">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 타임라인 */}
      {timeline.length > 0 && (
        <section className="max-w-[1200px] mx-auto px-5 sm:px-8 py-16 sm:py-24 border-t border-[#A9C5D9]/12">
          <span className="court-label block mb-3">Timeline</span>
          <h2 className="keep-ko text-3xl sm:text-[40px] font-black tracking-[-0.03em] text-[#F3F0EA] mb-12">걸어온 길</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {timeline.map((t: { year: string; event: string; detail: string }, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="court-card p-6 sm:p-8"
              >
                <p className="text-[48px] font-black tracking-[-0.04em] text-[#A9C5D9]/15 leading-none">{t.year}</p>
                <h3 className="keep-ko mt-2 text-base sm:text-lg font-bold text-[#F3F0EA]">{t.event}</h3>
                <p className="keep-ko mt-2 text-[14px] leading-[1.7] text-[#8CADC8]/70">{t.detail}</p>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="border-t border-[#A9C5D9]/12">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-16 sm:py-24 text-center">
          <span className="court-label block mb-4">Get Started</span>
          <h2 className="keep-ko text-3xl sm:text-[40px] font-black leading-[1.15] tracking-[-0.03em] text-[#F3F0EA]">artheus와 함께 시작하세요.</h2>
          <div className="w-16 h-0.5 bg-[#A9C5D9]/25 mx-auto my-6" />
          <p className="keep-ko text-base leading-[1.75] text-[#8CADC8]/70">인스타그램 DM으로 상담을 시작할 수 있습니다.</p>
          <div className="mt-8 flex justify-center">
            <InstagramConsultButton location="vision_cta" label="상담 문의하기" tone="on-blue" className="px-8 py-3.5 !bg-[#F3F0EA] !text-[#132B3F] hover:!bg-white" />
          </div>
        </div>
      </section>
    </div>
  );
}
