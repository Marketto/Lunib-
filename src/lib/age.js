// Età in mesi compiuti e confronto con le fasce delle schede.
// Convenzione delle schede: ageFrom incluso, ageTo escluso (mesi).
// Es. "2 anni" = 24–36, "3 anni" = 36–48.

export const TOLERANCE_MONTHS = 3;

export function ageInMonths(birthISO, today = new Date()) {
  const b = new Date(birthISO + 'T00:00:00');
  if (Number.isNaN(b.getTime())) return null;
  let m = (today.getFullYear() - b.getFullYear()) * 12 + (today.getMonth() - b.getMonth());
  if (today.getDate() < b.getDate()) m -= 1;
  return Math.max(0, m);
}

export function ageInDays(birthISO, today = new Date()) {
  const b = new Date(birthISO + 'T00:00:00');
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.max(0, Math.round((t - b) / 86400000));
}

/**
 * 'in'   → l'età è dentro la fascia della scheda
 * 'near' → fuori fascia ma entro la tolleranza (±3 mesi): il bimbo sta entrando o uscendo
 * null   → non pertinente per età
 *
 * Esempi: 34 mesi (2a10m) → fascia 24–36 'in', fascia 36–48 'near'.
 *         39 mesi (3a3m)  → fascia 36–48 'in', fascia 24–36 'near'.
 */
export function ageMatch(months, from, to, tol = TOLERANCE_MONTHS) {
  if (months == null) return 'in';
  if (months >= from && months < to) return 'in';
  // La tolleranza si misura dal confine della fascia (compleanno):
  // fascia 24–36 → vicini da 21 a 39 mesi compiuti.
  if (months >= from - tol && months <= to + tol) return 'near';
  return null;
}

export function formatAge(birthISO, lang, today = new Date()) {
  const m = ageInMonths(birthISO, today);
  if (m == null) return '';
  if (m < 2) {
    const w = Math.floor(ageInDays(birthISO, today) / 7);
    if (lang === 'ru') return `${w} ${plRu(w, 'неделя', 'недели', 'недель')}`;
    return `${w} ${w === 1 ? 'settimana' : 'settimane'}`;
  }
  const y = Math.floor(m / 12);
  const r = m % 12;
  if (lang === 'ru') {
    const ys = y ? `${y} ${plRu(y, 'год', 'года', 'лет')}` : '';
    const ms = r ? `${r} ${plRu(r, 'месяц', 'месяца', 'месяцев')}` : '';
    return [ys, ms].filter(Boolean).join(' ');
  }
  const ys = y ? `${y} ${y === 1 ? 'anno' : 'anni'}` : '';
  const ms = r ? `${r} ${r === 1 ? 'mese' : 'mesi'}` : '';
  return [ys, ms].filter(Boolean).join(' e ');
}

export function formatRange(from, to, lang) {
  const f = (n) => {
    if (n % 12 === 0 && n > 0) {
      const y = n / 12;
      return lang === 'ru' ? `${y} ${plRu(y, 'год', 'года', 'лет')}` : `${y} ${y === 1 ? 'anno' : 'anni'}`;
    }
    return lang === 'ru' ? `${n} мес.` : `${n} mesi`;
  };
  if (from === 0) return lang === 'ru' ? `0 – ${f(to)}` : `0 – ${f(to)}`;
  return `${f(from)} – ${f(to)}`;
}

export function plRu(n, one, few, many) {
  const a = n % 10, b = n % 100;
  if (a === 1 && b !== 11) return one;
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return few;
  return many;
}

// Voci di una scheda filtrate per età (tolleranza ±3 mesi).
// Una voce stringa vale per tutta la fascia della scheda; {t, from, to} solo per la sua fascia.
export function filterByAge(items, months) {
  return (items || [])
    .map((x) => (typeof x === 'string' ? { t: x } : x))
    // strict: soglie di sicurezza (es. miele, schermi) senza tolleranza
    .map((x) => ({ ...x, match: x.from == null ? 'in' : ageMatch(months, x.from, x.to, x.strict ? 0 : TOLERANCE_MONTHS) }))
    .filter((x) => x.match);
}
