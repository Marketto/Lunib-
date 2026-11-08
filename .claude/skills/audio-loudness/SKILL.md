---
name: audio-loudness
description: Measure and normalize loudness of Lunibù synthesized tracks (K-weighted) after any change to src/lib/audio. Use when adding or modifying a sound.
---
# Normalizzazione audio

1. `npm run build && npx vite preview --port 4173`
2. Apri `http://localhost:4173/?debug` in Chrome headless (Playwright), per ogni traccia: `__ppAudio.play(id)`,
   attendi 6 s, leggi `__ppAudio.measure()` (rmsDb, aDb, kDb, peak, centroid) su 10 s.
3. Calcola il guadagno per portare ogni traccia a −23 LUFS circa (rumori) / −20 (musica) e aggiorna `NORM` in `engine.js`.
4. Ripeti la misura: tolleranza ±1 dB, picco < −1 dBFS. Il volume predefinito resta 0,35.
