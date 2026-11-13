import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { t } from '../lib/i18n.js';
import { Character } from './Characters.jsx';
import { spring, tap } from './Common.jsx';

// Pulsante discreto per riaprire il giro (in fondo alla pagina, sopra la barra di navigazione)
export function TourRecall({ lang, onClick }) {
  const s = t(lang);
  return (
    <div className="tour-recall-wrap">
      <button className="tour-recall" onClick={onClick} aria-label={s.tourRecallLabel}>
        <span aria-hidden="true">?</span>{s.tourRecall}
      </button>
    </div>
  );
}

// Foglio a passi: punti, Avanti/Indietro, Salta, Fine, Vai, swipe.
export default function Tour({ lang, slides, onClose, go }) {
  const s = t(lang);
  const [[i, dir], setI] = useState([0, 1]);
  const last = i === slides.length - 1;
  const sl = slides[i];
  const dlg = useRef(null);
  const touch = useRef(null);
  const move = (n) => { if (n >= 0 && n < slides.length) setI([n, n > i ? 1 : -1]); };
  useEffect(() => { dlg.current?.focus(); }, []);
  useEffect(() => {
    const on = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') move(i + 1);
      else if (e.key === 'ArrowLeft') move(i - 1);
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }); // eslint-disable-line react-hooks/exhaustive-deps
  const onTouchEnd = (e) => {
    const x0 = touch.current; touch.current = null;
    if (x0 == null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) move(dx < 0 ? i + 1 : i - 1);
  };
  return (
    <motion.div className="tour-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="tour-sheet" role="dialog" aria-modal="true" aria-label={s.tourLabel} tabIndex={-1} ref={dlg}
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }} transition={spring}
        onTouchStart={(e) => { touch.current = e.touches[0].clientX; }} onTouchEnd={onTouchEnd}>
        <div className="tour-top">
          <span className="small muted" aria-live="polite">{s.tourStep(i + 1, slides.length)}</span>
          {!last && <button className="btn ghost small" onClick={onClose}>{s.tourSkip}</button>}
        </div>
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div key={sl.id} className="tour-slide" custom={dir}
            initial={{ opacity: 0, x: dir * 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -40, transition: { duration: 0.12 } }} transition={spring}>
            <div className="tour-art"><Character name={sl.char} size={96} /></div>
            <h2>{sl[lang].title}</h2>
            <p>{sl[lang].text}</p>
            {sl.tab != null && <button className="btn small" onClick={() => { onClose(); go(sl.tab); }}>{s.tourGo}</button>}
          </motion.div>
        </AnimatePresence>
        <div className="dots" aria-hidden="true">{slides.map((x, j) => <span key={x.id} className={j === i ? 'on' : ''} />)}</div>
        <div className="row">
          <button className="btn ghost" onClick={() => move(i - 1)} disabled={i === 0} style={i === 0 ? { visibility: 'hidden' } : undefined}>{s.back}</button>
          <motion.button className="btn primary" onClick={() => (last ? onClose() : move(i + 1))} {...tap}>{last ? s.tourDone : s.next}</motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
