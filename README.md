# Lunibù · Лунибу

> ⚠️ **Scarico di responsabilità — leggere prima dell'uso**
>
> Lunibù è **solo un'utility per cercare rapidamente dati** tratti da linee guida (OMS, società scientifiche) e
> studi pubblicati. **Non è un dispositivo medico, non fa diagnosi e non sostituisce in alcun modo pediatri,
> nutrizionisti, logopedisti, psicologi o altri professionisti.** I contenuti possono essere incompleti, semplificati
> o non aggiornati: **approfondisci sempre e verifica le fonti originali** citate in ogni scheda, e per qualsiasi
> dubbio sulla salute di tuo figlio rivolgiti al pediatra. In emergenza chiama il **112**.
>
> *RU:* Lunibù — **лишь инструмент для быстрого поиска данных** из рекомендаций и исследований. Это не медицинское
> изделие и не замена педиатру или другим специалистам. **Всегда проверяйте первоисточники.** В экстренных случаях — **112**.

PoC di un'app per genitori di bambini **0–6 anni**: risposte e consigli basati su linee guida e studi
scientifici revisionati, in **italiano e russo**, che funziona **offline**, senza backend e senza AI.

## Cosa fa

- **Onboarding**: numero di figli, data di nascita, nome facoltativo. Tutto in `localStorage`, nessun dato esce dal dispositivo.
- **Selettore del figlio** nella ricerca (select se più figli) → l'età filtra le schede.
- **Tolleranza ±3 mesi**: misurata dal "compleanno di confine" della fascia.
  Es. 2a10m vede le schede "2 anni" (in fascia) e "3 anni" (fascia vicina); 3a3m vede "3 anni" e "2 anni".
  Logica in `src/lib/age.js`, testata in `tests/age.test.js`.
- **Ricerca offline** (MiniSearch) con stemming leggero IT/RU, sinonimi colloquiali e **indice di pertinenza 0–100%**
  assoluto (dove compare la parola + quanto è esatta), non relativo al primo risultato.
- **Lazy load**: l'indice di una lingua si carica alla prima ricerca; il testo completo di una scheda
  (blocco per categoria) solo quando la si apre. Il service worker mette tutto in cache per l'uso offline.
- **Avviso pediatra**: le schede che parlano di possibili patologie hanno `alert: "pediatra"` o `"urgente"`.
  L'avviso compare **in cima alla scheda prima di ogni altro contenuto**, come badge nei risultati e come
  banner sopra i risultati. Le schede urgenti elencano i segni per chiamare il **112**.
- **Fonti** in fondo a ogni scheda, con link (DOI o pagina ufficiale), tipo di studio e livello di evidenza.
- **Dettagli filtrati per età**: ogni voce di una scheda può avere la sua fascia (`{"t","from","to"}`);
  aprendo una scheda si vedono solo le voci adatte al figlio selezionato (±3 mesi). Le soglie di sicurezza
  (miele, schermi) sono marcate `"strict": true` e non usano la tolleranza.
- **Suoni** (sezione con tab *Per dormire* / *Per giocare*), filtrati per età con la stessa tolleranza:
  rumori bianco/rosa/profondo, grembo materno, shhh, ventilatore, pioggia, onde; ninne nanne in carillon
  (melodie di pubblico dominio: Brahms, "Brilla brilla", "Fra Martino") e musiche originali generative.
  Timer di spegnimento, volume, note di sicurezza con fonti (Spencer 1990, Hugh 2014).
  Tutto è **sintetizzato in tempo reale con Web Audio**: nessun file audio, funziona offline, nessun diritto d'autore.
- **Musica di sottofondo** rilassante attivabile in alto a destra (generativa).
- UI "nursery di carta ritagliata": giostrina della culla animata (si tocca e oscilla), icone in carta,
  modalità notte per i suoni del sonno, transizioni e micro-animazioni con Framer Motion
  (disattivate con *riduci movimento*), frasi motivazionali per tema. Font Literata + Onest (latino e cirillico, inclusi offline).

- **Guide sì / con moderazione / da evitare** per cibi (6–12 mesi, 1–3, 3–6 anni) e giochi (0–12 mesi, 1–3, 3–6):
  ogni voce ha motivo e fonte numerata (sezione `guide` delle schede).
- **Suoni**: una sola traccia alla volta, pulsante Ferma sempre visibile, filtro anti-acuti comune
  (high-shelf −6 dB sopra 3,5 kHz, passa-basso 9 kHz, limitatore) e **volumi normalizzati** sul livello
  pesato A misurato (`?debug` espone le misure). Nuovi suoni: viaggio in auto, asciugacapelli.
- **Installabile** (PWA): icone PNG 192/512/maskable/apple-touch, scheda "Installa" (prompt su Android/Chrome,
  istruzioni su iPhone).
- **Condizioni d'uso e scarico di responsabilità** (`src/lib/terms.js`) con accettazione esplicita al primo avvio
  e nuova accettazione a ogni cambio di versione. ⚠️ Il testo va fatto verificare da un legale prima della pubblicazione.

- **Misura il volume** (sezione Suoni): fonometro con il microfono (pesatura A, AGC/noise suppression disattivati,
  niente registrato). Modalità "al lettino" con un secondo telefono (la più affidabile) e "stima rapida" con un solo
  telefono: sottrae il rumore di fondo, stima il livello alla distanza scelta (inverso del quadrato, coerente con
  Hugh 2014, +3 dB di margine stanza), suggerisce la distanza minima e **abbassa** il volume in automatico (mai alza).
  Calibrazione opzionale con un fonometro o un'app calibrata; senza calibrazione margine di 6 dB (limite 44 invece di 50 dB(A)).

## Comandi

```bash
npm install
npm run dev      # genera indici + avvia in sviluppo
npm run build    # genera indici + build PWA in dist/
npm test         # età, tolleranza, filtri per età nelle schede, soglie strict, stemming, ricerca IT/RU
```

## Contenuti

```
content/
  sources.json          # fonti verificate (id → citazione, url, tipo)
  cards/<categoria>.json # schede con testo it + ru
scripts/build-content.mjs # valida e genera public/data/<lang>/index.json e c/<categoria>.json
```

Ogni scheda:

```json
{
  "id": "febbre", "category": "salute",
  "ageFrom": 0, "ageTo": 48,          // mesi, ageTo escluso
  "alert": "none | pediatra | urgente",
  "evidence": "alta | moderata",
  "sources": ["B1", "B2"],
  "it": { "title", "summary", "keywords", "research", "tips", "redFlags", "urgent" },
  "ru": { ... }
}
```

La build **fallisce** se una scheda non ha fonti, se manca una traduzione, se una fonte non esiste
o se una scheda con `alert` non elenca i segnali d'allarme.

### Criteri di selezione delle fonti (PoC)

Linee guida di enti e società scientifiche (OMS, AAP, NICE, ESPGHAN, EAACI, SIP, EAPD), revisioni sistematiche
e meta-analisi (Cochrane e riviste peer-reviewed), RCT e studi di coorte su riviste indicizzate. Ogni citazione
è stata verificata (esistenza, DOI, dati riportati). Le norme italiane sono citate da Normattiva.

## Limiti noti

- 38 schede: è una PoC, non una copertura completa della letteratura 0–3.
- Le schede non sostituiscono il pediatra; i testi andrebbero rivisti da un pediatra prima della pubblicazione.
- Ricerca lessicale (non semantica): domande molto lontane dalle parole delle schede possono non trovare risultati.


## Giochi

Sezione con giochi adulto-bambino o da proporre al bambino da solo, filtrati per età (±3 mesi), con illustrazioni
"da manuale" (famiglia di orsetti), materiali, passi, perché funziona e fonti. Inclusi solo giochi con riscontri nella
ricerca; il livello di evidenza è dichiarato (forte / media / raccomandato da linee guida / tappa di sviluppo).

## Lavorare al progetto con agenti (Claude Code)

`CLAUDE.md` descrive regole e **router**: ogni operazione va all'agente con il modello/effort adatto
(`.claude/agents/`): ricerca fonti (sonnet), **verifica indipendente obbligatoria dopo ogni trasformazione dei dati
di ricerca** (`evidence-verifier`, opus · high), scrittura e traduzione (sonnet), UI e audio (sonnet), QA e rilascio
(haiku). Le procedure ripetibili sono skill in `.claude/skills/` (`add-content`, `verify-content`, `audio-loudness`,
`release`). Gli hook in `.claude/settings.json` validano i contenuti dopo ogni modifica e bloccano commit con dati
sensibili (`npm run check:secrets`).

## Deploy

Ogni push su `main` esegue `.github/workflows/deploy.yml`: test, build e pubblicazione su **GitHub Pages**
(`base: './'`, funziona in qualsiasi sottocartella). L'app è installabile come PWA dalla pagina pubblicata.
