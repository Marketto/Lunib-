// Aggiornamento automatico della PWA.
// La nuova versione si scarica in background; si applica da sola quando l'app va in secondo piano
// (così non si perde un modulo a metà) oppure subito con "Aggiorna ora".
import { registerSW } from 'virtual:pwa-register';

export const VERSION = __APP_VERSION__;
export const BUILD = __APP_BUILD__;
export const BUILD_DATE = __APP_DATE__;
const KEY = 'lunibu:version';
const CHECK_EVERY = 30 * 60 * 1000;

let listeners = new Set();
let state = { ready: false, justUpdated: null };
const emit = () => listeners.forEach((f) => f(state));
export const onUpdate = (f) => { listeners.add(f); f(state); return () => listeners.delete(f); };

let apply = null;
export function applyUpdate() { if (apply) apply(true); }

export function initUpdates() {
  // dopo un aggiornamento: mostra "aggiornata alla versione …"
  try {
    const prev = localStorage.getItem(KEY);
    const now = `${VERSION}+${BUILD}`;
    if (prev && prev !== now) state = { ...state, justUpdated: { from: prev.split('+')[0], to: VERSION } };
    localStorage.setItem(KEY, now);
  } catch {}
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) return;
  apply = registerSW({
    immediate: true,
    onNeedRefresh() {
      state = { ...state, ready: true }; emit();
    },
    onRegisteredSW(_url, reg) {
      if (!reg) return;
      const check = () => { if (navigator.onLine) reg.update().catch(() => {}); };
      setInterval(check, CHECK_EVERY);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check();
        else if (state.ready) apply(true); // l'utente non sta guardando: aggiorna ora
      });
    }
  });
}

export const dismissUpdated = () => { state = { ...state, justUpdated: null }; emit(); };
