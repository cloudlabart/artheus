import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { go } from '../nav';
import { useData } from '../contexts/DataContext';
import { InstagramConsultButton } from '../components/InstagramConsultButton';
import { INSTAGRAM_HANDLE } from '../data/siteLinks';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import kyungheeImg from '../../assets/schools/kyunghee.png';
import sungkyunkwanImg from '../../assets/schools/skku.png';
import kookminImg from '../../assets/schools/kookmin.png';
import chungangImg from '../../assets/9f583dc6f333e25a4c50a43080d9df9b8287fbc6.png';
import sejongImg from '../../assets/schools/sejong.png';
import gachonImg from '../../assets/schools/gachon.png';
import donggukImg from '../../assets/schools/dongguk.png';
import incheonImg from '../../assets/schools/inu.png';
import seoulArtsImg from '../../assets/schools/seoularts.png';
import sungshinImg from '../../assets/schools/sungshin.png';
import seokyeongImg from '../../assets/schools/sku.svg';

const SERVER = `https://${projectId}.supabase.co/functions/v1/make-server-d46327e9`;

const RESULT_SCHOOLS: { name: string; count: number; logo?: string }[] = [
  { name: '국민대', count: 6, logo: kookminImg },
  { name: '가천대', count: 5, logo: gachonImg },
  { name: '세종대', count: 4, logo: sejongImg },
  { name: '동국대', count: 3, logo: donggukImg },
  { name: '서경대', count: 3, logo: seokyeongImg },
  { name: '인천대', count: 3, logo: incheonImg },
  { name: '성균관대', count: 2, logo: sungkyunkwanImg },
  { name: '중앙대', count: 1, logo: chungangImg },
  { name: '경희대', count: 1, logo: kyungheeImg },
  { name: '성신여대', count: 1, logo: sungshinImg },
  { name: '서울예대', count: 1, logo: seoulArtsImg },
];

const HERO_KEYWORDS = ['장면을 읽고', '직접 해보고', '피드백을 써보고', '다시 연기하는'];

const PROCESS_STEPS = [
  {
    num: '01',
    title: '장면을 이해합니다.',
    lines: [
      '인물이 원하는 것과 가로막는 것을 짚고,',
      '상대에게 어떤 행동을 할지 정합니다.',
    ],
  },
  {
    num: '02',
    title: '직접 해보고 짚어봅니다.',
    lines: [
      '연습한 장면을 돌아보며',
      '의도한 것과 실제로 드러난 것을 함께 확인합니다.',
    ],
  },
  {
    num: '03',
    title: '바꿔서 다시 해봅니다.',
    lines: [
      '피드백에서 다음 연습에 쓸 내용을 골라 다시 연기합니다.',
      '달라진 점과 남은 과제를 확인합니다.',
    ],
  },
];

const LEARNING_GOALS = [
  '인물의 상황을 읽고 연기의 이유를 설명하기',
  '피드백을 다음 연습에서 바꿔볼 행동으로 옮기기',
  '내 말투와 움직임이 장면에서 어떻게 쓰이는지 알기',
];

const VERIFIED_CAREER_FALLBACK = [
  '서울공연예술고등학교 실용음악과 보컬전공',
  '세종대학교 영화예술학과 연기예술전공',
  '한양대학교 일반대학원 연극영화과 석박사 통합과정',
];

function scrollToMethod() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.getElementById('education-method')?.scrollIntoView({
    behavior: reduce ? 'auto' : 'smooth',
    block: 'start',
  });
}

export function Home() {
  const [currentWord, setCurrentWord] = useState(0);
  const navigate = useNavigate();
  const { coaches } = useData();

  const leadCoach = coaches.find(
    (c) => c.id === 'coach-c1' || (c as any).nameKo === '배준우' || (c as any).name_ko === '배준우'
  );

  const careerList: string[] = (() => {
    const raw = (leadCoach as any)?.career;
    if (Array.isArray(raw) && raw.length > 0) return raw;
    if (typeof raw === 'string' && raw.trim()) {
      return raw.split(/[\n/]/).map((s) => s.trim()).filter(Boolean);
    }
    return VERIFIED_CAREER_FALLBACK;
  })();

  const [approvedPhoto, setApprovedPhoto] = useState<string>('');
  const initialPhotoUrl = (leadCoach as any)?.photoUrl || '';

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWord((prev) => (prev + 1) % HERO_KEYWORDS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (initialPhotoUrl) {
      setApprovedPhoto(initialPhotoUrl);
      return;
    }
    let cancelled = false;
    fetch(`${SERVER}/admin/coach-photo/coach-c1`, {
      headers: { Authorization: `Bearer ${publicAnonKey}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!cancelled && json?.url) setApprovedPhoto(json.url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [initialPhotoUrl]);

  return (
    <div className="min-h-screen bg-[#F3F0EA] text-[#132B3F] relative">
      {/* ── 1. 첫 화면: 기존 중앙 정렬 모션 히어로 구조 + 블루 무드 적용 ── */}
      <section
        aria-labelledby="hero-heading"
        className="on-blue-surface relative overflow-hidden text-white"
        style={{
          background: 'linear-gradient(165deg, #153956 0%, #1F496D 55%, #2D5E88 100%)',
        }}
      >
        {/* 절제된 단일 원형 블루 번짐 (레퍼런스 6번 패널 모티프, 장식 위치 1곳에만 사용) */}
        <div
          aria-hidden="true"
          className="artheus-halo-orb pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] h-[360px] sm:w-[540px] sm:h-[540px] rounded-full"
        />

        <div className="max-w-[1360px] mx-auto px-5 sm:px-8 py-10 sm:py-14 lg:py-20">
          {/* 얇은 1px 선으로 정돈된 프레임 (레퍼런스 4번 패널 모티프) */}
          <div className="relative min-h-[400px] lg:min-h-[480px] rounded-2xl border border-[#F3F0EA]/22 px-5 sm:px-10 py-10 sm:py-14 flex items-center justify-center">
            {/* 기존 대형 워터마크 타이포그래피 보존 */}
            <div
              aria-hidden="true"
              className="absolute inset-0 flex flex-col items-center justify-center opacity-[0.035] pointer-events-none select-none overflow-hidden"
            >
              <p className="text-[clamp(7rem,20vw,24rem)] font-black leading-[0.85] tracking-[-0.02em] whitespace-nowrap text-[#A9C5D9]">
                artheus
              </p>
            </div>

            <div className="relative z-10 text-center max-w-4xl mx-auto">
              <motion.p
                className="keep-ko inline-block px-3.5 py-1 rounded-full bg-white/10 border border-[#F3F0EA]/20 text-xs sm:text-sm text-[#F3F0EA] mb-4 sm:mb-5 tracking-normal font-medium"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                연기 전공자 · 연극영화과 입시생을 위한 artheus
              </motion.p>

              {/* 기존 블러 페이드 키워드 모션 보존 */}
              <motion.div className="h-9 sm:h-12 mb-3 sm:mb-5 flex items-center justify-center" key={currentWord}>
                <motion.p
                  initial={{ opacity: 0, y: 14, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -14, filter: 'blur(4px)' }}
                  transition={{ duration: 0.55 }}
                  className="text-lg sm:text-2xl lg:text-3xl text-[#A9C5D9] font-semibold tracking-tight"
                >
                  {HERO_KEYWORDS[currentWord]}
                </motion.p>
              </motion.div>

              <motion.h1
                id="hero-heading"
                className="keep-ko text-[28px] min-[390px]:text-[33px] sm:text-[46px] lg:text-[58px] font-bold mb-6 sm:mb-7 leading-[1.22] tracking-[-0.02em] text-[#F3F0EA]"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.7 }}
              >
                내가 이해한 장면을
                <br />
                내 연기로 만들어가도록.
              </motion.h1>

              <motion.div
                className="keep-ko max-w-2xl mx-auto space-y-2 sm:space-y-1 text-base sm:text-[17px] leading-[1.72] text-[#EDF4F9] mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
              >
                <p>
                  작품을 읽고도 어떻게 연기할지 막힐 때,{' '}
                  <br className="hidden sm:inline" />
                  피드백을 듣고도 무엇을 바꿔야 할지 모르겠을 때.
                </p>
                <p>
                  배준우가 장면을 함께 짚고,{' '}
                  <br className="hidden sm:inline" />
                  다음 연습에서 시도할 것을 구체적으로 잡아드립니다.
                </p>
              </motion.div>

              <motion.p
                className="keep-ko text-[15px] sm:text-base text-[#D6E6F2] mb-9 sm:mb-11"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 }}
              >
                각자의 말투와 움직임, 장면에서 드러나는 매력을 살핍니다.
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row gap-3.5 sm:gap-4 justify-center items-center"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65 }}
              >
                <InstagramConsultButton
                  location="hero_primary"
                  label="내 연기 상담하기"
                  tone="on-blue"
                  className="w-full sm:w-auto px-8 py-3.5 min-w-[180px]"
                />

                <button
                  type="button"
                  onClick={scrollToMethod}
                  className="w-full sm:w-auto px-8 py-3.5 min-h-[48px] border border-[#F3F0EA]/45 rounded-full text-[#F3F0EA] hover:bg-white/10 transition-colors text-base font-semibold min-w-[160px]"
                >
                  수업 방식 보기
                </button>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. 기존 가로 이동 마키 배너 보존 (과한 글로우 제거, 1px 얇은 선 정돈) ── */}
      <div className="overflow-hidden bg-[#FAF8F4] border-y border-[#153956]/15 relative">
        <motion.div
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
          className="flex whitespace-nowrap py-4 relative z-10"
        >
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="flex items-center text-xs font-semibold tracking-[0.14em] text-[#153956]"
            >
              <span className="px-5">COGNITION</span>
              <span className="font-normal text-[#A9C5D9]">—</span>
              <span className="px-5">COMMUNICATION</span>
              <span className="font-normal text-[#A9C5D9]">—</span>
              <span className="px-5">REPETITION</span>
              <span className="font-normal text-[#A9C5D9]">—</span>
              <span className="px-5">FEEDBACK</span>
              <span className="font-normal text-[#A9C5D9]">—</span>
              <span className="px-5">PERCEPTION</span>
              <span className="font-normal text-[#A9C5D9]">—</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── 3. 교육 소개 섹션 (수업 방식 3단계 · 교육 목표 · 지도자 및 입시 클래스 안내) ── */}
      <section
        id="education-method"
        aria-labelledby="method-heading"
        className="max-w-[1140px] mx-auto px-5 sm:px-8 pt-14 sm:pt-20 pb-10 sm:pb-14"
      >
        {/* 수업 방식 요약 (레퍼런스 2번 패널의 비대칭 제목 + 3열 정돈 구성) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-[#153956]/15">
          <div>
            <p className="text-xs font-semibold tracking-[0.12em] text-[#2D5E88] uppercase mb-2.5">
              HOW WE PRACTICE
            </p>
            <h2
              id="method-heading"
              className="keep-ko text-2xl sm:text-[34px] font-bold tracking-[-0.02em] text-[#132B3F] leading-[1.25]"
            >
              연습할 때 무엇을 바꿔야 할지 알도록.
            </h2>
          </div>
          <p className="keep-ko text-base leading-[1.65] text-[#35526B] md:text-right">
            분석한 내용을 연기로 옮기고,
            <br />
            피드백을 다음 시도에 써봅니다.
          </p>
        </div>

        <ol className="mt-8 sm:mt-10 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 md:divide-x md:divide-[#153956]/15">
          {PROCESS_STEPS.map((step, idx) => (
            <li
              key={step.num}
              className={`text-left ${idx > 0 ? 'pt-6 border-t border-[#153956]/15 md:pt-0 md:border-t-0 md:pl-8' : ''} ${idx < 2 ? 'md:pr-8' : ''}`}
            >
              <span className="text-xs font-bold tracking-wider text-[#2D5E88]">
                {step.num}
              </span>
              <h3 className="keep-ko mt-2 text-lg sm:text-xl font-bold text-[#132B3F]">
                {step.title}
              </h3>
              <div className="keep-ko mt-2.5 space-y-1 text-[15px] sm:text-base leading-[1.7] text-[#35526B]">
                <p>{step.lines[0]}</p>
                <p>{step.lines[1]}</p>
              </div>
            </li>
          ))}
        </ol>

        {/* 교육 목표 (후기·성과와 명확히 구분, 얇은 구분선 중심) */}
        <div className="mt-14 sm:mt-16 pt-12 sm:pt-14 border-t border-[#153956]/15 grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-8 lg:gap-14 items-start">
          <div>
            <p className="text-xs font-semibold tracking-normal text-[#2D5E88] mb-2">
              교육 목표
            </p>
            <h3 className="keep-ko text-2xl sm:text-[30px] font-bold tracking-[-0.02em] text-[#132B3F] leading-[1.3]">
              새 대본을 받아도, 시작할 곳을 알도록.
            </h3>
            <p className="keep-ko mt-3 text-base leading-[1.7] text-[#35526B]">
              장면을 읽는 기준, 연습을 고치는 방법,
              <br />
              나에게 맞는 표현을 익힙니다.
            </p>
          </div>

          <ul className="divide-y divide-[#153956]/15 border-y border-[#153956]/15">
            {LEARNING_GOALS.map((goal, idx) => (
              <li key={goal} className="py-4 flex items-start gap-3.5">
                <span
                  aria-hidden="true"
                  className="mt-0.5 inline-flex w-6 h-6 shrink-0 items-center justify-center rounded-full border border-[#2D5E88]/40 text-xs font-semibold text-[#153956]"
                >
                  {idx + 1}
                </span>
                <span className="keep-ko text-base font-medium leading-[1.6] text-[#132B3F]">
                  {goal}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* 지도자 · 입시 클래스 장소 및 비용 안내 (블루 인물 영역 + 불투명 아이보리 상세/가격 영역 대비) */}
        <div className="mt-14 sm:mt-16 pt-12 sm:pt-14 border-t border-[#153956]/15 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
          {/* 지도자 소개: 블루 포트레이트 패널 + 밝은 배경 경력 분리 */}
          <div className="lg:col-span-6 rounded-2xl border border-[#153956]/15 bg-[#FAF8F4] overflow-hidden flex flex-col justify-between">
            <div className="bg-[#153956] text-[#F3F0EA] p-6 sm:p-7 flex items-center gap-5">
              {approvedPhoto ? (
                <div className="artheus-photo-frame w-24 h-28 sm:w-28 sm:h-32 rounded-xl overflow-hidden shrink-0 border border-[#F3F0EA]/20">
                  <img
                    src={approvedPhoto}
                    alt="배준우 프로필 사진"
                    className="w-full h-full object-cover object-[50%_15%]"
                    onError={() => setApprovedPhoto('')}
                  />
                </div>
              ) : (
                <div
                  aria-hidden="true"
                  className="w-20 h-24 sm:w-24 sm:h-28 rounded-xl shrink-0 border border-[#F3F0EA]/25 bg-[#214B70] flex flex-col items-center justify-center text-[#F3F0EA]"
                >
                  <span className="text-[10px] tracking-[0.12em] text-[#A9C5D9] font-medium">
                    artheus
                  </span>
                  <span className="mt-1 text-lg font-bold">배준우</span>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-[#A9C5D9]">INSTRUCTOR · 직접 지도</p>
                <h3 className="mt-1 text-2xl sm:text-[26px] font-bold text-[#F3F0EA]">배준우</h3>
                <p className="text-xs text-[#DCE9F2] mt-1">BAE JUNWOO</p>
              </div>
            </div>

            <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between">
              <ul className="space-y-2.5">
                {careerList.map((line) => (
                  <li
                    key={line}
                    className="keep-ko text-[15px] leading-[1.65] text-[#132B3F] flex items-start gap-2.5"
                  >
                    <span aria-hidden="true" className="mt-2.5 w-1.5 h-px bg-[#2D5E88] shrink-0" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 pt-4 border-t border-[#153956]/12">
                <button
                  type="button"
                  onClick={() => go('coaches')}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#153956] hover:text-[#2D5E88] transition-colors"
                >
                  <span>코치진 전체 보기</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          {/* 홍대 대면 입시 클래스 장소·비용: 번짐·질감 없는 불투명 아이보리 단색 배경 */}
          <div className="lg:col-span-6 rounded-2xl border border-[#153956]/18 bg-[#FAF8F4] p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap gap-2 text-xs font-semibold text-[#153956]">
                <span className="px-3 py-1 rounded-full border border-[#153956]/20 bg-[#F3F0EA]">배준우 직접 지도</span>
                <span className="px-3 py-1 rounded-full border border-[#153956]/20 bg-[#F3F0EA]">홍대 스튜디오</span>
              </div>

              <dl className="mt-5 divide-y divide-[#153956]/12">
                <div className="py-3.5 first:pt-0">
                  <dt className="text-xs font-semibold text-[#466075]">수업 장소</dt>
                  <dd className="mt-1 text-lg font-bold text-[#132B3F]">홍대 스튜디오</dd>
                </div>
                <div className="py-3.5">
                  <dt className="text-xs font-semibold text-[#466075]">입시 클래스 수강료</dt>
                  <dd className="mt-1 text-2xl sm:text-[28px] font-bold tracking-[-0.02em] text-[#153956]">
                    입시 클래스 월 85만 원
                  </dd>
                </div>
                <div className="pt-3.5">
                  <dt className="text-xs font-semibold text-[#466075]">연습실 안내 (수강료와 별도)</dt>
                  <dd className="mt-1 text-base sm:text-lg font-bold text-[#132B3F]">
                    연습실 패키지 월 5만 원 별도
                  </dd>
                  <dd className="keep-ko mt-1 text-[15px] leading-[1.6] text-[#35526B]">
                    패키지 이용 시 수업 없는 날 하루 3시간 연습실 제공
                  </dd>
                </div>
              </dl>
            </div>

            <div className="mt-6 pt-4 border-t border-[#153956]/12">
              <button
                type="button"
                onClick={() => go('programs')}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#153956] hover:text-[#2D5E88] transition-colors"
              >
                <span>클래스 안내 보기</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. 기존 artheus ON Practice Studio 배너 카드 보존 (1px 선 정돈 · 단색 버튼) ── */}
      <div className="max-w-[1360px] mx-auto px-5 sm:px-8 pt-2 sm:pt-4 pb-10 sm:pb-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          onClick={() => navigate('/practice')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate('/practice');
            }
          }}
          className="relative overflow-hidden rounded-2xl border border-[#153956]/18 bg-[#FAF8F4] cursor-pointer group hover:border-[#153956] transition-colors duration-200"
        >
          {/* 우측 상단 배경 타이포 */}
          <div
            aria-hidden="true"
            className="absolute top-0 right-0 h-full flex items-center pr-8 pointer-events-none select-none overflow-hidden"
          >
            <span
              className="text-[6rem] sm:text-[9rem] font-black italic leading-none text-[#EAE6DE] group-hover:text-[#DFEAEF] transition-colors"
              style={{ fontFamily: "'Syne', 'DM Sans', sans-serif", letterSpacing: '-0.04em' }}
            >
              artheus ON
            </span>
          </div>

          <div className="relative z-10 px-6 sm:px-10 py-8 sm:py-9 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <p className="text-xs font-semibold text-[#2D5E88] mb-2">
                온라인 학습 자료 · 홍대 대면 클래스와 별도 운영
              </p>
              <div className="flex items-baseline gap-3 mb-2">
                <span
                  className="text-3xl sm:text-4xl font-black italic leading-none tracking-tight text-[#153956]"
                  style={{ fontFamily: "'Syne', 'DM Sans', sans-serif" }}
                >
                  artheus ON
                </span>
              </div>
              <p className="keep-ko text-sm sm:text-[15px] text-[#35526B] mb-4 leading-relaxed">
                희곡 원문과 연극·연기 개념 등 장면을 이해하는 자료와 대사 연습 공간을 온라인에서 살펴볼 수 있습니다.
              </p>
              <div className="flex flex-wrap gap-2">
                {['장면을 이해하는 자료', '희곡 원문', '연극·연기 용어', '대사 암기 연습'].map((tag) => (
                  <span
                    key={tag}
                    className="text-xs font-medium px-3 py-1 rounded-full border border-[#153956]/20 text-[#153956] bg-[#F3F0EA]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex-shrink-0">
              <div className="inline-flex items-center gap-2 min-h-[46px] px-6 py-3 rounded-full bg-[#153956] text-[#F3F0EA] text-sm font-semibold group-hover:bg-[#2D5E88] transition-colors">
                <span>스튜디오 입장</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── 5. 기존 합격 현황 대학 로고 영역 보존 ── */}
      <section className="max-w-[1140px] mx-auto px-5 sm:px-8 py-12 sm:py-16 text-center border-t border-[#153956]/15">
        <p className="text-xs font-semibold tracking-[0.16em] text-[#2D5E88] uppercase mb-3">RESULTS</p>
        <h2 className="keep-ko text-2xl sm:text-3xl font-bold tracking-[-0.02em] text-[#132B3F] mb-3">
          artheus 강사진
          <br />
          6년 누적 최종합격 30명
        </h2>
        <ul className="flex flex-wrap items-end justify-center gap-x-8 gap-y-8 sm:gap-x-12 mt-10 mb-8 list-none p-0">
          {RESULT_SCHOOLS.map((u) => (
            <li key={u.name} className="flex flex-col items-center w-20 sm:w-24">
              <div className="h-14 sm:h-16 w-full flex items-center justify-center">
                {u.logo ? (
                  <img src={u.logo} alt={`${u.name} 로고`} className="max-w-full max-h-full object-contain" draggable={false} />
                ) : (
                  <span className="text-xs font-black text-[#4A6276]">{u.name}</span>
                )}
              </div>
              <p className="mt-2 text-xs sm:text-sm font-bold text-[#132B3F]">{u.name}</p>
              <p className="text-xs text-[#2D5E88] font-semibold">{u.count}명</p>
            </li>
          ))}
        </ul>
        <p className="text-xs text-[#5B7285]">※ artheus 강사진 6년 누적 최종합격 기준, 중복합격 제외</p>
      </section>

      {/* ── 6. 상담 연결 영역 ── */}
      <section
        aria-labelledby="consult-heading"
        className="on-blue-surface py-14 sm:py-20 text-white"
        style={{
          background: 'linear-gradient(155deg, #153956 0%, #2D5E88 100%)',
        }}
      >
        <div className="max-w-[820px] mx-auto px-5 sm:px-8">
          {/* 레퍼런스 4번 패널의 얇은 1px 라운드 프레임 + 단색 아이보리 버튼 */}
          <div className="rounded-2xl border border-[#F3F0EA]/28 px-6 sm:px-12 py-10 sm:py-14 text-center">
            <h2
              id="consult-heading"
              className="keep-ko text-2xl sm:text-[34px] font-bold leading-[1.3] tracking-[-0.02em] text-[#F3F0EA]"
            >
              지금 연습에서 막히는 부분을 알려주세요.
            </h2>
            <div className="w-12 h-px bg-[#A9C5D9]/60 mx-auto my-5" aria-hidden="true" />
            <p className="keep-ko text-base sm:text-[17px] leading-[1.75] text-[#EDF4F9]">
              인스타그램 {INSTAGRAM_HANDLE}에 ‘연기 상담’이라고 보내주세요.
              <br />
              준비 중인 작품이나 입시 과정,{' '}
              <br className="hidden sm:inline" />
              수업 가능한 시간대를 함께 알려주세요.
            </p>
            <div className="mt-8 flex justify-center">
              <InstagramConsultButton
                location="home_bottom_consult"
                label="인스타그램에서 상담하기"
                tone="on-blue"
                className="px-8 py-3.5"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
