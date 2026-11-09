import { describe, it, expect } from 'vitest';
import { makeLoop, encodeWav, envelope } from '../src/lib/audio/loop.js';

describe('loop pre-renderizzati', () => {
  it('giunzione continua: periodico = finestra ritagliata, il campione dopo l\'ultimo è il primo', () => {
    const P = 100, D = 300, X = 60;
    const r = new Float32Array(D + X).map((_, i) => Math.sin((2 * Math.PI * i) / P));
    const [o] = makeLoop([r], D, X, true);
    expect(o.length).toBe(D);
    const next = Math.sin((2 * Math.PI * (X + D)) / P); // ciò che seguirebbe l'ultimo campione
    expect(Math.abs(next - o[0])).toBeLessThan(1e-5);
  });

  it('non periodico: dissolvenza a potenza costante, l\'ultimo campione precede la coda', () => {
    const D = 1000, X = 200;
    const r = new Float32Array(D + X).map(() => Math.random() * 2 - 1);
    const [o] = makeLoop([r], D, X, false);
    expect(o.length).toBe(D);
    expect(o[0]).toBeCloseTo(r[D], 6);          // si riparte dalla coda...
    expect(o[D - 1]).toBeCloseTo(r[D - 1], 6);  // ...che continua l'ultimo campione
    expect(o[X]).toBeCloseTo(r[X], 6);          // dopo la dissolvenza è il rendering originale
  });

  it('WAV 16 bit valido e inviluppo', () => {
    const ch = [new Float32Array([0, 0.5, -0.5, 1.5]), new Float32Array([0, 0, 0, 0])];
    const buf = encodeWav(ch, 8000);
    const v = new DataView(buf);
    expect(String.fromCharCode(v.getUint8(0), v.getUint8(1), v.getUint8(2), v.getUint8(3))).toBe('RIFF');
    expect(buf.byteLength).toBe(44 + 4 * 2 * 2);
    expect(v.getInt16(44 + 2 * 2, true)).toBeGreaterThan(16000); // 0,5 canale sinistro, secondo frame
    expect(v.getInt16(44 + 3 * 4, true)).toBe(32767);            // clipping a 1,0
    const env = envelope([new Float32Array(8000).fill(0.5)], 8000, 0.5);
    expect(env.length).toBe(2);
    expect(env[0]).toBeCloseTo(0.5, 5);
  });
});
