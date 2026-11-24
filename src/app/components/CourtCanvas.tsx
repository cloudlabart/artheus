/**
 * CourtCanvas — 테니스 코트 라인이 스크롤에 따라 움직이며 격자를 이루는 배경
 *
 * 전체 뷰포트를 채우는 딥블루 코트 위에 아이보리 라인이 스크롤 위치에 따라
 * 다양한 형태로 변환됩니다. position:fixed로 화면 뒤에 깔립니다.
 */
import { useEffect, useRef, useState, useCallback } from 'react';

/** 스크롤 비율(0–1)에 따라 라인 좌표를 반환 */
function getCourtLines(progress: number, w: number, h: number) {
  // 기본 코트 비율: 테니스 코트를 화면에 맞춤
  const cx = w / 2;
  const cy = h / 2;

  // 코트 경계 (스크롤에 따라 확장)
  const expand = progress * 0.4; // 0 → 0.4
  const courtL = cx - (w * 0.38 + w * expand * 0.12);
  const courtR = cx + (w * 0.38 + w * expand * 0.12);
  const courtT = cy - (h * 0.42 + h * expand * 0.08);
  const courtB = cy + (h * 0.42 + h * expand * 0.08);

  // 서비스 라인 (스크롤 → 격자로 분할)
  const gridCount = Math.floor(2 + progress * 6); // 2 → 8 lines
  const hLines: [number, number, number, number][] = [];
  const vLines: [number, number, number, number][] = [];

  // 외곽 사각형
  hLines.push([courtL, courtT, courtR, courtT]);
  hLines.push([courtL, courtB, courtR, courtB]);
  vLines.push([courtL, courtT, courtL, courtB]);
  vLines.push([courtR, courtT, courtR, courtB]);

  // 중앙선 (네트)
  hLines.push([courtL, cy, courtR, cy]);
  vLines.push([cx, courtT, cx, courtB]);

  // 스크롤에 따라 추가 격자선
  for (let i = 1; i <= gridCount; i++) {
    const t = i / (gridCount + 1);
    // 수평선
    const y = courtT + (courtB - courtT) * t;
    if (Math.abs(y - cy) > 10) {
      const offset = Math.sin(progress * Math.PI + i) * w * 0.03 * (1 - progress);
      hLines.push([courtL + offset, y, courtR + offset, y]);
    }
    // 수직선
    const x = courtL + (courtR - courtL) * t;
    if (Math.abs(x - cx) > 10) {
      const offset = Math.cos(progress * Math.PI + i) * h * 0.02 * (1 - progress);
      vLines.push([x, courtT + offset, x, courtB + offset]);
    }
  }

  // 서비스 박스 (초반에만 보이고 스크롤 시 격자에 흡수)
  const serviceFade = Math.max(0, 1 - progress * 3);
  if (serviceFade > 0.05) {
    const sT = cy - h * 0.18 * serviceFade;
    const sB = cy + h * 0.18 * serviceFade;
    hLines.push([courtL + (cx - courtL) * 0.15, sT, courtR - (courtR - cx) * 0.15, sT]);
    hLines.push([courtL + (cx - courtL) * 0.15, sB, courtR - (courtR - cx) * 0.15, sB]);
  }

  return { hLines, vLines, serviceFade, courtL, courtR, courtT, courtB };
}

export function CourtCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const [dims, setDims] = useState({ w: 0, h: 0 });

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docH > 0 ? Math.min(1, window.scrollY / docH) : 0;

    // 배경: 딥블루 코트 표면
    ctx.fillStyle = '#0F2D47';
    ctx.fillRect(0, 0, w, h);

    // 코트 표면 그라디언트 (약간의 깊이감)
    const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.7);
    grad.addColorStop(0, 'rgba(21, 57, 86, 0.6)');
    grad.addColorStop(1, 'rgba(10, 30, 50, 0.9)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const { hLines, vLines, serviceFade } = getCourtLines(progress, w, h);

    // 라인 그리기
    ctx.lineCap = 'round';

    // 보조 격자선 (얇고 투명)
    const gridOpacity = 0.08 + progress * 0.12;
    ctx.strokeStyle = `rgba(243, 240, 234, ${gridOpacity})`;
    ctx.lineWidth = 0.5 * (window.devicePixelRatio || 1);

    [...hLines.slice(6), ...vLines.slice(6)].forEach(([x1, y1, x2, y2]) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });

    // 서비스 박스 (초반 전용)
    if (serviceFade > 0.05) {
      ctx.strokeStyle = `rgba(169, 197, 217, ${serviceFade * 0.3})`;
      ctx.lineWidth = 1 * (window.devicePixelRatio || 1);
      hLines.slice(-2).forEach(([x1, y1, x2, y2]) => {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });
    }

    // 주요 격자선
    ctx.strokeStyle = `rgba(243, 240, 234, ${0.15 + progress * 0.1})`;
    ctx.lineWidth = 1 * (window.devicePixelRatio || 1);
    [...hLines.slice(4, 6), ...vLines.slice(4, 6)].forEach(([x1, y1, x2, y2]) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });

    // 외곽 + 중앙선 (가장 밝음)
    ctx.strokeStyle = 'rgba(243, 240, 234, 0.25)';
    ctx.lineWidth = 1.5 * (window.devicePixelRatio || 1);
    [...hLines.slice(0, 4), ...vLines.slice(0, 4)].forEach(([x1, y1, x2, y2]) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });

    // 코너 마크 (에디토리얼 느낌)
    const corners = getCourtLines(progress, w, h);
    const markLen = 20 + progress * 15;
    const markOpacity = 0.3 + progress * 0.15;
    ctx.strokeStyle = `rgba(169, 197, 217, ${markOpacity})`;
    ctx.lineWidth = 2 * (window.devicePixelRatio || 1);

    // 좌상
    ctx.beginPath();
    ctx.moveTo(corners.courtL, corners.courtT + markLen);
    ctx.lineTo(corners.courtL, corners.courtT);
    ctx.lineTo(corners.courtL + markLen, corners.courtT);
    ctx.stroke();
    // 우상
    ctx.beginPath();
    ctx.moveTo(corners.courtR - markLen, corners.courtT);
    ctx.lineTo(corners.courtR, corners.courtT);
    ctx.lineTo(corners.courtR, corners.courtT + markLen);
    ctx.stroke();
    // 좌하
    ctx.beginPath();
    ctx.moveTo(corners.courtL, corners.courtB - markLen);
    ctx.lineTo(corners.courtL, corners.courtB);
    ctx.lineTo(corners.courtL + markLen, corners.courtB);
    ctx.stroke();
    // 우하
    ctx.beginPath();
    ctx.moveTo(corners.courtR - markLen, corners.courtB);
    ctx.lineTo(corners.courtR, corners.courtB);
    ctx.lineTo(corners.courtR, corners.courtB - markLen);
    ctx.stroke();
  }, []);

  useEffect(() => {
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      setDims({ w, h });
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.scale(dpr, dpr);
      }
      draw();
    };

    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ width: dims.w, height: dims.h }}
    />
  );
}
