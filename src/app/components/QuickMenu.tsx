import { useState } from 'react';
import { INSTAGRAM_URL } from '../data/siteLinks';
import { trackConsultClick } from './InstagramConsultButton';

const ITEMS = [
  {
    id: 'consult',
    label: '연기 상담',
    href: INSTAGRAM_URL,
    location: 'quick_menu_consult',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <rect x="2" y="3" width="20" height="14" rx="3" fill="#A9C5D9" opacity="0.15"/>
        <rect x="2" y="3" width="20" height="14" rx="3" stroke="#A9C5D9" strokeWidth="1.5"/>
        <path d="M7 8h10M7 12h6" stroke="#A9C5D9" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M6 17l-3 4" stroke="#A9C5D9" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'insta',
    label: 'INSTA',
    href: 'https://www.instagram.com/artheus_act/',
    location: 'quick_menu_insta',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6">
        <rect x="2" y="2" width="20" height="20" rx="6" fill="#A9C5D9" opacity="0.12"/>
        <rect x="2" y="2" width="20" height="20" rx="6" stroke="#A9C5D9" strokeWidth="1.5" fill="none"/>
        <circle cx="12" cy="12" r="4" stroke="#A9C5D9" strokeWidth="1.5" fill="none"/>
        <circle cx="17.5" cy="6.5" r="1" fill="#A9C5D9"/>
      </svg>
    ),
  },
];

export function QuickMenu() {
  const [activeId, setActiveId] = useState('consult');

  return (
    <div className="hidden lg:flex fixed right-5 2xl:right-8 top-1/2 -translate-y-1/2 z-40 flex-col items-center gap-2.5">
      {ITEMS.map((item) => {
        const isActive = activeId === item.id;
        const inner = (
          <div
            onClick={() => setActiveId(item.id)}
            className="w-[68px] h-[68px] rounded-2xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors duration-200 select-none backdrop-blur-md"
            style={{
              background: 'rgba(21, 57, 86, 0.4)',
              border: `1px solid ${isActive ? 'rgba(243,240,234,0.3)' : 'rgba(243,240,234,0.1)'}`,
            }}
          >
            {item.icon}
            <span
              className="text-[10px] font-semibold leading-none"
              style={{ color: isActive ? '#F3F0EA' : '#8CADC8' }}
            >
              {item.label}
            </span>
          </div>
        );

        return (
          <a
            key={item.id}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackConsultClick(item.location)}
          >
            {inner}
          </a>
        );
      })}

      {/* 페이지네이션 닷 */}
      <div className="flex gap-1.5 mt-1">
        {ITEMS.map((item) => (
          <button
            key={item.id}
            aria-label={item.label}
            onClick={() => setActiveId(item.id)}
            className="transition-all duration-300"
            style={{
              width: activeId === item.id ? 16 : 6,
              height: 6,
              borderRadius: 3,
              background: activeId === item.id ? '#A9C5D9' : 'rgba(169,197,217,0.3)',
            }}
          />
        ))}
      </div>

      {/* artheus */}
      <div
        className="mt-2 text-[8px] font-black tracking-[0.2em]"
        style={{
          color: 'rgba(169,197,217,0.4)',
          writingMode: 'vertical-rl',
          transform: 'rotate(180deg)',
          letterSpacing: '0.25em',
        }}
      >
        artheus
      </div>
    </div>
  );
}
