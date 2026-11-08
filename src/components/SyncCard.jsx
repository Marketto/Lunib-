import React, { useState } from 'react';
import { motion } from 'framer-motion';
import qrcode from 'qrcode-generator';
import { tap } from './Common.jsx';
import { appUrl } from './Share.jsx';
import { MIN_PASS, exportEncrypted, importEncrypted, mergeData, buildQuickPayload, encodeQr, decodeQr } from '../lib/sync.js';

const TX = {
  it: {
    title: 'Condividi i dati con l\'altro genitore', intro: 'Crea un file protetto da una frase segreta e invialo all\'altro genitore: i dati di crescita e medicine si uniscono sui due telefoni, senza server.',
    create: 'Crea file da inviare', open: 'Apri file ricevuto', qr: 'Mostra QR (ultimi aggiornamenti)',
    privacy: 'Il file contiene dati sanitari. È protetto dalla frase segreta e non viene salvato da nessun\'altra parte: lo conservi e lo inoltri solo tu.',
    pass: 'Frase segreta', pass2: 'Ripeti la frase segreta', hint: `Almeno ${MIN_PASS} caratteri. Concordatela a voce e non mandatela nella stessa chat del file.`,
    short: `La frase deve avere almeno ${MIN_PASS} caratteri.`, mismatch: 'Le due frasi non coincidono.',
    go: 'Continua', cancel: 'Annulla', close: 'Chiudi', busy: 'Un momento…',
    shared: 'File pronto.', downloaded: 'File scaricato: invialo all\'altro genitore.',
    pick: 'Scegli il file .lunibu ricevuto', askPass: 'Frase segreta concordata', decrypt: 'Apri e unisci',
    badPass: 'Frase segreta sbagliata, oppure il file è stato modificato.', badFile: 'Questo non è un file Lunibù valido.', fail: 'Operazione non riuscita.',
    result: (g, m, u) => `Aggiunte ${g} misure e ${m} medicine; ${u} aggiornate.`,
    doses: 'Dosi date dall\'altro genitore nelle ultime 24 ore', dosesNote: 'Controlla prima di dare un\'altra dose: non darla due volte.',
    qrHow: 'L\'altro genitore inquadra il QR con la normale fotocamera del telefono: si apre Lunibù e chiede la frase segreta.',
    qrBig: 'Troppi dati per un QR: usa il file.', qrMeds: 'Includi solo le medicine delle ultime 48 ore',
    qrNote: 'Contiene solo gli ultimi aggiornamenti (48 ore) ed è cifrato; i dati stanno nel link, che non viene inviato a nessun server.',
    recvTitle: 'Aggiornamento dall\'altro genitore', recvIntro: 'Hai aperto un QR di Lunibù. Inserisci la frase segreta concordata per unire i dati.'
  },
  ru: {
    title: 'Поделиться данными с другим родителем', intro: 'Создайте файл, защищённый секретной фразой, и отправьте другому родителю: данные о росте и лекарствах объединятся на двух телефонах, без сервера.',
    create: 'Создать файл для отправки', open: 'Открыть полученный файл', qr: 'Показать QR (последние обновления)',
    privacy: 'Файл содержит данные о здоровье. Он защищён секретной фразой и нигде больше не сохраняется: хранить и пересылать его можете только вы.',
    pass: 'Секретная фраза', pass2: 'Повторите секретную фразу', hint: `Не менее ${MIN_PASS} символов. Договоритесь устно и не отправляйте её в том же чате, что и файл.`,
    short: `Фраза должна быть не короче ${MIN_PASS} символов.`, mismatch: 'Фразы не совпадают.',
    go: 'Продолжить', cancel: 'Отмена', close: 'Закрыть', busy: 'Минутку…',
    shared: 'Файл готов.', downloaded: 'Файл скачан: отправьте его другому родителю.',
    pick: 'Выберите полученный файл .lunibu', askPass: 'Согласованная секретная фраза', decrypt: 'Открыть и объединить',
    badPass: 'Неверная секретная фраза, или файл изменён.', badFile: 'Это не корректный файл Lunibù.', fail: 'Не удалось выполнить.',
    result: (g, m, u) => `Добавлено ${g} измерений и ${m} лекарств; обновлено: ${u}.`,
    doses: 'Дозы, данные другим родителем за последние 24 часа', dosesNote: 'Проверьте перед следующей дозой: не давайте её дважды.',
    qrHow: 'Другой родитель наводит обычную камеру телефона на QR: откроется Lunibù и спросит секретную фразу.',
    qrBig: 'Слишком много данных для QR: используйте файл.', qrMeds: 'Включить только лекарства за последние 48 часов',
    qrNote: 'Только последние обновления (48 часов), зашифровано; данные находятся в ссылке, которая не отправляется ни на какой сервер.',
    recvTitle: 'Обновление от другого родителя', recvIntro: 'Вы открыли QR-код Lunibù. Введите согласованную секретную фразу, чтобы объединить данные.'
  }
};

const errMsg = (s, e) => (e?.message === 'bad-pass' ? s.badPass : e?.message === 'bad-file' ? s.badFile : s.fail);
const version = () => (typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '');

function PassForm({ s, twice, onSubmit, onCancel, busy, label }) {
  const [a, setA] = useState(''), [b, setB] = useState(''), [e, setE] = useState('');
  const submit = (ev) => {
    ev.preventDefault();
    if (a.length < MIN_PASS) return setE(s.short);
    if (twice && a !== b) return setE(s.mismatch);
    setE(''); onSubmit(a);
  };
  return (
    <form onSubmit={submit}>
      <label className="field"><span>{label || s.pass}</span>
        <input type="password" autoComplete="off" value={a} onChange={(x) => setA(x.target.value)} /></label>
      {twice && <label className="field"><span>{s.pass2}</span>
        <input type="password" autoComplete="off" value={b} onChange={(x) => setB(x.target.value)} /></label>}
      {twice && <p className="small muted">{s.hint}</p>}
      {e && <p className="small" role="alert">{e}</p>}
      <div className="row"><button type="button" className="btn ghost" onClick={onCancel}>{s.cancel}</button>
        <motion.button type="submit" className="btn primary" disabled={busy} {...tap}>{busy ? s.busy : s.go}</motion.button></div>
    </form>
  );
}

export function SyncResult({ s, lang, stats, kids }) {
  const name = (id) => kids.find((k) => k.id === id)?.name;
  return (
    <div role="status">
      <p><strong>{s.result(stats.addedGrowth, stats.addedMeds, stats.updated)}</strong></p>
      {stats.recentDoses.length > 0 && (
        <div className="note care" style={{ flexDirection: 'column', marginTop: 10 }}>
          <strong>{s.doses}</strong>
          <ul className="sync-doses">
            {stats.recentDoses.map((d) => (
              <li key={d.id}>{d.name}{name(d.kidId) ? ` (${name(d.kidId)})` : ''} · {new Date(d.at).toLocaleString(lang, { dateStyle: 'short', timeStyle: 'short' })}</li>
            ))}
          </ul>
          <span className="small">{s.dosesNote}</span>
        </div>
      )}
    </div>
  );
}

const readState = (st) => ({ kids: st.kids || [], growth: st.growth || [], meds: st.meds || [], deleted: st.deleted || {} });

export default function SyncCard({ lang, state, onMerge }) {
  const s = TX[lang];
  const [mode, setMode] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [file, setFile] = useState(null);
  const [res, setRes] = useState(null);
  const [qr, setQr] = useState(null); // { svg, big }
  const [qrPass, setQrPass] = useState('');
  const reset = (m) => { setMode(m); setMsg(''); setRes(null); setQr(null); setFile(null); };

  const doExport = async (pass) => {
    setBusy(true);
    try {
      const blob = await exportEncrypted(readState(state), pass, version());
      const f = new File([blob], `lunibu-${new Date().toISOString().slice(0, 10)}.lunibu`, { type: 'application/octet-stream' });
      if (navigator.canShare?.({ files: [f] })) {
        try { await navigator.share({ files: [f] }); setMsg(s.shared); } catch (e) { if (e?.name !== 'AbortError') throw e; }
      } else {
        const a = document.createElement('a'); a.href = URL.createObjectURL(f); a.download = f.name; a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000); setMsg(s.downloaded);
      }
    } catch (e) { setMsg(errMsg(s, e)); }
    setBusy(false);
  };

  const doImport = async (pass) => {
    if (!file) return setMsg(s.badFile);
    setBusy(true); setMsg('');
    try {
      const remote = await importEncrypted(file, pass);
      const m = mergeData(readState(state), remote);
      onMerge(m); setRes(m.stats);
    } catch (e) { setMsg(errMsg(s, e)); }
    setBusy(false);
  };

  const doQr = async (pass, medsOnly = false) => {
    setBusy(true); setMsg(''); setQrPass(pass);
    try {
      const payload = buildQuickPayload(readState(state), { medsOnly, appVersion: version() });
      const { data, tooLarge } = await encodeQr(payload, pass);
      if (tooLarge) setQr({ big: true, medsOnly });
      else {
        const q = qrcode(0, 'L'); q.addData(`${appUrl()}#sync=${data}`); q.make();
        setQr({ svg: q.createSvgTag({ cellSize: 3, margin: 2, scalable: true }) });
      }
    } catch (e) { setMsg(errMsg(s, e)); }
    setBusy(false);
  };

  return (
    <section className="sync-card diary-form" aria-labelledby="sync-h">
      <h2 id="sync-h" style={{ marginTop: 0 }}>{s.title}</h2>
      <p className="small">{s.intro}</p>
      <p className="small muted">{s.privacy}</p>
      <div className="row" style={{ flexWrap: 'wrap' }}>
        <button className="btn" onClick={() => reset('export')}>{s.create}</button>
        <button className="btn" onClick={() => reset('import')}>{s.open}</button>
        <button className="btn" onClick={() => reset('qr')}>{s.qr}</button>
      </div>

      {mode === 'export' && <div style={{ marginTop: 12 }}><PassForm s={s} twice busy={busy} onSubmit={doExport} onCancel={() => reset(null)} />{msg && <p role="status">{msg}</p>}</div>}

      {mode === 'import' && (
        <div style={{ marginTop: 12 }}>
          {res ? (
            <><SyncResult s={s} lang={lang} stats={res} kids={state.kids || []} /><button className="btn" style={{ marginTop: 10 }} onClick={() => reset(null)}>{s.close}</button></>
          ) : (
            <>
              <label className="field"><span>{s.pick}</span><input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} /></label>
              <PassForm s={s} label={s.askPass} busy={busy} onSubmit={doImport} onCancel={() => reset(null)} />
              {msg && <p className="small" role="alert">{msg}</p>}
            </>
          )}
        </div>
      )}

      {mode === 'qr' && (
        <div style={{ marginTop: 12 }}>
          {!qr ? (
            <><PassForm s={s} twice busy={busy} onSubmit={doQr} onCancel={() => reset(null)} />{msg && <p className="small" role="alert">{msg}</p>}</>
          ) : qr.big ? (
            <div role="alert">
              <p><strong>{s.qrBig}</strong></p>
              {!qr.medsOnly && <button className="btn" onClick={() => doQr(qrPass, true)}>{s.qrMeds}</button>}
              <button className="btn ghost" onClick={() => reset(null)}>{s.close}</button>
            </div>
          ) : (
            <>
              <p className="small">{s.qrHow}</p>
              <div className="qr" aria-label="QR" dangerouslySetInnerHTML={{ __html: qr.svg }} />
              <p className="small muted">{s.qrNote}</p>
              <button className="btn" onClick={() => reset(null)}>{s.close}</button>
            </>
          )}
        </div>
      )}
    </section>
  );
}

/** Pannello che si apre quando l'app è aperta da un QR (#sync=...). */
export function QuickReceive({ lang, data, state, onMerge, onClose }) {
  const s = TX[lang];
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [res, setRes] = useState(null);
  const go = async (pass) => {
    setBusy(true); setMsg('');
    try {
      const m = mergeData(readState(state), await decodeQr(data, pass));
      onMerge(m); setRes(m.stats);
    } catch (e) { setMsg(errMsg(s, e)); }
    setBusy(false);
  };
  return (
    <div className="sync-sheet" role="dialog" aria-modal="true" aria-labelledby="sync-rh">
      <motion.div className="sync-sheet-in" initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 26 }}>
        <h2 id="sync-rh" style={{ marginTop: 0 }}>{s.recvTitle}</h2>
        {res ? (
          <><SyncResult s={s} lang={lang} stats={res} kids={state.kids || []} /><button className="btn primary" style={{ marginTop: 12 }} onClick={onClose}>{s.close}</button></>
        ) : (
          <><p className="small">{s.recvIntro}</p>
            <PassForm s={s} label={s.askPass} busy={busy} onSubmit={go} onCancel={onClose} />
            {msg && <p className="small" role="alert">{msg}</p>}</>
        )}
      </motion.div>
    </div>
  );
}
