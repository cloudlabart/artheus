import { motion } from 'motion/react';
import { MapPin, Phone, Mail } from 'lucide-react';
import { useSiteContent } from '../hooks/useSiteContent';
import { InstagramConsultButton } from '../components/InstagramConsultButton';

export function ContactPage() {
  const { content } = useSiteContent();

  const info = [
    { icon: MapPin, label: '주소', value: content.contact_address },
    { icon: Phone, label: '전화', value: content.contact_phone },
    { icon: Mail, label: '이메일', value: content.contact_email },
  ];

  return (
    <div className="min-h-screen text-[#F3F0EA]">
      {/* 히어로 — 코트 비주얼 */}
      <section className="relative overflow-hidden min-h-[50vh] lg:min-h-[60vh] flex items-end">
        <img
          src="/uploads/20261124-105231-파우더-블루-코트-생생한-한-점-0os2.png"
          alt="파우더 블루 코트 — ARTHEUS"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A1F33] via-[#0A1F33]/50 to-transparent" />
        <div className="relative z-10 max-w-[1200px] mx-auto px-5 sm:px-8 pb-12 sm:pb-16 w-full">
          <span className="court-label block mb-4">Contact</span>
          <h1 className="keep-ko text-[36px] sm:text-[52px] lg:text-[64px] font-black leading-[1.05] tracking-[-0.04em] text-[#F3F0EA]">문의</h1>
          <p className="keep-ko mt-4 text-base sm:text-lg leading-[1.75] text-[#F3F0EA]/80 max-w-xl">
            지금 연습에서 막히는 부분을 알려주세요.
            <br />
            목표와 현재 수준에 맞는 과정을 안내해 드립니다.
          </p>
        </div>
      </section>

      {/* 연락처 + CTA */}
      <section className="max-w-[1200px] mx-auto px-5 sm:px-8 py-14 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* 왼쪽: 연락처 */}
          <div>
            <span className="court-label block mb-6">Information</span>
            <div className="space-y-6">
              {info.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-full border border-[#A9C5D9]/15 flex items-center justify-center shrink-0 mt-0.5">
                    <item.icon className="w-4 h-4 text-[#A9C5D9]/60" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#A9C5D9]/50 uppercase tracking-wider mb-1">{item.label}</p>
                    <p className="keep-ko text-base sm:text-lg text-[#F3F0EA] font-medium">{item.value}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-10 pt-8 border-t border-[#A9C5D9]/12">
              <p className="court-label block mb-3">Hours</p>
              <div className="space-y-2 text-sm text-[#8CADC8]/70">
                <p>평일 14:00 — 22:00</p>
                <p>주말 10:00 — 18:00</p>
                <p className="text-[#A9C5D9]/40">공휴일 휴무</p>
              </div>
            </div>
          </div>

          {/* 오른쪽: CTA */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="court-card p-8 sm:p-12 flex flex-col items-center justify-center text-center"
          >
            <span className="court-label block mb-4">Consultation</span>
            <h2 className="keep-ko text-2xl sm:text-3xl font-black text-[#F3F0EA] leading-[1.2]">
              인스타그램 DM으로
              <br />
              편하게 상담하세요.
            </h2>
            <div className="w-12 h-px bg-[#A9C5D9]/20 mx-auto my-6" />
            <p className="keep-ko text-sm leading-[1.75] text-[#8CADC8]/60 max-w-sm mb-8">
              경험·목표·현재 고민을 보내주시면 맞는 과정과 코치를 안내해 드립니다. 부담 없이 연락 주세요.
            </p>
            <InstagramConsultButton
              location="contact_cta"
              label="상담하기"
              tone="on-blue"
              className="px-10 py-4 !bg-[#F3F0EA] !text-[#132B3F] hover:!bg-white text-base"
            />
          </motion.div>
        </div>
      </section>

      {/* 위치 */}
      <section className="border-t border-[#A9C5D9]/12">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-14 sm:py-20">
          <span className="court-label block mb-4">Location</span>
          <h2 className="keep-ko text-2xl sm:text-3xl font-black text-[#F3F0EA] mb-6">오시는 길</h2>
          <div className="court-card p-6 sm:p-8">
            <p className="keep-ko text-base text-[#8CADC8]/80 leading-[1.75]">
              {content.contact_address}
            </p>
            <p className="keep-ko text-sm text-[#A9C5D9]/50 mt-3">
              홍대입구역 2번 출구 도보 10분 · 망원역 1번 출구 도보 5분
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
