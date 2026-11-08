// Fonometro (stima) con il microfono del telefono: livello pesato A, tutto in locale.
// Niente viene registrato né salvato: si analizza il segnale in tempo reale e si butta.
//
// Limite fisico: nel browser il microfono non è calibrato in dB SPL. Serve un "offset" che
// converte dBFS → dB(A). Senza calibrazione usiamo un valore tipico e un margine di sicurezza.
import { getContext } from './engine.js';

export const DEFAULT_OFFSET = 110; // stima tipica; ±10 dB tra modelli diversi
export const TARGET_DBA = 50;      // limite raccomandato per i neonati nei reparti (Hugh 2014)
export const UNCAL_MARGIN = 6;     // margine prudenziale se non calibrato

function aWeight(f) {
  const f2 = f * f;
  const r = (12194 ** 2 * f2 * f2) / ((f2 + 20.6 ** 2) * Math.sqrt((f2 + 107.7 ** 2) * (f2 + 737.9 ** 2)) * (f2 + 12194 ** 2));
  return r * r * 1.2589;
}

let stream = null;
let src = null;
let an = null;
let weights = null;

export async function startMic() {
  const ctx = getContext();
  stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
  });
  src = ctx.createMediaStreamSource(stream);
  an = ctx.createAnalyser();
  an.fftSize = 4096;
  an.smoothingTimeConstant = 0;
  src.connect(an); // non collegato all'uscita: nessun ritorno nell'altoparlante
  weights = new Float32Array(an.frequencyBinCount);
  for (let i = 0; i < weights.length; i++) weights[i] = aWeight((i * ctx.sampleRate) / an.fftSize);
}

export function stopMic() {
  try { src?.disconnect(); } catch { /* */ }
  stream?.getTracks().forEach((t) => t.stop());
  stream = src = an = null;
}

// livello istantaneo pesato A in dBFS (scala del microfono)
export function readDbfsA() {
  if (!an) return null;
  const n = an.frequencyBinCount;
  const f = new Float32Array(n);
  an.getFloatFrequencyData(f);
  let p = 0;
  for (let i = 1; i < n; i++) p += Math.pow(10, f[i] / 10) * weights[i];
  // normalizzazione approssimata della FFT (finestra di Blackman, somma dei bin)
  return 10 * Math.log10(p + 1e-20) - 10 * Math.log10(an.fftSize / 2) + 6;
}

// media energetica (Leq) su un intervallo
export function measureLeq(ms, onTick) {
  return new Promise((resolve) => {
    const vals = [];
    const t0 = performance.now();
    const step = () => {
      const v = readDbfsA();
      if (v != null && Number.isFinite(v)) vals.push(v);
      onTick?.(v, (performance.now() - t0) / ms);
      if (performance.now() - t0 < ms) setTimeout(step, 100);
      else resolve(10 * Math.log10(vals.reduce((a, x) => a + Math.pow(10, x / 10), 0) / Math.max(vals.length, 1)));
    };
    step();
  });
}

// Stima a distanza con un solo telefono: il microfono è a pochi cm dall'altoparlante.
// Campo diretto, legge dell'inverso del quadrato (−6 dB per raddoppio di distanza),
// coerente con le misure di Hugh 2014 (79 → 71 → 63 dB(A) a 30, 100, 200 cm),
// più un margine per il riverbero della stanza.
export const MIC_DISTANCE_M = 0.1;
export const ROOM_MARGIN = 3;

export function levelAt(nearDbA, d) {
  return nearDbA - 20 * Math.log10(d / MIC_DISTANCE_M) + ROOM_MARGIN;
}

export function minDistanceFor(nearDbA, target) {
  return MIC_DISTANCE_M * Math.pow(10, (nearDbA + ROOM_MARGIN - target) / 20);
}
