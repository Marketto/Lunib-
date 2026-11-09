import { describe, it, expect } from 'vitest';
import { syncOnce, createRemote } from '../src/lib/driveSync.js';

const NOW = Date.parse('2026-11-09T12:00:00Z');
const iso = (h) => new Date(NOW - h * 3600000).toISOString();
const kid = { id: 'k1', birth: '2025-01-10', name: 'Mia' };
const med = (id, h, extra = {}) => ({ id, kidId: 'k1', name: 'Paracetamolo', at: iso(h), amount: 5, unit: 'ml', updatedAt: iso(h), ...extra });
const st = (meds = []) => ({ kids: [kid], growth: [], meds, deleted: {} });

function fakeDrive() {
  const f = { text: null, version: 0, uploads: 0, beforeUpload: null };
  f.transport = {
    async createFile(name, blob) { f.text = await blob.text(); f.version = 1; return { id: 'F1', version: '1' }; },
    async download() { return { text: f.text, version: String(f.version) }; },
    async getVersion() { return String(f.version); },
    async upload(id, blob) { f.beforeUpload?.(); f.text = await blob.text(); f.version++; f.uploads++; return { version: String(f.version) }; }
  };
  return f;
}
const PASS = 'frase-segreta-1';

describe('drive sync', () => {
  it('first sync creates the file and merges', async () => {
    const d = fakeDrive();
    const { id } = await createRemote({ transport: d.transport, name: 'x.lunibu', pass: PASS, local: st([med('a', 2)]) });
    const r = await syncOnce({ transport: d.transport, fileId: id, pass: PASS, local: st([med('b', 1)]), now: NOW });
    expect(r.merged.meds.map((m) => m.id).sort()).toEqual(['a', 'b']);
    expect(r.stats.addedMeds).toBe(1);
    expect(r.stats.recentDoses.map((x) => x.id)).toEqual(['a']);
    expect(r.uploaded).toBe(true);
  });

  it('two devices alternate and converge', async () => {
    const d = fakeDrive();
    let A = st([med('a', 5)]), B = st([med('b', 4)]);
    await createRemote({ transport: d.transport, name: 'x', pass: PASS, local: A });
    const run = async (local) => (await syncOnce({ transport: d.transport, fileId: 'F1', pass: PASS, local, now: NOW })).merged;
    B = await run(B);
    A = await run(A);
    A = { ...A, meds: [...A.meds, med('c', 1)] };
    A = await run(A);
    B = await run(B);
    expect(B.meds.map((m) => m.id).sort()).toEqual(['a', 'b', 'c']);
    expect(A.meds.map((m) => m.id).sort()).toEqual(['a', 'b', 'c']);
  });

  it('a concurrent version change triggers a retry that keeps both changes', async () => {
    const d = fakeDrive();
    await createRemote({ transport: d.transport, name: 'x', pass: PASS, local: st([med('a', 5)]) });
    let downloads = 0;
    const t = { ...d.transport, async download(id) { downloads++; return d.transport.download(id); } };
    let once = true;
    // l'altro genitore scrive dopo il nostro download, prima del nostro upload
    const getV = t.getVersion;
    t.getVersion = async (id) => {
      if (once) { once = false; const o = fakeDrive(); await createRemote({ transport: o.transport, name: 'y', pass: PASS, local: st([med('a', 5), med('z', 2)]) }); d.text = o.text; d.version++; }
      return getV(id);
    };
    const r = await syncOnce({ transport: t, fileId: 'F1', pass: PASS, local: st([med('b', 1)]), now: NOW });
    expect(downloads).toBe(2);
    expect(r.merged.meds.map((m) => m.id).sort()).toEqual(['a', 'b', 'z']);
    expect(d.uploads).toBe(1);
  });

  it('gives up with conflict after 3 attempts', async () => {
    const d = fakeDrive();
    await createRemote({ transport: d.transport, name: 'x', pass: PASS, local: st([med('a', 5)]) });
    const t = { ...d.transport, getVersion: async () => 'changed-' + Math.random() };
    await expect(syncOnce({ transport: t, fileId: 'F1', pass: PASS, local: st([med('b', 1)]), now: NOW })).rejects.toThrow('conflict');
    expect(d.uploads).toBe(0);
  });

  it('wrong passphrase gives an error', async () => {
    const d = fakeDrive();
    await createRemote({ transport: d.transport, name: 'x', pass: PASS, local: st() });
    await expect(syncOnce({ transport: d.transport, fileId: 'F1', pass: 'sbagliata-123', local: st() })).rejects.toThrow('bad-pass');
    expect(d.uploads).toBe(0);
  });

  it('does not upload when nothing changed', async () => {
    const d = fakeDrive();
    const s = st([med('a', 2)]);
    await createRemote({ transport: d.transport, name: 'x', pass: PASS, local: s });
    const r = await syncOnce({ transport: d.transport, fileId: 'F1', pass: PASS, local: s, now: NOW });
    expect(r.uploaded).toBe(false);
    expect(d.uploads).toBe(0);
    expect(r.stats.recentDoses).toEqual([]);
  });
});
