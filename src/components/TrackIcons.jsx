import React from 'react';

// Icone a tema per rumori e musiche. Le parti con classe "anim-*" si muovono quando la traccia suona.
const INK = '#2e2f57';

const ICONS = {
  womb: () => (
    <>
      <circle cx="24" cy="24" r="17" fill="#fff" opacity=".55" />
      <path className="anim-beat" d="M24 33s-9-5.6-9-12a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6.4-9 12-9 12z" fill="#e2768f" />
    </>
  ),
  shush: () => (
    <>
      <circle cx="18" cy="26" r="9" fill="#fff" />
      <rect x="16.5" y="13" width="3.5" height="16" rx="1.75" fill={INK} />
      <g className="anim-wave" stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round">
        <path d="M30 18q4 6 0 12" /><path d="M35 15q6 9 0 18" opacity=".6" />
      </g>
    </>
  ),
  car: () => (
    <g className="anim-bob">
      <path d="M8 29v-5l4-8h18l7 8h3v5z" fill="#fff" />
      <path d="M14 18h7v6h-10zM24 18h5l5 6h-10z" fill="#a9c7ee" />
      <circle cx="15" cy="30" r="4" fill={INK} /><circle cx="33" cy="30" r="4" fill={INK} />
      <path d="M4 37h40" stroke="#fff" strokeWidth="2" strokeDasharray="4 4" className="anim-road" />
    </g>
  ),
  dryer: () => (
    <>
      <path d="M10 14h18a8 8 0 0 1 0 16H18z" fill="#fff" />
      <path d="M17 28l-3 13h6l3-13z" fill={INK} />
      <g className="anim-air" stroke="#fff" strokeWidth="2.4" strokeLinecap="round">
        <path d="M37 18h6" /><path d="M38 22h7" /><path d="M37 26h6" />
      </g>
    </>
  ),
  white: () => (
    <g className="anim-drift">
      <path d="M12 30a7 7 0 0 1 2-13.6A10 10 0 0 1 33 15a7 7 0 0 1 4 15z" fill="#fff" />
      {[16, 22, 28, 34].map((x, i) => <circle key={x} cx={x} cy={36 + (i % 2) * 3} r="1.4" fill="#fff" />)}
    </g>
  ),
  pink: () => (
    <g className="anim-drift">
      <path d="M12 30a7 7 0 0 1 2-13.6A10 10 0 0 1 33 15a7 7 0 0 1 4 15z" fill="#fff" />
      <path d="M12 30a7 7 0 0 1 2-13.6A10 10 0 0 1 33 15a7 7 0 0 1 4 15z" fill="#e88aa3" opacity=".45" />
    </g>
  ),
  brown: () => (
    <>
      <path d="M4 38l12-18 8 10 6-8 14 16z" fill="#fff" opacity=".9" />
      <path d="M4 38l12-18 8 10 6-8 14 16z" fill="#8a6447" opacity=".45" />
      <circle className="anim-pulse" cx="34" cy="13" r="4" fill="#fff" />
    </>
  ),
  fan: () => (
    <>
      <g className="anim-spin" style={{ transformOrigin: '24px 22px' }}>
        {[0, 120, 240].map((a) => <ellipse key={a} cx="24" cy="13" rx="5" ry="9" fill="#fff" transform={`rotate(${a} 24 22)`} />)}
      </g>
      <circle cx="24" cy="22" r="3" fill={INK} />
      <path d="M24 25v12M17 40h14" stroke={INK} strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  rain: () => (
    <>
      <path d="M11 24a7 7 0 0 1 2-13.6A10 10 0 0 1 32 9a7 7 0 0 1 4 15z" fill="#fff" />
      <g className="anim-rain" stroke="#5b86c7" strokeWidth="2.4" strokeLinecap="round">
        <path d="M15 29l-2 5" /><path d="M23 29l-2 5" /><path d="M31 29l-2 5" /><path d="M19 36l-2 5" /><path d="M27 36l-2 5" />
      </g>
    </>
  ),
  waves: () => (
    <g className="anim-wave-x" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
      <path d="M2 20q5-6 10 0t10 0 10 0 10 0 10 0" />
      <path d="M2 28q5-6 10 0t10 0 10 0 10 0 10 0" opacity=".8" />
      <path d="M2 36q5-6 10 0t10 0 10 0 10 0 10 0" opacity=".6" />
    </g>
  ),
  brahms: () => (
    <>
      <path d="M26 8a15 15 0 1 0 10 25A12 12 0 0 1 26 8z" fill="#fff" />
      <g className="anim-float" fill={INK}>
        <path d="M33 14v10.5a3 3 0 1 1-2-2.8V12l7-2v3z" />
      </g>
    </>
  ),
  twinkle: () => (
    <>
      <path className="anim-twinkle" d="M24 7l4.5 9.5 10.5 1.5-7.6 7.3 1.8 10.5L24 30.8l-9.2 5 1.8-10.5L9 18l10.5-1.5z" fill="#fff" />
      <circle cx="38" cy="36" r="2" fill="#fff" className="anim-twinkle2" /><circle cx="9" cy="34" r="1.5" fill="#fff" className="anim-twinkle" />
    </>
  ),
  carillon: () => (
    <>
      <rect x="9" y="24" width="30" height="14" rx="3" fill="#fff" />
      <rect x="9" y="24" width="30" height="4" fill="#7fae6a" opacity=".6" />
      <g className="anim-spin" style={{ transformOrigin: '24px 18px' }}>
        <path d="M24 10l3 8h-6z" fill={INK} /><circle cx="24" cy="10" r="2.4" fill={INK} />
      </g>
      <path d="M24 18v6" stroke={INK} strokeWidth="2" />
    </>
  ),
  moon: () => (
    <>
      <circle cx="24" cy="24" r="14" fill="#fff" className="anim-pulse" />
      <circle cx="19" cy="20" r="2.5" fill="#d9d5f5" /><circle cx="28" cy="29" r="3.5" fill="#d9d5f5" /><circle cx="29" cy="18" r="1.6" fill="#d9d5f5" />
    </>
  ),
  bubbles: () => (
    <g fill="none" stroke="#fff" strokeWidth="2.6">
      <circle cx="18" cy="28" r="9" className="anim-rise" /><circle cx="32" cy="18" r="6" className="anim-rise2" /><circle cx="34" cy="34" r="3.5" className="anim-rise" />
    </g>
  ),
  marimba: () => (
    <>
      {[[8, 14], [16, 12], [24, 10], [32, 8]].map(([x, y], i) => (
        <rect key={x} x={x} y={y} width="6" height={34 - y * 0.8} rx="2" fill="#fff" className={i % 2 ? 'anim-hit2' : 'anim-hit'} />
      ))}
      <path d="M6 40h34" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  'twinkle-play': () => (
    <>
      <path d="M20 9l3.6 7.6 8.4 1.2-6 5.8 1.4 8.4-7.4-4-7.4 4 1.4-8.4-6-5.8 8.4-1.2z" fill="#fff" className="anim-bounce" />
      <path d="M37 22v10a2.5 2.5 0 1 1-2-2.4V20l6-2v3z" fill={INK} className="anim-float" />
    </>
  ),
  'fra-martino': () => (
    <g className="anim-swing" style={{ transformOrigin: '24px 8px' }}>
      <path d="M24 8a2 2 0 0 1 2 2v1a11 11 0 0 1 9 11v8l3 4H10l3-4v-8a11 11 0 0 1 9-11v-1a2 2 0 0 1 2-2z" fill="#fff" />
      <circle cx="24" cy="38" r="3.5" fill={INK} />
    </g>
  ),
  dance: () => (
    <>
      <g className="anim-shake" style={{ transformOrigin: '16px 34px' }}>
        <ellipse cx="16" cy="18" rx="7" ry="9" fill="#fff" /><path d="M16 27v13" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      </g>
      <g className="anim-shake2" style={{ transformOrigin: '32px 34px' }}>
        <ellipse cx="32" cy="18" rx="7" ry="9" fill="#f7c48f" /><path d="M32 27v13" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      </g>
    </>
  )
};

export default function TrackIcon({ id }) {
  const draw = ICONS[id];
  return (
    <svg viewBox="0 0 48 48" width="34" height="34" aria-hidden="true" className="track-icon">
      {draw ? draw() : null}
    </svg>
  );
}
