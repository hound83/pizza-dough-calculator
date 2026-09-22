# Crosscheck v2.0.0-kandidaat — PR #16

**Branch:** `feature/v2.0-kitchen-workflow` · commit `81c06ec` (22-09-2026, "commit visible kitchen readings before transitions")
**Basis:** release **v1.4.1** / `main` `0674eed`
**Kandidaathashes:** single file `8d76bcff…44fd` · CSS `a52c67d2…8b65` · JS `235a660a…4bc3`. Identiek in `tests/baselines/v2.0.0-candidate.json`, `PRODUCT_GUARDRAILS.md` en de verse bundel uit `src/`.
**Gelezen:** `CLAUDE.md`, `PRODUCT_GUARDRAILS.md`, `ARCHITECTURE.md`, `CONTRIBUTING.md`, `V2_0_0_IMPLEMENTATION_REVIEW.md`, `V1_4_0_RELEASE_REVIEW.md` en alle nieuwe en gewijzigde bronbestanden (`evening-core`, `evening-planning`, `evening-workflow`, `workflow-core`, `persistence-bootstrap` en de aangepaste adapters)
**Omgeving:** Windows 11 ARM64 · Microsoft Edge 151 (Chromium) via Playwright 1.62.1 · Node 24.19 · tijdzone Europe/Amsterdam met gecontroleerde klok · NL + EN

---

## 0. Oordeel

**De inhoudelijke kern van v2.0 is sterk.** De verdeling over mixerbeurten, de chronologie met onbekende momenten, undo, de migratie van een echt v1.4.1-profiel, het eigenaarschap tussen tabbladen en de privacy van delen doen precies wat het reviewdocument belooft, en de rekenkern is onaangeraakt. Ook alle acht bevindingen uit mijn v1.4-rapport houden stand op deze branch.

| Controle | Uitkomst |
|---|---|
| `npm run test:fast` | ✅ 15 structuur · 31 kern · 106 bundel · 106 bron |
| Playwright-suite in Edge 151 | ◐ **123/125**; de twee uitvallers slagen los van elkaar wél — zie §2.2 |
| GitHub Actions op `81c06ec` | ✅ beide runs groen (met `retries:1`) |
| Rekenkern v1.4.1 ↔ v2.0, 1.008 configuraties | ✅ **0 verschillen** (124.848 veldvergelijkingen) |
| Massabehoud ouder → beurten, 630 verdelingen | ✅ 0 afwijkingen, waarvan 309 met meerdere beurten |
| Migratie van een echt v1.4.1-profiel (beide modi, ook bij vol geheugen) | ✅ alles behouden, ook na twee keer herladen |
| Mijn acht v1.4-bevindingen | ✅ alle acht nog steeds opgelost |
| Smoke 168 combinaties · EN-sweep 817 knopen · subgram 1.104 gevallen · 6 viewports | ✅ schoon |

**Twee dingen zou ik vóór een release naar `main` repareren.** Beide zijn in de browser nagebouwd, en voor beide is de fix geïnjecteerd en geverifieerd:

1. **HOOG — de eerste tik ná typen doet niets.** Typ je de deegtemperatuur en tik je meteen op de overgangsknop, dan wordt de meting wél bewaard, maar het moment niet geregistreerd. Hetzelfde gebeurt bij een pizzanaam gevolgd door "In oven". Een tweede tik werkt wel.
2. **LAAG–MIDDEL — de app is nog niet klaar op het moment dat de pagina geladen is.** Ongeveer 120 ms staat het uit de flow gehaalde keuzescherm in beeld; een tik daarop wordt daarna stil teruggedraaid. Dit verklaart ook de twee wisselvallige testuitvallers.

Verder één klein punt (§2.3).

---

## 1. Bevindingen

### 1.1 HOOG · de eerste tik na het typen gaat verloren

**Reproductie (echte toetsen en muis, gecontroleerde klok):**

```
Plan → "Start deeg" → Keuken staat op "Mengen, rusten en kneden"
typ 26 in "Direct na kneden gemeten (°C)"
tik één keer op "Afwerken klaar · bulk gestart"

   meting            26 °C, opgeslagen bij de beurt          ✅
   moment            niet geregistreerd (alleen "start")     ❌
   melding           geen                                    ❌
   tweede tik        registreert het moment alsnog           ✅
```

Hetzelfde patroon in de bakvolgorde:

```
typ "Lyndsey" bij pizza 1 → tik op "In oven"
   naam opgeslagen ✅ · pizza gaat niet de oven in ❌
```

Ik heb met een tracer vastgesteld dat de klik de afhandelaar **niet bereikt**: er komt geen enkele actie binnen. Bij de tweede tik wel.

**Oorzaak.** Het `change`-event van het invoerveld vuurt op het moment dat de knop de focus overneemt, dus tussen `pointerdown` en `click` in. De afhandelaar verwerkt de waarde en roept `update()` aan (evening-planning.js:162 voor de temperatuur, :163 voor de pizzanaam). Die hertekening vervangt de volledige `innerHTML` van het paneel (batch-workflow.js:173), waardoor de knop onder de vinger verdwijnt en de browser geen `click` meer aflevert. In de bakvolgorde komt daar nog bij dat `renderKitchen()` de wachtrij bij **iedere** hertekening opnieuw invoegt met `anchor.after(queue)` (evening-workflow.js:149), ook als die al op zijn plek staat.

Dit is precies de handeling waarvoor de laatste commit bedoeld was: de zichtbare meting wordt inderdaad vastgelegd, maar de tik zelf gaat verloren.

**Fix, geverifieerd door de geserveerde bundel te patchen:** houd de toestandswijziging synchroon en stel alleen het hertekenen uit zolang de aanraking loopt.

```js
let _pressedPanel=null;
function _panelIdFor(node){for(let el=node;el;el=el.parentElement)if(el.id&&(eveningPanels.includes(el.id)||workshopPanels.includes(el.id)))return el.id;return null;}
document.addEventListener('pointerdown',e=>{_pressedPanel=_panelIdFor(e.target);},true);
document.addEventListener('pointerup',()=>{const id=_pressedPanel;_pressedPanel=null;if(id)setTimeout(()=>update(),0);},true);

// replaceWorkshopPanel(): een hertekening tussen pointerdown en click haalt de knop weg
if(_pressedPanel===id)return;

// renderKitchen(): alleen verplaatsen als het nodig is
if(anchor&&queue&&queue.previousElementSibling!==anchor)anchor.after(queue);
```

Resultaat met dezelfde handelingen: meting 26 °C **én** moment geregistreerd, en de keuken toont meteen "Koelkast in". Pizzanaam "Lyndsey" bewaard **én** pizza in de oven. Gewone hertekeningen blijven werken: een capaciteit van 900 g toont nog steeds "2 aparte beurten: 4 + 4 bollen".

Let op: een variant waarbij ik óók de toestandswijziging uitstelde (`setTimeout` om de hele handler) loste de tik op, maar liet de pizzanaam verloren gaan doordat een latere handeling met een oudere kopie van de avond werkte. Uitstellen van alleen het tekenen is het verschil.

### 1.2 LAAG–MIDDEL · de app is niet klaar wanneer de pagina geladen is

**Reproductie:**

```
                                  bij het load-event        na afloop
v1.4.1 (main)                     keuzescherm actief        keuzescherm (bedoeld)
v2.0                              keuzescherm actief        Plan · ~120 ms later
```

Het keuzescherm "Waar wil je mee beginnen?" is in v2 uit de flow gehaald (`showModeChooser()` → `showPage(1)`, persistence-bootstrap.js:401), maar staat nog wel als actieve sectie in de opgeslagen HTML (src/index.html:34). Omdat de opstartroutine sinds v2 `async` is (`await acquireStorageWriter()`, persistence-bootstrap.js:368-369) gebeurt alles ná het `load`-event.

Met opgeslagen gegevens (modus "Alleen deeg") en een trage vergrendeling:

```
tik op "Volledige pizza’s" in dat venster → modus wordt full
bootstrap voltooit                        → modus terug naar dough, tik stil ongedaan
```

**Waarom dit meer is dan cosmetisch.** Het raakt ook de testsuite. In een volledige run faalden bij mij twee gevallen op de gebundelde `index.html`, terwijl ze los van elkaar slagen:

| Test | Foutbeeld |
|---|---|
| `workshop.spec.js:150` oven settings … | `showModeChooser()` gevolgd door een klik op de moduskaart: "element is not visible" |
| `workshop.spec.js:83` named recipes … | `download.path: canceled` |

De eerste past exact bij dit mechanisme: de helper roept `showModeChooser()` aan zodra de pagina geladen is, waarna de late bootstrap naar Plan schakelt. De tweede heb ik niet kunnen herleiden en kan aan Edge liggen. In CI staat `retries:1` met `workers:2`, waardoor zulke uitvallers in een groene run verdwijnen.

**Fix, geverifieerd:** initialiseer de interface synchroon en regel het schrijverschap daarna.

```js
document.addEventListener('DOMContentLoaded',()=>{
  const writerReady=acquireStorageWriter().then(()=>showStorageOwnership());
  …
```

Resultaat: bij `load` is Plan actief en gevuld, het keuzescherm verschijnt niet meer, en het tweede tabblad krijgt nog steeds correct "Deze calculator is al actief in een ander tabblad". De bestaande revisiecontrole in `saveState()` vangt af dat er in dat korte venster onterecht geschreven zou worden. Overweeg daarnaast `page1` de actieve sectie te maken in `src/index.html`, zodat ook de eerste weergave vóór het script al klopt.

### 1.3 Klein · "Gedaan, tijd onbekend" wordt aangeboden waar het niet kan

Bij een verse avond staan er vier knoppen "Gedaan, tijd onbekend": bij bulkStart, koelkast in, koelkast uit én bakstart (evening-workflow.js:141). Kies je die bij de bakstart, dan volgt:

```
melding:  "Vul de ontbrekende momenten in, of kies “Gedaan, tijd onbekend”."
toestand: ongewijzigd
```

De melding verwijst dus naar de knop die je zojuist gebruikte. De guard zelf is goed; alleen de keuze is verwarrend. **Fix:** bied de knop alleen aan voor het eerstvolgende niet-geregistreerde moment, of noem in de melding welk eerder moment nog ontbreekt.

---

## 2. De reviewprioriteiten uit `CLAUDE.md`

| Prioriteit | Getoetst | Uitkomst |
|---|---|---|
| Eigenaarschap van toestand en migratie | Echt v1.4.1-profiel in beide modi: 6 pizza's getypt, 4 vinkjes, 25,5 °C, archiefbatch, opgeslagen recept, mixerprofiel, logboek met notitie → v2.0 op dezelfde origin, daarna twee keer herladen; ook met geblokkeerde opslag | ✅ alles behouden, `provenance: legacy-current-choices`, avond en beurt intact · bij vol geheugen blijft `pizzaCalcV52` staan, waarschuwing zichtbaar, avond werkt in de sessie |
| Afgeronde massa ouder ↔ kind | 7 presets × afronden aan/uit × 9 pizza-aantallen × 5 capaciteiten = 630 verdelingen | ✅ som van de beurten = ouder­totaal voor bloem, water, zout, gist, olie en reserve; hoofdwater sluit; geen beurt zonder gist; capaciteit nooit overschreden |
| Werkelijke versus onbekende chronologie | Onbekende "koelkast uit" registreren; voorstel opvragen; tijdlijn lezen | ✅ `unknown-history` als reden, tijdlijn toont "Tijd onbekend" in plaats van een verzonnen tijd |
| Afhankelijkheden bij ongedaan maken | Undo na onbekend moment; undo na een pizza in de oven | ✅ undo herstelt de vorige toestand; latere handelingen blokkeren undo met "Er zijn latere handelingen" |
| Conflicten in beschikbaarheid | Vroegste start 10:00 en een afwezigheidsblok over actief werk | ✅ 11 taken, 3 conflicten, melding "3 aandachtspunt(en)"; afwezigheid geeft reden `unavailable`; alternatieven +1080 en +1140 min; toepassen verschuift het héle plan, gist en fasetijden blijven exact gelijk, conflicten naar 0 |
| Stabiele pizza-identiteiten en eerste lancering | Namen, volgorde wijzigen, herladen, oven bezet | ✅ namen en volgorde overleven herladen; slechts één pizza tegelijk in de oven; de eerste lancering legt het bakmoment van díé beurt vast; afsluiten bewaart niet-gebakken pizza's |
| Privacy bij overdracht | Deelbestand, privéback-up, toekomstige versie, ontbrekend recept | ✅ deelbestand bevat alleen `format`/`template`/`version`, 0 tijdstempels, geen namen (naam wordt "Pizza evening", profiel "Mixer"), geen programmanotitie of logboeknotitie · back-up bevat die gegevens bewust wél · een bestand met `version: 54` wordt geweigerd zonder iets te vervangen · ontbrekend recept geeft het vervangingsscherm |
| Toetsenbord- en mobiele flow | 320–1280 px met alle panelen open, plan én lopende avond | ✅ 0 px horizontale scroll op alle zes breedtes · ◐ §1.1 raakt juist de aanraakflow |
| Behouden numerieke waarborgen | 1.008 configuraties tegen v1.4.1 | ✅ 0 verschillen in recept, gistadvies, simulatie en wateradvies |

**Twee tabbladen.** Het tweede tabblad meldt "Deze calculator is al actief in een ander tabblad", `saveState()` geeft `false` en de opslag blijft op de waarde van het eerste tabblad. Na het sluiten van het eerste tabblad en herladen neemt het tweede het schrijverschap over. ✅

## 3. Mijn acht v1.4-bevindingen, opnieuw getoetst op v2.0

| Bevinding | Uitkomst op `81c06ec` |
|---|---|
| Batch weg na klokcorrectie | ✅ klok 5 min terug + herladen: avond en momenten intact |
| Oveninstellingen bevroren | ✅ steen 400 °C bewerkbaar tijdens de avond, overleeft herladen, wordt naar de beurtsnapshots gesynchroniseerd; pizza-aantal blijft vast |
| Melding buiten beeld | ✅ "Geef je recept eerst een naam." staat in het receptpaneel, in beeld op 390 px |
| Verouderd voorstel | ✅ het voorstel wordt opnieuw berekend; de weigering `checkpoint-needed` klopt met de toestand |
| "verschil -0 g" | ✅ 0 van 336 combinaties |
| Ruwe JSON-melding | ✅ "Dit is geen geldig deegreceptbestand voor deze versie." |
| Gepland / Verwacht / Werkelijk | ✅ zonder avond "Gepland", met avond "Werkelijk" en "Verwacht" |
| "Bake A/B" in het Nederlands | ✅ "Bak A" en "Bak B" |

## 4. Overige regressiecontrole

```
smoke: 2 talen × 3 modi × 7 presets × 2 methodes × avond uit/aan, alle pagina's
                                       168 combinaties · 0 NaN/Infinity/undefined/[object · 0 pageErrors
EN-sweep met lopende avond en bakvolgorde        817 tekstknopen · 0 Nederlandse resten
subgramweergave: 92 recepten × 6 diameters × 2 talen   1.104 gevallen · 0 treffers
viewports 320/390/430/760/1024/1280, plan én keuken     0 px horizontale scroll
update()      v1.4.1 5,9 ms → v2.0 6,6 ms · met lopende batch/avond 7,4 ms → 10,3 ms
```

De toename tijdens een lopende avond is ongeveer 40%, maar blijft ruim onder de waarneembaarheidsgrens.

## 5. Wat aantoonbaar goed is

- **De verdeling over mixerbeurten klopt rekenkundig.** Over 630 verdelingen telt elke grootheid per beurt exact op tot het oudertotaal in de getoonde eenheid, sluit hoofdwater plus reserve, en verdwijnt geen enkele gistdosis naar nul. Bij 8 bollen en 1200 g capaciteit: twee beurten van 4, elk 530 g bloem en 881,9 g deeg, tegenover 1060 g bloem in het ouderrecept.
- **Onbekende geschiedenis wordt eerlijk behandeld.** Een onbekend moment maakt de afgeleide tijden "Tijd onbekend" in plaats van een verzonnen tijdstip, en het model weigert een voorstel met `unknown-history`.
- **De migratie is beproefd op een écht profiel**, niet alleen op een nagemaakte opslagtoestand: in beide modi, met archiefbatch, recepten, profielen en logboek, en na twee keer herladen. Bij vol geheugen blijft de oude sleutel staan.
- **De overdracht is zuinig.** Het deelbestand van 2,3 kB bevat geen enkele tijdstempel, geen namen, geen programmanotities en geen metingen; het voorbeeldscherm toont vooraf letterlijk de volledige bestandsinhoud.
- **De beschikbaarheidscontrole verschuift het plan en niets anders.** Na het toepassen van een alternatief van 18 uur later zijn gist, bulk, koelkast en eindrijs exact gelijk gebleven.
- **Eén kom en één oven worden echt afgedwongen**: "Rond eerst het afwerken van de vorige mixerbeurt af" en "Er staat al een pizza in de oven".
- **De rekenkern is onaangeraakt**, en alle acht correcties uit de v1.4-release zijn behouden.

## 6. Prioriteit

| | Punt | Omvang | Wanneer |
|---|---|---|---|
| 1 | §1.1 verloren eerste tik | guard in `replaceWorkshopPanel` + 1 regel in `renderKitchen` | **vóór release** |
| 2 | §1.2 opstart pas na `load` | 1 regel in de bootstrap (+ `page1` actief in de HTML) | **vóór release**; maakt ook de suite stabieler |
| 3 | §1.3 "Gedaan, tijd onbekend" | 1 voorwaarde | wanneer het uitkomt |

## 7. Methodische noot voor GPT

- **§1.1 is niet met een functieaanroep te vinden.** `page.evaluate(() => recordEveningEvent(...))` slaagt altijd; alleen een echte muis- of vingertik na een `change` legt het bloot. Een test die dit afdekt: typ in `#kitchenDoughTemp`, klik één keer op de overgangsknop en controleer zowel de meting als `activeBatch().events`.
- **§1.2 raakt jullie eigen suite.** Zolang de opstart na `load` doorloopt, is elke test die direct na `page.goto` iets aanroept een wedloop. Een expliciet signaal (bijvoorbeeld `document.documentElement.dataset.appReady='1'` aan het eind van de bootstrap) maakt zowel de suite als de app voorspelbaar. Mijn eigen harnas wacht nu op zo'n toestand; zonder die wachtstap werden mijn instellingen door de late bootstrap overschreven.
- **Groen in CI is hier niet hetzelfde als stabiel.** `retries:1` verbergt precies dit soort uitvallers. Overweeg de retries tijdelijk op 0 te zetten om te zien of de suite deterministisch is.
- **Wat ik niet heb getoetst**, in lijn met jullie eigen beperkingenlijst: een echte iPhone of Android, de wake lock op een fysiek apparaat, een overdracht tussen tijdzones, 200% tekstzoom en het gedrag na slaapstand van een telefoon.
- Alle bevindingen zijn vastgesteld zonder wijziging aan de repo; de fixes zijn alleen in de browser geïnjecteerd om ze te verifiëren.
