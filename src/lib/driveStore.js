// Stato locale della sincronizzazione Drive: localStorage 'lunibu:drive' = { fileId, pass?, lastSync, remember }.
// Se la frase non è ricordata resta solo in memoria (finché l'app è aperta).
import { syncOnce } from './driveSync.js';
import { transport } from './drive.js';
import { mergeData } from './sync.js';

const KEY = 'lunibu:drive';
export const AUTO_MS = 5 * 60000;
let memPass = null;
let cache;
const subs = new Set();

const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
export const getDrive = () => (cache ||= read());
export function setDrive(patch) {
  cache = patch === null ? {} : { ...getDrive(), ...patch };
  for (const k of Object.keys(cache)) if (cache[k] === undefined) delete cache[k];
  try { Object.keys(cache).length ? localStorage.setItem(KEY, JSON.stringify(cache)) : localStorage.removeItem(KEY); } catch { /* storage pieno/bloccato */ }
  subs.forEach((f) => f());
}
export const subscribe = (f) => { subs.add(f); return () => subs.delete(f); };
export const passOf = () => getDrive().pass || memPass;
export function savePass(pass) {
  memPass = pass;
  setDrive({ pass: getDrive().remember !== false ? pass : undefined });
}
export const forget = () => { memPass = null; setDrive(null); };

let busy = false;
/** Una sincronizzazione alla volta. `latest()` dà lo stato più recente per non perdere modifiche fatte durante la rete. */
export async function runSync({ latest, silent = false, fileId, pass, appVersion = '' }) {
  const d = getDrive();
  fileId ||= d.fileId; pass ||= passOf();
  if (!fileId || !pass) throw new Error('no-pass');
  if (busy) throw new Error('busy');
  busy = true;
  try {
    const r = await syncOnce({ transport: transport({ silent }), fileId, pass, local: latest(), appVersion });
    setDrive({ fileId, lastSync: Date.now() });
    savePass(pass);
    // modifiche locali fatte mentre si aspettava la rete: unione col risultato (le statistiche restano quelle di Drive)
    const m = mergeData(latest(), r.merged);
    return { merged: { kids: m.kids, growth: m.growth, meds: m.meds, medPlans: m.medPlans, milestones: m.milestones, deleted: m.deleted }, stats: r.stats };
  } finally { busy = false; }
}
