/**
 * Home — 시안 기반 랜딩 페이지
 * 왼쪽 코트 사진 + 오른쪽 타이포 분할 히어로
 * 캠페인 사진 활용, 코트 라인 애니메이션 유지
 */
import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { go } from '../nav';
import { InstagramConsultButton } from '../components/InstagramConsultButton';

/* 하단 네비 카드 */
const NAV_CARDS = [
  { num: '01', label: 'Vision', desc: '비전과 방향', key: 'vision' },
  { num: '02', label: 'Program', desc: '입시 · 성인 · 전문', key: 'programs' },
  { num: '03', label: 'Coaches', desc: '코치진 소개', key: 'coaches' },
  { num: '04', label: 'LAB', desc: '연구와 워크숍', key: 'lab' },
  { num: '05', label: 'Contact', desc: '상담 · 문의', key: 'contact' },
] as const;

/* 캠페인 갤러리 사진 */
const GALLERY = [
  { src: '/uploads/20261124-105259-ARTHEUS_sport_08-llmo.png', alt: '테니스공과 운동화 — artheus 캠페인' },
  { src: '/uploads/20261124-105259-ARTHEUS_sport_10-dtkt.png', alt: '라켓을 든 선수 — artheus 캠페인' },
  { src: '/uploads/20261124-105219-아르테우스-하늘과-코트의-리듬-g8vm.png', alt: '아터스, 하늘과 코트의 리듬' },
  { src: '/uploads/20261124-105202-스크린샷-2026-11-24-오전-10-51-58-rpxr.png', alt: 'PATTERN BREAK — 테니스 패턴 콘셉트' },
];

export function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });

  /* 코트 라인 */
  const borderInset = useTransform(scrollYProgress, [0, 0.2, 0.6, 1], [5, 3, 1.5, 0]);
  const borderOpacity = useTransform(scrollYProgress, [0, 0.15], [0.9, 0.5]);
  const netY = useTransform(scrollYProgress, [0, 0.25, 0.6, 1], ['50%', '38%', '22%', '12%']);
  const netOpacity = useTransform(scrollYProgress, [0, 0.4, 0.8], [0.35, 0.25, 0.1]);
  const centerX = useTransform(scrollYProgress, [0, 0.35, 0.8], ['50%', '35%', '18%']);
  const centerOpacity = useTransform(scrollYProgress, [0, 0.6], [0.3, 0.1]);
  const diagOpacity = useTransform(scrollYProgress, [0, 0.18, 0.4], [0.1, 0.06, 0]);

  return (
    <div ref={containerRef} className="court-page relative text-[#F3F0EA]">

      {/* ═══ 코트 라인 시스템 ═══ */}
      <div className="fixed inset-0 z-[1] pointer-events-none overflow-hidden">
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
        <motion.div className="absolute left-0 right-0 h-px bg-[#A9C5D9]" style={{ top: netY, opacity: netOpacity }} />
        <motion.div className="absolute top-0 bottom-0 w-px bg-[#A9C5D9]" style={{ left: centerX, opacity: centerOpacity }} />
        {/* 코너 마크 */}
        <div className="absolute top-[4.5%] left-[4.5%] sm:top-[5%] sm:left-[5%] w-8 h-8 sm:w-14 sm:h-14 border-t-[1.5px] border-l-[1.5px] border-[#A9C5D9]/20" />
        <div className="absolute top-[4.5%] right-[4.5%] sm:top-[5%] sm:right-[5%] w-8 h-8 sm:w-14 sm:h-14 border-t-[1.5px] border-r-[1.5px] border-[#A9C5D9]/20" />
        <div className="absolute bottom-[4.5%] left-[4.5%] sm:bottom-[5%] sm:left-[5%] w-8 h-8 sm:w-14 sm:h-14 border-b-[1.5px] border-l-[1.5px] border-[#A9C5D9]/20" />
        <div className="absolute bottom-[4.5%] right-[4.5%] sm:bottom-[5%] sm:right-[5%] w-8 h-8 sm:w-14 sm:h-14 border-b-[1.5px] border-r-[1.5px] border-[#A9C5D9]/20" />
        <motion.div className="absolute inset-0" style={{ opacity: diagOpacity }}>
          <div className="absolute top-0 left-0 w-[141%] h-px bg-[#A9C5D9]/25 origin-top-left rotate-[26.57deg]" />
          <div className="absolute bottom-0 left-0 w-[141%] h-px bg-[#A9C5D9]/25 origin-bottom-left -rotate-[26.57deg]" />
        </motion.div>
      </div>


      {/* ═══ 섹션 1 — 스플릿 히어로 (시안 5번 기반) ═══ */}
      <section aria-labelledby="hero-heading" className="relative z-10 min-h-screen flex flex-col">
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-screen">
          {/* 왼쪽: 코트 사진 */}
          <motion.div
            className="relative overflow-hidden min-h-[50vh] lg:min-h-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2 }}
          >
            <img
              src="/uploads/20261124-105209-아르테우스-테니스-캠페인-콘택트-시트-gsx0.png"
              alt="아터스 테니스 캠페인 콘택트 시트"
              className="absolute inset-0 w-full h-full object-cover"
              draggable={false}
            />
            {/* 그라데이션 오버레이 */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#0A1F33]/80 hidden lg:block" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0A1F33]/60 lg:hidden" />
            {/* MOVEMENT IS A LANGUAGE 텍스트 */}
            <motion.p
              className="absolute bottom-6 left-6 text-[10px] font-bold tracking-[0.2em] text-white/40 uppercase"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
            >
              Movement is a language
            </motion.p>
          </motion.div>

          {/* 오른쪽: 타이포그래피 */}
          <div className="relative flex flex-col justify-center px-8 sm:px-12 lg:px-16 py-16 lg:py-0">
            {/* 브랜드 타이틀 */}
            <motion.h1
              id="hero-heading"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="block text-[clamp(2.6rem,8vw,6rem)] font-black leading-[0.9] tracking-[-0.04em] text-[#F3F0EA]">
                artheus
              </span>
            </motion.h1>

            {/* ACTING STUDIO 라벨 */}
            <motion.p
              className="mt-6 text-[10px] font-black tracking-[0.2em] text-[#A9C5D9]/60 uppercase"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              Acting Studio
            </motion.p>

            {/* 메인 카피 */}
            <motion.h2
              className="keep-ko mt-5 text-[clamp(1.5rem,3.5vw,2.6rem)] font-black leading-[1.2] tracking-[-0.02em] text-[#F3F0EA]"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
            >
              몸으로 배우고,
              <br />
              장면으로 말하다.
            </motion.h2>

            {/* 서브 카피 */}
            <motion.p
              className="keep-ko mt-4 text-sm sm:text-base leading-[1.75] text-[#8CADC8]/70 max-w-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.8 }}
            >
              연기, 움직임, 목소리, 나의 표현을 발견하는 곳
            </motion.p>

            {/* CTA */}
            <motion.div
              className="mt-8 flex items-center gap-4"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.7 }}
            >
              <button
                type="button"
                onClick={() => go('programs')}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-[#F3F0EA] text-[#132B3F] text-sm font-bold hover:bg-white transition-colors"
              >
                프로그램 보기
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>

            {/* 하단: 심볼 + TRUE PRESENCE */}
            <motion.div
              className="mt-auto pt-16 lg:pt-0 lg:absolute lg:bottom-10 lg:right-12 flex flex-col items-end gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4, duration: 0.8 }}
            >
              <img
                src="/uploads/20261124-093657-image-baen.png"
                alt="ARTHEUS 심볼"
                className="w-12 h-12 sm:w-16 sm:h-16 object-contain opacity-20"
                draggable={false}
              />
              <p className="text-[9px] font-bold tracking-[0.25em] text-[#A9C5D9]/25 uppercase">
                True Presence
              </p>
            </motion.div>
          </div>
        </div>

        {/* 하단 네비 카드 */}
        <motion.div
          className="relative z-10 border-t border-[#A9C5D9]/12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.7 }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {NAV_CARDS.map((card) => (
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
      </section>


      {/* ═══ 섹션 2 — 비전 (파우더 블루 코트 비주얼) ═══ */}
      <section className="relative z-10 py-28 sm:py-40 px-5 sm:px-8">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <motion.div
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
            <p className="keep-ko mt-6 text-base sm:text-lg leading-[1.8] text-[#8CADC8]/80 max-w-lg">
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

          <motion.div
            className="relative rounded-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <img
              src="/uploads/20261124-105231-파우더-블루-코트-생생한-한-점-0os2.png"
              alt="파우더 블루 코트 위 테니스공 — ARTHEUS"
              className="w-full aspect-[4/3] object-cover"
              draggable={false}
            />
          </motion.div>
        </div>
      </section>


      {/* ═══ 섹션 3 — 핵심 가치 ═══ */}
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


      {/* ═══ 섹션 4 — 캠페인 갤러리 ═══ */}
      <section className="relative z-10 py-16 sm:py-24 px-5 sm:px-8">
        <div className="max-w-[1200px] mx-auto">
          <span className="court-label block mb-5">Campaign</span>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {GALLERY.map((img, i) => (
              <motion.div
                key={i}
                className="relative rounded-2xl overflow-hidden group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.6 }}
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-full aspect-[3/4] object-cover group-hover:scale-105 transition-transform duration-700"
                  draggable={false}
                />
                <div className="absolute inset-0 bg-[#0A1F33]/20 group-hover:bg-transparent transition-colors duration-500" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* ═══ 섹션 5 — 숫자 ═══ */}
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


      {/* ═══ 섹션 6 — CTA ═══ */}
      <section className="relative z-10 py-24 sm:py-32 px-5 sm:px-8">
        <motion.div
          className="max-w-[700px] mx-auto text-center relative"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="absolute -inset-6 sm:-inset-10 border border-[#A9C5D9]/12 pointer-events-none" />
          <div className="absolute -inset-3 sm:-inset-5 border border-[#A9C5D9]/08 pointer-events-none" />
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
