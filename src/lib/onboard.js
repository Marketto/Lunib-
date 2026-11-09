// Primo avvio del secondo genitore: stato iniziale costruito dai dati condivisi (file, QR o Drive).
import { mergeData } from './sync.js';

const EMPTY = { kids: [], growth: [], meds: [], medPlans: [], milestones: [], deleted: {} };

/** Unisce i dati ricevuti in uno stato vuoto. Restituisce kids/growth/meds/medPlans/deleted + riepilogo. */
export function initialFromImport(remote) {
  const m = mergeData(EMPTY, remote || {});
  const { kids, growth, meds, medPlans, milestones, deleted } = m;
  return { kids, growth, meds, medPlans, milestones, deleted, summary: { kids: kids.length, names: kids.map((k) => k.name).filter(Boolean), growth: growth.length, meds: meds.length } };
}

/** Dopo la revisione: i bimbi modificati (nome/nascita) + i dati del diario da importare. */
export function finishOnboarding(kids, imported) {
  const clean = kids.map((k) => ({ ...k, name: (k.name || '').trim() }));
  const extra = imported ? { growth: imported.growth, meds: imported.meds, medPlans: imported.medPlans, milestones: imported.milestones, deleted: imported.deleted } : {};
  return { kids: clean, extra };
}
