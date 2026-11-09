import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KidPills, Refs, spring, tap } from './Common.jsx';
import { Character } from './Characters.jsx';
import { INDICATORS, INPUTS, bmiOf, GROWTH_SOURCES, assess, assessWfl, wflType, wflCurve, WFL_MAX_MONTHS, estimateHeight, dropWeightHigh, GROWTH_RULES, isCorrected, curve, lmsAt, monthsAt, growthAge, zScore, newbornCheck, adjustHeight } from '../lib/growth.js';
import { ACTIVE, MED_SOURCES, checkDose, checkPlan, filterLog, findPlan, latestWeight, medKey, normName, planKey, toCsv, toMg, vitDDayTotal, vitDLimit } from '../lib/meds.js';
import { MILESTONE_TEXT } from '../lib/i18n.js';
import { formatAge } from '../lib/age.js';
import Milestones from './Milestones.jsx';
import ImportCsv, { IMPORT_BTN } from './ImportCsv.jsx';
import SOURCES from '../../content/sources.json';

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const today = () => new Date().toISOString().slice(0, 10);
const nowLocal = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };
const fmt = (n, d = 1) => (n == null || isNaN(n) ? '–' : Number(n).toLocaleString(undefined, { maximumFractionDigits: d }));

export const DIARY_TEXT = {
  it: {
    title: 'Diario', sub: 'Crescita e medicine, solo sul tuo telefono.',
    tabGrowth: 'Crescita', tabMeds: 'Medicine',
    weight: 'Peso', height: 'Altezza', head: 'Testa', bmi: 'BMI',
    heightLong: (m) => (m < 24 ? 'Lunghezza (sdraiato)' : 'Altezza (in piedi)'), headLong: 'Circonferenza cranica',
    sexAsk: 'Per confrontare con le curve OMS serve sapere se è…', boy: 'un bimbo', girl: 'una bimba',
    pretermQ: 'Nato pretermine?', preterm: 'Settimane di gestazione alla nascita (per l\'età corretta)',
    pretermNote: (w) => `Uso l'età corretta (nato a ${w} settimane) fino a ${w < 32 ? '2 anni' : '1 anno'}.`,
    add: 'Aggiungi misura', date: 'Data', save: 'Salva', cancel: 'Annulla', del: 'Elimina', none: 'Ancora nessuna misura.',
    pct: (p) => `${p < 1 ? '<1' : p > 99 ? '>99' : Math.round(p)}° percentile`,
    chartNote: 'Linee: percentili OMS 3, 15, 50, 85, 97. Punti: le tue misure.',
    over: (max) => `Le curve OMS di questo indicatore sono usate fino a ${max} mesi.`,
    w: {
      implausible: 'Valore molto improbabile per l\'età: controlla di averlo inserito bene (unità, virgola, data). Se il valore è giusto, parlane presto con il pediatra.',
      standingEarly: 'Sotto i 9 mesi la misura "in piedi" è quasi sempre un errore di inserimento: si misura sdraiato.',
      tall: 'Molto più alto della media (oltre +3 DS): per l\'OMS raramente è un problema, ma è bene che il pediatra lo sappia.',
      weightHigh: 'Peso per età sopra +2 DS. Il peso per età non serve a dire se c\'è sovrappeso: l\'OMS lo valuta con il peso rispetto alla lunghezza/altezza (o il BMI). Inserisci la lunghezza/altezza misurata lo stesso giorno.',
      weightVeryHigh: 'Peso per età sopra +3 DS. Il peso per età non serve a dire se c\'è sovrappeso: l\'OMS lo valuta con il peso rispetto alla lunghezza/altezza (o il BMI). Inserisci la lunghezza/altezza misurata lo stesso giorno.',
      wflOverweight: 'Il peso rispetto alla lunghezza/altezza è sopra +2 DS: secondo i criteri OMS per i bambini sotto i 5 anni rientra nel sovrappeso. Non è una diagnosi: parlane con il pediatra.',
      wflObese: 'Il peso rispetto alla lunghezza/altezza è sopra +3 DS: secondo i criteri OMS per i bambini sotto i 5 anni rientra nell\'obesità. Non è una diagnosi né una colpa: parlane con il pediatra.',
      wflRisk: 'Il peso rispetto alla lunghezza/altezza è sopra +1 DS: per l\'OMS è un possibile rischio di sovrappeso, da seguire nel tempo (conta soprattutto se la curva sale verso +2 DS).',
      wflWasting: 'Il peso rispetto alla lunghezza/altezza è sotto −2 DS: secondo i criteri OMS indica deperimento (peso basso per la lunghezza). Ricontrolla le misure e parlane con il pediatra.',
      wflSevereWasting: 'Il peso rispetto alla lunghezza/altezza è sotto −3 DS: secondo i criteri OMS indica deperimento grave. Se la misura è corretta, contatta presto il pediatra.',
      bmiEstimatedOut: 'BMI stimato fuori dall\'intervallo tipico: per una valutazione misura peso e altezza lo stesso giorno.',
      bmiOverweight: 'Il BMI per l\'età è sopra +1 DS: secondo i criteri OMS rientra nel sovrappeso. Non è una diagnosi: parlane con il pediatra, che valuta crescita e abitudini nel complesso.',
      bmiObese: 'Il BMI per l\'età è sopra +2 DS: secondo i criteri OMS rientra nell\'obesità. Non è una diagnosi né una colpa: parlane con il pediatra, che valuta crescita e abitudini nel complesso.',
      bmiThin: 'Il BMI per l\'età è sotto −2 DS: secondo i criteri OMS rientra nella magrezza. Non è una diagnosi: parlane con il pediatra, che valuta crescita e abitudini nel complesso.',
      bmiVeryThin: 'Il BMI per l\'età è sotto −3 DS: secondo i criteri OMS è una magrezza marcata. Non è una diagnosi, ma è bene parlarne presto con il pediatra.',
      veryLow: 'Molto sotto i valori tipici per l\'età secondo l\'OMS (sotto −3 DS).',
      low: 'Sotto i valori tipici per l\'età secondo l\'OMS (sotto −2 DS).',
      below04: 'Sotto lo 0,4° percentile: è consigliata una valutazione del pediatra anche se la crescita è regolare.',
      headHigh: 'Circonferenza della testa sopra i valori tipici (oltre +2 DS). Spesso è familiare: utile confrontarla con quella dei genitori.',
      headVeryHigh: 'Circonferenza della testa molto sopra i valori tipici (oltre +3 DS).',
      headLow: 'Circonferenza della testa sotto i valori tipici (sotto −2 DS).',
      headVeryLow: 'Circonferenza della testa molto sotto i valori tipici (sotto −3 DS).',
      crossDown: (w) => `Rispetto alle misure precedenti è sceso di almeno ${w.spaces === 1 ? 'una "corsia"' : `${w.spaces} "corsie"`} di percentile.${w.ind === 'weight' ? ' Se si conferma alla prossima misura (dopo 2–3 settimane), parlane con il pediatra; una malattia recente può far calare il peso per poco tempo.' : ' Parlane con il pediatra.'}`,
      crossUp: 'Rispetto alle misure precedenti è salito di almeno due "corsie" di percentile.',
      newbornLoss: (w) => `Calo di circa il ${w.pct}% rispetto al peso alla nascita: oltre il 10% va valutato.`,
      notRegained: 'A 3 settimane non ha ancora recuperato il peso alla nascita: va valutato.'
    },
    beforeTerm: 'Prima del termine corretto (40 settimane) le curve OMS non si applicano: il pediatra usa curve specifiche per i pretermine.',
    noWfl: 'Il peso per età da solo non dice se è magro o in sovrappeso. Sotto i 5 anni l\'OMS usa il peso rispetto a lunghezza/altezza, che Lunibù calcola dalle misure fatte lo stesso giorno (scheda Peso/lunghezza); le soglie del BMI valgono dai 5 anni.',
    wfl: 'Peso/lunghezza', wflLong: (m) => (m < 24 ? 'Peso per lunghezza' : 'Peso per altezza'),
    wflNote: 'Calcolato solo da peso e lunghezza/altezza misurati lo stesso giorno (OMS 0–5 anni). Linee: percentili 3, 15, 50, 85, 97; asse orizzontale: cm.',
    bmiEst: 'BMI stimato', bmiEstLegend: 'Cerchio vuoto tratteggiato: BMI stimato (solo posizione, senza soglie).',
    bmiEstText: (d, d1, d2) => `BMI stimato: peso del ${d} con altezza stimata ${d2 ? `dalle misure del ${d1} e ${d2}` : `dalla misura del ${d1}`}. Non è una misura: per una valutazione misura peso e lunghezza/altezza lo stesso giorno.`,
    over10: 'Dopo i 10 anni l\'OMS usa l\'indice di massa corporea invece del peso per età.',
    bmiNote: 'BMI = peso (kg) ÷ altezza (m)², calcolato da peso e altezza della stessa misura. Da 2 a 5 anni Lunibù mostra solo la posizione sulle curve OMS: sotto i 5 anni l\'OMS usa il peso rispetto a lunghezza/altezza (scheda Peso/lunghezza); dai 5 anni segnala anche le soglie OMS del BMI (sopra +1 DS, sotto −2 DS), senza dare una diagnosi: per interpretarlo chiedi al pediatra. Quando peso e altezza sono misurati in giorni diversi, Lunibù stima l\'altezza dalle misure vicine (scelta prudenziale di Lunibù, ispirata a Bailey 2013, che stimava l\'altezza dalle visite vicine) e mostra il BMI stimato solo come posizione.',
    pos: 'Come è stato misurato', lying: 'sdraiato', standing: 'in piedi',
    wFoot: 'Non è una diagnosi: una misura isolata può essere imprecisa. Ricontrolla come hai misurato e parlane con il pediatra.',
    measureTips: 'Pesa senza vestiti (o con il body), sempre con la stessa bilancia. Sotto i 2 anni la lunghezza si misura sdraiato, poi in piedi senza scarpe. La testa: metro morbido sopra sopracciglia e orecchie, nel punto più largo.',
    // medicine
    medsIntro: 'Registra ogni farmaco o integratore dato. Per paracetamolo e ibuprofene controllo intervalli, numero di dosi e dose per kg; per la vitamina D il totale del giorno rispetto al limite massimo EFSA per l\'età.',
    medsNever: 'Lunibù non calcola né suggerisce dosi. Usa sempre la dose indicata sulla confezione o dal pediatra, in base al peso attuale; per dubbi chiedi al pediatra o al farmacista.',
    medsRules: ['Controlla la concentrazione: lo stesso principio attivo esiste in gocce e sciroppo con concentrazioni molto diverse (anche 4 volte o più).', 'Conta insieme tutto il paracetamolo: sciroppo, gocce, supposte e farmaci combinati che lo contengono.', 'Si tratta il malessere, non il numero sul termometro.', 'Sospetto sovradosaggio: contatta subito un centro antiveleni o il 112, anche se il bimbo sembra stare bene.'],
    addMed: 'Registra un farmaco', med: 'Farmaco', other: 'Altro farmaco…', otherName: 'Nome del farmaco o principio attivo',
    route: 'Via', oral: 'bocca', rectal: 'supposta', amount: 'Quantità', unit: 'Unità', conc: 'Concentrazione (mg/ml, scritta su confezione e foglietto)',
    concOther: 'altra', when: 'Data e ora', note: 'Nota (facoltativa)', flags: 'In questo momento il bimbo…',
    flag: { dehydration: 'è disidratato (vomito o diarrea, beve poco)', chickenpox: 'ha la varicella', kidney: 'ha una malattia dei reni', liver: 'ha una malattia del fegato', nsaidAsthma: 'ha avuto asma o reazioni con aspirina o altri antinfiammatori (FANS)', otherNsaid: 'sta prendendo un altro antinfiammatorio (FANS)', asthma: 'ha l\'asma' },
    names: { paracetamolo: 'Paracetamolo', ibuprofene: 'Ibuprofene', vitaminaD: 'Vitamina D (colecalciferolo)' },
    check: 'Controllo', saveAnyway: 'Registra comunque', filters: 'Filtri', allMeds: 'Tutti', period: 'Periodo', days: (d) => (d ? `${d} giorni` : 'tutto'),
    noMeds: 'Nessun farmaco registrato in questo periodo.', perDay: 'Dosi al giorno', export: 'Esporta CSV (per il pediatra)',
    perKg: (v) => `${fmt(v)} mg/kg`,
    myMeds: 'Le mie medicine', myMedsEmpty: 'Nessuna medicina ancora: registra una dose o aggiungi una medicina con il suo schema.',
    addPlanMed: '＋ Aggiungi una medicina', lastGiven: 'Ultima dose', never: 'mai data', in24: (n) => `${n} ${n === 1 ? 'dose' : 'dosi'} nelle ultime 24 ore`,
    setPlan: 'Imposta schema', editPlan: 'Modifica schema', delPlan: 'Elimina schema', giveDose: 'Registra una dose', again: '↻ Di nuovo',
    planCopy: 'Copia i valori dalla prescrizione del medico o dal foglietto: Lunibù non suggerisce dosi.',
    planName: 'Nome della medicina', planEvery: 'Ogni (ore)', planMax: 'Al massimo per 24 ore (dosi)', planDose: 'Dose come prescritta', planUntil: 'Fino al (data)', planNote: 'Nota (facoltativa)',
    planSummary: (p, s) => [p.intervalH ? `ogni ${p.intervalH} h` : '', p.maxPerDay ? `max ${p.maxPerDay} in 24 h` : '', p.dose ? `${fmt(p.dose.amount, 2)} ${s.units[p.dose.unit] ?? p.dose.unit}` : '', p.until ? `fino al ${new Date(p.until).toLocaleDateString('it')}` : ''].filter(Boolean).join(' · '),
    yourPlan: 'Il tuo schema',
    concIU: { gocce: 'UI per goccia (scritte sulla confezione)', ml: 'UI per ml (scritte sulla confezione)' }, iuPer: { gocce: 'UI/goccia', ml: 'UI/ml' },
    vitDToday: (iu, ul) => `Oggi: ${fmt(iu, 0)} UI registrate${ul ? `, limite massimo EFSA per l'età: ${ul} UI al giorno` : ''}`, vitDPartial: 'alcune dosi senza UI: il totale è incompleto',
    units: { mg: 'mg', ml: 'ml', gocce: 'gocce', UI: 'UI', 'µg': 'µg', compresse: 'compresse', bustine: 'bustine', supposte: 'supposte', spruzzi: 'spruzzi', other: '—' },
    c: {
      noCheck: 'Nessun controllo automatico per questo farmaco: segui la prescrizione o il foglietto.',
      rcpNote: 'I fogli illustrativi italiani (RCP) non sono stati consultati direttamente in questo controllo: prevale il foglietto della tua confezione.',
      capDose: (p) => `La dose supera il massimo per singola somministrazione indicato per l'età/peso (${fmt(p.max, 0)} mg secondo le fonti indicate): ricontrolla il foglietto della tua confezione e chiedi al farmacista o al pediatra.`,
      capDay: (p) => `Il totale delle ultime 24 ore (${fmt(p.mg, 0)} mg, tutte le vie) supera il massimo giornaliero indicato per l'età/peso (${fmt(p.max, 0)} mg secondo le fonti indicate): ricontrolla il foglietto della tua confezione e chiedi al farmacista o al pediatra.`,
      underAge: (p) => `Sotto i ${p.months} mesi chiedi sempre al pediatra prima di dare questo farmaco. Con febbre ≥ 38 °C sotto i 3 mesi serve una valutazione medica urgente.`,
      underWeight: (p) => `Sotto i ${fmt(p.kg)} kg questo farmaco non va dato senza indicazione del medico.`,
      contra: (p, s) => `Con questa condizione (${s.flag[p.flag]}) chiedi prima al pediatra.`,
      caution: (p, s) => `Attenzione: ${s.flag[p.flag]}. Chiedi consiglio al pediatra.`,
      tooSoon: (p) => `Sono passate ${fmt(p.gap)} ore dalla dose precedente, meno dell'intervallo minimo prudenziale controllato da Lunibù (${p.hours} ore). Confronta con il foglietto della tua confezione e chiedi al pediatra.`,
      tooMany: (p) => `${p.n} dosi in 24 ore: oltre il limite prudenziale controllato da Lunibù (${p.max}). Confronta con il foglietto della tua confezione e chiedi al pediatra.`,
      doseHigh: (p) => `Questa dose è ${fmt(p.perKg)} mg/kg: sopra il massimo abituale per dose (${p.max} mg/kg). Ricontrolla peso, concentrazione e foglietto.`,
      doseVeryHigh: (p) => `Questa dose è ${fmt(p.perKg)} mg/kg, oltre ${p.max} mg/kg: ricontrolla subito e chiedi al pediatra o a un centro antiveleni.`,
      intervalCaution: (p) => `Molte confezioni indicano almeno ${p.hours} ore tra una dose e l'altra: controlla il foglietto.`,
      dayHigh: (p) => `Nelle ultime 24 ore, per bocca: ${fmt(p.perKg)} mg/kg, oltre il limite prudenziale controllato da Lunibù (${p.max} mg/kg al giorno). Confronta con il foglietto della tua confezione e chiedi al pediatra.`,
      rectalBand: 'Per le supposte intervalli e numero massimo di dosi dipendono dalla fascia di peso: segui il foglietto. Le linee guida pediatriche italiane sconsigliano la via rettale, salvo se il bimbo vomita.',
      mixedRoutes: 'Stai usando vie diverse (bocca e supposta): conta tutto il paracetamolo insieme e, nel dubbio, chiedi al pediatra.',
      oldWeight: (p) => `L'ultimo peso registrato è di ${p.days} giorni fa: aggiornalo per un controllo affidabile.`,
      noWeight: 'Senza un peso registrato non posso controllare la dose per kg: aggiungi il peso in "Crescita".',
      noMg: 'Inserisci la quantità in mg, oppure in ml con la concentrazione, per controllare la dose.',
      tooLong: (p) => `Usato da più di ${p.days === 1 ? '24 ore' : `${p.days} giorni`} di fila: senti il pediatra.`,
      alternating: (p, s) => `Hai dato anche ${s.names[p.other].toLowerCase()} nelle ultime ore: alternare o associare i due farmaci si fa solo su indicazione del medico.`,
      planTooSoon: (p) => `Secondo lo schema che hai inserito (dalla prescrizione o dal foglietto) l'intervallo è di almeno ${p.hours} ore: dalla dose precedente ne sono passate ${fmt(p.gap)}.`,
      planTooMany: (p) => `Lo schema che hai inserito prevede al massimo ${p.max} dosi in 24 ore: con questa sarebbero ${p.n}.`,
      planEnded: (p) => `Lo schema che hai inserito termina il ${new Date(p.until).toLocaleDateString('it')}: chiedi al pediatra se continuare.`,
      planDoseDiff: 'Quantità diversa dalla dose che hai inserito nello schema.',
      vitDHigh: (p) => `Totale di vitamina D oggi: ${fmt(p.iu, 0)} UI, sopra il limite massimo EFSA per questa età (${p.ul} UI al giorno).`,
      vitDVeryHigh: (p) => `Totale di vitamina D oggi: ${fmt(p.iu, 0)} UI, più del doppio del limite massimo EFSA per questa età (${p.ul} UI al giorno) (soglia prudenziale scelta da Lunibù). Ricontrolla le quantità e chiedi subito al pediatra o a un centro antiveleni. Se è una dose settimanale o mensile prescritta dal pediatra, segui la prescrizione.`,
      vitDInfo: 'Il limite è il livello massimo di assunzione tollerabile (UL) EFSA, non una soglia di tossicità né una dose. Se il pediatra ha prescritto una dose diversa, non modificarla: chiedi a lui.',
      vitDAllSources: 'Conta tutte le fonti di vitamina D: altri integratori, multivitaminici e latte artificiale arricchito.',
      vitDRec: (p) => (p.period === 'infant'
        ? 'Per i bimbi da 0 a 12 mesi il consenso italiano ed ESPGHAN indicano 400 UI al giorno per tutti, qualunque sia l\'alimentazione; l\'AAP almeno 400 UI finché il bimbo non assume almeno 1 litro al giorno di latte artificiale arricchito. L\'Italia ammette fino a 1000 UI al giorno nei bimbi con fattori di rischio, su indicazione del pediatra. Segui l\'indicazione del tuo pediatra.'
        : 'Dopo il primo anno l\'Italia ed ESPGHAN raccomandano l\'integrazione solo ai bambini con fattori di rischio; l\'Italia indica 600 UI al giorno con poca esposizione al sole, fino a 1000 con più fattori. L\'AAP indica almeno 400 UI e l\'IOM statunitense 600 UI al giorno per 1–13 anni. Segui l\'indicazione del tuo pediatra.'),
      vitDNoIU: 'Inserisci le UI per goccia o per ml (scritte sulla confezione) per controllare il totale.',
      vitDAnalog: 'Calcifediolo, alfacalcidolo, calcitriolo e diidrotachisterolo non sono per la prevenzione di routine (rischio di ipercalcemia).',
      ok: 'Nessun limite superato tra quelli controllati. Questo non garantisce che la dose sia giusta per il tuo bimbo.'
    },
    sources: 'Fonti'
  },
  ru: {
    title: 'Дневник', sub: 'Рост и лекарства — только на вашем телефоне.',
    tabGrowth: 'Рост', tabMeds: 'Лекарства',
    weight: 'Вес', height: 'Рост', head: 'Голова', bmi: 'ИМТ',
    heightLong: (m) => (m < 24 ? 'Длина тела (лёжа)' : 'Рост (стоя)'), headLong: 'Окружность головы',
    sexAsk: 'Для сравнения с кривыми ВОЗ нужно знать, это…', boy: 'мальчик', girl: 'девочка',
    pretermQ: 'Родился недоношенным?', preterm: 'Срок беременности при рождении, недель (для скорректированного возраста)',
    pretermNote: (w) => `Используется скорректированный возраст (рождён на ${w} неделе) до ${w < 32 ? '2 лет' : '1 года'}.`,
    add: 'Добавить измерение', date: 'Дата', save: 'Сохранить', cancel: 'Отмена', del: 'Удалить', none: 'Пока нет измерений.',
    pct: (p) => `${p < 1 ? '<1' : p > 99 ? '>99' : Math.round(p)}-й перцентиль`,
    chartNote: 'Линии: перцентили ВОЗ 3, 15, 50, 85, 97. Точки: ваши измерения.',
    over: (max) => `Кривые ВОЗ для этого показателя используются до ${max} месяцев.`,
    w: {
      implausible: 'Очень маловероятное значение для возраста: проверьте ввод (единицы, запятая, дата). Если значение верное, скорее обсудите его с педиатром.',
      standingEarly: 'До 9 месяцев измерение «стоя» почти всегда ошибка ввода: измеряют лёжа.',
      tall: 'Намного выше среднего (более +3 SD): по ВОЗ это редко проблема, но педиатру стоит об этом знать.',
      weightHigh: 'Вес для возраста выше +2 SD. По весу для возраста нельзя судить об избыточном весе: ВОЗ оценивает его по весу относительно длины/роста (или по ИМТ). Добавьте длину/рост, измеренные в тот же день.',
      weightVeryHigh: 'Вес для возраста выше +3 SD. По весу для возраста нельзя судить об избыточном весе: ВОЗ оценивает его по весу относительно длины/роста (или по ИМТ). Добавьте длину/рост, измеренные в тот же день.',
      wflOverweight: 'Вес относительно длины/роста выше +2 SD: по критериям ВОЗ для детей до 5 лет это избыточный вес. Это не диагноз: обсудите с педиатром.',
      wflObese: 'Вес относительно длины/роста выше +3 SD: по критериям ВОЗ для детей до 5 лет это ожирение. Это не диагноз и не вина: обсудите с педиатром.',
      wflRisk: 'Вес относительно длины/роста выше +1 SD: по ВОЗ это возможный риск избыточного веса; важно следить за динамикой (особенно если кривая поднимается к +2 SD).',
      wflWasting: 'Вес относительно длины/роста ниже −2 SD: по критериям ВОЗ это истощение (низкий вес для длины). Перепроверьте измерения и обсудите с педиатром.',
      wflSevereWasting: 'Вес относительно длины/роста ниже −3 SD: по критериям ВОЗ это тяжёлое истощение. Если измерение верное, скорее обратитесь к педиатру.',
      bmiEstimatedOut: 'Расчётный ИМТ вне типичного диапазона: для оценки измерьте вес и рост в один день.',
      bmiOverweight: 'ИМТ для возраста выше +1 SD: по критериям ВОЗ это относится к избыточному весу. Это не диагноз: поговорите с педиатром, который оценивает рост и привычки в целом.',
      bmiObese: 'ИМТ для возраста выше +2 SD: по критериям ВОЗ это относится к ожирению. Это не диагноз и не вина: поговорите с педиатром, который оценивает рост и привычки в целом.',
      bmiThin: 'ИМТ для возраста ниже −2 SD: по критериям ВОЗ это относится к худобе. Это не диагноз: поговорите с педиатром, который оценивает рост и привычки в целом.',
      bmiVeryThin: 'ИМТ для возраста ниже −3 SD: по критериям ВОЗ это выраженная худоба. Это не диагноз, но лучше скоро поговорить с педиатром.',
      veryLow: 'Намного ниже типичных для возраста значений ВОЗ (ниже −3 SD).',
      low: 'Ниже типичных для возраста значений ВОЗ (ниже −2 SD).',
      below04: 'Ниже 0,4-го перцентиля: рекомендуется осмотр педиатра, даже если ребёнок растёт равномерно.',
      headHigh: 'Окружность головы выше типичных значений (более +2 SD). Часто это семейное: полезно сравнить с родителями.',
      headVeryHigh: 'Окружность головы намного выше типичных значений (более +3 SD).',
      headLow: 'Окружность головы ниже типичных значений (ниже −2 SD).',
      headVeryLow: 'Окружность головы намного ниже типичных значений (ниже −3 SD).',
      crossDown: (w) => `По сравнению с прошлыми измерениями показатель опустился как минимум на ${w.spaces === 1 ? 'один «коридор»' : `${w.spaces} «коридора»`} перцентилей.${w.ind === 'weight' ? ' Если это подтвердится при следующем измерении (через 2–3 недели), обсудите с педиатром; недавняя болезнь может ненадолго снизить вес.' : ' Обсудите с педиатром.'}`,
      crossUp: 'По сравнению с прошлыми измерениями показатель поднялся как минимум на два «коридора» перцентилей.',
      newbornLoss: (w) => `Потеря около ${w.pct}% веса при рождении: потерю более 10% нужно оценить у врача.`,
      notRegained: 'В 3 недели вес при рождении ещё не восстановлен: нужно показаться врачу.'
    },
    beforeTerm: 'До достижения скорректированного срока 40 недель кривые ВОЗ не применяются: педиатр использует кривые для недоношенных.',
    noWfl: 'Один вес для возраста не говорит, худой ребёнок или с лишним весом. До 5 лет ВОЗ использует вес относительно длины/роста: Lunibù рассчитывает его по измерениям одного дня (вкладка «Вес/длина»); пороги ИМТ действуют с 5 лет.',
    wfl: 'Вес/длина', wflLong: (m) => (m < 24 ? 'Вес к длине' : 'Вес к росту'),
    wflNote: 'Рассчитывается только по весу и длине/росту, измеренным в один день (ВОЗ, 0–5 лет). Линии: перцентили 3, 15, 50, 85, 97; горизонтальная ось: см.',
    bmiEst: 'Расчётный ИМТ', bmiEstLegend: 'Пустой пунктирный кружок: расчётный ИМТ (только положение, без порогов).',
    bmiEstText: (d, d1, d2) => `Расчётный ИМТ: вес от ${d} и рост, оценённый ${d2 ? `по измерениям от ${d1} и ${d2}` : `по измерению от ${d1}`}. Это не измерение: для оценки измерьте вес и длину/рост в один день.`,
    over10: 'После 10 лет ВОЗ использует индекс массы тела вместо веса для возраста.',
    bmiNote: 'ИМТ = вес (кг) ÷ рост (м)², рассчитывается по весу и росту одного измерения. От 2 до 5 лет Lunibù показывает только положение на кривых ВОЗ: до 5 лет ВОЗ использует вес относительно длины/роста (вкладка «Вес/длина»); с 5 лет также отмечает пороги ВОЗ для ИМТ (выше +1 SD, ниже −2 SD), без диагноза: для интерпретации обратитесь к педиатру. Если вес и рост измерены в разные дни, Lunibù оценивает рост по соседним измерениям (осторожный выбор Lunibù, по аналогии с Bailey 2013, где рост оценивали по соседним визитам) и показывает расчётный ИМТ только как положение на кривой.',
    pos: 'Как измеряли', lying: 'лёжа', standing: 'стоя',
    wFoot: 'Это не диагноз: одно измерение может быть неточным. Проверьте, как вы измеряли, и обсудите с педиатром.',
    measureTips: 'Взвешивайте без одежды (или в боди), всегда на одних весах. До 2 лет длину измеряют лёжа, затем рост стоя без обуви. Голова: мягкой лентой над бровями и ушами, по самой широкой части.',
    medsIntro: 'Записывайте каждое лекарство или добавку. Для парацетамола и ибупрофена проверяются интервалы, число доз и доза на кг; для витамина D — сумма за день относительно верхнего уровня EFSA для возраста.',
    medsNever: 'Lunibù не рассчитывает и не предлагает дозы. Всегда используйте дозу с упаковки или назначенную педиатром, по текущему весу; при сомнениях спросите педиатра или фармацевта.',
    medsRules: ['Проверяйте концентрацию: одно и то же вещество выпускают в каплях и сиропе с очень разной концентрацией (в 4 раза и более).', 'Считайте вместе весь парацетамол: сироп, капли, свечи и комбинированные препараты с ним.', 'Лечат плохое самочувствие, а не цифру на термометре.', 'Подозрение на передозировку: сразу свяжитесь с токсикологическим центром или звоните 112, даже если ребёнок выглядит здоровым.'],
    addMed: 'Записать лекарство', med: 'Лекарство', other: 'Другое лекарство…', otherName: 'Название лекарства или действующего вещества',
    route: 'Способ', oral: 'внутрь', rectal: 'свеча', amount: 'Количество', unit: 'Ед.', conc: 'Концентрация (мг/мл, указана на упаковке и в инструкции)',
    concOther: 'другая', when: 'Дата и время', note: 'Заметка (необязательно)', flags: 'Сейчас у ребёнка…',
    flag: { dehydration: 'обезвоживание (рвота или понос, мало пьёт)', chickenpox: 'ветрянка', kidney: 'болезнь почек', liver: 'болезнь печени', nsaidAsthma: 'была астма или реакция на аспирин или другие НПВС', otherNsaid: 'параллельно приём другого НПВС', asthma: 'астма' },
    names: { paracetamolo: 'Парацетамол', ibuprofene: 'Ибупрофен', vitaminaD: 'Витамин D (колекальциферол)' },
    check: 'Проверка', saveAnyway: 'Всё равно записать', filters: 'Фильтры', allMeds: 'Все', period: 'Период', days: (d) => (d ? `${d} дн.` : 'всё'),
    noMeds: 'За этот период лекарств не записано.', perDay: 'Доз в день', export: 'Экспорт CSV (для педиатра)',
    perKg: (v) => `${fmt(v)} мг/кг`,
    myMeds: 'Мои лекарства', myMedsEmpty: 'Пока ничего нет: запишите приём или добавьте лекарство со схемой.',
    addPlanMed: '＋ Добавить лекарство', lastGiven: 'Последний приём', never: 'ещё не давали', in24: (n) => `Приёмов за последние 24 часа: ${n}`,
    setPlan: 'Задать схему', editPlan: 'Изменить схему', delPlan: 'Удалить схему', giveDose: 'Записать приём', again: '↻ Ещё раз',
    planCopy: 'Перепишите значения из назначения врача или из инструкции: Lunibù не предлагает дозы.',
    planName: 'Название лекарства', planEvery: 'Каждые (часов)', planMax: 'Не больше за 24 часа (приёмов)', planDose: 'Доза как назначено', planUntil: 'До (дата)', planNote: 'Заметка (необязательно)',
    planSummary: (p, s) => [p.intervalH ? `каждые ${p.intervalH} ч` : '', p.maxPerDay ? `макс. ${p.maxPerDay} за 24 ч` : '', p.dose ? `${fmt(p.dose.amount, 2)} ${s.units[p.dose.unit] ?? p.dose.unit}` : '', p.until ? `до ${new Date(p.until).toLocaleDateString('ru')}` : ''].filter(Boolean).join(' · '),
    yourPlan: 'Ваша схема',
    concIU: { gocce: 'МЕ на каплю (написано на упаковке)', ml: 'МЕ на мл (написано на упаковке)' }, iuPer: { gocce: 'МЕ/капля', ml: 'МЕ/мл' },
    vitDToday: (iu, ul) => `Сегодня: записано ${fmt(iu, 0)} МЕ${ul ? `, допустимый верхний уровень EFSA для возраста: ${ul} МЕ в сутки` : ''}`, vitDPartial: 'у некоторых приёмов нет МЕ: сумма неполная',
    units: { mg: 'мг', ml: 'мл', gocce: 'капли', UI: 'МЕ', 'µg': 'мкг', compresse: 'таблетки', bustine: 'пакетики', supposte: 'свечи', spruzzi: 'спреи', other: '—' },
    c: {
      noCheck: 'Для этого лекарства нет автоматической проверки: следуйте назначению или инструкции.',
      rcpNote: 'Итальянские инструкции (RCP) в этой проверке напрямую не изучались: приоритет у инструкции на вашей упаковке.',
      capDose: (p) => `Доза превышает максимум на один приём, указанный для данного возраста/веса (${fmt(p.max, 0)} мг по указанным источникам): ещё раз проверьте инструкцию на вашей упаковке и спросите фармацевта или педиатра.`,
      capDay: (p) => `Сумма за последние 24 часа (${fmt(p.mg, 0)} мг, всеми путями введения) превышает суточный максимум, указанный для данного возраста/веса (${fmt(p.max, 0)} мг по указанным источникам): ещё раз проверьте инструкцию на вашей упаковке и спросите фармацевта или педиатра.`,
      underAge: (p) => `До ${p.months} месяцев всегда спрашивайте педиатра, прежде чем давать это лекарство. При температуре ≥ 38 °C до 3 месяцев нужен срочный осмотр врача.`,
      underWeight: (p) => `При весе меньше ${fmt(p.kg)} кг это лекарство не дают без указания врача.`,
      contra: (p, s) => `При этом состоянии (${s.flag[p.flag]}) сначала спросите педиатра.`,
      caution: (p, s) => `Внимание: ${s.flag[p.flag]}. Посоветуйтесь с педиатром.`,
      tooSoon: (p) => `С прошлой дозы прошло ${fmt(p.gap)} ч — меньше консервативного минимального интервала проверки Lunibù (${p.hours} ч). Сверьтесь с инструкцией к вашей упаковке и спросите педиатра.`,
      tooMany: (p) => `Доз за 24 часа: ${p.n} — выше консервативного предела проверки Lunibù (${p.max}). Сверьтесь с инструкцией к вашей упаковке и спросите педиатра.`,
      doseHigh: (p) => `Эта доза — ${fmt(p.perKg)} мг/кг: выше обычного максимума на приём (${p.max} мг/кг). Проверьте вес, концентрацию и инструкцию.`,
      doseVeryHigh: (p) => `Эта доза — ${fmt(p.perKg)} мг/кг, больше ${p.max} мг/кг: срочно перепроверьте и спросите педиатра или токсикологический центр.`,
      intervalCaution: (p) => `Во многих инструкциях указан интервал не менее ${p.hours} ч между дозами: проверьте инструкцию.`,
      dayHigh: (p) => `За последние 24 часа внутрь: ${fmt(p.perKg)} мг/кг — выше консервативного предела проверки Lunibù (${p.max} мг/кг в сутки). Сверьтесь с инструкцией к вашей упаковке и спросите педиатра.`,
      rectalBand: 'Для свечей интервалы и максимальное число доз зависят от весовой группы: следуйте инструкции. Итальянские педиатрические рекомендации не советуют ректальный путь, кроме случаев рвоты.',
      mixedRoutes: 'Вы используете разные способы (внутрь и свечи): считайте весь парацетамол вместе и при сомнениях спросите педиатра.',
      oldWeight: (p) => `Последний вес записан ${p.days} дн. назад: обновите его для надёжной проверки.`,
      noWeight: 'Без записанного веса нельзя проверить дозу на кг: добавьте вес в разделе «Рост».',
      noMg: 'Укажите количество в мг или в мл с концентрацией, чтобы проверить дозу.',
      tooLong: (p) => `Применяется дольше ${p.days === 1 ? '24 часов' : `${p.days} дней`} подряд: обратитесь к педиатру.`,
      alternating: (p, s) => `В последние часы давали и ${s.names[p.other].toLowerCase()}: чередовать или сочетать эти лекарства можно только по указанию врача.`,
      planTooSoon: (p) => `По схеме, которую вы ввели (из назначения или инструкции), интервал не менее ${p.hours} ч: с предыдущей дозы прошло ${fmt(p.gap)} ч.`,
      planTooMany: (p) => `Введённая вами схема предусматривает не больше ${p.max} доз за 24 часа: с этой будет ${p.n}.`,
      planEnded: (p) => `Введённая вами схема заканчивается ${new Date(p.until).toLocaleDateString('ru')}: спросите педиатра, продолжать ли.`,
      planDoseDiff: 'Количество отличается от дозы, которую вы ввели в схеме.',
      vitDHigh: (p) => `Сумма витамина D за сегодня: ${fmt(p.iu, 0)} МЕ — выше допустимого верхнего уровня EFSA для этого возраста (${p.ul} МЕ в сутки).`,
      vitDVeryHigh: (p) => `Сумма витамина D за сегодня: ${fmt(p.iu, 0)} МЕ — более чем вдвое выше допустимого верхнего уровня EFSA для этого возраста (${p.ul} МЕ в сутки) (осторожный порог, выбранный Lunibù). Перепроверьте количества и сразу обратитесь к педиатру или в токсикологический центр. Если это еженедельная или ежемесячная доза, назначенная педиатром, следуйте назначению.`,
      vitDInfo: 'Лимит — это допустимый верхний уровень потребления (UL) EFSA, а не порог токсичности и не доза. Если педиатр назначил другую дозу, не меняйте её самостоятельно — обратитесь к нему.',
      vitDAllSources: 'Учитывайте все источники витамина D: другие добавки, поливитамины и обогащённую молочную смесь.',
      vitDRec: (p) => (p.period === 'infant'
        ? 'Для детей от 0 до 12 месяцев итальянский консенсус и ESPGHAN указывают 400 МЕ в сутки всем, независимо от вида вскармливания; AAP — не менее 400 МЕ, пока ребёнок не получает не менее 1 литра обогащённой смеси в сутки. В Италии допускается до 1000 МЕ в сутки при факторах риска, по назначению педиатра. Следуйте указаниям вашего педиатра.'
        : 'После первого года Италия и ESPGHAN рекомендуют добавку только детям с факторами риска; Италия указывает 600 МЕ в сутки при малом пребывании на солнце, до 1000 при нескольких факторах. AAP указывает не менее 400 МЕ, а американский IOM — 600 МЕ в сутки для возраста 1–13 лет. Следуйте указаниям вашего педиатра.'),
      vitDNoIU: 'Укажите МЕ на каплю или на мл (написано на упаковке), чтобы проверить сумму.',
      vitDAnalog: 'Кальцифедиол, альфакальцидол, кальцитриол и дигидротахистерол не предназначены для рутинной профилактики (риск гиперкальциемии).',
      ok: 'Ни один из проверяемых пределов не превышен. Это не гарантирует, что доза подходит вашему ребёнку.'
    },
    sources: 'Источники'
  }
};

const GROWTH_REFS = { bmiOverweight: ['X4'], bmiObese: ['X4'], bmiThin: ['X4'], bmiVeryThin: ['X4'], implausible: ['W7', 'W12'], standingEarly: ['W7'], tall: ['W3'], weightHigh: ['W3', 'W15'], weightVeryHigh: ['W3', 'W15'], wflOverweight: ['W4', 'W7', 'W15', 'W3'], wflObese: ['W4', 'W7', 'W15', 'W3'], wflRisk: ['W4', 'W7', 'W15', 'W3'], wflWasting: ['W4', 'W7', 'W3'], wflSevereWasting: ['W4', 'W7', 'W3'], bmiEstimatedOut: ['W1', 'W2', 'W16'], veryLow: ['W3', 'W1'], low: ['W3', 'W1'], below04: ['W5'], headHigh: ['W11', 'W8'], headVeryHigh: ['W11', 'W8'], headLow: ['W10', 'W8'], headVeryLow: ['W10', 'W8'], crossDown: ['W5', 'W9', 'W6'], crossUp: ['W5', 'W9'], newbornLoss: ['W6'], notRegained: ['W6'] };

function SourceList({ ids, lang }) {
  const s = DIARY_TEXT[lang];
  return (
    <details className="diary-sources">
      <summary>{s.sources} ({ids.length})</summary>
      <ol>
        {ids.filter((id) => SOURCES[id]).map((id) => (
          <li key={id}><a href={SOURCES[id].url} target="_blank" rel="noreferrer">{SOURCES[id].label}</a> <small>[{id}]</small></li>
        ))}
      </ol>
    </details>
  );
}

const hVal = (g, m) => adjustHeight(m, +g.height, g.heightPos || (m < 24 ? 'lying' : 'standing'));

/* ---------- Grafico crescita ---------- */
function GrowthChart({ indicator, sex, points, upTo, lang }) {
  const W = 340, Hh = 220, P = { l: 34, r: 26, t: 10, b: 24 };
  const maxM = Math.min(INDICATORS[indicator].maxMonths, Math.max(6, Math.ceil((upTo + 3) / 3) * 3));
  const minM = Math.max(0, Math.min(maxM - 12, Math.floor(Math.min(upTo, ...points.map((p) => p.m)) - 3)));
  const curves = curve(indicator, sex, minM, maxM, 48);
  const all = [...curves.flatMap((c) => c.pts.map((p) => p[1])), ...points.map((p) => p.v)];
  const yMin = Math.floor(Math.min(...all) * 0.97), yMax = Math.ceil(Math.max(...all) * 1.02);
  const x = (m) => P.l + ((m - minM) / (maxM - minM || 1)) * (W - P.l - P.r);
  const y = (v) => Hh - P.b - ((v - yMin) / (yMax - yMin || 1)) * (Hh - P.t - P.b);
  const path = (pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${x(p[0]).toFixed(1)},${y(p[1]).toFixed(1)}`).join('');
  const band = (a, b) => `${path(a.pts)}L${b.pts.slice().reverse().map((p) => `${x(p[0]).toFixed(1)},${y(p[1]).toFixed(1)}`).join('L')}Z`;
  const yTicks = 5, xStep = maxM - minM > 24 ? 12 : maxM - minM > 12 ? 6 : 3;
  const unit = INDICATORS[indicator].unit;
  return (
    <svg className="growth-chart" viewBox={`0 0 ${W} ${Hh}`} role="img" aria-label={`${indicator} chart`}>
      <path d={band(curves[0], curves[4])} className="band-outer" />
      <path d={band(curves[1], curves[3])} className="band-inner" />
      {curves.map((c) => (
        <g key={c.p}>
          <path d={path(c.pts)} className={c.p === 50 ? 'p50' : 'pline'} />
          <text x={W - P.r + 3} y={y(c.pts[c.pts.length - 1][1]) + 3} className="plabel">{c.p}</text>
        </g>
      ))}
      {Array.from({ length: yTicks + 1 }, (_, i) => yMin + ((yMax - yMin) * i) / yTicks).map((v) => (
        <text key={v} x={P.l - 4} y={y(v) + 3} className="axis" textAnchor="end">{fmt(v, unit === 'kg' ? 1 : 0)}</text>
      ))}
      {Array.from({ length: Math.floor((maxM - minM) / xStep) + 1 }, (_, i) => Math.ceil(minM / xStep) * xStep + i * xStep).filter((m) => m <= maxM).map((m) => (
        <text key={m} x={x(m)} y={Hh - 6} className="axis" textAnchor="middle">{m}{lang === 'ru' ? 'м' : 'm'}</text>
      ))}
      {points.filter((p) => !p.est).length > 1 && <path d={path(points.filter((p) => !p.est).map((p) => [p.m, p.v]))} className="kid-line" />}
      {points.map((p, i) => (
        <motion.circle key={p.id} cx={x(p.m)} cy={y(p.v)} r={p.warn ? 6 : 5} className={`kid-pt ${p.warn ? 'warn' : ''}`}
          style={p.est ? { fill: 'none', strokeDasharray: '3 2', strokeWidth: 2 } : undefined}
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...spring, delay: 0.05 * i }}>
          {p.est && <title>{lang === 'ru' ? 'Расчётный ИМТ' : 'BMI stimato'}</title>}
        </motion.circle>
      ))}
    </svg>
  );
}

function WflChart({ sex, type, points, ageNow, lang }) {
  const W = 340, Hh = 220, P = { l: 34, r: 26, t: 10, b: 24 };
  const tblMin = type === 'wfl' ? 45 : 65, tblMax = type === 'wfl' ? 110 : 120;
  const mid = points.length ? null : (lmsAt('height', sex, Math.max(0, Math.min(ageNow, 60)))?.[1] || (tblMin + tblMax) / 2);
  let lo = points.length ? Math.min(...points.map((p) => p.cm)) - 6 : mid - 10;
  let hi = points.length ? Math.max(...points.map((p) => p.cm)) + 6 : mid + 10;
  if (hi - lo < 20) { const c = (hi + lo) / 2; lo = c - 10; hi = c + 10; }
  lo = Math.max(tblMin, Math.floor(lo)); hi = Math.min(tblMax, Math.ceil(hi));
  const curves = wflCurve(sex, type, lo, hi, 40);
  const all = [...curves.flatMap((c) => c.pts.map((p) => p[1])), ...points.map((p) => p.v)];
  const yMin = Math.floor(Math.min(...all) * 0.97), yMax = Math.ceil(Math.max(...all) * 1.02);
  const x = (v) => P.l + ((v - lo) / (hi - lo || 1)) * (W - P.l - P.r);
  const y = (v) => Hh - P.b - ((v - yMin) / (yMax - yMin || 1)) * (Hh - P.t - P.b);
  const path = (pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${x(p[0]).toFixed(1)},${y(p[1]).toFixed(1)}`).join('');
  const band = (a, b) => `${path(a.pts)}L${b.pts.slice().reverse().map((p) => `${x(p[0]).toFixed(1)},${y(p[1]).toFixed(1)}`).join('L')}Z`;
  const xStep = hi - lo > 40 ? 10 : 5;
  return (
    <svg className="growth-chart" viewBox={`0 0 ${W} ${Hh}`} role="img" aria-label="weight-for-length chart">
      <path d={band(curves[0], curves[4])} className="band-outer" />
      <path d={band(curves[1], curves[3])} className="band-inner" />
      {curves.map((c) => (
        <g key={c.p}>
          <path d={path(c.pts)} className={c.p === 50 ? 'p50' : 'pline'} />
          <text x={W - P.r + 3} y={y(c.pts[c.pts.length - 1][1]) + 3} className="plabel">{c.p}</text>
        </g>
      ))}
      {Array.from({ length: 6 }, (_, i) => yMin + ((yMax - yMin) * i) / 5).map((v) => (
        <text key={v} x={P.l - 4} y={y(v) + 3} className="axis" textAnchor="end">{fmt(v, 0)}</text>
      ))}
      {Array.from({ length: Math.floor((hi - lo) / xStep) + 1 }, (_, i) => Math.ceil(lo / xStep) * xStep + i * xStep).filter((v) => v <= hi).map((v) => (
        <text key={v} x={x(v)} y={Hh - 6} className="axis" textAnchor="middle">{v}</text>
      ))}
      {points.map((p, i) => (
        <motion.circle key={p.id} cx={x(p.cm)} cy={y(p.v)} r={p.warn ? 6 : 5} className={`kid-pt ${p.warn ? 'warn' : ''}`}
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...spring, delay: 0.05 * i }} />
      ))}
    </svg>
  );
}

function WarnBox({ warnings, s }) {
  if (!warnings.length) return null;
  return (
    <div className="growth-warn" role="alert">
      <strong>⚠️</strong>
      <div>
        {warnings.map((w, i) => <p key={i}>{typeof s.w[w.kind] === 'function' ? s.w[w.kind](w) : s.w[w.kind]} <Refs ids={GROWTH_REFS[w.kind]} /></p>)}
        <p className="small">{s.wFoot}</p>
      </div>
    </div>
  );
}

/* ---------- Crescita ---------- */
function Growth({ lang, kid, growth, setGrowth }) {
  const s = DIARY_TEXT[lang];
  const [ind, setInd] = useState('weight');
  const [form, setForm] = useState(null);
  const sex = kid.sex;
  const ageNow = growthAge(kid, today());
  const mine = growth.filter((g) => g.kidId === kid.id).sort((a, b) => a.date.localeCompare(b.date));

  // peso alla nascita: misura registrata nei primi 3 giorni
  const birth = mine.find((g) => g.weight > 0 && monthsAt(kid.birth, g.date) * 30.4375 <= 3);
  const birthZ = birth ? zScore('weight', sex, growthAge(kid, birth.date), +birth.weight) : null;
  const withEval = useMemo(() => {
    const last = {};
    const heights = mine.filter((g) => g.height > 0).map((g) => ({ t: monthsAt(kid.birth, g.date), m: growthAge(kid, g.date), date: g.date, id: g.id }))
      .filter((q) => q.m >= 0 && q.m <= INDICATORS.height.maxMonths)
      .map((q) => ({ ...q, v: hVal(mine.find((g) => g.id === q.id), q.m) }));
    return mine.map((g) => {
      const m = growthAge(kid, g.date);
      const corr = isCorrected(kid, g.date);
      const ev = {};
      if (m < 0) return { ...g, m, ev, beforeTerm: true }; // prima del termine corretto le curve OMS non valgono (W13)
      for (const k of INPUTS) {
        if (!(g[k] > 0) || m > INDICATORS[k].maxMonths) continue;
        const v = k === 'height' ? hVal(g, m) : +g[k];
        ev[k] = assess(k, sex, m, v, last[k], { birthZ, corr });
        if (k === 'height' && g.heightPos === 'standing' && m < 9) ev[k].warnings.unshift({ kind: 'standingEarly', level: 'check' });
        if (k === 'weight' && birth && g.id !== birth.id) {
          const nb = newbornCheck(+birth.weight, monthsAt(kid.birth, g.date) * 30.4375, +g.weight);
          if (nb) ev[k].warnings.push(nb);
        }
        (last[k] = last[k] || []).push({ months: m, value: v, corr });
      }
      if (g.weight > 0 && g.height > 0 && m >= INDICATORS.bmi.minMonths && m <= INDICATORS.bmi.maxMonths) {
        const b = bmiOf(+g.weight, hVal(g, m));
        ev.bmi = { ...assess('bmi', sex, m, b), value: b };
      }
      if (g.weight > 0 && g.height > 0 && m <= WFL_MAX_MONTHS) {
        const w = assessWfl(sex, m, hVal(g, m), +g.weight);
        if (w.z != null) {
          ev.wfl = { ...w, value: +g.weight, cm: hVal(g, m), type: wflType(m) };
        }
      } else if (g.weight > 0 && !(g.height > 0) && m >= INDICATORS.bmi.minMonths && m <= INDICATORS.bmi.maxMonths) {
        // BMI stimato da misure non simultanee: solo posizione (W16)
        const est = estimateHeight(sex, heights, { t: monthsAt(kid.birth, g.date), m });
        if (est) {
          const b = bmiOf(+g.weight, est.h);
          const a = assess('bmi', sex, m, b);
          if (a.z != null) ev.bmi = { z: a.z, p: a.p, value: b, estimated: true, dates: est.dates, warnings: Math.abs(a.z) > 2 ? [{ kind: 'bmiEstimatedOut', level: 'info' }] : [] };
        }
      }
      if (ev.weight) ev.weight.warnings = dropWeightHigh(ev.weight.warnings, ev, m);
      return { ...g, m, ev };
    });
  }, [mine.map((g) => g.id + g.date + g.weight + g.height + g.head + g.heightPos).join(), sex, kid.gaWeeks]); // eslint-disable-line

  const pts = withEval.filter((g) => g.ev[ind]).map((g) => ({ id: g.id, m: g.m, v: ind === 'height' ? hVal(g, g.m) : ind === 'bmi' ? g.ev.bmi.value : +g[ind], est: ind === 'bmi' && !!g.ev.bmi.estimated, warn: g.ev[ind].warnings.some((w) => w.level !== 'info') }));
  const wflType0 = ageNow < 24 ? 'wfl' : 'wfh';
  const wflPts = withEval.filter((g) => g.ev.wfl && g.ev.wfl.type === wflType0).map((g) => ({ id: g.id, cm: g.ev.wfl.cm, v: g.ev.wfl.value, warn: g.ev.wfl.warnings.some((w) => w.level !== 'info') }));
  const showWfl = ageNow <= WFL_MAX_MONTHS;
  const showHead = ageNow <= INDICATORS.head.maxMonths || mine.some((g) => g.head);

  // Avvisi del modulo mentre si scrive
  const draftWarnings = useMemo(() => {
    if (!form) return [];
    const m = growthAge(kid, form.date || today());
    const corr = isCorrected(kid, form.date || today());
    const out = [];
    if (m < 0) return out;
    for (const k of INPUTS) {
      let v = parseFloat(String(form[k] || '').replace(',', '.'));
      if (!(v > 0) || m > INDICATORS[k].maxMonths) continue;
      if (k === 'height') {
        v = hVal({ height: v, heightPos: form.heightPos }, m);
        if (form.heightPos === 'standing' && m < 9) out.push({ kind: 'standingEarly', level: 'check' });
      }
      const prev = withEval.filter((g) => g.ev[k] && g.date < form.date && g.id !== form.id).map((g) => ({ months: g.m, value: k === 'height' ? hVal(g, g.m) : +g[k], corr: isCorrected(kid, g.date) }));
      out.push(...assess(k, sex, m, v, prev, { birthZ, corr }).warnings.map((w) => ({ ...w, k })));
      if (k === 'weight' && birth && birth.date < form.date) {
        const nb = newbornCheck(+birth.weight, monthsAt(kid.birth, form.date) * 30.4375, v);
        if (nb) out.push(nb);
      }
    }
    const fw = parseFloat(String(form.weight || '').replace(',', '.')), fh = parseFloat(String(form.height || '').replace(',', '.'));
    if (fw > 0 && fh > 0 && m <= WFL_MAX_MONTHS) {
      const w = assessWfl(sex, m, hVal({ height: fh, heightPos: form.heightPos }, m), fw);
      if (w.z != null) return [...dropWeightHigh(out, { wfl: w }, m), ...w.warnings];
    }
    if (fw > 0 && fh > 0 && m >= GROWTH_RULES.bmiFromMonths) return dropWeightHigh(out, { bmi: {} }, m);
    return out;
  }, [form, sex]); // eslint-disable-line

  const saveForm = () => {
    const rec = { id: form.id || uid(), kidId: kid.id, date: form.date || today() };
    if (form.height) rec.heightPos = form.heightPos || (monthsAt(kid.birth, rec.date) < 24 ? 'lying' : 'standing');
    for (const k of INPUTS) {
      const v = parseFloat(String(form[k] || '').replace(',', '.'));
      if (v > 0) rec[k] = v;
    }
    if (!rec.weight && !rec.height && !rec.head) return;
    setGrowth([...growth.filter((g) => g.id !== rec.id), rec]);
    setForm(null);
  };

  const label = { weight: s.weight, height: s.height, head: s.head, bmi: s.bmi, wfl: s.wfl };
  const showBmi = ageNow >= INDICATORS.bmi.minMonths || mine.some((g) => g.ev?.bmi);
  return (
    <div>
      <div className="seg" role="tablist">
        {['weight', 'height', ...(showWfl ? ['wfl'] : []), ...(showBmi ? ['bmi'] : []), ...(showHead ? ['head'] : [])].map((k) => (
          <button key={k} className={ind === k ? 'on' : ''} onClick={() => setInd(k)} role="tab" aria-selected={ind === k}>
            {ind === k && <motion.i layoutId="seg-pill" className="seg-pill" transition={spring} />}<span>{label[k]}</span>
          </button>
        ))}
      </div>
      <motion.div className="chart-card" key={ind} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h3>{ind === 'height' ? s.heightLong(ageNow) : ind === 'head' ? s.headLong : ind === 'bmi' ? s.bmi : ind === 'wfl' ? s.wflLong(ageNow) : s.weight} <small>({ind === 'wfl' ? 'kg / cm' : INDICATORS[ind].unit})</small></h3>
        {ind === 'wfl'
          ? <WflChart sex={sex} type={wflType0} points={wflPts} ageNow={ageNow} lang={lang} />
          : <GrowthChart indicator={ind} sex={sex} points={pts} upTo={Math.min(ageNow, INDICATORS[ind].maxMonths)} lang={lang} />}
        {ind === 'wfl' && <p className="small muted">{s.wflNote} <Refs ids={['W4', 'W7', 'W15']} /></p>}
        {ind === 'bmi' && pts.some((p) => p.est) && <p className="small muted">{s.bmiEstLegend} <Refs ids={['W16']} /></p>}
        {ind !== 'wfl' && <p className="small muted">{s.chartNote} {ind === 'weight' && ageNow < 61 && <>{s.noWfl} <Refs ids={['W4', 'W15']} /></>} {ind === 'bmi' && s.bmiNote} <Refs ids={['W1', 'W2', ...(ind === 'head' ? ['W8'] : []), ...(ind === 'bmi' ? ['X4', 'W16'] : [])]} />{ageNow > INDICATORS[ind].maxMonths ? <> {ind === 'weight' ? s.over10 : s.over(INDICATORS[ind].maxMonths)}{ind === 'weight' && <> <Refs ids={['X5']} /></>}</> : ''}</p>}
        {kid.gaWeeks && kid.gaWeeks < 37 && monthsAt(kid.birth, today()) < (kid.gaWeeks < 32 ? 24 : 12) && <p className="small muted">{s.pretermNote(kid.gaWeeks)} <Refs ids={['W13']} /></p>}
      </motion.div>

      <AnimatePresence>
        {form ? (
          <motion.div className="diary-form" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <label className="field"><span>{s.date}</span>
              <input type="date" min={kid.birth} max={today()} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label>
            <div className="field-row">
              {INPUTS.filter((k) => k !== 'head' || growthAge(kid, form.date) <= INDICATORS.head.maxMonths).map((k) => (
                <label key={k} className="field"><span>{label[k]} ({INDICATORS[k].unit})</span>
                  <input inputMode="decimal" value={form[k] || ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })} placeholder="0,0" /></label>
              ))}
            </div>
            {form.height && (
              <div className="seg small" role="radiogroup" aria-label={s.pos}>
                {['lying', 'standing'].map((p) => (
                  <button key={p} className={(form.heightPos || (monthsAt(kid.birth, form.date) < 24 ? 'lying' : 'standing')) === p ? 'on' : ''}
                    onClick={() => setForm({ ...form, heightPos: p })}><span>{s[p]}</span></button>
                ))}
              </div>
            )}
            {growthAge(kid, form.date || today()) < 0 && <p className="small muted">{s.beforeTerm} <Refs ids={['W13']} /></p>}
            <WarnBox warnings={draftWarnings} s={s} />
            <p className="small muted">{s.measureTips} <Refs ids={['W4']} /></p>
            <div className="row">
              <button className="btn ghost" onClick={() => setForm(null)}>{s.cancel}</button>
              <motion.button className="btn primary" onClick={saveForm} {...tap}>{s.save}</motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.button className="btn primary wide" onClick={() => setForm({ date: today() })} {...tap}>＋ {s.add}</motion.button>
        )}
      </AnimatePresence>

      <ul className="diary-list">
        {!withEval.length && <li className="empty"><Character name="bear" size={56} /> {s.none}</li>}
        {[...withEval].reverse().map((g) => {
          const warns = Object.values(g.ev).flatMap((e) => e.warnings);
          return (
            <motion.li key={g.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
              <div className="dl-head">
                <strong>{new Date(g.date).toLocaleDateString(lang)}</strong>
                <span className="muted small">{formatAge(kid.birth, lang, new Date(g.date))}</span>
                <button className="link-btn" onClick={() => setForm({ ...g, weight: g.weight ?? '', height: g.height ?? '', head: g.head ?? '' })}>✎</button>
                <button className="link-btn" onClick={() => setGrowth(growth.filter((x) => x.id !== g.id))} aria-label={s.del}>✕</button>
              </div>
              <div className="dl-vals">
                {INPUTS.filter((k) => g[k]).map((k) => (
                  <span key={k} className={`chip ${g.ev[k]?.warnings.some((w) => w.level !== 'info') ? 'chip-warn' : ''}`}>
                    {label[k]} {fmt(g[k], 2)} {INDICATORS[k].unit}{g.ev[k] ? ` · ${s.pct(g.ev[k].p)}` : ''}
                  </span>
                ))}
              </div>
              {g.ev.bmi?.estimated && <p className="small muted">{s.bmiEstText(new Date(g.date).toLocaleDateString(lang), new Date(g.ev.bmi.dates[0]).toLocaleDateString(lang), g.ev.bmi.dates[1] && new Date(g.ev.bmi.dates[1]).toLocaleDateString(lang))} <Refs ids={['W16']} /></p>}
              {g.beforeTerm && <p className="small muted">{s.beforeTerm} <Refs ids={['W13']} /></p>}
              <WarnBox warnings={warns} s={s} />
            </motion.li>
          );
        })}
      </ul>
      <SourceList ids={GROWTH_SOURCES} lang={lang} />
    </div>
  );
}

/* ---------- Medicine ---------- */
const COLORS = ['#b9b2ec', '#f7c48f', '#a8d0be', '#f1b4c3', '#a9c7ee', '#f7d79a', '#9ed3d6'];

function CheckList({ results, s, active }) {
  const level = results.some((r) => r.level === 'stop') ? 'stop' : results.some((r) => r.level === 'warn') ? 'warn' : 'ok';
  const msgs = results.filter((r) => r.kind !== 'ok' && !r.kind.startsWith('plan'));
  const plan = results.filter((r) => r.kind.startsWith('plan'));
  const text = (r) => { const m = s.c[r.kind]; return typeof m === 'function' ? m(r, s) : m; };
  return (
    <div className={`dose-check ${level}`} role={level !== 'ok' ? 'alert' : undefined}>
      <strong>{s.check}</strong>
      <ul>
        {msgs.map((r, i) => (
          <li key={i} className={r.level}>{text(r)} <Refs ids={r.refs ?? ACTIVE[active]?.refs?.[r.kind] ?? (r.level !== 'info' ? ACTIVE[active]?.src : null)} /></li>
        ))}
        {level === 'ok' && !msgs.some((r) => r.kind === 'noCheck') && !plan.length && <li>{s.c.ok}</li>}
      </ul>
      {plan.length > 0 && (
        <>
          <strong>{s.yourPlan}</strong>
          <ul>{plan.map((r, i) => <li key={i} className={r.level}>{text(r)}</li>)}</ul>
        </>
      )}
    </div>
  );
}

const PLAN_UNITS = ['mg', 'ml', 'gocce', 'UI', 'compresse', 'bustine', 'supposte', 'spruzzi', 'other'];

function MyMeds({ s, lang, kid, months, mine, medPlans, setMedPlans, giveDose, again }) {
  const [pf, setPf] = useState(null);
  const plans = medPlans.filter((p) => p.kidId === kid.id);
  const nowMs = Date.now();
  const groups = new Map();
  for (const e of [...mine].sort((a, b) => b.at.localeCompare(a.at))) {
    const k = medKey(e);
    if (!groups.has(k)) groups.set(k, { key: k, name: e.active ? s.names[e.active] || e.name : e.name, active: e.active || null, last: e, n24: 0, sample: e });
    if (nowMs - new Date(e.at).getTime() < 86400000 && new Date(e.at).getTime() <= nowMs) groups.get(k).n24++;
  }
  for (const g of groups.values()) g.plan = findPlan(plans, g.sample);
  for (const p of plans) {
    if ([...groups.values()].some((g) => g.plan === p)) continue;
    groups.set(planKey(p), { key: planKey(p), name: p.active ? s.names[p.active] || p.name : p.name, active: p.active || null, last: null, n24: 0, plan: p });
  }
  const list = [...groups.values()];
  const startPlan = (g) => {
    const p = g.plan;
    setPf({ id: p?.id, name: g.name, active: g.active || null, intervalH: p?.intervalH ?? '', maxPerDay: p?.maxPerDay ?? '', amount: p?.dose?.amount ?? '', unit: p?.dose?.unit || 'mg', until: p?.until || '', note: p?.note || '', fixedName: !!g.name });
  };
  const savePlan = () => {
    const name = pf.name.trim();
    if (!name) return;
    const num = (v) => { const n = parseFloat(String(v).replace(',', '.')); return n > 0 ? n : undefined; };
    const rec = { id: pf.id || uid(), kidId: kid.id, name, ...(pf.active ? { active: pf.active } : {}) };
    const iv = num(pf.intervalH), mx = num(pf.maxPerDay), am = num(pf.amount);
    if (iv) rec.intervalH = iv;
    if (mx) rec.maxPerDay = Math.floor(mx);
    if (am) rec.dose = { amount: am, unit: pf.unit };
    if (pf.until) rec.until = pf.until;
    if (pf.note.trim()) rec.note = pf.note.trim();
    setMedPlans([...medPlans.filter((p) => p.id !== rec.id), rec]);
    setPf(null);
  };
  return (
    <details className="ga my-meds">
      <summary>{s.myMeds}{list.length ? ` (${list.length})` : ''}</summary>
      <ul className="diary-list">
        {!list.length && <li className="empty">{s.myMedsEmpty}</li>}
        {list.map((g) => (
          <li key={g.key}>
            <div className="dl-head"><strong>{g.name}</strong></div>
            <div className="dl-vals">
              <span className="chip">{s.lastGiven}: {g.last ? new Date(g.last.at).toLocaleString(lang, { dateStyle: 'short', timeStyle: 'short' }) : s.never}</span>
              {g.n24 > 0 && <span className="chip">{s.in24(g.n24)}</span>}
              {g.plan && <span className="chip">{s.yourPlan}: {s.planSummary(g.plan, s) || '—'}</span>}
              {g.plan?.note && <span className="chip muted">{g.plan.note}</span>}
            </div>
            {g.active === 'vitaminaD' && (() => {
              const day = vitDDayTotal(mine, kid.id, new Date().toISOString());
              const ul = months != null ? vitDLimit(months) : null;
              const rec = months != null && s.c.vitDRec({ period: months < 12 ? 'infant' : 'child' });
              return (
                <div className="small muted">
                  <p>{s.vitDToday(day.iu, ul?.iu)}{day.missing ? ` (${s.vitDPartial})` : ''} <Refs ids={ul?.src} /></p>
                  {rec && <p>{rec} <Refs ids={months < 12 ? ['V4', 'V5', 'V6'] : ['V3', 'V4', 'V5', 'V6']} /></p>}
                </div>
              );
            })()}
            <div className="row">
              <button className="btn small" onClick={() => startPlan(g)}>{g.plan ? s.editPlan : s.setPlan}</button>
              <button className="btn small" onClick={() => giveDose(g)}>{s.giveDose}</button>
              {g.plan && <button className="btn small ghost" onClick={() => setMedPlans(medPlans.filter((p) => p.id !== g.plan.id))}>{s.delPlan}</button>}
            </div>
          </li>
        ))}
      </ul>
      {pf ? (
        <div className="diary-form">
          <p className="small muted">{s.planCopy}</p>
          <label className="field"><span>{s.planName}</span>
            <input value={pf.name} maxLength={60} readOnly={pf.fixedName} onChange={(e) => setPf({ ...pf, name: e.target.value })} /></label>
          <div className="field-row">
            <label className="field"><span>{s.planEvery}</span>
              <input inputMode="decimal" value={pf.intervalH} onChange={(e) => setPf({ ...pf, intervalH: e.target.value })} /></label>
            <label className="field"><span>{s.planMax}</span>
              <input inputMode="numeric" value={pf.maxPerDay} onChange={(e) => setPf({ ...pf, maxPerDay: e.target.value })} /></label>
          </div>
          <div className="field-row">
            <label className="field"><span>{s.planDose}</span>
              <input inputMode="decimal" value={pf.amount} onChange={(e) => setPf({ ...pf, amount: e.target.value })} /></label>
            <label className="field narrow"><span>{s.unit}</span>
              <select value={pf.unit} onChange={(e) => setPf({ ...pf, unit: e.target.value })}>
                {PLAN_UNITS.map((u) => <option key={u} value={u}>{s.units[u]}</option>)}
              </select></label>
          </div>
          <label className="field"><span>{s.planUntil}</span>
            <input type="date" value={pf.until} onChange={(e) => setPf({ ...pf, until: e.target.value })} /></label>
          <label className="field"><span>{s.planNote}</span>
            <input value={pf.note} maxLength={120} onChange={(e) => setPf({ ...pf, note: e.target.value })} /></label>
          <div className="row">
            <button className="btn ghost" onClick={() => setPf(null)}>{s.cancel}</button>
            <button className="btn primary" onClick={savePlan} disabled={!pf.name.trim()}>{s.save}</button>
          </div>
        </div>
      ) : <button className="btn ghost wide" onClick={() => setPf({ name: '', active: null, intervalH: '', maxPerDay: '', amount: '', unit: 'mg', until: '', note: '', fixedName: false })}>{s.addPlanMed}</button>}
    </details>
  );
}

function Meds({ lang, kid, months, meds, setMeds, growth, medPlans, setMedPlans }) {
  const s = DIARY_TEXT[lang];
  const [form, setForm] = useState(null);
  const [fMed, setFMed] = useState('');
  const [fDays, setFDays] = useState(30);
  const formRef = React.useRef(null);
  const openForm = (f) => {
    setForm(f);
    setTimeout(() => formRef.current?.scrollIntoView({ block: 'start', behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }), 60);
  };

  const entryFrom = (f) => {
    const a = ACTIVE[f.active];
    const conc = f.unit === 'ml' && !(a?.kind === 'daily') ? (f.conc === 'other' ? parseFloat(String(f.concOther).replace(',', '.')) : +f.conc) : null;
    const concIU = a?.kind === 'daily' && (f.unit === 'gocce' || f.unit === 'ml') ? parseFloat(String(f.concIU || '').replace(',', '.')) || null : null;
    return {
      id: f.id || 'draft', kidId: kid.id, at: new Date(f.at).toISOString(), active: a ? f.active : null,
      name: a ? s.names[f.active] : (f.name || '').trim(), route: a ? f.route || 'oral' : null,
      amount: parseFloat(String(f.amount || '').replace(',', '.')) || null, unit: f.unit, conc: a?.kind === 'daily' ? null : conc, ...(a?.kind === 'daily' ? { concIU } : {}), flags: f.flags || [], note: f.note || ''
    };
  };
  const draft = form && entryFrom(form);
  const results = useMemo(() => {
    if (!draft || (!draft.active && !draft.name)) return [];
    const weight = latestWeight(growth, kid.id, draft.at);
    const r = [...checkDose(draft, meds, { months: monthsAt(kid.birth, draft.at), weight }), ...checkPlan(draft, meds, findPlan(medPlans, draft))];
    for (const c of ACTIVE[draft.active]?.cautions || []) if (draft.flags.includes(c)) r.push({ kind: 'caution', level: 'warn', flag: c });
    return r;
  }, [JSON.stringify(draft), meds, growth, medPlans]); // eslint-disable-line

  const save = () => {
    if (!draft.active && !draft.name) return;
    // stesso farmaco già registrato con altre maiuscole/spazi: usa la grafia esistente
    const known = !draft.active && mine.find((m) => !m.active && normName(m.name) === normName(draft.name));
    const e = { ...draft, ...(known ? { name: known.name } : {}), id: form.id || uid() };
    setMeds([...meds.filter((m) => m.id !== e.id), e]);
    setForm(null);
  };

  const mine = meds.filter((m) => m.kidId === kid.id);
  const names = [...new Map([...mine.filter((m) => !m.active).map((m) => m.name), ...medPlans.filter((p) => p.kidId === kid.id && !p.active).map((p) => p.name)].map((n) => [normName(n), n])).values()];
  const keys = [...new Set(mine.map(medKey))];
  const label = (k) => s.names[k] || mine.find((m) => medKey(m) === k)?.name || k;
  const color = (k) => COLORS[keys.indexOf(k) % COLORS.length];
  const shown = filterLog(mine, { kidId: kid.id, med: fMed, days: fDays });

  // Grafico: dosi al giorno (ultimi N giorni, max 30 barre)
  const nDays = Math.min(fDays || 30, 30);
  const daysArr = Array.from({ length: nDays }, (_, i) => new Date(Date.now() - (nDays - 1 - i) * 86400000).toISOString().slice(0, 10));
  const perDay = daysArr.map((d) => {
    const items = shown.filter((e) => e.at.slice(0, 10) === d);
    const by = {};
    items.forEach((e) => { by[medKey(e)] = (by[medKey(e)] || 0) + 1; });
    return { d, by, n: items.length };
  });
  const maxN = Math.max(3, ...perDay.map((p) => p.n));

  const exportCsv = () => {
    const rows = mine.sort((a, b) => a.at.localeCompare(b.at)).map((e) => {
      const w = latestWeight(growth, kid.id, e.at);
      const mg = toMg(e);
      return [e.at.slice(0, 16).replace('T', ' '), e.name, e.route || '', e.amount, e.unit, e.conc || '', mg || '', w ? w.kg : '', mg && w ? (mg / w.kg).toFixed(1) : '', e.note];
    });
    const g = growth.filter((x) => x.kidId === kid.id).sort((a, b) => a.date.localeCompare(b.date)).map((x) => [x.date, x.weight || '', x.height || '', x.head || '']);
    const csv = toCsv(rows, ['data_ora', 'farmaco', 'via', 'quantita', 'unita', 'mg_per_ml', 'mg', 'peso_kg', 'mg_per_kg', 'nota']) +
      '\n\n' + toCsv(g, ['data', 'peso_kg', 'altezza_cm', 'testa_cm']);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' }));
    a.download = `lunibu-${(kid.name || 'bimbo').toLowerCase()}-${today()}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  const a = form && ACTIVE[form.active];
  const giveDose = (g) => {
    const d = g.plan?.dose;
    const act = g.active && ACTIVE[g.active] ? g.active : '';
    const daily = ACTIVE[act]?.kind === 'daily';
    const unit = d?.unit && (!act || (daily ? ['gocce', 'ml', 'UI', 'µg'] : ['mg', 'ml']).includes(d.unit)) ? d.unit : act ? (daily ? 'gocce' : 'ml') : d?.unit || 'other';
    openForm({ active: act, name: act ? '' : g.name, route: 'oral', unit, amount: d?.amount ? String(d.amount) : '', conc: '', at: nowLocal(), flags: [] });
  };
  // "Di nuovo": stessa medicina, quantità, unità, concentrazione e via; ora = adesso
  const again = (e) => {
    const A = ACTIVE[e.active];
    const known = A?.conc && e.conc && A.conc.includes(e.conc);
    openForm({
      active: A ? e.active : '', name: A ? '' : e.name, route: e.route || 'oral', unit: e.unit || 'other', amount: e.amount ? String(e.amount) : '',
      concIU: e.concIU ? String(e.concIU) : '', conc: e.unit === 'ml' && A?.conc && e.conc ? (known ? e.conc : 'other') : '', concOther: e.unit === 'ml' && A?.conc && e.conc && !known ? String(e.conc) : '',
      at: nowLocal(), flags: [], note: ''
    });
  };
  return (
    <div>
      <p className="lead small">{s.medsIntro}</p>
      <div className="med-never"><strong>ℹ️</strong><div><p>{s.medsNever}</p>
        <ul className="med-rules">{s.medsRules.map((r, i) => <li key={i}>{r} <Refs ids={[['M5', 'M6'], ['M2', 'M5'], ['M1', 'M8'], ['M5']][i]} /></li>)}</ul></div></div>

      <AnimatePresence>
        {form ? (
          <motion.div className="diary-form" ref={formRef} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <label className="field"><span>{s.med}</span>
              <select value={form.active} onChange={(e) => setForm({ ...form, active: e.target.value, route: 'oral', flags: [], conc: '', concIU: '', unit: ACTIVE[e.target.value]?.kind === 'daily' ? 'gocce' : form.unit === 'gocce' ? 'ml' : form.unit })}>
                {Object.keys(ACTIVE).map((k) => <option key={k} value={k}>{s.names[k]}</option>)}
                <option value="">{s.other}</option>
              </select></label>
            {!a && <label className="field"><span>{s.otherName}</span>
              <input value={form.name || ''} maxLength={60} onChange={(e) => setForm({ ...form, name: e.target.value })} list="med-names" />
              <datalist id="med-names">{names.map((n) => <option key={n} value={n} />)}</datalist></label>}
            {a?.routes && Object.keys(a.routes).length > 1 && (
              <div className="seg small">
                {Object.keys(a.routes).map((r) => <button key={r} className={form.route === r ? 'on' : ''} onClick={() => setForm({ ...form, route: r, unit: r === 'rectal' ? 'mg' : form.unit })}><span>{s[r]}</span></button>)}
              </div>
            )}
            <div className="field-row">
              <label className="field"><span>{s.amount}</span>
                <input inputMode="decimal" value={form.amount || ''} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></label>
              <label className="field narrow"><span>{s.unit}</span>
                <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                  {a?.kind === 'daily' ? ['gocce', 'ml', 'UI', 'µg'].map((u) => <option key={u} value={u}>{s.units[u]}</option>) : <><option value="mg">mg</option>{form.route !== 'rectal' && <option value="ml">ml</option>}</>}
                  {!a && ['gocce', 'UI', 'compresse', 'bustine', 'supposte', 'spruzzi', 'other'].map((u) => <option key={u} value={u}>{s.units[u]}</option>)}
                </select></label>
            </div>
            {a?.kind === 'daily' && (form.unit === 'gocce' || form.unit === 'ml') && (
              <label className="field"><span>{s.concIU[form.unit]}</span>
                <input inputMode="decimal" value={form.concIU || ''} onChange={(e) => setForm({ ...form, concIU: e.target.value })} /></label>
            )}
            {form.unit === 'ml' && a?.conc && (
              <label className="field"><span>{s.conc}</span>
                <div className="chips">
                  {[...a.conc, 'other'].map((c) => (
                    <button key={c} className={`chip ${String(form.conc) === String(c) ? 'on' : ''}`} onClick={() => setForm({ ...form, conc: c })}>
                      {c === 'other' ? s.concOther : `${c} mg/ml`}</button>
                  ))}
                  {form.conc === 'other' && <input className="mini-input" inputMode="decimal" value={form.concOther || ''} placeholder="mg/ml" onChange={(e) => setForm({ ...form, concOther: e.target.value })} />}
                </div></label>
            )}
            <label className="field"><span>{s.when}</span>
              <input type="datetime-local" value={form.at} max={nowLocal()} onChange={(e) => setForm({ ...form, at: e.target.value })} /></label>
            {a && (
              <fieldset className="flags"><legend>{s.flags}</legend>
                {[...(a.contra || []), ...(a.cautions || [])].map((f) => (
                  <label key={f} className="check"><input type="checkbox" checked={form.flags?.includes(f) || false}
                    onChange={(e) => setForm({ ...form, flags: e.target.checked ? [...(form.flags || []), f] : form.flags.filter((x) => x !== f) })} /><span className="box">{form.flags?.includes(f) ? '✓' : ''}</span> {s.flag[f]}</label>
                ))}
              </fieldset>
            )}
            <label className="field"><span>{s.note}</span>
              <input value={form.note || ''} maxLength={120} onChange={(e) => setForm({ ...form, note: e.target.value })} /></label>
            {results.length > 0 && <CheckList results={results} s={s} active={draft.active} />}
            <div className="row">
              <button className="btn ghost" onClick={() => setForm(null)}>{s.cancel}</button>
              <motion.button className="btn primary" onClick={save} disabled={!draft.active && !draft.name} {...tap}>
                {results.some((r) => r.level !== 'info') ? s.saveAnyway : s.save}</motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.button className="btn primary wide" {...tap}
            onClick={() => openForm({ active: Object.keys(ACTIVE)[0], route: 'oral', unit: 'ml', conc: '', at: nowLocal(), flags: [] })}>＋ {s.addMed}</motion.button>
        )}
      </AnimatePresence>

      <MyMeds s={s} lang={lang} kid={kid} months={months} mine={mine} medPlans={medPlans} setMedPlans={setMedPlans} giveDose={giveDose} again={again} />

      {mine.length > 0 && (
        <>
          <div className="filters">
            <select value={fMed} onChange={(e) => setFMed(e.target.value)} aria-label={s.med}>
              <option value="">{s.allMeds}</option>
              {keys.map((k) => <option key={k} value={k}>{label(k)}</option>)}
            </select>
            <div className="seg small">
              {[7, 30, 90, 0].map((d) => <button key={d} className={fDays === d ? 'on' : ''} onClick={() => setFDays(d)}><span>{s.days(d)}</span></button>)}
            </div>
          </div>
          <div className="chart-card">
            <h3>{s.perDay}</h3>
            <svg className="bar-chart" viewBox="0 0 340 120" role="img" aria-label={s.perDay}>
              {perDay.map((p, i) => {
                const bw = 320 / nDays;
                let y0 = 100;
                return (
                  <g key={p.d}>
                    {Object.entries(p.by).map(([k, n]) => {
                      const h = (n / maxN) * 90; y0 -= h;
                      return <motion.rect key={k} x={14 + i * bw + 1} width={Math.max(2, bw - 2)} y={y0} height={h} rx={2} fill={color(k)}
                        initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} style={{ transformOrigin: `0 100px` }} transition={{ delay: i * 0.01 }} />;
                    })}
                    {(i === 0 || i === nDays - 1 || (i % 7 === 0 && nDays - 1 - i >= 4)) && <text x={14 + i * bw + bw / 2} y={114} className="axis" textAnchor="middle">{p.d.slice(8, 10)}/{p.d.slice(5, 7)}</text>}
                  </g>
                );
              })}
              <line x1="14" x2="334" y1="100" y2="100" className="base" />
              <text x="10" y={100 - 90 + 4} className="axis" textAnchor="end">{maxN}</text>
            </svg>
            <div className="legend">{keys.map((k) => <span key={k}><i style={{ background: color(k) }} />{label(k)}</span>)}</div>
          </div>
        </>
      )}

      <ul className="diary-list">
        {!shown.length && <li className="empty"><Character name="drop" size={56} /> {s.noMeds}</li>}
        {shown.map((e) => {
          const w = latestWeight(growth, kid.id, e.at);
          const mg = toMg(e);
          const r = [...checkDose(e, meds, { months: monthsAt(kid.birth, e.at), weight: w }), ...checkPlan(e, meds, findPlan(medPlans, e))].filter((x) => x.level !== 'info');
          return (
            <motion.li key={e.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
              <div className="dl-head">
                <i className="dot" style={{ background: color(medKey(e)) }} />
                <strong>{e.name}</strong>
                <span className="muted small">{new Date(e.at).toLocaleString(lang, { dateStyle: 'short', timeStyle: 'short' })}</span>
                <button className="link-btn" onClick={() => setMeds(meds.filter((x) => x.id !== e.id))} aria-label={s.del}>✕</button>
              </div>
              <div className="dl-vals">
                {e.amount && <span className="chip">{fmt(e.amount, 2)} {e.unit === 'other' ? '' : s.units[e.unit] ?? e.unit}{e.conc ? ` (${e.conc} mg/ml)` : ''}{e.concIU ? ` (${e.concIU} ${s.iuPer[e.unit] || ''})` : ''}{e.route === 'rectal' ? ` · ${s.rectal}` : ''}</span>}
                {mg && e.unit === 'ml' && <span className="chip">{fmt(mg)} mg</span>}
                {mg && w && e.active && <span className="chip">{s.perKg(mg / w.kg)}</span>}
                {e.note && <span className="chip muted">{e.note}</span>}
                <button className="chip" onClick={() => again(e)}>{s.again}</button>
              </div>
              {r.length > 0 && <CheckList results={r} s={s} active={e.active} />}
            </motion.li>
          );
        })}
      </ul>
      {mine.length > 0 && <button className="btn ghost wide" onClick={exportCsv}>⤓ {s.export}</button>}
      <SourceList ids={MED_SOURCES} lang={lang} />
    </div>
  );
}

/* ---------- Pagina Diario ---------- */
export default function Diary({ lang, kids, active, setActive, growth, meds, setGrowth, setMeds, setKid, medPlans = [], setMedPlans, milestones = [], setMilestones }) {
  const s = DIARY_TEXT[lang];
  const [tab, setTab] = useState('growth');
  const [importing, setImporting] = useState(false);
  const kid = kids[Math.max(0, active)];
  const months = kid ? Math.floor(monthsAt(kid.birth, today())) : null;
  return (
    <div className="diary">
      <h1>{s.title}</h1>
      <p className="lead">{s.sub}</p>
      <KidPills kids={kids} active={Math.max(0, active)} setActive={setActive} lang={lang} id="dkp" noAll />
      <div className="seg big" role="tablist">
        {['growth', 'meds', 'miles'].map((k) => (
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)} role="tab" aria-selected={tab === k}>
            {tab === k && <motion.i layoutId="diary-tab" className="seg-pill" transition={spring} />}
            <span>{k === 'growth' ? s.tabGrowth : k === 'meds' ? s.tabMeds : MILESTONE_TEXT[lang].tab}</span>
          </button>
        ))}
      </div>
      {tab === 'growth' && !kid.sex && (
        <motion.div className="sex-ask" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <p>{s.sexAsk}</p>
          <div className="row">
            <motion.button className="btn" onClick={() => setKid({ ...kid, sex: 'm' })} {...tap}>{s.boy}</motion.button>
            <motion.button className="btn" onClick={() => setKid({ ...kid, sex: 'f' })} {...tap}>{s.girl}</motion.button>
          </div>
        </motion.div>
      )}
      {tab === 'growth' && kid.sex && (
        <>
          {months < 24 && (
            <details className="ga"><summary>{s.pretermQ}</summary><label className="field"><span>{s.preterm}</span>
              <select value={kid.gaWeeks || ''} onChange={(e) => setKid({ ...kid, gaWeeks: e.target.value ? +e.target.value : undefined })}>
                <option value="">≥ 37</option>
                {Array.from({ length: 15 }, (_, i) => 22 + i).map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </label></details>
          )}
          <Growth lang={lang} kid={kid} growth={growth} setGrowth={setGrowth} />
        </>
      )}
      {tab === 'meds' && <Meds lang={lang} kid={kid} months={months} meds={meds} setMeds={setMeds} growth={growth} medPlans={medPlans} setMedPlans={setMedPlans} />}
      {tab === 'miles' && <Milestones lang={lang} kid={kid} milestones={milestones} setMilestones={setMilestones} />}
      {importing
        ? <ImportCsv lang={lang} kids={kids} active={Math.max(0, active)} growth={growth} meds={meds} setGrowth={setGrowth} setMeds={setMeds} onClose={() => setImporting(false)} />
        : <button className="btn ghost wide" style={{ marginTop: 14 }} onClick={() => setImporting(true)}>⤒ {IMPORT_BTN[lang]}</button>}
    </div>
  );
}
