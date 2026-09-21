# Crosscheck v1.3.0-kandidaat — PR #13

**Branch:** `feature/v1.3.0-planning-review` · commit `02920e4` (21-09-2026, weekdagen in bakdagkeuze)
**Basis:** release `v1.2.1` (`8da4ecb`)
**Kandidaathashes:** single file `78851e2d…9335` · CSS `e7c20ac7…f619` · JS `ce696717…1896` — identiek in `tests/baselines/v1.3.0-candidate.json`, `PRODUCT_GUARDRAILS.md` en de verse bundel
**Gelezen:** `CLAUDE.md`, `PRODUCT_GUARDRAILS.md`, `ARCHITECTURE.md`, `CONTRIBUTING.md`, `V1_3_0_REVIEW_AND_ROADMAP.md` en de volledige review van 21-09
**Omgeving:** headless Chromium 1194 (volledige browser én headless shell), Playwright 1.62.1 uit de repo, tijdzone Europe/Amsterdam met gecontroleerde klok, NL + EN

---

## 0. Oordeel

**Dit is een sterke kandidaat.** De rekenkern is echt DOM-vrij en numeriek verliesvrij geëxtraheerd, en de reviewbevindingen zijn aantoonbaar opgelost — niet alleen in tekst, maar in gedrag, met een voor/na-vergelijking tegen v1.2.1.

| Controle | Uitkomst |
|---|---|
| `npm run test:fast` | ✅ 15 structuur · 5 kern · 98 bundel · 98 bron |
| Playwright-suite, headless shell | ✅ 43/43 |
| Playwright-suite, volledige Chromium | ✅ 43/43 (de favicon-fix uit augustus werkt) |
| Rekenkern tegen v1.2.1, 1.008 configuraties | ✅ **0 verschillen** in recept, gistadvies, simulatie en wateradvies |
| Reviewbevindingen H1–M8 | ✅ opgelost, één gedeeltelijk (M8) |
| Weekdagen, middernacht, jaargrens, zomer-/wintertijd, slaapstand | ✅ |

De review van 21-09 schreef dat de browsersuite in die omgeving niet kon draaien. Dit is die onafhankelijke run.

**Twee dingen moeten vóór een merge nog gerepareerd worden.** Beide zijn in de browser nagebouwd en de fix is beide keren geïnjecteerd en geverifieerd:

1. **HOOG voor de release — zichtbare regressie door de M1-fix.** Bij de standaarddiameter van 30 cm toont de app `Oregano 0.35000000000000003 g`, op drie plekken, in beide talen. Het getal klopt; de weergave niet.
2. **MIDDEL — de nieuwe gistvergrendeling verliest haar uitleg.** Na een taalwissel of een wissel Basis/Uitgebreid staat er op de uitgeschakelde knop weer "Advies toepassen" in plaats van "Deeg al gemengd · gist staat vast".

Verder vier kleine punten (§2.3–2.6). Eén bekende beperking noem ik bewust níét als bevinding: dat een relatieve baktijd ("Morgen") na middernacht een dag opschuift. Die staat als eerste vervolgstap in de roadmap, en de nieuwe weekdaglabels maken dat nu juist zichtbaar.

---

## 1. De reviewbevindingen, één voor één getoetst

Per bevinding dezelfde handeling in v1.2.1 en in de kandidaat, in Chromium.

| Bevinding | v1.2.1 | v1.3.0-kandidaat | Status |
|---|---|---|---|
| **H1** AVPN-deadline gebruikt het verkeerde gistregime | kaart 0,54 g (AVPN-midden 0,0912%); na toepassen zegt het advies 0,2857% | kaart 1,69 g (0,2857%); na toepassen 0,2857% | ✅ |
| H1, breed: 7 presets × 6 baktijden | 33 voorstellen, **4** met ander advies ná toepassen (alle AVPN) | 33 voorstellen, **0** | ✅ |
| **H2** glans/plakkerig/24 °C als stopsignaal | "stop direct bij … glanzend/plakkerig deeg of zodra de deegtemperatuur…" | "Alleen glanzend/plakkerig deeg of het bereiken van 24 °C bewijst niet dat het deeg klaar is"; samenhang + windowpane | ✅ |
| **M1** kleine kruiden naar minimaal 1 g | 0,4 g → 1 g, 0 g → 1 g | 0,4 g → 0,35 g (bij 30 cm), 0 g → 0 g | ✅ rekenkundig · ❌ weergave, zie §2.1 |
| **M2** deadlinekaart +0,5 u | "Schema vraagt 25 u 30 min" | "25 u 54 min", gelijk aan de tijdlijn | ✅ · restje in §2.4 |
| **M3** doel gelabeld als "gemeten" | "startdeeg: gemeten 25 °C" | "startdeeg: ingesteld doel 25 °C" | ✅ |
| **M4** meetmoment na de herstelrust | meetstap op plaats 7, na finish en ontwikkelingscheck | meetstap direct na kneden, vóór finish en check | ✅ |
| **M5** "onzekerheid ±28%" | "Midden 0,91 g • onzekerheid ±28%" | "Modelstartpunt … Praktische band … vuistregelmarge, geen gemeten betrouwbaarheidsinterval" | ✅ |
| **M6** "AVPN 2024/2026" | aanwezig | weg, "AVPN 2024" | ✅ |
| **M7** knopcontrast | 3,07:1 en 2,48:1 | **5,66:1 en 7,01:1** | ✅ |
| M7 checkboxnamen | 20 vakjes, 1 unieke (lege) naam | 20 vakjes, 20 unieke namen uit de staptitel | ✅ |
| M7 methodestatus | geen `aria-pressed` | `aria-pressed` correct per methode | ✅ |
| **M8** afweeghoeveelheid als hoofdgetal | bereik als hoofdgetal | "Afwegen voor dit recept: 0,9 g IDY" + modelstartpunt + band | ◐ zie §2.3 |
| **L1** tijdlijn na de stappen | stappen vóór tijdlijn | tijdlijn vóór stappen | ✅ |
| **L2** UI-toestand lekt in het model | `yeastRecommendation` leest `$('preset')` | leest `c.presetKey`; voorstel krijgt `'custom'` | ✅ · restje in §2.5 |

O1 (48-uurscrash) heb ik niet opnieuw onderzocht. O2 (feedback) valt buiten deze PR.

---

## 2. Bevindingen

### 2.1 HOOG voor release · `0.35000000000000003 g` bij de standaarddiameter

**Reproductie:** Mijn standaardrecept (30 cm), 4 pizza's, recept Napoletana.

```
                         v1.2.1              v1.3.0-kandidaat
pickerpreview            Oregano 1 g         Oregano 0.35000000000000003 g
aanpassen per bol        Oregano • 1 g       Oregano • 0.35000000000000003 g
ingrediëntenoverzicht    Oregano 1 g         Oregano 0.35000000000000003 g
totaalregel (4 pizza's)  Oregano 4 g         Oregano 1,4 g        ← deze klopt wel
```

Identiek in het Engels. Gescand over alle 92 recepten:

```
diameter   24   28   30   32   35   40 cm
recepten    0    0    6    0    0    2      met zo'n getal in de pickerpreview
```

Bij 30 cm — de standaard van Mijn standaardrecept sinds v1.1.1 — gaat het onder meer om Napoletana en Cacio e pepe (`Zwarte peper 0.7000000000000001 g`).

**Oorzaak, twee lagen.**

1. `foundation.js`, `scaleQty()`: `roundTo(q,.01)` rekent `Math.round(q/.01)*.01`, en `35*.01` is in JavaScript `0.35000000000000003`. Of dat optreedt hangt af van de diameter. Daarom zagen de tests het niet: 32 cm geeft toevallig schone getallen.
2. Drie weergaven printen het getal rauw met `${x[1]}` in plaats van via de nieuwe `ingredientAmount()`: `renderPickerPreview()` (pizza-picker.js:718), `buildPizzaCustomize()` (sauce-recipes.js:151) en `buildIngredientsModal()` (planning-shopping.js:768). Vóór v1.3 waren die waarden altijd hele grammen, dus dat viel niet op. Ook zonder zwevende-kommarest tonen deze plekken `0.4 g` met een punt in het Nederlands, terwijl de totaalregel `1,4 g` schrijft.

**Fix, geverifieerd door injectie:**

```js
// scaleQty: schone waarde
if(unit==='g'&&q<1)return Math.max(.01,Math.round(q*100)/100);

// op de drie plekken:
${ingredientAmount(x[1])} ${tUnit(x[2],x[1])}
```

Resultaat: `Oregano 0,35 g` in picker, per bol en overzicht; `1,4 g` in de totaalregel; bij 30 en 40 cm nul recepten met een rest. Eén van de twee lagen alleen is niet genoeg: zonder de weergavefix blijft het `0.35` met een punt.

### 2.2 MIDDEL · de gistvergrendeling verliest haar uitleg na een taal- of weergavewissel

**Reproductie:** werkelijke deegtemperatuur 26 °C invullen.

```
na meting            "Deeg al gemengd · gist staat vast"   [uitgeschakeld]   ✅
→ taal EN            "Apply advice"                        [uitgeschakeld]   ❌
→ taal NL            "Advies toepassen"                    [uitgeschakeld]   ❌
→ Basis              "Advies toepassen"                    [uitgeschakeld]   ❌
→ Uitgebreid         "Advies toepassen"                    [uitgeschakeld]   ❌
→ pagina 2 en terug  "Deeg al gemengd · gist staat vast"                    ✅
```

Zonder meting gebeurt hetzelfde: het nieuwe label "Gebruik dit gistadvies" wordt weer "Advies toepassen".

De knop blijft wél uitgeschakeld, dus de guardrail staat. Maar een uitgeschakelde knop met de tekst "Advies toepassen" en zonder uitleg is precies het moment waarop iemand denkt dat de app hapert.

**Oorzaak:** `renderExperienceMode()` (navigation-logbook.js:147) schrijft nog het oude label. `setLanguage()` roept na `update()` nog `applyAppModeUI()` aan, dat `renderExperienceMode()` aanroept; `setExperienceMode()` doet het zonder `update()` erna.

**Fix:** haal die regel uit `renderExperienceMode()` en zet de knoplogica in één eigen functie, bijvoorbeeld `renderYeastApplyButton()`, die zowel `update()` als `renderExperienceMode()` aanroepen. Ik heb het geverifieerd door de regel te verwijderen: het juiste label blijft staan door EN → Basis → NL heen, en na het wissen van de meting keert "Gebruik dit gistadvies" terug.

Roep in `setExperienceMode()` géén volledige `update()` aan: de guardrail zegt dat wisselen van weergave nooit herberekent. Een losse render van de knop is genoeg.

### 2.3 LAAG · M8 half: "staat al in je recept" ontbreekt

De review vroeg: als het recept al overeenkomt, meld dat, en laat de knop verdwijnen of een status worden. Nu:

```
voor klik  preset kodaNight · afwegen 0,9 g · knop "Gebruik dit gistadvies" · gist 0,17%
na klik    preset custom    · afwegen 0,9 g · knop "Gebruik dit gistadvies" · gist 0,171%
           + badge "Eigen instellingen actief"
```

De klik verandert niets aan wat je afweegt, maar kost je de preset. Voorstel: valt het advies binnen de weergaveresolutie van de huidige dosis, toon dan "Staat al in je recept" in plaats van de knop.

### 2.4 LAAG · één vaste voorbereidingstijd over

In de "Zeer weinig tijd"-kaart staat nog `usable:Math.max(0,until-0.75)` (planning-shopping.js). "Na mengen nog over" rekent dus altijd met 45 minuten, terwijl de route 36, 45 of 54 minuten gebruikt. Dit zat ook al in v1.2.1 en valt onder dezelfde klasse als M2. Eén woord: `prepHours()`.

### 2.5 LAAG · één globale presetlezing over

`fermentation-live.js:636` bepaalt de AVPN-waternotitie nog met `$('preset').value==='avpnMid'`. Dat gaat nu altijd over het huidige recept en is dus niet fout. Het is wel hetzelfde patroon als H1. Met `c.presetKey` is het consistent en wordt het de moeite waard zodra de DDT-staging wordt geëxtraheerd, wat de roadmap als vervolgstap noemt.

### 2.6 Klein · de "bevroren" kern laat zijn gistcurve muteren

```js
DoughCore.YEAST_TEMP_CURVE[6][1]=2.0;   // activiteit @21 °C: 1 → 2, voor de hele app
Object.isFrozen(DoughCore.YEAST_TEMP_CURVE)  // false
```

`Object.freeze()` bevriest alleen het buitenste object. Niemand doet dit nu. Maar de kern is juist bedoeld als beschermd numeriek contract, en een deep freeze van de curve kost één regel.

---

## 3. De rekenkern

**Puurheid.** `calculation-core.js` bevat nul keer `$(`, `document.`, `window.`, `currentLang`, `localStorage` of `SAFE.`. De AVPN-uitzondering zit bewust in de adapter (`dough-fermentation.js`), niet in de kern. `presetKey` wordt precies één keer uit het formulier gelezen, in `calc()`.

**Numeriek verliesvrij.** v1.2.1 en de kandidaat zijn naast elkaar gezet over 7 presets × 4 methodes × autolyse aan/uit × 3 kamertemperaturen × 3 koelkasttemperaturen × 2 gistsoorten = **1.008 configuraties**. Vergeleken zijn alle numerieke velden van `calc()`, `yeastRecommendation()`, de fermentatiesimulatie en `waterTempAdvice()`. Uitkomst: **0 verschillen**. De guardrail "geen constante hergefit" is daarmee onafhankelijk bevestigd.

**Voorbereidingstijd** komt overeen met de guardrails: autolyse 0,5 + 0,4 = 54 min, direct machinaal 1/3 + 4/15 = 36 min, direct met de hand 1/3 + 5/12 = 45 min.

**Eén tijdlijn voor drie weergaven.** Voor vijf combinaties van route, methode en koude opslag, telkens met en zonder baktijd, komen de Basis-samenvatting, de tijdlijn en de tijdstempels in de stappen op dezelfde momenten uit. Voorbeeld met Mijn standaardrecept, KitchenAid, autolyse, baktijd woensdag 18:00:

```
Basis-samenvatting   Tot de koelkast voor koude fermentatie: ongeveer 1 u 54 min
tijdlijn             Koelkast in di 22 sep 18:00 · Koelkast uit wo 23 sep 14:00
stappen              Gepland: di 22 sep, 18:00 · Gepland: wo 23 sep, 14:00
zonder baktijd       1 u 54 min na de start · 21 u 54 min na de start
```

## 4. Weekdagen in de bakdagkeuze

Getest met de klok van de browser onder controle, tijdzone Europe/Amsterdam:

| Scenario | Uitkomst |
|---|---|
| ma 21-09 20:00, NL | Vandaag – maandag · Morgen – dinsdag · Overmorgen – woensdag · Over drie dagen – donderdag |
| idem, EN | Today – Monday · Tomorrow – Tuesday · In 2 days – Wednesday · In 3 days – Thursday |
| middernacht met lopende klok, 23:59:50 + 20 s | labels schuiven door; gekozen waarde blijft "1" |
| jaargrens, do 31-12-2026 | Vandaag – donderdag · Morgen – vrijdag |
| zomertijd, za 28-03-2026 23:30 | zaterdag · zondag · maandag · dinsdag; "Morgen 02:30" bestaat niet → 03:30 met melding |
| wintertijd, za 24-10-2026 23:30 | zaterdag · zondag · maandag · dinsdag |
| slaapstand: klok springt twee dagen zonder dat de timer afgaat | labels blijven oud tot `visibilitychange` of `focus`, daarna correct |
| langste label op 320 px ("Over drie dagen – zondag") | 187 px tekst in 226 px ruimte, past |

Het gedrag na middernacht is zoals gedocumenteerd: "Morgen – dinsdag 18:00" wordt "Morgen – woensdag 18:00", en de planning schuift 24 uur. Dat is de vervolgstap "Start this batch" uit de roadmap. De weekdag in het label maakt het in elk geval zichtbaar, waar het voorheen stil gebeurde.

## 5. Overige regressiecontrole

```
84 combinaties (2 talen × 3 modi × 7 presets × 2 methodes), alle pagina's
                                        0 NaN/Infinity/undefined/[object, 0 pageErrors
EN-sweep: Basis + Uitgebreid, 4 pagina's, met baktijd en meting
                                        349 tekstknopen, 0 Nederlandse resten
echte toetsen: 4 → 8 → 4 + blur         4 kaarten ✅
"1" als eerste cijfer van "12"          niet te vroeg gesnoeid ✅
leeg hydratatieveld + blur              63 ✅
upgrade halverwege het bakken:          9 afgevinkte stappen, meting 25,5 °C, 6 pizza's
  v1.2.1 → v1.3.0 in dezelfde browser   → alles behouden; nieuwe volgorde, stabiele sleutels;
                                          vergrendeling actief
update()                                9,5 ms → 11,1 ms (+17%), onder de waarneembaarheidsgrens
```

---

## 6. Wat aantoonbaar goed is

- **H1 is opgelost op de manier die de review vroeg**: niet door de AVPN-preset te herschrijven, maar door het voorstel een eigen identiteit te geven. Dezelfde planinhoud geeft voor en na toepassen hetzelfde advies, in 33 van 33 gevallen.
- **De kern is een echte kern.** Expliciete invoer, geen DOM, eigen Node-tests, en numeriek gelijk aan v1.2.1 over 1.008 configuraties. Dat is de stap die ik in het refactorvoorstel van augustus de eigenlijke klus noemde.
- **Eén tijdlijn, drie weergaven.** `scheduleOffsets()` voedt samenvatting, tijdlijn en stappen, en ze spreken elkaar nergens tegen.
- **De toegankelijkheid is echt verbeterd.** Contrast van 2,48 naar 5,66 als slechtste waarde, twintig unieke checkboxnamen, en `aria-pressed` op de methodes.
- **De weekdaglogica is correct aan alle randen** die ik kon bedenken, inclusief een laptop die over middernacht heen slaapt.
- **Stabiele stapsleutels maken de herordening veilig.** De meetstap is verplaatst zonder dat iemand die halverwege zit zijn vinkjes kwijtraakt.
- **De documentatie is eerlijk over wat niet gevalideerd is.** De roadmap maakt consequent onderscheid tussen implementatiecorrectheid en fysieke nauwkeurigheid, en zegt dat ook over zijn eigen tests.

## 7. Prioriteit

| | Punt | Omvang | Vóór merge? |
|---|---|---|---|
| 1 | §2.1 subgramweergave | 1 regel in `scaleQty` + 3 plekken via `ingredientAmount` | **ja** |
| 2 | §2.2 knoplabel vergrendeling | 1 regel weg + kleine helper | **ja** |
| 3 | §2.3 "staat al in je recept" | klein | liefst |
| 4 | §2.4 `until-0.75` → `prepHours()` | 1 woord | liefst |
| 5 | §2.5 en §2.6 | elk 1 regel | wanneer het uitkomt |

## 8. Methodische noot voor GPT

§2.1 glipte door 98 × 2 functionele tests en 43 browsertests om een aanwijsbare reden: de zwevende-kommarest hangt af van de diameter. Bij 32 cm, de catalogusreferentie, komt hij niet voor; bij 30 cm, de standaard, wel. En de browsersuite opent de picker met recepten zonder subgramtopping.

Een test die dit hele klasse afdekt:

```js
for (const d of [30, 40]) {                        // standaard én bovengrens
  setDiameter(d);
  for (const r of pizzaRecipes) {
    openPickerFor(r.id);
    expect(previewText()).not.toMatch(/\d[.,]\d{5,}/);
  }
}
```

§2.2 is van hetzelfde type als de oude M-2 uit de v50-audit: twee plekken die dezelfde tekst schrijven, en de laatste wint. Een taalwissel met een actieve vergrendeling is één extra browserscenario.

Alle bevindingen hierboven zijn zonder wijziging aan de repo vastgesteld. De twee fixes zijn alleen in de browser geïnjecteerd om ze te verifiëren.
