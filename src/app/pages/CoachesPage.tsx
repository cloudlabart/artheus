import { useState } from 'react';
import { motion } from 'motion/react';
import { useData, type Coach } from '../contexts/DataContext';
import { InstagramConsultButton } from '../components/InstagramConsultButton';

const SPECIALTY_LABEL: Record<string, string> = { ACTING: '연기', MUSICAL: '뮤지컬', MOVEMENT: '무브먼트', VOCAL: '보컬' };

function CoachCard({ coach, idx }: { coach: Coach; idx: number }) {
  const [imgError, setImgError] = useState(false);
  const career: string[] = (() => {
    const raw = coach.career;
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string' && raw.trim()) return raw.split(/[\n/]/).map((s) => s.trim()).filter(Boolean);
    return [];
  })();
  const photoUrl = coach.photoUrl || '';
  const specialtyLabel = SPECIALTY_LABEL[coach.specialty ?? ''] || coach.specialty || '';

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: idx * 0.1, duration: 0.6 }}
      className="court-card overflow-hidden"
    >
      <div className="p-6 sm:p-8">
        <div className="flex items-center justify-between mb-5">
          <span className="court-label">{specialtyLabel} Coach</span>
          <span className="text-[48px] font-black tracking-[-0.04em] text-[#A9C5D9]/10 leading-none">0{idx + 1}</span>
        </div>
        <div className="flex items-center gap-5">
          {photoUrl && !imgError ? (
            <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-xl overflow-hidden shrink-0 border border-[#A9C5D9]/15">
              <img src={photoUrl} alt={`${coach.nameKo}`} className="w-full h-full object-cover object-[50%_15%]" onError={() => setImgError(true)} />
            </div>
          ) : (
            <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-xl shrink-0 bg-[#1A3A58] border border-[#A9C5D9]/15 flex items-center justify-center">
              <span className="text-2xl font-black text-[#F3F0EA]">{(coach.nameKo ?? '')[0]}</span>
            </div>
          )}
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#F3F0EA] tracking-[-0.02em]">{coach.nameKo}</h2>
            <p className="text-xs text-[#A9C5D9]/60 mt-1 tracking-wider uppercase">{coach.nameEn}</p>
          </div>
        </div>
        {coach.bio && <p className="keep-ko text-[15px] leading-[1.75] text-[#8CADC8]/80 mt-5 pt-5 border-t border-[#A9C5D9]/10">{coach.bio}</p>}
        {career.length > 0 && (
          <ul className="space-y-2.5 mt-4">
            {career.map((line) => (
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

export function CoachesPage() {
  const { coaches } = useData();
  const sorted = [...coaches].sort((a, b) => {
    const oa = typeof (a as any).displayOrder === 'number' ? (a as any).displayOrder : 99;
    const ob = typeof (b as any).displayOrder === 'number' ? (b as any).displayOrder : 99;
    return oa - ob;
  });

  return (
    <div className="min-h-screen text-[#F3F0EA]">
      {/* 히어로 — 캠페인 사진 배경 */}
      <section className="relative overflow-hidden min-h-[50vh] lg:min-h-[60vh] flex items-end">
        <img
          src="/uploads/20261124-105259-ARTHEUS_sport_10-dtkt.png"
          alt="라켓을 든 선수 — artheus 캠페인"
          className="absolute inset-0 w-full h-full object-cover object-top"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A1F33] via-[#0A1F33]/50 to-transparent" />
        <div className="relative z-10 max-w-[1200px] mx-auto px-5 sm:px-8 pb-12 sm:pb-16 w-full">
          <span className="court-label block mb-4">Coaches</span>
          <h1 className="keep-ko text-[36px] sm:text-[52px] lg:text-[64px] font-black leading-[1.05] tracking-[-0.04em] text-[#F3F0EA]">코치진</h1>
          <p className="keep-ko mt-4 text-base sm:text-lg leading-[1.75] text-[#F3F0EA]/80 max-w-xl">현장 출신 전문 강사진이 각자의 영역에서 함께합니다.</p>
        </div>
      </section>

      {/* 카드 */}
      <section className="max-w-[1200px] mx-auto px-5 sm:px-8 py-14 sm:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {sorted.map((coach, idx) => <CoachCard key={coach.id} coach={coach} idx={idx} />)}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[#A9C5D9]/12">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-16 sm:py-24 text-center">
          <span className="court-label block mb-4">Get Started</span>
          <h2 className="keep-ko text-3xl sm:text-[40px] font-black leading-[1.15] tracking-[-0.03em] text-[#F3F0EA]">코치진과 직접 상담하세요.</h2>
          <div className="w-16 h-0.5 bg-[#A9C5D9]/25 mx-auto my-6" />
          <p className="keep-ko text-base leading-[1.75] text-[#8CADC8]/70">인스타그램 DM으로 궁금한 점을 보내주세요.</p>
          <div className="mt-8 flex justify-center">
            <InstagramConsultButton location="coaches_cta" label="상담 문의하기" tone="on-blue" className="px-8 py-3.5 !bg-[#F3F0EA] !text-[#132B3F] hover:!bg-white" />
          </div>
        </div>
      </section>
    </div>
  );
}
