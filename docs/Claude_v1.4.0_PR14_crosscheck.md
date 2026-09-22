# Crosscheck v1.4.0-kandidaat — PR #14

**Branch:** `feature/v1.4.0-batch-workflow` · commit `4530a90` (22-09-2026, "integrate Claude review"), draft PR #14 bovenop PR #13
**Basis:** gecorrigeerde v1.3.0-kandidaat `67bbefc` (PR #13) · release `v1.2.1` (`8da4ecb`)
**Kandidaathashes:** single file `94e568b8…8c15` · CSS `3ecef9a1…0919` · JS `cdbfefb2…d5ce`. Deze zijn identiek in `tests/baselines/v1.4.0-candidate.json`, `PRODUCT_GUARDRAILS.md` en de verse bundel. De vier vergeleken versies (v1.2.1, `02920e4`, `67bbefc`, `cd22159`) kloppen ook met hun vastgelegde hashes.
**Gelezen:** `CLAUDE.md`, `PRODUCT_GUARDRAILS.md` (volledig), `ARCHITECTURE.md`, `CONTRIBUTING.md`, `V1_4_0_IMPLEMENTATION_REVIEW.md`, `V1_4_0_RECOVERY_VERIFICATION.md`, `V1_3_0_CLAUDE_FOLLOWUP.md`, en alle nieuwe en gewijzigde bronbestanden
**Omgeving:** Windows 11 ARM64 · Microsoft Edge 151 (Chromium) via Playwright 1.62.1 (`channel:'msedge'`) · Node 24.19 · tijdzone Europe/Amsterdam met gecontroleerde klok · NL + EN

---

## 0. Oordeel

**Dit is een sterke kandidaat, en de opvolging van mijn v1.3-rapport is volledig.** Alle zes de v1.3-bevindingen zijn opgelost, zowel op PR #13 als op PR #14. Mijn eigen scripts vinden de oude fouten op `02920e4` nog steeds terug en op beide nieuwe versies niet meer. De batchworkflow is doordacht:
- Tijdens een batch schakelen alle plekken die een tijd tonen over op één vaste `bakeAt`.
- De chronologie wordt afgedwongen.
- Het temperatuurvoorstel raakt alleen de nog niet begonnen eindrijs.

| Controle | Uitkomst |
|---|---|
| `npm run test:fast` | ✅ 15 structuur · 17 kern · 105 bundel · 105 bron |
| Playwright-suite in Edge 151 | ✅ 75/75 (eerste run buiten GitHub Actions) |
| GitHub Actions op `4530a90` en `67bbefc` | ✅ beide `test`-runs groen |
| Rekenkern, 1.008 configuraties | ✅ **0 verschillen** v1.3-gecorrigeerd ↔ v1.4, `02920e4` ↔ `67bbefc` en `cd22159` ↔ `4530a90` (elk 124.848 veldvergelijkingen) |
| v1.3-bevindingen §2.1–§2.6 | ✅ alle zes opgelost op #13 én #14 |
| Batch over middernacht, taalwissel, herladen, wintertijd | ✅ vaste bakstart blijft overal gelijk |
| Upgrade halverwege het bakken vanuit de echte v1.2.1- en v1.3-app | ✅ alles behouden |

**Niets hiervan blokkeert een merge van #13 in #14.** Eén punt raad ik aan vóór een release naar `main`:

1. **MIDDEL — een lopende batch verdwijnt stil als de klok van het apparaat wordt teruggezet.** Het is zeldzaam, maar het verlies is onomkeerbaar: de batch staat daarna niet in het archief en ook niet meer in de opslag. De fix is één argument en is in de browser geverifieerd.

Verder drie lage punten en vier kleine (§2.2–§2.8). Alle fixes zijn geïnjecteerd en in de browser geverifieerd.

---

## 1. Opvolging van mijn v1.3-bevindingen

Dezelfde handeling op drie versies: de originele v1.3-kandidaat (`02920e4`), de gecorrigeerde v1.3 (`67bbefc`, PR #13) en v1.4 (`4530a90`, PR #14).

| Bevinding v1.3 | `02920e4` | `67bbefc` (#13) | `4530a90` (#14) |
|---|---|---|---|
| **§2.1** subgram, zwevende komma (92 recepten × 24/28/30/32/35/40 cm, NL+EN; picker, per bol, overzicht, stappen, boodschappen) | 6 recepten bij 30 cm, 2 bij 40 cm | 0 | 0 |
| §2.1 punt als decimaalteken in het Nederlands (`0.35 g`) | 11–12 recepten, bij elke diameter | 0 | 0 |
| **§2.2** knoplabel na meting → EN → NL → Basis → Uitgebreid | "Apply advice" / "Advies toepassen" | "Deeg al gemengd · gist staat vast", door alle vier de wissels heen | idem |
| §2.2 na wissen van de meting | "Gebruik dit gistadvies" → EN "Apply advice" | "Staat al in je recept" → "Already in your recipe" | idem |
| **§2.3** kodaNight, "gebruik dit gistadvies" | 0,17% → 0,171%, preset wordt Custom | knop is status "Staat al in je recept"; preset en 0,17% blijven | idem |
| **§2.4** "Zeer weinig tijd", `until-0.75` | aanwezig | `until-prepHours()` (planning-shopping.js:114) | idem |
| **§2.5** `$('preset')` in de AVPN-waternotitie | aanwezig | `c.presetKey` (fermentation-live.js:639) | idem |
| **§2.6** `YEAST_TEMP_CURVE` muteerbaar | buitenkant en punten muteerbaar | buitenkant en alle punten bevroren; mutatie geweigerd; activiteit bij 21 °C blijft 1 | idem |

De follow-up heeft de fout bovendien breder opgelost dan ik vroeg: ook de topping-stappen gebruiken nu de gedeelde formatter. Dat stond niet in mijn rapport.

**PR #13 (`67bbefc`) is wat mij betreft klaar.** De CI is groen en de rekenkern is numeriek gelijk aan `02920e4`.

---

## 2. Bevindingen op v1.4

### 2.1 MIDDEL · een lopende batch verdwijnt stil als de klok teruggezet wordt

**Reproductie (echte klikken, gecontroleerde klok):**

```
20:00  Start deze batch → "Dit moment nu vastleggen" (bulk gestart)
       opslag: workshop.batch aanwezig, momenten start + bulkStart
       klok 5 minuten terug (19:55), zoals bij een tijdsynchronisatie
       herladen
       → activeBatch() = null · history = 0 · opslag: workshop.batch = null
       deegvelden weer bewerkbaar
20:30  klok weer vooruit, herladen → batch blijft weg
```

Er verschijnt geen melding. Het archief raakt op dezelfde manier batches kwijt die zo'n tijdstempel bevatten.

**Oorzaak.** Bij het laden bouwt `WorkflowCore.sanitizeBatch()` de batch opnieuw op door elk opgeslagen moment opnieuw door `recordEvent()` te halen (workflow-core.js:162). `recordEvent()` weigert een moment dat meer dan 60 seconden ná `Date.now()` ligt (workflow-core.js:87). Dat is bedoeld voor nieuwe invoer ("uiterlijk nu"). Maar hier geldt het voor momenten die al gecontroleerd waren toen ze werden vastgelegd. De hele batch wordt dan `null`. Direct daarna schrijft `loadState()` de opgeschoonde toestand weg (persistence-bootstrap.js:129 en :177), waardoor het verlies definitief is.

Het is zeldzaam: de klok moet na het vastleggen meer dan een minuut terug worden gezet, handmatig of door een tijdcorrectie. Maar een batch loopt 24 tot 72 uur, en een functie die bedoeld is om momenten te bewaren, mag die niet stil weggooien.

**Fix, geverifieerd door injectie in de geserveerde bundel:**

```js
// workflow-core.js, sanitizeBatch(): opgeslagen momenten waren bij vastleggen al gecontroleerd
if(value.events[key]!=null)out=recordEvent(out,key,value.events[key],Infinity);
```

Resultaat: na 5 minuten terug blijft de batch actief, met start en bulkStart. De chronologie blijft bewaakt: een opgeslagen batch met bulkStart vóór start wordt nog steeds geweigerd. Nieuwe invoer in de toekomst wordt ook nog steeds geweigerd, want `recordBatchEvent()` gebruikt de standaardwaarde `now`.

**Test die dit afdekt:** batch starten, `record-now`, `page.clock.setSystemTime(-5 min)`, herladen, `expect(activeBatch()).not.toBeNull()`.

### 2.2 LAAG · steentemperatuur en voorverwarmtijd staan vast tijdens een batch

**Reproductie:** batch starten, dan pagina 1 → "Doel steentemperatuur".

```
stoneTemp      disabled   (klik: element niet bewerkbaar)
preheatMinutes disabled
steen- en bakadvies blijft op 430 °C, "Start voorverwarmen" blijft 30 min vóór de bakstart
```

Een batch loopt een tot drie dagen. Op de bakdag de steentemperatuur of voorverwarmtijd aanpassen kan alleen door de batch af te sluiten. En heropenen zet de oude waarde terug, omdat `resumeBatch()` het snapshot herstelt.

**Waarom dit geen deeg is.** Het v1.4-contract noemt "dough recipe, method, equipment/storage snapshot and absolute desired bake time". Het v1.1.0-contract rekent steentemperatuur expliciet tot de praktische invoer. Beide velden beïnvloeden alleen het bakadvies en het voorverwarmmoment, niet het deeg.

**Oorzaak.** `WorkflowCore.FIELD_IDS` bevat alle getalvelden, ook `stoneTemp` en `preheatMinutes` (workflow-core.js:6). `enforceBatchRecipe()` schakelt ze uit (batch-workflow.js:25). `calc()` zet bij elke berekening via `restoreRecipe()` de snapshotwaarde terug (dough-fermentation.js:80, batch-workflow.js:14).

**Fix, geverifieerd door injectie:** sla die twee velden over in `enforceBatchRecipe()`, en in `restoreRecipe()` zolang het om het recept van de lopende batch gaat.

```js
const OVEN_FIELDS=new Set(['stoneTemp','preheatMinutes']);
// enforceBatchRecipe: if(OVEN_FIELDS.has(id))continue;
// restoreRecipe:       if(activeBatch()&&snapshot===activeBatch().recipe&&OVEN_FIELDS.has(key))continue;
```

Resultaat met echte toetsen: steen 400 °C en voorverwarmen 45 min worden overgenomen, en "Start voorverwarmen" schuift mee in de batchtijdlijn. Pizza-aantal en de rest van het deeg blijven vast, en de gist blijft 0,9 g. Opgeslagen recepten en het receptbestand mogen de steentemperatuur blijven bevatten; het gaat hier alleen om de lopende batch.

### 2.3 LAAG · meldingen van de receptenbank verschijnen buiten beeld

**Reproductie:** "Eigen deegrecepten & plannen vergelijken" openen en "Huidig recept bewaren" klikken zonder naam (echte klik).

```
breedte    knop op    melding "Geef je recept eerst een naam." op    zichtbaar?
 320 px     398 px    −1707 px (paneel batchPlanner)                  nee
 390 px     398 px    −1520 px                                        nee
 760 px     398 px     −910 px                                        nee
1280 px     398 px     −970 px                                        nee
```

Hetzelfde geldt voor een ongeldig of te groot receptbestand, voor de limiet van 30 recepten en voor een ongeldige invoer bij de koelkastindeling. De gebruiker klikt en ziet niets gebeuren. Dat is dezelfde klasse als mijn v1.3-§2.2: "het moment waarop iemand denkt dat de app hapert".

**Oorzaak.** Er is één `workshopNotice`, en die wordt alleen weergegeven in `renderBatchPanels()` (batch-workflow.js:135). `renderRecipeWorkbench()` en de andere panelen tonen geen melding (workshop-tools.js:41).

**Fix, geverifieerd door zes tekstpatches op de geserveerde bundel:**
- onthoud bij de klik of wijziging uit welk paneel de actie kwam: `workshopNoticeFor=id` in beide gedelegeerde handlers, batch-workflow.js:173/:194;
- geef de melding in dát paneel weer, via een helper `noticeHtml(panel)`;
- `closeBatch()` zet expliciet `workshopNoticeFor='batchPlanner'`.

Resultaat op 390 px:
- "Geef je recept eerst een naam." en "Dit is geen geldig deegreceptbestand…" staan in het receptenpaneel, zichtbaar bij de knop;
- "Kies een baktijd ná je werkelijke start." staat nog steeds in het batchpaneel.

### 2.4 LAAG · het voorstel voor de eindrijs veroudert binnen dezelfde dag

**Reproductie:** `sameDay`, batch starten, bulk gestart, 26 °C typen, dan "Resterende tijden beoordelen" openen.

```
                         getoond                                         werkelijke toestand
direct                   "totale eindrijs 5 u 15 min · nog ongeveer      voorstel
                          5 u 15 min" + knop "Dit voorstel … gebruiken"
3 uur later, paneel      precies dezelfde tekst en knop                  checkpoint-needed
opnieuw geopend,         (terugkeer naar tabblad gesimuleerd)            (bulk loopt over)
tab weer zichtbaar
klik op de knop          "Het voorstel is vervallen; beoordeel de actuele tijden opnieuw."
```

De knop is veilig, want hij berekent opnieuw. Maar het paneel toont uren oude informatie, en je moet klikken om daarachter te komen.

**Oorzaak.** `batchProposalHtml()` gebruikt het tijdstip van renderen (batch-workflow.js:121). Opnieuw renderen gebeurt alleen bij een `update()`. Terugkeren naar de pagina rendert alleen opnieuw als de datum veranderd is (planning-shopping.js:45), en het openen van `<details>` rendert niet.

**Fix, geverifieerd door injectie:**

```js
$('batchRunner').addEventListener('toggle',e=>{if(e.target.id==='batchTimingDetails'&&e.target.open)renderWorkshop(calc());},true);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&activeBatch())update();});
```

Resultaat: na drie uur toont het paneel direct "Een verwacht overgangsmoment is verstreken. Registreer de werkelijke overgang…", zonder de verouderde knop.

### 2.5 Klein · "verschil -0 g" op de weegschaalkaart

AVPN met 2 pizza's en praktisch afronden aan toont: "Recept: 0,3 g. Dichtstbijzijnde schaalstap: 0,3 g (**verschil -0 g**; …)". Van de 336 combinaties (7 presets × afronden aan/uit × 3 schaalstappen × 8 pizza-aantallen) laten er 40 dit zien.

**Oorzaak:** `calc().yeast` is `0.30000000000000004`. `weighing()` geeft dan `delta:nearest-grams` = −4,4·10⁻¹⁷ (workflow-core.js:69), en `fmt(w.delta,2)` maakt daar "-0" van (workshop-tools.js:13).

**Fix, geverifieerd:** `delta:Math.round((nearest-grams)*1e4)/1e4||0`. Daarna 0 van de 336 met "-0", en geen enkel echt verschil verandert.

### 2.6 Klein · ruwe JavaScript-melding bij een bestand dat geen JSON is

Importeer je een bestand dat geen JSON is, dan staat er in de Nederlandse interface: `Unexpected token 'd', "dit is geen json" is not valid JSON`.

**Oorzaak:** de `SyntaxError` van `JSON.parse(text)` (workshop-tools.js:140) gaat ongewijzigd naar `workshopError()`.

**Fix, geverifieerd:** `let parsed=null;try{parsed=JSON.parse(text);}catch{}` en daarna `importRecipe(parsed)`. Dan verschijnt de bestaande melding "Dit is geen geldig deegreceptbestand voor deze versie."

### 2.7 Klein · zonder batch heet een gepland moment nu "Verwacht"

v1.3 toonde bij de stappen "Gepland: di 22 sep, 18:00". v1.4 toont zonder batch "Verwacht: …" (fermentation-live.js:469). Het reviewdocument vraagt juist om onderscheid tussen *planned*, *expected* en *recorded*, maar de code kent er nu twee.

**Fix, geverifieerd:** `!activeBatch()?L('Gepland','Planned'):batchMomentIsActual(momentKey)?L('Werkelijk','Actual'):L('Verwacht','Expected')`. Zonder batch staat er dan "Gepland: …", met batch "Werkelijk: …" en "Verwacht: …".

### 2.8 Klein · "Bake A" / "Bake B" in de Nederlandse interface

In de bakvergelijking staat `L('Bake A','Bake A')` (workshop-tools.js:70). **Fix:** `L('Bak A','Bake A')` en `L('Bak B','Bake B')`, geverifieerd. Verder bevatten de nieuwe panelen geen taalresten, in beide richtingen.

---

## 3. De vijf reviewprioriteiten uit `V1_4_0_IMPLEMENTATION_REVIEW.md`

| # | Prioriteit | Getoetst | Uitkomst |
|---|---|---|---|
| 1 | Geen moment, gistdosis of vaste bakstart verandert door een ongerelateerde bewerking, taalwissel, herladen of middernacht | Lopende batch met "Overmorgen": saus Bianca, Basis ↔ Uitgebreid, NL → EN → NL, pizza gekozen via de picker, vinkje gezet, klok +26 u, focus, herladen | ✅ events, `bakeAt`, snapshot, timings, gist en bloem byte-identiek |
| 1 | idem, middernacht en wintertijd | Start ma 20:00, bakken di 18:00, klok naar 00:10; ook start za 24-10 20:00 over 03:00 → 02:00 | ✅ label "Vast: di 22 sep, 18:00" en tijdlijn blijven gelijk; wintertijd `17:00Z` = zo 18:00 |
| 2 | Temperatuurvoorstel tegen verstreken tijd en het oorspronkelijke gasdoel, inclusief eerlijke faalpaden | `sameDay` 26 °C; deadband 24,5 °C; `kodaNight` 26 °C; overlopen fase; laat in de eindrijs 29 °C; handmatig korter dan verstreken | ✅ eindrijs 6 → 5,25 u en 4 → 3,37 u; bulk, koelkast, events, `bakeAt` en gist onveranderd · deadband: geen voorstel · `checkpoint-needed` · `past-target` zonder knop · "korter dan de tijd die al verstreken is" · ◐ veroudering, §2.4 |
| 3 | Migratie van schema 51, onbeschikbare opslag, misvormde gegevens | Echte v1.2.1- en v1.3-app: 6 pizza's getypt, 9 vinkjes, 25,5 °C getypt, EN, dan v1.4 op dezelfde origin; opslag geblokkeerd; misvormde en XSS-imports; beschadigde chronologie | ✅ alles behouden, pagina 4, gistvergrendeling actief · geblokkeerd: batch werkt, waarschuwing zichtbaar · imports geweigerd of veilig ge-escaped, `<img onerror>` niet uitgevoerd · ❌ klokcorrectie, §2.1 |
| 4 | Mengteksten en alle numerieke constanten gelijk | 1.008 configuraties; bronvergelijking | ✅ 0 verschillen · `catalog.js`, `sauce-recipes.js` (kneedinstructies) en `pizza-picker.js` byte-identiek aan `67bbefc`; in `fermentation-live.js` alleen de meetkoppeling en het momentlabel |
| 5 | Mobiele bediening en tweetaligheid; gepland, verwacht en geregistreerd | 320–1280 px met alle panelen open en gevulde vergelijkingstabellen; EN-sweep Basis + Uitgebreid met batch en meting | ✅ 0 px horizontale scroll, tabellen scrollen binnen hun kader · EN: 0 Nederlandse resten in 751 en 849 tekstknopen · ◐ §2.3, §2.7, §2.8 |

## 4. Overige regressiecontrole

```
smoke: 2 talen × 3 modi × 7 presets × 2 methodes × batch uit/aan, alle pagina's
                                        168 combinaties · 0 NaN/Infinity/undefined/[object · 0 pageErrors
zwevende komma in weergave:             92 recepten × 6 diameters × 2 talen · 0 op #13 en #14
echte toetsen: 4 → 8 → 4 + blur         4 pizza's, 4 keuzes ✅
"12" typen                              12 keuzes ✅ · leeg hydratatieveld + blur → 63 ✅
Reset                                   wist net als in v1.3 alle calculatorsleutels, inclusief logboek;
                                        v1.4 zegt dat nu ook eerlijk in de bevestiging
update()                                4,17 ms (v1.3) → 4,54 ms (v1.4, +9%) · 5,08 ms met lopende batch
```

## 5. Wat aantoonbaar goed is

- **De vaste bakstart is echt vast.** Van de Basis-samenvatting tot de stappen: alle plekken die tijd tonen, lezen tijdens een batch dezelfde `bakeAt`. Over middernacht, een taalwissel, herladen en de wintertijdovergang blijft "Vast: di 22 sep, 18:00" overal staan. Hetzelfde patroon als "één tijdlijn, drie weergaven" uit v1.3, nu ook voor een lopende batch.
- **De app zegt eerlijk wanneer een plan niet haalbaar is.** Start je om 20:00 een recept van bijna 26 uur voor morgen 18:00, dan staat er: "De huidige verwachting ligt 3 u 54 min ná je gewenste bakstart. Er worden geen rust- of kneedstappen automatisch ingekort." Dat past bij je wens om mengtijden niet te verkorten.
- **Het temperatuurvoorstel doet precies wat het contract zegt.** Het verandert alleen de nog niet begonnen eindrijs en houdt de deadband aan. Het weigert bij een overlopen fase, en na het doel is er geen knop meer. Getoetst in vijf scenario's.
- **De rekenkern is onaangetast.** 1.008 configuraties, 0 verschillen tegenover v1.3. Kneedinstructies, catalogus en picker zijn byte-identiek.
- **De gegevensuitwisseling is zuinig en veilig.** De export bevat alleen `format`, `name`, `recipe` en `version`, zonder metingen, notities of datums. Een geïmporteerd AVPN-recept wordt `custom` en krijgt geen officieel AVPN-advies. Gebruikerstekst wordt overal ge-escaped.
- **De upgrade van v1.2.1 of v1.3 naar v1.4 werkt ook halverwege het bakken**, in de echte oude apps en niet alleen met een nagemaakte opslagtoestand.
- **De v1.3-follow-up is grondig.** Alle zes de punten zijn opgelost, de subgramfix staat ook in de stappen, en de documentatie verwijst naar mijn rapport zonder het te herschrijven.

## 6. Prioriteit

| | Punt | Omvang | Wanneer |
|---|---|---|---|
| 1 | §2.1 batch weg na klokcorrectie | 1 argument in `sanitizeBatch` + 1 browsertest | **vóór release naar `main`** |
| 2 | §2.3 meldingen in beeld | kleine helper + 5 regels | liefst vóór release |
| 3 | §2.2 steen en voorverwarmen vrij tijdens batch | 2 regels | liefst vóór release |
| 4 | §2.4 voorstel verversen | 2 listeners | liefst |
| 5 | §2.5–§2.8 | elk 1 regel | wanneer het uitkomt |

## 7. Methodische noot voor GPT

- **Waarom de suite §2.1 niet zag.** De migratietests zetten een opgeslagen toestand klaar bij een vaste klok. Geen enkele test verzet de klok *terug* tussen vastleggen en herladen. Eén extra scenario dekt dit af.
- **§2.3 is een meetbare eigenschap, geen CSS-kwestie.** Controleer na een mislukte actie of het element met `role="status"` binnen de viewport valt (`getBoundingClientRect`). De bestaande tests zoeken de melding alleen in `#batchPlanner` en bevestigen daarmee onbedoeld de verkeerde plek.
- **Windows.** Wie de repo op Windows uitcheckt met Git for Windows (standaard `core.autocrlf=true`), krijgt CRLF. `npm run check:bundle` faalt dan met "Source HTML does not contain the expected script sequence". Een `.gitattributes` met `* text=auto eol=lf` voorkomt dat. Dit is geen appfout, maar het scheelt de volgende auditor tijd.
- **Voor Michael, bij het testen naast een lopende bake.** Zodra v1.4 één keer geopend is in dezelfde browser en op dezelfde origin, wordt de v1.3-opslag (`pizzaCalcV51`) na een geslaagde migratie verwijderd. Dat is zo ontworpen. Een oudere versie op diezelfde origin start daarna leeg: ik heb dat gemeten voor v1.2.1 en v1.3. Test v1.4 dus niet in dezelfde browseromgeving als de kopie waarmee je op dat moment bakt.
- **Methode.** Echte klikken en toetsen met een vertraging van 30 ms, `page.clock` voor middernacht, wintertijd en klokcorrectie, en vergelijking met de vorige versie vóór elke "regressie". Elke fix is geverifieerd door in de browser de geserveerde bundel te patchen of een functie te herdefiniëren. Alle bevindingen zijn vastgesteld zonder wijziging aan de repo.
