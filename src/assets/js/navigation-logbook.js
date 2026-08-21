function setMethod(m){
  currentMethod=m;
  document.querySelectorAll('.method').forEach(b=>b.classList.toggle('active',b.dataset.method===m));
  update();
}

function scrollWizardNav(direction){
  const nav=$('stepsNav');
  if(!nav)return;
  const distance=Math.max(180,nav.clientWidth*0.68);
  nav.scrollBy({left:direction*distance,behavior:'smooth'});
}

function refreshWizardNav(centerActive=false){
  const nav=$('stepsNav'),shell=$('wizardNavShell');
  if(!nav||!shell||shell.classList.contains('hidden'))return;

  const updateEdges=()=>{
    const max=Math.max(0,nav.scrollWidth-nav.clientWidth);
    const left=nav.scrollLeft>3;
    const right=nav.scrollLeft<max-3;
    shell.classList.toggle('can-scroll-left',left);
    shell.classList.toggle('can-scroll-right',right);
    $('navScrollPrev')?.classList.toggle('is-disabled',!left);
    $('navScrollNext')?.classList.toggle('is-disabled',!right);
  };

  requestAnimationFrame(()=>{
    if(centerActive){
      const active=nav.querySelector('.navpill.active:not(.hidden)');
      if(active){
        const target=active.offsetLeft-(nav.clientWidth-active.offsetWidth)/2;
        const max=Math.max(0,nav.scrollWidth-nav.clientWidth);
        nav.scrollTo({left:Math.max(0,Math.min(max,target)),behavior:'smooth'});
      }
    }
    updateEdges();
    window.setTimeout(updateEdges,220);
  });
}

function wizardPages(){
  if(appMode==='dough')return [1,4];
  if(appMode==='sauce')return [1,2,4];
  return [1,3,2,4];
}

function wizardPageName(page){
  const nl=currentLang!=='en';
  const names=nl
    ? {1:'Deeg',2:'Sauzen',3:'Bollen & recepten',4:'Stappenplan'}
    : {1:'Dough',2:'Sauces',3:'Dough balls & recipes',4:'Workflow'};
  return names[page]||'';
}

function updateWizardNav(activePage=currentWizardPage){
  const pages=wizardPages();
  const nav=$('stepsNav');

  [1,2,3,4].forEach(page=>{
    const btn=$(`nav${page}`);
    if(!btn)return;
    const idx=pages.indexOf(page);
    btn.classList.toggle('hidden',idx<0);
    btn.classList.toggle('active',page===activePage);
    if(idx>=0)btn.textContent=`${idx+1}. ${wizardPageName(page)}`;
  });

  // Zet de zichtbare knoppen ook fysiek in workflowvolgorde.
  // '← Keuze' blijft altijd als eerste staan.
  if(nav){
    pages.forEach(page=>{
      const btn=$(`nav${page}`);
      if(btn)nav.appendChild(btn);
    });
  }

  const finalIndex=pages.indexOf(4);
  const page2Index=pages.indexOf(2);
  const page3Index=pages.indexOf(3);

  if($('page2Kicker') && page2Index>=0){
    $('page2Kicker').textContent=currentLang==='en'
      ? `Step ${page2Index+1}`
      : `Stap ${page2Index+1}`;
  }
  if($('page3Kicker') && page3Index>=0){
    $('page3Kicker').textContent=currentLang==='en'
      ? `Step ${page3Index+1}`
      : `Stap ${page3Index+1}`;
  }
  if($('finalStepKicker')){
    $('finalStepKicker').textContent=currentLang==='en'
      ? `Step ${finalIndex+1} • final`
      : `Stap ${finalIndex+1} • laatste`;
  }

  const next=pages[pages.indexOf(activePage)+1];
  if($('floatNext')){
    $('floatNext').classList.toggle('hidden',!next);
    if(next)$('floatNext').textContent=currentLang==='en'
      ? `Next: ${wizardPageName(next)} →`
      : `Volgende: ${wizardPageName(next).toLowerCase()} →`;
  }
  if($('page1NextBtn')){
    const firstNext=pages[1];
    $('page1NextBtn').textContent=currentLang==='en'
      ? `Next: ${wizardPageName(firstNext)} →`
      : `Volgende: ${wizardPageName(firstNext).toLowerCase()} →`;
  }
  refreshWizardNav(true);
}

function nextWizardPage(page=currentWizardPage){
  const pages=wizardPages(),idx=pages.indexOf(page);
  if(idx>=0&&idx<pages.length-1)showPage(pages[idx+1]);
}

function previousWizardPage(page=currentWizardPage){
  const pages=wizardPages(),idx=pages.indexOf(page);
  if(idx>0)showPage(pages[idx-1]);
  else showModeChooser();
}

function renderModeChooser(){
  document.querySelectorAll('[data-mode-card]').forEach(card=>card.classList.remove('last-used'));
  const count=$('fullRecipeCount');if(count)count.textContent=pizzaRecipes.length;
}

function applyAppModeUI(){
  document.body.dataset.appMode=appMode;

  $('pizzaSauceHeading').textContent=currentLang==='en'?'Sauce(s)':'Saus(en)';
  $('pizzaSauceHint').innerHTML=appMode==='sauce'
    ? (currentLang==='en'
        ? 'Choose a sauce type and amount per pizza. No recipes or toppings are needed.'
        : 'Kies een saustype en hoeveelheid per pizza. Geen recepten of toppings nodig.')
    : (currentLang==='en'
        ? 'Your dough-ball recipes are already selected. Keep automatic sauce enabled to calculate the required sauces from those recipes, or disable it to use one sauce for all pizzas.'
        : 'Je recepten per bol zijn al gekozen. Laat automatische saus aan om de benodigde sauzen daaruit te berekenen, of zet hem uit om één saus voor alle pizza’s te gebruiken.');

  $('shoppingHeading').textContent=appMode==='sauce'
    ? (currentLang==='en'?'Ingredients for the sauce':'Ingrediënten voor de saus')
    : (currentLang==='en'?'Ingredients for the pizzas':"Ingrediënten voor de pizza's");

  $('brandSubtitle').textContent=appMode==='dough'
    ? (currentLang==='en'?'Dough • fermentation • workflow':'Deeg • fermentatie • stappenplan')
    : appMode==='sauce'
      ? (currentLang==='en'?'Dough • sauce • workflow':'Deeg • saus • stappenplan')
      : (currentLang==='en'?'Dough • sauces • dough-ball recipes • complete workflow':'Deeg • sauzen • recepten per bol • compleet stappenplan');

  if(appMode==='sauce'){
    $('manualSauceControls').classList.remove('hidden');
  }else if(appMode==='full'){
    $('manualSauceControls').classList.toggle('hidden',$('autoSauceFromPizzas').checked);
  }

  if($('sauceStepNote')){
    $('sauceStepNote').textContent=appMode==='full'
      ? (currentLang==='en'
          ? 'The sauce calculation below is based on the recipes you selected in the previous step. Change a dough-ball recipe later and these quantities update automatically.'
          : 'De sausberekening hieronder is gebaseerd op de recepten die je in de vorige stap hebt gekozen. Verander je later een recept per bol, dan worden deze hoeveelheden automatisch bijgewerkt.')
      : '';
    $('sauceStepNote').classList.toggle('hidden',appMode!=='full');
  }

  updateWizardNav(currentWizardPage);
  renderModeChooser();
}

function selectAppMode(mode){
  appMode=['dough','sauce','full'].includes(mode)?mode:'full';
  applyAppModeUI();
  showPage(1);
}

function showModeChooser(){
  currentWizardPage=0;
  ['page1','page2','page3','page4'].forEach(id=>$(id)?.classList.remove('active'));
  $('page0').classList.add('active');
  $('stepsNav').classList.add('hidden');
  $('wizardNavShell').classList.add('hidden');
  $('floatingActions').classList.add('hidden');
  renderModeChooser();
  $('brandSubtitle').textContent=currentLang==='en'
    ? 'From dough only to complete pizzas • choose what you need'
    : "Van alleen deeg tot complete pizza's • kies wat je nodig hebt";
  window.scrollTo({top:0,behavior:'smooth'});
}

function showPage(n){
  const available=wizardPages();
  if(!available.includes(n))n=available[0];

  currentWizardPage=n;
  $('page0').classList.remove('active');
  [1,2,3,4].forEach(page=>$(`page${page}`)?.classList.toggle('active',page===n));

  $('stepsNav').classList.remove('hidden');
  $('wizardNavShell').classList.remove('hidden');
  $('floatingActions').classList.remove('hidden');
  applyAppModeUI();
  updateWizardNav(n);
  window.scrollTo({top:0,behavior:'smooth'});
  update();
}

function copyRecipe(){
  const c=calc();
  const live=liveFermentationPlan(c),effective=live.effective;
  const sauceInfo=aggregateSauceNeeds(c);
  const lines=[];
  lines.push(L(`Pizzadeeg — ${c.pizzas} pizza's van ±${fmt(c.actualBall,0)} g`,`Pizza dough — ${c.pizzas} pizzas of ±${fmt(c.actualBall,0)} g`));
  lines.push(`${fmt(c.flour,0)} g ${L('bloem','flour')}`);
  lines.push(`${fmt(c.water,0)} g ${L('water','water')}`);
  lines.push(`${fmt(c.salt,0)} g ${L('zout','salt')}`);
  lines.push(`${fmt(c.yeast,1)} g ${yeastName(c.yeastType)}`);
  if(c.o>0)lines.push(`${fmt(c.oil,0)} g ${L('olijfolie','olive oil')}`);
  lines.push('');
  lines.push(L(`Hydratatie werkelijk: ${fmt(c.actualH,1)}%`,`Actual hydration: ${fmt(c.actualH,1)}%`));
  lines.push(live.active&&live.changed
    ? L(`Fermentatie live aangepast: ${fmt(fermentationHours(effective),1)} uur (oorspronkelijk ${fmt(fermentationHours(c),1)} uur)`,
        `Fermentation adjusted live: ${fmt(fermentationHours(effective),1)} hours (originally ${fmt(fermentationHours(c),1)} hours)`)
    : L(`Fermentatie: ${fmt(fermentationHours(c),1)} uur`,`Fermentation: ${fmt(fermentationHours(c),1)} hours`));
  lines.push(L(`Steentemperatuur: ${fmt(c.stoneTemp,0)} °C`,`Stone temperature: ${fmt(c.stoneTemp,0)} °C`));

  if(appMode==='sauce' && sauceInfo.enabled && sauceInfo.groups.length){
    const g=sauceInfo.groups[0];
    lines.push('');
    lines.push(`${L('Saus','Sauce')}: ${sauceName(g.type)}`);
    lines.push(L(`${fmt(g.per??manualSaucePerPizza(),0)} g per pizza • ${fmt(g.need,0)} g totaal`,
                 `${fmt(g.per??manualSaucePerPizza(),0)} g per pizza • ${fmt(g.need,0)} g total`));
  }else if(appMode==='full'){
    ensurePizzaSelections();
    lines.push('');
    pizzaSelections.forEach((id,i)=>lines.push(`${L('Bol','Dough ball')} ${i+1}: ${recipeNameText(recipeById(id))}`));
  }
  navigator.clipboard?.writeText(lines.join('\n')).then(()=>alert(currentLang==='en'?'Recipe copied.':'Recept gekopieerd.'));
}


function ratingLabel(v){
  if(currentLang==='en')return v==='slow'?'too slow / underproofed':(v==='fast'?'too fast / overproofed':'good / as intended');
  return v==='slow'?'te traag / onderrijs':(v==='fast'?'te snel / overrijs':'goed / zoals bedoeld');
}
function saveBakeLogEntry(){
  const c=calc();
  const waterRaw=String($('logWaterTemp').value).trim();
  const water=waterRaw===''?NaN:boundedNum('logWaterTemp',NaN);
  const finalT=liveMeasurementValue('doughTemp');
  const actualFridge=liveMeasurementValue('fridgeTemp');
  const rating=$('logRiseRating').value||'good';
  const notes=String($('logNotes').value||'').trim().slice(0,500);
  let ddtCorrection=null;
  if(Number.isFinite(water)&&Number.isFinite(finalT)){
    // Effectieve correctie voor DEZE routine. Omdat bloemtemp voorlopig op
    // kamertemp wordt aangenomen, kan de waarde naast mixerwarmte ook vaste
    // koeling (bijv. koelkast-autolyse) bevatten. Dat is bewust: reproduceerbaarheid.
    const corr=3*finalT-c.room-c.room-water;
    if(corr>=-12&&corr<=30)ddtCorrection=corr;
  }
  bakeLog.push({
    ts:Date.now(),method:currentMethod,preset:$('preset').value,
    flour:c.flour,hydration:c.h,yeastType:c.yeastType,yeastPct:c.y,
    room:c.room,fridgePlanned:c.fridge,fridgeTempActual:actualFridge,bulk:c.bulk,cold:c.cold,ball:c.ball,
    waterTemp:Number.isFinite(water)?water:null,finalDoughTemp:Number.isFinite(finalT)?finalT:null,
    ddtCorrection,rating,notes
  });
  if(bakeLog.length>30)bakeLog=bakeLog.slice(-30);
  saveState();
  renderBakeLog(c);
  $('logNotes').value='';
}
function clearBakeLog(){
  if(!window.confirm(currentLang==='en'?'Clear the complete dough log?':'Hele deeglogboek wissen?'))return;
  bakeLog=[];
  saveState();
  renderBakeLog(calc());
}
function renderBakeLog(c){
  const box=$('bakeLogSummary');
  if(!box)return;
  if($('logFinalDoughTemp')) $('logFinalDoughTemp').value=liveMeasurementValue('doughTemp')==null?'':`${fmt(liveMeasurementValue('doughTemp'),1)} °C`;
  if($('logFridgeTemp')) $('logFridgeTemp').value=liveMeasurementValue('fridgeTemp')==null?'':`${fmt(liveMeasurementValue('fridgeTemp'),1)} °C`;
  const stats=ddtLogStats(currentMethod);
  const rows=bakeLog.slice(-4).reverse();
  const calText=stats.count
    ? L(`<div class="info"><b>DDT-log:</b> ${stats.count} bruikbare ${stats.count===1?'meting':'metingen'} voor ${methodLabel()} opgeslagen${stats.median==null?'':` • mediaan effectieve correctie ${fmt(stats.median,1)} °C`}. Deze waarde wordt <b>niet automatisch toegepast</b>; het wateradvies blijft op de vaste startaanname zodat recept- en proceswijzigingen niet onbedoeld als “leren” worden geïnterpreteerd.</div>`,
        `<div class="info"><b>DDT log:</b> ${stats.count} usable ${stats.count===1?'measurement':'measurements'} stored for ${methodLabel()}${stats.median==null?'':` • median effective correction ${fmt(stats.median,1)} °C`}. This value is <b>not applied automatically</b>; water guidance stays on the fixed starting assumption so recipe and process changes are not accidentally interpreted as “learning”.</div>`)
    : L(`<div class="info">Nog geen bruikbare DDT-metingen in het logboek. v${APP_VERSION} gebruikt bewust alleen de vaste startaanname en leert niets automatisch uit vorige bakes.</div>`,
        `<div class="info">No usable DDT measurements in the log yet. v${APP_VERSION} deliberately uses only the fixed starting assumption and learns nothing automatically from previous bakes.</div>`);
  const modelText=L(
    `<div class="info"><b>Fermentatiemodel:</b> beoordelingen zoals “te traag” of “te snel” worden alleen als logboekcontext opgeslagen. v${APP_VERSION} verandert gist, tijdcurves of DDT bewust niet automatisch op basis van vorige bakes.</div>`,
    `<div class="info"><b>Fermentation model:</b> ratings such as “too slow” or “too fast” are stored only as log context. v${APP_VERSION} deliberately does not automatically change yeast, timing curves or DDT based on previous bakes.</div>`);
  const list=rows.length?`<div class="list">${rows.map(x=>{
    const dt=new Date(x.ts);
    const d=dt.toLocaleDateString(currentLang==='en'?'en-GB':'nl-NL',{day:'2-digit',month:'short'});
    const temp=(x.waterTemp!=null&&x.finalDoughTemp!=null)?` • ${fmt(x.waterTemp,1)}→${fmt(x.finalDoughTemp,1)} °C`:'';
    const fridge=x.fridgeTempActual!=null?` • koelkast ${fmt(x.fridgeTempActual,1)} °C`:'';
    const corr=x.ddtCorrection!=null?` • DDT ${fmt(x.ddtCorrection,1)} °C`:'';
    return `<div class="list-row"><span>${d} • ${ratingLabel(x.rating)}${temp}${fridge}${corr}</span><span>${x.notes?esc(x.notes):'—'}</span></div>`;
  }).join('')}</div>`:L('<div class="hint" style="margin-top:10px">Nog geen bakresultaten opgeslagen.</div>','<div class="hint" style="margin-top:10px">No bake results saved yet.</div>');
  box.innerHTML=calText+modelText+list;
}

