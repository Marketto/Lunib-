import { describe, it, expect } from 'vitest';
import { parseCsv, parseDate, dateOrderState, guessMapping, buildRecords } from '../src/lib/csv.js';
import { mergeData, exportEncrypted, importEncrypted, encodeQr, decodeQr, buildQuickPayload, syncFromHash, QR_MAX_CHARS } from '../src/lib/sync.js';

describe('csv', () => {
  it('quotes, separators, BOM, CRLF', () => {
    const r = parseCsv('﻿date;note\r\n2025-01-02;"a; ""b"""\r\n');
    expect(r.sep).toBe(';');
    expect(r.rows).toEqual([['date', 'note'], ['2025-01-02', 'a; "b"']]);
    expect(parseCsv('a\tb\n1\t2').sep).toBe('\t');
    expect(parseCsv('"a,b",c\n1,2').rows[0]).toEqual(['a,b', 'c']);
  });
  it('dates', () => {
    expect(parseDate('2025-03-04T10:30:00Z').date).toBe('2025-03-04');
    expect(parseDate('2025-03-04 10:30').time).toBe('10:30');
    expect(parseDate('13/03/2025')).toMatchObject({ date: '2025-03-13', ambiguous: false });
    expect(parseDate('03/13/2025').date).toBe('2025-03-13');
    expect(parseDate('03/04/2025', 'dmy')).toMatchObject({ date: '2025-04-03', ambiguous: true });
    expect(parseDate('03/04/2025', 'mdy').date).toBe('2025-03-04');
    expect(parseDate('31/02/2025')).toBeNull();
    expect(parseDate('4/3/2025 2:05 PM').time).toBe('14:05');
    expect(dateOrderState(['03/04/2025']).ambiguous).toBe(true);
    expect(dateOrderState(['03/04/2025', '25/04/2025'])).toEqual({ ambiguous: false, order: 'dmy' });
  });
  it('auto-guess columns IT/EN/RU', () => {
    expect(guessMapping(['Date', 'Weight', 'Height', 'Head', 'Medication', 'Dose', 'Notes'])).toEqual({ date: 0, weight: 1, height: 2, head: 3, med: 4, dose: 5, note: 6 });
    expect(guessMapping(['Data', 'Peso', 'Lunghezza', 'Circonferenza', 'Farmaco', 'Dose', 'Nota'])).toMatchObject({ date: 0, weight: 1, height: 2, head: 3, med: 4, dose: 5, note: 6 });
    expect(guessMapping(['Дата', 'Вес', 'Рост', 'Голова', 'Лекарство', 'Доза'])).toMatchObject({ date: 0, weight: 1, height: 2, head: 3, med: 4, dose: 5 });
  });
  it('builds records, maps actives, skips duplicates', () => {
    const kid = { id: 'k1', birth: '2025-01-01' };
    const map = { date: 0, weight: 1, height: -1, head: -1, med: 2, dose: 3, note: -1 };
    const rows = [['2025-02-01', '4200', '', ''], ['2025-02-01', '4200', '', ''], ['2025-02-02', '', 'Paracetamolo sciroppo', '5'], ['x', '1', '', ''], ['2025-02-03', '', 'Foo', '']];
    const out = buildRecords(rows, map, { wUnit: 'g', doseUnit: 'ml', kid, names: { paracetamolo: 'Paracetamolo' }, existing: {}, now: '2025-06-01T00:00:00Z' });
    expect(out.growth).toHaveLength(1);
    expect(out.growth[0]).toMatchObject({ weight: 4.2, source: 'import' });
    expect(out.meds[0]).toMatchObject({ active: 'paracetamolo', amount: 5, unit: 'ml', source: 'import' });
    expect(out.meds[1]).toMatchObject({ active: null, name: 'Foo' });
    expect(out.ignored).toMatchObject({ duplicate: 1, noDate: 1 });
    const again = buildRecords(rows, map, { wUnit: 'g', doseUnit: 'ml', kid, existing: { growth: out.growth, meds: out.meds }, now: '2025-06-01T00:00:00Z' });
    expect(again.growth).toHaveLength(0);
  });
});

describe('merge', () => {
  const L = { kids: [{ id: 'a', birth: '2025-01-01', name: 'Mia' }], growth: [{ id: 'g1', kidId: 'a', date: '2025-02-01', weight: 4, updatedAt: '2025-02-01T10:00:00Z' }], meds: [], deleted: {} };
  it('matches by id and takes newer updatedAt', () => {
    const R = { kids: L.kids, growth: [{ id: 'g1', kidId: 'a', date: '2025-02-01', weight: 4.1, updatedAt: '2025-02-02T00:00:00Z' }, { id: 'g2', kidId: 'a', date: '2025-03-01', weight: 5, updatedAt: '2025-03-01T00:00:00Z' }], meds: [] };
    const m = mergeData(L, R);
    expect(m.growth.find((g) => g.id === 'g1').weight).toBe(4.1);
    expect(m.stats).toMatchObject({ addedGrowth: 1, updated: 1 });
    const older = mergeData(L, { kids: L.kids, growth: [{ ...L.growth[0], weight: 9, updatedAt: '2025-01-01T00:00:00Z' }], meds: [] });
    expect(older.growth[0].weight).toBe(4);
    const noStamp = mergeData(L, { kids: L.kids, growth: [{ ...L.growth[0], weight: 9, updatedAt: undefined }], meds: [] });
    expect(noStamp.growth[0].weight).toBe(4);
  });
  it('remaps kid with same birth date, adds unknown kids, never deletes local', () => {
    const R = { kids: [{ id: 'z', birth: '2025-01-01' }, { id: 'n', birth: '2024-05-05', name: 'Leo' }], growth: [{ id: 'g9', kidId: 'z', date: '2025-02-10', weight: 4.5 }], meds: [] };
    const m = mergeData(L, R);
    expect(m.kids.map((k) => k.id)).toEqual(['a', 'n']);
    expect(m.growth.find((g) => g.id === 'g9').kidId).toBe('a');
    expect(mergeData(L, { kids: [], growth: [], meds: [] }).kids).toHaveLength(1);
  });
  it('tombstones drop records and are unioned', () => {
    const R = { kids: L.kids, growth: [], meds: [], deleted: { g1: '2025-02-05T00:00:00Z' } };
    const m = mergeData(L, R);
    expect(m.growth).toHaveLength(0);
    expect(m.deleted.g1).toBeTruthy();
    // tombstone older than the record: record survives
    expect(mergeData(L, { ...R, deleted: { g1: '2025-01-01T00:00:00Z' } }).growth).toHaveLength(1);
    // remote record deleted locally stays deleted
    const m2 = mergeData({ ...L, growth: [], deleted: { g5: '2025-04-01T00:00:00Z' } }, { kids: L.kids, growth: [{ id: 'g5', kidId: 'a', date: '2025-03-01', updatedAt: '2025-03-01T00:00:00Z' }], meds: [] });
    expect(m2.growth).toHaveLength(0);
  });
  it('lists remote doses of the last 24h', () => {
    const now = Date.parse('2025-06-01T12:00:00Z');
    const R = { kids: L.kids, growth: [], meds: [{ id: 'm1', kidId: 'a', at: '2025-06-01T08:00:00Z', name: 'Ibuprofene', active: 'ibuprofene' }, { id: 'm2', kidId: 'a', at: '2025-05-20T08:00:00Z', name: 'X' }] };
    const m = mergeData(L, R, { now });
    expect(m.stats.addedMeds).toBe(2);
    expect(m.stats.recentDoses.map((d) => d.id)).toEqual(['m1']);
  });
});

describe('crypto', () => {
  const state = { kids: [{ id: 'a', birth: '2025-01-01' }], growth: [{ id: 'g1', kidId: 'a', date: '2025-02-01', weight: 4 }], meds: [], deleted: {} };
  it('file round trip and wrong passphrase', async () => {
    const blob = await exportEncrypted(state, 'correct horse', '1.0');
    const env = JSON.parse(await blob.text());
    expect(env).toMatchObject({ format: 'lunibu-sync-enc', v: 1 });
    expect(await blob.text()).not.toContain('2025-02-01');
    const back = await importEncrypted(blob, 'correct horse');
    expect(back).toMatchObject({ format: 'lunibu-sync', v: 1, appVersion: '1.0' });
    expect(back.growth).toEqual(state.growth);
    await expect(importEncrypted(blob, 'wrong pass!!')).rejects.toThrow('bad-pass');
    await expect(importEncrypted('nope', 'x')).rejects.toThrow('bad-file');
  });
  it('QR payload round trip, hash parsing', async () => {
    const now = Date.now();
    const st = { ...state, growth: [{ ...state.growth[0], updatedAt: new Date(now).toISOString() }], meds: [{ id: 'm', kidId: 'a', at: new Date(now).toISOString(), name: 'X', updatedAt: new Date(now).toISOString() }], deleted: { old: '2000-01-01T00:00:00Z', fresh: new Date(now).toISOString() } };
    const p = buildQuickPayload(st, { now });
    expect(Object.keys(p.deleted)).toEqual(['fresh']);
    const { data, tooLarge } = await encodeQr(p, 'passphrase1');
    expect(tooLarge).toBe(false);
    expect(syncFromHash('#sync=' + data)).toBe(data);
    expect(syncFromHash('#card--x')).toBeNull();
    const back = await decodeQr(data, 'passphrase1');
    expect(back.meds[0].id).toBe('m');
    await expect(decodeQr(data, 'badbadbad')).rejects.toThrow('bad-pass');
  });
  it('QR size limit and meds-only fallback', async () => {
    const now = Date.now(), at = new Date(now).toISOString();
    const big = { kids: state.kids, deleted: {}, meds: [], growth: Array.from({ length: 400 }, (_, i) => ({ id: 'gg' + i + Math.random().toString(36).slice(2), kidId: 'a', date: '2025-02-01', weight: 4 + Math.random(), updatedAt: at })) };
    const full = await encodeQr(buildQuickPayload(big, { now }), 'passphrase1');
    expect(full.tooLarge).toBe(true);
    expect(full.length).toBeGreaterThan(QR_MAX_CHARS);
    const medsOnly = await encodeQr(buildQuickPayload(big, { now, medsOnly: true }), 'passphrase1');
    expect(medsOnly.tooLarge).toBe(false);
  });
});
