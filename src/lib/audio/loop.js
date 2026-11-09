// Funzioni pure per i loop pre-renderizzati: nessuna dipendenza dal browser (testabili in Node).

// Ricava un loop senza giunzione da un rendering di lunghezza (len + xfade) campioni per canale.
// - periodic: il contenuto si ripete esattamente ogni `len` campioni (melodie): basta ritagliare
//   la finestra [xfade, xfade + len), perché l'ultimo campione precede naturalmente il primo.
// - altrimenti: dissolvenza a potenza costante tra l'inizio e la coda renderizzata oltre `len`.
export function makeLoop(channels, len, xfade, periodic = false) {
  return channels.map((r) => {
    const out = new Float32Array(len);
    if (periodic) {
      out.set(r.subarray(xfade, xfade + len));
      return out;
    }
    out.set(r.subarray(0, len));
    for (let i = 0; i < xfade; i++) {
      const a = (i / xfade) * (Math.PI / 2);
      out[i] = r[i] * Math.sin(a) + r[len + i] * Math.cos(a); // a=0: solo la coda; a=pi/2: solo l'inizio
    }
    return out;
  });
}

// PCM 16 bit little-endian in un contenitore WAV
export function encodeWav(channels, sampleRate) {
  const nch = channels.length;
  const n = channels[0].length;
  const buf = new ArrayBuffer(44 + n * nch * 2);
  const v = new DataView(buf);
  const str = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); v.setUint32(4, 36 + n * nch * 2, true); str(8, 'WAVE'); str(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, nch, true);
  v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * nch * 2, true);
  v.setUint16(32, nch * 2, true); v.setUint16(34, 16, true); str(36, 'data'); v.setUint32(40, n * nch * 2, true);
  let o = 44;
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < nch; c++) {
      const s = Math.max(-1, Math.min(1, channels[c][i]));
      v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      o += 2;
    }
  }
  return buf;
}

// Inviluppo RMS (un valore ogni `hop` secondi) per le animazioni, senza analizzatore
export function envelope(channels, sampleRate, hop = 0.05) {
  const step = Math.max(1, Math.round(sampleRate * hop));
  const n = Math.ceil(channels[0].length / step);
  const env = new Float32Array(n);
  for (let k = 0; k < n; k++) {
    let ss = 0, cnt = 0;
    const end = Math.min(channels[0].length, (k + 1) * step);
    for (const ch of channels) for (let i = k * step; i < end; i++) { ss += ch[i] * ch[i]; cnt++; }
    env[k] = Math.sqrt(ss / Math.max(cnt, 1));
  }
  return env;
}
