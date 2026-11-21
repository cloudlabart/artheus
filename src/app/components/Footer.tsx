import { INSTAGRAM_URL, INSTAGRAM_HANDLE } from '../data/siteLinks';
import { trackConsultClick } from './InstagramConsultButton';
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useSiteContent } from '../hooks/useSiteContent';
import { go } from '../nav';

const NAV_LINKS = [
  ['lab', 'LAB'],
  ['programs', 'Programs'],
  ['coaches', 'Coaches'],
  ['zine', 'Zine'],
  ['column', 'Column'],
  ['contact', 'Contact'],
] as const;

export function Footer() {
  const { content } = useSiteContent();
  const navigate = useNavigate();
  const [clickCount, setClickCount] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 연속 클릭을 기다린 뒤에만 홈으로 이동 (즉시 이동하면 푸터가 사라져 3회 클릭이 불가능)
  const handleLogoClick = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (newCount >= 3) {
      navigate('/admin');
      setClickCount(0);
      return;
    }
    timeoutRef.current = setTimeout(() => {
      setClickCount(0);
      go('home');
      navigate('/');
      window.scrollTo(0, 0);
    }, 1500);
  };

  return (
    <footer className="footer-bg border-t border-[#153956]/10 text-[#132B3F]">
      <div className="max-w-[1470px] mx-auto px-4 sm:px-8 py-16 sm:py-20">

        {/* 상단: 로고 + 네비 */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10 mb-14">

          {/* 브랜드 */}
          <div className="flex-shrink-0">
            <button
              onClick={handleLogoClick}
              className="flex flex-col text-sm font-black leading-tight text-[#132B3F] mb-2 cursor-pointer select-none hover:text-[#2D5E88] transition-colors duration-200"
              title={clickCount > 0 ? `${clickCount}/3` : ''}
            >
              <span>artheus</span>
            </button>
            <p className="text-xs text-[#4A6276] mb-3">연기 전공자 · 연극영화과 입시생을 위한 artheus</p>
            <p className="text-xs text-[#5B7285]">사업자등록번호 810-90-02139</p>
          </div>

          {/* 네비 그리드 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-10">

            {/* EXPLORE */}
            <div>
              <p className="text-[10px] font-bold tracking-[0.22em] text-[#2D5E88] uppercase mb-4">EXPLORE</p>
              <nav className="flex flex-col gap-2.5">
                {NAV_LINKS.map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => go(key as any)}
                    className="text-sm text-[#35526B] hover:text-[#153956] transition-colors duration-200 text-left"
                  >
                    {label}
                  </button>
                ))}
              </nav>
            </div>

            {/* CONTACT */}
            <div>
              <p className="text-[10px] font-bold tracking-[0.22em] text-[#2D5E88] uppercase mb-4">STUDIO &amp; CONTACT</p>
              <div className="flex flex-col gap-2.5">
                <p className="text-sm font-medium text-[#132B3F]">홍대 스튜디오</p>
                <a
                  href={`mailto:${content.contact_email}`}
                  className="text-sm text-[#35526B] hover:text-[#153956] transition-colors duration-200 break-all"
                >
                  {content.contact_email}
                </a>
                <a
                  href={`tel:${(content.contact_phone || '').replace(/-/g, '')}`}
                  className="text-sm text-[#35526B] hover:text-[#153956] transition-colors duration-200"
                >
                  {content.contact_phone}
                </a>
              </div>
            </div>

            {/* SOCIAL */}
            <div>
              <p className="text-[10px] font-bold tracking-[0.22em] text-[#2D5E88] uppercase mb-4">CONSULT</p>
              <div className="flex flex-col gap-2.5">
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackConsultClick('footer_instagram')}
                  className="text-sm text-[#35526B] hover:text-[#153956] transition-colors duration-200"
                >
                  Instagram ({INSTAGRAM_HANDLE})
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 바 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-6 border-t border-[#153956]/10">
          <p className="text-xs text-[#5B7285]">
            © 2026 artheus. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin')}
              className="text-xs text-[#5B7285] hover:text-[#153956] transition-colors"
            >
              관리자
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
}
