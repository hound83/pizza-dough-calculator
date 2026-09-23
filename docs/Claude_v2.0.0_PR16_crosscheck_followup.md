# Crosscheck v2.0.0 — hertoets na de reviewreactie (PR #16)

**Branch:** `feature/v2.0-kitchen-workflow` · commit `f242cac` ("address v2 review and simplify optional Basic readings")
**Vorige toets:** `81c06ec`, beschreven in [Claude_v2.0.0_PR16_crosscheck.md](Claude_v2.0.0_PR16_crosscheck.md)
**Basis:** release v1.4.1 / `main` `0674eed`
**Kandidaathashes:** single file `259d3cce…2bfe` · CSS `5a6f1dcb…29c9` · JS `ca4537f6…f8ff`. Gelijk in `tests/baselines/v2.0.0-candidate.json`, `PRODUCT_GUARDRAILS.md` en de verse bundel uit `src/`.
**Gelezen:** `V2_0_0_CLAUDE_FOLLOWUP.md`, de bijgewerkte `CLAUDE.md`, `ARCHITECTURE.md`, `PRODUCT_GUARDRAILS.md` en de volledige codewijziging van `cf1669a` naar `f242cac`
**Omgeving:** Windows 11 ARM64 · Microsoft Edge 151 (Chromium) via Playwright 1.62.1 · Node 24.19 · tijdzone Europe/Amsterdam met gecontroleerde klok · NL + EN

---

## 0. Oordeel

**Alle drie de bevindingen zijn opgelost, en de nieuwe Basis/Uitgebreid-flow introduceert geen regressie die ik kan meten.** Wat mij betreft blokkeert er van mijn kant niets meer een release.

| Controle | Uitkomst |
|---|---|
| `npm run test:fast` | ✅ 15 structuur · 31 kern · 106 bundel · 106 bron |
| Playwright-suite in Edge 151, `retries:0`, twee volledige runs | ✅ **139/139** · ◐ 138/139 in de tweede run: één downloadtest, zie §5 |
| Rekenkern v1.4.1 ↔ v2.0, 1.008 configuraties | ✅ 0 verschillen |
| Massabehoud ouder → beurten, 630 verdelingen | ✅ 0 afwijkingen |
| Migratie van een echt v1.4.1-profiel, beide modi + vol geheugen | ✅ alles behouden, ook na twee keer herladen |
| Mijn drie v2-bevindingen | ✅ alle drie opgelost |
| Basis/Uitgebreid, metingen optioneel | ✅ geen recept-, meting- of voortgangsverlies |
| Smoke 168 · EN-sweep 818 knopen · subgram 1.104 · 6 viewports | ✅ schoon |

Eén nieuw klein punt: na een **toetsenbord**bevestiging in de keuken valt de focus terug op `body` (§3). De fix is geverifieerd.

**Over mijn eigen voorstel.** Jullie hebben mijn opstartpatch bewust niet letterlijk overgenomen, met het argument dat het schrijverschap dan tijdens het laden nog `true` is en de revisiecontrole dat niet afvangt als de geladen en opgeslagen revisie gelijk zijn. **Dat klopt, en dat is een betere oplossing dan de mijne.** De gekozen aanpak — de app `inert` houden, schrijverschap standaard `false`, en `data-app-ready` als expliciete grens — lost zowel het gebruikersprobleem als de testwedloop op zonder dat gat.

---

## 1. De drie bevindingen, opnieuw getoetst

| Bevinding | Reproductie op `f242cac` | Uitkomst |
|---|---|---|
| **§1.1** eerste tik na typen | Typ 26 in "Direct na kneden gemeten", tik één keer op "Afwerken klaar · bulk gestart" | ✅ meting 26 °C **én** moment geregistreerd; keuken toont "Bulkrijs" |
| idem, toetsenbord | Typ 25,5 · Tab naar de hoofdactie · Enter | ✅ meting en moment allebei vastgelegd |
| idem, bakvolgorde | Typ naam "Lyndsey", tik één keer op "In oven" | ✅ naam bewaard, pizza in de oven, ook in de opslag |
| idem, plan | Typ capaciteit 1200 g, tik op "Start deeg" | ✅ capaciteit toegepast: **2 beurten** (was 1 beurt op `81c06ec`) |
| **§1.2** opstart | Bij het `load`-event | ✅ `.app` is `inert`, `aria-busy="true"`, Plan is de actieve sectie, status "Calculator laden…", `data-app-ready` nog niet gezet |
| idem, na afloop | Na de vergrendeling | ✅ `inert` uit, status verborgen, `data-app-ready="true"`, schrijver `true`, niets weggeschreven vóór dat moment |
| idem, zonder Web Locks | `navigator.locks` verwijderd | ✅ app wordt klaar, rekent door, schrijver blijft `false`, melding zichtbaar, **oude opslagsleutel blijft staan** |
| **§1.3** "Gedaan, tijd onbekend" | Alle vier momenten doorlopen | ✅ telkens precies één knop, en die hoort bij het eerstvolgende moment |

Het oude keuzescherm knippert niet meer: bij `load` staat Plan al klaar.

## 2. De nieuwe Basis/Uitgebreid-flow

Michael's wijziging maakt de metingen optioneel. Wat ik heb gecontroleerd, telkens met echte klikken:

```
Basis        uitklap "Temperatuur meten — optioneel" dicht · "Koelkasttemperatuur — optioneel" dicht
Uitgebreid   allebei open
meting 25,5 in Uitgebreid → samenvatting toont "Temperatuur meten — optioneel · 25,5 °C"
terug naar Basis          → dicht, maar de waarde blijft in de samenvatting zichtbaar
Engels                    → "Measure temperature — optional · 25.5 °C"
herladen                  → modus, meting en taal blijven staan
```

- **Recept onaangeroerd** bij elke wissel: pizza-aantal, hydratatie, gist (0,9 g) en bloem (530 g) identiek voor en na.
- **Gistvergrendeling werkt nog**: na een meting staat er "Deeg al gemengd · gist staat vast" en is de knop uit.
- **De meting is geen genummerde stap meer**: de voortgang gaat over 19 stappen, en een oud `s-doughtemp`-vinkje blijft wél in de opslag staan maar telt niet mee (voortgang 1 van 19 bij één afgevinkte stap).
- De schakelaar Basis/Uitgebreid staat nu alleen op Plan; vanuit de Keuken ga je daarvoor terug. Dat is een bewuste keuze uit het reviewdocument, geen bevinding.

## 3. Nieuw klein punt · toetsenbordfocus na een bevestiging

**Reproductie:** Tab naar "Afwerken klaar · bulk gestart" en druk op Enter.

```
vóór Enter   focus op de knop "Afwerken klaar · bulk gestart"
na Enter     moment geregistreerd ✅ · focus staat op <body> ❌
```

Een toetsenbordgebruiker begint daarna weer bovenaan de pagina. Het herstel in `replaceWorkshopPanel()` (batch-workflow.js) zoekt een knop met exact dezelfde `dataset`; bij een overgang wordt de knop juist vervangen door de volgende actie, dus die match bestaat niet. Bij een gewone hertekening zónder actiewissel werkt het herstel wel.

**Fix, geverifieerd door injectie:** val terug op de nieuwe hoofdactie van hetzelfde paneel.

```js
else if(actionData){
  const same=[...root.querySelectorAll(actionSelector)].find(el=>JSON.stringify(el.dataset)===actionData);
  (same||root.querySelector('.btn.primary[data-evening-action],.btn.primary[data-workshop-action]')||root.querySelector(actionSelector))?.focus({preventScroll:true});
}
```

Resultaat: na Enter staat de focus op "Koelkast in · bulk", precies de volgende handeling. Een hertekening zonder actiewissel houdt de focus waar hij stond.

## 4. Regressiecontrole op deze commit

```
rekenkern v1.4.1 ↔ v2.0        1.008 configuraties · 124.848 veldvergelijkingen · 0 verschillen
verdeling over beurten         630 gevallen (309 met meerdere beurten) · 0 afwijkingen in massa, water of gist
migratie echt v1.4.1-profiel   modus "volledig" en "alleen deeg": 6 pizza's, 4 vinkjes, 25,5 °C, archiefavond,
                               recept, profiel en logboeknotitie behouden, ook na twee keer herladen
migratie met vol geheugen      pizzaCalcV52 blijft staan, waarschuwing zichtbaar, avond werkt in de sessie
twee tabbladen                 tweede tabblad leest, schrijft niet (saveState() = false), neemt over na sluiten + herladen
zonder Web Locks               alleen-lezen met uitleg; oude sleutel niet verwijderd, niets overschreven
mijn acht v1.4-bevindingen     alle acht nog steeds opgelost (klok terug, oveninstellingen, meldingen, voorstel,
                               "-0 g" 0/336, JSON-melding, Gepland/Verwacht/Werkelijk, Bak A/B)
smoke                          168 combinaties · 0 NaN/Infinity/undefined/[object · 0 pageErrors
EN-sweep met lopende avond     818 tekstknopen · 0 Nederlandse resten
subgramweergave                92 recepten × 6 diameters × 2 talen · 0 treffers
viewports 320–1280             plan en keuken · 0 px horizontale scroll
update()                       v1.4.1 5,95 ms → v2.0 6,31 ms · met lopende avond 7,78 ms → 10,69 ms
```

## 5. Over de testsuite

Met `retries:0` draaide ik de volledige suite twee keer:

| Run | Uitkomst |
|---|---|
| 1 | **139/139** in 5,4 min |
| 2 | 138/139 · `workshop.spec.js:83` "named recipes compare and round trip" → `download.path: canceled` |

Dezelfde test viel gisteren ook uit, en slaagt allebei de keren wél wanneer ik hem apart draai. Ik houd het op mijn omgeving (Edge op Windows, downloads via een blob-URL), en niet op de app: de exportknop werkt in al mijn eigen scenario's en het bestand klopt inhoudelijk. Let er wel op dat retries nu op 0 staan, dus zo'n uitvaller maakt de CI rood zodra hij daar ook optreedt. Wil je die test robuuster maken, dan is `download.saveAs(...)` of het bestand in de pagina zelf controleren stabieler dan `download.path()`.

De rest van de wedloop is weg: dat is precies wat `data-app-ready` heeft opgelost. Mijn eigen harnas wacht nu op die vlag.

## 6. Wat aantoonbaar goed is

- **De vasthoudconstructie werkt breder dan mijn voorstel.** Muis, aanraking én toetsenbord zijn afgedekt, inclusief annuleren en het verlaten van het venster, en de toestand wordt nog steeds meteen opgeslagen. Mijn eigen eerste poging verloor juist de pizzanaam; deze niet.
- **De opstartgrens is expliciet.** `inert` plus `aria-busy` plus een zichtbare laadmelding plus `data-app-ready` maakt zowel de app als de suite voorspelbaar, en het schrijverschap staat pas vast als de vergrendeling is afgehandeld.
- **Zonder Web Locks blijft de app eerlijk**: rekenen mag, opslaan niet, en de oude gegevens blijven onaangetast staan in plaats van half overschreven te worden.
- **De metingen zijn optioneel geworden zonder iets te verliezen**: geen herberekening, geen verlies van waarden of voortgang, en het oude vinkje blijft bewaard zonder mee te tellen.
- **De rekenkern en de verdeling zijn onveranderd.** `evening-core.js` is byte-identiek aan de vorige toets; pariteit en massabehoud bevestigen dat aan de buitenkant.

## 7. Prioriteit

| | Punt | Omvang | Wanneer |
|---|---|---|---|
| 1 | §3 toetsenbordfocus na een bevestiging | 2 regels in `replaceWorkshopPanel` | wanneer het uitkomt |
| 2 | §5 downloadtest robuuster maken | testwijziging, geen appwijziging | wanneer het uitkomt |

## 8. Methodische noot

- Ik heb de drie bevindingen elk opnieuw met echte invoer nagebouwd, niet met functieaanroepen: typen met vertraging, één tik, en apart een toetsenbordpad met Tab en Enter.
- De suite draaide ik twee keer volledig om te zien of de wedloop echt weg is. Dat is de directe opvolging van mijn opmerking dat `retries:1` uitvallers kon verbergen.
- Nog steeds niet getoetst, in lijn met jullie eigen lijst: een echte iPhone of Android, de wake lock op een fysiek apparaat, overdracht tussen tijdzones, 200% tekstzoom en gedrag na slaapstand.
- Alle bevindingen zijn vastgesteld zonder wijziging aan de repo; de fix in §3 is alleen in de browser geïnjecteerd om hem te verifiëren.
