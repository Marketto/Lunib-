// Orchestrazione della sincronizzazione: funzione pura con trasporto iniettato (testabile).
import { exportEncrypted, importEncrypted, mergeData } from './sync.js';

export const MAX_ATTEMPTS = 3;
const byId = (a) => [...(a || [])].sort((x, y) => String(x.id).localeCompare(String(y.id)));
const canon = (d) => JSON.stringify({
  kids: byId(d.kids), growth: byId(d.growth), meds: byId(d.meds),
  deleted: Object.fromEntries(Object.entries(d.deleted || {}).sort(([a], [b]) => a.localeCompare(b)))
});

/** Primo invio: cifra lo stato locale e crea il file. */
export async function createRemote({ transport, name, pass, local, appVersion = '' }) {
  const blob = await exportEncrypted(local, pass, appVersion);
  return transport.createFile(name, blob);
}

/** Scarica, decifra, unisce, ricarica solo se cambia. Errori: 'bad-pass', 'bad-file', 'conflict', più quelli del trasporto. */
export async function syncOnce({ transport, fileId, pass, local, appVersion = '', now = Date.now() }) {
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const { text, version } = await transport.download(fileId);
    const remote = await importEncrypted(text, pass);
    const m = mergeData(local, remote, { now });
    const merged = { kids: m.kids, growth: m.growth, meds: m.meds, deleted: m.deleted };
    if (canon(merged) === canon(remote)) return { merged, stats: m.stats, uploaded: false };
    const blob = await exportEncrypted(merged, pass, appVersion);
    if ((await transport.getVersion(fileId)) !== version) continue; // qualcuno ha scritto nel frattempo
    await transport.upload(fileId, blob);
    return { merged, stats: m.stats, uploaded: true };
  }
  throw new Error('conflict');
}
