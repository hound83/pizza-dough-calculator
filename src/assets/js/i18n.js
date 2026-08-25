const _i18nOriginalText=new WeakMap();
const _i18nOriginalAttrs=new WeakMap();
let _i18nObserver=null;

function countNoun(count,nlSingular,nlPlural,enSingular,enPlural){
  const n=Number(count);
  const singular=n===1;
  return currentLang==='en'
    ? (singular?enSingular:enPlural)
    : (singular?nlSingular:nlPlural);
}
function countLabel(count,nlSingular,nlPlural,enSingular,enPlural){
  return `${fmt(Number(count),0)} ${countNoun(count,nlSingular,nlPlural,enSingular,enPlural)}`;
}
function pizzaNoun(count){return countNoun(count,'pizza',"pizza's",'pizza','pizzas');}
function doughBallNoun(count){return countNoun(count,'deegbal','deegballen','dough ball','dough balls');}
function pizzaCountLabel(count){return `${fmt(Number(count),0)} ${pizzaNoun(count)}`;}
function doughBallCountLabel(count){return `${fmt(Number(count),0)} ${doughBallNoun(count)}`;}
function hourCountLabel(hours,decimals=1){
  const value=Number(hours);
  const shown=fmt(value,decimals);
  const unit=currentLang==='en'?(shown==='1'?'hour':'hours'):'uur';
  return `${shown} ${unit}`;
}

function translateNlText(raw){
  const s=String(raw??'');
  const m=s.match(/^(\s*)([\s\S]*?)(\s*)$/);
  const lead=m?m[1]:''; let core=m?m[2]:s; const trail=m?m[3]:'';
  if(!core)return s;
  if(Object.prototype.hasOwnProperty.call(EN_TEXT,core))return lead+EN_TEXT[core]+trail;

  // Veel regels hieronder zijn geschreven voor het tekstfragment dat vóór een
  // <b>-tag staat, en dat eindigt juist op een spatie. Door eerst te trimmen
  // konden 19 van die regels nooit matchen. Regels draaien nu op core+trail.
  const coreT=core+trail;

  const rules=[
    [/^Bloemsoort$/,'Flour type'],
    [/^Overige tipo 00 pizzabloem$/,'Other tipo 00 pizza flour'],
    [/^Manitoba \/ sterke tarwebloem$/,'Manitoba / strong wheat flour'],
    [/^Nederlandse tarwe-\/patentbloem$/,'Dutch wheat/patent flour'],
    [/^Zoekopdracht wissen$/,'Clear search'],
    [/Caputo Pizzeria is officieel W260–280; W270 is precies het midden van dat bereik en daarom een logische standaard voor deze calculator\./,'Caputo Pizzeria is officially W260–280; W270 is exactly the midpoint of that range and therefore a logical default for this calculator.'],
    [/Afkoeling en opwarming daarna worden automatisch geschat uit de deegmassa en of het deeg als bulk of als losse bollen staat\./,'Cooling and warming afterward are estimated automatically from the dough mass and whether the dough is stored as one bulk or as separate dough balls.'],
    [/^Mijn standaardrecept • 30 cm • 63% • 25 uur$/,'My default recipe • 30 cm • 63% • 25 hours'],
    [/^De einddeeg- en koelkasttemperatuur worden rechtstreeks uit het stappenplan overgenomen\. Voeg na het bakken je werkelijke watertemperatuur en beoordeling toe\. Het logboek bewaart de informatie als referentie, maar v([0-9.]+) past op basis van vorige bakes bewust géén DDT-, gist- of tijdmodel automatisch aan\.$/,'Final dough and refrigerator temperatures are taken directly from the workflow. After baking, add your actual water temperature and assessment. The log keeps the information as reference, but v$1 deliberately does not automatically adjust the DDT, yeast or timing model based on previous bakes.'],
    [/^Maak (.+)$/,'Make $1'],
    [/^Kies pizza voor alle bollen$/,'Choose pizza for all dough balls'],
    [/^(\d+(?:[.,]\d+)?) uur$/,'$1 hours'],
    [/^(\d+(?:[.,]\d+)?) u$/,'$1 h'],
    [/^(\d+(?:[.,]\d+)?) minuten$/,'$1 minutes'],
    [/^(\d+(?:[.,]\d+)?) pizza's$/,'$1 pizzas'],
    [/^(\d+) pizza’s$/,'$1 pizzas'],
    [/^(\d+) recepten$/,'$1 recipes'],
    [/^(\d+) totaal$/,'$1 total'],
    [/^Bol (\d+)$/,'Dough ball $1'],
    [/^Bol (\d+) • /,'Dough ball $1 • '],
    [/^([0-9.,]+) g bloem$/,'$1 g flour'],
    [/^([0-9.,]+) g water$/,'$1 g water'],
    [/^([0-9.,]+) g zout$/,'$1 g salt'],
    [/^([0-9.,]+) g olijfolie$/,'$1 g olive oil'],
    [/^werkelijk ([0-9.,]+)%$/,'actual $1%'],
    [/^Advies ± (.+)$/,'Guidance ± $1'],
    [/^Praktisch bereik (.+) • (.+) gistactiviteitsuren @ 21 °C$/,'Practical range $1 • $2 yeast-activity hours @ 21 °C'],
    [/^([0-9.,]+) u @ 21 °C$/,'$1 h @ 21 °C'],
    [/^Huidige gist: /,'Current yeast: '],
    [/ ten opzichte van de berekende bandbreedte\.$/,' relative to the calculated range.'],
    [/^Visuele eindcheck: /,'Visual final check: '],
    [/^bulk richtwaarde /,'bulk target '],
    [/; voor bakken /,'; before baking '],
    [/De klok is een planning, niet het enige eindpunt\./,'The clock is a planning tool, not the only endpoint.'],
    [/^Je koelkast staat op /,'Your refrigerator is at '],
    [/Dat is een actieve koude fermentatie, geen sterke retardatie; controleer het deeg eerder\./,'This is active cold fermentation, not strong retardation; check the dough earlier.'],
    [/^Bij /,'At '],
    [/wordt gist zeer sterk afgeremd\./,'yeast is very strongly slowed.'],
    [/De warme fasen en het langzaam afkoelen leveren relatief veel van de gasproductie\./,'The warm phases and gradual cooling contribute a relatively large share of gas production.'],
    [/^Deegtemperatuur na kneden /,'Dough temperature after kneading '],
    [/is hoog voor een lang schema: de eerste uren verlopen duidelijk sneller\./,'is high for a long schedule: the first hours proceed noticeably faster.'],
    [/is laag: de start van de fermentatie is trager dan normaal\./,'is low: fermentation starts more slowly than normal.'],
    [/^Rijpingsbelasting versus /,'Maturation load versus '],
    [/Kijk extra naar deegsterkte en volume in plaats van alleen naar de klok\./,'Pay extra attention to dough strength and volume rather than only the clock.'],
    [/^Meer dan 72 uur koud is sterk afhankelijk van bloem, koelkast en deegtemperatuur; de onzekerheidsmarge wordt groter\.$/,'More than 72 hours cold depends strongly on flour, refrigerator and dough temperature; uncertainty increases.'],
    [/^Praktisch afgerond\. Doelhydratatie /,'Practically rounded. Target hydration '],
    [/ → werkelijk /,' → actual '],
    [/vrijwel exact/,'virtually exact'],
    [/ procentpunt verschil/,' percentage-point difference'],
    [/^ongeveer /,'about '],
    [/ het volume van een verse bol$/,' the volume of a fresh dough ball'],
    [/; duidelijk luchtig maar nog sterk$/,'; clearly airy but still strong'],
    [/; zacht en goed ontspannen$/,'; soft and well relaxed'],
    [/; niet maximaal laten opblazen$/,'; do not let it inflate to the maximum'],
    [/^Kies pizza voor bol (\d+)$/,'Choose pizza for dough ball $1'],
    [/^Kies /,'Choose '],
    [/^Geen extra kaas aangeraden bij /,'No extra cheese recommended at '],
    [/^Kaas toevoegen: /,'Add cheese: '],
    [/^Extra kaas: /,'Extra cheese: '],
    [/^Advies op basis van /,'Guidance based on '],
    [/ steentemperatuur; richtlimiet voor kaas vóór het bakken /,' stone temperature; guideline limit for cheese before baking '],
    [/Deze pizza zit bij /,'At '],
    [/ al rond de verstandige kaaslimiet\./,' this pizza is already around the sensible cheese limit.'],
    [/^Rode variant: /,'Red variant: '],
    [/zodat de tomaat de kazen en toppings niet overheerst\./,'so the tomato does not overpower the cheeses and toppings.'],
    [/^Originele witte variant: /,'Original white variant: '],
    [/geen tomatensaus, alleen een dun laagje olijfolie\./,'no tomato sauce, just a thin layer of olive oil.'],
    [/^Geraspte mozzarella \/ pizzakaas vervangt verse fior di latte of buffelmozzarella en wordt ongeveer 15% royaler gedoseerd\. Speciale kazen blijven behouden\.$/,'Grated mozzarella / pizza cheese replaces fresh fior di latte or buffalo mozzarella and is used about 15% more generously. Specialty cheeses remain unchanged.'],
    [/^Verse fior di latte \/ mozzarella volgens het recept\. Speciale Italiaanse kazen blijven zoals bedoeld\.$/,'Fresh fior di latte / mozzarella as specified by the recipe. Specialty Italian cheeses remain as intended.'],
    [/^([0-9]+) pizza’s • (.+)$/,'$1 pizzas • $2'],
    [/^([0-9]+) pizza's • (.+)$/,'$1 pizzas • $2'],
    [/ per bol/,' per dough ball'],
    [/ geschat /,' estimated '],
    [/ berekend /,' calculated '],
    [/^Top 10 populaire pizza’s \+ (\d+) recepten$/,'Top 10 popular pizzas + $1 recipes'],
    [/^(.+) gevonden voor “(.+)”$/,'$1 found for “$2”'],
    [/ pizza’s gevonden voor /,' pizzas found for '],
    [/ pizza gevonden voor /,' pizza found for '],
    [/^([0-9]+) pizza’s • /,'$1 pizzas • '],
    [/^([0-9]+) pizza • /,'$1 pizza • '],
    [/^Op pizza's nodig$/,'Required on pizzas'],
    [/ g op pizza's$/,' g on pizzas'],
    [/^Nodig voor pizza's /,'Required for pizzas '],
    [/^Deeg • hele batch$/,'Dough • whole batch'],
    [/^Saus meerekenen staat uit\.$/,'Include sauce is turned off.'],
    [/^Geen toppings vóór het bakken$/i,'no toppings before baking'],
    [/geen toppings vóór het bakken/,'no toppings before baking'],
    [/^Na het bakken:$/,'After baking:'],
    [/^Beleggen • bol (\d+)$/,'Top • dough ball $1'],
    [/^Temperatuuradvies: /,'Temperature guidance: '],
    [/ °C steen\.$/,' °C stone.'],
    [/^Bak bij deze steentemperatuur als startpunt ongeveer /,'At this stone temperature, start with a bake of about '],
    [/ en draai /,' and turn '],
    [/^Steentemperatuur is de basis; vlam\/bovenwarmte en hoeveelheid beleg blijven mede bepalend\.$/,'Stone temperature is the basis; flame/top heat and topping load still matter.'],
    [/^Mik op een /,'Aim for a '],
    [/^Laat /,'Let '],
    [/^Zet /,'Put '],
    [/^Haal /,'Take '],
    [/^Verdeel /,'Divide '],
    [/^Voeg /,'Add '],
    [/^Meng /,'Mix '],
    [/^Kneed /,'Knead '],
    [/^Stop wanneer /,'Stop when '],
    [/^Als je een thermometer hebt: /,'If you have a thermometer: '],
    [/^Richtwaarde bulk: /,'Bulk target: '],
    [/^Bij duidelijk sneller of trager rijzen /,'If proofing is clearly faster or slower '],
    [/^Bestuif licht met /,'Dust lightly with '],
    [/^Gebruik liever iets te weinig dan te veel; /,'Prefer slightly too little rather than too much; '],
    [/^als normale thuiswaarden\.\s+Afkoeling en opwarming worden automatisch geschat uit de deegmassa en of het deeg als bulk of als losse bollen staat\.$/,'as normal home-use defaults. Cooling and warming are estimated automatically from the dough mass and whether the dough is stored as one bulk or as separate dough balls.'],
    [/^Voor alle gekozen pizza's is /,'For all selected pizzas, '],
    [/ een gezamenlijk goed bereik\. Adviesknop kiest /,' is a shared good range. The guidance button selects '],
    [/^De gekozen pizza's hebben geen volledig overlappend ideaal bereik\. Een praktisch compromis is /,'The selected pizzas do not have a fully overlapping ideal range. A practical compromise is '],
    [/^Je huidige /,'Your current '],
    [/ olie ligt onder het richtbereik\.$/,' oil is below the guideline range.'],
    [/ olie ligt boven het richtbereik\.$/,' oil is above the guideline range.'],
    [/ olie past bij dit temperatuurbereik\.$/,' oil fits this temperature range.'],
    [/ van de bloem bij ongeveer /,' of the flour at about '],
    [/^Draaien: /,'Turning: '],
    [/^Voor KitchenAid: /,'For KitchenAid: '],
    [/^Kenwood-modellen verschillen; /,'Kenwood models differ; '],
    [/^Bij professionele spiraalkneders /,'With professional spiral mixers '],
    [/^Het voorafmodel rekent vanaf /,'The pre-bake model calculates from '],
    [/ na het kneden/,' after kneading'],
    [/ standaardwaarde/,' default value'],
    [/^De ingrediënten$/,'The ingredients'],
    [/^Bloem /,'Flour '],
    [/^water /,'water '],
    [/^zout /,'salt '],
    [/^olijfolie /,'olive oil '],
    [/^gist /,'yeast '],
    [/ uur bij ongeveer /,' hours at about '],
    [/ uur bij /,' hours at '],
    [/ uur/,' hours'],
    [/ minuten/,' minutes'],
    [/ bollen/,' dough balls'],
    [/ bol /,' dough ball '],
    [/ deegmassa/,' dough mass'],
    [/ koelkast/,' refrigerator'],
    [/ kamertemperatuur/,' room temperature'],
    [/ na het bakken/,' after baking'],
    [/ vóór het bakken/,' before baking'],
  ];
  // Regels draaien op core inclusief afsluitende spatie, zodat prefixregels
  // als /^Voeg / en /^Meng / ook werken op het fragment vóór een <b>-tag.
  let out=coreT;
  for(const [re,repl] of rules)out=out.replace(re,repl);
  if(out!==coreT) return lead+out;
  return lead+core+trail;
}

function _captureTextTree(root,force=false){
  if(!root)return;
  if(root.nodeType===Node.TEXT_NODE){if(force||!_i18nOriginalText.has(root))_i18nOriginalText.set(root,root.nodeValue);return;}
  if(root.nodeType!==Node.ELEMENT_NODE && root.nodeType!==Node.DOCUMENT_NODE)return;
  if(root.nodeType===Node.ELEMENT_NODE){
    const attrs={};
    for(const a of ['placeholder','title','aria-label'])if(root.hasAttribute(a))attrs[a]=root.getAttribute(a);
    if(force||!_i18nOriginalAttrs.has(root))_i18nOriginalAttrs.set(root,attrs);
  }
  root.childNodes.forEach(n=>_captureTextTree(n,force));
}

function _applyLanguageTree(root){
  if(!root)return;
  if(root.nodeType===Node.TEXT_NODE){
    if(!_i18nOriginalText.has(root))_i18nOriginalText.set(root,root.nodeValue);
    const nl=_i18nOriginalText.get(root);
    root.nodeValue=currentLang==='en'?translateNlText(nl):nl;
    return;
  }
  if(root.nodeType!==Node.ELEMENT_NODE && root.nodeType!==Node.DOCUMENT_NODE)return;
  if(root.nodeType===Node.ELEMENT_NODE){
    if(!_i18nOriginalAttrs.has(root)){
      const attrs={};for(const a of ['placeholder','title','aria-label'])if(root.hasAttribute(a))attrs[a]=root.getAttribute(a);_i18nOriginalAttrs.set(root,attrs);
    }
    const attrs=_i18nOriginalAttrs.get(root)||{};
    for(const [a,nl] of Object.entries(attrs))root.setAttribute(a,currentLang==='en'?translateNlText(nl):nl);
  }
  root.childNodes.forEach(_applyLanguageTree);
}

function _observeI18n(){
  if(_i18nObserver)_i18nObserver.disconnect();
  _i18nObserver=new MutationObserver(muts=>{
    _i18nObserver.disconnect();
    for(const m of muts){
      if(m.type==='characterData'){
        _i18nOriginalText.set(m.target,m.target.nodeValue);
        if(currentLang==='en')m.target.nodeValue=translateNlText(m.target.nodeValue);
      }else if(m.type==='childList'){
        m.addedNodes.forEach(n=>{_captureTextTree(n,true);if(currentLang==='en')_applyLanguageTree(n);});
      }
    }
    _i18nObserver.observe(document.body,{subtree:true,childList:true,characterData:true});
  });
  _i18nObserver.observe(document.body,{subtree:true,childList:true,characterData:true});
}


function resetCalculator(){
  const nl=currentLang!=='en';
  const message=nl
    ? 'Weet je het zeker?\n\nAlle ingevulde waarden, pizzakeuzes, aanpassingen en planning worden gewist. De calculator keert terug naar het beginscherm met de standaardwaarden.\n\nJe taalkeuze blijft behouden.'
    : 'Are you sure?\n\nAll entered values, pizza choices, customizations and planning will be cleared. The calculator will return to the start screen with the default values.\n\nYour language choice will be kept.';

  if(!window.confirm(message))return;

  // Wis iedere opgeslagen calculatorversie, zodat een oude state
  // niet via de backwards-compatible loader opnieuw wordt geladen.
  SAFE.keys()
    .filter(key=>/^pizzaCalcV\d+$/.test(key))
    .forEach(key=>SAFE.del(key));

  // Taal is een interfacevoorkeur en blijft bewust behouden.
  SAFE.set('pizzaCalcLanguage',currentLang);
  window.location.reload();
}

function updateLanguageSwitch(){
  const nl=$('langNl'),en=$('langEn');
  if(nl)nl.classList.toggle('active',currentLang==='nl');
  if(en)en.classList.toggle('active',currentLang==='en');
  document.documentElement.lang=currentLang;
  document.title=currentLang==='en'?`Pizza dough calculator v${APP_VERSION}`:`Pizzadeegcalculator v${APP_VERSION}`;
}

function setLanguage(lang){
  lang=lang==='en'?'en':'nl';
  if(_i18nObserver)_i18nObserver.disconnect();
  // Eerst terug naar de Nederlandse brontekst, daarna de dynamische secties
  // opnieuw laten renderen. De eerste _applyLanguageTree van vroeger was een
  // no-op en is verwijderd.
  currentLang='nl';
  _applyLanguageTree(document.body);
  currentLang=lang;
  clearSearchCaches();
  SAFE.set('pizzaCalcLanguage',currentLang);
  update();
  if(typeof refreshFeedbackLanguage==='function')refreshFeedbackLanguage();
  // De picker bevat rechtstreeks met L(nl,en) opgebouwde HTML. Wanneer hij
  // openstaat moet die bron opnieuw worden gerenderd voordat de algemene
  // tekstnodevertaler draait; anders kan oude en nieuwe taal zich mengen.
  if($('pizzaPickerOverlay')?.classList.contains('open')){
    renderPickerList();
    renderPickerPreview();
  }
  if(currentWizardPage===0) showModeChooser(); else applyAppModeUI();
  _captureTextTree(document.body,true);
  _applyLanguageTree(document.body);
  updateLanguageSwitch();
  if(_storageWarningShown)showStorageWarningOnce();
  _observeI18n();
}

function initI18n(){
  _captureTextTree(document.body,true);
  _applyLanguageTree(document.body);
  updateLanguageSwitch();
  _observeI18n();
}

function translatedPlainText(text){
  if(currentLang!=='en')return text;
  return String(text).split('\n').map(line=>translateNlText(line)).join('\n');
}

function uiText(nl,en=null){
  if(currentLang!=='en')return String(nl??'');
  if(en!=null)return String(en);
  if(Object.prototype.hasOwnProperty.call(EN_TEXT,String(nl)))return EN_TEXT[String(nl)];
  return translateNlText(String(nl??''));
}
function recipeNameText(r){return uiText(r?.name||'',r?.nameEn);}
function recipeTagText(r){return uiText(r?.tag||'',r?.tagEn);}
function recipeNoteText(r){return uiText(r?.note||'',r?.noteEn);}
function englishDataText(nl,en=null){
  if(en!=null)return String(en);
  if(Object.prototype.hasOwnProperty.call(EN_TEXT,String(nl)))return EN_TEXT[String(nl)];
  return translateNlText(String(nl??''));
}
function sauceChoiceLabel(sc,short=false){
  if(!sc)return '';
  if(currentLang==='en')return short?(sc.shortEn||sc.short):(sc.labelEn||sc.label);
  return short?sc.short:sc.label;
}
function sauceChoiceGroupLabel(group){
  if(!group)return '';
  return currentLang==='en'?(group.labelEn||group.label):group.label;
}
