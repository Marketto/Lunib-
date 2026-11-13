import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { t } from '../lib/i18n.js';
import { spring } from './Common.jsx';

// Pulsante discreto per riaprire il giro (in fondo alla pagina, sopra la barra di navigazione)
export function TourRecall({ lang, onClick }) {
  const s = t(lang);
  return (
    <div className="tour-recall-wrap">
      <button className="tour-recall" data-tour="recall" onClick={onClick} aria-label={s.tourRecallLabel}>
        <span aria-hidden="true">?</span>{s.tourRecall}
      </button>
    </div>
  );
}

const PAD = 6, GAP = 12, M = 12;
const find = (id) => document.querySelector(`[data-tour="${id}"]`);
const read = (el) => {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return r.width && r.height ? { x: r.left, y: r.top, w: r.width, h: r.height } : null;
};

// Giro a "coach-mark": ogni passo evidenzia un elemento reale (data-tour) e mostra un suggerimento breve.
// Tocca ovunque per proseguire; se un bersaglio manca il passo viene saltato senza bloccarsi.
export default function Tour({ lang, slides, onClose, go, route }) {
  const s = t(lang);
  const [i, setI] = useState(0);
  const [rect, setRect] = useState(null);
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [bh, setBh] = useState(56);
  const bubble = useRef(null);
  const sl = slides[i];
  const last = i === slides.length - 1;
  const next = () => (last ? onClose() : setI(i + 1));
  const back = () => setI((n) => Math.max(0, n - 1));

  // Il primo passo (e ogni passo) richiede la Home se il bersaglio è lì; il selettore lingua sta in Bimbi
  useEffect(() => { if (sl.target === 'search' && route) go(''); else if (sl.target === 'lang' && route !== 'bimbi') go('bimbi'); }, [i]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cerca il bersaglio (con qualche tentativo), lo porta in vista e lo misura
  useEffect(() => {
    let alive = true, tries = 0, raf = 0;
    const measure = () => {
      if (!alive) return;
      const el = find(sl.target);
      let r = read(el);
      if (!r) {
        if (++tries > 30) { if (last) onClose(); else setI((n) => n + 1); return; }
        raf = requestAnimationFrame(measure); return;
      }
      const fixed = !!el.closest('.bottom-nav');
      if (!fixed && (r.y < 8 || r.y + r.h > window.innerHeight - 90)) {
        el.scrollIntoView({ block: 'center', behavior: 'auto' });
        r = read(el) || r;
      }
      setRect(r);
    };
    measure();
    const on = () => { const r = read(find(sl.target)); if (r) setRect(r); setVp({ w: window.innerWidth, h: window.innerHeight }); };
    window.addEventListener('resize', on);
    window.addEventListener('scroll', on, true);
    return () => { alive = false; cancelAnimationFrame(raf); window.removeEventListener('resize', on); window.removeEventListener('scroll', on, true); };
  }, [i]); // eslint-disable-line react-hooks/exhaustive-deps

  useLayoutEffect(() => { if (bubble.current) setBh(bubble.current.offsetHeight); }, [i, lang, vp.w]);
  useEffect(() => { bubble.current?.focus(); }, [i]);
  useEffect(() => {
    const on = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') back();
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const bw = Math.min(300, vp.w - 2 * M);
  let spot = null, bx = M, by = vp.h / 2 - bh / 2;
  if (rect) {
    spot = { x: rect.x - PAD, y: rect.y - PAD, w: rect.w + 2 * PAD, h: rect.h + 2 * PAD };
    const above = spot.y + spot.h / 2 > vp.h / 2;
    bx = Math.max(M, Math.min(vp.w - bw - M, spot.x + spot.w / 2 - bw / 2));
    by = above ? spot.y - GAP - bh : spot.y + spot.h + GAP;
    by = Math.max(M, Math.min(vp.h - bh - M, by));
  }
  const radius = Math.min(18, spot ? spot.h / 2 : 18);

  return (
    <motion.div className="tour-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={next}>
      {spot && (
        <motion.div className="tour-spot" aria-hidden="true" initial={false}
          animate={{ left: spot.x, top: spot.y, width: spot.w, height: spot.h, borderRadius: radius }} transition={spring}>
          <span className="tour-ring" style={{ borderRadius: radius + 4 }} />
        </motion.div>
      )}
      <motion.div className="tour-bubble" role="dialog" aria-modal="true" aria-label={s.tourLabel} tabIndex={-1} ref={bubble}
        style={{ width: bw }} initial={false} animate={{ x: bx, y: by, opacity: spot ? 1 : 0 }} transition={spring}
        onClick={(e) => { e.stopPropagation(); next(); }}>
        <span className="tour-ico" aria-hidden="true">{sl.icon}</span>
        <span className="tour-text" aria-live="polite">{sl[lang].text}</span>
        <span className="tour-meta">
          <span className="tour-count">{s.tourStep(i + 1, slides.length)}</span>
          {!last && <button className="tour-skip" onClick={(e) => { e.stopPropagation(); onClose(); }}>{s.tourSkip}</button>}
        </span>
      </motion.div>
    </motion.div>
  );
}
