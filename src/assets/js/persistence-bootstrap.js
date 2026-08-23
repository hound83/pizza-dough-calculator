const SAVE_KEY='pizzaCalcV51';
const SAVE_VERSION=51;
const LEGACY_KEYS=Array.from({length:25},(_,i)=>`pizzaCalcV${50-i}`);
const SAVE_IDS=['pizzas','diameter','ballWeight','doughStyle','hydration','saltPct','yeastType','yeastPct','oilPct','stoneTemp','preheatMinutes',
  'fermentationMethod','coldStorageMode','bulkHours','coldHours','ballHours','roomTemp','fridgeTemp','finalDoughTemp','flourType','flourW','bakeDay','bakeTime','sauceType','saucePerPizza'];
// Only these controls override the technical dough profile owned by a preset.
// Practical recipe inputs such as pizza count, diameter, room/refrigerator
// temperature, stone temperature and bake deadline deliberately keep the
// selected preset active.
const PRESET_TECHNICAL_FIELDS=new Set([
  'ballWeight','doughStyle','hydration','saltPct','yeastType','yeastPct','oilPct',
  'fermentationMethod','coldStorageMode','bulkHours','coldHours','ballHours',
  'finalDoughTemp','flourType','flourW','sizeFromDiameter','autolyse','practical'
]);

let _saveTimer=null;
let _storageWarningShown=false;
function storageWarningText(){
  return L('⚠️ Lokale opslag is niet beschikbaar. De calculator blijft werken, maar wijzigingen en het deeglogboek gaan verloren zodra je deze pagina sluit.',
           '⚠️ Local storage is unavailable. The calculator keeps working, but changes and the dough log will be lost when you close this page.');
}
function showStorageWarningOnce(){
  let box=$('storageWarning');
  if(!box){
    box=document.createElement('div');
    box.id='storageWarning';
    box.className='warning';
    box.style.margin='0 0 14px';
    document.querySelector('.app')?.prepend(box);
  }
  box.textContent=storageWarningText();
  _storageWarningShown=true;
}
// update() draait bij elke toetsaanslag; zonder debounce betekende dat een
// volledige JSON.stringify plus synchrone schrijfactie per ingetypt teken.
function scheduleSave(){
  if(_saveTimer)clearTimeout(_saveTimer);
  _saveTimer=setTimeout(()=>{_saveTimer=null;saveState();},300);
}

function saveState(){
  const data={version:SAVE_VERSION,currentMethod,exactOverride,previousYeastType,appMode,experienceMode,currentLang,completedSteps,bakeLog,liveMeasurements,
    currentWizardPage,
    practical:$('practical').checked,autolyse:$('autolyse').checked,
    sizeFromDiameter:$('sizeFromDiameter').checked,includeSauce:$('includeSauce').checked,
    autoSauceFromPizzas:$('autoSauceFromPizzas').checked,pizzaSelections,pizzaCustomizations,recipeAllSelection,preset:$('preset').value};
  SAVE_IDS.forEach(id=>{ if($(id)) data[id]=$(id).value; });
  const ok=SAFE.set(SAVE_KEY,JSON.stringify(data));
  if(!ok)showStorageWarningOnce();
  return ok;
}

// Een opgeslagen blob is niet te vertrouwen: hij kan uit een oudere versie
// komen, half leeg zijn of met de hand aangepast. Alles wat de berekening
// kan laten ontsporen wordt daarom gecontroleerd voordat het wordt gebruikt.
function sanitizeExactOverride(v){
  if(!v||typeof v!=='object'||Array.isArray(v))return null;
  const bounds={h:[45,85],s:[0,5],o:[0,10],ySelected:[0,3]};
  const out={};
  ['h','s','o','ySelected'].forEach(k=>{ if(Number.isFinite(v[k])) out[k]=clamp(v[k],bounds[k][0],bounds[k][1]); });
  return Object.keys(out).length?out:null;
}


function sanitizeBakeLog(v){
  if(!Array.isArray(v))return [];
  return v.slice(-30).map(x=>{
    if(!x||typeof x!=='object'||Array.isArray(x))return null;
    const method=['hand','kitchenaid','kenwood','pro'].includes(x.method)?x.method:'kitchenaid';
    const numOrNull=(n,min,max)=>{
      if(n==null||(typeof n==='string'&&n.trim()===''))return null;
      const v=Number(n);
      return Number.isFinite(v)&&v>=min&&v<=max?v:null;
    };
    const tsRaw=Number(x.ts),tsDate=new Date(tsRaw);
    const ts=Number.isFinite(tsRaw)&&Number.isFinite(tsDate.getTime())&&tsRaw>=0&&tsRaw<=Date.now()+86400000?tsRaw:Date.now();
    return {
      ts,
      method,
      preset:typeof x.preset==='string'&&presets[x.preset]?x.preset:'custom',
      flour:numOrNull(x.flour,0,20000),
      hydration:numOrNull(x.hydration,30,100),
      yeastType:yeastTypes[x.yeastType]?x.yeastType:'idy',
      yeastPct:numOrNull(x.yeastPct,0,5),
      room:numOrNull(x.room,0,45),
      fridgePlanned:numOrNull(x.fridgePlanned??x.fridge,0,15),
      bulk:numOrNull(x.bulk,0,240),
      cold:numOrNull(x.cold,0,240),
      ball:numOrNull(x.ball,0,240),
      waterTemp:numOrNull(x.waterTemp,0,50),
      finalDoughTemp:numOrNull(x.finalDoughTemp,10,40),
      fridgeTempActual:numOrNull(x.fridgeTempActual,0,15),
      ddtCorrection:numOrNull(x.ddtCorrection,-12,30),
      rating:['good','slow','fast'].includes(x.rating)?x.rating:'good',
      notes:typeof x.notes==='string'?x.notes.slice(0,500):''
    };
  }).filter(Boolean);
}

let _restoredWizardPage=0;
function loadState(){
  try{
    let raw=SAFE.get(SAVE_KEY);
    if(!raw){ for(const k of LEGACY_KEYS){ raw=SAFE.get(k); if(raw) break; } }
    const d=JSON.parse(raw||'null');
    if(!d||typeof d!=='object'||Array.isArray(d))return false;
    // v1.0.0 had no Basic/Full display mode. Existing users retain the full
    // controls they were accustomed to; only genuinely new users start Basic.
    experienceMode=Object.prototype.hasOwnProperty.call(d,'experienceMode')
      ? (d.experienceMode==='full'?'full':'basic')
      : 'full';
    suppressCustom=true;
    Object.entries(d).forEach(([k,v])=>{
      if(k==='version')return;
      else if(k==='currentMethod')currentMethod=['hand','kitchenaid','kenwood','pro'].includes(v)?v:'kitchenaid';
      else if(k==='currentLang')currentLang=v==='en'?'en':'nl';
      else if(k==='appMode')appMode=['dough','sauce','full'].includes(v)?v:'full';
      else if(k==='experienceMode')experienceMode=v==='full'?'full':'basic';
      else if(k==='exactOverride')exactOverride=sanitizeExactOverride(v);
      else if(k==='previousYeastType')previousYeastType=yeastTypes[v]?v:'idy';
      else if(k==='currentWizardPage')_restoredWizardPage=Number.isFinite(Number(v))?Math.max(0,Math.round(Number(v))):0;
      else if(k==='completedSteps')completedSteps=(v&&typeof v==='object'&&!Array.isArray(v))?v:{};
      else if(k==='bakeLog')bakeLog=sanitizeBakeLog(v);
      else if(k==='liveMeasurements')liveMeasurements=(v&&typeof v==='object')?{doughTemp:validMeasured(v.doughTemp,10,40),fridgeTemp:validMeasured(v.fridgeTemp,0,15)}:{doughTemp:null,fridgeTemp:null};
      else if(k==='pizzaSelections')pizzaSelections=Array.isArray(v)?v.filter(x=>typeof x==='string').map(x=>recipeById(x).id):[];
      else if(k==='pizzaCustomizations')pizzaCustomizations=Array.isArray(v)?v:[];
      else if(k==='recipeAllSelection')recipeAllSelection=recipeById(v).id;
      else if(['practical','autolyse','sizeFromDiameter','includeSauce','autoSauceFromPizzas'].includes(k)){ if($(k))$(k).checked=!!v; }
      else if($(k))$(k).value=v;
    });

    // Migratie van vóór v39: koude fermentatie stond als eigen methode opgeslagen.
    if($('fermentationMethod').value==='coldBalls'){
      $('fermentationMethod').value='hybrid';
      $('coldStorageMode').value='balls';
    }
    if(!$('coldStorageMode').value)$('coldStorageMode').value='bulk';

    // Onbekende keuzelijstwaarden terugzetten op een geldige optie.
    if(!sauces[$('sauceType').value])$('sauceType').value='sanMarzano';
    if(!flourTypes[$('flourType').value])$('flourType').value='caputoPizzeria';
    if(!doughStyles[$('doughStyle').value])$('doughStyle').value='neapolitan';
    if(!yeastTypes[$('yeastType').value])$('yeastType').value='idy';

    // v44 schreef voor generieke bloem automatisch een geschatte W in het veld.
    // In v45 zijn die schattingen bewust verwijderd. Als een oude v44-state
    // exact zo'n automatische waarde bevat, maken we het veld weer leeg.
    const oldAutoW={tipo00:260,manitoba:350,tarwebloem:180,speltWit:130,speltVolkoren:110,volkorenTarwe:190};
    if(Number(d.version)<=44){
      const fk=$('flourType').value;
      const oldW=oldAutoW[fk];
      if(oldW!=null && Number($('flourW').value)===oldW) $('flourW').value='';
    }

    // Opgeslagen waarden mogen uit een oudere, ruimere of handmatig bewerkte
    // state komen. Eénmalig normaliseren is veilig; tijdens typen gebeurt dit
    // juist nooit.
    normalizeStoredNumberInputs();

    pizzaCustomizations.forEach(cu=>{
      if(cu&&typeof cu==='object'&&cu.sauceOverride&&!sauces[cu.sauceOverride])cu.sauceOverride=null;
    });

    suppressCustom=false;
    document.querySelectorAll('.method').forEach(b=>b.classList.toggle('active',b.dataset.method===currentMethod));
    // Oude versiesleutels opruimen zodat ze niet jaren later terugkomen.
    LEGACY_KEYS.forEach(k=>SAFE.del(k));
    saveState();
    return true;
  }catch(e){return false}
}

function wireEvents(){
  document.querySelectorAll('input,select').forEach(el=>{
    el.addEventListener('focus',()=>rememberNumericEditStart(el));
    el.addEventListener('input',()=>{
      if(el.id==='pizzaPickerSearch') return;   // zoekveld hoort niet bij het deegformulier
      if(el.classList.contains('pct')) markCustomField(el.id);
      else if(PRESET_TECHNICAL_FIELDS.has(el.id)) markCustom(false);
      _deferDependentStatePrune=el.id==='pizzas';
      try{update();}finally{_deferDependentStatePrune=false;}
    });
    el.addEventListener('change',()=>{
      // Een getal wordt pas zichtbaar begrensd wanneer de gebruiker klaar is
      // met typen. De input-handler en calc() schrijven nooit terug.
      normalizeNumericInput(el);
      if(el.id==='preset'){ if(el.value!=='custom')applyPreset(el.value); return; }
      if(el.id==='sauceType'){
        // Bianca is 5 g/pizza en BBQ 55 g: zonder dit bleef 80 g tomatensaus staan.
        const st=sauces[el.value];
        if(st) $('saucePerPizza').value=defaultSaucePerPizza(el.value);
        update(); return;
      }
      if(el.id==='yeastType'){
        applyYeastTypeConversion(previousYeastType,el.value);
        markCustom(false);
      }else if(el.id==='doughStyle'){
        // De actieve bron (diameter óf bolgewicht) blijft exact zoals de
        // gebruiker hem invoerde. calc() werkt alleen het verborgen tegenveld bij.
        markCustom(false);
      }else if(el.id==='diameter'){
        if(!$('sizeFromDiameter').checked)$('ballWeight').value=recommendedBallWeight();
      }else if(el.id==='ballWeight'){
        if($('sizeFromDiameter').checked)$('diameter').value=roundTo(estimatedDiameterFromWeight(),0.5);
        markCustom(false);
      }else if(el.id==='fermentationMethod'){
        markCustom(false);
      }else if(el.id==='pizzaPickerSearch'){
        return;
      }else if(el.id==='flourType'){
        const ft=flourTypes[el.value];
        $('flourW').value=(ft && ft.w!=null)?ft.w:'';
        markCustom(false);
      }else if(el.id==='flourW'){
        // W handmatig aanpassen is toegestaan bij ieder gekozen bloemtype:
        // het type blijft staan zodat we kwalitatieve spelt/volkorenwaarschuwingen behouden.
        markCustom(false);
      }else if(el.classList.contains('pct')){
        markCustomField(el.id);
      }
      update();
    });
    el.addEventListener('blur',()=>{
      if(el.type!=='number')return;
      const normalized=normalizeNumericInput(el);
      try{
        if(el.id==='pizzas'){
          // blur is het echte commitmoment: een browser vuurt geen change af
          // wanneer 4 → 8 → 4 uiteindelijk weer op de focus-startwaarde eindigt.
          _deferDependentStatePrune=false;
          ensurePizzaSelections();
          update();
          pruneCompletedStepState();
        }else if(normalized){
          update();
        }
      }finally{
        _numericEditStartValues.delete(el);
      }
    });
  });
  $('includeSauce').addEventListener('change',update);
  $('autoSauceFromPizzas').addEventListener('change',update);
  $('sizeFromDiameter').addEventListener('change',()=>{
    if($('sizeFromDiameter').checked){
      // AAN = diameter is leidend; behoud equivalente pizzagrootte.
      $('diameter').value=roundTo(estimatedDiameterFromWeight(num('ballWeight')),0.5);
      $('ballWeight').value=recommendedBallWeight(num('diameter'));
    }else{
      // UIT = bolgewicht is leidend; neem het huidige berekende gewicht over.
      $('ballWeight').value=recommendedBallWeight(num('diameter'));
      $('diameter').value=roundTo(estimatedDiameterFromWeight(num('ballWeight')),0.5);
    }
    markCustom(false);
    update();
  });
  $('autolyse').addEventListener('change',()=>{markCustom(false);update();});
  $('practical').addEventListener('change',()=>{markCustom(false);update();});
}

document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('[data-experience]').forEach(button=>button.addEventListener('click',()=>setExperienceMode(button.dataset.experience)));
  const search=$('pizzaPickerSearch');
  if(search){
    // Zonder debounce werd de hele lijst van 89 recepten per toetsaanslag opnieuw
    // opgebouwd, inclusief het opnieuw afleiden van alle zoekteksten.
    let searchTimer=null;
    const debouncedRender=()=>{ if(searchTimer)clearTimeout(searchTimer); searchTimer=setTimeout(()=>{searchTimer=null;renderPickerList();},140); };
    search.addEventListener('input',debouncedRender);
    search.addEventListener('search',renderPickerList);
  }
  initRecipeOptions();
  wireEvents();

  const wizardNav=$('stepsNav');
  if(wizardNav){
    wizardNav.addEventListener('scroll',()=>refreshWizardNav(false),{passive:true});
  }
  window.addEventListener('resize',()=>refreshWizardNav(true),{passive:true});

  let restored=false;
  if(!loadState()){
    $('sizeFromDiameter').checked=true;    // standaard AAN: diameter invoeren -> bolgewicht berekenen
    $('practical').checked=true;           // standaard: praktisch afronden
    $('autolyse').checked=true;            // standaard: traditionele autolyse
    applyPreset('kodaNight');
  }else{ update(); restored=true; }
  applyAppModeUI();
  // Herladen tijdens het bakken bracht je altijd terug naar het keuzescherm.
  if(restored && _restoredWizardPage>0 && wizardPages().includes(_restoredWizardPage)) showPage(_restoredWizardPage);
  else showModeChooser();
  initI18n();
});
