# Una tantum: assegna fasce d'età alle singole voci delle schede (e divide le voci che mescolano più età).
# Voce = stringa (vale per tutta la fascia della scheda) oppure {"t": testo, "from": mesi, "to": mesi}.
import json, glob

def A(t, f, to):
    return {"t": t, "from": f, "to": to}

EDITS = {}

EDITS["quanto-dorme"] = {
  "it": {"research": [
    A("OMS (2019): da 0 a 3 mesi servono 14–17 ore di sonno nelle 24 ore, riposini compresi.", 0, 4),
    A("OMS (2019): da 4 a 11 mesi 12–16 ore nelle 24 ore, riposini compresi.", 4, 12),
    A("OMS e American Academy of Sleep Medicine concordano: da 1 a 2 anni 11–14 ore nelle 24 ore.", 12, 36),
    A("OMS e American Academy of Sleep Medicine: verso i 3–4 anni 10–13 ore nelle 24 ore.", 36, 48),
    "Sono intervalli: ogni bambino ha il suo fabbisogno, e conta più come sta di giorno che il numero esatto."],
   "tips": [
    "Osserva l'umore e l'energia durante il giorno: un bimbo sereno e attivo di solito dorme abbastanza.",
    "Tieni orari regolari per la nanna e la sveglia, anche nel fine settimana.",
    A("Nei primi mesi il sonno è frammentato: è normale e non dipende da errori dei genitori.", 0, 6),
    A("Tra 1 e 3 anni molti bimbi passano da due riposini a uno: segui i segnali di stanchezza.", 12, 36)]},
  "ru": {"research": [
    A("ВОЗ (2019): с 0 до 3 месяцев нужно 14–17 часов сна в сутки, включая дневной.", 0, 4),
    A("ВОЗ (2019): с 4 до 11 месяцев — 12–16 часов в сутки, включая дневной сон.", 4, 12),
    A("ВОЗ и Американская академия медицины сна сходятся: с 1 до 2 лет — 11–14 часов в сутки.", 12, 36),
    A("ВОЗ и Американская академия медицины сна: к 3–4 годам — 10–13 часов в сутки.", 36, 48),
    "Это диапазоны: у каждого ребёнка своя потребность, и важнее самочувствие днём, чем точная цифра."],
   "tips": [
    "Обращайте внимание на настроение и энергию днём: спокойный и активный малыш обычно высыпается.",
    "Сохраняйте постоянное время укладывания и подъёма, в том числе в выходные.",
    A("В первые месяцы сон прерывистый — это нормально и не связано с ошибками родителей.", 0, 6),
    A("Между 1 и 3 годами многие дети переходят с двух дневных снов на один: ориентируйтесь на признаки усталости.", 12, 36)]}
}

def tag(card, lang, section, idx, f, to):
    item = card[lang][section][idx]
    text = item if isinstance(item, str) else item["t"]
    card[lang][section][idx] = A(text, f, to)

# (sezione, indice, from, to) da applicare identici a it e ru
TAGS = {
  "risvegli-notturni": [("tips", 4, 0, 6)],
  "ciuccio": [("research", 0, 0, 12), ("research", 1, 0, 6), ("tips", 1, 0, 12), ("tips", 3, 24, 48)],
  "allattamento": [("research", 0, 0, 12)],
  "antipiretici": [("redFlags", 0, 0, 3)],
  "rigurgito": [("urgent", 1, 0, 3)],
  "stitichezza": [("tips", 0, 6, 48), ("tips", 1, 18, 48), ("tips", 2, 18, 48), ("redFlags", 2, 0, 3)],
  "diarrea": [("redFlags", 0, 0, 6)],
  "dermatite": [("research", 1, 0, 12)],
  "tappe-motorie": [("research", 2, 12, 24), ("redFlags", 0, 6, 24)],
  "segnali-autismo": [("redFlags", 0, 12, 18), ("redFlags", 1, 15, 24)],
  "stimolare-linguaggio": [("research", 2, 0, 12), ("tips", 2, 12, 48)],
  "gioco-libero": [("research", 2, 12, 36), ("tips", 3, 18, 48)],
  "vasino": [],
}

SPLITS = {}

SPLITS["febbre"] = {
  "it": {
    "research": [
      A("Le linee guida NICE (2019) considerano ad alto rischio un bimbo sotto i 3 mesi con temperatura di 38 °C o più.", 0, 3),
      A("Le linee guida NICE (2019) considerano a rischio intermedio un bimbo di 3–6 mesi con temperatura di 39 °C o più.", 3, 6),
      None, None],
    "redFlags": [
      A("Febbre di 39 °C o più in un bimbo di 3–6 mesi.", 3, 6),
      "Febbre che dura più di 3 giorni.",
      None, None],
    "urgent": [A("Febbre di 38 °C o più in un bimbo sotto i 3 mesi.", 0, 3), None, None, None,
      A("Segni di disidratazione importante: niente pipì per molte ore, bocca secca, fontanella infossata.", 0, 18)]
  },
  "ru": {
    "research": [
      A("Рекомендации NICE (2019) относят к группе высокого риска малыша младше 3 месяцев с температурой 38 °C и выше.", 0, 3),
      A("Рекомендации NICE (2019) относят к промежуточному риску ребёнка 3–6 месяцев с температурой 39 °C и выше.", 3, 6),
      None, None],
    "redFlags": [
      A("Температура 39 °C и выше у ребёнка 3–6 месяцев.", 3, 6),
      "Температура держится дольше 3 дней.",
      None, None],
    "urgent": [A("Температура 38 °C и выше у малыша младше 3 месяцев.", 0, 3), None, None, None,
      A("Признаки сильного обезвоживания: нет мочи много часов, сухой рот, запавший родничок.", 0, 18)]
  }
}
# per "febbre" i None significano "mantieni la voce originale successiva"; costruisco a mano sotto

SPLITS["tosse-raffreddore"] = {
  "it": {
    "research": [
      A("Le linee guida NICE (aggiornate 2021) e AAP (Ralston 2014) per la bronchiolite, tipica sotto i 2 anni, non raccomandano di routine antibiotici, broncodilatatori o cortisonici.", 0, 24),
      A("Una revisione Cochrane (Oduwole 2018) indica che il miele probabilmente allevia la tosse più del placebo. Si può dare solo dopo i 12 mesi.", 12, 48),
      A("La FDA sconsiglia gli sciroppi per tosse e raffreddore con decongestionanti o antistaminici sotto i 2 anni per il rischio di effetti collaterali gravi.", 0, 24),
      A("Mai miele sotto i 12 mesi, nemmeno per la tosse: rischio di botulismo.", 0, 12)],
    "tips": [
      "Pulisci il naso con soluzione fisiologica prima dei pasti e della nanna.",
      "Offri pasti più piccoli e frequenti se fa fatica a mangiare.",
      A("Un cucchiaino di miele prima della nanna può calmare la tosse.", 12, 48),
      "Tieni la casa libera dal fumo e lava spesso le mani."],
    "redFlags": [
      "Mangia o beve meno della metà del solito.",
      "Febbre alta, tosse che dura più di 3 settimane o mal d'orecchio.",
      "Respiro affannoso o sibilante.",
      A("Qualsiasi tosse in un bimbo sotto i 3 mesi.", 0, 3)]
  },
  "ru": {
    "research": [
      A("Рекомендации NICE (обновлены в 2021) и AAP (Ralston, 2014) по бронхиолиту, типичному до 2 лет, не советуют рутинно назначать антибиотики, бронхолитики или кортикостероиды.", 0, 24),
      A("Кокрейновский обзор (Oduwole, 2018): мёд, вероятно, облегчает кашель лучше плацебо. Давать его можно только после 12 месяцев.", 12, 48),
      A("FDA не рекомендует детям до 2 лет средства от кашля и простуды с деконгестантами или антигистаминными из-за риска серьёзных побочных эффектов.", 0, 24),
      A("Никакого мёда до 12 месяцев, даже от кашля: риск ботулизма.", 0, 12)],
    "tips": [
      "Очищайте нос физраствором перед едой и сном.",
      "Предлагайте еду меньшими порциями и чаще, если малышу тяжело есть.",
      A("Ложка мёда перед сном может смягчить кашель.", 12, 48),
      "Не курите дома и часто мойте руки."],
    "redFlags": [
      "Ест или пьёт меньше половины обычного.",
      "Высокая температура, кашель дольше 3 недель или боль в ухе.",
      "Тяжёлое или свистящее дыхание.",
      A("Любой кашель у малыша младше 3 месяцев.", 0, 3)]
  }
}

SPLITS["dentizione"] = {
  "it": {"research": [None,
      A("Linee guida europee (EAPD, Toumba 2019): dal primo dente ai 2 anni dentifricio a 1000 ppm di fluoro, in quantità pari a un chicco di riso.", 0, 24),
      A("Linee guida europee (EAPD, Toumba 2019): da 2 a 6 anni dentifricio a 1000 ppm, in quantità pari a un pisello.", 24, 48),
      None],
    "redFlags": [None, None, A("Nessun dente a 18 mesi.", 12, 24)]},
  "ru": {"research": [None,
      A("Европейские рекомендации (EAPD, Toumba, 2019): от первого зуба до 2 лет — паста с 1000 ppm фтора размером с рисовое зёрнышко.", 0, 24),
      A("Европейские рекомендации (EAPD, Toumba, 2019): с 2 до 6 лет — паста с 1000 ppm размером с горошину.", 24, 48),
      None],
    "redFlags": [None, None, A("Ни одного зуба к 18 месяцам.", 12, 24)]}
}

SPLITS["ritardo-linguaggio"] = {
  "it": {
    "research": [
      A("Tappe CDC/AAP (Zubler 2022): a 12 mesi chiama mamma o papà con un nome speciale e fa ciao con la mano.", 12, 18),
      A("Tappe CDC/AAP: a 18 mesi prova a dire almeno 3 parole oltre a mamma e papà.", 18, 24),
      A("Tappe CDC/AAP: a 24 mesi dice almeno 2 parole insieme, per esempio \"altra pappa\".", 24, 30),
      A("Tappe CDC/AAP: a 30 mesi dice circa 50 parole.", 30, 36),
      A("Tappe CDC/AAP: a 36 mesi fa conversazioni con almeno due scambi di battute.", 36, 48),
      "Le tappe sono fissate in modo che circa il 75% dei bambini le raggiunga entro quell'età.",
      "Valutare presto non significa etichettare: aiuta a capire se serve un sostegno, ad esempio un controllo dell'udito o del logopedista."],
    "redFlags": [
      A("A 12 mesi non lalla, non indica e non fa gesti come ciao.", 12, 18),
      A("A 18 mesi non dice parole oltre a mamma e papà, o non capisce richieste semplici.", 18, 24),
      A("A 24 mesi non unisce due parole.", 24, 36),
      A("A 36 mesi è difficile da capire anche per i familiari.", 36, 48),
      "Perdita di parole già acquisite, o dubbi sull'udito: parlane subito."]
  },
  "ru": {
    "research": [
      A("Этапы CDC/AAP (Zubler, 2022): в 12 месяцев зовёт маму или папу особым словом и машет «пока».", 12, 18),
      A("Этапы CDC/AAP: в 18 месяцев пытается сказать хотя бы 3 слова, кроме «мама» и «папа».", 18, 24),
      A("Этапы CDC/AAP: в 24 месяца соединяет хотя бы 2 слова, например «ещё каши».", 24, 30),
      A("Этапы CDC/AAP: в 30 месяцев говорит около 50 слов.", 30, 36),
      A("Этапы CDC/AAP: в 36 месяцев ведёт разговор хотя бы из двух обменов репликами.", 36, 48),
      "Этапы установлены так, что около 75% детей достигают их к указанному возрасту.",
      "Ранняя оценка — не ярлык: она помогает понять, нужна ли поддержка, например проверка слуха или логопед."],
    "redFlags": [
      A("В 12 месяцев не лепечет, не показывает пальцем и не машет «пока».", 12, 18),
      A("В 18 месяцев не говорит слов, кроме «мама» и «папа», или не понимает простых просьб.", 18, 24),
      A("В 24 месяца не соединяет два слова.", 24, 36),
      A("В 36 месяцев его трудно понять даже близким.", 36, 48),
      "Потеря уже освоенных слов или сомнения в слухе: обсудите сразу."]
  }
}

SPLITS["lettura"] = {
  "it": {"tips": [
      A("Da 0 a 6 mesi: libri con immagini grandi e contrastate, voce cantilenante, ritmo.", 0, 6),
      A("Da 6 a 18 mesi: libri cartonati da toccare e mordicchiare, figure da indicare e nominare.", 6, 18),
      A("Dopo i 18 mesi: storie brevi, domande aperte (\"Cosa succede adesso?\"), rileggere gli stessi libri tutte le volte che li chiede.", 18, 48),
      "Rendi la lettura un momento fisso, ad esempio prima della nanna."]},
  "ru": {"tips": [
      A("0–6 месяцев: книги с крупными контрастными картинками, напевный голос, ритм.", 0, 6),
      A("6–18 месяцев: картонные книжки, которые можно трогать и грызть, картинки, чтобы показывать и называть.", 6, 18),
      A("После 18 месяцев: короткие истории, открытые вопросы («Что сейчас будет?»), перечитывайте одни и те же книги, сколько попросит.", 18, 48),
      "Сделайте чтение постоянным ритуалом, например перед сном."]}
}

SPLITS["schermi"] = {
  "it": {"research": [
      A("Linee guida OMS (2019): prima dei 2 anni il tempo davanti agli schermi non è raccomandato.", 0, 24),
      A("Linee guida OMS (2019): a 2 anni non più di 1 ora al giorno, e meno è meglio.", 24, 36),
      A("Linee guida OMS (2019): da 3 a 4 anni al massimo 1 ora al giorno.", 36, 48),
      A("L'AAP (2016) sconsiglia gli schermi sotto i 18 mesi, salvo le videochiamate con i familiari.", 0, 18),
      A("AAP (2016): tra 18 e 24 mesi, se si usano, contenuti di qualità guardati insieme a un adulto.", 18, 24),
      A("Uno studio di coorte (Madigan 2019) ha associato più tempo davanti agli schermi a 24 e 36 mesi a risultati peggiori nei test di sviluppo nei mesi successivi.", 18, 48)]},
  "ru": {"research": [
      A("Рекомендации ВОЗ (2019): до 2 лет экранное время не рекомендуется.", 0, 24),
      A("Рекомендации ВОЗ (2019): в 2 года — не больше 1 часа в день, и чем меньше, тем лучше.", 24, 36),
      A("Рекомендации ВОЗ (2019): в 3–4 года — не больше 1 часа в день.", 36, 48),
      A("AAP (2016) не рекомендует экраны до 18 месяцев, кроме видеозвонков с родными.", 0, 18),
      A("AAP (2016): в 18–24 месяца, если используются, — качественный контент вместе со взрослым.", 18, 24),
      A("Когортное исследование (Madigan, 2019) связало большее экранное время в 24 и 36 месяцев с худшими результатами тестов развития в последующие месяцы.", 18, 48)]}
}

def apply_split(card, lang, section, new):
    old = card[lang][section]
    if all(x is not None for x in new):
        card[lang][section] = new
        return
    # None = mantieni la voce originale con lo stesso indice "logico" (in ordine)
    out, oi = [], 0
    for x in new:
        if x is None:
            out.append(old[oi]); oi += 1
        else:
            out.append(x)
            # se la nuova voce sostituisce una voce originale, salta quella originale
    card[lang][section] = out

for path in sorted(glob.glob("content/cards/*.json")):
    cards = json.load(open(path))
    for c in cards:
        cid = c["id"]
        if cid in EDITS:
            for lang, secs in EDITS[cid].items():
                c[lang].update(secs)
        for (sec, idx, f, to) in TAGS.get(cid, []):
            for lang in ("it", "ru"):
                tag(c, lang, sec, idx, f, to)
        if cid in SPLITS:
            for lang, secs in SPLITS[cid].items():
                for sec, new in secs.items():
                    if cid == "febbre":
                        old = c[lang][sec]
                        if sec == "research":
                            c[lang][sec] = new[:2] + old[1:]
                        elif sec == "redFlags":
                            c[lang][sec] = new[:2] + old[1:]
                        elif sec == "urgent":
                            c[lang][sec] = [new[0]] + old[1:4] + [new[4]]
                    elif cid == "dentizione":
                        old = c[lang][sec]
                        if sec == "research":
                            c[lang][sec] = [old[0], new[1], new[2], old[2]]
                        else:
                            c[lang][sec] = old[:2] + [new[2]]
                    else:
                        c[lang][sec] = new
    json.dump(cards, open(path, "w"), ensure_ascii=False, indent=2)
print("ok")
