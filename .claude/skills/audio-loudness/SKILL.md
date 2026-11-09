---
name: audio-loudness
description: Measure and normalize loudness of Lunibù synthesized tracks (K-weighted) after any change to src/lib/audio. Use when adding or modifying a sound.
---
# Normalizzazione audio

1. `npm run build && npx vite preview --port 4173`
2. I suoni sono file pre-renderizzati: dopo ogni modifica a `src/lib/audio/` o a `NORM` esegui `npm run audio:render`
   (Chromium + ffmpeg; scrive `public/audio/*.m4a`, AAC 96 kbps, e `env.json`) e ricommitta i file. Con `AUDIO_KEEP_WAV=<dir>`
   conserva i WAV: confronta i LUFS (`ffmpeg -i f -af ebur128 -f null -`) di WAV e m4a, scarto ammesso < 0,5 dB.
   Apri `http://localhost:4173/?debug` in Chrome headless (Playwright), per ogni traccia: `__ppAudio.play(id)`,
   attendi 4–6 s (si misura il file decodificato, passa dal grafo Web Audio), leggi `__ppAudio.measure()` (rmsDb, aDb, kDb, peak, centroid) mediando almeno 30 s: nei suoni con eventi
   casuali (onde, pioggia, auto) 10 s non bastano. In `?debug` l'audio passa dal grafo Web Audio (analizzatore).
   `NORM` è incorporato nel rendering: il file ha già il livello finale (cambiare NORM richiede `audio:render`).
3. Calcola il guadagno per portare ogni traccia a −23 LUFS circa (rumori) / −20 (musica) e aggiorna `NORM` in `engine.js`.
4. Ripeti la misura: tolleranza ±1 dB, picco < −1 dBFS. Il volume predefinito resta 0,35.

5. Il rendering usa lo stesso sample rate del contesto live (rumori e filtri ne dipendono): non cambiarlo senza rimisurare tutto.
