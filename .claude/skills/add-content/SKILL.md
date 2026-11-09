---
name: add-content
description: Add or update an evidence-based card (content/cards) or game (content/games.json) in Lunibù, with mandatory independent verification. Use whenever research data is created or changed.
---
# Aggiungere/aggiornare contenuti

1. **Fonti** → agente `source-researcher` (sonnet): restituisce record JSON con citazione, DOI/URL, età, risultati.
2. **Verifica fonti** → agente `evidence-verifier` (opus, high): conferma esistenza, numeri, età. Scarta i "must fix".
3. Aggiungi le fonti a `content/sources.json` (id univoco, `type`: guideline|meta|review|rct|cohort|study).
4. **Scrittura IT** → agente `content-writer`: schema delle schede esistenti; voci per età `{"t","from","to"}`;
   soglie di sicurezza `"strict": true`; possibili patologie → campo `alert`.
5. **Traduzione** → agente `translator-ru`.
6. `npm run content` (schema, fonti, allineamento it/ru, fasce 0–144 mesi).
7. **Verifica testo** → `evidence-verifier` su IT+RU contro le fonti. Applica le correzioni e ripeti 6–7 finché OK.
8. `npm test` e screenshot con `qa-runner`.

Regola: ogni trasformazione dei dati (anche solo riformulare o cambiare una fascia d'età) richiede il passo 7.
