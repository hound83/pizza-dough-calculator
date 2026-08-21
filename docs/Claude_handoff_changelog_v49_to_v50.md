# Claude-handoff — Pizzadeegcalculator v49 → v50

**Doel:** onafhankelijke browser-crosscheck van de beoogde functionele baseline (“golden v50”)  
**Datum:** 21 augustus 2026  
**Bron:** `index.html` op `main` (v49)  
**Kandidaat:** `pizzadeeg_calculator_v50.html`

## 0. Samenvatting

v50 verwerkt alle vijf aanbevelingsgroepen uit `Crosscheck_v49_door_Claude.md` en één aanvullend door Michael gevonden pickerprobleem. De distributievorm blijft bewust één zelfvoorzienend HTML-bestand voor GitHub Pages. De grotere HTML/CSS/JS-refactor is niet met deze functionele ronde vermengd.

De zes wijzigingsgroepen zijn:

1. pizza-aantal tijdens typen vernietigt geen receptkeuzes of stapvinkjes meer;
2. lege verplichte numerieke velden herstellen bij `change` en state-load naar hun eigen HTML-default;
3. een deegstijlwissel overschrijft het actieve diameter- of bolgewichtveld niet meer;
4. de drie AVPN-waarschuwingen en de resterende geaudite statische teksten zijn volledig tweetalig;
5. gistsoortconversie gebruikt één afgeronde waarde voor veld én berekening;
6. de pizzapicker selecteert uitsluitend door een bewuste klik/toetsenbordactivatie; hover, focus, zoeken en filteren wijzigen selectie, rechterpaneel en commitdoel niet.

Lokale uitslag: **53/53 regressietests groen**. Daarbinnen zitten onder meer 1.512 room-solvergevallen, 30 gecombineerde render-smokes en alle 92 recepten in beide talen (184 picker-renders).

## 1. Functionele wijzigingen

### 1.1 Pizza-aantal: tijdelijke invoer kan state niet meer afsnijden

#### Probleem in v49

Bij het vervangen van `24` door `20` passeert het veld tijdelijk de geldige waarde `2`. `update()` riep op dat moment `ensurePizzaSelections()` aan, waardoor de array direct van 24 naar 2 recepten werd verkleind. De recepten voor bollen 3–24 en hun customizations waren daarna definitief weg. Hetzelfde renderpad verwijderde stapvinkjes waarvan de tijdelijke stap niet meer bestond.

#### Oplossing in v50

- De `input`-handler zet alleen voor het pizza-aantal tijdelijk `_deferDependentStatePrune=true`.
- `ensurePizzaSelections()` mag tijdens deze edit wel groeien, maar niet verkleinen.
- `pruneCompletedStepState()` verwijdert tijdens diezelfde edit geen stapvinkjes.
- De `change`/blur-handler normaliseert eerst het definitieve aantal en laat daarna de reguliere verkleining en cleanup plaatsvinden.
- De vlag wordt met `try/finally` altijd teruggezet, ook wanneer renderen onverwacht zou falen.

#### Belangrijk scenario

```text
24 recepten → veld leeg → toets “2” → toets “0” → blur

tijdens leeg/2/20 : alle 24 state-items blijven beschikbaar
na blur op 20     : exact de eerste 20 blijven behouden
bol 20            : eigen recept en bijbehorend vinkje blijven intact
```

### 1.2 Lege verplichte getalvelden herstellen veilig

#### Probleem in v49

Leeg mocht tijdens typen blijven staan, maar werd ook na blur en herladen nooit hersteld. Daardoor kon leeg onder andere leiden tot 45% hydratatie (minimumfallback), 0 g zout, 0 g gist of 0 uur bulk.

#### Oplossing in v50

`normalizeNumericInput()` maakt nu onderscheid tussen twee momenten en twee veldsoorten:

- tijdens `input`: nog steeds geen zichtbare normalisatie;
- bij `change`/blur en na state-load: een leeg verplicht veld krijgt zijn eigen HTML-`defaultValue` terug;
- bewust optioneel blijven `finalDoughTemp`, `flourW`, `saucePerPizza` en `logWaterTemp`;
- begrenzen op min/max en afronden van het pizza-aantal blijven ongewijzigd.

Omdat `loadState()` normaliseert vóór de gemigreerde state opnieuw als v50 wordt opgeslagen, kan een lege verplichte v49-waarde zichzelf niet opnieuw in v50 vastzetten.

### 1.3 Deegstijl respecteert de actieve maatbron

#### Probleem in v49

De `doughStyle`-handler schreef in gewichtmodus een nieuw aanbevolen bolgewicht naar het zichtbare bronveld. Spiegelbeeldig werd in diametermodus de diameter uit het oude tegenveld herberekend. Een stijlwissel kon dus de bewuste invoer overschrijven.

#### Oplossing in v50

De stijlhandler schrijft geen maatveld meer. `calc()` handhaaft de bestaande v49-architectuur:

- diametermodus: diameter blijft bron, alleen verborgen bolgewicht wordt afgeleid;
- gewichtmodus: bolgewicht blijft bron, alleen verborgen diameter wordt afgeleid.

### 1.4 AVPN en resterende auditteksten volledig tweetalig

De drie waarschuwingen uit `avpnMidpointYeastAdvice()` gebruiken nu expliciet `L(nl,en)`, inclusief de dynamische hoeveelheden en ratio. Daarnaast zijn exacte vertalingen toegevoegd voor:

- `← Vorige`;
- Witte/volkoren spelt, volkoren tarwe en eigen bloem;
- de bloemtype- en W-helpteksten;
- `huidig` en `✓ gekozen/selected` in de picker;
- alle gewijzigde pickerlabels en uitleg.

### 1.5 Gistconversie heeft één bron van waarheid

`applyYeastTypeConversion()` rondt de geconverteerde waarde één keer op de veldprecisie van drie decimalen af. Diezelfde waarde gaat naar:

- het zichtbare gistpercentageveld;
- `exactOverride.ySelected`;
- de verdere berekening.

Voorbeeld: IDY `0,17%` → ADY wordt overal exact `0,213%`, niet zichtbaar `0,213` versus intern `0,212500…`.

### 1.6 Picker: klikselectie strikt gescheiden van hover/focus

#### Probleem in v49

De screenshot liet links `Salami — ✓ gekozen` zien terwijl alleen hover over Quattro Formaggi het rechterpaneel al naar Quattro Formaggi veranderde. De oorzaak was een vermenging van drie soorten state:

- reeds opgeslagen recept (`huidig`);
- tijdelijke aangeklikte keuze;
- hover/focus-preview.

Nog ernstiger: het rechter recept kon daarbij tijdelijke saus-, stijl- of toppingstate van het eerder aangeklikte recept gebruiken. De knop rechts kon daardoor de gehoverde pizza met niet-bijpassende instellingen opslaan.

#### Oplossing in v50

- `pickerSelectedId` betekent uitsluitend de bewust aangeklikte tijdelijke keuze.
- De itemknoppen hebben geen `mouseenter`- of `focus`-handler meer.
- Native hover/focus-CSS blijft visuele feedback geven, maar verandert geen applicatiestate.
- Klik, Enter of spatie op de knop activeert `selectPickerRecipe()`.
- Een echte receptwissel laadt of reset de tijdelijke customizations voor precies dat recept.
- Opnieuw klikken op hetzelfde recept bewaart reeds gemaakte tijdelijke aanpassingen.
- Zoeken en filteren wijzigen alleen de lijst, niet de selectie of het rechterpaneel.
- `renderPickerPreview()` rendert uitsluitend `pickerSelectedId`.
- `choosePickerRecipe()` accepteert geen los recept-id meer en commit uitsluitend `pickerSelectedId` met de daarbij geladen pending state.
- `aria-pressed` maakt de geselecteerde toestand ook semantisch zichtbaar voor hulptechnologie.

De modaltekst beschrijft nu expliciet het tweestapsmodel: links selecteren en rechts aanpassen; pas de knop rechts slaat de pizza voor de bol op.

## 2. Versie en migratie

- `SAVE_KEY = 'pizzaCalcV50'`
- `SAVE_VERSION = 50`
- eerste legacybron: dynamisch `pizzaCalcV49`
- na succesvolle migratie wordt de v49-key verwijderd en de genormaliseerde state als v50 opgeslagen;
- titel, documenttitel en zichtbare v49-logboekteksten verwijzen naar v50.

## 3. Lokale tests

Commando:

```bash
node test_v50.js
```

Resultaat:

```text
53 regression tests passed
```

Belangrijkste nieuwe dekking:

| Gebied | Dekking |
|---|---|
| Pizza-aantal | laag-niveaustate én echte geregistreerde `input`/`change`-handlers voor 24 → 2 → 20 |
| Stapvinkjes | blijven tijdens tijdelijke invoer staan en worden pas na definitieve wijziging opgeruimd |
| Lege velden | `change` en volledige v49 → v50 state-load; verplichte en optionele velden apart |
| Maatbron | 300 g blijft 300 g in gewichtmodus; 35 cm blijft 35 cm in diametermodus |
| Gist | grensgeval 3%, alle negen typeparen en kleine IDY 0,17 → ADY 0,213 |
| AVPN | waarschuwingen gecontroleerd op bekende Nederlandse resten in EN-modus |
| Pickerinteractie | klik, zoek/filter zonder selectie-effect, dezelfde keuze opnieuw, matching commitstate, afwezigheid hover/focushandlers |
| Pickerbibliotheek | alle 92 recepten × NL/EN = 184 renders met passend recept, saus en pending id |
| Render-smoke | 3 appmodi × 2 talen × 5 deegstijlen = 30 configuraties met live metingen |
| Bestaande matrices | 1.512 room-solvergevallen, 36 kernreceptberekeningen, 21 sausdefaults en alle eerdere v49-regressies |

Aanvullende statische controle:

- exact één doctype en scriptblok;
- 153 statische id's, geen duplicaten;
- alle 51 statische inline-handleraanroepen verwijzen naar een bestaande functie of bekende browserfunctie;
- geen picker-`mouseenter`-handler;
- titel en storagekey staan op v50.

## 4. Gewenste onafhankelijke browsertest

Deze runtime bevat Playwright maar geen geïnstalleerde Chromium/Firefox/WebKit-binary. De VM-suite test de echte productfuncties en geregistreerde events, maar claimt daarom geen nieuwe echte-browserbevestiging. Graag in Chromium minimaal:

1. open bol 1, klik Salami, hover en tab naar Quattro Formaggi: rechts moet Salami blijven;
2. zoek/filter na Salami-selectie: Salami blijft rechts en blijft commitdoel;
3. klik daarna Quattro Formaggi: rechts verandert nu wel en gebruikt Quattro-defaults;
4. pas saus/topping aan en druk rechts op Kies: exact die aangeklikte combinatie wordt opgeslagen;
5. wijzig 24 pizza's via select-all/backspace en `page.type('20', {delay:30})`: bol 20 en zijn vinkje blijven behouden;
6. maak hydratatie, zout, gist en bulk leeg: tijdens typen leeg, na blur respectievelijk 63, 3, 0,17 en 1;
7. controleer dat de drie optionele velden leeg mogen blijven;
8. zet gewichtmodus op 300 g en wissel stijlen; herhaal diametermodus op 35 cm;
9. AVPN in EN: geen Nederlandse waarschuwingstekst;
10. desktop en 320/390/430 px: geen horizontale overflow of pickerproblemen.

## 5. Omvang en integriteit

| Bestand | Regels | Bytes | SHA-256 |
|---|---:|---:|---|
| `pizzadeeg_calculator_v50.html` | 6.408 | 398.099 | `2521bf92e9bad889c493ac30ba41f6c49c6c2eae9941b5f7f9a5c4b02ac1db48` |
| `test_v50.js` | 460 | 39.115 | `6434ab8fb51a1d6aafe2b42962ba87ac933ab15124aef0f3848d46afd4cec54d` |

## 6. Scopegrens en advies

Deze versie wijzigt geen receptformules, fermentatiecurves, sausberekeningen, catalogusinhoud of hardwaregrenzen. Ook is geen automatische learning toegevoegd. v50 blijft één bestand en is daarmee direct als `index.html` op GitHub Pages te hosten.

Als de echte Chromium-crosscheck groen is, is v50 een geschikte functionele baseline voor de huidige scope. Een eventuele opsplitsing naar aparte HTML/CSS/JS-bestanden hoort daarna in een afzonderlijke architectuurbranch, zodat functionele regressies niet met de refactor worden vermengd.
