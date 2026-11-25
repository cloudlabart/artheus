import { motion } from 'motion/react';
import { useData, type Program } from '../contexts/DataContext';
import { InstagramConsultButton } from '../components/InstagramConsultButton';

function ProgramCard({ program, idx }: { program: Program; idx: number }) {
  const lines = program.content.split('\n').filter(Boolean);
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: (idx % 3) * 0.1, duration: 0.6 }}
      className="court-card overflow-hidden group hover:border-[#A9C5D9]/30 transition-all"
    >
      <div className={`h-1 ${program.category === 'ADMISSION' ? 'bg-[#F3F0EA]/30' : 'bg-[#A9C5D9]/30'}`} />
      <div className="p-6 sm:p-8">
        <div className="flex items-center justify-between mb-4">
          <span className="court-label">{program.category}</span>
          <span className="text-[48px] font-black tracking-[-0.04em] text-[#A9C5D9]/8 leading-none">0{idx + 1}</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black tracking-[-0.02em] text-[#F3F0EA]">{program.title}</h2>
        <p className="text-xs font-bold text-[#A9C5D9]/60 mt-0.5 uppercase tracking-wider">{program.tag}</p>
        <p className="keep-ko text-[15px] leading-[1.75] text-[#8CADC8]/80 mt-4 border-t border-[#A9C5D9]/10 pt-4">{program.description}</p>
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

export function ProgramsPage() {
  const { programs } = useData();
  const admission = programs.filter((p) => p.category === 'ADMISSION');
  const specialty = programs.filter((p) => p.category === 'SPECIALTY');

  return (
    <div className="min-h-screen text-[#F3F0EA]">
      {/* 히어로 — 패턴 콘셉트 배경 */}
      <section className="relative overflow-hidden min-h-[50vh] lg:min-h-[60vh] flex items-end">
        <img
          src="/uploads/20261124-105259-ARTHEUS_sport_08-llmo.png"
          alt="테니스공과 운동화 — artheus 캠페인"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A1F33] via-[#0A1F33]/50 to-transparent" />
        <div className="relative z-10 max-w-[1200px] mx-auto px-5 sm:px-8 pb-12 sm:pb-16 w-full">
          <span className="court-label block mb-4">Programs</span>
          <h1 className="keep-ko text-[36px] sm:text-[52px] lg:text-[64px] font-black leading-[1.05] tracking-[-0.04em] text-[#F3F0EA]">프로그램</h1>
          <p className="keep-ko mt-4 text-base sm:text-lg leading-[1.75] text-[#F3F0EA]/80 max-w-xl">입시반부터 전문 배우 과정까지, 목표에 맞는 클래스를 선택하세요.</p>
        </div>
      </section>

      {/* 입시 */}
      {admission.length > 0 && (
        <section className="max-w-[1200px] mx-auto px-5 sm:px-8 pt-14 sm:pt-20 pb-10">
          <div className="pb-6 border-b border-[#A9C5D9]/12">
            <span className="court-label block mb-2">Admission</span>
            <h2 className="keep-ko text-2xl sm:text-[36px] font-black tracking-[-0.03em] text-[#F3F0EA]">입시 과정</h2>
          </div>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {admission.map((p, i) => <ProgramCard key={p.id} program={p} idx={i} />)}
          </div>
        </section>
      )}

      {/* 전문 */}
      {specialty.length > 0 && (
        <section className="max-w-[1200px] mx-auto px-5 sm:px-8 pt-10 pb-14 sm:pb-20">
          <div className="pb-6 border-b border-[#A9C5D9]/12">
            <span className="court-label block mb-2">Specialty</span>
            <h2 className="keep-ko text-2xl sm:text-[36px] font-black tracking-[-0.03em] text-[#F3F0EA]">전문 과정</h2>
          </div>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {specialty.map((p, i) => <ProgramCard key={p.id} program={p} idx={admission.length + i} />)}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="border-t border-[#A9C5D9]/12">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-16 sm:py-24 text-center">
          <span className="court-label block mb-4">Get Started</span>
          <h2 className="keep-ko text-3xl sm:text-[40px] font-black leading-[1.15] tracking-[-0.03em] text-[#F3F0EA]">어떤 과정이 맞는지 모르겠다면</h2>
          <div className="w-16 h-0.5 bg-[#A9C5D9]/25 mx-auto my-6" />
          <p className="keep-ko text-base leading-[1.75] text-[#8CADC8]/70">목표와 현재 수준을 알려주시면 맞는 과정을 안내해 드립니다.</p>
          <div className="mt-8 flex justify-center">
            <InstagramConsultButton location="programs_cta" label="과정 상담하기" tone="on-blue" className="px-8 py-3.5 !bg-[#F3F0EA] !text-[#132B3F] hover:!bg-white" />
          </div>
        </div>
      </section>
    </div>
  );
}
