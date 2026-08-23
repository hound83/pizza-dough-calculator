let pizzaSelections=[];
let pizzaCustomizations=[];

const cheeseWords=[
  'fior di latte','mozzarella','provola','provolone','gorgonzola',
  'parmigiano','parmezaan','burrata','stracciatella','kaas','pecorino','taleggio','scamorza','ricotta'
];

function isCheeseItem(name){
  const n=String(name).toLowerCase();
  return cheeseWords.some(w=>n.includes(w));
}

function pizzaStyleLabel(style){
  return style==='nl' ? L('NL / afhaalstijl','Dutch takeaway style') : L('Traditioneel','Traditional');
}
function itemKey(x){return x[3] || x[0];}
function styleItem(x,style){
  const originalName=x[0],qty=Number(x[1]),unit=x[2];
  if(style==='nl' && unit==='g' && /fior di latte|mozzarella di bufala/i.test(originalName)){
    return ['Geraspte mozzarella / pizzakaas',scaleQty(qty*1.15,unit),unit,originalName];
  }
  return [originalName,scaleQty(qty,unit),unit,originalName];
}
function effectiveItemsForRecipe(r,style='traditional'){
  return r.items.map(x=>styleItem(x,style));
}

function ensurePizzaCustomizations(){
  ensurePizzaSelections();
  while(pizzaCustomizations.length<pizzaSelections.length) pizzaCustomizations.push(null);
  if(pizzaCustomizations.length>pizzaSelections.length) pizzaCustomizations=pizzaCustomizations.slice(0,pizzaSelections.length);

  pizzaSelections.forEach((id,i)=>{
    const old=pizzaCustomizations[i];
    if(!old || old.recipeId!==id){
      pizzaCustomizations[i]={recipeId:id,excluded:{},noSauce:false,extraCheese:false,pizzaStyle:'traditional',sauceOverride:null};
    }else{
      old.excluded=old.excluded||{};
      old.noSauce=!!old.noSauce;
      old.extraCheese=!!old.extraCheese;
      old.pizzaStyle=old.pizzaStyle==='nl'?'nl':'traditional';
      old.sauceOverride=old.sauceOverride||null;
    }
  });
}

function includedItemsForBall(index){
  ensurePizzaCustomizations();
  const r=recipeById(pizzaSelections[index]);
  const custom=pizzaCustomizations[index];
  return effectiveItemsForRecipe(r,custom.pizzaStyle).filter(x=>!custom.excluded[itemKey(x)]);
}
function setPizzaStyle(index,style){
  ensurePizzaCustomizations();
  pizzaCustomizations[index].pizzaStyle=style==='nl'?'nl':'traditional';
  update();
}

// Kaasplafond. Hoe heter de steen, hoe minder kaas er in de korte baktijd
// goed smelt zonder te gaan koken. Het plafond schaalt mee met het oppervlak
// van de pizza, en de totale beleglast telt mee: 25 g extra op een kale
// Margherita is iets anders dan op een volle Capricciosa.
function cheeseCapFor(c){
  let cap;
  if(c.stoneTemp>=440) cap=105;
  else if(c.stoneTemp>=420) cap=115;
  else if(c.stoneTemp>=390) cap=125;
  else if(c.stoneTemp>=350) cap=135;
  else cap=145;
  return roundTo(cap*toppingScale,5);
}

function cheeseAdviceFor(items,r,c,style){
  const after=new Set(r.after||[]);
  const baked=items.filter(x=>!after.has(itemKey(x)));
  const bakedCheese=baked.filter(x=>isCheeseItem(x[0]));
  const bakedCheeseG=bakedCheese.reduce((a,x)=>a+(x[2]==='g'?Number(x[1]):0),0);
  const otherG=baked.filter(x=>!isCheeseItem(x[0])&&x[2]==='g').reduce((a,x)=>a+Number(x[1]),0);
  const cap=cheeseCapFor(c);

  // Geen schijnprecies totaalplafond meer. We delen de overige toppinglast
  // bewust grof in drie categorieën, genormaliseerd naar het 32-cm-recept.
  // Licht: normale ruimte voor extra kaas. Normaal: beperkte extra kaas.
  // Zwaar: geen extra kaas adviseren; de pizza heeft al genoeg massa.
  const normalizedOther=otherG/Math.max(0.01,toppingScale);
  const loadClass=normalizedOther>=105?'heavy':(normalizedOther>=55?'normal':'light');
  const loadLimit=loadClass==='heavy'?0:(loadClass==='normal'?15:25);
  const maxExtra=Math.max(0,roundTo(loadLimit*toppingScale,5));

  let targetName=style==='nl'?'Geraspte mozzarella / pizzakaas':'Fior di latte (mozzarella)';
  const preferred=bakedCheese.find(x=>/fior di latte|mozzarella|pizzakaas|provola/i.test(x[0])) || bakedCheese[0];
  if(preferred) targetName=preferred[0];

  let amount,changesTradition=false;
  if(bakedCheeseG===0){
    amount=Math.max(5,roundTo((c.stoneTemp>=420?70:80)*toppingScale,5));
    if(loadClass==='heavy') amount=roundTo(amount*0.7,5);
    changesTradition=true;
  }else{
    amount=roundTo(Math.min(maxExtra,Math.max(0,cap-bakedCheeseG)),5);
  }
  if(amount<10 && bakedCheeseG>0) amount=0;

  return {
    name:targetName, amount, bakedCheeseG, otherG, cap, loadClass,
    allowed:amount>0, changesTradition,
    label:amount>0
      ? (currentLang==='en'
          ? `${changesTradition?'Add cheese':'Extra cheese'}: +${fmt(amount,0)} g ${tItem(targetName)}`
          : `${changesTradition?'Kaas toevoegen':'Extra kaas'}: +${fmt(amount,0)} g ${targetName}`)
      : (currentLang==='en'
          ? `No extra cheese recommended at ${fmt(c.stoneTemp,0)} °C`
          : `Geen extra kaas aangeraden bij ${fmt(c.stoneTemp,0)} °C`)
  };
}

function extraCheeseAdvice(index,c){
  ensurePizzaCustomizations();
  const r=recipeById(pizzaSelections[index]);
  return cheeseAdviceFor(includedItemsForBall(index),r,c,pizzaCustomizations[index].pizzaStyle);
}

function setIngredientIncluded(index,name,included){
  ensurePizzaCustomizations();
  pizzaCustomizations[index].excluded[name]=!included;
  update();
}
function effectiveSauceTypeForBall(index){
  ensurePizzaCustomizations();
  const r=recipeById(pizzaSelections[index]);
  return pizzaCustomizations[index].sauceOverride || r.sauce;
}

function sauceGramsForRecipe(r,type){
  let base;
  if(type===r.sauce) base=r.sauceG;
  else if(r.sauce==='bianca' && type==='sanMarzano') base=60;
  else base=(sauces[type]&&sauces[type].perPizza)||r.sauceG;
  const scaled=base*toppingScale;
  return scaled>=20?roundTo(scaled,5):Math.max(1,roundTo(scaled,1));
}

function effectiveSauceGramsForBall(index){
  const r=recipeById(pizzaSelections[index]);
  return sauceGramsForRecipe(r,effectiveSauceTypeForBall(index));
}

function setPizzaSauceType(index,type){
  if(!sauces[type])return;
  ensurePizzaCustomizations();
  const r=recipeById(pizzaSelections[index]);
  pizzaCustomizations[index].sauceOverride=(type===r.sauce)?null:type;
  update();
}

function setSauceIncluded(index,included){
  ensurePizzaCustomizations();
  pizzaCustomizations[index].noSauce=!included;
  update();
}
function setExtraCheese(index,enabled){
  ensurePizzaCustomizations();
  const advice=extraCheeseAdvice(index,calc());
  pizzaCustomizations[index].extraCheese=!!enabled && advice.allowed;
  update();
}
function resetPizzaCustomization(index){
  ensurePizzaCustomizations();
  const keepStyle=pizzaCustomizations[index].pizzaStyle||'traditional';
  pizzaCustomizations[index]={recipeId:pizzaSelections[index],excluded:{},noSauce:false,extraCheese:false,pizzaStyle:keepStyle,sauceOverride:null};
  update();
}

let pickerTarget='all';
// Dit is de bewuste, aangeklikte keuze in het open venster. Hover en focus
// zijn uitsluitend CSS/browsergedrag en mogen deze state nooit wijzigen.
let pickerSelectedId='margherita';
let recipeAllSelection='margherita';
let pickerPendingExtraCheese=false;
let pickerPendingExcluded={};
let pickerPendingNoSauce=false;
let pickerPendingRecipeId=null;
let pickerPendingStyle='traditional';
let pickerPendingSauceType=null;

function initRecipeOptions(){
  // Custom picker; no native select needed.
}

function ensurePizzaSelections(){
  // Zelfstandig begrenzen: tijdens typen blijft het veld bewust ongemoeid en
  // een tijdelijke/plakte waarde van 999 mag geen 999 receptkaarten bouwen.
  const count=clamp(Math.round(num('pizzas'))||1,1,MAX_PIZZAS);
  while(pizzaSelections.length<count) pizzaSelections.push('margherita');
  if(!_deferDependentStatePrune && pizzaSelections.length>count) pizzaSelections=pizzaSelections.slice(0,count);
}

function buildPizzaBallSelectors(){
  ensurePizzaCustomizations();
  $('pizzaBallSelectors').innerHTML=pizzaSelections.map((id,idx)=>{
    const r=recipeById(id),custom=pizzaCustomizations[idx];
    return `<div class="ball-card">
      <div class="ball-title"><b>${L('Bol','Dough ball')} ${idx+1}</b><span>${recipeTagText(r)}</span></div>
      <button class="pick-button" type="button" onclick="openPizzaPicker(${idx})">
        <span>
          <span class="pick-main">${recipeNameText(r)}</span>
          <span class="pick-sub">${pizzaStyleLabel(custom.pizzaStyle)} • ${sauceName(effectiveSauceTypeForBall(idx))} • ${effectiveSauceGramsForBall(idx)} g ${L('saus','sauce')}</span>
        </span>
        <span class="chev">›</span>
      </button>
      <div class="hint" style="margin:8px 0 0">${recipeNoteText(r)}</div>
    </div>`;
  }).join('');

  const allRecipe=recipeById(recipeAllSelection);
  $('pizzaRecipeAllMain').textContent=recipeNameText(allRecipe);
}


// Zelfde logica, maar voor een recept dat nog niet aan een bol hangt (de picker).
// Neemt nu ook de vinkjes mee die de gebruiker in de picker heeft uitgezet.
function extraCheeseAdviceForRecipe(recipeId,c,style='traditional',excluded){
  const r=recipeById(recipeId);
  const ex=excluded||{};
  const items=effectiveItemsForRecipe(r,style).filter(x=>!ex[itemKey(x)]);
  return cheeseAdviceFor(items,r,c,style);
}

function loadPickerPendingCustomization(recipeId){
  ensurePizzaCustomizations();
  pickerPendingRecipeId=recipeId;
  const previousStyle=pickerPendingStyle||'traditional';
  const idx=Number(pickerTarget);
  const sameSingle=pickerTarget!=='all' && pizzaSelections[idx]===recipeId && pizzaCustomizations[idx]?.recipeId===recipeId;
  const allSame=pickerTarget==='all' && pizzaSelections.length>0 && pizzaSelections.every(id=>id===recipeId);
  if(sameSingle){
    const c=pizzaCustomizations[idx];
    pickerPendingExcluded={...(c.excluded||{})};
    pickerPendingNoSauce=!!c.noSauce;
    pickerPendingExtraCheese=!!c.extraCheese;
    pickerPendingStyle=c.pizzaStyle||'traditional';
    pickerPendingSauceType=c.sauceOverride||recipeById(recipeId).sauce;
  }else if(allSame && pizzaCustomizations.length && pizzaCustomizations.every(c=>c && c.recipeId===recipeId)){
    const r=recipeById(recipeId); pickerPendingExcluded={};
    r.items.forEach(x=>{if(pizzaCustomizations.every(c=>c.excluded?.[x[0]])) pickerPendingExcluded[x[0]]=true;});
    pickerPendingNoSauce=pizzaCustomizations.every(c=>c.noSauce);
    pickerPendingExtraCheese=pizzaCustomizations.every(c=>c.extraCheese);
    const styles=[...new Set(pizzaCustomizations.map(c=>c.pizzaStyle||'traditional'))];
    pickerPendingStyle=styles.length===1?styles[0]:previousStyle;
    const sauceTypes=[...new Set(pizzaCustomizations.map(c=>c.sauceOverride||recipeById(recipeId).sauce))];
    pickerPendingSauceType=sauceTypes.length===1?sauceTypes[0]:recipeById(recipeId).sauce;
  }else{
    pickerPendingExcluded={};pickerPendingNoSauce=false;pickerPendingExtraCheese=false;pickerPendingStyle=previousStyle;
    pickerPendingSauceType=recipeById(recipeId).sauce;
  }
}
function setPickerPizzaStyle(style){pickerPendingStyle=style==='nl'?'nl':'traditional';renderPickerPreview();}

function setPickerIngredientIncluded(name,included){
  pickerPendingExcluded[name]=!included;
  renderPickerPreview();
}

function setPickerSauceType(type){
  if(!sauces[type])return;
  pickerPendingSauceType=type;
  renderPickerPreview();
}

function setPickerSauceIncluded(included){
  pickerPendingNoSauce=!included;
  renderPickerPreview();
}

function setPickerExtraCheese(enabled){
  pickerPendingExtraCheese=!!enabled;
  renderPickerPreview();
}

// Toetsenbordgebruikers konden vroeger achter een open modal doortabben en
// belandden na sluiten bovenaan de pagina. Focus wordt nu vastgehouden en
// teruggegeven aan de knop die de modal opende.
let _modalStack=[];
let _lastFocus=null;
function focusablesIn(root){
  return [...root.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')]
    .filter(el=>el.offsetParent!==null||el===document.activeElement);
}
function trapFocus(e,root){
  if(e.key!=='Tab')return;
  const f=focusablesIn(root);
  if(!f.length)return;
  const first=f[0],last=f[f.length-1];
  if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}
  else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}
}
function pushModal(id){
  if(!_modalStack.length)_lastFocus=document.activeElement;
  _modalStack.push(id);
  document.body.style.overflow='hidden';
}
function popModal(id){
  _modalStack=_modalStack.filter(x=>x!==id);
  if(!_modalStack.length){
    document.body.style.overflow='';
    if(_lastFocus&&document.contains(_lastFocus)){try{_lastFocus.focus();}catch(e){}}
    _lastFocus=null;
  }
}

function usesMobilePickerLayout(){
  return typeof window.matchMedia==='function' && window.matchMedia('(max-width: 760px)').matches;
}

function showPickerListOnMobile(){
  const modal=$('pizzaPickerModal');
  if(!modal)return;
  modal.classList.remove('mobile-preview-open');
  requestAnimationFrame(()=>{
    const selected=document.querySelector(`#pizzaPickerList [data-recipe-id="${pickerSelectedId}"][aria-pressed="true"]`);
    if(selected&&typeof selected.focus==='function')selected.focus({preventScroll:true});
  });
}

function showPickerPreviewOnMobile(){
  if(!usesMobilePickerLayout())return;
  const modal=$('pizzaPickerModal');
  if(!modal)return;
  modal.classList.add('mobile-preview-open');
  $('pizzaPickerPreview').scrollTop=0;
  requestAnimationFrame(()=>{
    const back=$('pizzaPickerBack');
    if(back&&typeof back.focus==='function')back.focus({preventScroll:true});
  });
}

function openPizzaPicker(target){
  pickerTarget=target;
  activePizzaFilters.clear();
  document.querySelectorAll('.filter-chip').forEach(btn=>btn.classList.toggle('active',btn.dataset.filter==='all'));
  ensurePizzaCustomizations();
  const currentId = target==='all' ? recipeAllSelection : (pizzaSelections[target] || 'margherita');

  pickerPendingStyle='traditional';
  loadPickerPendingCustomization(currentId);
  pickerSelectedId=currentId;
  $('pizzaPickerSearch').value='';
  $('pickerTitle').textContent=target==='all' ? L('Kies pizza voor alle bollen','Choose pizza for all dough balls') : L(`Kies pizza voor bol ${Number(target)+1}`,`Choose pizza for dough ball ${Number(target)+1}`);
  $('pizzaPickerModal').classList.remove('mobile-preview-open');
  $('pizzaPickerOverlay').classList.add('open');
  pushModal('picker');
  renderPickerList();
  renderPickerPreview();
  setTimeout(()=>{
    if(!usesMobilePickerLayout())$('pizzaPickerSearch').focus();
  },50);
}

function closePizzaPicker(){
  if(!$('pizzaPickerOverlay').classList.contains('open'))return;
  $('pizzaPickerOverlay').classList.remove('open');
  $('pizzaPickerModal').classList.remove('mobile-preview-open');
  popModal('picker');
}

function overlayBackgroundClose(e){
  if(e.target===$('pizzaPickerOverlay')) closePizzaPicker();
}

const topTenPizzaIds=[
  'margherita',
  'salami',
  'prosciuttoFunghi',
  'quattroFormaggi',
  'diavola',
  'hawaii',
  'capricciosa',
  'quattroStagioni',
  'tonnoCipolla',
  'funghi'
];

const preferredPizzaOrder=[
  'margherita','salami','prosciuttoFunghi','quattroFormaggi','diavola','hawaii',
  'capricciosa','quattroStagioni','tonnoCipolla','tonno','tonnoOlive','tonnoCapperi',
  'tonnoPiccante','tonnoGorgonzola','tonnoMais','salmoneRucola','gamberiAglio','fruttiMare',
  'sardineCipolla','acciugheOlive','funghi','pepperoni','prosciuttoCotto','marinara',
  'napoletana','prosciuttoCrudo','margheritaExtra','parmigiana','ortolana','salsicciaFriarielli',
  'salameFunghi','boscaiola','salsicciaFunghi','speckFunghi','parmaFunghi','gorgonzolaFunghi',
  'porciniTaleggio','porciniSalsiccia','quattroFormaggiFunghi','tartufoFunghi','prosciuttoCrudoSimple','parmaBurrata',
  'nduja','mortadella','burrataPomodoro','speckGorgonzola','salsicciaGorgonzola','diavolaGorgonzola',
  'taleggioSpeck','taleggioSalsiccia','gorgonzolaNduja','pancettaScamorza','pancettaPecorino','bresaolaRucola',
  'porchettaProvola','cottoProvola','salameProvola','salsicciaCipolla','salsicciaPatate','cottoBurrata',
  'carbonara','amatriciana','gricia','cacioPepe','calabrese','siciliana',
  'romana','pestoMortadella','pestoParmaBurrata','ricottaSalame','ricottaNduja','quattroFormaggiRosso',
  'quattroFormaggiPiccante','quattroFormaggiSalame','quattroFormaggiProsciutto','quattroFormaggiSalsiccia','quattroFormaggiNduja','quattroFormaggiAffumicata',
  'quattroFormaggiTaleggio','quattroFormaggiPecorino','cinqueFormaggi','tartufoProsciutto','tartufoSalsiccia','patateRosmarino',
  'caprese','biancaProsciutto','polpette','raguParmigiano','gorgonzolaPera'
];


let activePizzaFilters=new Set();

const meatTerms=[
  'salami','pepperoni','ham','prosciutto','parmaham','mortadella','salsiccia','worst',
  'speck','pancetta','guanciale','bresaola','porchetta','gehakt','ragù','ragu',
  "'nduja",'nduja','polpette','vlees','kip','chicken'
];
const fishTerms=[
  'tonno','tonijn','tuna','ansjovis','anchovy','acciughe',
  'zalm','salmone','garnalen','garnaal','gamberi',
  'sardine','sardines','zeevruchten','frutti di mare','seafood'
];
const spicyTerms=['pittige','pittig','pepperoni',"'nduja",'nduja','chili','chilli','calabrese','diavola'];

function englishIngredientSearchTerms(name){
  // ITEM_EN is de nette displayvertaling; de oudere vertaler bevat soms een
  // nuttig alternatief (aubergine/eggplant, courgette/zucchini). Zoekdata mag
  // beide bevatten, zodat een mooi label geen synoniem verwijdert.
  return [ITEM_EN[name],englishDataText(name)].filter(Boolean);
}

// Tweetalige, genormaliseerde tekst per recept. Gecached omdat de vertaler
// 130 regexregels doorloopt en dit anders per toetsaanslag opnieuw gebeurt.
const _termTextCache=new Map();
function recipeIngredientText(r){
  const ck=currentLang+'|'+r.id;
  if(_termTextCache.has(ck)) return _termTextCache.get(ck);
  const source=[r.name,r.tag,r.note,...r.items.map(x=>x[0])];
  const english=[
    englishDataText(r.name,r.nameEn),englishDataText(r.tag,r.tagEn),englishDataText(r.note,r.noteEn),
    ...r.items.flatMap(x=>englishIngredientSearchTerms(x[0]))
  ];
  const txt=normalizeSearchText([...source,...english].join(' '));
  _termTextCache.set(ck,txt);
  return txt;
}

// Substring-matching gaf valse treffers: 'ham' zit in 'champignons', waardoor
// vier vegetarische paddenstoelpizza's als vlees werden aangemerkt.
// Matchen gebeurt nu op hele woorden.
function hasAnyTerm(r,terms){
  const txt=' '+recipeIngredientText(r)+' ';
  return terms.some(term=>{
    const t=normalizeSearchText(term);
    return t && txt.includes(' '+t+' ');
  });
}
function hasMeatRecipe(r){ return hasAnyTerm(r,meatTerms); }
function hasFishRecipe(r){ return hasAnyTerm(r,fishTerms); }
function isVegetarianRecipe(r){ return !hasMeatRecipe(r) && !hasFishRecipe(r); }
function isSpicyRecipe(r){ return hasAnyTerm(r,spicyTerms); }
function hasCheeseRecipe(r){ return r.items.some(x=>isCheeseItem(x[0])); }
function hasTomatoSauceRecipe(r){ return !!sauces[r.sauce]?.tomato; }
function hasNonTomatoSauceRecipe(r){ return !!sauces[r.sauce] && !sauces[r.sauce].tomato; }

function recipeMatchesSingleFilter(r,filter){
  if(filter==='meat') return hasMeatRecipe(r);
  if(filter==='fish') return hasFishRecipe(r);
  if(filter==='vegetarian') return isVegetarianRecipe(r);
  if(filter==='mushroom') return hasMushroomsRecipe(r);
  if(filter==='cheese') return hasCheeseRecipe(r);
  if(filter==='tomato') return hasTomatoSauceRecipe(r);
  if(filter==='noTomato') return hasNonTomatoSauceRecipe(r);
  if(filter==='spicy') return isSpicyRecipe(r);
  return true;
}

function recipeMatchesFilter(r){
  if(activePizzaFilters.size===0) return true;
  return [...activePizzaFilters].every(filter=>recipeMatchesSingleFilter(r,filter));
}

function filterLabel(filter){
  return {
    all:L('Alles','All'),meat:L('Vlees','Meat'),fish:L('Vis','Fish'),vegetarian:L('Vega','Vegetarian'),mushroom:L('Paddenstoel','Mushroom'),
    cheese:L('Kaas','Cheese'),tomato:L('Tomatenbasis','Tomato base'),noTomato:L('Zonder tomaat','No tomato'),spicy:L('Pittig','Spicy')
  }[filter]||L('Alles','All');
}

function activeFilterLabel(){
  return [...activePizzaFilters].map(filterLabel).join(' + ');
}

function setPizzaFilter(filter){
  if(filter==='all'){
    activePizzaFilters.clear();
  }else if(activePizzaFilters.has(filter)){
    activePizzaFilters.delete(filter);
  }else{
    activePizzaFilters.add(filter);
  }

  document.querySelectorAll('.filter-chip').forEach(btn=>{
    if(btn.dataset.filter==='all'){
      btn.classList.toggle('active',activePizzaFilters.size===0);
    }else{
      btn.classList.toggle('active',activePizzaFilters.has(btn.dataset.filter));
    }
  });
  renderPickerList();
}

function recipeIcons(r){
  const icons=[];
  if(hasMeatRecipe(r)) icons.push('🥩');
  else if(hasFishRecipe(r)) icons.push('🐟');
  else icons.push('🌱');
  if(hasMushroomsRecipe(r)) icons.push('🍄');
  return `<span class="recipe-icons">${icons.join('')}</span>`;
}

function hasMushroomsRecipe(r){
  return r.items.some(x=>{
    const n=String(x[0]).toLowerCase();
    return n.includes('champignon') || n.includes('porcini') || n.includes('paddenstoel') || n.includes('eekhoorntjesbrood');
  });
}
function isMushroomClassic(r){
  return ['capricciosa','quattroStagioni'].includes(r.id);
}
function preferredRank(r){
  const i=preferredPizzaOrder.indexOf(r.id);
  return i<0?999:i;
}


function normalizeSearchText(value){
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .toLowerCase()
    .replace(/[’']/g,'')
    .replace(/[^a-z0-9]+/g,' ')
    .trim();
}

// Gecached: zonder cache draaide dit per toetsaanslag over alle 89 recepten
// met de volledige vertaaltabel erachteraan.
const _haystackCache=new Map();
function pizzaSearchHaystack(r){
  const ck=currentLang+'|'+r.id;
  if(_haystackCache.has(ck)) return _haystackCache.get(ck);
  const sauce=sauces[r.sauce]||{};
  const source=[
    r.name,
    r.tag,
    r.note,
    sauce.name || '',
    ...r.items.map(x=>x[0]),
    // 'pizzakaas' als los token maakte dat zoeken op "kaas" 86 van 89 recepten gaf.
    r.items.some(x=>/fior di latte|mozzarella di bufala/i.test(x[0]))?'afhaalstijl geraspte':''
  ];
  const english=[
    englishDataText(r.name,r.nameEn),englishDataText(r.tag,r.tagEn),englishDataText(r.note,r.noteEn),
    englishDataText(sauce.name,sauce.nameEn),
    ...r.items.flatMap(x=>englishIngredientSearchTerms(x[0])),
    source[source.length-1]?englishDataText(source[source.length-1]):''
  ];
  const txt=normalizeSearchText([...source,...english].join(' '));
  _haystackCache.set(ck,txt);
  return txt;
}
function clearSearchCaches(){_haystackCache.clear();_termTextCache.clear();}

function pizzaMatchesQuery(r,q){
  const terms=normalizeSearchText(q).split(/\s+/).filter(Boolean);
  if(!terms.length) return true;
  const hay=pizzaSearchHaystack(r);
  return terms.every(term=>hay.includes(term));
}

function clearPizzaSearch(){
  const input=$('pizzaPickerSearch');
  input.value='';
  renderPickerList();
  input.focus();
}

function pickerItemHtml(r,currentId){
  const isCurrent=r.id===currentId;
  const isSelected=r.id===pickerSelectedId;
  return `<button type="button"
      data-recipe-id="${r.id}"
      aria-pressed="${isSelected?'true':'false'}"
      class="picker-item ${isSelected?'active':''} ${isCurrent?'assigned':''} ${hasMushroomsRecipe(r)?'mushroom':''}"
      onclick="selectPickerRecipe('${r.id}')">
      <span>${recipeNameText(r)}${recipeIcons(r)}</span>
      <span class="meta">
        ${isSelected&&!isCurrent?`<span class="assigned-mark">${L('✓ gekozen','✓ selected')}</span> `:''}
        ${isCurrent?`<span class="current-mark">${L('huidig','current')}</span> `:''}
        ${recipeTagText(r)}
      </span>
    </button>`;
}

function renderPickerList(){
  const rawQuery=$('pizzaPickerSearch').value;
  const q=normalizeSearchText(rawQuery);
  const currentId=pickerTarget==='all' ? recipeAllSelection : (pizzaSelections[pickerTarget] || 'margherita');
  const clearBtn=$('pizzaPickerSearchClear');
  clearBtn.classList.toggle('hidden',!q);
  const help=$('pickerSelectionHelp');
  if(help)help.innerHTML=L(
    'Klik op een pizza om hem te selecteren en pas het recept daarna aan. De keuze wordt pas voor de bol opgeslagen wanneer je op <b>Kies pizza</b> drukt.',
    'Click a pizza to select it, then customize the recipe. It is only saved to the dough ball when you click <b>Choose pizza</b>.');

  const filterText=activePizzaFilters.size ? activeFilterLabel() : '';
  let results=pizzaRecipes.filter(recipeMatchesFilter);

  if(q){
    results=results
      .filter(r=>pizzaMatchesQuery(r,q))
      .sort((a,b)=>{
        const an=normalizeSearchText(recipeNameText(a));
        const bn=normalizeSearchText(recipeNameText(b));
        const qTerms=q.split(/\s+/).filter(Boolean);
        const aNameHit=qTerms.every(t=>an.includes(t))?0:1;
        const bNameHit=qTerms.every(t=>bn.includes(t))?0:1;
        if(aNameHit!==bNameHit) return aNameHit-bNameHit;
        return preferredRank(a)-preferredRank(b) || recipeNameText(a).localeCompare(recipeNameText(b),currentLang==='en'?'en':'nl');
      });

    $('pizzaPickerSearchStatus').textContent=L(
      `${results.length} ${results.length===1?'pizza':'pizza’s'} gevonden voor “${rawQuery.trim()}”${filterText?` • ${filterText}`:''}`,
      `${results.length} ${results.length===1?'pizza':'pizzas'} found for “${rawQuery.trim()}”${filterText?` • ${filterText}`:''}`);

    $('pizzaPickerList').innerHTML=`
      <div class="picker-section-title">${L("Zoekresultaten","Search results")}${filterText?` • ${filterText}`:''}</div>
      ${results.length
        ? results.map(r=>pickerItemHtml(r,currentId).replace('class="picker-item ','class="picker-item search-hit ')).join('')
        : `<div class="hint" style="padding:12px">${L('Geen pizza gevonden. Wis een filter of probeer een andere zoekterm.','No pizza found. Clear a filter or try another search term.')}</div>`}`;

    $('pizzaPickerList').scrollTop=0;
    return;
  }

  if(activePizzaFilters.size){
    results.sort((a,b)=>preferredRank(a)-preferredRank(b) || recipeNameText(a).localeCompare(recipeNameText(b),currentLang==='en'?'en':'nl'));
    $('pizzaPickerSearchStatus').textContent=L(
      `${results.length} ${results.length===1?'pizza':'pizza’s'} • ${filterText}`,
      `${results.length} ${results.length===1?'pizza':'pizzas'} • ${filterText}`);

    $('pizzaPickerList').innerHTML=`
      <div class="picker-section-title">${filterText}</div>
      ${results.length
        ? results.map(r=>pickerItemHtml(r,currentId)).join('')
        : `<div class="hint" style="padding:12px">${L('Geen recepten met deze combinatie van filters.','No recipes match this combination of filters.')}</div>`}`;

    $('pizzaPickerList').scrollTop=0;
    return;
  }

  const topTen=topTenPizzaIds.map(recipeById);
  const all=[...pizzaRecipes].sort((a,b)=>preferredRank(a)-preferredRank(b) || recipeNameText(a).localeCompare(recipeNameText(b),currentLang==='en'?'en':'nl'));

  $('pizzaPickerSearchStatus').textContent=L(`Top 10 populaire pizza’s + ${all.length} recepten`,`Top 10 popular pizzas + ${all.length} recipes`);
  $('pizzaPickerList').innerHTML=`
    <div class="picker-section-title">${L("Top 10 • populaire pizza’s","Top 10 • popular pizzas")}</div>
    ${topTen.map(r=>pickerItemHtml(r,currentId)).join('')}
    <hr class="picker-divider">
    <div class="picker-section-title">
      ${L("Alle recepten","All recipes")} <span class="all-recipes-count">${all.length} ${L("totaal","total")}</span>
    </div>
    <div class="all-recipes-scroll">
      ${all.map(r=>pickerItemHtml(r,currentId)).join('')}
    </div>`;

  $('pizzaPickerList').scrollTop=0;
}

function selectPickerRecipe(id){
  const selected=pizzaRecipes.find(r=>r.id===id);
  if(!selected)return;
  const listScrollTop=$('pizzaPickerList').scrollTop;
  const selectionChanged=pickerSelectedId!==selected.id || pickerPendingRecipeId!==selected.id;
  pickerSelectedId=selected.id;
  // De tijdelijke instellingen horen bij precies één bewust aangeklikt recept.
  // Bij een ander recept worden de opgeslagen instellingen geladen of veilige
  // receptdefaults gebruikt, zodat saus/toppings nooit van een vorige keuze lekken.
  if(selectionChanged)loadPickerPendingCustomization(pickerSelectedId);
  renderPickerList();
  $('pizzaPickerList').scrollTop=listScrollTop;
  renderPickerPreview();
  showPickerPreviewOnMobile();
}

function syncPickerPreviewHighlight(id){
  document.querySelectorAll('#pizzaPickerList .picker-item').forEach(el=>{
    el.classList.toggle('active',el.dataset.recipeId===id);
    el.setAttribute('aria-pressed',el.dataset.recipeId===id?'true':'false');
  });
}

function renderPickerPreview(){
  const id=pickerSelectedId;
  syncPickerPreviewHighlight(id);
  const r=recipeById(id);

  if(pickerPendingRecipeId!==id)loadPickerPendingCustomization(id);
  if(!pickerPendingSauceType) pickerPendingSauceType=r.sauce;

  const cheese=extraCheeseAdviceForRecipe(id,calc(),pickerPendingStyle,pickerPendingExcluded);
  if(!cheese.allowed) pickerPendingExtraCheese=false;

  const afterSet=new Set(r.after||[]);
  const effective=effectiveItemsForRecipe(r,pickerPendingStyle);
  const ingredientRows=effective.map(x=>{
    const key=itemKey(x);
    const checked=!pickerPendingExcluded[key];
    return `<label class="picker-ingredient-check">
      <input type="checkbox" ${checked?'checked':''}
        onchange='setPickerIngredientIncluded(${JSON.stringify(key)},this.checked)'>
      <span class="picker-ingredient-name">${tItem(x[0])}</span>
      <span class="picker-ingredient-qty">${x[1]} ${tUnit(x[2],x[1])}</span>
      ${afterSet.has(key)?`<span class="picker-after">${L('na bakken','after baking')}</span>`:''}
    </label>`;
  }).join('');

  const sauceType=pickerPendingSauceType||r.sauce;
  const sauceG=sauceGramsForRecipe(r,sauceType);

  const sauceChanged=sauceType!==r.sauce;
  const sauceChoice=`<div class="sauce-style-choice">
        <div class="picker-section-title" style="padding-left:0">${L('Sauskeuze','Sauce choice')}</div>
        <div class="style-segment">
          ${SAUCE_CHOICES.map(sc=>`<button type="button" class="${sauceType===sc.id?'active':''}" onclick="setPickerSauceType('${sc.id}')">${sauceChoiceLabel(sc)}</button>`).join('')}
        </div>
        <div class="hint style-explain">${sauceChanged
          ? L(`Aangepast van ${sauceName(r.sauce)} naar ${sauceName(sauceType)}. Hoeveelheid wordt automatisch aan het gekozen saustype aangepast.`,
              `Changed from ${sauceName(r.sauce)} to ${sauceName(sauceType)}. Quantity is adjusted automatically for the selected sauce type.`)
          : L(`Receptbasis: ${sauceName(r.sauce)}. Je kunt hier bewust een andere saus kiezen zonder het hele recept te vervangen.`,
              `Recipe base: ${sauceName(r.sauce)}. You can deliberately choose another sauce here without replacing the whole recipe.`)}
      </div>`;

  $('pizzaPickerPreview').innerHTML=`
    <div class="picker-mobile-toolbar">
      <button class="picker-back" id="pizzaPickerBack" type="button">${L('← Recepten','← Recipes')}</button>
      <button aria-label="${L('Sluiten','Close')}" class="picker-close" id="pizzaPickerPreviewClose" type="button">✕</button>
    </div>
    <h2>${recipeNameText(r)}</h2>
    <span class="tag picker-tag">${recipeTagText(r)}</span>
    ${hasMushroomsRecipe(r)?`<span class="tag picker-tag" style="margin-left:6px">${L('🍄 bevat paddenstoelen','🍄 contains mushrooms')}</span>`:''}
    <div class="hint" style="margin:0 0 10px">${recipeNoteText(r)}</div>

    <div class="pizza-style-choice">
      <div class="picker-section-title" style="padding-left:0">${L('Pizzastijl / kaas','Pizza style / cheese')}</div>
      <div class="style-segment">
        <button type="button" class="${pickerPendingStyle==='traditional'?'active':''}" onclick="setPickerPizzaStyle('traditional')">🇮🇹 ${L('Traditioneel','Traditional')}</button>
        <button type="button" class="${pickerPendingStyle==='nl'?'active':''}" onclick="setPickerPizzaStyle('nl')">🇳🇱 ${L('NL / afhaalstijl','Dutch takeaway style')}</button>
      </div>
      <div class="hint style-explain">
        ${pickerPendingStyle==='nl'
          ? L('Geraspte mozzarella / pizzakaas vervangt verse fior di latte of buffelmozzarella en wordt ongeveer 15% royaler gedoseerd. Speciale kazen blijven behouden.','Grated mozzarella / pizza cheese replaces fresh fior di latte or buffalo mozzarella and is portioned about 15% more generously. Special cheeses are retained.')
          : L('Verse fior di latte / mozzarella volgens het recept. Speciale Italiaanse kazen blijven zoals bedoeld.','Fresh fior di latte / mozzarella according to the recipe. Special Italian cheeses remain as intended.')}
      </div>
    </div>

    ${sauceChoice}

    <h3>${L('Ingrediënten kiezen','Choose ingredients')}</h3>
    <div class="picker-customize-box">
      <label class="picker-ingredient-check sauce-check">
        <input type="checkbox" ${!pickerPendingNoSauce?'checked':''}
          onchange="setPickerSauceIncluded(this.checked)">
        <span class="picker-ingredient-name">${sauceName(sauceType)}</span>
        <span class="picker-ingredient-qty">${sauceG} g</span>
      </label>
      ${ingredientRows}
    </div>

    <div class="hint" style="margin:7px 0 0">
      ${L('Je kunt hier toppings of saus uitvinken voordat je de pizza opslaat.','You can untick toppings or sauce here before saving the pizza.')}
    </div>

    <div class="picker-cheese-option ${cheese.allowed?'':'disabled'}">
      <label>
        <input type="checkbox"
          ${pickerPendingExtraCheese&&cheese.allowed?'checked':''}
          ${cheese.allowed?'':'disabled'}
          onchange="setPickerExtraCheese(this.checked)">
        <span>
          <b>${cheese.label}</b>
          <span class="cheese-detail">
            ${cheese.allowed
              ? L(`Advies op basis van ${fmt(calc().stoneTemp,0)} °C steentemperatuur; richtlimiet voor kaas vóór het bakken ±${fmt(cheese.cap,0)} g.`,`Guidance based on ${fmt(calc().stoneTemp,0)} °C stone temperature; guideline limit for cheese before baking ±${fmt(cheese.cap,0)} g.`)
              : L(`Deze pizza zit bij ${fmt(calc().stoneTemp,0)} °C al rond de verstandige kaaslimiet.`,`At ${fmt(calc().stoneTemp,0)} °C, this pizza is already near the sensible cheese limit.`)}
          </span>
        </span>
      </label>
    </div>

    <div class="btnrow" style="margin-top:16px">
      <button class="btn primary" type="button" onclick="choosePickerRecipe()">${L('Kies','Choose')} ${recipeNameText(r)}</button>
    </div>`;

  $('pizzaPickerBack').addEventListener('click',showPickerListOnMobile);
  $('pizzaPickerPreviewClose').addEventListener('click',closePizzaPicker);
}

function choosePickerRecipe(){
  const id=pickerSelectedId;
  if(pickerPendingRecipeId!==id)loadPickerPendingCustomization(id);
  const cheese=extraCheeseAdviceForRecipe(id,calc(),pickerPendingStyle,pickerPendingExcluded);
  const useExtra=pickerPendingExtraCheese && cheese.allowed;
  const excluded={...pickerPendingExcluded};
  const noSauce=!!pickerPendingNoSauce;

  if(pickerTarget==='all'){
    recipeAllSelection=id;
    ensurePizzaSelections();
    pizzaSelections=pizzaSelections.map(()=>id);
    pizzaCustomizations=pizzaSelections.map(rid=>({
      recipeId:rid,
      excluded:{...excluded},
      noSauce,
      extraCheese:useExtra,
      pizzaStyle:pickerPendingStyle,
      sauceOverride:(pickerPendingSauceType===recipeById(rid).sauce)?null:pickerPendingSauceType
    }));
  }else{
    const idx=Number(pickerTarget);
    pizzaSelections[idx]=id;
    pizzaCustomizations[idx]={
      recipeId:id,
      excluded:{...excluded},
      noSauce,
      extraCheese:useExtra,
      pizzaStyle:pickerPendingStyle,
      sauceOverride:(pickerPendingSauceType===recipeById(id).sauce)?null:pickerPendingSauceType
    };
  }

  closePizzaPicker();
  update();
}

function applyRecipeToAll(){
  ensurePizzaSelections();
  pizzaSelections=pizzaSelections.map(()=>recipeAllSelection);
  pizzaCustomizations=pizzaSelections.map(id=>({recipeId:id,excluded:{},noSauce:false,extraCheese:false,pizzaStyle:'traditional',sauceOverride:null}));
  update();
}
