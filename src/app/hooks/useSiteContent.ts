/**
 * useSiteContent — 사이트 문구(히어로·비전·연락처)
 * 기존 사이트 관리자에서 저장했던 값을 src/content/site.json 으로 옮겨 왔습니다(서버 연결 없음).
 * AdminPanel의 SiteContentSection에서 저장한 값을 프론트엔드에 반영합니다.
 *
 * 저장 키 구조: KV `site_content:main` → {
 *   hero_title, hero_sub, hero_keywords,
 *   vision_text,
 *   contact_email, contact_phone, contact_address
 * }
 */
import content from '../../content/site.json';

// 관리자가 입력하지 않았을 때 사용하는 기본값
export const SITE_DEFAULTS = {
  // 홈 히어로
  hero_title:      '끊임없이 호흡하는',
  hero_sub:        '배우와 코치, 모두가 성장하는 깊이 있는 공간',
  hero_keywords:   '몰입하는, 본질적인, 실전같은, 진실한',

  // 비전 페이지
  vision_headline: '본질을 다루는\n액팅 스튜디오',
  vision_text:     '우리는 단순히 연기를 가르치는 것이 아니라, 배우 개개인의 본질과 진실성을 발견하고 키워나가는 것을 목표로 합니다.',
  vision_value1_title: '효율은 모든 표현의 근원이다',
  vision_value1_desc:  '감정과 기술의 균형, 효율적인 훈련 방법으로 배우의 본질을 끌어냅니다.',
  vision_value2_title: '분석은 훈련을 더 명확하게 만든다',
  vision_value2_desc:  '체계적 분석을 통해 각자의 강점과 약점을 파악하고 맞춤형 성장을 지원합니다.',
  vision_value3_title: '반복은 예술가의 가장 정확한 도구다',
  vision_value3_desc:  '의미 있는 반복을 통해 기술을 체화하고, 자연스러운 표현력을 만듭니다.',
  vision_value4_title: '혼자가 아닌, 함께의 예술',
  vision_value4_desc:  '동료 배우, 코치와 함께하는 피드백과 협업으로 더 깊은 성장을 만들어갑니다.',
  vision_story:    '2018년, 우리는 "진짜 연기"란 무엇인가라는 질문에서 시작했습니다.\n수많은 연기 학원과 워크숍이 존재하지만, 정작 배우 개개인의 본질을 다루고 체계적으로 성장시키는 곳은 드물었습니다.\n우리는 단기적인 입시 합격이나 오디션 통과가 아닌, 평생 배우로 살아갈 수 있는 진정한 힘을 키우는 것에 집중하기로 했습니다.',
  vision_stat1_num:    '2018',
  vision_stat1_label:  '설립 연도',
  vision_stat2_num:    '1,200+',
  vision_stat2_label:  '누적 수강생',
  vision_stat3_num:    '92%',
  vision_stat3_label:  '목표 달성률',
  vision_stat4_num:    '24',
  vision_stat4_label:  '월평균 워크숍',
  vision_timeline:     JSON.stringify([
    { year: '2018', event: 'LAB 설립', detail: 'ARTHEUS 시작, 코치 4명, 학생 12명으로 시작' },
    { year: '2022', event: 'Lab.',     detail: '첫 번째 개인 맞춤 연기 진단 시스템 런칭' },
    { year: '2024', event: '기업 교육 확장', detail: '기업 액팅 워크숍 및 리더십 프로그램 제공 시작' },
    { year: '2026', event: '통합 LAB 플랫폼', detail: '온라인-오프라인 통합 플랫폼 구축, AI 피드백 시스템 도입' },
  ]),

  // 연락처
  contact_email:   'support@c-art.co.kr',
  contact_phone:   '0507-1371-3854',
  contact_address: '서울특별시 마포구 와우산로23길 7-30 2층',
};

export type SiteContent = typeof SITE_DEFAULTS;

const merged = { ...SITE_DEFAULTS, ...Object.fromEntries(Object.entries(content.site).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)])) } as SiteContent;

export function useSiteContent() {
  return { content: merged, loading: false };
}
