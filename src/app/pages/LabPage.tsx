import { motion } from 'motion/react';
import { useData, type LabItem } from '../contexts/DataContext';
import { InstagramConsultButton } from '../components/InstagramConsultButton';

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: 'bg-[#F3F0EA]/15 text-[#F3F0EA]',
  BETA: 'bg-[#A9C5D9]/15 text-[#A9C5D9]',
};
const CATEGORY_LABEL: Record<string, string> = { VOCAL: '보컬', SPACE: '공간', MOVEMENT: '무브먼트', TEXT: '텍스트' };

function LabCard({ item, idx }: { item: LabItem; idx: number }) {
  const lines = item.content.split('\n').filter(Boolean);
  const statusStyle = STATUS_STYLE[item.status] || STATUS_STYLE.ACTIVE;
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: (idx % 2) * 0.1, duration: 0.6 }}
      className="court-card overflow-hidden"
    >
      <div className="p-6 sm:p-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black tracking-[0.14em] px-2.5 py-1 rounded-full uppercase ${statusStyle}`}>{item.status}</span>
            <span className="court-label">{CATEGORY_LABEL[item.category] || item.category}</span>
          </div>
          <span className="text-[48px] font-black tracking-[-0.04em] text-[#A9C5D9]/8 leading-none">0{idx + 1}</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black tracking-[-0.02em] text-[#F3F0EA]">{item.title}</h2>
        <p className="keep-ko text-[15px] leading-[1.75] text-[#8CADC8]/80 mt-4 border-t border-[#A9C5D9]/10 pt-4">{item.description}</p>
        {lines.length > 0 && (
          <ul className="space-y-2 mt-4">
            {lines.map((line) => (
              <li key={line} className="keep-ko text-[14px] leading-[1.65] text-[#8CADC8]/60 flex items-start gap-3">
                <span aria-hidden="true" className="mt-2 w-4 h-px bg-[#A9C5D9]/30 shrink-0" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.article>
  );
}

export function LabPage() {
  const { lab } = useData();
  const active = lab.filter((i) => i.status === 'ACTIVE');
  const beta = lab.filter((i) => i.status !== 'ACTIVE');

  return (
    <div className="min-h-screen text-[#F3F0EA]">
      {/* 히어로 — 하늘과 코트의 리듬 */}
      <section className="relative overflow-hidden min-h-[50vh] lg:min-h-[60vh] flex items-end">
        <img
          src="/uploads/20261124-105219-아르테우스-하늘과-코트의-리듬-g8vm.png"
          alt="아터스, 하늘과 코트의 리듬 — LAB 비주얼"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A1F33] via-[#0A1F33]/50 to-transparent" />
        <div className="relative z-10 max-w-[1200px] mx-auto px-5 sm:px-8 pb-12 sm:pb-16 w-full">
          <span className="court-label block mb-4">Lab</span>
          <h1 className="keep-ko text-[36px] sm:text-[52px] lg:text-[64px] font-black leading-[1.05] tracking-[-0.04em] text-[#F3F0EA]">LAB</h1>
          <p className="keep-ko mt-4 text-base sm:text-lg leading-[1.75] text-[#F3F0EA]/80 max-w-xl">연기·신체·목소리를 과학적으로 연구하는 artheus의 실험실입니다.</p>
        </div>
      </section>

      {/* Active */}
      {active.length > 0 && (
        <section className="max-w-[1200px] mx-auto px-5 sm:px-8 pt-14 sm:pt-20 pb-10">
          <div className="pb-6 border-b border-[#A9C5D9]/12">
            <span className="court-label block mb-2">Active</span>
            <h2 className="keep-ko text-2xl sm:text-[36px] font-black tracking-[-0.03em] text-[#F3F0EA]">운영 중인 LAB</h2>
          </div>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {active.map((item, i) => <LabCard key={item.id} item={item} idx={i} />)}
          </div>
        </section>
      )}

      {/* Beta */}
      {beta.length > 0 && (
        <section className="max-w-[1200px] mx-auto px-5 sm:px-8 pt-10 pb-14 sm:pb-20">
          <div className="pb-6 border-b border-[#A9C5D9]/12">
            <span className="court-label block mb-2">Coming Soon</span>
            <h2 className="keep-ko text-2xl sm:text-[36px] font-black tracking-[-0.03em] text-[#F3F0EA]">준비 중인 LAB</h2>
          </div>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {beta.map((item, i) => <LabCard key={item.id} item={item} idx={active.length + i} />)}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="border-t border-[#A9C5D9]/12">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-16 sm:py-24 text-center">
          <span className="court-label block mb-4">Get Started</span>
          <h2 className="keep-ko text-3xl sm:text-[40px] font-black leading-[1.15] tracking-[-0.03em] text-[#F3F0EA]">LAB에 대해 더 알고 싶다면</h2>
          <div className="w-16 h-0.5 bg-[#A9C5D9]/25 mx-auto my-6" />
          <p className="keep-ko text-base leading-[1.75] text-[#8CADC8]/70">인스타그램 DM으로 문의해 주세요.</p>
          <div className="mt-8 flex justify-center">
            <InstagramConsultButton location="lab_cta" label="문의하기" tone="on-blue" className="px-8 py-3.5 !bg-[#F3F0EA] !text-[#132B3F] hover:!bg-white" />
          </div>
        </div>
      </section>
    </div>
  );
}
