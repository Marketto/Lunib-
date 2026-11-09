import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { tap } from './Common.jsx';
import { parseCsv, guessMapping, dateOrderState, buildRecords, FIELDS } from '../lib/csv.js';

export const IMPORT_BTN = { it: 'Importa da un\'altra app (CSV)', ru: 'Импорт из другого приложения (CSV)' };

const TX = {
  it: {
    structHint: 'Il tuo file non è riconosciuto bene? Copia solo la struttura (nomi dei fogli e delle colonne, nessun dato, nessuna foto) e mandala per ricevere supporto.', structCopy: 'Copia la struttura del file', structCopied: 'Struttura copiata',
    title: 'Importa da CSV o Excel', local: 'Il file viene letto solo sul tuo telefono: non viene inviato da nessuna parte.',
    pick: 'Scegli un file CSV o Excel (.xlsx)', step: (n) => `Passo ${n} di 3`, preview: 'Anteprima delle prime 5 righe',
    next: 'Avanti', back: 'Indietro', cancel: 'Chiudi', empty: 'Nessuna riga leggibile in questo file.', err: 'Impossibile leggere il file.',
    mapTitle: 'Collega le colonne', none: '— non importare —',
    f: { date: 'Data / data e ora', weight: 'Peso', height: 'Lunghezza / altezza', head: 'Circonferenza testa', med: 'Nome del farmaco', dose: 'Quantità di farmaco', note: 'Nota' },
    unitFor: 'Unità', dateOrder: 'Le date sono ambigue (es. 03/04/2025). Come sono scritte?', dmy: 'giorno/mese', mdy: 'mese/giorno',
    needDate: 'Scegli la colonna della data e almeno un dato da importare.',
    kidAsk: 'Per quale bimbo sono questi dati?', summary: (g, m, k) => `${g} misure, ${m} medicine, ${k} righe ignorate`,
    reasons: { noDate: 'data mancante o illeggibile', empty: 'nessun dato', badValue: 'valori non plausibili', outOfRange: 'data prima della nascita o futura', noName: 'dose senza nome del farmaco', duplicate: 'già presenti' },
    confirm: 'Importa', done: (g, m) => `Importate ${g} misure e ${m} medicine. Valutazioni e controlli delle dosi si aggiornano da soli.`,
    verify: 'Controlla che i valori importati siano giusti: l\'app non può verificarli.'
  },
  ru: {
    structHint: 'Файл распознаётся плохо? Скопируйте только структуру (названия листов и столбцов, без данных и фото) и отправьте её для поддержки.', structCopy: 'Скопировать структуру файла', structCopied: 'Структура скопирована',
    title: 'Импорт из CSV или Excel', local: 'Файл читается только на вашем телефоне и никуда не отправляется.',
    pick: 'Выберите файл CSV или Excel (.xlsx)', step: (n) => `Шаг ${n} из 3`, preview: 'Первые 5 строк',
    next: 'Далее', back: 'Назад', cancel: 'Закрыть', empty: 'В этом файле нет читаемых строк.', err: 'Не удалось прочитать файл.',
    mapTitle: 'Сопоставьте столбцы', none: '— не импортировать —',
    f: { date: 'Дата / дата и время', weight: 'Вес', height: 'Длина / рост', head: 'Окружность головы', med: 'Название лекарства', dose: 'Количество лекарства', note: 'Заметка' },
    unitFor: 'Единицы', dateOrder: 'Даты неоднозначны (например, 03/04/2025). Как они записаны?', dmy: 'день/месяц', mdy: 'месяц/день',
    needDate: 'Выберите столбец с датой и хотя бы одно данное для импорта.',
    kidAsk: 'Для какого ребёнка эти данные?', summary: (g, m, k) => `${g} измерений, ${m} лекарств, ${k} строк пропущено`,
    reasons: { noDate: 'нет даты или она нечитаема', empty: 'нет данных', badValue: 'неправдоподобные значения', outOfRange: 'дата до рождения или в будущем', noName: 'доза без названия лекарства', duplicate: 'уже есть' },
    confirm: 'Импортировать', done: (g, m) => `Импортировано: ${g} измерений и ${m} лекарств. Оценки и проверки доз обновятся сами.`,
    verify: 'Проверьте, что импортированные значения верны: приложение не может это проверить.'
  }
};
const NAMES = { it: { paracetamolo: 'Paracetamolo', ibuprofene: 'Ibuprofene' }, ru: { paracetamolo: 'Парацетамол', ibuprofene: 'Ибупрофен' } };
const UNITS = { weight: ['kg', 'g', 'lb'], height: ['cm', 'in'], head: ['cm', 'in'], dose: ['mg', 'ml'] };

// Struttura del file SENZA dati: nomi dei fogli, intestazioni e "forma" del primo valore di ogni colonna
// (cifre → 9, lettere → a). Serve a chiedere supporto senza condividere dati o foto.
export function maskValue(v) {
  const t = String(v ?? '').trim();
  if (!t) return '';
  return t.slice(0, 24).replace(/\p{L}/gu, 'a').replace(/\d/g, '9');
}
export function describe(sheets) {
  return sheets.filter((sh) => sh.rows.length).map((sh) => {
    const [head, ...body] = sh.rows;
    const cols = head.map((h, i) => {
      const v = body.find((r) => String(r[i] ?? '').trim())?.[i];
      return `  - ${String(h || '(vuota)').slice(0, 40)}: ${maskValue(v) || '—'}`;
    });
    return `Foglio "${sh.name}" (${body.length} righe)\n${cols.join('\n')}`;
  }).join('\n\n');
}

export default function ImportCsv({ lang, kids, active, growth, meds, setGrowth, setMeds, onClose }) {
  const s = TX[lang];
  const [step, setStep] = useState(0);
  const [data, setData] = useState(null); // { rows }
  const [err, setErr] = useState('');
  const [map, setMap] = useState(null);
  const [units, setUnits] = useState({ weight: 'kg', height: 'cm', head: 'cm', dose: 'mg' });
  const [order, setOrder] = useState('dmy');
  const [kidIdx, setKidIdx] = useState(active);
  const [result, setResult] = useState(null);

  const headers = data?.rows[0] || [];
  const body = useMemo(() => (data ? data.rows.slice(1) : []), [data]);
  const dState = useMemo(() => (map && map.date >= 0 ? dateOrderState(body.map((r) => r[map.date])) : { ambiguous: false, order: 'dmy' }), [map, body]);
  const effOrder = dState.ambiguous ? order : dState.order;

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      let rows;
      if (/\.xlsx$/i.test(f.name)) {
        // Excel: si carica solo quando serve; si sceglie il foglio con più colonne riconosciute
        const { default: readXlsx, readSheetNames } = await import('read-excel-file');
        const names = await readSheetNames(f);
        const cell = (v) => (v instanceof Date ? v.toISOString().slice(0, 16).replace('T', ' ').replace(' 00:00', '') : v == null ? '' : String(v));
        let best = null;
        const struct = [];
        for (const name of names) {
          const r = (await readXlsx(f, { sheet: name })).map((row) => row.map(cell));
          struct.push({ name, rows: r });
          const g = r.length ? guessMapping(r[0]) : {};
          const score = Object.values(g).filter((x) => x >= 0).length;
          if (r.length > 1 && (!best || score > best.score)) best = { rows: r, score, name };
        }
        rows = best ? best.rows : [];
        setStructure(describe(struct));
        setSheets(names.length > 1 && best ? `${best.name} (${names.length})` : '');
      } else {
        rows = parseCsv(await f.text()).rows;
        setStructure(describe([{ name: f.name.replace(/.*\./, '').toUpperCase(), rows }]));
      }
      if (rows.length < 2) { setErr(s.empty); return; }
      setErr(''); setData({ rows }); setMap(guessMapping(rows[0])); setStep(1);
    } catch { setErr(s.err); }
  };
  const [sheets, setSheets] = useState('');
  const [structure, setStructure] = useState('');
  const [copied, setCopied] = useState(false);
  const copyStructure = async () => { try { await navigator.clipboard.writeText(structure); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch {} };
  const ref = React.useRef(null);
  React.useEffect(() => { ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, [step]);

  const kid = kids[kidIdx] || kids[0];
  const built = useMemo(() => {
    if (step < 3 || !map) return null;
    return buildRecords(body, map, { order: effOrder, wUnit: units.weight, hUnit: units.height, headUnit: units.head, doseUnit: units.dose, kid, names: NAMES[lang], existing: { growth, meds } });
  }, [step, map, body, units, effOrder, kid, lang]); // eslint-disable-line
  const mapOk = map && map.date >= 0 && ['weight', 'height', 'head', 'med'].some((f) => map[f] >= 0);
  const skipped = built ? Object.values(built.ignored).reduce((a, b) => a + b, 0) : 0;
  const reasons = built ? Object.entries(built.ignored).filter(([, n]) => n).map(([k, n]) => `${s.reasons[k]}: ${n}`).join('; ') : '';

  const confirm = () => {
    if (built.growth.length) setGrowth([...growth, ...built.growth]);
    if (built.meds.length) setMeds([...meds, ...built.meds]);
    setResult(s.done(built.growth.length, built.meds.length));
  };

  return (
    <motion.section ref={ref} className="diary-form imp" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} aria-label={s.title}>
      <h3>{s.title} {step > 0 && !result && <small className="muted">· {s.step(step)}</small>}</h3>
      <p className="small muted">{s.local}</p>
      {sheets && step === 1 && <p className="small muted">{lang === 'ru' ? 'Лист' : 'Foglio'}: {sheets}</p>}
      {structure && step >= 1 && !result && (
        <div className="struct-box">
          <p className="small muted">{s.structHint}</p>
          <button type="button" className="btn ghost small" onClick={copyStructure}>{copied ? `✓ ${s.structCopied}` : s.structCopy}</button>
        </div>
      )}

      {result ? (
        <>
          <p role="status"><strong>{result}</strong></p>
          <p className="small muted">{s.verify}</p>
          <button className="btn primary" onClick={onClose}>{s.cancel}</button>
        </>
      ) : step === 0 ? (
        <>
          <label className="field"><span>{s.pick}</span><input type="file" accept=".csv,.txt,.xlsx,text/csv,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={onFile} /></label>
          {err && <p className="small" role="alert">{err}</p>}
          <div className="row"><button className="btn ghost" onClick={onClose}>{s.cancel}</button></div>
        </>
      ) : step === 1 ? (
        <>
          <p className="small"><strong>{s.preview}</strong></p>
          <div className="imp-table" tabIndex={0}>
            <table><thead><tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
              <tbody>{body.slice(0, 5).map((r, i) => <tr key={i}>{headers.map((_, j) => <td key={j}>{r[j]}</td>)}</tr>)}</tbody></table>
          </div>
          <div className="row"><button className="btn ghost" onClick={() => setStep(0)}>{s.back}</button>
            <motion.button className="btn primary" onClick={() => setStep(2)} {...tap}>{s.next}</motion.button></div>
        </>
      ) : step === 2 ? (
        <>
          <p className="small"><strong>{s.mapTitle}</strong></p>
          {FIELDS.map((f) => (
            <div key={f} className="imp-map">
              <label className="field"><span>{s.f[f]}</span>
                <select value={map[f]} onChange={(e) => setMap({ ...map, [f]: +e.target.value })}>
                  <option value={-1}>{s.none}</option>
                  {headers.map((h, i) => <option key={i} value={i}>{h || `#${i + 1}`}</option>)}
                </select></label>
              {UNITS[f] && map[f] >= 0 && (
                <label className="field narrow"><span>{s.unitFor}</span>
                  <select value={units[f]} onChange={(e) => setUnits({ ...units, [f]: e.target.value })}>{UNITS[f].map((u) => <option key={u}>{u}</option>)}</select></label>
              )}
            </div>
          ))}
          {dState.ambiguous && (
            <fieldset className="flags"><legend>{s.dateOrder}</legend>
              <div className="seg small" role="radiogroup">
                {['dmy', 'mdy'].map((o) => <button key={o} role="radio" aria-checked={order === o} className={order === o ? 'on' : ''} onClick={() => setOrder(o)}><span>{s[o]}</span></button>)}
              </div></fieldset>
          )}
          {!mapOk && <p className="small muted">{s.needDate}</p>}
          <div className="row"><button className="btn ghost" onClick={() => setStep(1)}>{s.back}</button>
            <motion.button className="btn primary" disabled={!mapOk} onClick={() => setStep(3)} {...tap}>{s.next}</motion.button></div>
        </>
      ) : (
        <>
          {kids.length > 1 && (
            <label className="field"><span>{s.kidAsk}</span>
              <select value={kidIdx} onChange={(e) => setKidIdx(+e.target.value)}>{kids.map((k, i) => <option key={k.id} value={i}>{k.name || k.birth}</option>)}</select></label>
          )}
          <p role="status"><strong>{s.summary(built.growth.length, built.meds.length, skipped)}</strong>{skipped > 0 && <> ({reasons})</>}</p>
          <p className="small muted">{s.verify}</p>
          <div className="row"><button className="btn ghost" onClick={() => setStep(2)}>{s.back}</button>
            <motion.button className="btn primary" disabled={!built.growth.length && !built.meds.length} onClick={confirm} {...tap}>{s.confirm}</motion.button></div>
        </>
      )}
    </motion.section>
  );
}
