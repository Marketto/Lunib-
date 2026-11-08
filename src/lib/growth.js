// Crescita: z-score e percentili sugli standard OMS (metodo LMS).
// Fonti: WHO Child Growth Standards 2006 (0–5 anni) e WHO Growth Reference 2007 (5–19 anni).
// Le soglie di avviso sono in GROWTH_RULES e citano le loro fonti (content/sources.json).
import GROWTH from '../data/growth.json';

export const INDICATORS = {
  weight: { unit: 'kg', maxMonths: 72, restricted: true, step: 0.01 },
  height: { unit: 'cm', maxMonths: 72, restricted: false, step: 0.1 },
  head: { unit: 'cm', maxMonths: 36, restricted: false, step: 0.1 } // L=1 (W8); OMS fino a 60 mesi, AAP misura di routine fino a 24 (W14)
};

// Soglie (vedi fonti indicate in GROWTH_SOURCES)
export const GROWTH_RULES = {
  warnZ: 2,          // oltre ±2 DS: fuori dall'intervallo tipico (OMS)
  strongZ: 3,        // oltre ±3 DS: molto lontano (OMS)
  implausible: { weight: [-6, 5], height: [-6, 6], head: [-5, 5] }, // flag OMS di valori biologicamente improbabili
  space: 0.67,       // uno "spazio" tra centili maggiori ≈ 2/3 DS (W9)
  minGapDays: { weight: 28, head: 28, height: 90 }, // altezza: non più spesso di ogni 3 mesi (W6)
  newbornDays: 14,   // 0–2 settimane: calo fisiologico, niente confronto tra centili (W5, W6)
  below04: -2.652    // sotto lo 0,4° centile: valutazione anche se la crescita è regolare (W5)
};

export const GROWTH_SOURCES = ['W1', 'W2', 'W4', 'W8', 'W3', 'W7', 'W5', 'W9', 'W6', 'W10', 'W11', 'W13', 'W14', 'W12'];

const DAYS_PER_MONTH = 30.4375;

export function lmsAt(indicator, sex, months) {
  const data = GROWTH[indicator];
  const sx = sex === 'f' ? 2 : 1;
  const table = data?.[sx];
  if (!table || months < 0) return null;
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

export function zScore(indicator, sex, months, x) {
  const lms = lmsAt(indicator, sex, months);
  if (!lms || !(x > 0)) return null;
  const [L, M, S] = lms;
  let z = L === 0 ? Math.log(x / M) / S : (Math.pow(x / M, L) - 1) / (L * S);
  // Metodo OMS "restricted" per peso e circonferenza cranica oltre ±3 DS
  if (INDICATORS[indicator].restricted && Math.abs(z) > 3) {
    const sd3 = valueAt(lms, 3 * Math.sign(z));
    const sd2 = valueAt(lms, 2 * Math.sign(z));
    z = Math.sign(z) * 3 + (x - sd3) / Math.abs(sd3 - sd2);
  }
  return z;
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

// Valuta una misura rispetto agli standard OMS e alle misure precedenti → elenco di avvisi.
// opts.birthZ: z del peso alla nascita (soglia di calo NICE: 1, 2 o 3 spazi)
export function assess(indicator, sex, months, value, prev, opts = {}) {
  const z = zScore(indicator, sex, months, value);
  if (z == null) return { z: null, warnings: [] };
  const R = GROWTH_RULES;
  const warnings = [];
  const [lo, hi] = R.implausible[indicator];
  if (z < lo || z > hi) warnings.push({ kind: 'implausible', level: 'check' });
  else if (indicator === 'height' && z > 3) warnings.push({ kind: 'tall', level: 'info' });        // raramente un problema (W3)
  else if (indicator === 'height' && z > 2) { /* nella norma per l'OMS */ }
  else if (indicator === 'weight' && z > 2) warnings.push({ kind: z > 3 ? 'weightVeryHigh' : 'weightHigh', level: 'warn' });
  else if (indicator === 'head' && Math.abs(z) > 2) warnings.push({ kind: z > 0 ? (z > 3 ? 'headVeryHigh' : 'headHigh') : (z < -3 ? 'headVeryLow' : 'headLow'), level: Math.abs(z) > 3 ? 'strong' : 'warn' });
  else if (z < -3) warnings.push({ kind: 'veryLow', level: 'strong' });
  else if (z < -2) warnings.push({ kind: z < R.below04 ? 'below04' : 'low', level: 'warn' });

  const minGap = R.minGapDays[indicator];
  const prevs = (Array.isArray(prev) ? prev : prev ? [prev] : [])
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
    if (hiZ - z >= thr && !(exempt && towardMedian(hiZ))) warnings.push({ kind: 'crossDown', level: 'warn', spaces });
    else if (indicator !== 'weight' && z - loZ >= 2 * R.space - 0.01 && !(exempt && towardMedian(loZ))) warnings.push({ kind: 'crossUp', level: 'warn', spaces: 2 });
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

// Posizione di misura (W7, W4): sotto i 24 mesi sdraiato; in piedi misura in media 0,7 cm in meno
export function adjustHeight(months, cm, pos) {
  if (!(cm > 0)) return cm;
  if (months < 24 && pos === 'standing') return cm + 0.7;
  if (months >= 24 && pos === 'lying') return cm - 0.7;
  return cm;
}
