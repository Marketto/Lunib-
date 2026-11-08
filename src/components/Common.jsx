import React from 'react';
import { motion } from 'framer-motion';
import { t } from '../lib/i18n.js';
import { CAT } from '../lib/categories.js';
import { formatAge, formatRange } from '../lib/age.js';
import { PaperIcon } from './Paper.jsx';
import { IconCare, IconAlert, IconShift } from './Icons.jsx';
import { Character } from './Characters.jsx';

export const spring = { type: 'spring', stiffness: 420, damping: 30 };
export const tap = { whileTap: { scale: 0.95 }, transition: spring };

export function LangSwitch({ lang, setLang }) {
  return (
    <div className="lang-switch" role="group" aria-label="Lingua / Язык">
      {[['it', 'Italiano'], ['ru', 'Русский']].map(([l, label]) => (
        <motion.button key={l} className={lang === l ? 'on' : ''} onClick={() => setLang(l)} {...tap}>
          {lang === l && <motion.i layoutId="ls-bg" className="ls-bg" transition={spring} />}
          <span>{label}</span>
        </motion.button>
      ))}
    </div>
  );
}

export function kidLabel(kid, i, lang) {
  return kid.name || t(lang).unnamedKid(i);
}

// Selettore del figlio: una "pillola" per bimbo + "Tutte le età"
export function KidPills({ kids, active, setActive, lang, id = 'kp', noAll = false }) {
  const s = t(lang);
  const items = kids.map((k, i) => ({ i, label: kidLabel(k, i, lang), age: formatAge(k.birth, lang) }));
  if (!noAll) items.push({ i: -1, label: s.allAges, age: '' });
  return (
    <div className="kid-pills" role="tablist" aria-label={s.searchFor}>
      {items.map((it) => (
        <motion.button key={it.i} role="tab" aria-selected={active === it.i}
          className={`kid-pill ${active === it.i ? 'on' : ''}`} onClick={() => setActive(it.i)} {...tap}>
          {active === it.i && <motion.i layoutId={`${id}-bg`} className="pill-bg" transition={spring} />}
          <span>{it.label}{it.age && <span className="age-s">{it.age}</span>}</span>
        </motion.button>
      ))}
    </div>
  );
}

export function RelevanceRing({ value, lang }) {
  const s = t(lang);
  const r = 22;
  const c = 2 * Math.PI * r;
  const color = value >= 70 ? '#5cb98a' : value >= 40 ? '#e8a94f' : '#a3a6c4';
  return (
    <div title={`${s.relevance} ${value}%`}>
      <div className="ring">
        <svg viewBox="0 0 54 54">
          <circle cx="27" cy="27" r={r} stroke="#edf0f7" strokeWidth="5" fill="none" />
          <motion.circle cx="27" cy="27" r={r} stroke={color} strokeWidth="5" fill="none" strokeLinecap="round"
            strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - value / 100) }}
            transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1], delay: 0.15 }} />
        </svg>
        <span className="num">{value}<small>%</small></span>
      </div>
      <div className="ring-label">{s.relevance}</div>
    </div>
  );
}

export function AlertChip({ alert, lang }) {
  const s = t(lang);
  if (alert === 'urgente') return <span className="chip urgent"><IconAlert />{s.urgentShort}</span>;
  if (alert === 'pediatra') return <span className="chip care"><IconCare />{s.pediatraShort}</span>;
  return null;
}

export function NearChip({ lang }) {
  return <span className="chip near"><IconShift />{t(lang).nearShort}</span>;
}

export function ResultItem({ item, lang, onOpen, index = 0 }) {
  const s = t(lang);
  const { doc, match, score } = item;
  const cat = CAT[doc.c];
  return (
    <motion.button
      layout
      className="result"
      style={{ '--c': cat.color }}
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ ...spring, delay: Math.min(index, 8) * 0.045 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onOpen(item.id)}
    >
      <span className="icon-bg"><PaperIcon id={doc.c} color={cat.color} size={38} /></span>
      <span>
        <h3>{doc.t}</h3>
        <p>{doc.s}</p>
        <span className="meta">
          <span className="chip">{s.ageRange} {formatRange(doc.f, doc.to, lang)}</span>
          {match === 'near' && <NearChip lang={lang} />}
          <AlertChip alert={doc.a} lang={lang} />
        </span>
      </span>
      {score != null ? <RelevanceRing value={score} lang={lang} /> : <span />}
    </motion.button>
  );
}

export function AlertNote({ kind = 'care', children }) {
  return (
    <motion.div
      className={`note ${kind}`}
      role="alert"
      initial={{ opacity: 0, y: -24, rotate: -2 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 16 }}
    >
      <i className="tape" />
      {kind === 'urgent' ? <IconAlert /> : <IconCare />}
      <span>{children}</span>
    </motion.div>
  );
}

// Caricamento: tre personaggi sorridenti che saltano a turno
export function Loading({ label }) {
  return (
    <div className="loading" role="status" aria-label={label || '…'}>
      <div className="loading-row">
        {['cloud', 'star', 'bear'].map((n, i) => (
          <motion.span key={n} animate={{ y: [0, -16, 0], rotate: [0, i % 2 ? 12 : -12, 0] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}>
            <Character name={n} size={46} />
          </motion.span>
        ))}
      </div>
      {label && <p className="muted small">{label}</p>}
    </div>
  );
}

export function SkeletonList({ n = 3 }) {
  return (
    <div aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="skeleton" style={{ animationDelay: `${i * 0.12}s` }}>
          <i className="sk-ic" /><span><i className="sk-l w70" /><i className="sk-l" /><i className="sk-l w40" /></span>
        </div>
      ))}
    </div>
  );
}

export function itemText(x) {
  return typeof x === 'string' ? x : x.t;
}
