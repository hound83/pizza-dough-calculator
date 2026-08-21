# Architectuur van de v1.0.0-refactor

## Ontwerpdoelen

Deze branch maakt de golden v1.0.0 beter onderhoudbaar zonder productgedrag te wijzigen. De architectuur houdt daarom vijf harde uitgangspunten aan:

1. `main` en tag `v1.0.0` blijven de bevroren referentie.
2. Er is geen framework, package dependency, transpiler of productiebuild nodig.
3. GitHub Pages serveert de rootmap rechtstreeks.
4. De elf scripts worden als klassieke browserscripts in een vaste volgorde geladen.
5. Samengevoegde CSS en JavaScript moeten byte-voor-byte gelijk blijven aan v1.0.0 zolang deze gedrag-neutrale refactor wordt beoordeeld.

Klassieke scripts zijn hier een bewuste tussenarchitectuur. Ze behouden ondersteuning voor de bestaande inline HTML-handlers en de wereldwijde lexicale runtime zonder honderden functieaanroepen tegelijk te herschrijven. De vaste volgorde en eigenaarschapstests maken die gedeelde runtime expliciet in plaats van impliciet.

## Laadvolgorde en verantwoordelijkheden

| Volgorde | Bestand | Eigen verantwoordelijkheid |
|---:|---|---|
| 1 | `foundation.js` | veilige browseropslagwrapper, getalvelden, globale UI-state en productversie |
| 2 | `translations.js` | statisch Nederlands-Engels woordenboek en gerichte aanvullingen |
| 3 | `i18n.js` | vertaalengine, taalwissel en taalafhankelijke teksthelpers |
| 4 | `catalog.js` | gist-, bloem-, deegstijl-, saus-, temperatuur-, ingrediënt- en pizzadata |
| 5 | `pizza-picker.js` | per-bol-customizations, filters, zoeken, modalbediening en expliciete pickerselectie |
| 6 | `dough-fermentation.js` | bakkerspercentages, bolmaat, thermisch model, gistadvies, presets en hoofd-updatecyclus |
| 7 | `sauce-recipes.js` | sausaggregatie, receptsamenvattingen, pizzacustomization en kneedinstructies |
| 8 | `fermentation-live.js` | DDT/wateradvies, live temperatuurcorrecties, solver en afvinkbare fermentatiestappen |
| 9 | `planning-shopping.js` | deadlineplanning, tijdlijn, boodschappen, ovenadvies, kopieertekst en ingrediëntenmodal |
| 10 | `navigation-logbook.js` | wizardnavigatie, appmodi, receptkopie en deeglogboekweergave |
| 11 | `persistence-bootstrap.js` | schema-50-opslag/migratie, eventregistratie en de enige `DOMContentLoaded`-bootstrap |

De volgorde is een contract: latere modules mogen functies en state uit eerdere modules gebruiken. Functiedeclaraties kunnen ook pas bij gebruikersinteractie functies uit later geladen modules aanroepen, omdat alle elf scripts geladen zijn voordat de gebruiker de app bedient.

## Belangrijkste eigenaarschapsregels

- Alleen `persistence-bootstrap.js` bezit `SAVE_KEY`, `SAVE_VERSION`, migratie en `DOMContentLoaded`.
- Alleen `foundation.js` bezit `APP_VERSION`, taalstate en de generieke DOM-/getalhelpers; woordenboekdata en vertaalengine hebben afzonderlijke eigenaren.
- Recept- en ingrediëntdata horen in `catalog.js`; pickerinteractie hoort in `pizza-picker.js`.
- Pure deeg- en fermentatieberekeningen horen in `dough-fermentation.js`; live correcties horen in `fermentation-live.js`.
- `index.html` bepaalt uitsluitend structuur en scriptvolgorde; presentatie hoort in `app.css`.
- De resterende inline handlers zijn de bestaande publieke browser-API. Nieuwe interacties gebruiken bij voorkeur `addEventListener` in de bezittende module.

## Gedragsequivalentie

`tests/test_refactor_structure.js` bewaakt drie golden hashes:

| Artefact | SHA-256 |
|---|---|
| v1.0.0 single-filebron | `7045421500a5497ca403699a2297c2ad8fa3e53f81f053300e8abdd84630cf3f` |
| v1.0.0 CSS | `262e12b5356f5a50c63aa7cd7249b3c5c8b101d8954f076de1360efbc222b896` |
| v1.0.0 JavaScript | `2897bfe7eda16d93c872d49f4dc8256f99549defe1927688903009f2a98483e7` |

De test voegt de elf modules zonder scheidingstekens samen, plaatst CSS en JavaScript terug in `index.html` en eist daarna exact de single-filehash van de release. Ook valideert hij parseerbaarheid, modulevolgorde, unieke HTML-id's, alle inline-handlerfuncties en het exclusieve opslag-/bootstrap-eigenaarschap.

De bestaande `tests/test_v50.js` draait daarnaast alle 64 functionele regressies tegen de refactorroot.

## Wijzigingsworkflow

1. Kies eerst de module die eigenaar is van het te wijzigen gedrag.
2. Voeg voor een bug of functie eerst een gerichte regressietest toe.
3. Voer `npm test` uit.
4. Bij een bewuste gedragswijziging veranderen de golden hashes niet automatisch: documenteer eerst waarom de branch niet langer gedrag-neutraal is.
5. Test veranderingen aan layout, toetsenbordbediening of native browsersignalen aanvullend in Chromium op de relevante viewports.

## Bewuste vervolgstappen

ES-modules en het verwijderen van de laatste inline handlers kunnen later waardevol zijn, maar vormen een afzonderlijke architectuurstap. Dat verandert naamresolutie en de publieke browser-API en hoort daarom niet stilletjes in deze mechanische refactor. Hetzelfde geldt voor de geplande Basis/Uitgebreid-functionaliteit en de resterende LOW-toegankelijkheidsverbetering uit de golden audit.
