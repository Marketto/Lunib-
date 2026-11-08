---
name: verify-content
description: Run an independent evidence check on changed content files (cards, games, sources) using the evidence-verifier agent. Use after any edit to content/.
---
# Verifica indipendente

1. Elenca i file/elementi cambiati: `git diff --name-only -- content/` e gli id toccati.
2. Lancia l'agente `evidence-verifier` passando SOLO gli id cambiati e i percorsi dei file (non incollare il contenuto:
   meno token). Chiedi l'output: problema → correzione IT/RU → URL.
3. Applica i "must fix" e i "minor fixes" condivisibili; poi `npm run content && npm test`.
4. Se le correzioni hanno cambiato dati di ricerca, ripeti la verifica sugli elementi corretti.
