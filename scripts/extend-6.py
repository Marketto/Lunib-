# Una tantum: estende le schede esistenti a 0–6 anni (72 mesi) e aggiunge voci per 3–6 anni.
import json, glob

def A(t, f, to, strict=False):
    d = {"t": t, "from": f, "to": to}
    if strict: d["strict"] = True
    return d

RANGE = {  # nuovo ageTo
  "quanto-dorme": 72, "risvegli-notturni": 72, "non-mangia": 72, "febbre": 72, "antipiretici": 72,
  "convulsioni-febbrili": 60, "stitichezza": 72, "diarrea": 72, "tosse-raffreddore": 72, "dermatite": 72,
  "dentizione": 72, "vaccini": 72, "segnali-autismo": 72, "stimolare-linguaggio": 72, "ritardo-linguaggio": 72,
  "lettura": 72, "bilinguismo": 72, "capricci": 72, "disciplina": 72, "inserimento-nido": 72, "fratellino": 72,
  "vasino": 60, "schermi": 72, "gioco-libero": 72, "seggiolino": 72, "soffocamento": 72, "casa-sicura": 72
}

def by_id(cards, cid):
    return next(c for c in cards if c["id"] == cid)

def both(c, sec, it_item, ru_item, idx=None):
    for lang, item in (("it", it_item), ("ru", ru_item)):
        arr = c[lang].setdefault(sec, [])
        if idx is None: arr.append(item)
        else: arr[idx] = item

def replace_range(c, sec, old, new):
    for lang in ("it", "ru"):
        for x in c[lang][sec]:
            if isinstance(x, dict) and (x["from"], x["to"]) == old:
                x["from"], x["to"] = new

files = {p: json.load(open(p)) for p in glob.glob("content/cards/*.json")}
cards = {c["id"]: (p, c) for p, lst in files.items() for c in lst}
C = lambda cid: cards[cid][1]

for cid, to in RANGE.items():
    C(cid)["ageTo"] = to

# Sonno: 3–5 anni e 6 anni
c = C("quanto-dorme")
for lang in ("it", "ru"):
    for x in c[lang]["research"]:
        if isinstance(x, dict) and (x["from"], x["to"]) == (36, 48):
            x["to"] = 72
            x["t"] = ("OMS (2019) e American Academy of Sleep Medicine: tra 3 e 5 anni 10–13 ore nelle 24 ore, riposino compreso."
                      if lang == "it" else
                      "ВОЗ (2019) и Американская академия медицины сна: в 3–5 лет — 10–13 часов в сутки, включая дневной сон.")
both(c, "tips", A("Verso i 3–5 anni molti bambini smettono il riposino: se la sera è stanchissimo, anticipa un po' la nanna.", 36, 72),
     A("К 3–5 годам многие дети перестают спать днём: если вечером ребёнок очень устал, укладывайте его чуть раньше.", 36, 72))

# Neofobia (Dovey 2008; Taylor & Emmett 2019)
c = C("non-mangia")
c["sources"] = ["A20", "A21", "D15", "D15b"]
both(c, "research", "La paura dei cibi nuovi (neofobia) compare verso i 2 anni, è più marcata in età prescolare (circa 2–6 anni) e poi tende a ridursi (Dovey 2008).",
     "Страх новой еды (неофобия) появляется около 2 лет, сильнее всего выражен в дошкольном возрасте (примерно 2–6 лет) и затем ослабевает (Dovey, 2008).", idx=1)
both(c, "research", "Nella coorte inglese ALSPAC i bambini \"schizzinosi\" erano il 10% a 2 anni, il 15% verso i 3 anni, e poi diminuivano (Taylor ed Emmett 2019).",
     "В английской когорте ALSPAC «привередливых» детей было 10% в 2 года, около 15% к 3 годам, затем меньше (Taylor, Emmett, 2019).")

# Linguaggio: 4 e 5 anni (CDC/AAP 2022)
c = C("ritardo-linguaggio")
for lang in ("it", "ru"):
    arr = c[lang]["research"]
    i = next(k for k, x in enumerate(arr) if isinstance(x, dict) and x["from"] == 36)
    arr[i]["to"] = 48
    new = [
        A("Tappe CDC/AAP: a 4 anni dice frasi di almeno 4 parole, racconta qualcosa della sua giornata e risponde a domande semplici (\"A cosa serve il cappotto?\").", 48, 60),
        A("Tappe CDC/AAP: a 5 anni racconta una storia con almeno due eventi, risponde a domande su un libro letto insieme, sostiene una conversazione con più di tre scambi e riconosce semplici rime.", 60, 72)
    ] if lang == "it" else [
        A("Этапы CDC/AAP: в 4 года говорит предложениями из 4 и более слов, рассказывает о своём дне и отвечает на простые вопросы («Для чего нужно пальто?»).", 48, 60),
        A("Этапы CDC/AAP: в 5 лет рассказывает историю хотя бы из двух событий, отвечает на вопросы о прочитанной книге, поддерживает разговор более чем из трёх обменов репликами и узнаёт простые рифмы.", 60, 72)
    ]
    arr[i + 1:i + 1] = new
    rf = c[lang]["redFlags"]
    j = next(k for k, x in enumerate(rf) if isinstance(x, dict) and x["from"] == 36)
    rf[j]["to"] = 48
    rf.insert(j + 1, A("A 4–5 anni parla per lo più con parole singole o frasi molto brevi, o non riesce a raccontare cosa ha fatto." if lang == "it"
                       else "В 4–5 лет говорит в основном отдельными словами или очень короткими фразами либо не может рассказать, что делал.", 48, 72))

# Lettura 3–6
c = C("lettura")
both(c, "tips", A("Dai 3 anni: lascia che sia lui a raccontare la storia guardando le figure, chiedi cosa pensa che succederà e collegala alla sua vita.", 36, 72),
     A("С 3 лет: пусть он сам рассказывает историю по картинкам, спрашивайте, что будет дальше, и связывайте её с его жизнью.", 36, 72))

# Schermi: 3–4 anni fino a 60, dai 5 anni OMS 2020 + AAP età scolare
c = C("schermi")
replace_range(c, "research", (36, 48), (36, 60))
for lang in ("it", "ru"):
    for x in c[lang]["research"]:
        if isinstance(x, dict) and (x["from"], x["to"]) == (36, 60):
            x["t"] = "Linee guida OMS (2019): da 3 a 4 anni al massimo 1 ora al giorno, e meno è meglio." if lang == "it" else "Рекомендации ВОЗ (2019): в 3–4 года — не больше 1 часа в день, и чем меньше, тем лучше."
c["sources"] = ["A3", "B25", "B26", "D4", "D12"]
both(c, "research", A("OMS (2020): dai 5 anni limitare il tempo seduti, soprattutto davanti agli schermi per svago.", 60, 72),
     A("ВОЗ (2020): с 5 лет ограничивать время сидя, особенно перед экранами для развлечения.", 60, 72))
both(c, "tips", A("Dai 5 anni (AAP): fate un piano familiare con regole su tempi e contenuti, niente dispositivi nell'ora prima di dormire e niente schermi in camera da letto.", 60, 72),
     A("С 5 лет (AAP): составьте семейный план с правилами по времени и содержанию, никаких устройств за час до сна и в спальне.", 60, 72))

# Gioco: OMS 3–4 e 5+
c = C("gioco-libero")
c["sources"] = ["B27", "A3", "D3", "D4"]
both(c, "research", A("OMS (2019): a 3–4 anni almeno 180 minuti di attività fisica al giorno, di cui almeno 60 di movimento vivace.", 36, 60),
     A("ВОЗ (2019): в 3–4 года — не меньше 180 минут физической активности в день, из них не меньше 60 минут активного движения.", 36, 60))
both(c, "research", A("OMS (2020): dai 5 anni in media almeno 60 minuti al giorno di attività moderata o intensa.", 60, 72),
     A("ВОЗ (2020): с 5 лет в среднем не меньше 60 минут умеренной или интенсивной активности в день.", 60, 72))

# Seggiolino: dopo la contromarcia
c = C("seggiolino")
c["sources"] = ["A25", "A26", "D11"]
both(c, "research", A("AAP: dopo la contromarcia, seggiolino in avanti con imbracatura a 5 punti il più a lungo possibile; poi rialzo con schienale finché la cintura dell'auto non sta bene (di solito intorno ai 145 cm, tra 8 e 12 anni).", 24, 72),
     A("AAP: после положения против хода — кресло по ходу с 5-точечными ремнями как можно дольше; затем бустер со спинкой, пока ремень автомобиля не будет правильно прилегать (обычно около 145 см, в 8–12 лет).", 24, 72))
both(c, "research", "Codice della Strada (art. 172): i bambini sotto 1,50 m devono viaggiare con un sistema di ritenuta omologato adatto al loro peso.",
     "Правила дорожного движения Италии (ст. 172): дети ростом ниже 1,50 м должны ездить в сертифицированном удерживающем устройстве, подходящем по весу.")
both(c, "tips", A("Tutti i bambini viaggiano sul sedile posteriore.", 24, 72),
     A("Все дети ездят на заднем сиденье.", 24, 72))

# Nido -> anche scuola dell'infanzia
c = C("inserimento-nido")
c["it"]["title"] = "Inserimento al nido o alla scuola dell'infanzia"
c["ru"]["title"] = "Адаптация в яслях и детском саду"
for lang, kw in (("it", ["scuola dell'infanzia", "materna", "primo giorno di scuola"]), ("ru", ["детский сад", "первый день в саду"])):
    c[lang]["keywords"] += kw

replace_range(C("dentizione"), "research", (24, 48), (24, 72))
for p, lst in files.items():
    json.dump(lst, open(p, "w"), ensure_ascii=False, indent=2)
print("ok")
