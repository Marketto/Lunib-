import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '../lib/audio/useAudio.jsx';
import * as engine from '../lib/audio/engine.js';
import { TRACK_TEXT } from '../lib/audio/tracks-i18n.js';
import {
  startMic, stopMic, readDbfsA, measureLeq, levelAt, minDistanceFor,
  DEFAULT_OFFSET, TARGET_DBA, UNCAL_MARGIN
} from '../lib/audio/meter.js';
import { spring, tap } from './Common.jsx';
import sources from '../../content/sources.json';

const KEY = 'lunibu:calibration';
const loadCal = () => { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch { return null; } };
const saveCal = (c) => { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch { /* */ } };

const T = {
  it: {
    title: 'Misura il volume',
    intro: 'Usa il microfono per stimare quanto è forte il suono. Niente viene registrato o salvato: il segnale si analizza al momento e si scarta.',
    honest: 'Nel browser il microfono non è calibrato: senza calibrazione la misura può sbagliare di circa ±10 dB tra un telefono e l\'altro. Per questo applichiamo un margine di sicurezza.',
    modeCrib: 'Al lettino, con un secondo telefono',
    modeCribText: 'Il più affidabile: un telefono suona dove lo metterai di solito, l\'altro (con l\'app aperta qui) sta dove dorme il bambino e misura.',
    modeQuick: 'Stima rapida con questo telefono',
    modeQuickText: 'Metti il telefono dove lo terrai: misura il suono vicino all\'altoparlante e calcola quanto arriva al lettino. Imposta il volume da solo.',
    allow: 'Consenti microfono e inizia',
    denied: 'Accesso al microfono negato: puoi abilitarlo nelle impostazioni del browser.',
    live: 'Livello al lettino',
    calibrated: 'calibrato',
    uncalibrated: 'non calibrato · ±10 dB',
    zoneOk: 'Sotto i 50 dB(A): va bene.',
    zoneMid: 'Tra 50 e 60 dB(A): abbassa il volume o allontana il telefono.',
    zoneHigh: 'Sopra i 60 dB(A): troppo forte. Abbassa subito.',
    distance: 'Distanza tra telefono e testa del bambino',
    measure: 'Misura',
    step1: 'Silenzio per 3 secondi: misuro il rumore della stanza…',
    step2: 'Ora suono per 5 secondi: misuro vicino all\'altoparlante…',
    ambient: 'Rumore della stanza',
    atCrib: (d) => `Stima al lettino (${d} m)`,
    minDist: 'Distanza minima consigliata con questo volume',
    auto: 'Imposta il volume automaticamente',
    autoDone: 'Volume regolato ✓',
    alreadyOk: 'Il volume è già entro il limite: non serve abbassarlo.',
    keepPhoneVol: 'Non cambiare il volume del telefono dopo la misura: altrimenti ripetila.',
    iosNote: 'Su iPhone, mentre il microfono è attivo il sistema può abbassare l\'audio: la stima rapida è meno precisa.',
    calTitle: 'Calibrazione',
    calText: 'Hai un fonometro o un\'app di misura calibrata (per esempio NIOSH SLM su iPhone)? Mettilo accanto a questo telefono, fai suonare qualcosa in modo costante e scrivi qui il valore in dB(A) che legge.',
    calBtn: 'Calibra',
    calDone: 'Calibrazione salvata ✓',
    calReset: 'Togli calibrazione',
    stop: 'Ferma',
    sourceNote: 'Fonti'
  },
  ru: {
    title: 'Измерить громкость',
    intro: 'Микрофон оценивает, насколько громкий звук. Ничего не записывается и не сохраняется: сигнал анализируется сразу и отбрасывается.',
    honest: 'В браузере микрофон не откалиброван: без калибровки ошибка может достигать примерно ±10 дБ на разных телефонах. Поэтому мы добавляем запас безопасности.',
    modeCrib: 'У кроватки, со вторым телефоном',
    modeCribText: 'Самый надёжный способ: один телефон играет там, где он обычно стоит, а другой (с открытым здесь приложением) лежит там, где спит ребёнок, и измеряет.',
    modeQuick: 'Быстрая оценка этим телефоном',
    modeQuickText: 'Поставьте телефон туда, где он будет стоять: он измерит звук у динамика и рассчитает, сколько дойдёт до кроватки. Громкость настроится сама.',
    allow: 'Разрешить микрофон и начать',
    denied: 'Доступ к микрофону запрещён: включите его в настройках браузера.',
    live: 'Уровень у кроватки',
    calibrated: 'откалибровано',
    uncalibrated: 'без калибровки · ±10 дБ',
    zoneOk: 'Ниже 50 дБ(А): хорошо.',
    zoneMid: 'От 50 до 60 дБ(А): уменьшите громкость или отодвиньте телефон.',
    zoneHigh: 'Выше 60 дБ(А): слишком громко. Сразу уменьшите.',
    distance: 'Расстояние от телефона до головы ребёнка',
    measure: 'Измерить',
    step1: 'Тишина 3 секунды: измеряю шум в комнате…',
    step2: 'Теперь играю 5 секунд: измеряю у динамика…',
    ambient: 'Шум в комнате',
    atCrib: (d) => `Оценка у кроватки (${d} м)`,
    minDist: 'Минимальное рекомендуемое расстояние при этой громкости',
    auto: 'Настроить громкость автоматически',
    autoDone: 'Громкость настроена ✓',
    alreadyOk: 'Громкость уже в пределах нормы: уменьшать не нужно.',
    keepPhoneVol: 'Не меняйте громкость телефона после измерения, иначе повторите его.',
    iosNote: 'На iPhone при включённом микрофоне система может приглушать звук: быстрая оценка менее точна.',
    calTitle: 'Калибровка',
    calText: 'Есть шумомер или откалиброванное приложение (например, NIOSH SLM на iPhone)? Положите его рядом с этим телефоном, включите ровный звук и введите здесь показание в дБ(А).',
    calBtn: 'Откалибровать',
    calDone: 'Калибровка сохранена ✓',
    calReset: 'Сбросить калибровку',
    stop: 'Стоп',
    sourceNote: 'Источники'
  },
  en: {
    title: 'Measure the volume',
    intro: 'Use the microphone to estimate how loud the sound is. Nothing is recorded or saved: the signal is analyzed on the spot and discarded.',
    honest: 'In the browser the microphone is not calibrated: without calibration the measurement can be off by about ±10 dB from one phone to another. That is why we apply a safety margin.',
    modeCrib: 'At the crib, with a second phone',
    modeCribText: 'The most reliable: one phone plays where you will usually put it, the other (with the app open here) sits where the baby sleeps and measures.',
    modeQuick: 'Quick estimate with this phone',
    modeQuickText: 'Put the phone where you will keep it: it measures the sound near the speaker and calculates how much reaches the crib. It sets the volume by itself.',
    allow: 'Allow microphone and start',
    denied: 'Microphone access denied: you can enable it in the browser settings.',
    live: 'Level at the crib',
    calibrated: 'calibrated',
    uncalibrated: 'not calibrated · ±10 dB',
    zoneOk: 'Below 50 dB(A): fine.',
    zoneMid: 'Between 50 and 60 dB(A): lower the volume or move the phone away.',
    zoneHigh: 'Above 60 dB(A): too loud. Lower it right away.',
    distance: 'Distance between the phone and the baby\'s head',
    measure: 'Measure',
    step1: 'Silence for 3 seconds: I am measuring the room noise…',
    step2: 'Now I play for 5 seconds: I am measuring near the speaker…',
    ambient: 'Room noise',
    atCrib: (d) => `Estimate at the crib (${d} m)`,
    minDist: 'Minimum recommended distance at this volume',
    auto: 'Set the volume automatically',
    autoDone: 'Volume adjusted ✓',
    alreadyOk: 'The volume is already within the limit: no need to lower it.',
    keepPhoneVol: 'Do not change the phone volume after the measurement: otherwise repeat it.',
    iosNote: 'On iPhone, while the microphone is active the system may lower the audio: the quick estimate is less precise.',
    calTitle: 'Calibration',
    calText: 'Do you have a sound level meter or a calibrated measuring app (for example NIOSH SLM on iPhone)? Put it next to this phone, play something at a steady level and enter here the dB(A) value it reads.',
    calBtn: 'Calibrate',
    calDone: 'Calibration saved ✓',
    calReset: 'Remove calibration',
    stop: 'Stop',
    sourceNote: 'Sources'
  }
};

function Gauge({ value, calibrated, s }) {
  const v = value == null ? null : Math.round(value);
  const zone = v == null ? 'ok' : v <= 50 ? 'ok' : v <= 60 ? 'mid' : 'high';
  const pct = v == null ? 0 : Math.max(0, Math.min(1, (v - 20) / 60));
  return (
    <div className={`gauge ${zone}`}>
      <svg viewBox="0 0 200 110" aria-hidden="true">
        <path d="M15 100 A85 85 0 0 1 185 100" stroke="rgba(255,255,255,.15)" strokeWidth="14" fill="none" strokeLinecap="round" />
        <motion.path d="M15 100 A85 85 0 0 1 185 100" stroke="currentColor" strokeWidth="14" fill="none" strokeLinecap="round"
          pathLength="1" strokeDasharray="1" animate={{ strokeDashoffset: 1 - pct }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
        <line x1="100" y1="100" x2="100" y2="22" stroke="#fff" strokeWidth="2" opacity=".35"
          transform={`rotate(${-90 + ((50 - 20) / 60) * 180} 100 100)`} strokeDasharray="4 4" />
      </svg>
      <div className="gauge-num"><strong>{v ?? '–'}</strong> dB(A)</div>
      <div className="gauge-cal">{calibrated ? s.calibrated : s.uncalibrated}</div>
      <p className="gauge-msg">{v == null ? '' : zone === 'ok' ? s.zoneOk : zone === 'mid' ? s.zoneMid : s.zoneHigh}</p>
    </div>
  );
}

export default function VolumeCheck({ lang, onClose }) {
  const s = T[lang] || T.it;
  const audio = useAudio();
  const [mode, setMode] = useState(null);
  const [err, setErr] = useState('');
  const [cal, setCal] = useState(loadCal);
  const offset = cal?.offset ?? DEFAULT_OFFSET;
  const margin = cal ? 0 : UNCAL_MARGIN;
  const [live, setLive] = useState(null);
  const [dist, setDist] = useState(2);
  const [phase, setPhase] = useState('idle');
  const [result, setResult] = useState(null);
  const [calInput, setCalInput] = useState('');
  const [msg, setMsg] = useState('');
  const raf = useRef(0);

  useEffect(() => () => { cancelAnimationFrame(raf.current); stopMic(); }, []);

  const begin = async (m) => {
    setErr('');
    try {
      await startMic();
      setMode(m);
      if (m === 'crib') {
        let sm = null;
        const loop = () => {
          const d = readDbfsA();
          if (d != null && Number.isFinite(d)) {
            const v = d + offset;
            sm = sm == null ? v : 10 * Math.log10(0.85 * Math.pow(10, sm / 10) + 0.15 * Math.pow(10, v / 10));
            setLive(sm);
          }
          raf.current = requestAnimationFrame(loop);
        };
        loop();
      }
    } catch {
      setErr(s.denied);
    }
  };

  const runQuick = async () => {
    const track = audio.playing || 'white';
    setResult(null);
    engine.stop();
    setPhase('ambient');
    await new Promise((r) => setTimeout(r, 900));
    const amb = (await measureLeq(3000)) + offset;
    setPhase('playing');
    audio.playTrack(track);
    await new Promise((r) => setTimeout(r, 1800)); // fine della dissolvenza
    const total = (await measureLeq(5000)) + offset;
    // tolgo il rumore di fondo (somma energetica) per stimare il solo suono dell'app
    const diff = Math.pow(10, total / 10) - Math.pow(10, amb / 10);
    const near = diff > 0 ? 10 * Math.log10(diff) : total - 10;
    setPhase('done');
    setResult({ amb, near, track, vol: audio.volume });
  };

  const est = result ? levelAt(result.near, dist) : null;
  const target = TARGET_DBA - margin;

  const autoSet = () => {
    if (!result) return;
    const delta = target - est; // dB
    // per sicurezza la regolazione automatica abbassa soltanto, non alza mai
    if (delta >= 0) { setMsg(s.alreadyOk); return; }
    const v = Math.max(0.05, Math.min(1, result.vol * Math.pow(10, delta / 20)));
    audio.setVolume(v);
    const near = result.near + 20 * Math.log10(v / result.vol);
    setResult({ ...result, near, vol: v });
    setMsg(s.autoDone);
  };

  const calibrate = async () => {
    const ref = Number(String(calInput).replace(',', '.'));
    if (!Number.isFinite(ref) || ref < 20 || ref > 120) return;
    const d = await measureLeq(3000);
    const c = { offset: ref - d, at: new Date().toISOString() };
    saveCal(c);
    setCal(c);
    setMsg(s.calDone);
  };

  return (
    <motion.div className="vol-sheet" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }} transition={spring}>
      <div className="vol-head">
        <h2>{s.title}</h2>
        <button className="link" onClick={() => { stopMic(); onClose(); }}>✕</button>
      </div>
      <p className="small">{s.intro}</p>
      <p className="small muted" style={{ marginTop: 6 }}>{s.honest}</p>

      {!mode && (
        <div className="vol-modes">
          {[['crib', s.modeCrib, s.modeCribText], ['quick', s.modeQuick, s.modeQuickText]].map(([m, h, p]) => (
            <motion.button key={m} className="vol-mode" onClick={() => begin(m)} {...tap}>
              <strong>{h}</strong><span>{p}</span><em>{s.allow}</em>
            </motion.button>
          ))}
          {err && <p className="error">{err}</p>}
        </div>
      )}

      {mode === 'crib' && <Gauge value={live} calibrated={!!cal} s={s} />}

      {mode === 'quick' && (
        <div className="vol-quick">
          <label className="small">{s.distance}: <strong>{dist.toFixed(1)} m</strong></label>
          <input type="range" min="0.5" max="4" step="0.1" value={dist} onChange={(e) => setDist(Number(e.target.value))} />
          <motion.button className="bigplay" style={{ marginTop: 12 }} onClick={runQuick} disabled={phase === 'ambient' || phase === 'playing'} {...tap}>
            <span>{s.measure}{audio.playing ? ` · ${TRACK_TEXT[audio.playing][lang][0]}` : ''}</span>
          </motion.button>
          <AnimatePresence mode="wait">
            {(phase === 'ambient' || phase === 'playing') && (
              <motion.p key={phase} className="small" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {phase === 'ambient' ? s.step1 : s.step2}
              </motion.p>
            )}
          </AnimatePresence>
          {result && phase === 'done' && (
            <motion.div className="vol-result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Gauge value={est} calibrated={!!cal} s={s} />
              <p className="small">{s.atCrib(dist.toFixed(1))} · {s.ambient}: ~{Math.round(result.amb)} dB(A)</p>
              <p className="small">{s.minDist}: <strong>{minDistanceFor(result.near, target).toFixed(1)} m</strong></p>
              <motion.button className="btn primary" style={{ marginTop: 10 }} onClick={autoSet} {...tap}>{s.auto}</motion.button>
              <p className="small muted" style={{ marginTop: 8 }}>{s.keepPhoneVol}</p>
              <p className="small muted">{s.iosNote}</p>
            </motion.div>
          )}
        </div>
      )}

      {mode && (
        <details className="vol-cal">
          <summary>{s.calTitle}</summary>
          <p className="small">{s.calText}</p>
          <div className="row" style={{ marginTop: 8 }}>
            <input type="number" inputMode="decimal" placeholder="dB(A)" value={calInput} onChange={(e) => setCalInput(e.target.value)} />
            <button className="btn" onClick={calibrate}>{s.calBtn}</button>
            {cal && <button className="btn ghost" onClick={() => { try { localStorage.removeItem(KEY); } catch { /* */ } setCal(null); }}>{s.calReset}</button>}
          </div>
        </details>
      )}
      {msg && <p className="small" style={{ marginTop: 8 }}>{msg}</p>}

      <p className="small muted" style={{ marginTop: 14 }}>
        {s.sourceNote}: <a href={sources.C2.url} target="_blank" rel="noopener noreferrer">Hugh 2014</a> ·{' '}
        <a href={sources.C3.url} target="_blank" rel="noopener noreferrer">Kardous e Shaw 2014</a>
      </p>
    </motion.div>
  );
}
