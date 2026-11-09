import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as engine from './engine.js';
import { TRACK_TEXT } from './tracks-i18n.js';

const Ctx = createContext(null);

export function AudioProvider({ ambientPref, setAmbientPref, lang, children }) {
  const [playing, setPlaying] = useState(null);
  const [timer, setTimerState] = useState(0);
  const [volume, setVolumeState] = useState(0.35);
  const [ambient, setAmbientState] = useState(false);
  const pending = useRef(ambientPref);

  // titolo nella schermata di blocco (MediaSession) e pausa/stop dal sistema
  useEffect(() => { engine.setTitleLookup((id) => TRACK_TEXT[id]?.[lang]?.[0]); }, [lang]);
  useEffect(() => engine.subscribe(({ playing: p }) => setPlaying(p)), []);

  // La musica di sottofondo può partire solo dopo un gesto dell'utente (regola dei browser)
  useEffect(() => {
    pending.current = ambientPref;
    if (!ambientPref) return;
    const start = () => {
      if (pending.current && !engine.currentId()) {
        engine.setVolume(volume);
        engine.setAmbient(true);
        setAmbientState(true);
      }
    };
    window.addEventListener('pointerdown', start, { once: true });
    return () => window.removeEventListener('pointerdown', start);
  }, [ambientPref]); // eslint-disable-line react-hooks/exhaustive-deps

  const api = {
    playing,
    timer,
    volume,
    ambient,
    playTrack(id) {
      engine.setVolume(volume);
      if (engine.ambientOn()) engine.setAmbient(false);
      engine.play(id);
      setPlaying(id);
      if (timer) engine.setSleepTimer(timer, () => setPlaying(null));
    },
    stopTrack() {
      engine.stop();
      setPlaying(null);
      if (ambientPref) { engine.setAmbient(true); setAmbientState(true); }
    },
    setTimer(min) {
      setTimerState(min);
      if (engine.currentId()) engine.setSleepTimer(min, () => setPlaying(null));
    },
    setVolume(v) {
      setVolumeState(v);
      engine.setVolume(v);
    },
    toggleAmbient() {
      const next = !ambient;
      setAmbientPref(next);
      if (next && engine.currentId()) { setAmbientState(true); return; }
      engine.setVolume(volume);
      engine.setAmbient(next);
      setAmbientState(next);
    },
    level: engine.level
  };
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export const useAudio = () => useContext(Ctx);
