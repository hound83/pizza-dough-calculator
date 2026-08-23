
const $ = id => document.getElementById(id);

// localStorage kan gooien (Safari private mode, geblokkeerde cookies, volle opslag).
// Alle toegang loopt daarom via SAFE, zodat de app nooit op opslag stukloopt.
const SAFE={
  get(k){try{return localStorage.getItem(k);}catch(e){return null;}},
  set(k,v){try{localStorage.setItem(k,v);return true;}catch(e){return false;}},
  del(k){try{localStorage.removeItem(k);}catch(e){}},
  keys(){try{return Object.keys(localStorage);}catch(e){return [];}}
};
function esc(x){return String(x).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}

let currentLang=SAFE.get('pizzaCalcLanguage')||'nl';
const roundTo=(n,s)=>Math.round(n/s)*s;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
// Waarde voor een <input type="number">: altijd punt-decimaal, geen overbodige nullen.
function fieldNum(x,dec=3){const v=Number(x);return Number.isFinite(v)?String(Number(v.toFixed(dec))):'';}
function fmt(n,d=1){return Number(n).toLocaleString(currentLang==='en'?'en-US':'nl-NL',{minimumFractionDigits:0,maximumFractionDigits:d});}
function fmtFixed(n,d=1){return Number(n).toLocaleString(currentLang==='en'?'en-US':'nl-NL',{minimumFractionDigits:d,maximumFractionDigits:d});}
function num(id){return parseFloat($(id).value)||0;}
function numDefault(id,fallback){
  const el=$(id),raw=el?String(el.value).trim():'';
  if(raw==='')return fallback;
  const n=parseFloat(raw);return Number.isFinite(n)?n:fallback;
}
function numericBounds(el){
  const min=el&&String(el.min).trim()!==''?Number(el.min):-Infinity;
  const max=el&&String(el.max).trim()!==''?Number(el.max):Infinity;
  return {
    min:Number.isFinite(min)?min:-Infinity,
    max:Number.isFinite(max)?max:Infinity
  };
}
function clampToInputBounds(el,value){
  const bounds=numericBounds(el);
  return clamp(value,bounds.min,bounds.max);
}

// Lezen en zichtbaar corrigeren zijn bewust gescheiden. calc() draait tijdens
// iedere toetsaanslag: terugschrijven vanuit deze helper zou een tussenstand
// zoals "4" bij het typen van "480" direct naar het minimum veranderen.
function boundedNum(id,fallback=0){
  const el=$(id),raw=el?String(el.value).trim():'';
  if(raw==='')return fallback;
  let n=parseFloat(raw);
  if(!Number.isFinite(n))n=fallback;
  return clampToInputBounds(el,n);
}
function boundedNumDefault(id,fallback){
  const el=$(id),raw=el?String(el.value).trim():'';
  return raw===''?fallback:boundedNum(id,fallback);
}
function nonNegativeNum(id,fallback=0){
  return Math.max(0,boundedNum(id,fallback));
}
const _numericEditStartValues=new WeakMap();
const OPTIONAL_NUMBER_FIELDS=new Set(['finalDoughTemp','flourW','saucePerPizza','logWaterTemp']);

// Een verplicht getal dat per ongeluk volledig wordt gewist, keert terug naar
// de waarde waarmee deze bewerking begon. Zo blijven presetwaarden en de
// gekozen gistsoort intact in plaats van terug te vallen op één HTML-default.
function rememberNumericEditStart(el){
  if(!el||el.type!=='number')return;
  const raw=String(el.value).trim();
  const n=parseFloat(raw);
  const bounds=numericBounds(el);
  if(raw!==''&&Number.isFinite(n)&&n>=bounds.min&&n<=bounds.max){
    _numericEditStartValues.set(el,raw);
  }else{
    _numericEditStartValues.delete(el);
  }
}
function numericEmptyFallback(el){
  const remembered=String(_numericEditStartValues.get(el)??'').trim();
  if(remembered!=='')return remembered;
  const htmlDefault=String(el.defaultValue??'').trim();
  if(htmlDefault===''||!Number.isFinite(parseFloat(htmlDefault)))return '';
  // Voor oude opgeslagen states zonder focusgeschiedenis blijft de generieke
  // fallback ten minste overeenkomen met de momenteel gekozen gistsoort.
  if(el.id==='yeastPct'){
    const yeastType=yeastTypes[$('yeastType').value]||yeastTypes.idy;
    return String(parseFloat(htmlDefault)*yeastType.mult);
  }
  return htmlDefault;
}
function normalizeNumericInput(el){
  if(!el||el.type!=='number')return false;
  const raw=String(el.value).trim();
  // Leeg blijft tijdens het typen altijd toegestaan. Bij change/blur en na
  // state-load herstellen alleen verplichte velden een veilige fallback.
  // De vier expliciet optionele velden gebruiken leeg juist als betekenis.
  if(raw===''){
    if(OPTIONAL_NUMBER_FIELDS.has(el.id))return false;
    const fallback=numericEmptyFallback(el);
    if(fallback==='')return false;
    let defaultNumber=parseFloat(fallback);
    if(!Number.isFinite(defaultNumber))return false;
    defaultNumber=clampToInputBounds(el,defaultNumber);
    if(el.id==='pizzas')defaultNumber=Math.round(defaultNumber);
    el.value=fieldNum(defaultNumber,3);
    return true;
  }
  let n=parseFloat(raw);
  if(!Number.isFinite(n))return false;
  n=clampToInputBounds(el,n);
  if(el.id==='pizzas')n=Math.round(n);
  const normalized=fieldNum(n,3);
  if(el.value===normalized)return false;
  el.value=normalized;
  return true;
}
function normalizeStoredNumberInputs(){
  // Alleen na state-load. Nooit vanuit de live input-handler.
  refreshSizeModeUI();
  document.querySelectorAll('input[type="number"]').forEach(normalizeNumericInput);
}
const FERMENT_DEFAULTS={finalDoughTemp:24,flourW:270};

// Bloemsoorten. Alleen Caputo Pizzeria is een officiële productspecificatie;
// de rest is expliciet een praktische schatting, omdat alveograafwaarden voor
// consumentenbloem (en zeker voor spelt) zelden gepubliceerd worden.
const flourTypes={
  caputoPizzeria:{name:'Caputo Pizzeria',nameEn:'Caputo Pizzeria',w:270,official:true,structure:'standard',
    note:'Officiële specificatie W260–280; W270 is precies het midden.',noteEn:'Official specification W260–280; W270 is exactly the midpoint.'},
  tipo00:{name:'Tipo 00 pizzabloem',nameEn:'Tipo 00 pizza flour',w:null,official:false,structure:'standard',
    note:'W verschilt sterk per merk. Vul de fabrikant-W in als die bekend is; anders wordt geen numerieke W-risicoscore berekend.',noteEn:'W varies widely by brand. Enter the manufacturer W if known; otherwise no numerical W-risk score is calculated.'},
  manitoba:{name:'Manitoba / sterke tarwebloem',nameEn:'Manitoba / strong wheat flour',w:null,official:false,structure:'standard',
    note:'Meestal sterk, maar “Manitoba” is geen vaste W-waarde. Gebruik de productspecificatie als je die hebt.',noteEn:'Usually strong, but “Manitoba” is not a fixed W value. Use the product specification if available.'},
  tarwebloem:{name:'Tarwebloem / patentbloem',nameEn:'Wheat flour / patent flour',w:null,official:false,structure:'standard',
    note:'Consumentenbloem varieert sterk; zonder productspecificatie blijft W bewust onbekend.',noteEn:'Consumer flour varies widely; without a product specification W deliberately remains unknown.'},
  speltWit:{name:'Witte spelt',nameEn:'White spelt flour',w:null,official:false,structure:'spelt',
    note:'Spelt kan zeer uiteenlopende W-waarden hebben en gedraagt zich structureel anders dan tarwe. Eiwitpercentage is geen betrouwbare W-vervanger.',noteEn:'Spelt can have very different W values and behaves structurally differently from wheat. Protein percentage is not a reliable substitute for W.'},
  speltVolkoren:{name:'Volkoren spelt',nameEn:'Wholemeal spelt flour',w:null,official:false,structure:'speltWhole',
    note:'Spelt + zemelen verkleinen doorgaans de fermentatiemarge, maar één vaste W- of “tolerance”-factor zou schijnprecisie zijn.',noteEn:'Spelt plus bran generally reduces fermentation tolerance, but one fixed W or “tolerance” factor would imply false precision.'},
  volkorenTarwe:{name:'Volkoren tarwe',nameEn:'Wholemeal wheat flour',w:null,official:false,structure:'wholegrain',
    note:'Zemelen beïnvloeden het glutennetwerk; zonder productspecificatie wordt geen exacte W-risicoscore gegeven.',noteEn:'Bran affects the gluten network; without a product specification no exact W-risk score is shown.'},
  custom:{name:'Eigen bloem',nameEn:'Custom flour',w:null,official:false,structure:'custom',
    note:'Vul de W-waarde zelf in als je die van de fabrikant kent.',noteEn:'Enter the W value yourself if you know it from the manufacturer.'}
};
function currentFlourType(){
  const el=$('flourType');
  return (el && flourTypes[el.value]) || flourTypes.caputoPizzeria;
}
function flourTypeName(ft=currentFlourType()){return currentLang==='en'?(ft.nameEn||ft.name):ft.name;}
function flourTypeNote(ft=currentFlourType()){return currentLang==='en'?(ft.noteEn||ft.note):ft.note;}

// Alle receptgrammen in de bibliotheek zijn opgeschreven voor een pizza van 32 cm.
// Bij een andere diameter schalen ze mee met het OPPERVLAK, niet met de diameter.
const REF_DIAMETER=32;
// Huidige hardwareprofiel van deze calculator:
// - Ooni Koda 2 / 14" ovenruimte: 35,5 cm als praktische fysieke referentie;
// - 12" schep: 30,5 cm als comfortabele lanceerreferentie.
// De hardwaregrenzen blijven zacht; de calculator laat dus >35,5 cm toe.
// De absolute appgrens is 40 cm: daarboven is thuisgebruik te ver buiten scope.
const OVEN_DIAMETER=35.5;
const MIN_DIAMETER=20;
const MAX_DIAMETER=40;   // globale appgrens; 40 cm is al een zeer grote thuispizza
const PEEL_DIAMETER=30.5;
const MAX_PIZZAS=24;
let toppingScale=1;
function setToppingScale(diameter){
  const d=Math.max(MIN_DIAMETER,Number(diameter)||REF_DIAMETER);
  toppingScale=Math.max(0.2,Math.pow(d/REF_DIAMETER,2));
}
function scaleQty(qty,unit){
  const q=Number(qty)*toppingScale;
  if(unit==='g') return q>=20?roundTo(q,5):Math.max(1,roundTo(q,1));
  return Math.max(1,Math.round(q));
}

let currentMethod='kitchenaid';
let exactOverride=null;
let previousYeastType='idy';
let suppressCustom=false;
let appMode='full';
let experienceMode='basic';
let currentWizardPage=0;
let completedSteps={};
let liveMeasurements={doughTemp:null,fridgeTemp:null};
let _livePlanCache={key:null,value:null};
// Tijdens het typen van het pizza-aantal mag een geldige tussenstand (de "2"
// van "20") nooit recepten of afgevinkte stappen vernietigen.
let _deferDependentStatePrune=false;
// Publieke productversie staat bewust los van opslag-/migratieschema 51.
const APP_VERSION='1.1.0';
