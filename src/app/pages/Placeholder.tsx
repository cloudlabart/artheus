/**
 * 아직 원본 코드를 가져오지 않은 페이지의 자리표시 화면.
 * 코트 콘셉트에 맞는 어두운 배경 위 밝은 텍스트.
 */
import { ArrowLeft } from 'lucide-react';
import { go } from '../nav';

type Props = { title: string; eyebrow: string; desc: string; onBack?: () => void };

export function Placeholder({ title, eyebrow, desc, onBack }: Props) {
  return (
    <section className="max-w-[1140px] mx-auto px-5 sm:px-8 py-16 sm:py-24 min-h-[60vh] pt-24 lg:pt-28 relative z-10">
      {onBack && (
        <button onClick={onBack} className="mb-8 inline-flex items-center gap-1.5 text-sm font-semibold text-[#A9C5D9] hover:text-[#F3F0EA]">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" /> 목록으로
        </button>
      )}
      <p className="text-xs font-semibold tracking-[0.16em] text-[#A9C5D9]/70 uppercase mb-3">{eyebrow}</p>
      <h1 className="keep-ko text-3xl sm:text-[44px] font-bold tracking-[-0.02em] text-[#F3F0EA] leading-[1.2]">{title}</h1>
      <p className="keep-ko mt-4 text-base sm:text-lg leading-[1.7] text-[#8CADC8] max-w-2xl">{desc}</p>
      <div className="mt-10 court-card p-6 sm:p-8 text-[15px] text-[#8CADC8] keep-ko">
        이 페이지는 새로 만들 자리입니다. <code className="text-[#A9C5D9]">src/app/pages/</code>에 페이지 파일을 만들고
        <code className="text-[#A9C5D9]"> src/app/App.tsx</code>의 연결을 바꾸면 됩니다.
        <div className="mt-5">
          <button onClick={() => go('home')} className="inline-flex items-center min-h-[44px] px-6 rounded-full bg-[#F3F0EA] text-[#132B3F] text-sm font-semibold hover:bg-white transition-colors">
            홈으로
          </button>
        </div>
      </div>
    </section>
  );
}
