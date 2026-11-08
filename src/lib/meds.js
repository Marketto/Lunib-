// Diario medicine: registrazione libera di qualsiasi farmaco + controllo prudenziale
// per i principi attivi in src/data/meds.json (nessun calcolo/suggerimento di dose: solo verifica di limiti).
import MEDS from '../data/meds.json';

export const ACTIVE = MEDS.active;
export const MED_SOURCES = MEDS.sources;
const H = 3600000;

export function toMg(entry) {
  if (entry.unit === 'mg') return +entry.amount || null;
  if (entry.unit === 'ml' && entry.conc > 0) return +entry.amount * entry.conc; // conc = mg/ml (come sul foglietto)
  return null;
}

// Ultimo peso noto (kg) prima della data, con età della misura in giorni
export function latestWeight(growth, kidId, atISO) {
  const at = new Date(atISO).getTime();
  const w = growth
    .filter((g) => g.kidId === kidId && g.weight > 0 && new Date(g.date).getTime() <= at + 86400000)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  return w ? { kg: +w.weight, days: Math.round((at - new Date(w.date).getTime()) / 86400000) } : null;
}

/**
 * Controlla una somministrazione rispetto alle altre dello stesso bimbo.
 * Ritorna una lista di { kind, level: 'stop'|'warn'|'info', ...valori }.
 */
export function checkDose(entry, log, { months, weight }) {
  const a = ACTIVE[entry.active];
  if (!a) return [{ kind: 'noCheck', level: 'info' }];
  const out = [];
  const at = new Date(entry.at).getTime();
  const r = a.routes[entry.route] || a.routes.oral;

  if (months != null && months < a.askDoctorUnderMonths) out.push({ kind: 'underAge', level: 'stop', months: a.askDoctorUnderMonths });
  if (a.minWeightKg && weight && weight.kg < a.minWeightKg) out.push({ kind: 'underWeight', level: 'stop', kg: a.minWeightKg });
  for (const c of a.contra || []) if (entry.flags?.includes(c)) out.push({ kind: 'contra', level: 'stop', flag: c });

  const same = log.filter((e) => e.id !== entry.id && e.kidId === entry.kidId && e.active === entry.active);
  const before = same.filter((e) => new Date(e.at).getTime() <= at).sort((x, y) => y.at.localeCompare(x.at));
  const last = before[0];
  if (last) {
    const gap = (at - new Date(last.at).getTime()) / H;
    // l'intervallo si conta su tutte le vie (bocca + supposta), con la regola più prudente tra le due
    const minH = Math.max(r.minIntervalH, (a.routes[last.route] || r).minIntervalH);
    if (gap < minH) out.push({ kind: 'tooSoon', level: 'warn', hours: minH, gap });
    else if (r.cautionIntervalH && gap < r.cautionIntervalH) out.push({ kind: 'intervalCaution', level: 'info', hours: r.cautionIntervalH });
  }
  const in24 = [entry, ...same.filter((e) => { const t = new Date(e.at).getTime(); return t > at - 24 * H && t <= at; })];
  // numero di dosi: conta solo la stessa via se l'altra non ha un massimo verificato (supposte: fasce di peso del foglietto)
  if (r.maxDoses24h) {
    const n = in24.filter((e) => (a.routes[e.route] || r).maxDoses24h).length;
    if (n > r.maxDoses24h) out.push({ kind: 'tooMany', level: 'warn', max: r.maxDoses24h, n });
  }
  if (r.followBand) out.push({ kind: 'rectalBand', level: 'info' });
  if (new Set(in24.map((e) => e.route || 'oral')).size > 1) out.push({ kind: 'mixedRoutes', level: 'info' });

  const mg = toMg(entry);
  if (mg && weight?.kg) {
    const perKg = mg / weight.kg;
    if (r.stopMgPerKgDose && perKg > r.stopMgPerKgDose * 1.001) out.push({ kind: 'doseVeryHigh', level: 'stop', perKg, max: r.stopMgPerKgDose });
    else if (r.maxMgPerKgDose && perKg > r.maxMgPerKgDose * 1.001) out.push({ kind: 'doseHigh', level: 'warn', perKg, max: r.maxMgPerKgDose });
    // totale 24 h: somma delle frazioni del limite giornaliero di ogni via che ne ha uno verificato
    let frac = 0, mgKg = 0, dayMax = 0;
    for (const e of in24) {
      const lim = (a.routes[e.route] || r).maxMgPerKgDay;
      if (!lim) continue;
      const v = (toMg(e) || 0) / weight.kg;
      frac += v / lim; mgKg += v; dayMax = lim;
    }
    if (frac > 1.001) out.push({ kind: 'dayHigh', level: 'warn', perKg: mgKg, max: dayMax });
    if (weight.days > 31) out.push({ kind: 'oldWeight', level: 'info', days: weight.days });
  } else if (mg && !weight) out.push({ kind: 'noWeight', level: 'info' });
  else if (!mg) out.push({ kind: 'noMg', level: 'info' });

  // Uso continuativo: un "episodio" continua finché tra due dosi passano ≤ 24 h
  const times = [at, ...before.map((e) => new Date(e.at).getTime())].sort((x, y) => y - x);
  let start = times[0];
  for (let i = 1; i < times.length && times[i - 1] - times[i] <= 24 * H; i++) start = times[i];
  const maxDays = months != null && a.maxDaysYoung && months < a.maxDaysYoung.underMonths ? a.maxDaysYoung.days : a.maxDays;
  if (maxDays && at - start > maxDays * 24 * H) out.push({ kind: 'tooLong', level: 'warn', days: maxDays });

  // Altro antipiretico nelle ultime ore: si alterna solo su indicazione del medico
  const other = log.find((e) => e.kidId === entry.kidId && e.active && e.active !== entry.active && ACTIVE[e.active]?.group === a.group &&
    Math.abs(at - new Date(e.at).getTime()) < 6 * H);
  if (other && a.group) out.push({ kind: 'alternating', level: 'info', other: other.active });
  return out;
}

export function filterLog(log, { kidId, med, days }) {
  const since = days ? Date.now() - days * 86400000 : 0;
  return log
    .filter((e) => (kidId == null || e.kidId === kidId) && (!med || (e.active || e.name.toLowerCase()) === med) && new Date(e.at).getTime() >= since)
    .sort((a, b) => b.at.localeCompare(a.at));
}

export const medKey = (e) => e.active || e.name.trim().toLowerCase();

export function toCsv(rows, header) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [header.map(esc).join(';'), ...rows.map((r) => r.map(esc).join(';'))].join('\n');
}
