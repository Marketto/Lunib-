import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { t } from '../lib/i18n.js';
import { Mobile } from './Paper.jsx';
import { LangSwitch, spring, tap } from './Common.jsx';
import { IconLock } from './Icons.jsx';
import { TermsAccept } from './Terms.jsx';
import { PassForm, TX, errMsg, version } from './SyncCard.jsx';
import { importEncrypted, decodeQr } from '../lib/sync.js';
import { initialFromImport, finishOnboarding } from '../lib/onboard.js';
import { driveEnabled, getToken, pickFile } from '../lib/drive.js';
import { runSync } from '../lib/driveStore.js';

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

const OT = {
  it: {
    askTitle: 'Hai già dei dati condivisi dall\'altro genitore?', no: 'No, inizio da zero', noSub: 'Aggiungo i miei bimbi.',
    file: 'Sì, ho un file Lunibù (.lunibu)', fileSub: 'Lo apro con la frase segreta concordata.',
    drive: 'Sì, usiamo Google Drive', driveSub: 'Collego Drive e scelgo il file condiviso.',
    qrHint: 'Se l\'altro genitore ti ha mostrato un QR, inquadralo con la fotocamera del telefono: Lunibù si aprirà con i dati.',
    fileTitle: 'Apri il file condiviso', connect: 'Collega Google Drive', pickDrive: 'Scegli il file su Drive',
    qrTitle: 'Dati ricevuti da un QR', found: (n, names, g, m) => `Trovati ${n} ${n === 1 ? 'bimbo' : 'bimbi'}${names.length ? `: ${names.join(', ')}` : ''}, ${g} misure, ${m} medicine.`,
    review: 'Controlla i bimbi', reviewHint: 'Puoi correggere nomi e date di nascita.', fromScratch: 'Inizia da zero'
  },
  ru: {
    askTitle: 'У вас уже есть данные от другого родителя?', no: 'Нет, начинаю с нуля', noSub: 'Добавлю своих детей.',
    file: 'Да, у меня есть файл Lunibù (.lunibu)', fileSub: 'Открою его по согласованной секретной фразе.',
    drive: 'Да, мы используем Google Drive', driveSub: 'Подключу Drive и выберу общий файл.',
    qrHint: 'Если другой родитель показал вам QR-код, наведите на него камеру телефона: Lunibù откроется с данными.',
    fileTitle: 'Открыть общий файл', connect: 'Подключить Google Drive', pickDrive: 'Выбрать файл в Drive',
    qrTitle: 'Данные из QR-кода', found: (n, names, g, m) => `Найдено детей: ${n}${names.length ? ` (${names.join(', ')})` : ''}, измерений: ${g}, лекарств: ${m}.`,
    review: 'Проверьте детей', reviewHint: 'Можно исправить имена и даты рождения.', fromScratch: 'Начать с нуля'
  }
};

// Passi: welcome, ask, file, drive, qr, review, count, kids, terms (le condizioni chiudono sempre ogni percorso)
const DOT = { welcome: 0, ask: 1, terms: 3 };

export default function Onboarding({ lang, setLang, onDone, qrData, onQrClose }) {
  const s = t(lang);
  const o = OT[lang];
  const x = TX[lang];
  const [[step, dir], setStep] = useState([qrData ? 'qr' : 'welcome', 1]);
  const [count, setCount] = useState(1);
  const [kids, setKids] = useState([{ birth: '', name: '' }]);
  const [imported, setImported] = useState(null);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [linked, setLinked] = useState(false);
  const [picked, setPicked] = useState(null);
  const go = (n) => { setMsg(''); setStep([n, 1]); };
  const back = (n) => { setMsg(''); setStep([n, -1]); };

  // un QR arrivato dopo l'apertura dell'onboarding porta qui
  useEffect(() => { if (qrData) setStep(['qr', 1]); }, [qrData]);

  const setN = (n) => {
    const v = Math.max(1, Math.min(6, n));
    setCount(v);
    setKids((k) => Array.from({ length: v }, (_, i) => k[i] || { birth: '', name: '' }));
  };
  const valid = kids.every((k) => k.birth && k.birth <= todayISO());

  const accept = (remote) => {
    const r = initialFromImport(remote);
    setImported(r);
    if (r.kids.length) { setKids(r.kids.map((k) => ({ ...k, name: k.name || '', birth: k.birth || '' }))); go('review'); }
    else { setN(1); go('count'); }
  };
  const run = async (f) => { setBusy(true); setMsg(''); try { await f(); } catch (e) { setMsg(errMsg(x, e)); } setBusy(false); };
  const fromFile = (pass) => run(async () => { if (!file) throw new Error('bad-file'); accept(await importEncrypted(file, pass)); });
  const fromQr = (pass) => run(async () => { accept(await decodeQr(qrData, pass)); });
  const fromDrive = (pass) => run(async () => {
    const r = await runSync({ latest: () => ({ kids: [], growth: [], meds: [], medPlans: [], milestones: [], deleted: {} }), fileId: picked, pass, appVersion: version() });
    accept(r.merged);
  });
  const connect = () => run(async () => { await getToken(); setLinked(true); });
  const pick = () => run(async () => { const id = await pickFile(); if (id) setPicked(id); });
  const finish = () => {
    const f = finishOnboarding(kids, imported);
    onDone(f.kids, f.extra);
  };
  const dotIdx = DOT[step] ?? 2;
  const Msg = () => (msg ? <p className="small form-err" role="alert">{msg}</p> : null);
  const Choice = ({ title, sub, onClick, primary }) => (
    <motion.button className={`btn ${primary ? 'primary' : ''}`} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '16px 18px', marginTop: 12 }} onClick={onClick} {...tap}>
      <strong style={{ display: 'block' }}>{title}</strong><span className="small">{sub}</span>
    </motion.button>
  );

  return (
    <div className="onb">
      <div className="onb-top"><LangSwitch lang={lang} setLang={setLang} /></div>
      {step === 'welcome' && <Mobile height={210} />}
      <div className="onb-body">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={step} custom={dir} variants={slide} initial="initial" animate="animate" exit="exit">
            {step === 'welcome' && (
              <>
                <h1>{s.appName}</h1>
                <p className="lead">{s.welcomeText}</p>
                <p className="privacy"><IconLock />{s.privacyNote}</p>
                <div className="row"><motion.button className="btn primary" onClick={() => go('ask')} {...tap}>{s.start}</motion.button></div>
              </>
            )}
            {step === 'ask' && (
              <>
                <h1>{o.askTitle}</h1>
                <Choice primary title={o.no} sub={o.noSub} onClick={() => { setImported(null); go('count'); }} />
                <Choice title={o.file} sub={o.fileSub} onClick={() => go('file')} />
                {driveEnabled && <Choice title={o.drive} sub={o.driveSub} onClick={() => go('drive')} />}
                <p className="small muted" style={{ marginTop: 16 }}>{o.qrHint}</p>
                <div className="row"><button className="btn ghost" onClick={() => back('welcome')}>{s.back}</button></div>
              </>
            )}
            {step === 'file' && (
              <>
                <h1>{o.fileTitle}</h1>
                <label className="field"><span>{x.pick}</span><input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} /></label>
                <PassForm s={x} label={x.askPass} busy={busy} onSubmit={fromFile} onCancel={() => back('ask')} />
                <Msg />
              </>
            )}
            {step === 'qr' && (
              <>
                <h1>{o.qrTitle}</h1>
                <p className="small">{x.recvIntro}</p>
                <PassForm s={x} label={x.askPass} busy={busy} onSubmit={fromQr} onCancel={() => { onQrClose?.(); back('ask'); }} />
                <Msg />
              </>
            )}
            {step === 'drive' && (
              <>
                <h1>{x.dTitle}</h1>
                {!linked && <button className="btn primary" disabled={busy} onClick={connect}>{busy ? x.busy : o.connect}</button>}
                {linked && !picked && <button className="btn primary" disabled={busy} onClick={pick}>{busy ? x.busy : o.pickDrive}</button>}
                {linked && picked && <PassForm s={x} label={x.askPass} busy={busy} onSubmit={fromDrive} onCancel={() => setPicked(null)} />}
                <Msg />
                {!picked && <div className="row"><button className="btn ghost" onClick={() => back('ask')}>{s.back}</button></div>}
              </>
            )}
            {step === 'review' && imported && (
              <>
                <h1>{o.review}</h1>
                <p role="status"><strong>{o.found(imported.summary.kids, imported.summary.names, imported.summary.growth, imported.summary.meds)}</strong></p>
                <p className="small muted">{o.reviewHint}</p>
                <AnimatePresence>
                  {kids.map((k, i) => (
                    <KidForm key={k.id || i} kid={k} index={i} lang={lang} onChange={(nk) => setKids((all) => all.map((y, j) => (j === i ? nk : y)))} />
                  ))}
                </AnimatePresence>
                <div className="row">
                  <button className="btn ghost" onClick={() => { setImported(null); back('ask'); }}>{s.back}</button>
                  <motion.button className="btn primary" disabled={!valid} onClick={() => go('terms')} {...tap}>{s.next}</motion.button>
                </div>
              </>
            )}
            {step === 'count' && (
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
                  <button className="btn ghost" onClick={() => back('ask')}>{s.back}</button>
                  <motion.button className="btn primary" onClick={() => go('kids')} {...tap}>{s.next}</motion.button>
                </div>
              </>
            )}
            {step === 'kids' && (
              <>
                <h1>{count > 1 ? s.kids : s.kid}</h1>
                <AnimatePresence>
                  {kids.map((k, i) => (
                    <KidForm key={i} kid={k} index={i} lang={lang} onChange={(nk) => setKids((all) => all.map((y, j) => (j === i ? nk : y)))} />
                  ))}
                </AnimatePresence>
                <p className="privacy"><IconLock />{s.privacyNote}</p>
                <div className="row">
                  <button className="btn ghost" onClick={() => back('count')}>{s.back}</button>
                  <motion.button className="btn primary" disabled={!valid} onClick={() => go('terms')} {...tap}>{s.next}</motion.button>
                </div>
              </>
            )}
            {step === 'terms' && (
              <>
                <h1>{s.disclaimerTitle}</h1>
                <p className="lead">{s.disclaimer}</p>
                <TermsAccept lang={lang} label={s.start} onAccept={finish} />
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="dots">{[0, 1, 2, 3].map((i) => <span key={i} className={i === dotIdx ? 'on' : ''} />)}</div>
    </div>
  );
}
