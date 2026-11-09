import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { t } from '../lib/i18n.js';
import { validBirth } from '../lib/age.js';
import { KidForm } from './Onboarding.jsx';
import { LangSwitch, tap } from './Common.jsx';
import { useAudio } from '../lib/audio/useAudio.jsx';
import InstallCard from './Install.jsx';
import { ShareCard, VersionLine } from './Share.jsx';
import SyncCard from './SyncCard.jsx';
import { TERMS } from '../lib/terms.js';

export default function Settings({ lang, setLang, kids, setKids, onReset, syncState, onSync }) {
  const s = t(lang);
  const audio = useAudio();
  const [draft, setDraft] = useState(kids);
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const valid = draft.length > 0 && draft.every((k) => validBirth(k.birth));
  const dirty = JSON.stringify(draft) !== JSON.stringify(kids);

  return (
    <div>
      <h1 style={{ marginTop: 6 }}>{s.kids}</h1>
      <AnimatePresence>
        {draft.map((k, i) => (
          <KidForm key={i} kid={k} index={i} lang={lang}
            onChange={(nk) => { setDraft((d) => d.map((x, j) => (j === i ? nk : x))); setSaved(false); }}
            onRemove={draft.length > 1 ? () => setDraft((d) => d.filter((_, j) => j !== i)) : null} />
        ))}
      </AnimatePresence>
      <div className="row">
        {draft.length < 6 && (
          <motion.button className="btn" onClick={() => setDraft((d) => [...d, { birth: '', name: '' }])} {...tap}>＋ {s.addKid}</motion.button>
        )}
        <motion.button className="btn primary" disabled={!valid || !dirty} {...tap}
          onClick={() => { setKids(draft.map((k) => ({ ...k, birth: k.birth, name: (k.name || '').trim() }))); setSaved(true); }}>
          {saved && !dirty ? `✓ ${s.save}` : s.save}
        </motion.button>
      </div>
      <p className="muted small" style={{ marginTop: 12 }}>{s.privacyNote}</p>

      <SyncCard lang={lang} state={syncState} onMerge={onSync} />

      <InstallCard lang={lang} />
      <ShareCard lang={lang} />

      <h2 style={{ marginTop: 30 }}>{s.language}</h2>
      <div style={{ marginTop: 10 }}><LangSwitch lang={lang} setLang={setLang} /></div>

      <button className="toggle-row" style={{ width: '100%', textAlign: 'left', marginTop: 24 }} onClick={audio.toggleAmbient} role="switch" aria-checked={audio.ambient}>
        <span>
          <strong>{s.ambientOnLabel}</strong>
          <span className="muted small" style={{ display: 'block', marginTop: 2 }}>{s.ambientHint}</span>
        </span>
        <span className={`switch ${audio.ambient ? 'on' : ''}`}><motion.i layout transition={{ type: 'spring', stiffness: 500, damping: 30 }} /></span>
      </button>

      <div style={{ marginTop: 30 }}>
        <AnimatePresence mode="wait">
          {!confirmReset ? (
            <motion.button key="a" className="btn danger block" onClick={() => setConfirmReset(true)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {s.resetAll}
            </motion.button>
          ) : (
            <motion.div key="b" className="note urgent" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ flexDirection: 'column' }}>
              <span>{s.resetConfirm}</span>
              <div className="row" style={{ width: '100%', marginTop: 10 }}>
                <button className="btn" onClick={() => setConfirmReset(false)}>{s.back}</button>
                <button className="btn danger" style={{ background: 'var(--urg-ink)', color: '#fff' }} onClick={onReset}>{s.resetAll}</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <a className="btn block" style={{ marginTop: 14, textDecoration: 'none' }} href="#condizioni">{TERMS[lang].title}</a>
      <p className="footnote">{s.disclaimer}</p>
      <p className="small muted" style={{ marginTop: 24, textAlign: 'center' }}><VersionLine lang={lang} /></p>
    </div>
  );
}
