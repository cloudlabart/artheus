import { ArrowRight } from 'lucide-react';
import { INSTAGRAM_URL } from '../data/siteLinks';

/**
 * 상담 버튼 클릭 기록.
 * - 'outbound_click'(인스타그램 이동 클릭)만 기록하며 실제 문의·상담·등록 수로 집계하지 않습니다.
 * - gtag가 있으면 gtag만 호출해 dataLayer 이중 적재를 방지합니다.
 */
export function trackConsultClick(location: string) {
  try {
    const w = window as any;
    const payload = {
      click_location: location,
      action_type: 'outbound_click',
      destination: 'instagram_dm',
    };
    if (typeof w.gtag === 'function') {
      w.gtag('event', 'instagram_consult_click', payload);
    } else if (Array.isArray(w.dataLayer)) {
      w.dataLayer.push({ event: 'instagram_consult_click', ...payload });
    }
    window.dispatchEvent(new CustomEvent('artheus:consult-click', { detail: payload }));
  } catch {
    /* 분석 실패는 사용자 동작에 영향을 주지 않음 */
  }
}

/** 기존 페이지 버튼 형태를 유지한 채 인스타그램 상담 계정을 새 탭으로 여는 헬퍼 */
export function openInstagramConsult(location: string) {
  trackConsultClick(location);
  window.open(INSTAGRAM_URL, '_blank', 'noopener,noreferrer');
}

type Props = {
  location: string;
  label?: string;
  tone?: 'on-blue' | 'on-light';
  showArrow?: boolean;
  className?: string;
};

export function InstagramConsultButton({
  location,
  label = '내 연기 상담하기',
  tone = 'on-blue',
  showArrow = true,
  className = '',
}: Props) {
  const base =
    'inline-flex items-center justify-center gap-2.5 min-h-[48px] px-7 rounded-full text-base font-semibold ' +
    'transition-colors duration-200 ';
  const palette =
    tone === 'on-blue'
      ? 'bg-[#F3F0EA] text-[#153956] hover:bg-white'
      : 'bg-[#153956] text-[#F3F0EA] hover:bg-[#2D5E88]';
  return (
    <a
      href={INSTAGRAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackConsultClick(location)}
      className={`${base}${palette} ${className}`}
    >
      <span>{label}</span>
      {showArrow && <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />}
    </a>
  );
}
