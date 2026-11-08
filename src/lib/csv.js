// Import da CSV di altre app per neonati: tutto in locale, nessuna rete.
import { monthsAt } from './growth.js';

const SEPS = [',', ';', '\t'];

export function parseCsv(input) {
  let text = String(input || '').replace(/^﻿/, '');
  // separatore: il più frequente (fuori dalle virgolette) nella prima riga non vuota
  const first = text.split(/\r\n|\n|\r/).find((l) => l.trim()) || '';
  const counts = { ',': 0, ';': 0, '\t': 0 };
  let q = false;
  for (const ch of first) { if (ch === '"') q = !q; else if (!q && ch in counts) counts[ch]++; }
  const sep = SEPS.reduce((b, c) => (counts[c] > counts[b] ? c : b), ',');

  const rows = [];
  let row = [], cell = '', inQ = false, i = 0;
  const endRow = () => { row.push(cell); cell = ''; if (row.some((c) => c.trim() !== '')) rows.push(row); row = []; };
  while (i < text.length) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else inQ = false; } else cell += ch;
    } else if (ch === '"' && cell === '') inQ = true;
    else if (ch === sep) { row.push(cell); cell = ''; }
    else if (ch === '\r') { if (text[i + 1] === '\n') i++; endRow(); }
    else if (ch === '\n') endRow();
    else cell += ch;
    i++;
  }
  if (cell !== '' || row.length) endRow();
  return { sep, rows: rows.map((r) => r.map((c) => c.trim())) };
}

/* ---------- Date ---------- */
const pad = (n) => String(n).padStart(2, '0');
const validYMD = (y, m, d) => { const dt = new Date(Date.UTC(y, m - 1, d)); return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d; };

function parseTime(t) {
  if (!t) return null;
  const m = /^(\d{1,2})[:.](\d{2})(?::\d{2}(?:\.\d+)?)?\s*(am|pm)?/i.exec(t.trim());
  if (!m) return undefined;
  let h = +m[1]; const mi = +m[2];
  if (m[3]) { const pm = m[3].toLowerCase() === 'pm'; if (h < 1 || h > 12) return undefined; h = (h % 12) + (pm ? 12 : 0); }
  if (h > 23 || mi > 59) return undefined;
  return `${pad(h)}:${pad(mi)}`;
}

/** order: 'dmy' | 'mdy' (usato solo se ambiguo). Ritorna { date, time, ambiguous } o null. */
export function parseDate(str, order = 'dmy') {
  const s = String(str || '').trim();
  if (!s) return null;
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s]+(.*))?$/.exec(s);
  if (m) {
    const [y, mo, d] = [+m[1], +m[2], +m[3]];
    if (!validYMD(y, mo, d)) return null;
    const time = parseTime((m[4] || '').replace(/(Z|[+-]\d{2}:?\d{2})$/, ''));
    if (time === undefined) return null;
    return { date: `${y}-${pad(mo)}-${pad(d)}`, time, ambiguous: false };
  }
  m = /^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})(?:[,T\s]+(.*))?$/.exec(s);
  if (!m) return null;
  const a = +m[1], b = +m[2], y = +m[3];
  let d, mo, ambiguous = false;
  if (a > 12) { d = a; mo = b; } else if (b > 12) { d = b; mo = a; } else if (a === b) { d = a; mo = b; } else { ambiguous = true; [d, mo] = order === 'mdy' ? [b, a] : [a, b]; }
  if (!validYMD(y, mo, d)) return null;
  const time = parseTime(m[4]);
  if (time === undefined) return null;
  return { date: `${y}-${pad(mo)}-${pad(d)}`, time, ambiguous };
}

/** Il formato è ambiguo per questa colonna? (nessun valore chiarisce l'ordine e almeno uno è ambiguo) */
export function dateOrderState(values) {
  let amb = false;
  for (const v of values) {
    const m = /^(\d{1,2})[/.\-](\d{1,2})[/.\-]\d{4}/.exec(String(v || '').trim());
    if (!m) continue;
    const a = +m[1], b = +m[2];
    if (a > 12 && b <= 12) return { ambiguous: false, order: 'dmy' };
    if (b > 12 && a <= 12) return { ambiguous: false, order: 'mdy' };
    if (a !== b && a <= 12 && b <= 12) amb = true;
  }
  return { ambiguous: amb, order: 'dmy' };
}

/* ---------- Mappatura colonne ---------- */
export const FIELDS = ['date', 'weight', 'height', 'head', 'med', 'dose', 'note'];
const RX = {
  date: /date|data|дата|время|timestamp|datetime/i,
  head: /head|circonf|голов|cranio/i,
  height: /height|length|altezza|lunghezza|рост|длин|stature/i,
  weight: /weight|peso|вес/i,
  dose: /dose|dosage|dosa|доз/i,
  med: /medic|farmaco|лекарств|препарат|\bdrug\b/i,
  note: /note|nota|notes|комментар|заметк|примеч|comment/i
};
const GUESS_ORDER = ['date', 'head', 'height', 'weight', 'dose', 'med', 'note'];

/** headers -> { field: columnIndex } (-1 = nessuna) */
export function guessMapping(headers) {
  const out = Object.fromEntries(FIELDS.map((f) => [f, -1]));
  const used = new Set();
  for (const f of GUESS_ORDER) {
    const i = headers.findIndex((h, idx) => !used.has(idx) && RX[f].test(h));
    if (i >= 0) { out[f] = i; used.add(i); }
  }
  return out;
}

/* ---------- Costruzione record ---------- */
const num = (v) => { const m = /-?\d+(?:[.,]\d+)?/.exec(String(v ?? '').replace(/\s/g, '')); return m ? parseFloat(m[0].replace(',', '.')) : null; };
const toKg = (v, u) => (u === 'g' ? v / 1000 : u === 'lb' ? v * 0.45359237 : v);
const toCm = (v, u) => (u === 'in' ? v * 2.54 : v);
const round = (v, d) => Math.round(v * 10 ** d) / 10 ** d;
const RX_PARA = /paracetamol|acetaminophen|парацетамол/i;
const RX_IBU = /ibuprofen|ибупрофен/i;
export const activeOf = (name) => (RX_PARA.test(name) ? 'paracetamolo' : RX_IBU.test(name) ? 'ibuprofene' : null);
const LIMITS = { weight: [0.3, 40], height: [20, 130], head: [20, 60] };
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

const gKey = (r) => [r.kidId, r.date, r.weight ?? '', r.height ?? '', r.head ?? ''].join('|');
const mKey = (r) => [r.kidId, r.at, r.active || '', (r.name || '').toLowerCase(), r.amount ?? '', r.unit || ''].join('|');

/**
 * rows: righe dati (senza intestazione). map: {field: col}. opts: {order, wUnit, hUnit, headUnit, doseUnit, kid, names, existing:{growth,meds}, now}
 * Ritorna { growth, meds, ignored: {noDate, empty, badValue, outOfRange, noName, duplicate} }
 */
export function buildRecords(rows, map, opts) {
  const { order = 'dmy', wUnit = 'kg', hUnit = 'cm', headUnit = 'cm', doseUnit = 'mg', kid, names = {}, existing = {} } = opts;
  const now = opts.now || new Date().toISOString();
  const seenG = new Set((existing.growth || []).filter((g) => g.kidId === kid.id).map(gKey));
  const seenM = new Set((existing.meds || []).filter((g) => g.kidId === kid.id).map(mKey));
  const ignored = { noDate: 0, empty: 0, badValue: 0, outOfRange: 0, noName: 0, duplicate: 0 };
  const growth = [], meds = [];
  const cell = (r, f) => (map[f] >= 0 ? r[map[f]] ?? '' : '');
  const today = now.slice(0, 10);

  for (const r of rows) {
    const d = parseDate(cell(r, 'date'), order);
    if (!d) { ignored.noDate++; continue; }
    if (d.date < kid.birth || d.date > today) { ignored.outOfRange++; continue; }
    let used = false, bad = false;

    // misure
    const g = { id: uid(), kidId: kid.id, date: d.date };
    for (const [f, unit, conv] of [['weight', wUnit, toKg], ['height', hUnit, toCm], ['head', headUnit, toCm]]) {
      const raw = cell(r, f);
      if (raw === '') continue;
      const v = num(raw);
      if (v == null) { bad = true; continue; }
      const val = round(conv(v, unit), f === 'weight' ? 3 : 1);
      if (!(val >= LIMITS[f][0] && val <= LIMITS[f][1])) { bad = true; continue; }
      g[f] = val;
    }
    if (g.weight || g.height || g.head) {
      used = true;
      if (g.height) g.heightPos = monthsAt(kid.birth, d.date) < 24 ? 'lying' : 'standing';
      g.source = 'import'; g.updatedAt = now;
      const k = gKey(g);
      if (seenG.has(k)) ignored.duplicate++; else { seenG.add(k); growth.push(g); }
    }

    // medicine
    const name = cell(r, 'med').trim();
    const amountRaw = cell(r, 'dose');
    if (name) {
      used = true;
      const at = new Date(`${d.date}T${d.time || '12:00'}:00`).toISOString();
      const active = activeOf(name);
      const amount = amountRaw === '' ? null : num(amountRaw);
      const e = {
        id: uid(), kidId: kid.id, at, active, name: active ? names[active] || name : name.slice(0, 60),
        route: active ? 'oral' : null, amount: amount > 0 ? amount : null, unit: amount > 0 ? doseUnit : 'other', conc: null,
        flags: [], note: cell(r, 'note').slice(0, 120), source: 'import', updatedAt: now
      };
      const k = mKey(e);
      if (seenM.has(k)) ignored.duplicate++; else { seenM.add(k); meds.push(e); }
    } else if (amountRaw !== '' && !used) { ignored.noName++; continue; }

    if (!used) { if (bad) ignored.badValue++; else ignored.empty++; }
  }
  return { growth, meds, ignored };
}
