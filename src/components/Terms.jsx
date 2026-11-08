import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TERMS } from '../lib/terms.js';
import { spring, tap } from './Common.jsx';

export function TermsText({ lang }) {
  const tt = TERMS[lang] || TERMS.it;
  return (
    <div className="terms">
      <p className="muted small">{tt.updated}</p>
      {tt.sections.map(([h, p], i) => (
        <motion.section key={h} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: i * 0.03 }}>
          <h3>{h}</h3>
          <p>{p}</p>
        </motion.section>
      ))}
    </div>
  );
}

export function TermsPage({ lang }) {
  const tt = TERMS[lang] || TERMS.it;
  return (
    <div>
      <h1 style={{ marginTop: 6 }}>{tt.title}</h1>
      <TermsText lang={lang} />
    </div>
  );
}

// Accettazione esplicita: casella + testo completo apribile
export function TermsAccept({ lang, onAccept, label, notice }) {
  const tt = TERMS[lang] || TERMS.it;
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState(false);
  const [warn, setWarn] = useState(false);
  return (
    <div>
      {notice && <p className="lead">{notice}</p>}
      <motion.button className="btn block" style={{ marginTop: 14 }} onClick={() => setOpen((o) => !o)} {...tap}>
        {open ? '▲ ' : '▼ '}{tt.read}
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div className="terms-box" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <TermsText lang={lang} />
          </motion.div>
        )}
      </AnimatePresence>
      <label className={`check ${warn && !checked ? 'warn' : ''}`}>
        <input type="checkbox" checked={checked} onChange={(e) => { setChecked(e.target.checked); setWarn(false); }} />
        <motion.span className="box" animate={checked ? { scale: [1, 1.2, 1] } : { scale: 1 }}>{checked ? '✓' : ''}</motion.span>
        <span>{tt.accept}</span>
      </label>
      {warn && !checked && <p className="error">{tt.mustAccept}</p>}
      <div className="row">
        <motion.button className="btn primary" {...tap} aria-disabled={!checked}
          style={{ opacity: checked ? 1 : 0.45 }} onClick={() => (checked ? onAccept() : setWarn(true))}>
          {label}
        </motion.button>
      </div>
    </div>
  );
}
