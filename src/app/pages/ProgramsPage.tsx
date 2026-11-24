import { useData, type Program } from '../contexts/DataContext';
import { InstagramConsultButton } from '../components/InstagramConsultButton';

function ProgramCard({ program, idx }: { program: Program; idx: number }) {
  const lines = program.content.split('\n').filter(Boolean);
  return (
    <article className="rounded-2xl border border-[#153956]/15 bg-[#FAF8F4] overflow-hidden group hover:border-[#153956] transition-all">
      <div className={`h-1.5 ${program.category === 'ADMISSION' ? 'bg-[#132B3F]' : 'bg-[#2D5E88]'}`} />
      <div className="p-6 sm:p-8">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-black tracking-[0.2em] text-[#2D5E88] uppercase">{program.category}</span>
          <span className="text-[48px] font-black tracking-[-0.04em] text-[#153956]/8 leading-none">0{idx + 1}</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black tracking-[-0.02em] text-[#132B3F]">{program.title}</h2>
        <p className="text-xs font-bold text-[#2D5E88] mt-0.5 uppercase tracking-wider">{program.tag}</p>
        <p className="keep-ko text-[15px] leading-[1.75] text-[#35526B] mt-4 border-t border-[#153956]/12 pt-4">{program.description}</p>
        {lines.length > 0 && (
          <ul className="space-y-2 mt-4">
            {lines.map((line) => (
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

export function ProgramsPage() {
  const { programs } = useData();
  const admission = programs.filter((p) => p.category === 'ADMISSION');
  const specialty = programs.filter((p) => p.category === 'SPECIALTY');

  return (
    <div className="min-h-screen bg-[#F3F0EA] text-[#132B3F]">
      <section className="relative overflow-hidden bg-[#132B3F] text-white">
        <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
          <span className="text-[clamp(6rem,20vw,24rem)] font-black leading-[0.8] tracking-[-0.06em] text-white/[0.03] whitespace-nowrap" style={{ fontFamily: "'Syne', 'DM Sans', sans-serif" }}>PROGRAMS</span>
        </div>
        <div className="max-w-[1360px] mx-auto px-5 sm:px-8 py-16 sm:py-24 relative z-10">
          <p className="text-[10px] font-black tracking-[0.2em] text-[#A9C5D9] uppercase mb-4">Programs</p>
          <h1 className="keep-ko text-[36px] sm:text-[52px] lg:text-[64px] font-black leading-[1.05] tracking-[-0.04em] text-white">프로그램</h1>
          <p className="keep-ko mt-4 text-base sm:text-lg leading-[1.75] text-[#DCE9F2]/80 max-w-xl">입시반부터 전문 배우 과정까지, 목표에 맞는 클래스를 선택하세요.</p>
        </div>
      </section>

      {admission.length > 0 && (
        <section className="max-w-[1360px] mx-auto px-5 sm:px-8 pt-14 sm:pt-20 pb-10">
          <div className="pb-6 border-b border-[#153956]/15">
            <p className="text-[10px] font-black tracking-[0.2em] text-[#2D5E88] uppercase mb-2">Admission</p>
            <h2 className="keep-ko text-2xl sm:text-[36px] font-black tracking-[-0.03em] text-[#132B3F]">입시 과정</h2>
          </div>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {admission.map((p, i) => <ProgramCard key={p.id} program={p} idx={i} />)}
          </div>
        </section>
      )}

      {specialty.length > 0 && (
        <section className="max-w-[1360px] mx-auto px-5 sm:px-8 pt-10 pb-14 sm:pb-20">
          <div className="pb-6 border-b border-[#153956]/15">
            <p className="text-[10px] font-black tracking-[0.2em] text-[#2D5E88] uppercase mb-2">Specialty</p>
            <h2 className="keep-ko text-2xl sm:text-[36px] font-black tracking-[-0.03em] text-[#132B3F]">전문 과정</h2>
          </div>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {specialty.map((p, i) => <ProgramCard key={p.id} program={p} idx={admission.length + i} />)}
          </div>
        </section>
      )}

      <section className="bg-[#132B3F] text-white">
        <div className="max-w-[1360px] mx-auto px-5 sm:px-8 py-16 sm:py-24 text-center">
          <p className="text-[10px] font-black tracking-[0.2em] text-[#A9C5D9] uppercase mb-4">Get Started</p>
          <h2 className="keep-ko text-3xl sm:text-[40px] font-black leading-[1.15] tracking-[-0.03em] text-white">어떤 과정이 맞는지 모르겠다면</h2>
          <div className="w-16 h-0.5 bg-[#A9C5D9]/40 mx-auto my-6" />
          <p className="keep-ko text-base leading-[1.75] text-[#DCE9F2]/80">목표와 현재 수준을 알려주시면 맞는 과정을 안내해 드립니다.</p>
          <div className="mt-8 flex justify-center">
            <InstagramConsultButton location="programs_cta" label="과정 상담하기" tone="on-blue" className="px-8 py-3.5" />
          </div>
        </div>
      </section>
    </div>
  );
}
