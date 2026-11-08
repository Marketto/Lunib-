import React from 'react';
import { CHARACTERS } from './Characters.jsx';

// Illustrazioni "da manuale" per i giochi: famiglia di orsetti in carta ritagliata.
const INK = '#2e2f57';
const FUR = '#d9b99b', FUR_D = '#b08e6e', CUB = '#e8cdb2', CUB_D = '#c4a283', MUZ = '#f3e3d1';

function Face({ mood = 'happy', s = 1 }) {
  return (
    <g transform={`scale(${s})`}>
      {mood === 'closed' ? (
        <>
          <path d="M-10 -4 q3 -3 6 0" stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M4 -4 q3 -3 6 0" stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="-7" cy="-4" r="2.6" fill={INK} />
          <circle cx="7" cy="-4" r="2.6" fill={INK} />
        </>
      )}
      <ellipse cy="5" rx="8" ry="6" fill={MUZ} />
      <circle cy="3" r="2.4" fill={INK} />
      {mood === 'laugh'
        ? <path d="M-4 7 q4 6 8 0z" fill={INK} />
        : <path d="M-3.5 7 q3.5 3.5 7 0" stroke={INK} strokeWidth="1.8" fill="none" strokeLinecap="round" />}
      <circle cx="-11" cy="3" r="2.6" fill="#f29bb0" opacity=".6" />
      <circle cx="11" cy="3" r="2.6" fill="#f29bb0" opacity=".6" />
    </g>
  );
}

// arms: 'down' | 'up' | 'front' | 'eyes' | 'clap' | 'side'
function Bear({ x, y, s = 1, cub = false, arms = 'down', mood = 'happy', flip = false, lying = false }) {
  const c = cub ? CUB : FUR, d = cub ? CUB_D : FUR_D;
  const armPos = {
    down: [[-22, 18, 20], [22, 18, -20]],
    up: [[-24, -8, 150], [24, -8, -150]],
    front: [[-14, 14, 70], [14, 14, -70]],
    eyes: [[-10, -36, 160], [10, -36, -160]],
    clap: [[-6, 6, 60], [6, 6, -60]],
    side: [[-24, 10, 60], [22, 18, -20]]
  }[arms];
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s}) ${lying ? 'rotate(-80)' : ''}`}>
      <ellipse cx="3" cy="24" rx="24" ry="28" fill={d} />
      <ellipse cy="21" rx="24" ry="28" fill={c} />
      <ellipse cy="26" rx="13" ry="15" fill={MUZ} opacity=".7" />
      <g transform="translate(0 -22)">
        <circle cx="-16" cy="-16" r="8" fill={d} /><circle cx="16" cy="-16" r="8" fill={d} />
        <circle cx="-16" cy="-16" r="4" fill={MUZ} /><circle cx="16" cy="-16" r="4" fill={MUZ} />
        <circle cx="2" cy="2" r="22" fill={d} />
        <circle r="22" fill={c} />
        {arms !== 'eyes' && <Face mood={mood} />}
        {arms === 'eyes' && <path d="M-4 9 q4 4 8 0" stroke={INK} strokeWidth="1.8" fill="none" strokeLinecap="round" />}
      </g>
      {armPos.map(([ax, ay, r], i) => (
        <ellipse key={i} cx={ax} cy={ay} rx="7" ry="14" fill={d} transform={`rotate(${r} ${ax} ${ay})`} />
      ))}
    </g>
  );
}

function Mini({ name, x, y, s = 0.5 }) {
  const C = CHARACTERS[name];
  return <g transform={`translate(${x} ${y}) scale(${s})`}><C /></g>;
}

const Note = ({ x, y, c = INK }) => <path d={`M${x} ${y}v-14l9 -3v13`} stroke={c} strokeWidth="2.5" fill="none" strokeLinecap="round" />;

const SCENES = {
  tummy: () => (
    <>
      <rect x="60" y="150" width="200" height="14" rx="7" fill="#c9e3b8" />
      <Bear x={110} y={132} s={0.75} cub lying mood="laugh" />
      <Bear x={215} y={128} s={0.9} lying flip mood="happy" />
      <Mini name="star" x={160} y={110} s={0.5} />
    </>
  ),
  faces: () => (
    <>
      <Bear x={110} y={110} s={1.1} arms="front" />
      <Bear x={205} y={125} s={0.8} cub arms="up" mood="laugh" />
      <g fill="#fff" stroke="#b9b2ec" strokeWidth="2">
        <rect x="130" y="30" width="34" height="22" rx="10" /><rect x="190" y="44" width="34" height="22" rx="10" />
      </g>
      <text x="147" y="46" fontSize="12" textAnchor="middle" fill={INK} fontWeight="700">ba</text>
      <text x="207" y="60" fontSize="12" textAnchor="middle" fill={INK} fontWeight="700">ba!</text>
    </>
  ),
  peekaboo: () => (
    <>
      <Bear x={115} y={110} s={1.15} arms="eyes" />
      <Bear x={215} y={128} s={0.8} cub arms="up" mood="laugh" />
      <text x="160" y="40" fontSize="18" textAnchor="middle" fill={INK} fontWeight="800" fontFamily="var(--display)">Cucù!</text>
    </>
  ),
  hide: () => (
    <>
      <Bear x={105} y={120} s={0.9} cub arms="front" />
      <g transform="translate(200 140)">
        <circle cx="-12" cy="-18" r="7" fill={FUR_D} />
        <path d="M-40 10 Q0 -40 40 10z" fill="#b9b2ec" /><path d="M-40 10 Q0 -32 40 10" stroke="#8f86d6" strokeWidth="3" fill="none" />
      </g>
      <text x="200" y="70" fontSize="22" textAnchor="middle" fill={INK} fontWeight="800">?</text>
    </>
  ),
  reading: () => (
    <>
      <Bear x={120} y={112} s={1.1} arms="front" />
      <Bear x={200} y={128} s={0.78} cub arms="front" mood="laugh" />
      <g transform="translate(160 132)">
        <path d="M-34 -16 L0 -10 L34 -16 L34 14 L0 20 L-34 14z" fill="#fff" stroke="#a9c7ee" strokeWidth="3" />
        <path d="M0 -10V20" stroke="#a9c7ee" strokeWidth="3" />
        <circle cx="-17" cy="0" r="6" fill="#f7c48f" /><path d="M8 -2h18M8 6h14" stroke="#c6cbe0" strokeWidth="3" />
      </g>
    </>
  ),
  puzzle: () => (
    <>
      <rect x="70" y="120" width="120" height="50" rx="8" fill="#fff" stroke="#c6cbe0" strokeWidth="3" />
      <path d="M90 130h30v12a6 6 0 0 0 0 12v6h-30z" fill="#f7c48f" />
      <path d="M125 130h30v30h-30z" fill="#a8d0be" />
      <path d="M160 130h22v30h-22z" fill="#f1b4c3" />
      <Bear x={235} y={118} s={0.85} cub arms="side" />
      <path d="M200 96h18v10a5 5 0 0 1 0 10v4h-18z" fill="#b9b2ec" transform="rotate(-15 209 106)" />
    </>
  ),
  blocks: () => (
    <>
      {[[70, 150, '#f7c48f'], [70, 124, '#a9c7ee'], [70, 98, '#f1b4c3']].map(([x, y, c], i) => <rect key={i} x={x} y={y} width="30" height="26" rx="4" fill={c} />)}
      {[[230, 150, '#f7c48f'], [230, 124, '#a9c7ee']].map(([x, y, c], i) => <rect key={i} x={x} y={y} width="30" height="26" rx="4" fill={c} />)}
      <rect x="228" y="92" width="30" height="26" rx="4" fill="#f1b4c3" transform="rotate(-12 243 105)" />
      <Bear x={160} y={125} s={0.85} cub arms="up" mood="laugh" />
    </>
  ),
  rhymes: () => (
    <>
      <Bear x={110} y={112} s={1.05} arms="clap" />
      <Bear x={210} y={128} s={0.78} cub arms="clap" mood="laugh" />
      <Note x={150} y={50} /><Note x={175} y={38} c="#8f86d6" /><Note x={250} y={60} c="#e09d5c" />
      {[60, 80, 100].map((x) => <circle key={x} cx={x} cy={40} r="6" fill="#f7d79a" />)}
    </>
  ),
  pretend: () => (
    <>
      <rect x="120" y="140" width="120" height="10" rx="5" fill="#d9b99b" />
      <g transform="translate(150 132)"><path d="M-10 -10h20v10a10 10 0 0 1-20 0z" fill="#fff" stroke="#a9c7ee" strokeWidth="2" /></g>
      <g transform="translate(205 132)"><path d="M-10 -10h20v10a10 10 0 0 1-20 0z" fill="#fff" stroke="#f1b4c3" strokeWidth="2" /></g>
      <Bear x={80} y={122} s={0.85} cub arms="front" mood="laugh" />
      <Mini name="bear" x={250} y={110} s={0.55} />
      <path d="M150 112q4-8 0-14M156 112q4-8 0-14" stroke="#c6cbe0" strokeWidth="2" fill="none" />
    </>
  ),
  freeze: () => (
    <>
      <Bear x={110} y={110} s={1.05} arms="up" mood="laugh" />
      <Bear x={215} y={126} s={0.8} cub arms="side" mood="closed" />
      <Note x={160} y={45} /><Note x={185} y={32} c="#8f86d6" />
      <text x="240" y="60" fontSize="14" fill={INK} fontWeight="800">STOP!</text>
    </>
  ),
  traffic: () => (
    <>
      <g transform="translate(240 40)">
        <rect x="-16" y="0" width="32" height="74" rx="10" fill={INK} />
        <circle cy="18" r="10" fill="#ef7b7b" /><circle cy="40" r="10" fill="#b9b2ec" /><circle cy="60" r="8" fill="#7cc4a0" opacity=".4" />
        <rect x="-3" y="74" width="6" height="80" fill={INK} />
      </g>
      <Bear x={120} y={122} s={0.85} cub arms="eyes" />
      <Bear x={60} y={110} s={1} arms="up" mood="laugh" />
    </>
  ),
  board: () => (
    <>
      {Array.from({ length: 10 }, (_, i) => (
        <g key={i}>
          <rect x={30 + i * 26} y="130" width="24" height="24" rx="5" fill={['#f7d79a', '#a9c7ee', '#f1b4c3', '#a8d0be'][i % 4]} />
          <text x={42 + i * 26} y="147" fontSize="11" textAnchor="middle" fill={INK} fontWeight="700">{i + 1}</text>
        </g>
      ))}
      <circle cx="94" cy="122" r="7" fill="#8f86d6" /><circle cx="146" cy="122" r="7" fill="#e09d5c" />
      <g transform="translate(250 90) rotate(12)"><rect x="-13" y="-13" width="26" height="26" rx="5" fill="#fff" stroke="#c6cbe0" strokeWidth="2" /><circle cx="-5" cy="-5" r="2.5" fill={INK} /><circle cx="5" cy="5" r="2.5" fill={INK} /></g>
      <Bear x={70} y={80} s={0.6} cub arms="up" mood="laugh" />
      <Bear x={170} y={76} s={0.7} arms="front" />
    </>
  ),
  nature: () => (
    <>
      <rect x="236" y="90" width="12" height="70" fill="#b08e6e" />
      <circle cx="242" cy="78" r="34" fill="#a8d0be" /><circle cx="222" cy="92" r="20" fill="#8cc4a8" />
      <Mini name="leaf" x={170} y={60} s={0.4} />
      <Mini name="ladybug" x={210} y={150} s={0.35} />
      <Bear x={110} y={120} s={0.85} cub arms="up" mood="laugh" />
      <rect x="40" y="160" width="240" height="8" rx="4" fill="#c9e3b8" />
    </>
  ),
  drawing: () => (
    <>
      <rect x="150" y="100" width="120" height="70" rx="6" fill="#fff" stroke="#c6cbe0" strokeWidth="2" transform="rotate(-4 210 135)" />
      <circle cx="185" cy="132" r="14" fill="none" stroke="#e09d5c" strokeWidth="3" />
      <path d="M220 118l20 26M240 118l-20 26" stroke="#8f86d6" strokeWidth="3" strokeLinecap="round" />
      <Bear x={95} y={120} s={0.85} cub arms="side" />
      <rect x="128" y="104" width="30" height="7" rx="3" fill="#ef7b7b" transform="rotate(30 143 107)" />
    </>
  )
};

export default function Scene({ id, color = '#edf0f7', height = 180 }) {
  const S = SCENES[id];
  return (
    <svg className="scene" viewBox="0 0 320 190" height={height} width="100%" role="img" aria-hidden="true">
      <rect x="4" y="4" width="312" height="182" rx="26" fill={color} />
      <circle cx="40" cy="36" r="14" fill="#fff" opacity=".6" />
      <circle cx="290" cy="160" r="22" fill="#fff" opacity=".4" />
      {S ? <S /> : null}
    </svg>
  );
}
