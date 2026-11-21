/**
 * 아직 원본 코드를 가져오지 않은 페이지의 자리표시 화면.
 * 메뉴·라우팅이 끝까지 동작하도록 같은 디자인 톤으로 제목만 보여줍니다.
 */
import { ArrowLeft } from 'lucide-react';
import { go } from '../nav';

type Props = { title: string; eyebrow: string; desc: string; onBack?: () => void };

export function Placeholder({ title, eyebrow, desc, onBack }: Props) {
  return (
    <section className="max-w-[1140px] mx-auto px-5 sm:px-8 py-16 sm:py-24 min-h-[60vh]">
      {onBack && (
        <button onClick={onBack} className="mb-8 inline-flex items-center gap-1.5 text-sm font-semibold text-[#153956] hover:text-[#2D5E88]">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" /> 목록으로
        </button>
      )}
      <p className="text-xs font-semibold tracking-[0.16em] text-[#2D5E88] uppercase mb-3">{eyebrow}</p>
      <h1 className="keep-ko text-3xl sm:text-[44px] font-bold tracking-[-0.02em] text-[#132B3F] leading-[1.2]">{title}</h1>
      <p className="keep-ko mt-4 text-base sm:text-lg leading-[1.7] text-[#35526B] max-w-2xl">{desc}</p>
      <div className="mt-10 rounded-2xl border border-dashed border-[#153956]/25 bg-[#FAF8F4] p-6 sm:p-8 text-[15px] text-[#466075] keep-ko">
        이 페이지는 새로 만들 자리입니다. <code className="text-[#153956]">src/app/pages/</code>에 페이지 파일을 만들고
        <code className="text-[#153956]"> src/app/App.tsx</code>의 연결을 바꾸면 됩니다.
        <div className="mt-5">
          <button onClick={() => go('home')} className="inline-flex items-center min-h-[44px] px-6 rounded-full bg-[#153956] text-[#F3F0EA] text-sm font-semibold hover:bg-[#2D5E88]">
            홈으로
          </button>
        </div>
      </div>
    </section>
  );
}
