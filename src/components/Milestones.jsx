// Tappe: checklist per età con finestre OMS/CDC/linee guida. Non è uno screening né una diagnosi.
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Character } from './Characters.jsx';
import { Refs } from './Common.jsx';
import { MILESTONE_TEXT } from '../lib/i18n.js';
import { monthsAt } from '../lib/growth.js';
import { AREAS, PRETERM_CORRECT_UNTIL, ageForMilestones, milestoneKey, position, split, status } from '../lib/milestones.js';
import MILESTONES from '../../content/milestones.json';

const today = () => new Date().toISOString().slice(0, 10);
const num = (n) => String(Math.round(n * 10) / 10).replace('.', ',');
const AREA_LOOK = {
  motor: { c: 'ladybug', bg: '#dcefe5' }, language: { c: 'cloud', bg: '#dfe9fb' }, social: { c: 'heart', bg: '#fbe3ea' },
  feeding: { c: 'apple', bg: '#fdeedb' }, sleep: { c: 'moon', bg: '#e6e3fa' }, toilet: { c: 'drop', bg: '#d9eef3' }, dental: { c: 'star', bg: '#fff3cf' }, puberty: { c: 'flower', bg: '#f3e3f7' }
};
// Fonti della nota generale: CDC key points, CDC/Zubler, CDC monitoraggio, W14 e B35 (controlli AAP)
export const HEADER_REFS = ['TP15', 'TP2', 'TP14', 'W14', 'B35'];

function WindowBar({ item, months, t, sex }) {
  const text = item.type === 'puberty' ? t.window.puberty(sex) : item.to == null ? (item.type === 'not-before' ? t.window['not-before'](num(item.from)) : t.open(num(item.from)))
    : t.window[item.type](num(item.from), num(item.to));
  const pos = position(item, months);
  return (
    <div className="ms-win">
      <p className="small muted">{text}</p>
      {pos != null && (
        <div className="ms-bar" role="img" aria-label={text}>
          <i className="ms-fill" style={{ width: `${pos * 100}%` }} />
          <i className="ms-mark" style={{ left: `${pos * 100}%` }} />
        </div>
      )}
    </div>
  );
}

function Note({ item, st, t, lang }) {
  let text = null;
  if (st === 'early') return <p className="ms-note early" role="note">{item.early[lang] || item.early.it} <Refs ids={item.early.src} /></p>;
  if (st === 'watch') text = t.watch;
  else if (st === 'tip' || st === 'late') {
    if (item.note) text = item.note[lang] || item.note.it;
    else if (st === 'late') text = (t.late[item.type === 'who-1-99' ? 'who' : item.type === 'cdc-75pct' ? 'cdc' : 'other'])(num(item.to));
  }
  if (!text) return null;
  return <p className={`ms-note ${st}`} role="note">{text} <Refs ids={item.src} /></p>;
}

function Card({ item, lang, t, months, rec, kid, past = false, onDone, onChange, onRemove }) {
  const [asking, setAsking] = useState(false);
  const [date, setDate] = useState(today());
  const [cheer, setCheer] = useState(false);
  const done = !!rec;
  const sex = kid.sex;
  const ageAt = (d) => (d ? ageForMilestones(kid, d) : null);
  // pubertà: stato "early" se la data segnata (anche oggi) cade prima della soglia, anche mentre si sta segnando
  const st0 = past && !done ? 'past' : status(item, months, done, { sex, doneMonths: done ? ageAt(rec.date) : null });
  const asksEarly = item.type === 'puberty' && asking && !done && status(item, months, true, { sex, doneMonths: ageAt(date) }) === 'early';
  const st = asksEarly ? 'early' : st0;
  const L = item[lang] || item.it;
  const look = AREA_LOOK[item.area];
  const save = () => {
    onDone(item, date || today());
    setAsking(false);
    setCheer(true);
    setTimeout(() => setCheer(false), 1600);
  };
  return (
    <li className={`ms-card st-${st}`} style={{ '--ms-bg': look.bg }}>
      <div className="ms-head">
        <input type="checkbox" id={`ms-${item.id}`} checked={done || asking} aria-label={t.tick(L.title)}
          onChange={(e) => { if (done) onRemove(item); else setAsking(e.target.checked); }} />
        <label htmlFor={`ms-${item.id}`}><strong>{L.title}</strong></label>
        <span className={`chip ms-chip ${st}`}>{t.status[st]}</span>
      </div>
      {L.info && <p className="small">{L.info} <Refs ids={item.src} /></p>}
      <WindowBar item={item} months={months} t={t} sex={sex} />
      {!L.info && <p className="small"><Refs ids={item.src} /></p>}
      <Note item={item} st={st} t={t} lang={lang} />
      {asking && (
        <div className="ms-ask">
          <label className="field narrow"><span>{t.when}</span>
            <input type="date" value={date} min={kid.birth} max={today()} onChange={(e) => setDate(e.target.value)} />
          </label>
          <div className="row">
            <button className="btn primary small" onClick={save}>{t.save}</button>
            <button className="btn ghost small" onClick={() => setAsking(false)}>{t.cancel}</button>
          </div>
        </div>
      )}
      {done && (
        <div className="ms-ask">
          <label className="field narrow"><span>{t.when}</span>
            <input type="date" value={rec.date} min={kid.birth} max={today()} onChange={(e) => e.target.value && onChange(item, e.target.value)} />
          </label>
        </div>
      )}
      <AnimatePresence>
        {cheer && (
          <motion.div className="ms-cheer" aria-live="polite" initial={{ opacity: 0, scale: 0.4, y: 10 }} animate={{ opacity: 1, scale: 1, y: -6 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 14 }}>
            <Character name="star" size={54} /><span>{t.cheer}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

export default function Milestones({ lang, kid, milestones = [], setMilestones }) {
  const t = MILESTONE_TEXT[lang];
  const months = ageForMilestones(kid, today());
  const mine = milestones.filter((m) => m.kidId === kid.id);
  const byItem = new Map(mine.map((m) => [m.item, m]));
  const { active, past, done } = split(MILESTONES.items, months, new Set(byItem.keys()));
  const w = +kid.gaWeeks;
  const corrected = !!w && w < 37 && monthsAt(kid.birth, today()) < PRETERM_CORRECT_UNTIL;

  const put = (item, date) => {
    const id = milestoneKey(kid.id, item.id);
    setMilestones([...milestones.filter((m) => m.id !== id), { id, kidId: kid.id, item: item.id, date }]);
  };
  const remove = (item) => setMilestones(milestones.filter((m) => m.id !== milestoneKey(kid.id, item.id)));
  const props = { lang, t, months, kid, onDone: put, onChange: put, onRemove: remove };

  return (
    <div className="milestones">
      <div className="ms-header small">
        <p>{t.header}</p>
        <p className="ms-alert" role="note">{t.alert}</p>
        <p>{t.checks} <Refs ids={HEADER_REFS} /></p>
      </div>
      {corrected && <p className="small muted">{t.preterm(w)} <Refs ids={['TP13']} /></p>}
      {active.length === 0 && past.length === 0 && <p className="small muted">{t.empty}</p>}
      {AREAS.map((a) => {
        const list = active.filter((i) => i.area === a);
        if (!list.length) return null;
        const look = AREA_LOOK[a];
        return (
          <section key={a} className="ms-area" aria-labelledby={`msa-${a}`}>
            <h3 id={`msa-${a}`} style={{ '--ms-bg': look.bg }}><span className="ms-ico"><Character name={look.c} size={30} /></span>{t.areas[a]}</h3>
            <ul className="ms-list">
              {list.map((i) => <Card key={i.id} item={i} rec={null} {...props} />)}
            </ul>
          </section>
        );
      })}
      {past.length > 0 && (
        <details className="ms-wins ms-past">
          <summary>{t.past(past.length)}</summary>
          <p className="small muted">{t.pastNote}</p>
          <ul className="ms-list">
            {past.map((i) => <Card key={i.id} item={i} rec={null} past {...props} />)}
          </ul>
        </details>
      )}
      <details className="ms-wins">
        <summary>{t.wins(done.length)}</summary>
        {done.length === 0 ? <p className="small muted">{t.noWins}</p> : (
          <ul className="ms-list">
            {done.map((i) => <Card key={i.id} item={i} rec={byItem.get(i.id)} {...props} />)}
          </ul>
        )}
      </details>
    </div>
  );
}
