// Giro delle funzioni: stato (a parte, non sincronizzato) e selezione delle slide da mostrare.
import { TOUR } from '../data/tour.js';

const KEY = 'lunibu:tour';

/** Slide non ancora viste, nell'ordine dei dati. */
export function pendingSlides(seen, slides = TOUR) {
  const s = new Set(seen || []);
  return slides.filter((x) => !s.has(x.id));
}

/** Aggiunge gli id (senza duplicati) a seen. */
export function markSeen(seen, ids) {
  return [...new Set([...(seen || []), ...ids])];
}

/** Confronto semver semplice x.y.z */
export function cmpVer(a, b) {
  const pa = String(a).split('.').map(Number), pb = String(b).split('.').map(Number);
  for (let i = 0; i < 3; i++) { const d = (pa[i] || 0) - (pb[i] || 0); if (d) return d < 0 ? -1 : 1; }
  return 0;
}

export function loadTour() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { seen: Array.isArray(v.seen) ? v.seen : [] };
  } catch { return { seen: [] }; }
}

export function saveTour(t) {
  try { localStorage.setItem(KEY, JSON.stringify({ seen: t.seen })); } catch { /* ignore */ }
}
