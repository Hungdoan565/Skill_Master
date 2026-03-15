import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

const SIZE = 56;
const STROKE = 5;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function getColor(value) {
  if (value >= 80) return { stroke: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' };
  if (value >= 60) return { stroke: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' };
  return { stroke: '#f43f5e', bg: 'rgba(244, 63, 94, 0.1)' };
}

export function ProgressRing({ value = 0, className }) {
  const [displayValue, setDisplayValue] = useState(0);
  const rafRef = useRef(null);
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }

    const start = performance.now();
    const duration = 600;

    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(eased * value);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, prefersReducedMotion]);

  const offset = CIRCUMFERENCE - (displayValue / 100) * CIRCUMFERENCE;
  const { stroke, bg } = getColor(value);

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={SIZE} height={SIZE} className="-rotate-90">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill={bg}
          stroke="currentColor"
          strokeWidth={STROKE}
          className="text-slate-200"
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={stroke}
          strokeWidth={STROKE}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-150"
        />
      </svg>
      <span className="absolute text-xs font-bold" style={{ color: stroke }}>
        {Math.round(displayValue)}%
      </span>
    </div>
  );
}
