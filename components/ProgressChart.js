'use client';
import { useState } from 'react';
import { fmtDate } from '@/lib/client';

// Lightweight responsive SVG line chart (no chart library needed)
export default function ProgressChart({ entries = [], metric = 'weight' }) {
  const [hover, setHover] = useState(null);
  const pts = entries.filter((e) => e[metric] != null);
  if (pts.length < 2) {
    return (
      <div className="grid h-56 place-items-center rounded-xl bg-slate-50 text-sm text-slate-500">
        Add at least two entries to see your trend.
      </div>
    );
  }
  const W = 640, H = 240, P = { l: 44, r: 16, t: 16, b: 32 };
  const vals = pts.map((p) => p[metric]);
  const min = Math.floor(Math.min(...vals) - 1);
  const max = Math.ceil(Math.max(...vals) + 1);
  const x = (i) => P.l + (i * (W - P.l - P.r)) / (pts.length - 1);
  const y = (v) => P.t + ((max - v) * (H - P.t - P.b)) / (max - min || 1);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p[metric])}`).join(' ');
  const area = `${line} L${x(pts.length - 1)},${H - P.b} L${x(0)},${H - P.b} Z`;
  const ticks = Array.from({ length: 4 }, (_, i) => min + ((max - min) * i) / 3);
  const unit = metric === 'weight' ? 'kg' : metric === 'waist' ? 'cm' : '';

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${metric} over time`}>
        <defs>
          <linearGradient id={`g-${metric}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#289b68" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#289b68" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} stroke="#e2e8f0" strokeDasharray="3 4" />
            <text x={P.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#94a3b8">{t.toFixed(metric === 'bmi' ? 1 : 0)}</text>
          </g>
        ))}
        <path d={area} fill={`url(#g-${metric})`} />
        <path d={line} fill="none" stroke="#1a7d53" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p, i) => (
          <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <circle cx={x(i)} cy={y(p[metric])} r="14" fill="transparent" />
            <circle cx={x(i)} cy={y(p[metric])} r={hover === i ? 6 : 4} fill="white" stroke="#1a7d53" strokeWidth="2.5" />
          </g>
        ))}
        <text x={P.l} y={H - 8} fontSize="11" fill="#94a3b8">{fmtDate(pts[0].date)}</text>
        <text x={W - P.r} y={H - 8} fontSize="11" fill="#94a3b8" textAnchor="end">{fmtDate(pts[pts.length - 1].date)}</text>
      </svg>
      {hover !== null && (
        <div className="pointer-events-none absolute rounded-lg bg-ink px-2.5 py-1.5 text-xs text-white shadow-lg"
          style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(pts[hover][metric]) / H) * 100}%`, transform: 'translate(-50%, -130%)' }}>
          <b>{pts[hover][metric]} {unit}</b> · {fmtDate(pts[hover].date)}
        </div>
      )}
    </div>
  );
}
