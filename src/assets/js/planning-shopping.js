function niceDate(d){
  // Maandnaam in plaats van cijfers: 20/08 is voor een Engelstalige lezer
  // dubbelzinnig, zeker naast getallen die in en-US worden opgemaakt.
  return new Intl.DateTimeFormat(currentLang==='en'?'en-GB':'nl-NL',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(d);
}

// Op de nacht van de zomertijd bestaat 02:30 niet; setHours schuift dan
// stilzwijgend een uur op. Dat signaleren we in plaats van te verbergen.
let _bakeTimeShifted=false;
function selectedBakeDate(){
  const dayRaw=$('bakeDay')?.value||'';
  const timeRaw=$('bakeTime')?.value||'';
  if(!dayRaw||!timeRaw)return null;

  const offset=Number(dayRaw);
  if(!Number.isFinite(offset)||offset<0||offset>3)return null;

  _bakeTimeShifted=false;
  const parts=timeRaw.split(':').map(Number);
  if(parts.length<2||!Number.isFinite(parts[0])||!Number.isFinite(parts[1]))return null;

  const now=new Date();
  const bake=new Date(now);
  bake.setDate(now.getDate()+offset);
  bake.setHours(parts[0],parts[1],0,0);
  if(bake.getHours()!==parts[0]) _bakeTimeShifted=true;
  return bake;
}

function hasValidBakeDeadline(){
  const bake=selectedBakeDate();
  return bake instanceof Date && Number.isFinite(bake.getTime());
}


function floorQuarter(h){
  return Math.max(0,Math.floor(Number(h)*4+1e-9)/4);
}
function durationLabel(hours){
  const totalMin=Math.max(0,Math.round(Number(hours)*60));
  const h=Math.floor(totalMin/60),m=totalMin%60;
  if(currentLang==='en'){
    if(h&&m)return `${h} h ${m} min`;
    if(h)return `${h} h`;
    return `${m} min`;
  }
  if(h&&m)return `${h} u ${m} min`;
  if(h)return `${h} u`;
  return `${m} min`;
}
function deadlineScheduleStart(c,bake){
  return new Date(bake.getTime()-(fermentationHours(c)+prepHours())*3600000);
}
function deadlineRecommendation(c,bake){
  const now=new Date();
  const until=(bake.getTime()-now.getTime())/3600000;
  const currentStart=deadlineScheduleStart(c,bake);

  if(until<=0)return {status:'past',until,currentStart};

  // Een schema dat past, past — ook binnen vier uur. Vroeger stuurde de
  // 4-uursvloer je naar de supermarkt terwijl je eigen korte schema haalbaar was.
  if(currentStart.getTime()>=now.getTime())return {status:'fits',until,currentStart};

  // Praktische kwaliteitsvloer van deze calculator.
  // Onder 4 uur vanaf nu adviseren we geen vers pizzadeeg.
  // Dit is geen biologische absolute grens: gist kan sneller gas maken,
  // maar gasproductie is niet hetzelfde als een goed gerijpt pizzadeeg.
  if(until<4)return {status:'tooShort',until,currentStart,usable:Math.max(0,until-0.75)};

  // Voorbereiding volgens kneedmethode + 15 min praktische startbuffer.
  const usable=floorQuarter(until-(prepHours()+0.25));

  let plan;
  if(until<6){
    plan={ferm:'room',bulk:1,ball:Math.max(2,usable-1),cold:0,room:27,
      labelNl:'nood-same-day rijs',labelEn:'emergency same-day proof'};
  }else if(until<8){
    plan={ferm:'room',bulk:1.5,ball:Math.max(3.5,usable-1.5),cold:0,room:25,
      labelNl:'korte same-day rijs',labelEn:'short same-day proof'};
  }else if(until<12){
    plan={ferm:'room',bulk:2,ball:Math.max(5,usable-2),cold:0,room:23,
      labelNl:'same-day rijs',labelEn:'same-day proof'};
  }else if(until<18){
    plan={ferm:'room',bulk:3,ball:Math.max(7,usable-3),cold:0,room:21,
      labelNl:'lange kamertemperatuurrijs',labelEn:'long room-temperature proof'};
  }else{
    plan={ferm:'hybrid',bulk:1,cold:Math.max(0,usable-5),ball:4,room:21,
      labelNl:'koude fermentatie',labelEn:'cold fermentation'};
  }

  plan.bulk=floorQuarter(plan.bulk);
  plan.cold=floorQuarter(plan.cold);
  plan.ball=floorQuarter(plan.ball);

  const planC={...c,ferm:plan.ferm,bulk:plan.bulk,cold:plan.cold,ball:plan.ball,room:plan.room};
  const advice=yeastRecommendation(planC);
  const yeastGrams=(c.flour||600)*advice.selected/100;
  const planStart=deadlineScheduleStart(planC,bake);

  let level='good';
  if(until<6)level='hot';
  else if(until<8)level='warn';

  return {status:'adjust',until,currentStart,usable,plan,planC,advice,yeastGrams,planStart,level};
}

function buildDeadlineAdvice(c){
  const box=$('deadlineAdvice');
  const bake=selectedBakeDate();
  if(!box)return;

  if(!bake){
    box.className='deadline-advice hidden';
    box.innerHTML='';
    return;
  }

  const r=deadlineRecommendation(c,bake);
  box.classList.remove('hidden','good','warn','hot');
  const nl=currentLang!=='en';
  const target=niceDate(bake);

  if(r.status==='past'){
    box.classList.add('hot');
    box.innerHTML=`
      <div class="deadline-title"><b>${nl?'⛔ Gekozen baktijd is al voorbij':'⛔ Selected bake time has already passed'}</b></div>
      <div class="deadline-plan">${nl?'Kies vandaag een later tijdstip, of kies morgen.':'Choose a later time today, or select tomorrow.'}</div>`;
    return;
  }

  if(r.status==='fits'){
    box.classList.add('good');
    box.innerHTML=`
      <div class="deadline-title"><b>${nl?'✅ Huidige planning past':'✅ Current schedule fits'}</b><span class="tag">${target}</span></div>
      <div class="deadline-metrics">
        <div class="deadline-mini"><span>${nl?'Beschikbaar':'Available'}</span><b>${durationLabel(r.until)}</b></div>
        <div class="deadline-mini"><span>${nl?'Schema vraagt':'Schedule needs'}</span><b>${durationLabel(fermentationHours(c)+0.5)}</b></div>
        <div class="deadline-mini"><span>${nl?'Uiterlijk starten':'Latest start'}</span><b>${niceDate(r.currentStart)}</b></div>
      </div>
      <div class="deadline-plan">${nl?'Je huidige fermentatiemethode, tijden en gistadvies kunnen zo blijven.':'Your current fermentation method, timings and yeast guidance can remain unchanged.'}</div>`;
    return;
  }

  if(r.status==='tooShort'){
    box.classList.add('hot');
    box.innerHTML=`
      <div class="deadline-title"><b>${nl?'⚠️ Zeer weinig tijd':'⚠️ Very little time'}</b><span class="tag">${target}</span></div>
      <div class="deadline-metrics">
        <div class="deadline-mini"><span>${nl?'Beschikbaar':'Available'}</span><b>${durationLabel(r.until)}</b></div>
        <div class="deadline-mini"><span>${nl?'Na mengen nog over':'After mixing'}</span><b>${durationLabel(Math.max(0,r.usable))}</b></div>
        <div class="deadline-mini"><span>${nl?'Huidig schema':'Current schedule'}</span><b>${durationLabel(fermentationHours(c)+0.5)}</b></div>
      </div>
      <div class="deadline-plan">${nl
        ? '<b>Plan B:</b> dit is korter dan de 4-uurs kwaliteitsvloer van deze calculator. Gist kan biologisch sneller gas maken, maar voor pizzadeeg willen we niet doen alsof “meer gist” hetzelfde is als rijping. 🏃 Tijd om naar de supermarkt te lopen voor vers pizzadeeg of een goede bodem — óf de baktijd later te zetten.'
        : '<b>Plan B:</b> this is shorter than this calculator’s 4-hour quality floor. Yeast can biologically produce gas faster, but for pizza dough we do not pretend that “more yeast” is the same as maturation. 🏃 Time for supermarket fresh dough or a good ready-made base — or move the bake time later.'}</div>`;
    return;
  }

  const p=r.plan;
  box.classList.add(r.level||'warn');
  const methodLabel=nl?p.labelNl:p.labelEn;
  const phaseText=p.ferm==='room'
    ? `${nl?'bulk':'bulk'} ${fmt(p.bulk,2)} ${nl?'u':'h'} + ${nl?'bolrijs':'ball proof'} ${fmt(p.ball,2)} ${nl?'u':'h'} @ ${fmt(p.room,0)} °C`
    : `${nl?'bulk':'bulk'} ${fmt(p.bulk,2)} ${nl?'u':'h'} + ${nl?'koelkast':'refrigerator'} ${fmt(p.cold,2)} ${nl?'u':'h'} + ${nl?'bolrijs':'ball proof'} ${fmt(p.ball,2)} ${nl?'u':'h'}`;

  box.innerHTML=`
    <div class="deadline-title"><b>${nl?'🛠️ Huidig schema past niet, maar dit kan wel':'🛠️ Current schedule does not fit, but this can work'}</b><span class="tag">${target}</span></div>
    <div class="deadline-metrics">
      <div class="deadline-mini"><span>${nl?'Beschikbaar':'Available'}</span><b>${durationLabel(r.until)}</b></div>
      <div class="deadline-mini"><span>${nl?'Aanpak':'Approach'}</span><b>${methodLabel}</b></div>
      <div class="deadline-mini"><span>${nl?'Gistadvies':'Yeast guidance'}</span><b>± ${fmt(r.yeastGrams,2)} g ${yeastShort(c.yeastType)}</b></div>
    </div>
    <div class="deadline-plan">
      <b>${nl?'Voorgesteld schema':'Suggested schedule'}:</b> ${phaseText}.<br>
      ${nl?'Start rond':'Start around'} <b>${niceDate(r.planStart)}</b>.
      ${p.ferm==='room' && p.room>c.room ? `<br>${nl?'Gebruik voor de rijs een warme plek rond':'Use a warm proofing spot around'} <b>${fmt(p.room,0)} °C</b>.` : ''}
      ${r.until<8 ? `<br><b>${nl?'Let op':'Note'}:</b> ${nl
        ? 'dit is een korte same-day variant en dus een kwaliteitscompromis. Vanaf ongeveer 8 uur sluit de planning beter aan bij gangbare room-temperature pizzarijping; lange koude fermentatie ontwikkelt anders.'
        : 'this is a short same-day version and therefore a quality compromise. From roughly 8 hours onward, the schedule aligns better with common room-temperature pizza proofing; long cold fermentation develops differently.'}` : ''}
    </div>
    <div class="deadline-apply">
      <button class="btn secondary" type="button" onclick="applyDeadlinePlan()">${nl?'Planning toepassen':'Apply schedule'}</button>
    </div>`;
}

function applyDeadlinePlan(){
  const bake=selectedBakeDate();
  if(!bake)return;
  const c=calc();
  const r=deadlineRecommendation(c,bake);
  if(r.status!=='adjust'||!r.plan)return;

  const p=r.plan;
  suppressCustom=true;
  $('fermentationMethod').value=p.ferm==='room'?'room':'hybrid';
  $('coldStorageMode').value='bulk';
  $('bulkHours').value=p.bulk;
  $('coldHours').value=p.cold;
  $('ballHours').value=p.ball;
  $('roomTemp').value=p.room;
  suppressCustom=false;

  exactOverride=exactOverride||{h:selectedHydration(),s:selectedSalt(),o:selectedOil(),ySelected:selectedYeastPct()};
  exactOverride.ySelected=r.advice.selected;
  $('yeastPct').value=fieldNum(r.advice.selected,3);
  markCustom(false);
  update();
}

// Kritieke voorbereiding vóór de fermentatie: elapsed time, niet actieve arbeid.
function prepHours(){
  if($('autolyse')?.checked)return 0.9;
  return currentMethod==='hand' ? 0.75 : 0.6;
}

// Actieve voorbereiding is iets anders dan doorlooptijd: wegen, mengen/kneden,
// opbollen, saus en mise-en-place. Dit blijft bewust een praktische RANGE.
function activePrepMinutes(c){
  let low=currentMethod==='hand'?18:10;
  let high=currentMethod==='hand'?28:18;
  low+=Math.max(3,c.pizzas*0.7);
  high+=Math.max(5,c.pizzas*1.4);
  if(appMode!=='dough' && $('includeSauce').checked){
    const agg=aggregateSauceNeeds(c);
    const groups=agg.enabled?agg.groups:[];
    low+=groups.length*4;
    high+=groups.length*8+groups.filter(g=>g.s&&g.s.cooked).length*5;
  }
  if(appMode==='full'){
    low+=c.pizzas*2;
    high+=c.pizzas*4;
  }
  return {low:Math.round(low),high:Math.round(high)};
}

// Baksessie = echte tijd om alle pizza's achter elkaar te beleggen/lanceren,
// bakken en tussendoor de steen wat te laten herstellen. Geen enkel vast
// herstelgetal past iedere oven, daarom tonen we een bereik.
function bakeSessionRange(c){
  const b=stoneProfile(c.stoneTemp);
  const lowSec=c.pizzas*(b.secLow+60);
  const highSec=c.pizzas*(b.secHigh+90);
  return {
    low:Math.max(1,Math.round(lowSec/60)),
    high:Math.max(1,Math.round(highSec/60)),
    mid:Math.max(1,Math.round((lowSec+highSec)/120))
  };
}

function timelineTotalHours(c){
  // Voorbereiding + de ingestelde fermentatiefasen.
  // Voorverwarmen loopt normaal parallel met de laatste rijs en telt dus
  // niet nogmaals bovenop de kritieke doorlooptijd.
  return prepHours() + fermentationHours(c);
}

function buildTimeline(c){
  const live=liveFermentationPlan(c);
  const plannedC=c;
  c=live.effective;
  const bake=selectedBakeDate();
  const totalHours=timelineTotalHours(c);
  const totalLabel=durationLabel(totalHours);

  if(!bake){
    const ifStartNow=new Date(Date.now()+totalHours*3600000);
    let rows=[
      [L('Wegen, mengen, rust & kneden','Weighing, mixing, rest & kneading'),`±${Math.round(prepHours()*60)} min`],
      [L('Bulk buiten','Bulk at room temp'),`${fmt(c.bulk,2)} ${L('u','h')} @ ${fmt(c.room,1)} °C`]
    ];
    if(c.ferm!=='room'){
      rows.push([
        c.ferm==='coldBalls'?L('Koelkast als bollen','Fridge as balls'):L('Koelkast als één massa','Fridge as one mass'),
        `${fmt(c.cold,1)} ${L('u','h')} @ ${fmt(c.fridge,1)} °C`
      ]);
    }
    rows.push([
      c.ferm==='coldBalls'?L('Laatste opwarming','Final warm-up'):L('Bolrijs buiten','Ball proof at room temp'),
      `${fmt(c.ball,2)} ${L('u','h')} @ ${fmt(c.room,1)} °C`
    ]);
    rows.push([L('Voorverwarmen','Preheat'),L(`${fmt(c.preheat,0)} min • loopt normaal parallel met de laatste rijs`,`${fmt(c.preheat,0)} min • normally overlaps the final proof`)]);
    const bakeRange=bakeSessionRange(c),active=activePrepMinutes(c);
    rows.push([L('Baksessie','Baking session'),L(`± ${bakeRange.low}–${bakeRange.high} min voor ${c.pizzas} ${c.pizzas===1?'pizza':"pizza's"} • komt ná de deegdoorlooptijd`,`± ${bakeRange.low}–${bakeRange.high} min for ${c.pizzas} ${c.pizzas===1?'pizza':'pizzas'} • comes after the dough lead time`)]);

    const summary=`
      <div class="timeline-summary">
        <div class="timeline-summary-item primary">
          <span>${currentLang==='en'?'Total lead time':'Totale doorlooptijd'}</span>
          <b>± ${totalLabel}</b>
        </div>
        <div class="timeline-summary-item">
          <span>${currentLang==='en'?'If you start now':'Als je nu begint'}</span>
          <b>${niceDate(ifStartNow)}</b>
        </div>
        <div class="timeline-summary-item">
          <span>${currentLang==='en'?'Active preparation':'Actieve voorbereiding'}</span>
          <b>± ${active.low}–${active.high} min</b>
        </div>
        <div class="timeline-summary-item">
          <span>${currentLang==='en'?'Baking session':'Baksessie'}</span>
          <b>± ${bakeRange.low}–${bakeRange.high} min</b>
        </div>
      </div>
      <div class="timeline-explain">${currentLang==='en'
        ? `This is the elapsed time from starting the dough until it is ready to bake. The ${fmt(c.preheat,0)} minute preheat normally overlaps the final proof, so it is shown but not added twice.`
        : `Dit is de verstreken tijd van starten met het deeg tot klaar om te bakken. De ${fmt(c.preheat,0)} minuten voorverwarmen vallen normaal binnen de laatste rijs en worden daarom niet dubbel bij de totale tijd opgeteld.`}</div>`;

    const liveNote=live.active?`<div class="${livePlanClass(live,plannedC)==='hot'?'warning':'info'} timeline-deadline-warning">${L('Tijdlijn gebruikt de live gemeten temperatuurcorrectie. De gistdosering blijft die van het oorspronkelijke recept.','Timeline uses the live measured-temperature correction. The yeast dose remains the one from the original recipe.')}</div>`:'';
    $('timeline').innerHTML=liveNote+summary+rows.map(x=>`<div class="timeitem"><b>${x[0]}</b><span>${x[1]}</span></div>`).join('');
    return;
  }

  const preheat=new Date(bake.getTime()-c.preheat*60000);
  const prepMs=prepHours()*3600000;
  const bakeRange=bakeSessionRange(c);
  const active=activePrepMinutes(c);
  const bakeMin=bakeRange.mid;
  const bakeDoneLow=new Date(bake.getTime()+bakeRange.low*60000);
  const bakeDoneHigh=new Date(bake.getTime()+bakeRange.high*60000);
  let events=[],startTime;

  if(c.ferm==='hybrid'){
    const ballStart=new Date(bake.getTime()-c.ball*3600000);
    const fridgeIn=new Date(ballStart.getTime()-c.cold*3600000);
    startTime=new Date(fridgeIn.getTime()-c.bulk*3600000-prepMs);
    events=[
      [L('Begin met deeg','Start the dough'),startTime],
      [L('Koelkast in • één massa','Into the fridge • one mass'),fridgeIn],
      [L('Verdelen/opbollen','Divide/shape'),ballStart]
    ];
  }else if(c.ferm==='room'){
    const ballStart=new Date(bake.getTime()-c.ball*3600000);
    startTime=new Date(ballStart.getTime()-c.bulk*3600000-prepMs);
    events=[
      [L('Begin met deeg','Start the dough'),startTime],
      [L('Verdelen/opbollen','Divide/shape'),ballStart]
    ];
  }else{
    const fridgeOut=new Date(bake.getTime()-c.ball*3600000);
    const fridgeIn=new Date(fridgeOut.getTime()-c.cold*3600000);
    startTime=new Date(fridgeIn.getTime()-c.bulk*3600000-prepMs);
    events=[
      [L('Begin met deeg','Start the dough'),startTime],
      [L('Opbollen + koelkast','Shape + fridge'),fridgeIn],
      [L('Koelkast uit','Out of the fridge'),fridgeOut]
    ];
  }
  events.push([L('Start voorverwarmen','Start preheating'),preheat]);
  events.push([L('Eerste pizza in de oven','First pizza in the oven'),bake]);
  // Chronologisch sorteren: bij een lange voorverwarmtijd en een korte bolrijs
  // stond 'start voorverwarmen' anders ná een later moment in de lijst.
  events.sort((a,b)=>a[1]-b[1]);
  const rows=events.map(e=>[e[0],niceDate(e[1])]);
  if(c.pizzas>1) rows.push([
    L(`Laatste van ${c.pizzas} pizza's klaar • schatting`,`Last of ${c.pizzas} pizzas done • estimate`),
    `${niceDate(bakeDoneLow)} – ${niceDate(bakeDoneHigh)}`
  ]);

  const now=new Date();
  const dstWarning=_bakeTimeShifted
    ? `<div class="warning timeline-deadline-warning">${currentLang==='en'
        ? 'The chosen clock time does not exist on that night (daylight saving change); it has been moved forward by one hour.'
        : 'Het gekozen tijdstip bestaat die nacht niet (overgang naar zomertijd); het is een uur naar voren geschoven.'}</div>`
    : '';
  const warning=(bake>now && startTime<now)
    ? `<div class="warning timeline-deadline-warning">${currentLang==='en'
        ? 'This timeline would already have had to start. Use the planning advice in the dough step to generate a feasible alternative.'
        : 'Deze tijdlijn had al moeten beginnen. Gebruik bij de deegstap het planningsadvies om een haalbaar alternatief te maken.'}</div>`
    : (bake<=now
        ? `<div class="warning timeline-deadline-warning">${currentLang==='en'?'The selected bake time has already passed.':'De gekozen baktijd is al voorbij.'}</div>`
        : '');

  const summary=`
    <div class="timeline-summary">
      <div class="timeline-summary-item primary">
        <span>${currentLang==='en'?'Start the dough':'Begin met deeg'}</span>
        <b>${niceDate(startTime)}</b>
      </div>
      <div class="timeline-summary-item">
        <span>${currentLang==='en'?'Bake':'Bakken'}</span>
        <b>${niceDate(bake)}</b>
      </div>
      <div class="timeline-summary-item">
        <span>${currentLang==='en'?'Total lead time':'Totale doorlooptijd'}</span>
        <b>± ${totalLabel}</b>
      </div>
      <div class="timeline-summary-item">
        <span>${currentLang==='en'?'Fermentation':'Fermentatie'}</span>
        <b>${durationLabel(fermentationHours(c))}</b>
      </div>
      <div class="timeline-summary-item">
        <span>${currentLang==='en'?'Active preparation':'Actieve voorbereiding'}</span>
        <b>± ${active.low}–${active.high} min</b>
      </div>
      <div class="timeline-summary-item">
        <span>${currentLang==='en'?'Baking session':'Baksessie'}</span>
        <b>± ${bakeRange.low}–${bakeRange.high} min</b>
      </div>
    </div>`;

  const liveNote=live.active?`<div class="${livePlanClass(live,plannedC)==='hot'?'warning':'info'} timeline-deadline-warning">${L('Deze planning is herberekend met de werkelijk gemeten temperatuurdata; de gistdosering blijft onveranderd.','This plan has been recalculated using the actual measured temperature data; the yeast dose remains unchanged.')}</div>`:'';
  $('timeline').innerHTML=dstWarning+warning+liveNote+summary+rows.map(x=>`<div class="timeitem"><b>${x[0]}</b><span>${x[1]}</span></div>`).join('');
}

// Eén label voor sausbedragen, zodat boodschappenlijst, modal en kopieertekst
// niet drie verschillende antwoorden geven op dezelfde vraag.
function sauceAmountLabel(g,agg=null){
  const nl=currentLang!=='en';
  const base=`${fmt(g.need,0)} g ${nl?"op pizza's":'on pizzas'}`;
  if(!g.s.tomato) return base;
  const cook=g.yieldFactor&&g.yieldFactor<1?` ${nl?'(incl. inkoken)':'(incl. reduction)'}`:'';
  const buy=usesCombinedTomatoPurchase(agg)?'':` • ${nl?'kopen':'buy'} ${g.tins}× 400 g`;
  return `${base} • ${nl?'maken':'make'} ${fmt(g.batch,0)} g${cook}${buy}`;
}

function buildShopping(c){
  const aggSauce=aggregateSauceNeeds(c);

  if(appMode==='sauce'){
    const groups=aggSauce.enabled ? aggSauce.groups : [];
    if(!groups.length){
      $('shoppingList').innerHTML=`<div class="hint">${L('Saus meerekenen staat uit.','Include sauce is turned off.')}</div>`;
      return;
    }
    $('shoppingList').innerHTML=groups.map(g=>`<div class="recipebox">
      <div class="titleline"><h3>${sauceName(g.type)}</h3><span class="tag">${c.pizzas} ${L("pizza's",'pizzas')}</span></div>
      <div class="list">
        <div class="list-row"><span>${L("Nodig op pizza's",'Needed on pizzas')}</span><span>${fmt(g.need,0)} g</span></div>
        ${g.s.tomato?`<div class="list-row"><span>${L('Maken','Make')}</span><span>${fmt(g.batch,0)} g${g.yieldFactor&&g.yieldFactor<1?L(' rauw (incl. inkoken)',' raw (incl. reduction)'):''}</span></div>${usesCombinedTomatoPurchase(aggSauce)?'':`<div class="list-row"><span>${L('Kopen','Buy')}</span><span>${g.tins}× 400 g</span></div>`}`:''}
        ${g.ingredients.map(x=>`<div class="list-row"><span>${tItem(x[0])}</span><span>${x[1]}</span></div>`).join('')}
      </div>
    </div>`).join('')+(usesCombinedTomatoPurchase(aggSauce)?`<div class="recipebox"><div class="titleline"><h3>${L('Gezamenlijke tomateninkoop','Combined tomato purchase')}</h3></div><div class="list">${tomatoPurchaseRowHtml(aggSauce)}</div></div>`:'');
    return;
  }

  ensurePizzaSelections();
  const totals={};
  ensurePizzaCustomizations();
  pizzaSelections.forEach((id,idx)=>{
    includedItemsForBall(idx).forEach(x=>{
      const key=`${x[0]}|${x[2]}`;
      if(!totals[key]) totals[key]={name:x[0],unit:x[2],qty:0};
      totals[key].qty+=x[1];
    });
    const cheese=extraCheeseAdvice(idx,c);
    if(pizzaCustomizations[idx].extraCheese && cheese.allowed){
      const key=`${cheese.name}|g`;
      if(!totals[key]) totals[key]={name:cheese.name,unit:'g',qty:0};
      totals[key].qty+=cheese.amount;
    }
  });

  const pizzaCounts=aggregatePizzaCounts();
  const pizzaRows=Object.entries(pizzaCounts).map(([id,count])=>{
    const r=recipeById(id);
    return `<div class="list-row"><span>${recipeNameText(r)}</span><span>${count}×</span></div>`;
  }).join('');
  const ingredientRows=Object.values(totals).map(x=>`<div class="list-row"><span>${tItem(x.name)}</span><span>${fmt(x.qty,x.qty<2?1:0)} ${tUnit(x.unit,x.qty)}</span></div>`).join('');
  const sauceRows=aggSauce.enabled?aggSauce.groups.map(g=>`<div class="list-row"><span>${sauceName(g.type)}</span><span>${sauceAmountLabel(g,aggSauce)}</span></div>`).join(''):'';
  const tomatoPurchaseRow=tomatoPurchaseRowHtml(aggSauce);
  // De sub-ingrediënten van de saus (knoflook, oregano, zout, olie) stonden
  // alleen in het stappenplan en ontbraken volledig op de boodschappenlijst.
  const sauceIngredientRows=aggSauce.enabled?aggSauce.groups.map(g=>
    g.ingredients.map(x=>`<div class="list-row sub"><span>↳ ${tItem(x[0])}</span><span>${x[1]}</span></div>`).join('')
  ).join(''):'';

  $('shoppingList').innerHTML=`<div class="recipebox">
    <div class="titleline"><h3>${c.pizzas} ${L("pizza's",'pizzas')}</h3><span class="tag">${L('gemengd','mixed')}</span></div>
    <div class="list">${pizzaRows}</div><hr><div class="list">${sauceRows}${tomatoPurchaseRow}${sauceIngredientRows}${ingredientRows}</div>
  </div>`;
}

function buildStoneAdvice(c){
  const b=stoneProfile(c.stoneTemp),rt=selectedRecipeTempAdvice();
  $('stoneBakeAdvice').textContent=`${fmt(c.stoneTemp,0)} °C ${L('steen','stone')} • ${b.time}`;
  $('stoneBakeDetail').textContent=`${L('Draaien','Turning')}: ${b.turn}. ${b.note}`;

  const oilRange=b.oilLow===b.oilHigh ? `${fmt(b.oilLow,1)}%` : `${fmt(b.oilLow,1)}–${fmt(b.oilHigh,1)}%`;
  const current=c.o;
  let verdict='';
  if(current<b.oilLow-.01) verdict=L(`Je huidige ${fmt(current,1)}% olie ligt onder het richtbereik.`,`Your current ${fmt(current,1)}% oil is below the guideline range.`);
  else if(current>b.oilHigh+.01) verdict=L(`Je huidige ${fmt(current,1)}% olie ligt boven het richtbereik.`,`Your current ${fmt(current,1)}% oil is above the guideline range.`);
  else verdict=L(`Je huidige ${fmt(current,1)}% olie past bij dit temperatuurbereik.`,`Your current ${fmt(current,1)}% oil fits this temperature range.`);
  $('oilAdviceBox').innerHTML=`<b>${L('Olijfolieadvies','Olive oil guidance')}:</b> ${oilRange} ${L('van de bloem bij ongeveer','of the flour at about')} ${fmt(c.stoneTemp,0)} °C. ${verdict}`;

  const common=rt.hasCommon
    ? L(`Voor alle gekozen pizza's is <b>${rt.commonLow}–${rt.commonHigh} °C</b> een gezamenlijk goed bereik. Adviesknop kiest ${rt.suggested} °C.`,
        `For all selected pizzas, <b>${rt.commonLow}–${rt.commonHigh} °C</b> is a shared good range. The advice button picks ${rt.suggested} °C.`)
    : L(`De gekozen pizza's hebben geen volledig overlappend ideaal bereik. Een praktisch compromis is <b>±${rt.suggested} °C</b>.`,
        `The selected pizzas have no fully overlapping ideal range. A practical compromise is <b>±${rt.suggested} °C</b>.`);
  const rows=rt.rows.map(x=>{
    let cls='status-good',status=L('✓ binnen bereik','✓ within range');
    if(c.stoneTemp<x.low){cls='status-warn';status=L(`↑ liever ${x.low}–${x.high} °C`,`↑ prefers ${x.low}–${x.high} °C`);}
    else if(c.stoneTemp>x.high){cls='status-hot';status=L(`↓ liever ${x.low}–${x.high} °C`,`↓ prefers ${x.low}–${x.high} °C`);}
    return `<div class="list-row"><span>${L('Bol','Ball')} ${x.i} • ${recipeNameText(x.r)}</span><span class="${cls}">${status}</span></div>`;
  }).join('');
  $('recipeTempAdvice').innerHTML=`<div class="titleline"><div><h3>${L("Temperatuuradvies voor je pizza's",'Temperature guidance for your pizzas')}</h3><div class="hint" style="margin:0">${common}</div></div><span class="tag">${L('steen','stone')}</span></div><div class="list">${rows}</div>`;

  const sizeOverride=c.targetDiameter>OVEN_DIAMETER+0.01
    ? L(` <b>Diameteroverride:</b> ${fmt(c.targetDiameter,1)} cm ligt boven het huidige 14″ Koda-2-profiel van ${fmt(OVEN_DIAMETER,1)} cm; dit blokkeert de berekening bewust niet.`,
        ` <b>Diameter override:</b> ${fmt(c.targetDiameter,1)} cm exceeds the current 14″ Koda 2 profile of ${fmt(OVEN_DIAMETER,1)} cm; the calculator deliberately does not block it.`)
    : '';
  $('ovenCard').innerHTML=`<div class="stats"><div class="stat"><span>${L('Steentemperatuur','Stone temperature')}</span><b>${fmt(c.stoneTemp,0)} °C</b></div><div class="stat"><span>${L('Baktijd startpunt','Bake time starting point')}</span><b>${b.time}</b></div><div class="stat"><span>${L('Draaien','Turning')}</span><b>${b.turn}</b></div></div><div class="info">${b.note} <b>${L('Olijfolie','Olive oil')}:</b> ${L('richtwaarde','guideline')} ${oilRange}. ${L('Hardwareprofiel: Ooni Koda 2 • 14″ oven • 12″ schep. Steentemperatuur is leidend; bovenwarmte/vlam blijft wel invloed houden.','Hardware profile: Ooni Koda 2 • 14″ oven • 12″ peel. Stone temperature is the lead variable; top heat/flame still matters.')}${sizeOverride}</div>`;
}

function applyOilAdvice(){
  const c=calc(),b=stoneProfile(c.stoneTemp);
  exactOverride=exactOverride||{h:selectedHydration(),s:selectedSalt(),o:selectedOil(),ySelected:selectedYeastPct()};
  exactOverride.o=b.targetOil;
  $('oilPct').value=roundTo(b.targetOil,.5).toFixed(1);
  markCustom(false);
  update();
}

function applyRecipeTempAdvice(){
  const a=selectedRecipeTempAdvice();
  $('stoneTemp').value=a.suggested;
  update();
}

function ingredientsCombinedHTML(c){
  ensurePizzaSelections();
  const aggSauce=aggregateSauceNeeds(c),totals={};
  ensurePizzaCustomizations();
  pizzaSelections.forEach((id,idx)=>{
    includedItemsForBall(idx).forEach(x=>{
      const key=`${x[0]}|${x[2]}`;
      if(!totals[key])totals[key]={name:x[0],unit:x[2],qty:0};
      totals[key].qty+=x[1];
    });
    const cheese=extraCheeseAdvice(idx,c);
    if(pizzaCustomizations[idx].extraCheese && cheese.allowed){
      const key=`${cheese.name}|g`;
      if(!totals[key])totals[key]={name:cheese.name,unit:'g',qty:0};
      totals[key].qty+=cheese.amount;
    }
  });
  const toppingRows=Object.values(totals).map(x=>`<div class="list-row"><span>${tItem(x.name)}</span><span>${fmt(x.qty,x.qty<2?1:0)} ${tUnit(x.unit,x.qty)}</span></div>`).join('');
  const sauceRows=aggSauce.enabled?aggSauce.groups.map(g=>`<div class="list-row"><span>${sauceName(g.type)}</span><span>${sauceAmountLabel(g,aggSauce)}</span></div>`).join(''):'';
  return `<div class="list">${sauceRows}${tomatoPurchaseRowHtml(aggSauce)}${toppingRows}</div>`;
}


function copyLang(nl,en){return currentLang==='en'?en:nl;}
function copyIngredientName(name){return currentLang==='en'?(ITEM_EN[name]||uiText(name)):name;}
function copyUnit(unit,qty){
  if(currentLang!=='en')return unit;
  const u=String(unit);
  if(u==='blaadjes')return Number(qty)===1?'leaf':'leaves';
  if(u==='teen')return Number(qty)===1?'clove':'cloves';
  if(u==='stuk'||u==='stuks')return Number(qty)===1?'piece':'pieces';
  return u;
}
function copySauceValue(value){
  let v=String(value);
  if(currentLang!=='en')return v;
  return v
    .replace(/\bblaadjes\b/g,'leaves')
    .replace(/\bteen\/tenen\b/g,'clove(s)')
    .replace(/optioneel, klein scheutje/g,'optional, small drizzle')
    .replace(/optioneel, alleen indien de tomaten zuur zijn/g,'optional, only if the tomatoes are acidic')
    .replace(/heel licht, naar smaak/g,'very lightly, to taste');
}

function ingredientsCopyText(c){
  ensurePizzaSelections();
  ensurePizzaCustomizations();
  const aggSauce=aggregateSauceNeeds(c);
  const lines=[];

  lines.push(`🍕 *${copyLang('Ingrediënten','Ingredients')}* — ${c.pizzas} ${copyLang("pizza's",'pizzas')}`);
  lines.push('');

  lines.push(`🌾 *${copyLang('Deeg • hele batch','Dough • full batch')}*`);
  lines.push(`• ${copyLang('Bloem','Flour')}: ${fmt(c.flour,0)} g`);
  lines.push(`• ${copyLang('Water','Water')}: ${fmt(c.water,0)} g`);
  lines.push(`• ${copyLang('Zout','Salt')}: ${fmt(c.salt,0)} g`);
  lines.push(`• ${copyIngredientName(yeastName(c.yeastType))}: ${fmt(c.yeast,1)} g`);
  if(c.o>0)lines.push(`• ${copyLang('Olijfolie in deeg','Olive oil in dough')}: ${fmt(c.oil,0)} g`);

  if(appMode!=='dough' && aggSauce.enabled && aggSauce.groups.length){
    lines.push('');
    lines.push(`🍅 *${copyLang('Saus','Sauce')}*`);
    aggSauce.groups.forEach(g=>{
      lines.push(`*${sauceName(g.type)}*`);
      lines.push(`• ${copyLang("Op pizza's nodig",'Required on pizzas')}: ${fmt(g.need,0)} g`);
      if(g.s.tomato){
        lines.push(`• ${copyLang('Maken','Make')}: ${fmt(g.batch,0)} g`);
        if(!usesCombinedTomatoPurchase(aggSauce))lines.push(`• ${copyLang('Kopen','Buy')}: ${g.tins}x 400 g`);
      }
      g.ingredients.forEach(x=>{
        lines.push(`• ${copyIngredientName(x[0])}: ${copySauceValue(x[1])}`);
      });
    });
  }

  if(appMode==='full'){
    lines.push('');
    lines.push(`🍕 *${copyLang('Per pizza','Per pizza')}*`);
    pizzaSelections.forEach((id,idx)=>{
      const r=recipeById(id),custom=pizzaCustomizations[idx],cheese=extraCheeseAdvice(idx,c);
      const sauceLine=custom.noSauce
        ? copyLang('uitgevinkt','unchecked')
        : ($('autoSauceFromPizzas').checked
            ? `${sauceName(effectiveSauceTypeForBall(idx))} — ${effectiveSauceGramsForBall(idx)} g`
            : `${sauceName($('sauceType').value)} — ${fmt(manualSaucePerPizza(),0)} g`);

      lines.push(`*${copyLang('Bol','Dough ball')} ${idx+1} — ${recipeNameText(r)}*`);
      lines.push(`• ${copyLang('Saus','Sauce')}: ${sauceLine}`);
      includedItemsForBall(idx).forEach(x=>{
        lines.push(`• ${copyIngredientName(x[0])}: ${fmt(x[1],x[1]<2?1:0)} ${copyUnit(x[2],x[1])}`);
      });
      if(custom.extraCheese&&cheese.allowed){
        lines.push(`• ${copyIngredientName(cheese.name)} (${copyLang('extra kaas','extra cheese')}): +${fmt(cheese.amount,0)} g`);
      }
    });

    const totals={};
    pizzaSelections.forEach((id,idx)=>{
      includedItemsForBall(idx).forEach(x=>{
        const key=`${x[0]}|${x[2]}`;
        if(!totals[key])totals[key]={name:x[0],unit:x[2],qty:0};
        totals[key].qty+=x[1];
      });
      const cheese=extraCheeseAdvice(idx,c);
      if(pizzaCustomizations[idx].extraCheese && cheese.allowed){
        const key=`${cheese.name}|g`;
        if(!totals[key])totals[key]={name:cheese.name,unit:'g',qty:0};
        totals[key].qty+=cheese.amount;
      }
    });

    lines.push('');
    lines.push(`🛒 *${copyLang('Gecombineerd • toppings & saus','Combined • toppings & sauce')}*`);
    if(aggSauce.enabled){
      aggSauce.groups.forEach(g=>{
        const suffix=g.s.tomato
          ? ` — ${copyLang('maken','make')} ${fmt(g.batch,0)} g${usesCombinedTomatoPurchase(aggSauce)?'':` / ${copyLang('kopen','buy')} ${g.tins}x 400 g`}`
          : '';
        lines.push(`• ${sauceName(g.type)}: ${fmt(g.need,0)} g${suffix}`);
      });
      const purchaseLine=tomatoPurchaseCopyLine(aggSauce);
      if(purchaseLine)lines.push(purchaseLine);
    }
    Object.values(totals).forEach(x=>{
      lines.push(`• ${copyIngredientName(x.name)}: ${fmt(x.qty,x.qty<2?1:0)} ${copyUnit(x.unit,x.qty)}`);
    });
  }

  return lines.join('\n');
}

async function writeTextRobust(text){
  if(navigator.clipboard && window.isSecureContext){
    try{
      await navigator.clipboard.writeText(text);
      return true;
    }catch(e){}
  }

  // Fallback for local HTML files and mobile browsers where Clipboard API
  // may be unavailable. This remains triggered directly by the user's tap.
  const ta=document.createElement('textarea');
  ta.value=text;
  ta.setAttribute('readonly','');
  ta.style.position='fixed';
  ta.style.left='-9999px';
  ta.style.top='0';
  ta.style.opacity='0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  ta.setSelectionRange(0,ta.value.length);
  let ok=false;
  try{ok=document.execCommand('copy');}catch(e){ok=false;}
  document.body.removeChild(ta);
  return ok;
}

async function copyIngredients(){
  const btn=$('copyIngredientsBtn');
  const label=$('copyIngredientsLabel');
  const original=currentLang==='en'?'Copy':'Kopiëren';
  const text=ingredientsCopyText(calc());
  const ok=await writeTextRobust(text);

  if(label)label.textContent=ok?(currentLang==='en'?'Copied!':'Gekopieerd!'):(currentLang==='en'?'Copy failed':'Kopiëren mislukt');
  if(btn)btn.classList.toggle('copied',ok);

  window.setTimeout(()=>{
    if(label)label.textContent=original;
    if(btn)btn.classList.remove('copied');
  },1800);
}

function buildIngredientsModal(c){
  ensurePizzaCustomizations();
  const aggSauce=aggregateSauceNeeds(c);
  const dough=`<div class="modal-section"><h3>Deeg • hele batch</h3><div class="list">
    <div class="list-row"><span>Bloem</span><span>${fmt(c.flour,0)} g</span></div>
    <div class="list-row"><span>Water</span><span>${fmt(c.water,0)} g</span></div>
    <div class="list-row"><span>Zout</span><span>${fmt(c.salt,0)} g</span></div>
    <div class="list-row"><span>${yeastName(c.yeastType)}</span><span>${fmt(c.yeast,1)} g</span></div>
    ${c.o>0?`<div class="list-row"><span>Olijfolie in deeg</span><span>${fmt(c.oil,0)} g</span></div>`:''}
  </div></div>`;

  const saucesHtml=aggSauce.enabled?`<div class="modal-section"><h3>${L('Saus','Sauce')}</h3>${aggSauce.groups.map(g=>`<div class="sauce-group"><h4>${sauceName(g.type)}</h4><div class="list"><div class="list-row"><span>${L("Op pizza's nodig","Needed on pizzas")}</span><span>${fmt(g.need,0)} g</span></div>${g.s.tomato?`<div class="list-row"><span>${L('Maken','Make')}</span><span>${fmt(g.batch,0)} g</span></div>${usesCombinedTomatoPurchase(aggSauce)?'':`<div class="list-row"><span>${L('Kopen','Buy')}</span><span>${g.tins}× 400 g</span></div>`}`:''}${g.ingredients.map(x=>`<div class="list-row"><span>${tItem(x[0])}</span><span>${x[1]}</span></div>`).join('')}</div></div>`).join('')}</div>`:'';

  const perPizza=`<div class="modal-section"><h3>Per pizza</h3>${pizzaSelections.map((id,idx)=>{
    const r=recipeById(id),custom=pizzaCustomizations[idx],cheese=extraCheeseAdvice(idx,c);
    const sauceLine=custom.noSauce?'uitgevinkt':($('autoSauceFromPizzas').checked?`${sauceName(effectiveSauceTypeForBall(idx))} • ${effectiveSauceGramsForBall(idx)} g`:`${sauceName($('sauceType').value)} • ${fmt(manualSaucePerPizza(),0)} g`);
    const rows=includedItemsForBall(idx).map(x=>`<div class="list-row"><span>${tItem(x[0])}</span><span>${x[1]} ${tUnit(x[2],x[1])}</span></div>`).join('');
    const extra=custom.extraCheese&&cheese.allowed?`<div class="list-row"><span>${cheese.name} • extra kaas</span><span>+${fmt(cheese.amount,0)} g</span></div>`:'';
    return `<div class="recipebox"><div class="titleline"><h3>Bol ${idx+1} • ${recipeNameText(r)}</h3><span class="tag">${pizzaStyleLabel(custom.pizzaStyle)} • ${recipeTempFor(id).low}–${recipeTempFor(id).high} °C</span></div><div class="list"><div class="list-row"><span>Saus</span><span>${sauceLine}</span></div>${rows}${extra}</div></div>`;
  }).join('')}</div>`;

  const combined=`<div class="modal-section"><h3>Gecombineerd toppings & saus</h3>${ingredientsCombinedHTML(c)}</div>`;
  if(appMode==='dough') $('ingredientsModalBody').innerHTML=dough;
  else if(appMode==='sauce') $('ingredientsModalBody').innerHTML=dough+saucesHtml;
  else $('ingredientsModalBody').innerHTML=dough+saucesHtml+perPizza+combined;
}

function openIngredientsModal(){
  buildIngredientsModal(calc());
  $('ingredientsModal').classList.remove('hidden');
  pushModal('ingredients');
  setTimeout(()=>{const f=focusablesIn($('ingredientsModal'));if(f.length)f[0].focus();},50);
}
function closeIngredientsModal(){
  if($('ingredientsModal').classList.contains('hidden'))return;
  $('ingredientsModal').classList.add('hidden');
  popModal('ingredients');
}
function modalBackdropClose(e){if(e.target===$('ingredientsModal'))closeIngredientsModal();}
document.addEventListener('keydown',e=>{
  if(!_modalStack.length)return;
  const top=_modalStack[_modalStack.length-1];
  const root=top==='picker'?$('pizzaPickerOverlay'):$('ingredientsModal');
  if(e.key==='Escape'){ e.preventDefault(); if(top==='picker')closePizzaPicker(); else closeIngredientsModal(); return; }
  trapFocus(e,root);
});
