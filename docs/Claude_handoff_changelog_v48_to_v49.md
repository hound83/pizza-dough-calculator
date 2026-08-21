# Claude-handoff — Pizzadeegcalculator v48 → v49

**Voor:** Claude, onafhankelijke browser-crosscheck  
**Datum:** 21 augustus 2026  
**Bron:** `pizzadeeg_calculator_v48.html`  
**Kandidaat:** `pizzadeeg_calculator_v49.html`

## 0. Samenvatting en gewenste audit

v49 verwerkt alle negen bevindingen uit `Crosscheck_v48_door_Claude.md`. De functionele reparaties zijn bewust nog in één zelfstandig HTML-bestand uitgevoerd. De voorgestelde opsplitsing/refactor is dus **niet** met deze bugfixronde vermengd.

Graag vooral opnieuw in een echte Chromium-browser controleren:

1. de acht numerieke bronvelden met echt toetsenbordinvoer (`page.type()`);
2. in-place bewerken van een bestaand getal;
3. normalisatie na `change`/blur;
4. herladen van een bake-log met lege meetvelden;
5. gistsoortwissels waarbij de omgerekende waarde tegen de 3%-grens komt;
6. de ingrediëntenmodal met meerdere tomatensauzen;
7. Nederlands/Engels wisselen en de zoektermen/synoniemen.

De lokale Node/VM-suite staat op **40/40 groen**, maar deze omgeving bevat geen geïnstalleerde Chromium-, Firefox- of WebKit-binary. Daarom claim ik geen echte browserbevestiging van `page.type()`.

## 1. Bevindingen uit de v48-audit en hun oplossing

| Auditpunt | v49-oplossing | Regressiedekking |
|---|---|---|
| 1.1 `boundedNum` herschrijft velden tijdens typen | Lezen en zichtbaar corrigeren zijn gescheiden. `boundedNum()` is puur; `normalizeNumericInput()` schrijft alleen na `change`. `calc()` schrijft niet meer naar het zichtbare bronveld. Alleen het verborgen afgeleide diameter-/bolgewichtveld mag nog live wijzigen. `ensurePizzaSelections()` heeft een eigen 1–24-begrenzing tegen tijdelijke/plakte waarden. | Teken-voor-teken voor hydratatie, kamer-, steen- en deegtemperatuur, voorverwarmen, W, diameter, pizza-aantal en bolgewicht; plus in-place `430 → 40 → 480`. |
| 2.1 `Number(null) === 0` in log-sanitizer | `numOrNull()` retourneert vóór conversie `null` voor `null`, `undefined` en lege strings. | Lege water-, deeg-, koelkast- en DDT-metingen blijven `null`; DDT-statistiek blijft 0 metingen. |
| 3.1 gistveld en berekening lopen uiteen | Nieuwe `applyYeastTypeConversion()` klemt de omgerekende waarde één keer en schrijft dezelfde waarde naar veld én `exactOverride`. | Grensgeval IDY 1,2% → vers 3%; daarnaast alle 9 gistsoortparen met behoud van effectief IDY-percentage. |
| 3.2 Engelse synoniemen verdwijnen; Amatriciana niet pittig | Zoekindex neemt zowel `ITEM_EN` als de oudere vertaleroutput op. `spicyTerms` bevat zowel `chili` als `chilli`. | `eggplant/aubergine`, `zucchini/courgette`, `porcini mushrooms`; pittig-filter exact 11 en bevat Amatriciana. |
| 3.3 tomateninkoop dubbel in modal | De gecombineerde regel is uit `saucesHtml` verwijderd; `ingredientsCombinedHTML` is de enige bron in volledige modus. | Modal bevat exact één regel; kopieertekst eveneens één. |
| 3.4 nul-bulk geeft onjuiste oorzaak | Live-reden verschijnt alleen als de oorspronkelijke bulk ≥0,10 uur was en de effectieve bulk <0,10 uur is. | Zowel een ongerelateerde live-verschuiving als een werkelijk vervallen bulk getest. |
| 4.1 koelkast-plandomein inconsistent | Alleen `fridgeTemp.max` is 12 → 15 °C verruimd. Hydratatie 45–85%, kamer 10–35 °C en doel-DDT 10–35 °C blijven bewust de gekozen productgrenzen. | State-migratie met 14 °C blijft 14; waarden buiten andere grenzen normaliseren correct. |
| 4.2 lege handmatige saus negeert diameterschaal | Centrale `defaultSaucePerPizza(type)` gebruikt `toppingScale`; fallback, saustypewissel en placeholder gebruiken dezelfde functie. | Alle 7 saustypen bij 20, 32 en 40 cm (21 combinaties). |
| 4.3 Nederlandse dashboardfragmenten in EN | Risicolabels, status, vier dashboardkoppen, huidige-gistzin en visuele eindcheck zijn direct tweetalig opgebouwd. | Engelse HTML bevat geen `ruime marge`, `binnen bereik`, `richtwaarde`, `Gistactiviteit` of `Huidige gist`. |

## 2. Numerieke invoerarchitectuur

Nieuwe verantwoordelijkheden:

- `numericBounds(el)`: leest geldige HTML-min/maxwaarden;
- `clampToInputBounds(el, value)`: rekengrens zonder DOM-mutatie;
- `boundedNum(id, fallback)`: leest en begrenst voor de berekening, maar schrijft nooit;
- `normalizeNumericInput(el)`: zichtbare correctie na beëindigen van de edit;
- `normalizeStoredNumberInputs()`: eenmalige correctie na state-load;
- `calc()`: mag het actieve bronveld niet normaliseren.

Belangrijke UX-betekenis: tijdens een tussenstand kan het veld bijvoorbeeld `4` tonen terwijl `calc()` intern veilig met de minimum-steentemperatuur rekent. Zodra de gebruiker `480` heeft afgemaakt, rekent de app met 480. Bij `change` wordt een echt buitenbereikgetal zichtbaar genormaliseerd.

## 3. Bewust niet gewijzigd

- room-solver en ±1 °C-deadband;
- deadlinegedrag en cache-key;
- koel-/opwarmmodel en live optimizer;
- DDT-startcorrecties en het beleid van géén automatische learning;
- sausbatch- en gecombineerde tomatenberekening;
- catalogus: 92 recepten en 7 saustypen;
- productgrenzen hydratatie 45–85%, kamer 10–35 °C en doel-DDT 10–35 °C;
- distributievorm: één zelfvoorzienend HTML-bestand voor eenvoudig GitHub Pages-hosting.

## 4. Testresultaten

Commando:

```bash
node tests/test_v49.js
```

Resultaat: **40 regression tests passed**.

Extra dekking bovenop v48:

- 1.512 combinaties van geplande kamertemperatuur, gemeten temperatuur, bulk en bolrijs: geen NaN, geen negatieve/boven-48-uursfasen en geen vals `converged:true`;
- 36 kernreceptcombinaties over methode, diameter, hydratatie en pizza-aantal: eindige waarden en sluitende ingrediëntsom;
- alle 9 gistsoortconversies;
- alle 21 saus-defaultcombinaties;
- v48 → v49-migratie met expres ongeldige opgeslagen getallen;
- geblokkeerde `localStorage` blijft foutloos werken en waarschuwt één keer;
- catalogusinvarianten blijven 92 recepten, 7 geldige sauzen en 0 ongeldige sausreferenties.

## 5. Aanbevolen echte-browsertest

Herhaal minimaal dit scenario met `page.fill('')` gevolgd door `page.type(..., {delay:30})`:

| Veld | Typen | Verwacht vóór blur | Verwacht na blur/change |
|---|---:|---:|---:|
| hydratatie | 72 | 72 | 72 |
| kamertemperatuur | 24 | 24 | 24 |
| steentemperatuur | 480 | 480 | 480 |
| voorverwarmen | 45 | 45 | 45 |
| W-waarde | 320 | 320 | 320 |
| doel-einddeegtemperatuur | 26 | 26 | 26 |
| diameter | 35 | 35 | 35 |
| pizza-aantal | 24 | 24 | 24 |
| bolgewicht in gewichtmodus | 380 | 380 | 380 |

Aanvullend:

- vul hydratatie 100 → tijdens invoer blijft 100 zichtbaar, na blur 85;
- vul diameter 99 → tijdens invoer blijft 99 zichtbaar, na blur 40;
- vul pizza-aantal 999 → maximaal 24 receptselecties en na blur veld 24;
- verander steen 430 door de `3` tijdelijk te verwijderen en daarna `8` te typen → tussenstand 40 mag niet naar 180 springen;
- laad v48-state met `waterTemp:null`, `finalDoughTemp:''`, `fridgeTempActual:null`, `ddtCorrection:null` → na reload nog steeds lege waarden en 0 DDT-metingen;
- IDY 1,2% → verse gist → veld, override en berekening alle drie 3%;
- meerdere tomatensauzen → `Tomaten totaal inkopen` exact één keer in de modal.

## 6. Omvang en integriteit

| Bestand | Regels | Bytes | SHA-256 |
|---|---:|---:|---|
| `pizzadeeg_calculator_v49.html` | 6.356 | 393.790 | `166b0fb306e238c2aae3c0c8446b022530cd24988d103e2b1dc8fbfcda60e3de` |
| `test_v49.js` | 357 | 26.473 | `cf16e59f428bda705d806057eb06d34bb4eb4a2c246ef069d152f71b13801384` |

Ter vergelijking: v48 telde 6.290 regels en 391.137 bytes. De productcode groeide netto met 66 regels; de functionele diff bevat 125 toevoegingen en 59 verwijderingen.

## 7. Versie- en migratiegegevens

- `SAVE_KEY = 'pizzaCalcV49'`
- `SAVE_VERSION = 49`
- eerste legacybron: dynamisch `pizzaCalcV48`
- na succesvolle migratie wordt de oude sleutel verwijderd en v49 opgeslagen;
- titel, documenttitel, UI-tekst en commentaar verwijzen naar v49.

## 8. Advies over v50

v49 kan na een groene echte-browseraudit de functionele baseline voor de huidige scope zijn. Maak alleen een functionele v50 als de Chromium-audit nog een echte regressie of inconsistentie vindt.

Een opsplitsing naar HTML/CSS/JS-modules is wél een aparte architectuurwijziging en verdient een eigen versie/branch, ook wanneer de zichtbare functionaliteit gelijk blijft. Zo blijft een eventueel browserprobleem uit v49 te onderscheiden van een refactorprobleem.
