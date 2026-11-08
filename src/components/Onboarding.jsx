import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { t } from '../lib/i18n.js';
import { Mobile } from './Paper.jsx';
import { LangSwitch, spring, tap } from './Common.jsx';
import { IconLock } from './Icons.jsx';
import { TermsAccept } from './Terms.jsx';

const todayISO = () => new Date().toISOString().slice(0, 10);
const AV = ['#f7c48f', '#b9b2ec', '#a8d0be', '#f1b4c3', '#a9c7ee', '#f7d79a'];

export function KidForm({ kid, index, lang, onChange, onRemove }) {
  const s = t(lang);
  const future = kid.birth && kid.birth > todayISO();
  const label = kid.name || s.unnamedKid(index);
  return (
    <motion.div className="kid-card" layout initial={{ opacity: 0, y: 20, rotate: index % 2 ? 1.5 : -1.5 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ ...spring, delay: index * 0.06 }}>
      <div className="kid-card-head">
        <span className="av" style={{ background: AV[index % AV.length] }}>{label.slice(0, 1).toUpperCase()}</span>
        <strong>{label}</strong>
        {onRemove && <button className="rm" onClick={onRemove}>{s.remove}</button>}
      </div>
      <label className="field">
        <span>{s.birthDate}</span>
        <input type="date" max={todayISO()} value={kid.birth || ''} onChange={(e) => onChange({ ...kid, birth: e.target.value })} />
      </label>
      {future && <p className="error">{s.birthFuture}</p>}
      <label className="field">
        <span>{s.nameOptional}</span>
        <input type="text" maxLength={30} value={kid.name || ''} onChange={(e) => onChange({ ...kid, name: e.target.value })} />
      </label>
    </motion.div>
  );
}

const slide = {
  initial: (d) => ({ opacity: 0, x: d * 40 }),
  animate: { opacity: 1, x: 0, transition: spring },
  exit: (d) => ({ opacity: 0, x: d * -40, transition: { duration: 0.15 } })
};

export default function Onboarding({ lang, setLang, onDone }) {
  const s = t(lang);
  const [[step, dir], setStep] = useState([0, 1]);
  const [count, setCount] = useState(1);
  const [kids, setKids] = useState([{ birth: '', name: '' }]);
  const go = (n) => setStep([n, n > step ? 1 : -1]);

  const setN = (n) => {
    const v = Math.max(1, Math.min(6, n));
    setCount(v);
    setKids((k) => Array.from({ length: v }, (_, i) => k[i] || { birth: '', name: '' }));
  };
  const valid = kids.every((k) => k.birth && k.birth <= todayISO());

  return (
    <div className="onb">
      <div className="onb-top"><LangSwitch lang={lang} setLang={setLang} /></div>
      {step === 0 && <Mobile height={210} />}
      <div className="onb-body">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={step} custom={dir} variants={slide} initial="initial" animate="animate" exit="exit">
            {step === 0 && (
              <>
                <h1>{s.appName}</h1>
                <p className="lead">{s.welcomeText}</p>
                <p className="privacy"><IconLock />{s.privacyNote}</p>
                <div className="row"><motion.button className="btn primary" onClick={() => go(1)} {...tap}>{s.start}</motion.button></div>
              </>
            )}
            {step === 1 && (
              <>
                <h1>{s.howManyKids}</h1>
                <div className="stepper">
                  <motion.button onClick={() => setN(count - 1)} aria-label="−" {...tap}>−</motion.button>
                  <AnimatePresence mode="popLayout">
                    <motion.span key={count} className="count" initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} transition={spring}>
                      {count}
                    </motion.span>
                  </AnimatePresence>
                  <motion.button onClick={() => setN(count + 1)} aria-label="+" {...tap}>+</motion.button>
                </div>
                <div className="row">
                  <button className="btn ghost" onClick={() => go(0)}>{s.back}</button>
                  <motion.button className="btn primary" onClick={() => go(2)} {...tap}>{s.next}</motion.button>
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <h1>{count > 1 ? s.kids : s.kid}</h1>
                <AnimatePresence>
                  {kids.map((k, i) => (
                    <KidForm key={i} kid={k} index={i} lang={lang} onChange={(nk) => setKids((all) => all.map((x, j) => (j === i ? nk : x)))} />
                  ))}
                </AnimatePresence>
                <p className="privacy"><IconLock />{s.privacyNote}</p>
                <div className="row">
                  <button className="btn ghost" onClick={() => go(1)}>{s.back}</button>
                  <motion.button className="btn primary" disabled={!valid} onClick={() => go(3)} {...tap}>{s.next}</motion.button>
                </div>
              </>
            )}
            {step === 3 && (
              <>
                <h1>{s.disclaimerTitle}</h1>
                <p className="lead">{s.disclaimer}</p>
                <TermsAccept lang={lang} label={s.start}
                  onAccept={() => onDone(kids.map((k) => ({ birth: k.birth, name: k.name.trim() })))} />
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="dots">{[0, 1, 2, 3].map((i) => <span key={i} className={i === step ? 'on' : ''} />)}</div>
    </div>
  );
}
