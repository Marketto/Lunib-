import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { t } from '../lib/i18n.js';
import { tap } from './Common.jsx';

// Installazione come app: su Android/Chrome usa il prompt del browser,
// su iPhone/iPad mostra i passaggi (Condividi → Aggiungi alla schermata Home).
let deferred = null;
const listeners = new Set();
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e;
    listeners.forEach((f) => f());
  });
}

export function isStandalone() {
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
}
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export default function InstallCard({ lang, compact = false, onDismiss }) {
  const s = t(lang);
  const [, force] = useState(0);
  const [showIOS, setShowIOS] = useState(false);
  const [done, setDone] = useState(isStandalone());
  useEffect(() => {
    const f = () => force((n) => n + 1);
    listeners.add(f);
    const inst = () => setDone(true);
    window.addEventListener('appinstalled', inst);
    return () => { listeners.delete(f); window.removeEventListener('appinstalled', inst); };
  }, []);
  if (done) return compact ? null : <p className="muted small">{s.installed}</p>;

  const install = async () => {
    if (deferred) {
      deferred.prompt();
      const r = await deferred.userChoice.catch(() => null);
      if (r?.outcome === 'accepted') setDone(true);
      deferred = null;
    } else {
      setShowIOS(true);
    }
  };

  return (
    <motion.div className="install-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <img src="./icons/icon-192.png" alt="" width="56" height="56" />
      <div className="grow">
        <strong>{s.installTitle}</strong>
        <p className="muted small">{s.installText}</p>
        <div className="install-actions">
          <motion.button className="btn primary" onClick={install} {...tap}>{s.installBtn}</motion.button>
          {onDismiss && <button className="btn ghost" onClick={onDismiss}>{s.notNow}</button>}
        </div>
        <AnimatePresence>
          {showIOS && (
            <motion.ol className="ios-steps" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              {(isIOS() ? s.iosSteps : s.otherSteps).map((x, i) => <li key={i}>{x}</li>)}
            </motion.ol>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
