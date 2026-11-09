// Tappe: finestre di età (OMS / CDC / linee guida) e stato di ogni voce. Funzioni pure.
// Dati in content/milestones.json (mesi). Non è uno screening né una diagnosi.
import { monthsAt } from './growth.js';

export const AREAS = ['motor', 'language', 'social', 'feeding', 'sleep', 'toilet', 'dental'];
export const TYPES = ['who-1-99', 'cdc-75pct', 'guideline-range', 'not-before'];

// Regole di avviso per tipo di finestra (modificabili dopo la verifica, senza toccare la UI).
//  who-1-99: ultimo 25% della finestra = nota neutra 'watch'; dopo `to` = 'late'.
//  cdc-75pct: nessun avviso prima di `to`; da `to` in poi = 'late'.
//  guideline-range: promemoria neutri; la nota di ogni voce sta in `item.note` {at, level: tip|talk}.
//  not-before: solo informazione.
export const RULES = {
  'who-1-99': { warnAt: 0.75, lateAfterTo: true },
  'cdc-75pct': { warnAt: null, lateAfterTo: false },   // 'late' già a `to`
  'guideline-range': { warnAt: null, lateAfterTo: true }
};

export const SHOW_AHEAD = 3;   // mesi: mostra le tappe che iniziano entro 3 mesi
export const FADE_AFTER = 12;  // mesi dopo `from` oltre i quali una voce senza `to` non fatta sparisce
export const PAST_AFTER = 3;   // mesi dopo `to` oltre i quali una tappa non fatta va in "Tappe passate" (senza avvisi)
export const PRETERM_CORRECT_UNTIL = 24; // mesi: età corretta per ogni pretermine (AAP, TP13)

/** Età in mesi per le tappe: corretta fino a 24 mesi per ogni nato pretermine (TP13). */
export function ageForMilestones(kid, date) {
  const m = monthsAt(kid.birth, date);
  const w = +kid.gaWeeks;
  if (w && w < 37 && m < PRETERM_CORRECT_UNTIL) return m - ((40 - w) * 7) / 30.4375;
  return m;
}

/** Fine della finestra; senza `to` conta `from`. */
export const endOf = (item) => (item.to != null ? item.to : item.from);

/** Punto di avviso 'watch' in mesi (solo who-1-99; null altrimenti). */
export function warnPoint(item) {
  if (!item.warn || item.to == null) return null;
  const r = RULES[item.type];
  if (!r || r.warnAt == null) return null;
  return item.from + r.warnAt * (item.to - item.from);
}

/** 'done' | 'upcoming' | 'now' | 'watch' | 'tip' | 'late' | 'info' */
export function status(item, months, done = false) {
  if (done) return 'done';
  if (months < item.from) return 'upcoming';
  if (!item.warn) return 'info';
  if (item.to == null) return 'now';
  if (item.note) return months >= item.note.at ? (item.note.level === 'talk' ? 'late' : 'tip') : 'now';
  const r = RULES[item.type];
  if (!r) return 'now';
  if (r.lateAfterTo ? months > item.to : months >= item.to) return 'late';
  const w = warnPoint(item);
  return w != null && months >= w ? 'watch' : 'now';
}

/** Voce da mostrare tra le attive (non fatta): inizia entro 3 mesi e, se ha `to`, non è scaduta da più di 3 mesi. */
export function isRelevant(item, months) {
  if (item.from > months + SHOW_AHEAD) return false;
  return item.to != null ? months <= item.to + PAST_AFTER : months <= item.from + FADE_AFTER;
}

/** Tappa con `to` scaduta da più di 3 mesi: niente avvisi, sezione "Tappe passate". */
export const isPast = (item, months) => item.to != null && months > item.to + PAST_AFTER;

/** Divide le voci in "attive", "passate" (non fatte) e "fatte". `doneIds`: Set di id voce. */
export function split(items, months, doneIds) {
  const done = items.filter((i) => doneIds.has(i.id));
  const rest = items.filter((i) => !doneIds.has(i.id));
  return { active: rest.filter((i) => isRelevant(i, months)), past: rest.filter((i) => isPast(i, months)), done };
}

/** Posizione 0..1 del bimbo nella finestra (limitata). */
export function position(item, months) {
  if (item.to == null || item.to <= item.from) return null;
  return Math.min(1, Math.max(0, (months - item.from) / (item.to - item.from)));
}

export const milestoneKey = (kidId, itemId) => `${kidId}:${itemId}`;
