// Crescita: z-score e percentili sugli standard OMS (metodo LMS).
// Fonti: WHO Child Growth Standards 2006 (0–5 anni) e WHO Growth Reference 2007 (5–19 anni).
// Le soglie di avviso sono in GROWTH_RULES e citano le loro fonti (content/sources.json).
import GROWTH from '../data/growth.json';

export const INDICATORS = {
  weight: { unit: 'kg', maxMonths: 120, restricted: true, step: 0.01 }, // OMS 2007: peso per età solo fino a 10 anni (W2)
  height: { unit: 'cm', maxMonths: 144, restricted: false, step: 0.1 },
  head: { unit: 'cm', maxMonths: 36, restricted: false, step: 0.1 }, // L=1 (W8); OMS fino a 60 mesi, AAP misura di routine fino a 24 (W14)
  bmi: { unit: 'kg/m²', minMonths: 24, maxMonths: 144, restricted: true, step: 0.1, derived: true } // calcolato da peso e altezza della stessa misura; OMS 2006 (24-60 mesi) e 2007 (61-144)
};
export const INPUTS = ['weight', 'height', 'head']; // indicatori inseriti a mano (bmi è derivato)
export const bmiOf = (kg, cm) => (kg > 0 && cm > 0 ? kg / ((cm / 100) ** 2) : null);

// Soglie (vedi fonti indicate in GROWTH_SOURCES)
export const GROWTH_RULES = {
  warnZ: 2,          // oltre ±2 DS: fuori dall'intervallo tipico (OMS)
  strongZ: 3,        // oltre ±3 DS: molto lontano (OMS)
  implausible: { weight: [-6, 5], height: [-6, 6], head: [-5, 5], bmi: [-5, 5], wfl: [-5, 5] }, // flag OMS di valori biologicamente improbabili
  bmiFromMonths: 61, bmiToMonths: 228, // soglie OMS del BMI per età solo a 61–228 mesi (X4); sotto i 61 mesi solo la posizione
  space: 0.67,       // uno "spazio" tra centili maggiori ≈ 2/3 DS (W9)
  minGapDays: { weight: 28, head: 28, height: 90 }, // altezza: non più spesso di ogni 3 mesi (W6)
  newbornDays: 14,   // 0–2 settimane: calo fisiologico, niente confronto tra centili (W5, W6)
  below04: -2.652    // sotto lo 0,4° centile: valutazione anche se la crescita è regolare (W5)
};

export const GROWTH_SOURCES = ['X4', 'X5', 'W1', 'W2', 'W4', 'W8', 'W3', 'W7', 'W5', 'W9', 'W6', 'W10', 'W11', 'W13', 'W14', 'W12', 'W15', 'W16'];

const DAYS_PER_MONTH = 30.4375;

export function lmsAt(indicator, sex, months) {
  const data = GROWTH[indicator];
  const sx = sex === 'f' ? 2 : 1;
  const table = data?.[sx];
  if (!table || months < 0 || months < (INDICATORS[indicator]?.minMonths || 0)) return null;
  const max = table.length - 1;
  if (months > max) return null;
  const lerp = (a, b, f) => a.map((v, k) => v + (b[k] - v) * f);
  const days = months * DAYS_PER_MONTH;
  if (days <= 91 && data.early) { // valori giornalieri OMS nei primi 3 mesi
    const d = Math.floor(days), e = data.early[sx];
    return d >= 91 ? e[91] : lerp(e[d], e[d + 1], days - d);
  }
  const i = Math.floor(months);
  const f = months - i;
  if (indicator === 'height' && i === 23 && data[`len730_${sx}`]) return lerp(table[23], data[`len730_${sx}`], f); // resta "sdraiato" fino a 24 mesi
  if (f === 0 || i >= max) return table[Math.min(i, max)];
  return lerp(table[i], table[i + 1], f);
}

const valueAt = ([L, M, S], z) => (L === 0 ? M * Math.exp(S * z) : M * Math.pow(1 + L * S * z, 1 / L));

function zFromLms(lms, x, restricted) {
  const [L, M, S] = lms;
  let z = L === 0 ? Math.log(x / M) / S : (Math.pow(x / M, L) - 1) / (L * S);
  // Metodo OMS "restricted" per peso, BMI e peso per lunghezza/altezza oltre ±3 DS
  if (restricted && Math.abs(z) > 3) {
    const sd3 = valueAt(lms, 3 * Math.sign(z));
    const sd2 = valueAt(lms, 2 * Math.sign(z));
    z = Math.sign(z) * 3 + (x - sd3) / Math.abs(sd3 - sd2);
  }
  return z;
}

export function zScore(indicator, sex, months, x) {
  const lms = lmsAt(indicator, sex, months);
  if (!lms || !(x > 0)) return null;
  return zFromLms(lms, x, INDICATORS[indicator].restricted);
}

// Peso per lunghezza (sotto 731 giorni) o per altezza (dopo), OMS 2006, 0-60 mesi (W4).
export const WFL_MAX_MONTHS = 60;
export const wflType = (months) => (months * DAYS_PER_MONTH < 731 ? 'wfl' : 'wfh');
export function wflLms(sex, months, cm) {
  if (!(months >= 0) || months > WFL_MAX_MONTHS || !(cm > 0)) return null;
  const tbl = GROWTH[wflType(months)];
  const rows = tbl?.[sex === 'f' ? 2 : 1];
  if (!rows) return null;
  const pos = Math.round((cm - tbl.min) * 1e7) / 1e6; // posizione in passi da 0,1 cm
  if (pos < 0 || pos > rows.length - 1) return null;
  const i = Math.floor(pos), f = pos - i;
  if (f === 0 || i >= rows.length - 1) return rows[Math.min(i, rows.length - 1)];
  return rows[i].map((v, k) => v + (rows[i + 1][k] - v) * f);
}
export function wflZ(sex, months, cm, kg) {
  const lms = wflLms(sex, months, cm);
  if (!lms || !(kg > 0)) return null;
  return zFromLms(lms, kg, true);
}
// Curve percentili peso per lunghezza/altezza: ascissa = cm
export function wflCurve(sex, type, fromCm, toCm, steps = 50) {
  const tbl = GROWTH[type], rows = tbl?.[sex === 'f' ? 2 : 1];
  const out = CURVES.map(([, p]) => ({ p, pts: [] }));
  if (!rows) return out;
  const a = Math.max(tbl.min, fromCm), b = Math.min(tbl.max, toCm);
  for (let k = 0; k <= steps; k++) {
    const cm = a + ((b - a) * k) / steps;
    const pos = Math.round((cm - tbl.min) * 1e7) / 1e6, i = Math.min(Math.floor(pos), rows.length - 2), f = pos - i;
    const lms = rows[i].map((v, j) => v + (rows[i + 1][j] - v) * f);
    CURVES.forEach(([z], j) => out[j].pts.push([cm, valueAt(lms, z)]));
  }
  return out;
}
export function assessWfl(sex, months, cm, kg) {
  const z = wflZ(sex, months, cm, kg);
  if (z == null) return { z: null, warnings: [] };
  const [lo, hi] = GROWTH_RULES.implausible.wfl;
  const warnings = [];
  if (z < lo || z > hi) warnings.push({ kind: 'implausible', level: 'check' });
  else if (z > 3) warnings.push({ kind: 'wflObese', level: 'warn' });
  else if (z > 2) warnings.push({ kind: 'wflOverweight', level: 'warn' });
  else if (z > 1) warnings.push({ kind: 'wflRisk', level: 'info' });
  else if (z < -3) warnings.push({ kind: 'wflSevereWasting', level: 'strong' });
  else if (z < -2) warnings.push({ kind: 'wflWasting', level: 'warn' });
  return { z, p: percentile(z), warnings };
}

// Funzione di ripartizione normale standard (Abramowitz–Stegun 7.1.26)
export function normCdf(z) {
  const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(z * z) / 2);
  return z >= 0 ? (1 + y) / 2 : (1 - y) / 2;
}

export const percentile = (z) => (z == null ? null : Math.min(99.9, Math.max(0.1, normCdf(z) * 100)));

// Curve dei percentili OMS: 3, 15, 50, 85, 97
export const CURVES = [[-1.881, 3], [-1.036, 15], [0, 50], [1.036, 85], [1.881, 97]];
export function curve(indicator, sex, fromM, toM, steps = 60) {
  const out = CURVES.map(([z, p]) => ({ p, pts: [] }));
  for (let k = 0; k <= steps; k++) {
    const m = fromM + ((toM - fromM) * k) / steps;
    const lms = lmsAt(indicator, sex, m);
    if (!lms) continue;
    CURVES.forEach(([z], j) => out[j].pts.push([m, valueAt(lms, z)]));
  }
  return out;
}

export const monthsAt = (birthISO, dateISO) => {
  const d = (new Date(dateISO) - new Date(birthISO)) / 86400000;
  return d / DAYS_PER_MONTH;
};

// Età per i confronti OMS: età corretta fino a 24 mesi per i nati pretermine
// RCPCH (W13): si corregge fino a 1 anno se nato a 32–36 settimane, fino a 2 anni se prima delle 32
export function isCorrected(kid, dateISO) {
  const m = monthsAt(kid.birth, dateISO), w = +kid.gaWeeks;
  return !!(w && w < 37 && m < (w < 32 ? 24 : 12));
}
export function growthAge(kid, dateISO) {
  const m = monthsAt(kid.birth, dateISO);
  const w = +kid.gaWeeks;
  if (w && w < 37 && m < (w < 32 ? 24 : 12)) return m - ((40 - w) * 7) / 30.4375; // negativo = prima del termine
  return m;
}

// Valuta una misura rispetto agli standard OMS e alle misure precedenti → elenco di avvisi.
// opts.birthZ: z del peso alla nascita (soglia di calo NICE: 1, 2 o 3 spazi)
export function assess(indicator, sex, months, value, prev, opts = {}) {
  const z = zScore(indicator, sex, months, value);
  if (z == null) return { z: null, warnings: [] };
  const R = GROWTH_RULES;
  const warnings = [];
  const [lo, hi] = R.implausible[indicator];
  if (z < lo || z > hi) warnings.push({ kind: 'implausible', level: 'check' });
  else if (indicator === 'bmi') { // soglie OMS 5–19 anni (X4); sotto i 61 mesi nessuna soglia
    if (months >= R.bmiFromMonths && months <= R.bmiToMonths) {
      if (z > 2) warnings.push({ kind: 'bmiObese', level: 'warn' });
      else if (z > 1) warnings.push({ kind: 'bmiOverweight', level: 'warn' });
      else if (z < -3) warnings.push({ kind: 'bmiVeryThin', level: 'strong' });
      else if (z < -2) warnings.push({ kind: 'bmiThin', level: 'warn' });
    }
  }
  else if (indicator === 'height' && z > 3) warnings.push({ kind: 'tall', level: 'info' });        // raramente un problema (W3)
  else if (indicator === 'height' && z > 2) { /* nella norma per l'OMS */ }
  else if (indicator === 'weight' && z > 2) warnings.push({ kind: z > 3 ? 'weightVeryHigh' : 'weightHigh', level: 'info' }); // il peso per età non dice se è sovrappeso (W3, W15)
  else if (indicator === 'head' && Math.abs(z) > 2) warnings.push({ kind: z > 0 ? (z > 3 ? 'headVeryHigh' : 'headHigh') : (z < -3 ? 'headVeryLow' : 'headLow'), level: Math.abs(z) > 3 ? 'strong' : 'warn' });
  else if (z < -3) warnings.push({ kind: 'veryLow', level: 'strong' });
  else if (z < -2) warnings.push({ kind: z < R.below04 ? 'below04' : 'low', level: 'warn' });

  if (indicator === 'bmi') return { z, p: percentile(z), warnings }; // niente confronti tra misure per il BMI finché la ricerca non è completata
  const minGap = R.minGapDays[indicator];
  const prevs = (Array.isArray(prev) ? prev : prev ? [prev] : [])
    .filter((q) => !!q.corr === !!opts.corr) // niente confronti tra età corretta e cronologica
    .filter((q) => (months - q.months) * DAYS_PER_MONTH >= minGap && q.months * DAYS_PER_MONTH >= R.newbornDays)
    .map((q) => zScore(indicator, sex, q.months, q.value)).filter((q) => q != null && Math.abs(q) <= 5);
  if (prevs.length && warnings[0]?.kind !== 'implausible') {
    const towardMedian = (from) => Math.abs(z) < Math.abs(from) && (z * from >= 0 || Math.abs(z) < 0.25); // avvicinarsi alla mediana è di solito positivo (W3)
    const hiZ = Math.max(...prevs), loZ = Math.min(...prevs);
    let spaces = 2;
    if (indicator === 'weight' && opts.birthZ != null) spaces = opts.birthZ < -1.341 ? 1 : opts.birthZ > 1.341 ? 3 : 2; // NICE 1.2.1 (W6)
    const thr = spaces * R.space - 0.01;
    // esenzione "verso la mediana" solo per altezza e per il peso senza peso alla nascita (testa: ogni salto conta, W5)
    const exempt = indicator === 'height' || (indicator === 'weight' && opts.birthZ == null);
    if (hiZ - z >= thr && !(exempt && towardMedian(hiZ))) warnings.push({ kind: 'crossDown', level: 'warn', spaces, ind: indicator });
    else if (indicator !== 'weight' && z - loZ >= 2 * R.space - 0.01 && !(exempt && towardMedian(loZ))) {
      // testa: salita isolata = info; avviso solo se continua a salire dopo i 6 mesi (misura precedente già in salita)
      const cont = prevs.length >= 2 && prevs[prevs.length - 1] > prevs[prevs.length - 2] && z > prevs[prevs.length - 1];
      warnings.push({ kind: 'crossUp', level: indicator === 'head' && !(months > 6 && cont) ? 'info' : 'warn', spaces: 2 });
    }
  }
  return { z, p: percentile(z), warnings };
}

// Neonati (W6, NICE NG75): calo > 10% del peso alla nascita, o peso non recuperato a 3 settimane
export function newbornCheck(birthKg, ageDays, kg) {
  if (!(birthKg > 0) || !(kg > 0)) return null;
  if (ageDays <= 14 && kg < birthKg * 0.9) return { kind: 'newbornLoss', level: 'warn', pct: Math.round((1 - kg / birthKg) * 100) };
  if (ageDays >= 21 && ageDays <= 42 && kg < birthKg) return { kind: 'notRegained', level: 'warn' };
  return null;
}

// Posizione di misura (W7, W4): sotto i 24 mesi sdraiato; in piedi misura in media 0,7 cm in meno.
// Oltre i 60 mesi nessuna correzione (anthroplus non ne applica)
export function adjustHeight(months, cm, pos) {
  if (!(cm > 0)) return cm;
  if (months < 24 && pos === 'standing') return cm + 0.7;
  if (months >= 24 && months <= 60 && pos === 'lying') return cm - 0.7;
  return cm;
}

// BMI stimato da misure non simultanee (scelta prudenziale di Lunibù, ispirata a Bailey 2013, che stimava l'altezza dalle visite vicine; W16): solo posizione, mai soglie.
// heights: [{ t: mesi cronologici, m: età per le curve, v: altezza corretta, date }] ordinate per data; w: { t, m }
const EST_GAP = (t) => (t < 12 ? 4 : t <= 60 ? 6 : 12);          // massima distanza tra le due altezze (mesi)
const EST_CARRY = (t) => (t < 6 ? 14 : t < 24 ? 30 : t <= 60 ? 60 : 90); // giorni di riporto in avanti
export function estimateHeight(sex, heights, w) {
  const R = GROWTH_RULES;
  const okH = (q) => { const z = zScore('height', sex, q.m, q.v); return z != null && z >= R.implausible.height[0] && z <= R.implausible.height[1] ? z : null; };
  const before = heights.filter((q) => q.t <= w.t), after = heights.filter((q) => q.t > w.t);
  const a = before[before.length - 1], b = after[0];
  const lms = lmsAt('height', sex, w.m);
  if (!a || !lms) return null;
  const z1 = okH(a);
  if (z1 == null) return null;
  let z, dates;
  if (b) {
    const z2 = okH(b);
    if (z2 == null || b.t - a.t > EST_GAP(w.t) || Math.abs(z2 - z1) > R.space) return null;
    z = z1 + ((z2 - z1) * (w.t - a.t)) / (b.t - a.t);
    dates = [a.date, b.date];
  } else {
    if ((w.t - a.t) * DAYS_PER_MONTH > EST_CARRY(w.t)) return null;
    z = z1;
    dates = [a.date];
  }
  return { h: valueAt([1, lms[1], lms[2]], z), dates };
}

// Il peso per età alto (info) si nasconde quando esiste una valutazione migliore: peso per lunghezza/altezza,
// oppure BMI misurato (non stimato) dai 61 mesi
export function dropWeightHigh(warnings, { wfl, bmi } = {}, months) {
  if (!wfl && !(bmi && !bmi.estimated && months >= GROWTH_RULES.bmiFromMonths)) return warnings;
  return warnings.filter((x) => x.kind !== 'weightHigh' && x.kind !== 'weightVeryHigh');
}
