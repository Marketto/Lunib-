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

// Vitamina D: 1 µg = 40 UI (NIH ODS, fonte V3). concIU = UI per goccia (unità gocce) o UI per ml (unità ml), scritte sulla confezione.
export const IU_PER_UG = 40;
export function toIU(entry) {
  const n = +entry.amount;
  if (!(n > 0)) return null;
  if (entry.unit === 'UI') return n;
  if (entry.unit === 'µg' || entry.unit === 'mcg') return n * IU_PER_UG;
  if ((entry.unit === 'gocce' || entry.unit === 'ml') && entry.concIU > 0) return n * entry.concIU;
  return null;
}

/** Limite massimo giornaliero (UI) per età in mesi, dalla tabella EFSA in meds.json; null se l'età è fuori tabella. */
export function vitDLimit(months) {
  const t = ACTIVE.vitaminaD.ulIU.find((r) => months < r.underMonths);
  return t || null;
}
const RX_VITD_ANALOG = /calcifediol|alfacalcidol|calcitriol|diidrotachisterol|dihydrotachysterol|кальцифедиол|альфакальцидол|кальцитриол|дигидротахистерол/i;
const localDate = (iso) => { const d = new Date(iso); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

/** Totale UI di vitamina D registrate dal bimbo nello stesso giorno locale (entry incluso se passato in log). */
export function vitDDayTotal(log, kidId, dayISO) {
  const day = localDate(dayISO);
  let iu = 0, missing = 0;
  for (const e of log) {
    if (e.kidId !== kidId || e.active !== 'vitaminaD' || localDate(e.at) !== day) continue;
    const v = toIU(e);
    if (v == null) missing++; else iu += v;
  }
  return { iu, missing };
}

// Ultimo peso noto (kg) prima della data, con età della misura in giorni
export function latestWeight(growth, kidId, atISO) {
  const at = new Date(atISO).getTime();
  const w = growth
    .filter((g) => g.kidId === kidId && g.weight > 0 && new Date(g.date).getTime() <= at + 86400000)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  return w ? { kg: +w.weight, date: w.date, days: Math.round((at - new Date(w.date).getTime()) / 86400000) } : null;
}

const CAP_WEIGHT_MAX_DAYS = 31; // peso più vecchio di 31 giorni: si usa la fascia d'età

/**
 * Fascia dei tetti assoluti (meds.json `caps`): per peso se c'è un peso registrato negli ultimi 31 giorni, altrimenti per età.
 * Se nessuna fascia di peso corrisponde (es. ≥12 anni ma ≤40 kg) si ricade sulla fascia d'età. Null sotto i 6 anni.
 */
export function capBand(caps, months, weight) {
  if (!caps || months == null) return null;
  const ageOk = (b) => months >= (b.minMonths ?? 0) && (b.maxMonths == null || months < b.maxMonths);
  const kg = weight && weight.kg > 0 && weight.days <= CAP_WEIGHT_MAX_DAYS ? weight.kg : null;
  const kgOk = (b) => (b.minKg == null || kg >= b.minKg) && (b.maxKg == null || (b.maxKgInclusive ? kg <= b.maxKg : kg < b.maxKg)) && (b.overKg == null || kg > b.overKg);
  if (kg != null) {
    const w = caps.find((b) => b.basis === 'weight' && ageOk(b) && kgOk(b));
    if (w) return w;
  }
  return caps.find((b) => b.basis !== 'weight' && ageOk(b)) || null;
}

/**
 * Controlla una somministrazione rispetto alle altre dello stesso bimbo.
 * Ritorna una lista di { kind, level: 'stop'|'warn'|'info', ...valori }.
 */
export function checkDose(entry, log, { months, weight }) {
  const a = ACTIVE[entry.active];
  if (!a) {
    const r = [{ kind: 'noCheck', level: 'info' }];
    if (RX_VITD_ANALOG.test(entry.name || '')) r.push({ kind: 'vitDAnalog', level: 'info', refs: ACTIVE.vitaminaD.refs.vitDAnalog });
    return r;
  }
  if (a.kind === 'daily') return checkDaily(entry, a, log, months);
  const out = [];
  const at = new Date(entry.at).getTime();
  const r = a.routes[entry.route] || a.routes.oral;

  if (months != null && months < a.askDoctorUnderMonths) out.push({ kind: 'underAge', level: 'stop', months: a.askDoctorUnderMonths });
  const cap = capBand(a.caps, months, weight);
  if (a.caps && months != null && months >= 72 && months <= 144) out.push({ kind: 'rcpNote', level: 'info' }); // 6–12 anni
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
    if (weight.days > 31) out.push({ kind: 'oldWeight', level: 'warn', days: weight.days });
  } else if (mg && !weight) out.push({ kind: 'noWeight', level: 'info' });
  else if (!mg) out.push({ kind: 'noMg', level: 'info' });

  // Tetti assoluti per età/peso (6–12 anni): dose singola (solo per bocca) e totale 24 h su tutte le vie
  if (cap) {
    if (mg && (entry.route || 'oral') === 'oral' && mg > cap.perDoseMg + 1e-6) out.push({ kind: 'capDose', level: 'warn', max: cap.perDoseMg, refs: cap.src });
    const total = in24.reduce((t, e) => t + (toMg(e) || 0), 0);
    if (total > cap.perDayMg + 1e-6) out.push({ kind: 'capDay', level: 'warn', max: cap.perDayMg, mg: total, refs: cap.src });
  }

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

/** Integratori a limite giornaliero (vitamina D): somma del giorno vs limite EFSA per età; nessun controllo di intervalli o numero di dosi. */
function checkDaily(entry, a, log, months) {
  const out = [];
  const others = log.filter((e) => e.id !== entry.id);
  const { iu, missing } = vitDDayTotal([entry, ...others], entry.kidId, entry.at);
  if (missing) out.push({ kind: 'vitDNoIU', level: 'info' });
  const ul = months != null ? vitDLimit(months) : null;
  if (ul) {
    if (iu > ul.iu * a.strongFactor) out.push({ kind: 'vitDVeryHigh', level: 'stop', iu, ul: ul.iu, refs: ul.src });
    else if (iu > ul.iu) out.push({ kind: 'vitDHigh', level: 'warn', iu, ul: ul.iu, refs: ul.src });
  }
  out.push({ kind: 'vitDInfo', level: 'info', refs: a.refs.vitDInfo });
  out.push({ kind: 'vitDAllSources', level: 'info', refs: a.refs.vitDAllSources });
  if (months != null) out.push({ kind: 'vitDRec', level: 'info', period: months < 12 ? 'infant' : 'child', refs: months < 12 ? ['V4', 'V5', 'V6'] : ['V3', 'V4', 'V5', 'V6'] });
  return out;
}

// Chiave di raggruppamento: principio attivo, oppure nome senza maiuscole e senza spazi
export const normName = (n) => String(n || '').toLowerCase().replace(/\s+/g, '');
export const medKey = (e) => e.active || normName(e.name);
export const planKey = (p) => p.active || normName(p.name);

export function filterLog(log, { kidId, med, days }) {
  const since = days ? Date.now() - days * 86400000 : 0;
  return log
    .filter((e) => (kidId == null || e.kidId === kidId) && (!med || medKey(e) === med) && new Date(e.at).getTime() >= since)
    .sort((a, b) => b.at.localeCompare(a.at));
}

/** Schema del genitore per una somministrazione: stesso bimbo e stesso nome (senza maiuscole/spazi), oppure stesso principio attivo. */
export function findPlan(plans, entry) {
  if (!entry) return null;
  const list = (plans || []).filter((p) => p.kidId === entry.kidId);
  return (entry.active && list.find((p) => p.active === entry.active)) ||
    list.find((p) => normName(p.name) && normName(p.name) === normName(entry.name)) || null;
}
export const entryMatchesPlan = (e, plan) => e.kidId === plan.kidId && ((!!plan.active && e.active === plan.active) || (!!normName(plan.name) && normName(e.name) === normName(plan.name)));

const localDay = (iso) => { const d = new Date(iso); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

/**
 * Controlla una somministrazione solo rispetto ai valori che il genitore ha copiato da prescrizione/foglietto.
 * Non propone mai valori. Stessa forma dei risultati di checkDose.
 */
export function checkPlan(entry, log, plan) {
  if (!plan) return [];
  const out = [];
  const at = new Date(entry.at).getTime();
  const same = log.filter((e) => e.id !== entry.id && entryMatchesPlan(e, plan));
  if (plan.intervalH > 0) {
    const last = same.filter((e) => new Date(e.at).getTime() <= at).sort((x, y) => y.at.localeCompare(x.at))[0];
    if (last) {
      const gap = (at - new Date(last.at).getTime()) / H;
      if (gap < plan.intervalH) out.push({ kind: 'planTooSoon', level: 'warn', hours: plan.intervalH, gap });
    }
  }
  if (plan.maxPerDay > 0) {
    const n = 1 + same.filter((e) => { const t = new Date(e.at).getTime(); return t > at - 24 * H && t <= at; }).length;
    if (n > plan.maxPerDay) out.push({ kind: 'planTooMany', level: 'warn', max: plan.maxPerDay, n });
  }
  if (plan.until && localDay(entry.at) > plan.until) out.push({ kind: 'planEnded', level: 'warn', until: plan.until });
  const d = plan.dose;
  if (d && d.amount > 0 && entry.amount && (+entry.amount !== +d.amount || (entry.unit || 'other') !== (d.unit || 'other'))) {
    out.push({ kind: 'planDoseDiff', level: 'info', amount: d.amount, unit: d.unit });
  }
  return out;
}

export function toCsv(rows, header) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [header.map(esc).join(';'), ...rows.map((r) => r.map(esc).join(';'))].join('\n');
}
