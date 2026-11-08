# Una tantum: nuove schede per 3–6 anni (fonti verificate D1–D14).
import json

def A(t, f, to, strict=False):
    d = {"t": t, "from": f, "to": to}
    if strict: d["strict"] = True
    return d

NEW = {
"salute": [{
  "id": "pipi-a-letto", "category": "salute", "ageFrom": 36, "ageTo": 72, "alert": "pediatra", "evidence": "alta",
  "sources": ["D5b", "D5", "D5c"],
  "it": {
    "title": "Fa ancora la pipì a letto",
    "summary": "Bagnare il letto di notte è comune nei bambini piccoli: si parla di enuresi solo dai 5 anni, e ogni anno una parte dei bambini smette da sola.",
    "keywords": ["pipì a letto", "enuresi", "bagna il letto", "pannolino di notte", "notte asciutta", "si fa la pipì addosso di notte", "allarme enuresi"],
    "research": [
      "Secondo la International Children's Continence Society (Austin 2016) si parla di enuresi notturna solo dai 5 anni: prima è parte del normale sviluppo.",
      "In uno studio su 1129 bambini (Forsythe 1974) ogni anno circa il 14–16% dei bambini con enuresi smetteva spontaneamente.",
      "Le linee guida ICCS (Nevéus 2020) indicano come trattamenti di prima scelta l'allarme notturno o la desmopressina, in genere dai 6 anni, dopo una valutazione del pediatra."
    ],
    "tips": [
      "Non punire e non rimproverare: il bambino non lo fa apposta e non riesce a controllarlo.",
      "Fai bere bene durante il giorno e meno nell'ora prima della nanna; pipì prima di dormire.",
      "Usa una traversa o un coprimaterasso per ridurre lo stress di tutti.",
      A("Se ha già 5 anni e la cosa lo fa soffrire, parlane col pediatra: esistono trattamenti efficaci.", 60, 72)
    ],
    "redFlags": [
      "Si bagna anche di giorno o fa fatica a fare la pipì.",
      "Stitichezza frequente.",
      "Ha sempre molta sete o beve moltissimo.",
      "Torna a bagnarsi dopo essere stato asciutto a lungo, o la cosa lo fa soffrire molto."
    ]
  },
  "ru": {
    "title": "Всё ещё писается ночью",
    "summary": "Ночное недержание мочи часто встречается у маленьких детей: об энурезе говорят только с 5 лет, и каждый год часть детей перестаёт сама.",
    "keywords": ["писается ночью", "энурез", "мокрая постель", "ночной подгузник", "сухие ночи", "будильник от энуреза"],
    "research": [
      "По данным Международного общества детской континенции (Austin, 2016), о ночном энурезе говорят только с 5 лет: до этого это часть нормального развития.",
      "В исследовании 1129 детей (Forsythe, 1974) каждый год примерно 14–16% детей с энурезом переставали писаться сами.",
      "Рекомендации ICCS (Nevéus, 2020): методы первого выбора — ночной будильник-сигнализатор или десмопрессин, обычно с 6 лет, после осмотра педиатра."
    ],
    "tips": [
      "Не наказывайте и не ругайте: ребёнок делает это не нарочно и не может это контролировать.",
      "Пусть хорошо пьёт днём и меньше за час до сна; перед сном — в туалет.",
      "Используйте впитывающую пелёнку или наматрасник, чтобы всем было спокойнее.",
      A("Если ребёнку уже 5 лет и он из-за этого переживает, обсудите с педиатром: есть эффективное лечение.", 60, 72)
    ],
    "redFlags": [
      "Мочится и днём или с трудом мочится.",
      "Частые запоры.",
      "Постоянно хочет пить или пьёт очень много.",
      "Снова начал писаться после долгого «сухого» периода или очень переживает."
    ]
  }
}],
"sonno": [{
  "id": "incubi-terrori", "category": "sonno", "ageFrom": 18, "ageTo": 72, "alert": "pediatra", "evidence": "moderata",
  "sources": ["D6", "D7", "D7b"],
  "it": {
    "title": "Incubi e terrori notturni",
    "summary": "Nel terrore notturno il bambino urla ma non è davvero sveglio e al mattino non ricorda nulla; dall'incubo invece si sveglia, ricorda e si calma in braccio.",
    "keywords": ["terrore notturno", "pavor nocturnus", "incubi", "urla di notte", "si sveglia urlando", "brutti sogni", "sonnambulismo", "paura di notte"],
    "research": [
      "In una coorte canadese (Petit 2015) i terrori notturni erano frequentissimi da piccoli: 34% a 18 mesi, poi in calo con l'età; nel complesso li ha avuti più di metà dei bambini.",
      "Una revisione (Leung 2020) spiega che i terrori avvengono nelle prime ore di sonno, dal sonno profondo: il bambino non è sveglio e non ricorda l'episodio.",
      "Gli incubi avvengono più verso il mattino: il bambino si sveglia del tutto, ricorda il sogno e può essere consolato (Kotagal 2009)."
    ],
    "tips": [
      "Durante un terrore notturno non svegliarlo e non scuoterlo: resta vicino e assicurati che non si faccia male.",
      "Dopo un incubo consolalo, ascolta il sogno e rassicuralo che è al sicuro.",
      "Orari regolari e sonno sufficiente riducono gli episodi: la stanchezza li favorisce.",
      "Se i terrori sono frequenti e sempre alla stessa ora, il pediatra può suggerire di svegliarlo dolcemente poco prima."
    ],
    "redFlags": [
      "Episodi molto frequenti, più volte a notte o a qualsiasi ora della notte.",
      "Movimenti ripetitivi sempre uguali, o rischio di farsi male.",
      "Russa forte, fa pause nel respiro o è molto assonnato di giorno."
    ]
  },
  "ru": {
    "title": "Кошмары и ночные страхи",
    "summary": "При ночном страхе ребёнок кричит, но на самом деле не проснулся и утром ничего не помнит; после кошмара он просыпается, помнит сон и успокаивается на руках.",
    "keywords": ["ночные страхи", "ночной ужас", "кошмары", "кричит ночью", "просыпается с криком", "плохие сны", "лунатизм", "страх ночью"],
    "research": [
      "В канадской когорте (Petit, 2015) ночные страхи были очень частыми в раннем возрасте: 34% в 18 месяцев, затем меньше; в целом они были у более чем половины детей.",
      "Обзор (Leung, 2020): ночные страхи возникают в первые часы сна, из глубокого сна; ребёнок не просыпается и не помнит эпизод.",
      "Кошмары бывают ближе к утру: ребёнок полностью просыпается, помнит сон, и его можно утешить (Kotagal, 2009)."
    ],
    "tips": [
      "Во время ночного страха не будите и не трясите ребёнка: будьте рядом и следите, чтобы он не ударился.",
      "После кошмара утешьте, выслушайте сон и скажите, что он в безопасности.",
      "Режим и достаточный сон уменьшают число эпизодов: усталость их провоцирует.",
      "Если страхи частые и всегда в одно время, педиатр может посоветовать мягко будить ребёнка незадолго до этого."
    ],
    "redFlags": [
      "Очень частые эпизоды — несколько раз за ночь или в любое время ночи.",
      "Всегда одинаковые повторяющиеся движения или риск травмы.",
      "Громко храпит, делает паузы в дыхании или очень сонлив днём."
    ]
  }
}],
"linguaggio": [{
  "id": "balbuzie", "category": "linguaggio", "ageFrom": 24, "ageTo": 72, "alert": "pediatra", "evidence": "moderata",
  "sources": ["D8", "D9"],
  "it": {
    "title": "Balbetta: è normale?",
    "summary": "La balbuzie inizia spesso tra 2 e 3 anni e mezzo ed è più comune di quanto si pensi. Molti bambini smettono da soli, ma non sempre entro l'anno: alcuni segnali vanno valutati.",
    "keywords": ["balbuzie", "balbetta", "ripete le sillabe", "si blocca a parlare", "inceppa", "disfluenza", "logopedista"],
    "research": [
      "In uno studio australiano che ha seguito i bambini dalla nascita (Reilly 2013) l'11% aveva iniziato a balbettare entro i 4 anni, per lo più tra i 2 e i 3 anni e mezzo.",
      "Nello stesso studio solo il 6% aveva smesso entro 12 mesi dall'inizio: il recupero, quando arriva, richiede spesso più tempo.",
      "I bambini che balbettavano non avevano un linguaggio, un temperamento o una qualità di vita peggiori degli altri.",
      "Secondo l'ASHA il rischio che persista è maggiore nei maschi, con familiari che balbettano, se dura più di 6–12 mesi o se inizia dopo i 3 anni e mezzo."
    ],
    "tips": [
      "Ascolta con calma e guardalo: conta quello che dice, non come lo dice.",
      "Non finire le parole al posto suo e non dirgli \"rallenta\" o \"respira\".",
      "Parla tu più lentamente e con pause: è un modello più utile di qualsiasi correzione.",
      "Crea momenti tranquilli di chiacchiera, senza fretta e senza domande a raffica."
    ],
    "redFlags": [
      "Tensione evidente nel parlare: smorfie, occhi che sbattono, movimenti della testa.",
      "Il bambino è frustrato, evita di parlare o tu sei preoccupato.",
      "Familiari che balbettano, o balbuzie che dura da più di 6–12 mesi senza migliorare.",
      "Altri dubbi sul linguaggio o sulla pronuncia."
    ]
  },
  "ru": {
    "title": "Заикается: это нормально?",
    "summary": "Заикание часто начинается между 2 и 3,5 годами и встречается чаще, чем кажется. Многие дети перестают сами, но не обязательно в течение года: некоторые признаки стоит оценить.",
    "keywords": ["заикание", "заикается", "повторяет слоги", "запинается", "останавливается на слове", "нарушение плавности речи", "логопед"],
    "research": [
      "В австралийском исследовании, наблюдавшем детей с рождения (Reilly, 2013), у 11% заикание началось до 4 лет, в основном между 2 и 3,5 годами.",
      "В том же исследовании только 6% перестали заикаться в течение 12 месяцев: если заикание проходит, это часто занимает больше времени.",
      "У заикающихся детей речь, темперамент и качество жизни были не хуже, чем у остальных.",
      "По данным ASHA, риск сохранения выше у мальчиков, при заикании у родственников, если оно длится больше 6–12 месяцев или началось после 3,5 лет."
    ],
    "tips": [
      "Слушайте спокойно и смотрите на ребёнка: важно, что он говорит, а не как.",
      "Не договаривайте за него и не говорите «помедленнее» или «вдохни».",
      "Говорите сами медленнее и с паузами — это полезнее любых поправок.",
      "Устраивайте спокойные разговоры без спешки и без потока вопросов."
    ],
    "redFlags": [
      "Заметное напряжение при речи: гримасы, моргание, движения головой.",
      "Ребёнок расстраивается, избегает говорить, или вы обеспокоены.",
      "Заикание у родственников или длится больше 6–12 месяцев без улучшения.",
      "Другие сомнения в речи или произношении."
    ]
  }
}],
"gioco": [{
  "id": "movimento-3-6", "category": "gioco", "ageFrom": 36, "ageTo": 72, "alert": "none", "evidence": "alta",
  "sources": ["D3", "D4"],
  "it": {
    "title": "Quanto movimento serve tra 3 e 6 anni",
    "summary": "A 3–4 anni l'OMS consiglia almeno 3 ore di movimento al giorno, di cui un'ora vivace; dai 5 anni almeno un'ora al giorno di attività moderata o intensa.",
    "keywords": ["movimento", "attività fisica", "sport", "correre", "giocare all'aperto", "sedentario", "quanto deve muoversi", "parco"],
    "research": [
      A("OMS (2019): a 3–4 anni almeno 180 minuti al giorno di attività fisica di qualsiasi intensità, di cui almeno 60 minuti di movimento moderato o vivace, distribuiti nella giornata.", 36, 60),
      A("OMS (2019): a 3–4 anni non tenerlo fermo (passeggino, seggiolino) per più di 1 ora di fila; quando sta seduto, meglio leggere e raccontare storie insieme.", 36, 60),
      A("OMS (2020): dai 5 anni una media di almeno 60 minuti al giorno di attività moderata o intensa, e almeno 3 giorni a settimana giochi più intensi che rinforzano muscoli e ossa.", 60, 72)
    ],
    "tips": [
      "Non serve uno sport organizzato: correre, saltare, arrampicarsi, andare in bicicletta e ballare contano tutti.",
      "Ogni giorno un po' di tempo all'aperto, anche con il brutto tempo se vestiti bene.",
      "Usa le gambe nella vita di tutti i giorni: andare a piedi all'asilo, fare le scale.",
      "Muoviti con lui: i bambini imitano gli adulti."
    ]
  },
  "ru": {
    "title": "Сколько движения нужно с 3 до 6 лет",
    "summary": "В 3–4 года ВОЗ советует не меньше 3 часов движения в день, из них час активного; с 5 лет — не меньше часа в день умеренной или интенсивной активности.",
    "keywords": ["движение", "физическая активность", "спорт", "бегать", "игры на улице", "малоподвижность", "сколько должен двигаться", "площадка"],
    "research": [
      A("ВОЗ (2019): в 3–4 года не меньше 180 минут физической активности любой интенсивности в день, из них не меньше 60 минут умеренной или активной, в течение дня.", 36, 60),
      A("ВОЗ (2019): в 3–4 года не держать ребёнка неподвижным (коляска, кресло) больше 1 часа подряд; когда он сидит, лучше читать и рассказывать истории вместе.", 36, 60),
      A("ВОЗ (2020): с 5 лет в среднем не меньше 60 минут умеренной или интенсивной активности в день и не меньше 3 дней в неделю более интенсивные игры для мышц и костей.", 60, 72)
    ],
    "tips": [
      "Организованный спорт не обязателен: бег, прыжки, лазание, велосипед и танцы — всё считается.",
      "Каждый день немного на улице, даже в плохую погоду, если тепло одеты.",
      "Двигайтесь в повседневной жизни: пешком в садик, по лестнице.",
      "Двигайтесь вместе: дети подражают взрослым."
    ]
  }
}],
"emozioni": [{
  "id": "paure", "category": "emozioni", "ageFrom": 24, "ageTo": 72, "alert": "pediatra", "evidence": "moderata",
  "sources": ["D14", "D14b"],
  "it": {
    "title": "Paure del buio, dei mostri e amici immaginari",
    "summary": "Paura del buio, dei mostri, degli animali o di separarsi sono tipiche dell'età prescolare e di solito si attenuano crescendo. Anche l'amico immaginario è normale.",
    "keywords": ["paura del buio", "paura dei mostri", "paure", "ha paura", "amico immaginario", "fantasia", "ansia", "paura di separarsi", "non vuole dormire da solo"],
    "research": [
      "Una revisione di un secolo di studi (Gullone 2000) descrive le paure del buio, delle creature immaginarie, degli animali e della separazione come comuni e normali in età prescolare, in calo con l'età.",
      "Le paure diventano un problema quando sono eccessive per l'età, durano a lungo e limitano la vita quotidiana del bambino o della famiglia.",
      "In uno studio americano (Taylor 2004) il 65% dei bambini aveva avuto un amico immaginario entro i 7 anni: è un segno di fantasia, non di un problema."
    ],
    "tips": [
      "Prendi sul serio la paura senza ridicolizzarla: \"Capisco che il buio ti spaventa\".",
      "Una lucina notturna o un pupazzo \"guardiano\" possono aiutare.",
      "Avvicinati a ciò che spaventa a piccoli passi, insieme e senza forzare.",
      "Limita storie, video e notizie spaventose, soprattutto la sera.",
      "Accogli con curiosità l'amico immaginario: è un modo per esercitare linguaggio ed emozioni."
    ],
    "redFlags": [
      "Una paura molto intensa che dura da mesi e gli impedisce di fare cose normali per la sua età.",
      "Forte angoscia per settimane ogni volta che vi separate, con mal di pancia o rifiuto di andare all'asilo.",
      "Cambiamenti improvvisi dopo un evento difficile (lutto, incidente, separazione)."
    ]
  },
  "ru": {
    "title": "Страх темноты, монстров и воображаемые друзья",
    "summary": "Страх темноты, монстров, животных или расставания типичен для дошкольного возраста и обычно ослабевает с ростом. Воображаемый друг — тоже норма.",
    "keywords": ["страх темноты", "боится монстров", "страхи", "боится", "воображаемый друг", "фантазия", "тревога", "страх разлуки", "не хочет спать один"],
    "research": [
      "Обзор исследований за целый век (Gullone, 2000) описывает страхи темноты, воображаемых существ, животных и разлуки как частые и нормальные у дошкольников, с возрастом они ослабевают.",
      "Страхи становятся проблемой, когда они чрезмерны для возраста, длятся долго и мешают повседневной жизни ребёнка или семьи.",
      "В американском исследовании (Taylor, 2004) у 65% детей к 7 годам был воображаемый друг: это признак фантазии, а не проблемы."
    ],
    "tips": [
      "Относитесь к страху серьёзно и не высмеивайте: «Я понимаю, что темнота тебя пугает».",
      "Помочь может ночник или игрушка-«охранник».",
      "Приближайтесь к пугающему маленькими шагами, вместе и без принуждения.",
      "Ограничьте страшные истории, видео и новости, особенно вечером.",
      "Принимайте воображаемого друга с интересом: так ребёнок тренирует речь и эмоции."
    ],
    "redFlags": [
      "Очень сильный страх, который длится месяцами и мешает делать обычные для возраста вещи.",
      "Сильная тревога неделями при каждом расставании, с болью в животе или отказом идти в садик.",
      "Резкие изменения после тяжёлого события (утрата, авария, развод)."
    ]
  }
}],
"sviluppo": [{
  "id": "tappe-3-6", "category": "sviluppo", "ageFrom": 36, "ageTo": 72, "alert": "pediatra", "evidence": "alta",
  "sources": ["A24"],
  "it": {
    "title": "Cosa sa fare a 4 e 5 anni",
    "summary": "Le tappe CDC/AAP 2022 per i 4 e i 5 anni: movimento, linguaggio e autonomia. Sono fissate in modo che circa il 75% dei bambini le raggiunga entro quell'età.",
    "keywords": ["tappe dello sviluppo", "4 anni", "5 anni", "cosa sa fare", "salta su un piede", "abbottonare", "colori", "disegna", "sviluppo prescolare"],
    "research": [
      A("A 4 anni (movimento): prende al volo una palla grande quasi sempre, si serve da solo il cibo o versa l'acqua con un adulto vicino, slaccia qualche bottone, tiene la matita tra le dita e non nel pugno.", 42, 60),
      A("A 4 anni (linguaggio e pensiero): frasi di almeno 4 parole, racconta qualcosa della sua giornata, nomina alcuni colori, disegna una persona con almeno 3 parti del corpo.", 42, 60),
      A("A 5 anni (movimento): salta su un piede e allaccia qualche bottone.", 54, 72),
      A("A 5 anni (linguaggio): racconta una storia con almeno due eventi, risponde a domande su un libro, riconosce semplici rime.", 54, 72),
      "Ogni bambino ha i suoi tempi: una singola tappa in ritardo, da sola, di solito non è un problema."
    ],
    "tips": [
      "Giochi con la palla, saltelli, percorsi e bici aiutano la coordinazione.",
      "Lascia che si vesta, si serva e apparecchi da solo: l'autonomia si allena.",
      "Disegnare, ritagliare e infilare perline allenano la mano per la scuola.",
      "Fagli raccontare la giornata e le storie che conosce."
    ],
    "redFlags": [
      "Perde abilità che aveva già.",
      "Non riesce a fare diverse cose della sua età, o le insegnanti notano difficoltà.",
      "Dubbi sull'udito o sulla vista."
    ]
  },
  "ru": {
    "title": "Что умеет в 4 и 5 лет",
    "summary": "Этапы CDC/AAP 2022 для 4 и 5 лет: движение, речь и самостоятельность. Они установлены так, что около 75% детей достигают их к этому возрасту.",
    "keywords": ["этапы развития", "4 года", "5 лет", "что умеет", "прыгает на одной ноге", "застёгивает пуговицы", "цвета", "рисует", "развитие дошкольника"],
    "research": [
      A("В 4 года (движение): почти всегда ловит большой мяч, сам накладывает еду или наливает воду при взрослом, расстёгивает некоторые пуговицы, держит карандаш пальцами, а не в кулаке.", 42, 60),
      A("В 4 года (речь и мышление): предложения из 4 и более слов, рассказывает о своём дне, называет несколько цветов, рисует человека хотя бы с 3 частями тела.", 42, 60),
      A("В 5 лет (движение): прыгает на одной ноге и застёгивает некоторые пуговицы.", 54, 72),
      A("В 5 лет (речь): рассказывает историю хотя бы из двух событий, отвечает на вопросы о книге, узнаёт простые рифмы.", 54, 72),
      "У каждого ребёнка свой темп: одна отстающая отдельно взятая ступень обычно не проблема."
    ],
    "tips": [
      "Игры с мячом, прыжки, полосы препятствий и велосипед развивают координацию.",
      "Пусть одевается, накладывает еду и накрывает на стол сам: самостоятельность тренируется.",
      "Рисование, вырезание и нанизывание бусин готовят руку к школе.",
      "Просите рассказать о дне и знакомых историях."
    ],
    "redFlags": [
      "Теряет уже освоенные навыки.",
      "Не может делать многое из того, что умеют сверстники, или воспитатели замечают трудности.",
      "Сомнения в слухе или зрении."
    ]
  }
}]
}

for cat, cards in NEW.items():
    p = f"content/cards/{cat}.json"
    lst = json.load(open(p))
    ids = {c["id"] for c in lst}
    for c in cards:
        if c["id"] in ids:
            lst = [x if x["id"] != c["id"] else c for x in lst]
        else:
            lst.append(c)
    json.dump(lst, open(p, "w"), ensure_ascii=False, indent=2)
print("ok")
