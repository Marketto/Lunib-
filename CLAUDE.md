# Lunibù — istruzioni per gli agenti

App PWA per genitori di bambini 0–6 anni (IT/RU), offline, senza backend né AI a runtime.
**È solo un'utility per cercare rapidamente dati tratti dalla ricerca**: ogni contenuto deve rimandare alle fonti
e invitare ad approfondire e verificare.

## Regole d'oro (non negoziabili)

1. **Nessun dato di ricerca senza fonte verificata.** Ogni affermazione nelle schede (`content/cards/*.json`) e nei
   giochi (`content/games.json`) deve citare un id presente in `content/sources.json`.
2. **Verifica dopo ogni trasformazione.** Dopo *qualsiasi* passaggio che crea o modifica dati di ricerca
   (estrazione da paper, sintesi, riscrittura, traduzione, cambio di fasce d'età) si esegue un passaggio di verifica
   indipendente con l'agente `evidence-verifier` (modello affidabile, effort alto). Chi scrive non verifica se stesso.
3. **Linguaggio onesto**: associazione ≠ causa; numeri e fasce d'età come nella fonte; prove deboli dichiarate deboli.
4. **Sicurezza bambini**: soglie di sicurezza (miele < 12 mesi, schermi < 2 anni, frutta secca intera < 5 anni,
   latte crudo < 5 anni, nuoto) sono voci `strict: true` senza tolleranza. Schede su possibili patologie: `alert`.
5. **Mai committare dati sensibili**: niente email personali, token, chiavi, file `.env`. L'unica identità ammessa è
   l'account GitHub del proprietario (autore commit con indirizzo `users.noreply.github.com`).
   Lo script `npm run check:secrets` e gli hook lo controllano.
6. **Disclaimer sempre visibile** (app e README): strumento di ricerca rapida, non sostituisce i professionisti.

## Router: chi fa cosa (modello ed effort per costo/affidabilità)

| Operazione | Agente / skill | Modello · effort | Perché |
|---|---|---|---|
| Cercare paper, linee guida, estrarre citazioni e numeri | `source-researcher` | sonnet · medium | molte ricerche web, serve precisione ma non ragionamento profondo |
| **Verificare** dati, citazioni, testi, traduzioni | `evidence-verifier` | **opus · high** | è il controllo di affidabilità: indipendente e severo |
| Scrivere/aggiornare schede e giochi (IT) dai dati verificati | `content-writer` + skill `add-content` | sonnet · medium | trasformazione guidata da schema |
| Traduzione russa allineata | `translator-ru` | sonnet · medium | fedeltà di significato e numeri |
| UI, animazioni, componenti React | `ui-engineer` | sonnet · medium | codice front-end |
| Motore audio, misure di loudness | `audio-engineer` + skill `audio-loudness` | sonnet · medium | DSP e misure ripetibili |
| Build, test, screenshot, controlli ripetitivi | `qa-runner` | haiku · low | comandi deterministici, basso consumo |
| Commit, push, deploy, controllo segreti | `release-manager` + skill `release` | haiku · low | procedura fissa |

Regole di instradamento:
- Lavoro di una sola riga o un controllo noto → fallo direttamente, senza agenti.
- Ricerca e verifica girano in **parallelo** su temi diversi, mai sulla stessa scheda.
- Ogni agente riceve: obiettivo, file da leggere, formato di output (JSON dove possibile) → risposte brevi = meno token.
- I risultati del verificatore che segnalano "must fix" bloccano il merge finché non sono corretti e ri-verificati.

## Pipeline contenuti (skill `add-content`)

```
source-researcher → evidence-verifier (fonti) → content-writer (IT) → translator-ru
→ npm run content (schema) → evidence-verifier (testo IT+RU vs fonti) → npm test → qa-runner (screenshot)
```

## Comandi

```bash
npm run dev            # sviluppo
npm run content        # valida contenuti e genera indici (fallisce se mancano fonti/traduzioni/fasce)
npm test               # età, tolleranza, filtri, soglie strict, ricerca IT/RU, guide
npm run build          # build PWA in dist/
npm run check:secrets  # cerca email personali, token e chiavi nei file tracciati
```

## Struttura

- `content/cards/<categoria>.json` schede (IT+RU, voci con fasce `from/to`, `strict`, `guide`)
- `content/games.json` giochi con livello di evidenza (`forte|media|raccomandato|tappa`)
- `content/sources.json` fonti verificate (id → citazione, URL, tipo)
- `src/lib/` età, ricerca, i18n, audio (`audio/engine.js`, `audio/realistic.js`, `audio/meter.js`)
- `src/components/` UI (Paper, Characters, Scenes, Views, Sounds, Games, VolumeCheck, Terms)
- `scripts/` build contenuti, controlli, hook
- `.claude/agents/`, `.claude/skills/` configurazione agentica
