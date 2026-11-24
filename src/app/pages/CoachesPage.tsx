import { useState } from 'react';
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
    <article className="rounded-2xl border border-[#153956]/15 overflow-hidden bg-[#FAF8F4]">
      <div className="bg-[#132B3F] text-white p-6 sm:p-8">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-black tracking-[0.2em] text-[#A9C5D9] uppercase">{specialtyLabel} Coach</span>
          <span className="text-[48px] font-black tracking-[-0.04em] text-white/10 leading-none">0{idx + 1}</span>
        </div>
        <div className="flex items-center gap-5">
          {photoUrl && !imgError ? (
            <div className="artheus-photo-frame w-20 h-24 sm:w-24 sm:h-28 rounded-xl overflow-hidden shrink-0 border border-white/15">
              <img src={photoUrl} alt={`${coach.nameKo}`} className="w-full h-full object-cover object-[50%_15%]" onError={() => setImgError(true)} />
            </div>
          ) : (
            <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-xl shrink-0 bg-[#214B70] border border-white/15 flex items-center justify-center">
              <span className="text-2xl font-black text-white">{(coach.nameKo ?? '')[0]}</span>
            </div>
          )}
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-[-0.02em]">{coach.nameKo}</h2>
            <p className="text-xs text-[#A9C5D9] mt-1 tracking-wider uppercase">{coach.nameEn}</p>
          </div>
        </div>
      </div>
      <div className="p-6 sm:p-8">
        {coach.bio && <p className="keep-ko text-[15px] leading-[1.75] text-[#35526B] mb-4">{coach.bio}</p>}
        {career.length > 0 && (
          <ul className="space-y-2.5 border-t border-[#153956]/12 pt-4">
            {career.map((line) => (
              <li key={line} className="keep-ko text-[14px] leading-[1.65] text-[#132B3F] flex items-start gap-3">
                <span aria-hidden="true" className="mt-2 w-4 h-px bg-[#2D5E88] shrink-0" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
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
    <div className="min-h-screen bg-[#F3F0EA] text-[#132B3F]">
      <section className="relative overflow-hidden bg-[#132B3F] text-white">
        <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
          <span className="text-[clamp(8rem,25vw,28rem)] font-black leading-[0.8] tracking-[-0.06em] text-white/[0.03] whitespace-nowrap" style={{ fontFamily: "'Syne', 'DM Sans', sans-serif" }}>COACHES</span>
        </div>
        <div className="max-w-[1360px] mx-auto px-5 sm:px-8 py-16 sm:py-24 relative z-10">
          <p className="text-[10px] font-black tracking-[0.2em] text-[#A9C5D9] uppercase mb-4">Coaches</p>
          <h1 className="keep-ko text-[36px] sm:text-[52px] lg:text-[64px] font-black leading-[1.05] tracking-[-0.04em] text-white">코치진</h1>
          <p className="keep-ko mt-4 text-base sm:text-lg leading-[1.75] text-[#DCE9F2]/80 max-w-xl">현장 출신 전문 강사진이 각자의 영역에서 함께합니다.</p>
        </div>
      </section>

      <section className="max-w-[1360px] mx-auto px-5 sm:px-8 py-14 sm:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {sorted.map((coach, idx) => <CoachCard key={coach.id} coach={coach} idx={idx} />)}
        </div>
      </section>

      <section className="bg-[#132B3F] text-white">
        <div className="max-w-[1360px] mx-auto px-5 sm:px-8 py-16 sm:py-24 text-center">
          <p className="text-[10px] font-black tracking-[0.2em] text-[#A9C5D9] uppercase mb-4">Get Started</p>
          <h2 className="keep-ko text-3xl sm:text-[40px] font-black leading-[1.15] tracking-[-0.03em] text-white">코치진과 직접 상담하세요.</h2>
          <div className="w-16 h-0.5 bg-[#A9C5D9]/40 mx-auto my-6" />
          <p className="keep-ko text-base leading-[1.75] text-[#DCE9F2]/80">인스타그램 DM으로 궁금한 점을 보내주세요.</p>
          <div className="mt-8 flex justify-center">
            <InstagramConsultButton location="coaches_cta" label="상담 문의하기" tone="on-blue" className="px-8 py-3.5" />
          </div>
        </div>
      </section>
    </div>
  );
}
