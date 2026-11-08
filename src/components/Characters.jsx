import React from 'react';

// Personaggi in carta ritagliata con faccina sorridente. Originali, disegnati per Lunibù.
const INK = '#2e2f57';
const CHEEK = '#f29bb0';

function Face({ y = 0, s = 1, color = INK }) {
  return (
    <g transform={`translate(0 ${y}) scale(${s})`}>
      <circle cx="-7" cy="-2" r="2.6" fill={color} />
      <circle cx="7" cy="-2" r="2.6" fill={color} />
      <path d="M-5 4 q5 5 10 0" stroke={color} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <circle cx="-12" cy="3" r="3" fill={CHEEK} opacity=".7" />
      <circle cx="12" cy="3" r="3" fill={CHEEK} opacity=".7" />
    </g>
  );
}

const paper = (shape, c, d) => (
  <>
    <g transform="translate(3 3)" fill={d}>{shape}</g>
    <g fill={c}>{shape}</g>
  </>
);

export const CHARACTERS = {
  cloud: () => (
    <>
      {paper(<path d="M-30 14a12 12 0 0 1 3-24 17 17 0 0 1 32-5 13 13 0 0 1 24 10 11 11 0 0 1-3 19z" />, '#ffffff', '#cdd3ea')}
      <Face y={2} />
    </>
  ),
  star: () => (
    <>
      {paper(<path d="M0 -30l9 18 20 3-14.5 14 3.5 20L0 15.5-18 25l3.5-20L-29-9l20-3z" />, '#f7d79a', '#e0b45e')}
      <Face y={0} s={0.8} />
    </>
  ),
  sun: () => (
    <>
      <g stroke="#f7b955" strokeWidth="6" strokeLinecap="round">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => <line key={a} x1="0" y1="-32" x2="0" y2="-24" transform={`rotate(${a})`} />)}
      </g>
      {paper(<circle r="20" />, '#f7c48f', '#e09d5c')}
      <Face y={0} s={0.85} />
    </>
  ),
  leaf: () => (
    <>
      {paper(<path d="M0 -30C20 -20 22 10 0 28C-22 10 -20 -20 0 -30z" />, '#a8d0be', '#76ae95')}
      <path d="M0 -24V24" stroke="#76ae95" strokeWidth="2" />
      <Face y={2} s={0.75} />
    </>
  ),
  ladybug: () => (
    <>
      {paper(<circle cy="4" r="22" />, '#ef7b7b', '#c95858')}
      <path d="M0 -16V26" stroke={INK} strokeWidth="2" />
      {[[-11, -2], [11, -2], [-9, 14], [9, 14]].map(([x, y]) => <circle key={x + ',' + y} cx={x} cy={y} r="3.5" fill={INK} />)}
      <circle cy="-18" r="12" fill={INK} />
      <g transform="translate(0 -18) scale(.6)">
        <circle cx="-7" cy="-2" r="2.6" fill="#fff" /><circle cx="7" cy="-2" r="2.6" fill="#fff" />
        <path d="M-5 4 q5 5 10 0" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      </g>
    </>
  ),
  bear: () => (
    <>
      {paper(<><circle cx="-17" cy="-17" r="9" /><circle cx="17" cy="-17" r="9" /><circle r="23" /></>, '#d9b99b', '#b08e6e')}
      <ellipse cy="9" rx="10" ry="7" fill="#f3e3d1" />
      <circle cy="5" r="3" fill={INK} />
      <Face y={-3} s={0.8} />
    </>
  ),
  moon: () => (
    <>
      {paper(<path d="M8 -28a28 28 0 1 0 20 46A23 23 0 0 1 8 -28z" />, '#f7d79a', '#e0b45e')}
      <g transform="translate(-6 2)"><Face s={0.7} /></g>
    </>
  ),
  heart: () => (
    <>
      {paper(<path d="M0 26S-26 10-26-6a13 13 0 0 1 26-4 13 13 0 0 1 26 4C26 10 0 26 0 26z" />, '#f1b4c3', '#d98aa0')}
      <Face y={-2} s={0.75} />
    </>
  ),
  apple: () => (
    <>
      {paper(<path d="M0 -14c-14-8-28 2-26 18 2 16 14 22 26 18 12 4 24-2 26-18 2-16-12-26-26-18z" />, '#f5b39b', '#df8c70')}
      <path d="M0 -14c0-6 2-10 6-12" stroke="#7a5a3a" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M4 -24c6-4 12-2 14 2-6 3-11 2-14-2z" fill="#7cbf8e" />
      <Face y={6} s={0.8} />
    </>
  ),
  flower: () => (
    <>
      {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cy="-18" rx="11" ry="14" fill="#b9b2ec" transform={`rotate(${a})`} />)}
      {paper(<circle r="14" />, '#f7d79a', '#e0b45e')}
      <Face y={0} s={0.6} />
    </>
  ),
  drop: () => (
    <>
      {paper(<path d="M0 -30C10 -14 22 0 22 10a22 22 0 0 1-44 0c0-10 12-24 22-40z" />, '#a9c7ee', '#7aa2d6')}
      <Face y={10} s={0.75} />
    </>
  )
};

export function Character({ name, size = 70 }) {
  const C = CHARACTERS[name] || CHARACTERS.cloud;
  return (
    <svg viewBox="-40 -40 80 80" width={size} height={size} aria-hidden="true" style={{ overflow: 'visible' }}>
      <C />
    </svg>
  );
}

// Gruppi di personaggi per destinazione (categoria o sezione)
export const CHAR_SETS = {
  sonno: ['moon', 'star', 'cloud', 'star', 'moon', 'cloud'],
  alimentazione: ['apple', 'leaf', 'sun', 'apple', 'flower', 'leaf'],
  salute: ['heart', 'sun', 'cloud', 'heart', 'drop', 'star'],
  sviluppo: ['leaf', 'flower', 'ladybug', 'sun', 'leaf', 'flower'],
  linguaggio: ['cloud', 'star', 'bear', 'heart', 'cloud', 'sun'],
  emozioni: ['sun', 'heart', 'bear', 'flower', 'sun', 'heart'],
  gioco: ['bear', 'ladybug', 'star', 'sun', 'bear', 'flower'],
  sicurezza: ['ladybug', 'leaf', 'drop', 'sun', 'cloud', 'ladybug'],
  suoni: ['moon', 'star', 'cloud', 'drop', 'star', 'moon'],
  giochi: ['bear', 'ladybug', 'sun', 'flower', 'star', 'heart'],
  bimbi: ['bear', 'heart', 'star', 'cloud', 'flower', 'sun'],
  home: ['cloud', 'sun', 'leaf', 'ladybug', 'bear', 'star']
};
