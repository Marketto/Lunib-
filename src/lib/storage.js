// Tutto in locale. Nessun dato lascia il dispositivo.
const KEY = 'lunibu:v1';
const OLD_KEY = 'piccoli-passi:v1'; // nome precedente dell'app: migrazione automatica

const DEFAULT = { lang: null, accepted: false, kids: [], activeKid: 0 };

export function loadState() {
  try {
    let raw = localStorage.getItem(KEY);
    if (!raw && localStorage.getItem(OLD_KEY)) {
      raw = localStorage.getItem(OLD_KEY);
      localStorage.setItem(KEY, raw);
      localStorage.removeItem(OLD_KEY);
    }
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : { ...DEFAULT };
  } catch {
    return { ...DEFAULT };
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage non disponibile: l'app funziona comunque in memoria */
  }
}

export function clearState() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

export function guessLang() {
  const l = (typeof navigator !== 'undefined' && navigator.language) || 'it';
  const c = l.toLowerCase();
  return c.startsWith('ru') ? 'ru' : c.startsWith('en') ? 'en' : 'it';
}
