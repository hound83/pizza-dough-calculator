> **Repository context (added after implementation):** this is the complete original review of 21 September 2026, preserved below without editing its findings. Its analysis-only status and unresolved findings describe the pre-implementation snapshot. For the current v1.3.0 candidate, implemented fixes, later user decisions and remaining limits, first read [V1_3_0_REVIEW_AND_ROADMAP.md](V1_3_0_REVIEW_AND_ROADMAP.md). The later target is roughly two hours until cold fermentation; shortening is optional and requires equivalent quality, and mixing times must not be shortened. The shorter-rest experiment proposed below is not an approved new preset. See [CLAUDE.md](../CLAUDE.md) for the review entry point.

---

# Pizza Dough Calculator — onafhankelijke volledige review

**Voor Michael · 21 september 2026**  
**Onderwerp:** code, aannames, Claude-reviews, gebruiksvriendelijkheid, glutenontwikkeling, temperatuur en professioneel DSP-recept.  
**Status:** analyse en aanbevelingen. Geen wijziging aan het project of publicatie uitgevoerd.

## 1. Mijn oordeel

**Ik zou voortbouwen op deze calculator. De basis is zorgvuldig, maar de wetenschappelijke voorspelkracht is beperkter dan sommige schermteksten suggereren.** De belangrijkste volgende stap is het verbeteren van concrete beslissingen voor de bakker: hoeveel gist hoort bij dit aangepaste schema, wanneer is het deeg werkelijk voldoende ontwikkeld, wat is gemeten en wat is geschat, en welke handeling moet nu gebeuren?

De app is al meer dan een ingrediëntenrekensom. De afzonderlijke fermentatiefasen, de verdeling van hoofd- en reservewater, de live correctie van toekomstige tijden, de standalone distributie en de regressiebescherming zijn waardevol. Ik zie geen reden voor een grote herbouw of een totaal andere receptaanpak.

Mijn belangrijkste inhoudelijke afwijking van de eerdere goedkeuringen: **een gedocumenteerde werkwijze met groene tests is nog geen aangetoonde, voldoende glutenontwikkeling.** Het herstelpad met rust en vouwen is verstandig, maar bewijst niet dat twee minuten eindontwikkeling op stand 2 voor iedere toegestane combinatie genoeg is. Tegelijk bewijst een professioneel recept met 15–25 minuten mengtijd niet dat je die tijd naar een KitchenAid moet kopiëren.

**De bestaande mixtijden worden in mijn advies nergens verkort.** Ik behandel de huidige geplande tijden als te behouden uitgangspunt. Wat ik zou verbeteren, is de controle op ontwikkeling en de vervolgstap als het deeg nog niet klaar is. Onderbreken wegens machinebelasting of temperatuur blijft iets anders dan verklaren dat de ontwikkeling voltooid is.

Het professionele DSP-recept bevat bruikbare procesinzichten. Het geeft op zichzelf geen grond om de bestaande gistpercentages te verlagen, DSP toe te voegen of de standaard koude bulk te vervangen door koude bolrijs.

**Aanvullende wens van Michael, verwerkt in deze review:** schema en gistbandbreedte moeten intuïtiever, invulvelden moeten hun betekenis duidelijker maken en het stappenplan moet concrete koelkast-in/uitmomenten tonen. Op de maakdag is een verplichte wachtronde van 2–4 uur vóór koeling ongewenst. Ik behandel dit als ontwerpvoorwaarde voor een korte werkwijze vóór de koelkast, met behoud van de huidige mixtijden. De eventuele opwarm-/rijsfase op de bakdag wordt afzonderlijk zichtbaar gemaakt.

### Wat het project goed doet

- Het onderscheid tussen receptformule, praktische afronding en daadwerkelijk deegbalgewicht is grotendeels consequent.
- Basis/Uitgebreid en Deeg/Deeg + saus/Volledige pizza’s dienen verschillende doelen. Dat is een nuttige structuur.
- Hoofdwater, reservewater en rustfase worden afzonderlijk meegenomen in de watertemperatuurplanning.
- Deegtemperatuur verandert geleidelijk in het fermentatiemodel. Koelkastlucht wordt dus niet onmiddellijk gelijkgesteld aan deegtemperatuur.
- Gasactiviteit en rijpingsindex zijn gescheiden. Dat voorkomt de simplificatie dat meer gist automatisch betere rijping betekent.
- De live correctie verandert de gist die al in het deeg zit niet achteraf.
- Bronbestanden, gegenereerde bundel, releasehashes, opslagmigraties en NL/EN worden serieus bewaakt.
- De feedbackfunctie is technisch van de calculatorgegevens gescheiden en blijft terecht geparkeerd.

## 2. Welke versie en welk bewijs zijn beoordeeld?

| Onderdeel | Reviewbasis |
|---|---|
| Publieke release | [v1.2.1 / commit 8da4ecb](https://github.com/hound83/pizza-dough-calculator/tree/8da4ecbfba4b289ed379da23539c58d642d1ee8e) |
| Geparkeerde kandidaat | [Draft PR #12](https://github.com/hound83/pizza-dough-calculator/pull/12), `feature/v1.3.0-release`, commit `2f3f04e24c31e973bc6e4835f7c9ede2d5f23140` |
| Live product | [Pizza Dough Calculator](https://hound83.github.io/pizza-dough-calculator/) |
| Opslagcontract | `pizzaCalcV51`, schema 51 |
| Professioneel recept | Getranscribeerde formule en werkwijze uit de projectoverdracht; geen onafhankelijk geverifieerd DSP-productblad |

De remote referenties zijn gecontroleerd. De oudere aanduiding v1.1.1 is geen juiste actuele reviewbasis. Sommige oude handoffs beschrijven bovendien eerdere kandidaten; hun blockerlabels mogen niet zonder controle op de huidige commit worden geplakt.

Gelezen zijn de repository-instructies, productguardrails, architectuur, bijdrage-instructies, beide README’s, het v1.2.0-berekeningsontwerp, de relevante v1.2.1/v1.3.0-handoffs en de beschikbare Claude-audits rond Basic/Full, menginstructies, v1.1.1, de berekeningsvernieuwing, Marinara en feedback. De conclusies hieronder volgen uit de huidige broncode, aangevuld met gerichte uitvoerproeven en de eerdere reviewgeschiedenis.

### Uitgevoerde verificatie

| Controle | v1.2.1 | v1.3.0-kandidaat |
|---|---:|---:|
| Bundelcontrole | Geslaagd | Geslaagd |
| Structuurtests | 15 geslaagd | 15 geslaagd |
| Functionele tests standalone | 89 geslaagd | 90 geslaagd |
| Functionele tests modulaire bron | 89 geslaagd | 90 geslaagd |
| Worker-tests | Niet van toepassing | 16 geslaagd |
| Volledige Playwright-suite in deze omgeving | Niet voltooid: 40 browserstartfouten, 1 infrastructuurtest geslaagd | Niet voltooid: 46 browserstartfouten, 1 infrastructuurtest geslaagd |

`npm test` is op beide exacte bronkopieën uitgevoerd. De totale opdracht eindigde **niet groen**, doordat de verwachte Chromium-installatie ontbreekt. De browsergevallen faalden bij het starten van de browser; dit toont geen toepassingsregressie aan, maar is evenmin bewijs dat die gevallen nu slagen.

Daarnaast heb ik de live desktopinterface en de NL/EN-workflow bekeken, de zichtbare bedieningsnamen onderzocht en gerichte berekeningen uitgevoerd voor deadlines, schaalafronding, temperatuurverloop en gistadvies. Dit vervangt geen volledige browsermatrix. De eerder vastgelegde groene Chromium-runs en mobiele controles zijn historische onderbouwing, geen nieuwe onafhankelijke run van mijn kant.

De drie modules `dough-fermentation.js`, `fermentation-live.js` en `planning-shopping.js` zijn byte-identiek tussen de beoordeelde release en kandidaat. De bevindingen in die modules gelden dus voor beide.

## 3. Bevindingen met ernst, bewijs en impact

**Betekenis:** hoog = wezenlijk verkeerd advies of een belangrijke proceszwakte; middel = concrete verwarring, foutieve hoeveelheid of relevante onzekerheid; laag = beperkte hinder/onderhoud; observatie = geen aangetoond defect. Wetenschappelijke onzekerheid wordt niet als bewezen rekenfout gepresenteerd.

### H1 — AVPN kan de deadlinehulp een gistadvies uit het verkeerde regime laten gebruiken

**Ernst: hoog · aantoonbaar logisch defect.**

**Bewijs:** `planning-shopping.js`, `deadlineRecommendation()`, maakt een nieuw voorgesteld schema en roept `yeastRecommendation(planC)` aan. Die functie in `dough-fermentation.js` kiest de AVPN-uitzondering op basis van de globale DOM-selectie `$('preset').value`, in plaats van uitsluitend op basis van het te beoordelen plan.

In een gerichte proef met de AVPN-preset en een baktijd acht uur vooruit stelt de planner 2 uur bulk + 5 uur bolrijs bij 23 °C voor. Het gistadvies blijft echter het AVPN-rekenmidden:

| Berekening voor hetzelfde voorgestelde schema | Verse gist, % bloem |
|---|---:|
| Met de oorspronkelijke AVPN-selectie nog actief | 0,09118% |
| Via de generieke modelroute | 0,33916% |

Dat is een factor **3,72 verschil** door de selectiecontext. Dit bewijst niet dat 0,33916% biologisch optimaal is; het bewijst dat dezelfde planinhoud twee verschillende adviesregimes krijgt. Bij toepassen wordt het recept vervolgens aangepast, waardoor de oorspronkelijke uitzonderingscontext ook nog verandert.

**Impact:** iemand kan een verkort, warmer dagschema overnemen met een gistgetal dat uit de officiële referentiepresentatie komt, niet uit een coherente beoordeling van dat nieuwe schema.

**Richting:** maak de adviescontext expliciet. Een AVPN-referentie blijft herkenbaar een referentie; een afwijkend deadlinevoorstel krijgt een eigen, duidelijk benoemd modeladvies. Test dat het advies vóór en ná toepassen bij dezelfde planinhoud gelijk blijft. De officiële preset zelf hoeft daarvoor niet te worden herschreven.

### H2 — De menginstructie sluit onvoldoende uit dat onontwikkeld deeg als klaar wordt behandeld

**Ernst: hoog voor receptkwaliteit · inhoudelijke beoordeling, geen bewezen mislukking van iedere batch.**

**Bewijs:** de KitchenAid-instructie in `methodInstructions()` zegt te stoppen zodra de temperatuur richting 24 °C gaat, of het deeg glanzend/plakkerig wordt. Daarna volgt een herstelpad van vijf minuten rust, eventueel 6–10 duw-vouw-draaibewegingen en opnieuw rust. De guardrail sluit extra machinetijd uit.

Een temperatuurdoel is geen ontwikkelingsmeting. Glans en plakkerigheid zijn op zichzelf ook geen betrouwbare diagnose van overmixen. De controle moet gaan over verandering van samenhang, rekbaarheid, weerstand en draagkracht, rekening houdend met hydratatie en rust.

**Impact:** het huidige taalgebruik kan een te vroege definitieve stop aanmoedigen. Het herstelpad is nuttig, maar heeft geen onderbouwde garantie dat iedere zwakke batch er voldoende mee herstelt.

**Richting:** behoud alle huidige geplande mengtijden en scheid drie beslissingen: is alles opgenomen, is de machine/temperatuur onder controle, is het netwerk voldoende ontwikkeld? Beschrijf expliciet wat te doen wanneer de laatste controle nog onvoldoende is. Meer hierover in §6. Een eventuele wijziging van de vaste machinefasen vraagt een afzonderlijk beoordeelde receptwijziging en passend modeladvies; die is hier niet uitgevoerd.

### M1 — Kleine toppinghoeveelheden worden veel te grof afgerond

**Ernst: middel · aantoonbaar hoeveelheidsdefect.**

**Bewijs:** `foundation.js`, `scaleQty()`, geeft gramhoeveelheden onder 20 g een ondergrens van 1 g per pizza. Bij de referentiediameter 32 cm wordt bijvoorbeeld 0,4 g oregano 1 g. Vier pizza’s krijgen daardoor 4 g in plaats van 1,6 g: **150% meer**. De functie zet in isolatie ook 0 g om naar 1 g; dat laatste is een onjuist algemeen functiegedrag, niet de claim dat er nu een specifiek nul-ingrediënt in het menu staat.

Claude signaleerde deze ondergrens al bij de Marinara-review, maar behandelde die daar als buiten de patchscope. Voor een volledige receptreview is hij wel relevant.

**Richting:** behoud de oppervlakteschaling, maar reken intern zonder deze afronding. Rond bij presentatie ingrediëntafhankelijk af, en waar mogelijk pas na aggregatie. Kruiden, gist, knoflook en mozzarella vragen niet dezelfde resolutie. Nul moet nul blijven.

### M2 — De deadlinekaart toont een andere totale tijd dan de planner gebruikt

**Ernst: middel · aantoonbaar presentatie-/planningsdefect.**

**Bewijs:** `deadlineScheduleStart()` gebruikt `prepHours()`. `buildDeadlineAdvice()` toont op twee plaatsen echter `fermentationHours(c) + 0.5`. Bij de standaardroute met autolyse is de voorbereiding 0,9 uur. Daardoor staat in de deadlinekaart **25 uur 30**, terwijl het startmoment en de tijdlijn uitgaan van **25 uur 54**. Verschil: 24 minuten.

**Richting:** één gedeelde doorlooptijdberekening voor advieskaart, tijdlijn en startmoment. De bestaande meng- en rusttijden blijven behouden. Een optioneel herstelpad mag extra tijd zichtbaar toevoegen in plaats van ongemerkt buiten het budget vallen.

### M3 — Een ingevoerde doeltemperatuur krijgt het label ‘gemeten’

**Ernst: middel · aantoonbare onjuiste bronvermelding.**

**Bewijs:** `buildFermentationScience()` bepaalt het woord ‘gemeten’ via `c.doughTempDefault`. Een handmatig ingestelde doeltemperatuur van 25 °C, met het veld voor werkelijk gemeten temperatuur leeg, produceert ‘startdeeg: gemeten 25 °C’. De werkelijk gemeten waarde bestaat als afzonderlijke live invoer.

**Impact:** de gebruiker denkt dat een modeluitkomst op een observatie steunt terwijl het nog een planning is.

**Richting:** onderscheid standaarddoel, handmatig doel, echte meting en geschat vervolg expliciet. Gebruik dezelfde herkomst in dashboard, technische uitleg, logboek en gekopieerd recept.

### M4 — De plaats van de temperatuurmeting past niet bij ‘direct na het kneden’

**Ernst: middel · aantoonbare workflow-inconsistentie.**

In het zichtbare stappenplan komt de temperatuurmeting ná de handmatige finish met vijf minuten rust en mogelijk nog 5–10 minuten extra rust, plus de ontwikkelingscontrole. De tekst vraagt vervolgens direct na het kneden te meten. De thermische berekening behandelt de startwaarde wel als temperatuur aan het begin van het vervolgproces.

**Richting:** definieer één meetmoment. Meet de machinale eindtemperatuur meteen na de machinefase; als daarna relevante handmatige ontwikkeling/rust volgt, benoem ook het begin van de bulkfase. Gebruik voor fermentatieplanning de juiste processtart. Voeg in Basis niet automatisch twee verplichte meetvelden toe: één helder gekozen moment is beter dan twee onduidelijke.

### M5 — De precisie en toepassingsgrenzen van het temperatuur-/gistmodel verdienen duidelijkere presentatie

**Ernst: middel · modelonzekerheid en communicatie.**

De modelcode benoemt de empirische grenzen redelijk eerlijk, maar de hoofdervaring toont onder andere exact ogende gistmiddens en ‘onzekerheid ±28%’. Dat percentage is een ingestelde praktische marge, geen uit meetdata berekend betrouwbaarheidsinterval. Ook ‘kalibratie’ suggereert meer meetbasis dan voor de vaste modeltermen is aangetoond.

Dezelfde mengopwarming wordt bovendien toegepast buiten de referentiebatch van ongeveer 880 g. De capaciteitswaarschuwing waarschuwt vooral aan de grote kant; kleine batches die slecht door de haak worden gepakt zijn een andere onzekerheid. De lagere zekerheid van Pro/direct wordt niet even duidelijk in Basis getoond.

**Richting:** toon praktisch afgerond advies, ‘geschat’ en een begrijpelijke toelichting op de toepassingsgrens. Verplaats exacte indices naar details. Houd huidige constants vast totdat metingen een wijziging dragen; vul ontbrekende kennis niet op met een nieuw willekeurig correctiefactorje.

### M6 — Wetenschappelijke bronverwijzingen zijn niet voldoende controleerbaar

**Ernst: middel · onderbouwingsschuld.**

`buildFermentationScience()` noemt nog ‘AVPN 2024/2026’. In deze review is het officiële reglement 2024 geverifieerd; de tekst identificeert geen apart document uit 2026. De papers van Covino en Di Stasio worden genoemd zonder de experimentele context te verbinden aan de betreffende modelclaims.

**Richting:** geef per bron titel, jaar, link en toepassingsgrens. Benoem apart welke getallen uit een voorschrift komen, welke uit onderzoek volgen, welke productkeuzes zijn en welke slechts modelinstellingen zijn. De genoemde pizzastudies valideren niet automatisch de specifieke koelkastconstanten of gistcurve van deze app.

### M7 — Primaire knoppen hebben onvoldoende tekstcontrast; afvinkvakjes missen onderscheidende namen

**Ernst: middel · aantoonbare toegankelijkheidsproblemen.**

De zichtbare knop ‘Volgende: Stappenplan’ gebruikt witte tekst, 16 px en gewicht 800, op een verloop van `#ee6b49` naar `#f08a55`. De berekende contrastratio’s aan de uiteinden zijn circa **3,07:1 en 2,48:1**. De 16 px tekst valt niet onder de uitzondering voor grote tekst; de referentie is 4,5:1. Dit is een specifieke contrastbevinding, geen volledige WCAG-audit. [W3C: contrastminimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

In de zichtbare toegankelijkheidsboom heten de stapcheckboxes allemaal ‘✓’. De omhulling zegt generiek ‘Stap afvinken’, zonder de stap te onderscheiden.

**Richting:** gebruik donkerdere knopachtergrond of passende donkere tekst; geef ieder vakje de naam van zijn stap, bijvoorbeeld ‘Eerste menging afgerond’. Controleer de gekozen mengmethode ook semantisch, met een passende geselecteerde status. Dit heeft meer prioriteit dan cosmetische animaties.

### L1 — De werkschermen bevatten te veel technische en herhaalde tekst

**Ernst: laag tot middel voor gebruiksgemak · ontwerpbeoordeling.**

De app ziet er verzorgd uit, maar de bakker moet door relatief lange paragrafen heen om drie mengfasen uit elkaar te halen. De tijdlijn staat na de volledige stappenreeks. Details over versiegedrag en het niet automatisch leren van het logboek komen op meerdere plaatsen terug. Veel secundaire tekst is 10–13 px.

**Richting:** fasen met aparte tijd/snelheid, tijdlijn bovenaan, één compacte ingrediënten-/waterkaart, details onder een uitklapper en essentiële handelingen in goed leesbare tekst. Zie §7.

### M8 — Schema en gistadvies zijn onvoldoende met elkaar verbonden in Basis

**Ernst: middel voor begrijpelijkheid · rechtstreeks zichtbaar in de interface.**

In de gecontroleerde standaardweergave staat ‘0,65–1,16 g IDY’ prominent, gevolgd door ‘Midden 0,91 g • onzekerheid ±28% • 5,9 gistactiviteitsuren @ 21 °C’. De gebruiker ziet daarnaast ‘Advies toepassen’, terwijl het recept al 0,9 g bevat en binnen het bereik ligt. De volledige faseverdeling staat niet direct naast het getal; ‘25 uur’ in de presetnaam en ingrediëntensamenvatting maakt niet duidelijk hoeveel tijd buiten en in de koelkast wordt bedoeld.

**Impact:** het scherm vraagt de gebruiker zelf te bepalen welk getal hij moet wegen en of hij nog iets moet toepassen. Ook kan een gistbandbreedte worden gelezen als keuzevrijheid om meer of minder gist te gebruiken zonder gevolgen voor de planning.

**Richting:** begin met ‘Voor dit schema: gebruik 0,9 g instant droge gist’, toon de actuele faseverdeling ernaast en benoem het bereik als modelmarge. Als het recept al overeenkomt, meld ‘Staat al in je recept’. Scheid een wijziging van alleen gist duidelijk van een wijziging van het hele schema. Zie het concrete voorstel hieronder.

### L2 — Globale UI-toestand lekt het rekenmodel in

**Ernst: laag als algemene technische schuld; bij H1 reeds concreet gebruikersprobleem.**

De modules zijn nuttig opgesplitst, maar veel functies combineren DOM, berekening en tekst. `yeastRecommendation()` is een concreet voorbeeld van een ogenschijnlijk op parameters gebaseerde functie die alsnog de huidige UI-selectie leest.

**Richting:** trek geleidelijk een kleine pure rekenkern uit de bestaande modules. Geef adviescontext en configuratie expliciet mee. Laat formattering en NL/EN buiten de numerieke kern. Daarvoor is geen frameworkmigratie nodig.

### O1 — Het eerder gemelde probleem rond 48 uur is niet opnieuw gereproduceerd

**Observatie, geen nieuw bewezen defect.** Claude en de architectuurdocumentatie noemen een ontbrekend deadlineplan rond 48 uur vooruit. Mijn gerichte sweep over zeven presets en verschillende grenzen, inclusief 47,9/48/48,1 uur, reproduceerde geen ontbrekend plan. De huidige functie heeft voor langere termijnen een afsluitende `else`.

Laat het historische issue traceerbaar, maar maak het volgende onderzoek afhankelijk van de exacte oude invoer, datumcontext en stacktrace. Ik zou het niet als opnieuw bevestigd of als nieuwe v1.2.1-regressie rapporteren.

### O2 — Feedback is nog steeds geen productieklare release, maar oude blockers zijn deels opgelost

De actuele Worker vereist een hostname, schermt gebruikersinhoud af met een adaptieve tekstfence, verwijdert opmaakcontroletekens, normaliseert voor letterlijke e-maildetectie en gebruikt twee limieten. De eerdere harde bevindingen mogen daarom niet als allemaal open worden overgenomen.

De publicatieconfiguratie en echte end-to-endproef ontbreken bewust. Dat blijft een **releaseblocker voor deze feedbackfunctie**, geen blocker voor het gebruiken van de bestaande calculator. Cloudflare blijft geparkeerd.

Laag geprioriteerde aandachtspunten voor wanneer dit werk ooit wordt hervat: het honeypotpad kan de client succes laten melden zonder issue; de 16 KiB-grens wordt na het inlezen van de body gecontroleerd; herhaalde verzending na een onduidelijke netwerkuitkomst verdient aandacht. Dit zijn geen in deze review gedemonstreerde exploits.

De README beschrijft de gedeelde issuebeperking inmiddels correct als **per Cloudflare-locatie**. Het is dus geen harde wereldwijde maximumgarantie; ik tel dit niet als nieuwe documentatiefout. [Cloudflare: Rate Limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/).

## 4. Welke eerdere Claude-conclusies neem ik over, en welke nuanceer ik?

| Onderwerp | Mijn oordeel op de huidige versie |
|---|---|
| Stapsgewijs thermisch model | Mee eens: inhoudelijk betere structuur dan één onverklaarde watertemperatuurcorrectie. De referentie-uitkomsten zijn reproduceerbaar. |
| Model is goedgekeurd omdat de specificatie exact wordt uitgevoerd | Softwarematig overtuigend; geen onafhankelijke fysische validatie van de ingevoerde constants. |
| KitchenAid: herstel met rust en vouwen sluit de oude instructiekloof | Gedeeltelijk eens. Er is nu een vervolgpad, maar voldoende eindontwikkeling voor alle recepten/batches is niet aangetoond. |
| Minder dan stand 2 is automatisch mechanisch veilig | Niet als algemene conclusie overnemen. Belasting en handleiding tellen; onder een snelheidsmaximum blijven bewijst geen geschikte kneedbelasting. |
| Minuten op stand 1 en 2 via toerental omrekenen naar ‘gelijke arbeid’ | Hooguit een grove intuïtie. De mechanische belasting, vervorming en het contact met het deeg zijn niet lineair uit toerental af te leiden. |
| Marinara verloor zijn olieafwerking | Was een terechte bevinding op de oude kandidaat. De 5 g EVOO-afwerking is in de release hersteld; niet opnieuw als open fout opvoeren. |
| Afronding naar minimaal 1 g | Nog aanwezig en nu wel relevant voor de gevraagde volledige review. |
| Reservewaterhelften en voorbereidingstijd | Eerdere correcties zijn aanwezig. Er resteert een aparte vaste `+0.5` in de deadlineweergave. |
| Native spinnergedrag en ‘1 hours’ | Eerdere correcties/documentatie zijn verwerkt en regressiegedekt. |
| ‘Na de rust’ zonder autolyse zou fout zijn | De latere intrekking door Claude was terecht: de directe route heeft een hydratatierust met gist. |
| Oude v1.3.0-securityblockers | Opnieuw aan actuele code toetsen; de beschreven correcties en 16 geslaagde Worker-tests dragen wezenlijke verbeteringen. |
| 48-uursdeadlinecrash | Historisch gemeld, in mijn gerichte proef niet gereproduceerd. |

Een productguardrail is nuttig om onbedoelde verandering te voorkomen. Hij maakt een aanname niet wetenschappelijk waar. De sterkste vervolgreview koppelt iedere belangrijke guardrail aan het soort bewijs dat hem draagt: gebruikerskeuze, softwarecontract, waarneming of onderzoek.

## 5. Temperatuur, fermentatie en wetenschappelijke onderbouwing

### 5.1 Wat de huidige temperatuurberekening werkelijk doet

De ingredientenwarmte wordt gewogen met soortelijke warmte: bloem 1,85, water 4,186, zout 0,9 en olie 2,0 J/(g·K). Vervolgens worden eerste menging, rust, toevoeging van reservewater/zout/olie en verdere mengopwarming afzonderlijk behandeld. De temperatuur tijdens een rust-/fermentatiefase volgt:

`T(t) = T_omgeving + (T_start − T_omgeving) × exp(−t/τ)`

Dit is een bruikbare vereenvoudiging. De app modelleert geen ruimtelijke temperatuurverdeling tussen kern en buitenkant, geen apart kommateriaal en geen gemeten motorarbeid. Sommige effecten zitten impliciet in de ingestelde opwarmingstermen.

| Aanname | Huidige instelling | Mijn beoordeling |
|---|---|---|
| Ingrediënttemperaturen | Bloem en latere toevoegingen doorgaans op kamertemperatuur | Redelijk startpunt; minder passend bij koude voorraad/kom |
| Autolyse | 30 minuten koelkast | Vast productcontract; koele en warme autolyse zijn niet functioneel identiek |
| Directe hydratatierust | 20 minuten buiten, gist reeds aanwezig | Terecht afzonderlijk benoemd; fermentatie begint hier al |
| Thermische rustconstante | τ = 2,27 uur | Fitte modelwaarde, geen algemeen gemeten kom-/deegconstante |
| Opwarming mengen | Vaste stijging per methode en fase | Referentiebatchmodel, geen universele merkeigenschap |
| Fermentatie bulk | τ = 2,4 × massa(kg)^(1/3), begrensd 1,5–4,5 uur | Plausibele praktische vorm, geometrie en container ontbreken |
| Fermentatie bollen | τ = 1,1 × (bolgewicht/250)^(1/3), begrensd 0,7–2 uur | Vooral werkelijk in eigen bakken valideren |
| Koelen versus opwarmen | Zelfde basisvorm/τ per deegvorm | Praktische vereenvoudiging; koelkaststroming en kamerlucht kunnen verschillen |

De macht 1/3 is niet op zichzelf een fout: bij een vereenvoudigd model met vergelijkbare vorm en warmteoverdracht aan het oppervlak kan zo’n schaalverband ontstaan. Interne warmtegeleiding en veranderende vorm kunnen anders schalen. Zonder metingen zou ik noch 1/3, noch de huidige 1,1 uur zomaar door een ‘wetenschappelijker’ getal vervangen.

### 5.2 Wat dat concreet betekent voor opwarmen en afkoelen

**Onderstaande cijfers zijn uitkomsten van de huidige formule, geen gemeten temperaturen.** Voor een bol van 220 g is τ ongeveer 1,054 uur:

| Modelscenario | Na 2 uur | Na 4 uur |
|---|---:|---:|
| Bol begint op 4 °C, kamer 21 °C | 18,45 °C | 20,62 °C |
| Bol begint op 24 °C, koelkast 4 °C | 7,00 °C | 4,45 °C |

Die vrij snelle benadering van de omgeving beïnvloedt het berekende gistadvies. Als de effectieve τ in een bepaalde doos bijvoorbeeld 2,6 uur zou zijn, geeft dezelfde rekenvorm na vier uur opwarmen slechts 17,35 °C. **Dat is een gevoeligheidsvoorbeeld, geen bewijs dat 2,6 de juiste vervanger is.**

De relevante ontbrekende factoren zijn bolvorm/hoogte, doosmateriaal en deksel, afstand tussen bollen, stapeling, koelkastbelasting en luchtstroming. Het professionele recept koelt bovendien pas na het opbollen. De volledige 16,4 kg behandelen als één gekoelde massa zou daarvoor onjuist zijn; een volle koelkast met meerdere bakken blijft wel anders dan één thuisbak.

Bij de mengopwarming werkt een fout in de aangenomen warmteontwikkeling door in het wateradvies. De respons van einddeegtemperatuur op hoofdwater is rond de referentie ongeveer 0,441 bij autolyse en 0,475 direct. Een fout van 1 °C aan het eind komt daardoor overeen met ongeveer 2,27 respectievelijk 2,11 °C hoofdwatercorrectie. Dat verklaart waarom tienden graden in het wateradvies weinig praktische zekerheid toevoegen.

Mijn gevoeligheidsproef met ±30% op de ingestelde KitchenAid-opwarming gaf bij een doel van 25 °C ongeveer 15,14–25,41 °C hoofdwater. De volledige spreiding is circa 10,27 °C. De eerder besproken ‘7–11,5 °C’ moet dus als spreiding tussen scenario’s worden gelezen, niet automatisch als ±11,5 °C meetfout of statistisch interval.

**Aanbeveling:** verbeter eerst herkomstlabels en verzamel consistente metingen. Verander de onderliggende thermische constants daarna alleen als een herhaalbare afwijking zichtbaar is.

### 5.3 Gist, rijping en bloemsterkte

De generieke gistregel gebruikt een temperatuurcurve, geïntegreerde activiteitsuren, een macht van ongeveer 0,8, een zoutfactor, een stijlfactor en grenzen voor de dosering. Deze structuur kan bruikbare richting geven. De exacte combinatie is niet als één voorspellend pizzamodel gevalideerd.

| Modelonderdeel | Belangrijke beperking |
|---|---|
| Activiteit bij 4 °C = 0,04 ten opzichte van 21 °C | Geen algemeen vast percentage voor iedere gist, zoutdosering en deegomgeving |
| Gistadvies ≈ 0,68 / activiteitsuren^0,8 | Praktische fit; geen rechtstreeks uit eerste beginselen afgeleide dosering |
| Stijlfactor | Stijlnaam is een proxy voor gewenst resultaat, niet zelf een biologische eigenschap |
| Zoutcorrectie | Richting aannemelijk; exacte exponent vraagt validatie binnen pizzadeeg |
| Rijpingsindex met Q10 van 2 | Nuttige ordening, maar enzymen, pH en glutenverandering zijn niet één uniform proces |
| W-afgeleide capaciteit | Geen houdbaarheidsgarantie. W beschrijft maar een deel van bloemgedrag |
| Onzekerheidspercentage | Heuristische adviesmarge, geen kansberekening |
| Volume-einddoel | Praktische observatie; zichtbare volumegroei hangt ook af van gasretentie en deegvorm |

Ik zou de bestaande ±1 °C-deadband behouden. De functionele tests bevestigen dat kleine afwijkingen het plan niet laten schommelen. Hij is een bewuste gebruikskeuze, geen uitspraak dat temperatuurverschillen biologisch pas boven 1 °C effect hebben.

De AVPN-preset is een referentie binnen een eigen kader. Het officiële document noemt onder andere verse gist per liter water en omstandigheden voor traditionele bereiding; het rekenkundige midden van een toegestane range is geen universeel optimum bij ieder verkort of gekoeld schema. [AVPN-reglement 2024](https://www.pizzanapoletana.org/public/pdf/Disciplinare-2024-ENG.pdf).

### 5.4 Wat onderzoek toevoegt — en waar de overdracht stopt

**Mengen en gluten.** Experimenteel onderzoek laat zien dat netwerkontwikkeling afhangt van vervorming, energie-inbreng en rust; verder mengen kan na een optimum ook verslechtering geven. De minuten uit een onderzoeksopstelling zijn niet rechtstreeks te vertalen naar een huishoudelijke machine. Voor deze app ondersteunt dit een combinatie van behouden basistijd, rust en ontwikkelingscontrole, niet een generieke verkorting. [Vidal e.a., 2022](https://pmc.ncbi.nlm.nih.gov/articles/PMC8963076/), [Muchová e.a., 2010](https://cjfs.agriculturejournals.cz/pdfs/cjf/2010/02/02.pdf).

**Fermentatieduur.** Covino e.a. onderzochten pizza bij 22 °C en 80% relatieve luchtvochtigheid, tot 48 uur. De structuur en reologische eigenschappen veranderden met de tijd. Dat ondersteunt dat een lange rijs meer doet dan gas produceren. Het valideert geen identieke ontwikkeling bij twintig uur thuis in de koelkast en levert geen universele W-naar-urenformule. [Covino e.a., 2023](https://www.mdpi.com/2304-8158/12/7/1407).

**Verteerbaarheid.** Het onderzoek van Di Stasio e.a. uit 2025 vergelijkt microbiële rijsmiddelen en fermentatietijd met laboratoriummetingen van vertering. Zulke resultaten rechtvaardigen geen algemene belofte dat ieder lang gerezen deeg beter wordt verdragen, en zijn niet rechtstreeks bewijs voor de werking van een onbekend gedroogd zuurdesempoeder. [Di Stasio e.a., 2025](https://doi.org/10.3390/foods14081418).

**Recente bloemontwikkeling.** Een studie uit april 2026 naar enzymatisch behandelde zemelen in pizzabloem laat zien dat samenstelling en behandeling wateropname en reologie sterk kunnen veranderen. De gerapporteerde ontwikkeltijd komt uit instrumentele beoordeling; die is geen KitchenAid-kneedadvies. De bruikbare les voor deze app is dat W en eiwitpercentage alleen niet alle bloemverschillen verklaren. Er volgt geen aanbeveling uit om enzymen aan jouw recepten toe te voegen. [Fathi e.a., 2026](https://ift.onlinelibrary.wiley.com/doi/10.1111/1750-3841.71076).

**Warmtetransport.** Er bestaat experimenteel onderzoek naar thermische diffusiviteit van pizzadeeg, maar het gevonden onderzoek richt zich op lage temperaturen en bevriezen. Daarmee is geen exacte opwarmconstante voor jouw afgedekte deegbak aangetoond. [Kumcuoglu e.a., 2007](https://onlinelibrary.wiley.com/doi/10.1111/j.1745-4549.2007.00106.x).

Dit is een gerichte actualiteits- en onderbouwingstoets tot de reviewdatum, geen uitputtende systematische literatuurreview. Bij beperkt toegankelijke publicaties zijn alleen de controleerbare abstract-/publicatiegegevens gebruikt. Ik heb geen direct toepasbare recente validatiestudie gevonden die de volledige thuiscalculator ineens van betrouwbare nieuwe constants voorziet.

## 6. Glutenontwikkeling en mixtijden: wat ik concreet anders zou doen

### Huidige tijden eerlijk optellen

Onderstaande tijden tellen de eerste menging mee; rusttijd staat er los van. Opname van ingrediënten en intensieve eindontwikkeling zijn functioneel niet hetzelfde.

| Methode | Met autolyse: actieve mengtijd | Zonder autolyse: actieve mengtijd | Beoordeling |
|---|---:|---:|---|
| KitchenAid | 2 + 3 + 2 + 2 = **9 min** | 2 + 2 + 2 = **6 min** | Laatste ontwikkelfase slechts 2 min op stand 2; voldoende resultaat moet worden vastgesteld |
| Kenwood | Circa **7,5–10 min** | Circa **5,5–8 min** | Merknaam alleen is onvoldoende om intensiteit/capaciteit vast te leggen |
| Hand | Circa **10–15 min** inclusief eerste menging | Circa **10–15 min** | Uitvoering en deegsignalen blijven sterk bepalend |
| Spiraalkneder | Eerste menging + ontwikkeling tot passend eindpunt | Idem | Terecht geen schijnbaar universele professionele tijd |
| Professioneel DSP-recept | **15–25 min**, met 20 min rust ertussen | Niet opgegeven | Mixer, snelheid en betekenis van ‘mengen’ onbekend |

KitchenAid zelf adviseert stand 2 voor het kneden. De merknaam vertelt echter niet welk exact model, welke capaciteit en welke toegestane belastingsduur Michael gebruikt. Daarom zou ik hier geen universele verlenging met een willekeurig aantal machineminuten uitschrijven. [KitchenAid: kneedsnelheid](https://www.kitchenaid.co.uk/faq/fold-speed-for-kneading-dough).

### Mijn voorgestelde instructielogica

1. **Behoud de bestaande geplande mengfasen en tijden.** Markeer per fase of het doel bevochtigen, opnemen van gist/zout/water of eindontwikkeling is.
2. **Maak temperatuur een procescontrole.** Wanneer het deeg te snel opwarmt, onderbreek of pas de verdere werkwijze aan. Zet een onderbreking niet gelijk aan ‘klaar’; voer de ontwikkelingscontrole alsnog uit.
3. **Beoordeel na een korte, vaste ontspanning.** Een klein stukje moet gecontroleerd kunnen uitrekken tot een samenhangend dun vlies. Voor pizza is een extreem dun, maximaal doorzichtig vlies niet het enige goede eindpunt.
4. **Onderscheid strak en sterk van zwak en scheurend.** Sterk deeg dat terugspringt vraagt vaak ontspanning. Deeg dat na ontspanning direct rafelig scheurt en weinig samenhang heeft, vraagt een andere vervolgactie. Slapper worden tijdens verdere bewerking is weer een derde situatie.
5. **Laat het herstelpad een vervolgstap hebben.** Als rust plus de genoemde vouwen onvoldoende helpt, mag de app het proces niet stilzwijgend als geslaagd beschouwen. Beschrijf verdere rustige handmatige ontwikkeling en herbeoordeling, of een afzonderlijk gevalideerde machinecyclus binnen de handleiding.
6. **Registreer wat er werkelijk nodig was.** Aantal herstelrondes, mengfasen, temperatuur en resultaat zijn nuttiger dan alleen ‘te traag/te snel’ na de fermentatie.

Mijn eigen oordeel: **het is aannemelijk dat sommige huidige batches meer ontwikkeling nodig hebben, vooral afhankelijk van bloem, batchgrootte en haakcontact. Dat is iets anders dan aantonen dat het huidige standaardrecept structureel te kort wordt gemengd.** Die laatste conclusie vraagt bakproeven.

Een vaste 24 °C is in de app een werkdoel. Het is geen universele temperatuur waarbij gluten plotseling beschadigd zijn. Evenmin is ‘het deeg glanst’ voldoende om schade vast te stellen. De waarschuwing moet letten op duidelijke verandering in structuur en beheersbaarheid, in samenhang met temperatuur en belasting.

### Een relevant verschil dat in de receptvergelijking makkelijk wordt gemist

Het standaardrecept toont afgerond 530 g bloem, 335 g totaal water en 20 g reservewater. De eerste fase heeft dus **315/530 ≈ 59,4% hydratatie**, terwijl het einddeeg ongeveer 63,2% heeft. Het professionele recept lijkt vóór de rust al zijn water te gebruiken en start rond 63% ten opzichte van de opgegeven bloem.

Dat verschil in eerste-fasehydratatie kan mengweerstand, wateropname en de opname van later toegevoegd water beïnvloeden. ‘Beide recepten zijn 63%’ betekent dus niet dat de mixer in de eerste fase hetzelfde deeg verwerkt. Dit is direct bruikbaar als uitleg; het is nog geen reden om de reservewatermethode te schrappen.

## 7. Layout, opmaak en gebruiksvriendelijkheid

Ik zou de bestaande visuele stijl behouden en de informatiehiërarchie verbeteren. Donkere kaarten, warme accentkleuren en de drie productroutes vormen een herkenbare basis. Het probleem is vooral de hoeveelheid tekst die tegelijk om aandacht vraagt.

| Onderdeel | Concrete verbetering | Waarom |
|---|---|---|
| Basis | Toon hoeveelheid, planning, wateradvies en noodzakelijke waarschuwing; exacte modelindices onder ‘Waarom dit advies?’ | Een thuisbakker moet het recept kunnen uitvoeren zonder een model te interpreteren |
| Instellingen | Maak Basis/Uitgebreid ook later eenvoudig bereikbaar, met behoud van invoer | De gebruiker ontdekt vaak tijdens het plannen welke details nodig zijn |
| Waterkaart | ‘315 g hoofdwater, ongeveer 18 °C’ en ‘20 g reserve, kamertemperatuur’ op aparte regels | Voorkomt dat alle 335 g dezelfde temperatuur krijgen |
| Mengstap | Splits 3 min stand 1, 2 min stand 1 en 2 min stand 2 in afzonderlijke visuele regels met doel | Nu zitten meerdere acties in één paragraaf |
| Tijdlijn | Zet compacte tijdlijn vóór de lange lijst; groepeer in mengen, rijzen/koelen en bakdag | Overzicht voordat iemand begint |
| Voortgang | Koppel afvinkvakken aan duidelijke stapnamen; optionele herstelstappen apart | Beter met toetsenbord, schermlezer en tijdens bakken |
| Waarschuwingen | Gebruik oranje voor een vereiste actie; neutrale kleur voor kleine praktische afronding | Een minieme afronding mag geen alarmsignaal verdringen |
| Logboek | ‘Baklogboek’ als hoofdnaam; model-/kalibratie-uitleg onder details | De huidige versie leert niet automatisch van de logs |
| Navigatie | Eén duidelijk primaire vervolgstap; plaats Reset minder prominent | Minder concurrentie tussen hoofdactie, zwevende knop en hulpfuncties |
| Leesbaarheid | Essentiële instructies ruim en ongeveer 16 px of groter; 10–12 px niet voor beslissende informatie | Bruikbaarheid op afstand en met een keukenopstelling |
| Mobiel | Compacte blijvende samenvatting; beperk brede technische tabellen tot Uitgebreid | Minder heen-en-weer scrollen |

De ingeklapte sauskeuze is een verbetering die ik zou behouden. Ze maakt de standaardkeuze rustig en houdt alle opties bereikbaar. De eerdere losse browserdekking voor de per-bolkeuze en toetsenbordbediening is inmiddels toegevoegd.

NL/EN oogt in de gecontroleerde workflow consistent. Ik heb geen volledige nieuwe vertaalinventaris van alle 92 recepten uitgevoerd. Ik heb ook geen nieuwe mobiele screenshotmatrix, schermlezersessie, printaudit of gebruikerstest met andere thuisbakkers uitgevoerd. Het mobiele advies is daarom gebaseerd op bron/CSS, productstructuur en historische testbevindingen, niet op een nieuw mobiel keurmerk.

Ovenadvies blijft terecht een startpunt: steentemperatuur alleen bepaalt geen baktijd. De bestaande tekst noemt bovenwarmte en beleg al. Ik zou die praktische nuance behouden en bij extreme lage temperaturen geen algemene tijdsband als harde gaarheidsgarantie presenteren. Een uitbreiding met steen/staal of aparte ovens is pas zinvol als daar echte gebruiksbehoefte voor is.

### Schema en gist: één begrijpelijk beslisblok

Voor de nu gecontroleerde standaardinvoer zou de informatievolgorde bijvoorbeeld zijn:

| Regel in het scherm | Inhoud |
|---|---|
| **Jouw huidige schema** | 1 uur bulk buiten → 20 uur koelkast als één massa → opbollen → 4 uur bolrijs buiten |
| Vooraf | Ongeveer 54 minuten voor wegen, mengen, autolyse en controle |
| Aangenomen temperaturen | Kamer 21 °C · koelkast 4 °C · doel na kneden 24 °C |
| **Afwegen** | **0,9 g instant droge gist voor de hele batch** |
| Receptstatus | Deze hoeveelheid staat al in je recept |
| Meer uitleg | Het model geeft ongeveer 0,65–1,16 g als praktische marge; dit is geen vrij uitwisselbaar bereik bij exact dezelfde rijstijd |

Dit voorbeeld herordent bestaande uitkomsten; het is geen nieuw gevalideerd gistadvies. Ik zou ‘IDY’ pas na de volledige naam tonen en de hoeveelheid voor de totale batch nadrukkelijk onderscheiden van gram per bol. De precieze middenwaarde, het percentage en de activiteitsuren kunnen onder details blijven.

De onder- en bovengrens zijn onzekerheid over het passende advies. Ze moeten niet suggereren ‘kies willekeurig iets, het schema blijft even betrouwbaar’. Het lagere of hogere uiteinde kan later een bewuste, door ervaring ondersteunde receptkeuze zijn; daarvoor is een verklaring nodig. Aan beginners geeft de app één bruikbaar startgetal.

Wanneer een deadline een ander schema vraagt, toon eerst een voorstel met ‘Dit verandert: koelkastduur, tijd buiten en gist’. Pas de samenhangende onderdelen alleen toe via een expliciete actie. De bestaande knop voor uitsluitend gist krijgt een concreet label zoals ‘Gebruik 0,9 g gist’, en verdwijnt of wordt een statusmelding als dat al de actuele hoeveelheid is.

### Invulvelden: wat plan ik en wat meet ik?

| Plaats | Voorgesteld label | Korte uitleg |
|---|---|---|
| Calculator | **Wanneer wil je de eerste pizza in de oven?** | Datum en tijd; niet ‘wanneer is de laatste pizza klaar?’ |
| Calculator | **Temperatuur waar het deeg buiten de koelkast staat** | Verwachte kamertemperatuur in °C |
| Calculator | **Verwachte temperatuur in jouw koelkast** | 4 °C is een aanname als je hem niet weet |
| Uitgebreid | **Gewenste deegtemperatuur na kneden** | Dit is het doel; de werkelijke meting komt later |
| Stappenplan | **Nu gemeten deegtemperatuur** | Op het expliciet gekozen meetmoment; leeg laten als niet gemeten |
| Stappenplan | **Werkelijk gemiddelde koelkasttemperatuur** | Luchttemperatuur bij de deegbak; niet de kerntemperatuur van de bol |
| Baklogboek | **Temperatuur van het gebruikte hoofdwater** | Reservewater blijft een afzonderlijke toevoeging |

Eenheden horen zichtbaar naast de waarde, niet alleen in een placeholder. Geplande waarden mogen als referentie naast meetvelden staan, maar niet vooraf als schijnmeting worden ingevuld. Toon bij een gewijzigde meting wat er verandert, bijvoorbeeld ‘Koelkast uit: eerst 14:00, nu 14:25’. Een voor de gebruiker eerder moment moet minstens zo opvallend zijn als een uitgesteld moment.

De geplande tijden blijven afkomstig uit één gedeelde tijdlijn. De calculator en het stappenplan mogen elkaar niet tegenspreken doordat ieder een eigen berekening of afronding gebruikt.

### Betrouwbare planning met een korte maakdag

Hier maak ik drie zaken zichtbaar: **actieve handelingen**, **wachttijd vóór de koelkast** en **tijd op de bakdag na uitnemen**. Een deegtraject van 25 uur betekent niet 25 uur werk, maar bijna twee uur tot de koelkast kan voor jouw dagindeling wel degelijk onhandig zijn.

De huidige standaardroute reserveert ongeveer 54 minuten voorbereiding plus één uur bulk, dus circa **1 uur 54 vóór koeling**. De 2–4 uur bulk uit het professionele recept daarbovenop als nieuwe norm overnemen zou jouw doel juist tegenwerken. Dat adviseer ik niet.

Mijn voorkeursrichting voor een eventuele receptiteratie is daarom: **behoud de mengtijd en noodzakelijke rust, onderzoek een korte fase na mengen en ga daarna naar de koelkast**. Een proef met bijvoorbeeld 0–30 minuten tussen de afgeronde ontwikkeling en het koelen kan daarvoor een kandidaat zijn. Die band is een onderzoekskeuze, nog geen betrouwbaar vrijgegeven recept. De bestaande keuze voor koude bolrijs kan daarbij worden onderzocht als die handig is; de bestaande presets hoeven niet allemaal te veranderen.

Korter wachten vóór de koelkast kan de hoeveelheid fermentatie vóór het door-en-door afkoelen verlagen, zeker als je eerst opbolt. Hetzelfde gistgewicht en dezelfde klokplanning blijven dan niet vanzelf gelijkwaardig. Corrigeer daarom niet alleen de tekst: beoordeel het gehele temperatuur-/tijdtraject en het uiteindelijke deeg. Dit is juist een reden om de professionele lage gistdosering niet tegelijk over te nemen.

Voor het stappenplan zou ik per fase **een dag én een kloktijd** tonen:

| Moment | Wat de gebruiker moet kunnen aflezen |
|---|---|
| Beginnen | ‘Vandaag om … beginnen met wegen en mengen’ |
| Na ontwikkeling | ‘…: ontwikkelingscheck; daarna [korte rust of direct volgende handeling]’ |
| Koelkast in | ‘Vandaag om …: bak afdekken en in de koelkast’ |
| Koelkast uit | **‘Morgen om …: deeg uit de koelkast’** |
| Opbollen | Expliciet vóór koeling bij koude bollen, of na uitnemen bij koude bulk |
| Voorverwarmen | Eigen tijdstip; mag met de laatste rijs overlappen |
| Bakken | ‘Morgen om …: eerste pizza in de oven’ |

Ontbreekt een startmoment, toon dan eerst relatieve tijden en maak duidelijk dat het een conceptplanning is. Zodra de gebruiker werkelijk begint of een starttijd vastlegt, worden de kloktijden concreet. Er mag geen onzichtbare extra rustfase ontstaan tussen ‘klaar met deeg maken’ en ‘koelkast in’.

**Betrouwbaarheid betekent hier:** consistente tijdrekening, realistische aannames, een geteste route, zichtbare marge en één duidelijke controle op het deeg. Het betekent niet dat ieder deeg exact om 18:00 dezelfde rijpheid heeft. Een tijdvenster voor uitnemen kan na bakvalidatie nuttiger zijn dan schijnnauwkeurige minuten; de app geeft daarbij wel één duidelijk gepland uitneemmoment.

De eindcontrole op de bakdag combineert hanteerbaarheid, ontspanning en zichtbare rijs. Een koude, strakke bol is een ander probleem dan een al zeer slappe, overgerezen bol. De app moet daarom geen generieke opdracht ‘nog twee uur laten staan’ geven bij ieder tegenvallend signaal.

## 8. Professioneel DSP-recept: reconstructie en beoordeling

### 8.1 Formule

DSP betekent hier **dried sourdough powder**, gedroogd zuurdesempoeder.

| Ingrediënt | Massa | % van 9.606 g bloem |
|---|---:|---:|
| Bloem | 9.606 g | 100,00% |
| Water | 6.052 g | 63,00% |
| Zout | 250 g | 2,60% |
| Gist | 3,84 g | 0,040% |
| DSP | 288 g | 3,00% |
| Olie | 192 g | 2,00% |
| **Totaal** | **16.391,84 g** | **170,6417%** |

De som is intern logisch. De formule is niet strikt traditioneel AVPN door onder andere de olie en het aanvullende product. Met 2% olie en deze hydratatie is hij inhoudelijk goed vergelijkbaar met een bredere pizzeriastijl of NY-achtige formule, maar stijl, oventype of baktemperatuur zijn hieruit niet betrouwbaar vast te stellen. Die vergelijking is een interpretatie, geen identificatie van het oorspronkelijke recept.

Als alle 288 g DSP als extra bloemachtige massa worden meegeteld, wordt de noemer 9.894 g:

| Grootheid | % van bloem + volledig DSP |
|---|---:|
| Water | 61,17% |
| Zout | 2,53% |
| Gist | 0,0388% |
| Olie | 1,94% |

**Deze tweede tabel is een alternatieve rekenbasis, geen bewezen ‘werkelijke hydratatie’.** Bloem zelf bevat vocht; DSP kan dragers, suikers, zuren, zout en ander materiaal bevatten. De waterbinding is ook niet rechtstreeks uit de totale droge massa af te leiden. Voor vergelijking met bestaande recepten zou ik de gewone bakkerspercentages handhaven en DSP afzonderlijk vermelden, met pas na het productblad een aanvullende geharmoniseerde berekening.

### 8.2 Wat ik van het resultaat zou verwachten

Dit zijn voorwaardelijke baktechnische verwachtingen, geen vastgestelde eigenschappen van deze onbekende batch.

| Eigenschap | Verwachting en beperking |
|---|---|
| Rekbaarheid | Rust en fermentatie kunnen openen vergemakkelijken; bloem, zuurgraad en DSP kunnen de richting veranderen |
| Sterkte/gasretentie | Voldoende mengontwikkeling vóór de lange rijs is belangrijk; DSP of lange rijs garandeert geen sterker netwerk |
| Malsheid | 2% olie kan aan een minder taaie beet bijdragen; effect hangt af van bakduur en vochtverlies |
| Krokantheid | Mogelijk goede krokantheid met passende bakvoering; oliepercentage alleen voorspelt dit niet |
| Bruining | Fermentatie, bloemsuikers, DSP-samenstelling en ovenprofiel werken samen; 0% toegevoegde suiker betekent niet ‘geen beschikbare suikers’ |
| Smaak | DSP kan een zuurdesemachtig aroma en zuurgraad toevoegen; hoeveelheid zuur en activiteit zijn productafhankelijk |
| Fermentatiesnelheid | Zeer onzeker door gistsoort, temperatuur, tijd en mogelijke activiteit van het DSP |

Onderzoek naar spraygedroogd zuurdesem gebruikte onder meer 3% toevoeging. Dat maakt 3% een plausibele proefdosering; het bewijst niet dat het een universele pizzerianorm is. In dat onderzoek veranderden wateropname, zuurgraad en reologie; de rekbaarheid nam voor de onderzochte witte bloem juist af. Daarom is ‘DSP maakt deeg altijd soepeler/sterker’ te stellig. [Tafti e.a., 2013](https://cjfs.agriculturejournals.cz/pdfs/cjf/2013/04/09.pdf).

### 8.3 De lage gistdosering: drie verschillende interpretaties

| Als de 3,84 g bestaat uit… | Dosering in het recept | Benaderd IDY-equivalent volgens huidige appconversie |
|---|---:|---:|
| Instant droge gist, IDY | 0,040% | 0,040% |
| Actieve droge gist, ADY | 0,040% | 0,032%, bij factor 1,25 |
| Verse gist | 0,040% | 0,0133%, bij factor 3 |

Dit zijn praktische massavergelijkingen. Productactiviteit en instructies van de gistleverancier kunnen verschillen. Vergeleken met `home24` op 0,17% IDY gaat het respectievelijk om circa 4,25, 5,31 of 12,75 maal minder IDY-equivalente massa. **Die factoren mogen niet worden omgezet in evenzovele malen langere rijstijd.**

Twee tot vier uur bulk vóór koeling geeft de gist tijd in warmer deeg en laat het deeg ontspannen. Dat kan een belangrijk deel van de uiteindelijke ontwikkeling zijn. Hoe groot dat deel is, hangt af van de werkelijke temperatuur, gistactiviteit en wat daarna in de koelkast gebeurt.

Bij gedeactiveerd DSP mag de poederdosering niet als extra rijsgist worden meegeteld. Bij een actief product moet eerst duidelijk zijn welke organismen aanwezig en levensvatbaar zijn en hoe het product hoort te worden gebruikt. Gewone gist naast DSP bewijst noch activiteit, noch inactiviteit van het poeder.

### 8.4 De professionele meng- en koelvolgorde

De opgegeven volgorde is 5–10 minuten eerste menging, 20 minuten autolyse, daarna gist/zout/olie en 10–15 minuten verder mengen, 2–4 uur bulk, opbollen en koelen.

Die volgorde is technisch voorstelbaar, maar de tijden zonder snelheid en mixer zijn onvoldoende om hem goed of fout te verklaren:

- **Thuisplaneetmenger:** 15–25 minuten aandrijving kan veel warmte en belasting geven. Niet rechtstreeks kopiëren. Behoud je eigen tijden en beoordeel ontwikkeling afzonderlijk.
- **Commerciële planeetmenger:** grotere aandrijving maakt de deegbeweging niet automatisch gelijk aan een spiraalkneder. Haak, snelheid en vulling blijven bepalend.
- **Spiraalkneder:** een lange lage-snelheidsfase plus gerichte ontwikkeling kan passen, maar ook hier kan dezelfde kloktijd bij een andere snelheid veel te intensief zijn.

Er ontbreekt een einddeegtemperatuur. Gebruik de 24 °C van de app hoogstens als thuisreferentie, niet als geverifieerd doel van de pizzeria. Juist bij deze lange mengtijd is de **gemeten** eindtemperatuur nodig om de daaropvolgende 2–4 uur te interpreteren.

De olie komt pas na de eerste bloem-waterfase. Dat betekent dat er al hydratatie en enige structuurvorming heeft kunnen plaatsvinden voordat de olie wordt opgenomen. Een afzonderlijke late olietoevoeging kan opname beheersbaarder maken; bij 2% bewijst het recept niet dat gelijktijdig toevoegen met zout/gist verkeerd is. De bestaande instructies kennen late olieopname al: dit is eerder bevestiging dan een vergeten hoofdingreep.

Ook het moment waarop DSP wordt toegevoegd ontbreekt. Bij DSP in de eerste fase is het geen zuivere bloem-waterautolyse meer; afhankelijk van het product zijn zuur en eventueel activiteit al tijdens de rust aanwezig.

### 8.5 Vergelijking met bestaande presets

| Kenmerk | Professioneel DSP-recept | `home24` / New York | Betekenis |
|---|---|---|---|
| Water | 63,00% op oorspronkelijke bloem | 65% | Verschil reëel; DSP-basis en opname maken vergelijking minder eenvoudig |
| Zout | 2,60% | 2,5% | Kleine afwijking, geen reden voor herziening op zichzelf |
| Olie | 2,00% | 2% | Reeds aanwezig in bestaand recept |
| Gist | 0,040%, type onbekend | 0,17% IDY | Niet los van tijd/temperatuur overnemen |
| DSP | 3% | Geen | Mogelijk smaak-/structuurverschil; productspecificatie nodig |
| Rust vóór verdere menging | 20 min autolyse | Directe route met hydratatierust en gist | Beide hebben rust, maar biologisch en thermisch niet gelijk |
| Warme bulk | 2 uur, tot ongeveer 4 uur genoemd | 1 uur | Interessant procesverschil; eerst gecontroleerd vergelijken |
| Koeling | Na opbollen | Standaard als bulk, 20 uur | Koude bolrijs bestaat al als aparte keuze |
| Opwarm-/bolfase vóór bakken | Onbekend | 4 uur | Essentieel ontbrekend vergelijkingspunt |
| Schaal | Circa 16,4 kg | Thuisbatch | Mixer- en koeldynamiek verschillen |

De andere koude presets bevatten langere koelkastfasen en andere hydratatie-/gistinstellingen. Een naam als ‘48 uur’ of ‘72 uur’ zegt niets zonder de faseverdeling en temperaturen. Het professionele recept geeft daarom geen bewijs dat die bestaande gistpercentages fout zijn.

### 8.6 Wat is daadwerkelijk bruikbaar voor de bestaande recepten?

| Inzicht | Classificatie | Aanbeveling |
|---|---|---|
| Eindontwikkeling vóór de lange rijs expliciet controleren | **Direct bruikbaar** | Versterk de instructie en het vervolg bij onvoldoende ontwikkeling; verkort geen mixtijden |
| Eerste-fasehydratatie verschilt door reservewater | **Direct bruikbaar** | Benoem dit bij de menguitleg en vergelijking van recepten |
| Geplande en gemeten temperaturen scheiden | **Direct bruikbaar** | Repareer herkomstlabels en meetmoment |
| Bollen vóór koeling hebben andere thermiek dan bulk | **Direct bruikbaar** | Verbeter uitleg van de al bestaande keuze |
| Langere warme bulk kan een nuttig procesverschil zijn | **Interessant, eerst valideren** | Vergelijk met dezelfde bloem, gist, temperatuur en einddoel |
| 3% DSP kan aroma en reologie beïnvloeden | **Interessant, eerst valideren** | Productblad en proef naast een controledeeg nodig |
| Andere verdeling van mengarbeid kan beter ontwikkelen | **Interessant, eerst valideren** | Onderzoek met behoud van huidige tijden en bekende machine |
| 0,04% gist als nieuwe standaard | **Niet overdraagbaar met huidige gegevens** | Geen gistverlaging op basis van deze formule alleen |
| Professionele 15–25 minuten rechtstreeks op thuismixer | **Niet overdraagbaar** | Geen gelijkstelling van kloktijd en mechanische ontwikkeling |
| DSP betekent meer rijskracht of betere verteerbaarheid | **Niet aangetoond** | Geen dergelijke productclaim toevoegen |
| Alle presets standaard naar koude bolrijs omzetten | **Niet gerechtvaardigd** | Behoud de huidige routes; bewijs eerst het gewenste voordeel |

## 9. Kleine proeven die werkelijk iets kunnen leren

### A. Eerst de huidige mengroute karakteriseren

Gebruik dezelfde bloem, dezelfde thuisbatch, dezelfde machine en de bestaande tijden. Leg bij enkele herhalingen vast: water-/kamer-/bloemtemperatuur, begin- en eindtijd van elke fase, temperatuur na machinaal mengen, beoordeling na een vaste korte rust, eventuele aanvullende handmatige ontwikkeling en uiteindelijke bakresultaat.

Het eerste doel is vaststellen of de standaardroute regelmatig een zwak netwerk oplevert, of dat vooral spanning, batchcontact of temperatuur het probleem is. Pas daarna is het zinvol één gerichte wijziging van de ontwikkelfase te vergelijken. Dat voorkomt dat tegelijk water, gist, tijd en techniek veranderen.

### B. DSP: één eerlijke eerste vergelijking

Na ontvangst van het DSP-productblad kan een eenvoudige vergelijking nuttig zijn:

| Proef | Bloem | DSP | Water, gist, zout, olie en werkwijze |
|---|---|---|---|
| Controle A | 1.000 g | 0 g | Gelijk aan B |
| DSP B | 1.000 g | 30 g | Gelijk aan A |

Dit is een **toevoegingsproef**: hij beantwoordt wat toevoegen van 3% van dit product met het recept doet, inclusief de extra vaste stof en eventuele verandering in waterbinding. Hij is geen zuivere isolatie van alleen zuurdesemchemie bij identieke hydratatie. Dat onderscheid moet vooraf helder zijn.

Gebruik een al werkende thuisdosering gist en dezelfde route in beide degen; het lage onbekende professionele gistpercentage hoeft niet tegelijk te worden geïntroduceerd. Houd deegbalgewicht, baktijdstip, ovencondities en beoordeling gelijk. De licht verschillende batchmassa noteren; bij een mixer die gevoelig is voor kleine batches kan een vergelijking op gelijke totale batchmassa geschikter zijn, mits de gekozen rekenbasis vooraf wordt vastgelegd.

Herhaal bijvoorbeeld drie gepaarde baksessies en wissel meng-/bakvolgorde af. Beoordeel geur/smaak, scheuren bij openen, weerstand na dezelfde rust, spreiding van de bol, ovenrijs, bodem en beet na dezelfde afkoeltijd. pH is optionele extra informatie als betrouwbaar meetbaar; één pH-getal zegt niet alles over zuurbelasting.

Pas bij een duidelijk verschil volgt een tweede proef: water aanpassen om vergelijkbare hanteerbaarheid te bereiken. Niet meteen DSP, gist, bulkduur én water tegelijk veranderen.

### C. Temperatuur zonder de normale koelkastworkflow ingewikkeld te maken

Begin met bruikbare vaste momenten buiten de koelkast: direct na de gekozen mengfase, aan het begin van de bulk en bij het gebruikelijke uitnemen vóór de bakdag. Voor opwarmen kan één referentiebol op vaste intervallen worden gevolgd. Zo wordt zichtbaar of de huidige opwarmcurve systematisch te snel of te traag is.

Alleen het begin en einde van een lange koeling leveren onvoldoende informatie om het hele afkoeltraject te identificeren: bijna iedere redelijke curve kan na twintig uur dicht bij 4 °C eindigen. Voor een echte afkoelconstante is ooit een afzonderlijke meetproef met meerdere tijdpunten nodig. Dat hoeft geen extra routinehandeling of permanente koelkastmeting in de app te worden.

## 10. Code, tests en onderhoudbaarheid

### Wat ik zou behouden

De gegenereerde standalone `index.html`, modulaire bron onder `src/`, opslagcompatibiliteit, immutable releasehashes en tweetalige productcontracten zijn passende keuzes voor deze omvang. Er is geen aangetoonde behoefte aan een nieuwe frontendstack of database.

De regressies rond invoer tijdens typen, native nummerstappen, opslagmigratie, expliciet kiezen van een recept, Basis/Uitgebreid en de ±1 °C-deadband beschermen concrete gebruikerservaringen. Dat is waardevolle testdekking.

### Waar ik de teststrategie zou aanscherpen

**De softwaredekking is geloofwaardiger dan de fysieke validatie.** Dezelfde tests op bron en bundel beschermen twee distributievormen, maar tellen niet als twee onafhankelijke bewijzen dat het deegmodel klopt. Een grote matrix van eindige, monotone uitkomsten is evenmin een bakproef.

Een golden hash bewijst dat bytes niet onverwacht veranderen. Een numerieke snapshot bewijst dat een ingevoerde modelwaarde niet onbedoeld verschuift. Geen van beide bewijst dat bijvoorbeeld een gekoelde bol na vier uur werkelijk 20,6 °C is.

De nuttigste nieuwe regressies bij latere reparaties zijn:

1. Het AVPN-deadlinevoorstel geeft na toepassen hetzelfde type advies voor dezelfde planinhoud.
2. Deadlineduur, starttijd en tijdlijn gebruiken dezelfde voorbereiding.
3. Een doeltemperatuur zonder meting krijgt nooit het label ‘gemeten’.
4. Kruidenhoeveelheden en nulwaarden blijven correct bij schalen en aggregeren.
5. De huidige mengfasen/tijden blijven behouden wanneer instructies anders worden gepresenteerd.
6. De noodzakelijke waarschuwing en geselecteerde staat blijven toegankelijk in Basis en Uitgebreid.

Voor de rekenkern zou ik daarnaast functies met expliciete invoer verkiezen boven tests die verborgen globale selecties nabootsen. Behoud wel integratietests die de hele gebruikersactie toetsen: juist H1 ontstaat op de grens tussen planning, preset en toepassen.

De nieuwe review bevat geen uitgevoerde fysieke bakproeven, geen volledige 92-recepten smaak-/gaarheidsaudit, geen pen-test van een productie-Worker en geen gemeten prestatieonderzoek. Er is geen broncode aangepast om tests alsnog groen te maken.

## 11. Mijn top vijf voor een eventuele volgende iteratie

| Prioriteit | Werkpakket | Concreet resultaat |
|---|---|---|
| **1** | Schema en gist samen begrijpelijk en correct maken | H1, M2 en M8 oplossen; één afweeghoeveelheid, verklaarde marge en dezelfde tijden vóór/ná toepassen |
| **2** | Glutenontwikkeling én een korte maakdag | Huidige mengtijden behouden, duidelijk herstelpad en een korte route naar de koelkast valideren; geen verplichte 2–4 uur bulk toevoegen |
| **3** | Temperatuurherkomst en koelkastmomenten verduidelijken | Doel/meting/schatting correct, invoervelden begrijpelijk en expliciete kalender-/kloktijden voor koelkast in én uit |
| **4** | Praktische leesbaarheid en toegankelijkheid | Beter knopcontrast, unieke stapnamen, tijdlijn bovenaan en compactere menginstructies |
| **5** | Kleine hoeveelheden herstellen en gericht valideren | Kruidenafronding correct; beperkte herhaalbare meng-/temperatuurproeven vóór een wijziging van presets |

DSP krijgt binnen deze volgorde eerst een productspecificatie en een kleine vergelijking. Het is geen voorwaarde om de bestaande calculator nuttiger te maken. De feedbackinfrastructuur behoort niet tot deze top vijf.

## 12. Ontbrekende informatie die het oordeel verder kan aanscherpen

Voor het professionele recept zijn vooral nodig:

- DSP-merk, productnaam, ingrediënten, actief/gedeactiveerd, vochtgehalte en aanbevolen dosering; ook wanneer het wordt toegevoegd.
- Gistsoort en merk; eventueel activerings-/rehydratatie-instructies.
- Bloemsoort, W, eiwit en zo mogelijk P/L of productspecificatie.
- Exact mixertype, snelheden, werkelijk gebruikte tijden en batchvulling.
- Gewenste én gemeten einddeegtemperatuur en kamertemperatuur tijdens de 2–4 uur bulk.
- Koelkasttemperatuur, koude duur, bakopstelling/stapeling en uitwarmtijd.
- Deegbalgewicht, diameter, oven-/steentemperatuur en baktijd.

Voor jouw eigen mengadvies zijn het exacte thuismixermodel en een paar waarnemingen van deegontwikkeling na de huidige route het meest waardevol. Een etiketfoto van het DSP en de ontbrekende koude tijd/temperatuur zouden de professionele vergelijking al veel scherper maken. Deze informatie is vervolgonderzoek; ze blokkeert de bovenstaande bevindingen niet.

**Niets aan broncode, tests, projectdocumentatie, recepten of catalogus is gewijzigd. Er is niets gecommit, gepusht, gemerged, gedeployed of uitgebracht. Het DSP-recept is nergens aan de app toegevoegd. Dit rapport is het nieuwe reviewresultaat; Cloudflare en Draft PR #12 blijven geparkeerd.**
