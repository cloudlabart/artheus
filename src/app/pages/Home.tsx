/**
 * Home — 코트 라인이 레이아웃 구조 자체인 랜딩 페이지
 *
 * 시안 참고: ART FACTORY 스타일 풀스크린 히어로 + 하단 번호 네비 카드
 * 코트 라인(실제 div)이 스크롤에 따라 이동하며 구조를 변환.
 * ARTHEUS 심볼·워드마크 사용.
 */
import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { go } from '../nav';
import { InstagramConsultButton } from '../components/InstagramConsultButton';

/* 하단 네비 카드 데이터 */
const NAV_CARDS = [
  { num: '01', label: 'Vision', desc: '비전과 방향', key: 'vision' },
  { num: '02', label: 'Program', desc: '입시 · 성인 · 전문', key: 'programs' },
  { num: '03', label: 'Coaches', desc: '코치진 소개', key: 'coaches' },
  { num: '04', label: 'LAB', desc: '연구와 워크숍', key: 'lab' },
  { num: '05', label: 'Contact', desc: '상담 · 문의', key: 'contact' },
] as const;

export function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });

  /* ── 코트 라인 애니메이션 ── */
  const borderInset = useTransform(scrollYProgress, [0, 0.2, 0.6, 1], [5, 3, 1.5, 0]);
  const borderOpacity = useTransform(scrollYProgress, [0, 0.15], [0.9, 0.5]);

  // 네트 (수평 중앙) → 위로 올라감
  const netY = useTransform(scrollYProgress, [0, 0.25, 0.6, 1], ['50%', '38%', '22%', '12%']);
  const netOpacity = useTransform(scrollYProgress, [0, 0.4, 0.8], [0.35, 0.25, 0.1]);

  // 센터 수직선 → 왼쪽으로 이동
  const centerX = useTransform(scrollYProgress, [0, 0.35, 0.8], ['50%', '35%', '18%']);
  const centerOpacity = useTransform(scrollYProgress, [0, 0.6], [0.3, 0.1]);

  // 서비스 박스선
  const svcTopY = useTransform(scrollYProgress, [0, 0.25, 0.5], ['35%', '26%', '0%']);
  const svcBotY = useTransform(scrollYProgress, [0, 0.25, 0.5], ['65%', '74%', '100%']);
  const svcOpacity = useTransform(scrollYProgress, [0, 0.2, 0.45], [0.22, 0.28, 0]);

  // 나중에 나타나는 그리드선
  const gridVX = useTransform(scrollYProgress, [0.35, 0.65, 1], ['75%', '62%', '50%']);
  const gridVOpacity = useTransform(scrollYProgress, [0.35, 0.55, 0.9], [0, 0.18, 0.08]);
  const gridHY = useTransform(scrollYProgress, [0.45, 0.75], ['78%', '58%']);
  const gridHOpacity = useTransform(scrollYProgress, [0.45, 0.65, 0.95], [0, 0.18, 0.06]);

  // 대각선
  const diagOpacity = useTransform(scrollYProgress, [0, 0.18, 0.4], [0.1, 0.06, 0]);

  return (
    <div ref={containerRef} className="court-page relative text-[#F3F0EA]">

      {/* ═══ 코트 라인 시스템 (fixed, 모든 섹션에 걸쳐 존재) ═══ */}
      <div className="fixed inset-0 z-[1] pointer-events-none overflow-hidden">
        {/* 외곽 */}
        <motion.div
          className="absolute border border-[#A9C5D9]/20"
          style={{
            top: useTransform(borderInset, v => `${v}%`),
            left: useTransform(borderInset, v => `${v}%`),
            right: useTransform(borderInset, v => `${v}%`),
            bottom: useTransform(borderInset, v => `${v}%`),
            opacity: borderOpacity,
          }}
        />
        {/* 네트 (수평) */}
        <motion.div className="absolute left-0 right-0 h-px bg-[#A9C5D9]" style={{ top: netY, opacity: netOpacity }} />
        {/* 센터 (수직) */}
        <motion.div className="absolute top-0 bottom-0 w-px bg-[#A9C5D9]" style={{ left: centerX, opacity: centerOpacity }} />
        {/* 서비스 박스 상 */}
        <motion.div className="absolute h-px bg-[#A9C5D9]" style={{ top: svcTopY, left: '18%', right: '18%', opacity: svcOpacity }} />
        {/* 서비스 박스 하 */}
        <motion.div className="absolute h-px bg-[#A9C5D9]" style={{ top: svcBotY, left: '18%', right: '18%', opacity: svcOpacity }} />
        {/* 그리드 수직 */}
        <motion.div className="absolute top-0 bottom-0 w-px bg-[#A9C5D9]" style={{ left: gridVX, opacity: gridVOpacity }} />
        {/* 그리드 수평 */}
        <motion.div className="absolute left-0 right-0 h-px bg-[#A9C5D9]" style={{ top: gridHY, opacity: gridHOpacity }} />
        {/* 코너 마크 */}
        <div className="absolute top-[4.5%] left-[4.5%] sm:top-[5%] sm:left-[5%] w-8 h-8 sm:w-14 sm:h-14 border-t-[1.5px] border-l-[1.5px] border-[#A9C5D9]/20" />
        <div className="absolute top-[4.5%] right-[4.5%] sm:top-[5%] sm:right-[5%] w-8 h-8 sm:w-14 sm:h-14 border-t-[1.5px] border-r-[1.5px] border-[#A9C5D9]/20" />
        <div className="absolute bottom-[4.5%] left-[4.5%] sm:bottom-[5%] sm:left-[5%] w-8 h-8 sm:w-14 sm:h-14 border-b-[1.5px] border-l-[1.5px] border-[#A9C5D9]/20" />
        <div className="absolute bottom-[4.5%] right-[4.5%] sm:bottom-[5%] sm:right-[5%] w-8 h-8 sm:w-14 sm:h-14 border-b-[1.5px] border-r-[1.5px] border-[#A9C5D9]/20" />
        {/* 대각선 */}
        <motion.div className="absolute inset-0" style={{ opacity: diagOpacity }}>
          <div className="absolute top-0 left-0 w-[141%] h-px bg-[#A9C5D9]/25 origin-top-left rotate-[26.57deg]" />
          <div className="absolute bottom-0 left-0 w-[141%] h-px bg-[#A9C5D9]/25 origin-bottom-left -rotate-[26.57deg]" />
        </motion.div>
      </div>


      {/* ═══════════════════════════════════════════════════
          섹션 1 — 풀스크린 히어로
          ART FACTORY 스타일: 심볼 + 대형 타이포 + 하단 번호 네비
          ═══════════════════════════════════════════════════ */}
      <section
        aria-labelledby="hero-heading"
        className="relative z-10 min-h-screen flex flex-col"
      >
        {/* 메인 콘텐츠 영역 */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-24 sm:pb-32">

          {/* ARTHEUS 심볼 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8 sm:mb-10"
          >
            <img
              src="/uploads/20261123-213903-image-9ydr.png"
              alt="ARTHEUS 심볼"
              className="w-20 h-20 sm:w-28 sm:h-28 object-contain drop-shadow-[0_4px_24px_rgba(169,197,217,0.15)]"
              draggable={false}
            />
          </motion.div>

          {/* 대형 타이틀 */}
          <motion.h1
            id="hero-heading"
            className="text-center"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="block text-[clamp(2.8rem,11vw,9rem)] font-black leading-[0.88] tracking-[-0.04em] text-[#F3F0EA]">
              artheus
            </span>
          </motion.h1>

          {/* 태그라인 */}
          <motion.p
            className="keep-ko mt-6 sm:mt-8 text-center text-base sm:text-xl text-[#A9C5D9]/80 font-medium tracking-wide leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            본질을 다루는 액팅 스튜디오
          </motion.p>

          <motion.p
            className="keep-ko mt-2.5 text-center text-sm text-[#8CADC8]/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.85, duration: 0.7 }}
          >
            홍대 · 연기 전공 · 연극영화과 입시
          </motion.p>
        </div>

        {/* ── 하단 네비 카드 (ART FACTORY 스타일 번호 네비) ── */}
        <motion.div
          className="relative z-10 border-t border-[#A9C5D9]/12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.7 }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {NAV_CARDS.map((card, i) => (
              <button
                key={card.key}
                onClick={() => go(card.key as any)}
                className="court-nav-card group text-left"
              >
                <span className="text-[11px] font-bold tracking-[0.15em] text-[#A9C5D9]/40 group-hover:text-[#A9C5D9]/70 transition-colors">
                  {card.num}
                </span>
                <span className="block mt-2 text-lg sm:text-xl font-bold text-[#F3F0EA] group-hover:text-[#A9C5D9] transition-colors tracking-tight">
                  {card.label}
                </span>
                <span className="keep-ko block mt-1 text-xs text-[#8CADC8]/50 group-hover:text-[#8CADC8]/80 transition-colors">
                  {card.desc}
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* 스크롤 힌트 */}
        <motion.div
          className="absolute bottom-[110px] sm:bottom-[120px] left-1/2 -translate-x-1/2 z-20 text-[#A9C5D9]/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
        >
          <motion.div animate={{ y: [0, 5, 0] }} transition={{ duration: 2.5, repeat: Infinity }}>
            <ArrowDown className="w-4 h-4" />
          </motion.div>
        </motion.div>
      </section>


      {/* ═══════════════════════════════════════════════════
          섹션 2 — 비전 (코트 네트선이 올라가며 열리는 공간)
          ═══════════════════════════════════════════════════ */}
      <section className="relative z-10 py-28 sm:py-40 flex items-center justify-center px-6">
        <motion.div
          className="text-center max-w-3xl"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="court-label block mb-5">VISION</span>
          <h2 className="keep-ko text-[clamp(1.6rem,4.5vw,3.2rem)] font-bold leading-[1.18] tracking-[-0.03em] text-[#F3F0EA]">
            내가 이해한 장면을
            <br />
            내 연기로 만들어가도록.
          </h2>
          <p className="keep-ko mt-6 text-base sm:text-lg leading-[1.8] text-[#8CADC8]/80 max-w-lg mx-auto">
            장면을 읽는 기준, 연습을 고치는 방법,
            <br />
            나에게 맞는 표현을 찾아갑니다.
          </p>
          <button
            type="button"
            onClick={() => go('vision')}
            className="mt-9 inline-flex items-center gap-2 text-sm font-semibold text-[#A9C5D9]/80 hover:text-[#F3F0EA] transition-colors"
          >
            자세히 보기
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      </section>


      {/* ═══════════════════════════════════════════════════
          섹션 3 — 핵심 가치 (코트 라인이 셀 경계)
          ═══════════════════════════════════════════════════ */}
      <section className="relative z-10 py-20 sm:py-28 px-5 sm:px-8">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {[
              { num: '01', title: '호흡은 모든 표현의 근원이다', desc: '감정과 기술의 균형, 효율적인 훈련 방법으로 배우의 본질을 끌어냅니다.' },
              { num: '02', title: '분석은 훈련을 더 명확하게 만든다', desc: '체계적 분석을 통해 각자의 강점과 약점을 파악하고 맞춤형 성장을 지원합니다.' },
              { num: '03', title: '반복은 배우를 드러낸다', desc: '의미 있는 반복을 통해 기술을 체화하고, 자연스러운 표현력을 만듭니다.' },
              { num: '04', title: '혼자가 아닌, 함께의 예술', desc: '동료 배우, 코치와 함께하는 피드백과 협업으로 더 깊은 성장을 만들어갑니다.' },
            ].map((item, i) => (
              <motion.div
                key={item.num}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="court-grid-cell"
              >
                <span className="text-[11px] font-bold tracking-[0.15em] text-[#A9C5D9]/40">{item.num}</span>
                <h3 className="keep-ko mt-3 text-xl sm:text-2xl font-bold text-[#F3F0EA] leading-snug">{item.title}</h3>
                <p className="keep-ko mt-3 text-sm leading-[1.7] text-[#8CADC8]/70">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════
          섹션 4 — 숫자
          ═══════════════════════════════════════════════════ */}
      <section className="relative z-10 py-16 sm:py-24 px-5 sm:px-8">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-0">
            {[
              { num: '2024', label: '설립' },
              { num: '30+', label: '누적 최종합격' },
              { num: '5', label: '코치진' },
              { num: '92%', label: '목표 달성률' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="court-grid-cell text-center py-10 sm:py-14"
              >
                <span className="text-[clamp(2rem,5vw,3.5rem)] font-black tracking-[-0.03em] text-[#F3F0EA]">
                  {stat.num}
                </span>
                <span className="block mt-2 text-xs sm:text-sm font-medium text-[#A9C5D9]/50 tracking-wide uppercase">
                  {stat.label}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════
          섹션 5 — CTA (코트 서비스 박스 프레임)
          ═══════════════════════════════════════════════════ */}
      <section className="relative z-10 py-24 sm:py-32 px-5 sm:px-8">
        <motion.div
          className="max-w-[700px] mx-auto text-center relative"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          {/* 이중 프레임 */}
          <div className="absolute -inset-6 sm:-inset-10 border border-[#A9C5D9]/12 pointer-events-none" />
          <div className="absolute -inset-3 sm:-inset-5 border border-[#A9C5D9]/08 pointer-events-none" />
          {/* 코너 마크 */}
          <div className="absolute -top-6 -left-6 sm:-top-10 sm:-left-10 w-4 h-4 sm:w-7 sm:h-7 border-t-[1.5px] border-l-[1.5px] border-[#A9C5D9]/25" />
          <div className="absolute -top-6 -right-6 sm:-top-10 sm:-right-10 w-4 h-4 sm:w-7 sm:h-7 border-t-[1.5px] border-r-[1.5px] border-[#A9C5D9]/25" />
          <div className="absolute -bottom-6 -left-6 sm:-bottom-10 sm:-left-10 w-4 h-4 sm:w-7 sm:h-7 border-b-[1.5px] border-l-[1.5px] border-[#A9C5D9]/25" />
          <div className="absolute -bottom-6 -right-6 sm:-bottom-10 sm:-right-10 w-4 h-4 sm:w-7 sm:h-7 border-b-[1.5px] border-r-[1.5px] border-[#A9C5D9]/25" />

          <span className="court-label">CONTACT</span>
          <h2 className="keep-ko mt-4 text-2xl sm:text-[34px] font-bold leading-[1.25] tracking-[-0.02em] text-[#F3F0EA]">
            지금 연습에서 막히는
            <br />
            부분을 알려주세요.
          </h2>
          <div className="w-8 h-px bg-[#A9C5D9]/25 mx-auto my-6" />
          <p className="keep-ko text-sm sm:text-base leading-[1.75] text-[#8CADC8]/70">
            서울시 마포구 망원동 · 홍대 스튜디오
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center">
            <InstagramConsultButton
              location="home_cta"
              label="상담하기"
              tone="on-blue"
              className="px-8 py-3.5 !bg-[#F3F0EA] !text-[#132B3F] hover:!bg-white border border-[#F3F0EA]/30"
            />
            <button
              type="button"
              onClick={() => go('contact')}
              className="px-8 py-3.5 rounded-full border border-[#F3F0EA]/15 text-[#A9C5D9]/80 hover:bg-[#F3F0EA]/5 transition-colors text-sm font-semibold"
            >
              문의하기
            </button>
          </div>
        </motion.div>
      </section>

      <div className="h-12 relative z-10" />
    </div>
  );
}
