Tabelle LMS degli standard di crescita OMS (WHO Child Growth Standards 2006, 0–5 anni, per giorno di età) e del
WHO Growth Reference 2007 (5–19 anni, per mese), così come distribuite dall'OMS nei pacchetti ufficiali
`WorldHealthOrganization/anthro` e `WorldHealthOrganization/anthroplus` (cartelle data-raw/growthstandards).
Colonne: sex (1 = maschio, 2 = femmina), age (giorni o mesi), L, M, S [, loh = L sdraiato / H in piedi].
`scripts/build-growth.mjs` le converte in `src/data/growth.json` (mesi 0–144; BMI 24–144).

Origine e licenze: le tabelle sono pubblicate dall'OMS (WHO Child Growth Standards, WHO Growth Reference 2007);
i file sono copiati dai repository ufficiali OMS su GitHub (pacchetti R distribuiti con licenza GPL-3).

Peso per lunghezza e peso per altezza (WHO Child Growth Standards 2006, 0–5 anni): `wflanthro.txt` (lunghezza 45–110 cm,
passo 0,1 cm, bambini sotto i 24 mesi, misurati sdraiati) e `wfhanthro.txt` (altezza 65–120 cm, passo 0,1 cm, dai 24 mesi, in piedi),
dalla stessa cartella `data-raw/growthstandards` di `WorldHealthOrganization/anthro`. Colonne: sex, length/height, L, M, S, lorh.
`build-growth.mjs` le converte in `wfl` e `wfh` di `growth.json`.
