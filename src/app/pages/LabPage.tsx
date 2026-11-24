import { useData, type LabItem } from '../contexts/DataContext';
import { InstagramConsultButton } from '../components/InstagramConsultButton';

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: 'bg-[#132B3F] text-[#F3F0EA]',
  BETA: 'bg-[#2D5E88]/20 text-[#153956]',
};
const CATEGORY_LABEL: Record<string, string> = { VOCAL: '보컬', SPACE: '공간', MOVEMENT: '무브먼트', TEXT: '텍스트' };

function LabCard({ item, idx }: { item: LabItem; idx: number }) {
  const lines = item.content.split('\n').filter(Boolean);
  const statusStyle = STATUS_STYLE[item.status] || STATUS_STYLE.ACTIVE;
  return (
    <article className="rounded-2xl border border-[#153956]/15 bg-[#FAF8F4] overflow-hidden">
      <div className="p-6 sm:p-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black tracking-[0.14em] px-2.5 py-1 rounded-full uppercase ${statusStyle}`}>{item.status}</span>
            <span className="text-[10px] font-black tracking-[0.14em] text-[#2D5E88] uppercase">{CATEGORY_LABEL[item.category] || item.category}</span>
          </div>
          <span className="text-[48px] font-black tracking-[-0.04em] text-[#153956]/8 leading-none">0{idx + 1}</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black tracking-[-0.02em] text-[#132B3F]">{item.title}</h2>
        <p className="keep-ko text-[15px] leading-[1.75] text-[#35526B] mt-4 border-t border-[#153956]/12 pt-4">{item.description}</p>
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

export function LabPage() {
  const { lab } = useData();
  const active = lab.filter((i) => i.status === 'ACTIVE');
  const beta = lab.filter((i) => i.status !== 'ACTIVE');

  return (
    <div className="min-h-screen bg-[#F3F0EA] text-[#132B3F]">
      <section className="relative overflow-hidden bg-[#132B3F] text-white">
        <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
          <span className="text-[clamp(10rem,30vw,32rem)] font-black leading-[0.8] tracking-[-0.06em] text-white/[0.03] whitespace-nowrap" style={{ fontFamily: "'Syne', 'DM Sans', sans-serif" }}>LAB</span>
        </div>
        <div className="max-w-[1360px] mx-auto px-5 sm:px-8 py-16 sm:py-24 relative z-10">
          <p className="text-[10px] font-black tracking-[0.2em] text-[#A9C5D9] uppercase mb-4">Lab</p>
          <h1 className="keep-ko text-[36px] sm:text-[52px] lg:text-[64px] font-black leading-[1.05] tracking-[-0.04em] text-white">LAB</h1>
          <p className="keep-ko mt-4 text-base sm:text-lg leading-[1.75] text-[#DCE9F2]/80 max-w-xl">연기·신체·목소리를 과학적으로 연구하는 artheus의 실험실입니다.</p>
        </div>
      </section>

      {active.length > 0 && (
        <section className="max-w-[1360px] mx-auto px-5 sm:px-8 pt-14 sm:pt-20 pb-10">
          <div className="pb-6 border-b border-[#153956]/15">
            <p className="text-[10px] font-black tracking-[0.2em] text-[#2D5E88] uppercase mb-2">Active</p>
            <h2 className="keep-ko text-2xl sm:text-[36px] font-black tracking-[-0.03em] text-[#132B3F]">운영 중인 LAB</h2>
          </div>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {active.map((item, i) => <LabCard key={item.id} item={item} idx={i} />)}
          </div>
        </section>
      )}

      {beta.length > 0 && (
        <section className="max-w-[1360px] mx-auto px-5 sm:px-8 pt-10 pb-14 sm:pb-20">
          <div className="pb-6 border-b border-[#153956]/15">
            <p className="text-[10px] font-black tracking-[0.2em] text-[#2D5E88] uppercase mb-2">Coming Soon</p>
            <h2 className="keep-ko text-2xl sm:text-[36px] font-black tracking-[-0.03em] text-[#132B3F]">준비 중인 LAB</h2>
          </div>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {beta.map((item, i) => <LabCard key={item.id} item={item} idx={active.length + i} />)}
          </div>
        </section>
      )}

      <section className="bg-[#132B3F] text-white">
        <div className="max-w-[1360px] mx-auto px-5 sm:px-8 py-16 sm:py-24 text-center">
          <p className="text-[10px] font-black tracking-[0.2em] text-[#A9C5D9] uppercase mb-4">Get Started</p>
          <h2 className="keep-ko text-3xl sm:text-[40px] font-black leading-[1.15] tracking-[-0.03em] text-white">LAB에 대해 더 알고 싶다면</h2>
          <div className="w-16 h-0.5 bg-[#A9C5D9]/40 mx-auto my-6" />
          <p className="keep-ko text-base leading-[1.75] text-[#DCE9F2]/80">인스타그램 DM으로 문의해 주세요.</p>
          <div className="mt-8 flex justify-center">
            <InstagramConsultButton location="lab_cta" label="문의하기" tone="on-blue" className="px-8 py-3.5" />
          </div>
        </div>
      </section>
    </div>
  );
}
