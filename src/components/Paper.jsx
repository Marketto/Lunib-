import React from 'react';
import { motion, useAnimationControls } from 'framer-motion';

// ---------- Icone in carta ritagliata per le categorie ----------
// Ogni icona ha due strati: un'ombra di carta più scura sfalsata e la forma davanti.
const ICONS = {
  sonno: (c, d) => (
    <>
      <path d="M38 10a22 22 0 1 0 14 34A18 18 0 0 1 38 10z" fill={d} transform="translate(3 3)" />
      <path d="M38 10a22 22 0 1 0 14 34A18 18 0 0 1 38 10z" fill={c} />
      <path d="M50 12l2 5 5 1-4 3 1 5-4-3-4 3 1-5-4-3 5-1z" fill="#fff" opacity=".9" />
    </>
  ),
  alimentazione: (c, d) => (
    <>
      <path d="M32 20c-12-6-24 2-22 18 2 14 12 20 22 16 10 4 20-2 22-16 2-16-10-24-22-18z" fill={d} transform="translate(3 3)" />
      <path d="M32 20c-12-6-24 2-22 18 2 14 12 20 22 16 10 4 20-2 22-16 2-16-10-24-22-18z" fill={c} />
      <path d="M32 20c0-6 2-10 6-12" stroke="#5c4a3a" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M36 12c6-4 12-2 14 2-6 3-11 2-14-2z" fill="#7cbf8e" />
    </>
  ),
  salute: (c, d) => (
    <>
      <path d="M32 54S10 40 10 24a11 11 0 0 1 22-3 11 11 0 0 1 22 3c0 16-22 30-22 30z" fill={d} transform="translate(3 3)" />
      <path d="M32 54S10 40 10 24a11 11 0 0 1 22-3 11 11 0 0 1 22 3c0 16-22 30-22 30z" fill={c} />
      <path d="M29 24h6v6h6v6h-6v6h-6v-6h-6v-6h6z" fill="#fff" />
    </>
  ),
  sviluppo: (c, d) => (
    <>
      <path d="M32 56V30" stroke={d} strokeWidth="6" strokeLinecap="round" transform="translate(3 3)" />
      <path d="M32 56V30" stroke="#6aa57e" strokeWidth="5" strokeLinecap="round" />
      <path d="M32 32C30 18 18 12 8 14c0 12 10 20 24 18z" fill={d} transform="translate(3 3)" />
      <path d="M32 32C30 18 18 12 8 14c0 12 10 20 24 18z" fill={c} />
      <path d="M32 28c2-12 12-18 24-16-1 11-10 18-24 16z" fill={c} opacity=".85" />
    </>
  ),
  linguaggio: (c, d) => (
    <>
      <path d="M12 14h40a6 6 0 0 1 6 6v20a6 6 0 0 1-6 6H28l-10 9v-9h-6a6 6 0 0 1-6-6V20a6 6 0 0 1 6-6z" fill={d} transform="translate(3 3)" />
      <path d="M12 14h40a6 6 0 0 1 6 6v20a6 6 0 0 1-6 6H28l-10 9v-9h-6a6 6 0 0 1-6-6V20a6 6 0 0 1 6-6z" fill={c} />
      <circle cx="22" cy="30" r="3.5" fill="#fff" /><circle cx="32" cy="30" r="3.5" fill="#fff" /><circle cx="42" cy="30" r="3.5" fill="#fff" />
    </>
  ),
  emozioni: (c, d) => (
    <>
      <circle cx="32" cy="32" r="20" fill={d} transform="translate(3 3)" />
      <g stroke={c} strokeWidth="5" strokeLinecap="round">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <line key={a} x1="32" y1="5" x2="32" y2="9" transform={`rotate(${a} 32 32)`} />
        ))}
      </g>
      <circle cx="32" cy="32" r="18" fill={c} />
      <circle cx="26" cy="30" r="2.5" fill="#5b4b6b" /><circle cx="38" cy="30" r="2.5" fill="#5b4b6b" />
      <path d="M25 37q7 6 14 0" stroke="#5b4b6b" strokeWidth="3" fill="none" strokeLinecap="round" />
    </>
  ),
  gioco: (c, d) => (
    <>
      <rect x="10" y="32" width="22" height="22" rx="4" fill={d} transform="translate(3 3)" />
      <rect x="10" y="32" width="22" height="22" rx="4" fill={c} />
      <rect x="34" y="32" width="22" height="22" rx="4" fill={d} transform="translate(3 3)" />
      <rect x="34" y="32" width="22" height="22" rx="4" fill="#a9c7ee" />
      <rect x="22" y="9" width="22" height="22" rx="4" fill={d} transform="translate(3 3) rotate(8 33 20)" />
      <rect x="22" y="9" width="22" height="22" rx="4" fill="#f1b4c3" transform="rotate(8 33 20)" />
    </>
  ),
  sicurezza: (c, d) => (
    <>
      <path d="M8 32a24 24 0 0 1 48 0c-4-4-8-4-12 0-4-4-8-4-12 0-4-4-8-4-12 0-4-4-8-4-12 0z" fill={d} transform="translate(3 3)" />
      <path d="M8 32a24 24 0 0 1 48 0c-4-4-8-4-12 0-4-4-8-4-12 0-4-4-8-4-12 0-4-4-8-4-12 0z" fill={c} />
      <path d="M32 32v18a5 5 0 0 1-10 0" stroke="#5b4b6b" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    </>
  )
};

const DARK = {
  '#b9b2ec': '#8f86d6', '#f7c48f': '#e09d5c', '#f1b4c3': '#d98aa0', '#a8d0be': '#76ae95',
  '#a9c7ee': '#7aa2d6', '#f7d79a': '#e0b45e', '#f5b39b': '#df8c70', '#9ed3d6': '#6db3b7'
};
export const darker = (c) => DARK[c] || c;

export function PaperIcon({ id, color, size = 56 }) {
  const draw = ICONS[id];
  if (!draw) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="paper-icon">
      {draw(color, DARK[color] || 'rgba(46,47,87,.18)')}
    </svg>
  );
}

// ---------- La giostrina della culla ----------
const HANGING = [
  { x: 60, len: 70, dur: 5.2, delay: 0, shape: 'moon', c: '#f7d79a', d: '#e8b864' },
  { x: 130, len: 105, dur: 6.1, delay: -1.3, shape: 'cloud', c: '#ffffff', d: '#cdd3ea' },
  { x: 200, len: 60, dur: 4.6, delay: -2.1, shape: 'star', c: '#f1b4c3', d: '#d98aa0' },
  { x: 270, len: 95, dur: 5.7, delay: -0.6, shape: 'heart', c: '#b9b2ec', d: '#8f86d6' },
  { x: 340, len: 72, dur: 6.6, delay: -3.2, shape: 'bird', c: '#a8d0be', d: '#76ae95' }
];

function Shape({ shape, c, d }) {
  const both = (el) => (
    <>
      <g transform="translate(3 3)" fill={d}>{el}</g>
      <g fill={c}>{el}</g>
    </>
  );
  switch (shape) {
    case 'moon': return both(<path d="M6 -22a22 22 0 1 0 16 36A18 18 0 0 1 6 -22z" transform="translate(-8 0)" />);
    case 'cloud': return both(<path d="M-26 10a12 12 0 0 1 4-23 16 16 0 0 1 30-2 12 12 0 0 1 18 13 10 10 0 0 1-4 12z" />);
    case 'star': return both(<path d="M0 -20l6 12 13 2-9 9 2 13-12-6-12 6 2-13-9-9 13-2z" />);
    case 'heart': return both(<path d="M0 18S-20 6-20-6a10 10 0 0 1 20-3 10 10 0 0 1 20 3C20 6 0 18 0 18z" />);
    case 'bird': return both(
      <g>
        <ellipse cx="0" cy="0" rx="18" ry="13" />
        <circle cx="14" cy="-10" r="9" />
        <path d="M22 -10l8 2-8 3z" fill="#f7c48f" />
      </g>
    );
    default: return null;
  }
}

function Hanging({ h, night }) {
  const ctrl = useAnimationControls();
  const nudge = () => ctrl.start({ rotate: [0, 22, -16, 10, -5, 0], transition: { duration: 2.2, ease: 'easeOut' } });
  return (
    <g transform={`translate(${h.x} 18)`}>
      <motion.g animate={ctrl} style={{ originX: 0, originY: 0 }} onClick={nudge} className="hang-tap">
        <g className="swing" style={{ animationDuration: `${h.dur}s`, animationDelay: `${h.delay}s` }}>
          <line x1="0" y1="0" x2="0" y2={h.len} stroke={night ? '#8d93c9' : '#9b9cc0'} strokeWidth="1.5" />
          <g transform={`translate(0 ${h.len + 20})`} className={night ? 'glow' : ''}>
            <Shape shape={h.shape} c={h.c} d={h.d} />
          </g>
        </g>
      </motion.g>
    </g>
  );
}

export function Mobile({ night = false, height = 190 }) {
  return (
    <svg className="mobile" viewBox="0 0 400 200" height={height} width="100%" preserveAspectRatio="xMidYMin meet" aria-hidden="true">
      <path d="M20 18 Q200 -8 380 18" stroke={night ? '#8d93c9' : '#b9a58f'} strokeWidth="5" fill="none" strokeLinecap="round" />
      {HANGING.map((h) => <Hanging key={h.x} h={h} night={night} />)}
    </svg>
  );
}

// ---------- Sfondo: nuvole di carta e stelline ----------
export function Backdrop({ night }) {
  return (
    <div className={`backdrop ${night ? 'is-night' : ''}`} aria-hidden="true">
      <div className="paper-cloud pc1" />
      <div className="paper-cloud pc2" />
      <div className="paper-cloud pc3" />
      <div className="night-sky">
        {Array.from({ length: 28 }, (_, i) => (
          <span key={i} className="tw" style={{
            left: `${(i * 37) % 100}%`, top: `${(i * 53) % 70}%`,
            animationDelay: `${(i % 7) * 0.6}s`, transform: `scale(${0.5 + (i % 4) * 0.25})`
          }} />
        ))}
      </div>
      <div className="grain" />
    </div>
  );
}
