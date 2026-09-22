/* The evening owns run and pizza identities; the legacy batch view is an adapter. */
let evenings={active:null,history:[],templates:[],draft:{pizzas:[],date:'',earliest:'',unavailable:[],cleanup:0,split:{unit:'dough',capacity:null}}};
let eveningNotice='';
let eveningImport=null;
let pendingEveningTemplate=null;
let eveningWakeLock=null;
let eveningWakeWanted=false;
const eveningPanels=['eveningPlan','eveningOptions','eveningCollection','kitchenWorkspace'];
function activeEvening(){return evenings.active;}
function selectedRun(){return activeEvening()?.runs.find(r=>r.id===activeEvening().selectedRun)||null;}
function bindEveningRun(){
  if(!activeEvening())return;
  workshop.batch=selectedRun()?.batch||null;
  if(workshop.batch){liveMeasurements={...workshop.batch.measurements};completedSteps={...workshop.batch.progress};}
}
function syncEveningRun(){
  const run=selectedRun();if(!run||!workshop.batch)return;
  run.batch=workshop.batch;run.batch.progress={...completedSteps};
  for(const key of BATCH_OVEN_FIELDS){
    activeEvening().recipe.fields[key]=workshop.batch.recipe.fields[key];
    activeEvening().template.recipe.fields[key]=workshop.batch.recipe.fields[key];
    activeEvening().runs.forEach(r=>{if(r.batch)r.batch.recipe.fields[key]=workshop.batch.recipe.fields[key];});
  }
}
function runDoseDecimals(value){return value>0?Math.max(2,Math.min(6,1-Math.floor(Math.log10(value)))):2;}
function runCalculation(c){
  const run=selectedRun();if(!run)return c;
  const q=run.allocation.display,total=['flour','water','salt','yeast','oil'].reduce((s,k)=>s+q[k],0);
  return {...c,...q,pizzas:run.balls,total,actualBall:total/run.balls,actualH:q.water/q.flour*100,actualS:q.salt/q.flour*100,actualY:q.yeast/q.flour*100,actualO:q.oil/q.flour*100,runAllocation:true};
}
function pizzaSnapshot(index,c){
  const recipe=recipeById(pizzaSelections[index]),custom=pizzaCustomizations[index],after=new Set(recipe.after||[]);
  const items=includedItemsForBall(index).map(item=>({name:item[0],nameEn:ITEM_EN[item[0]]||item[0],quantity:item[1],unit:['g','ml'].includes(item[2])?item[2]:'st',after:after.has(itemKey(item))}));
  const before=items.filter(x=>!x.after),finish=items.filter(x=>x.after);
  if(appMode!=='dough'&&$('includeSauce').checked&&!custom.noSauce){
    const type=$('autoSauceFromPizzas').checked?effectiveSauceTypeForBall(index):$('sauceType').value;
    const amount=$('autoSauceFromPizzas').checked?effectiveSauceGramsForBall(index):manualSaucePerPizza();
    before.unshift({name:sauces[type]?.name||type,nameEn:sauces[type]?.nameEn||type,quantity:amount,unit:'g'});
  }
  const cheese=extraCheeseAdvice(index,c);
  if(custom.extraCheese&&cheese.allowed)before.push({name:cheese.name,nameEn:ITEM_EN[cheese.name]||cheese.name,quantity:cheese.amount,unit:'g'});
  return {name:appMode==='full'?recipe.name:'Pizza',nameEn:appMode==='full'?englishDataText(recipe.name,recipe.nameEn):'Pizza',before:appMode==='full'?before:appMode==='sauce'?before.slice(0,1):[],after:appMode==='full'?finish:[]};
}
function syncEveningPizzas(c=calc()){
  ensurePizzaCustomizations();
  const list=activeEvening()?.pizzas||evenings.draft.pizzas;
  // Array order is a compatibility projection; IDs are the authoritative identity.
  pizzaSelections.forEach((rid,i)=>{
    if(!list[i])list[i]={id:workshopId(),name:'',recipeId:rid,custom:WorkflowCore.clone(pizzaCustomizations[i]),events:{},runId:''};
    const p=list[i];
    if(p.events.in!=null){pizzaSelections[i]=p.recipeId;pizzaCustomizations[i]=WorkflowCore.clone(p.custom);return;}
    if(p.unresolved)return;
    p.recipeId=rid;p.custom=WorkflowCore.clone(pizzaCustomizations[i]);p.snapshot=pizzaSnapshot(i,c);
  });
  if(!activeEvening()&&!_deferDependentStatePrune)list.length=pizzaSelections.length;
}
function projectEveningPizzas(list){
  pizzaSelections=list.map(p=>p.recipeId);pizzaCustomizations=list.map(p=>WorkflowCore.clone(p.custom));
}
function captureEveningTemplate(name=L('Pizza-avond','Pizza evening')){
  syncEveningPizzas();
  const e=activeEvening();
  return EveningCore.cleanTemplate({id:workshopId(),name,recipe:e?.recipe||snapshotRecipe(),mode:appMode,pizzas:e?.pizzas||evenings.draft.pizzas,
    sauce:{enabled:$('includeSauce').checked,automatic:$('autoSauceFromPizzas').checked,type:$('sauceType').value,grams:manualSaucePerPizza()},
    split:e?.template.split||evenings.draft.split,storage:e?.template.storage||workshop.storage,scale:workshop.scale,profile:currentMixerProfile()});
}
function eveningFailure(error){
  const messages={
    'one-ball':L('Eén deegbal overschrijdt deze capaciteit. Kies een grotere kom of kleinere bollen.','One dough ball exceeds this capacity. Use a larger bowl or smaller balls.'),
    'rounding-capacity':L('Deze verdeling past na afronden niet binnen de capaciteit.','This allocation exceeds capacity after rounding.'),
    'bowl-busy':L('Rond eerst het afwerken van de vorige mixerbeurt af; daarna is de kom vrij.','Finish the previous mixer run first; the bowl is then free.'),
    'oven-busy':L('Er staat al een pizza in de oven. Registreer eerst het uithalen.','A pizza is already in the oven. Record its removal first.'),
    'run-not-started':L('Start eerst de mixerbeurt van deze pizza.','Start this pizza’s mixer run first.'),
    'missing-previous':L('Vul de ontbrekende momenten in, of kies “Gedaan, tijd onbekend”.','Enter the missing checkpoints, or choose “Done, time unknown”.'),
    'order':L('Dit moment past niet tussen de andere werkelijke momenten.','This time does not fit between the other actual checkpoints.'),
    'future':L('Gebruik een werkelijke tijd, uiterlijk nu en vóór de gewenste bakstart.','Use an actual time, no later than now and before the requested bake time.'),
    'dependent':L('Er zijn latere handelingen. Corrigeer het tijdstip bij de geregistreerde momenten.','Later actions exist. Correct the time in the recorded checkpoints.'),
    'completed':L('Een pizza die al in de oven is geweest behoudt zijn gegevens.','A pizza that has entered the oven keeps its recorded details.'),
    'nothing-to-undo':L('Er is geen laatste handeling om terug te draaien.','There is no latest action to undo.'),
    'storage':L('Niet opgeslagen. De vorige opgeslagen gegevens zijn behouden; download zo nodig een back-up.','Not saved. Previously saved data is intact; download a backup if needed.'),
    'date':L('Kies een bestaande lokale datum en tijd. Bij een dubbel uur kies je de eerste of tweede voorkomst.','Choose an existing local date and time. For a repeated hour, choose the first or second occurrence.'),
    'capacity':L('Vul een capaciteit van 1–50.000 gram in of laat het veld leeg.','Enter a capacity of 1–50,000 grams or leave the field blank.'),
    'format':L('Dit bestand is onvolledig, ongeldig of van een niet-ondersteunde versie. Er is niets vervangen.','This file is incomplete, invalid or from an unsupported version. Nothing was replaced.'),
    'collection-full':L('De verzameling bevat al 30 avonden. Verwijder eerst een sjabloon.','The collection already contains 30 evenings. Delete a template first.')
  };
  eveningNotice=messages[error.message]||error.message;
  renderEvening(calc());
}
function commitEvening(next){
  const previous=evenings.active;syncEveningRun();evenings.active=next;bindEveningRun();
  if(!saveState()){evenings.active=previous;if(previous)projectEveningPizzas(previous.pizzas);bindEveningRun();throw new Error('storage');}
  update();
}
function startEvening(){
  if(activeEvening())return;
  normalizeStoredNumberInputs();syncEveningPizzas();
  const c=calc(),template=captureEveningTemplate(),allocation=EveningCore.allocate(c,evenings.draft.split);
  if(!allocation.ok)throw new Error(allocation.reason);
  if(evenings.draft.pizzas.some(p=>p.unresolved))throw new Error(L('Kies eerst een beschikbaar recept voor de gemarkeerde pizza.','Choose an available recipe for the marked pizza first.'));
  const entered=$('eveningStartAt')?.value||$('batchStartAt')?.value||'',startedAt=entered?parseEveningTime(entered,'first'):Date.now();
  if(startedAt==null||startedAt>Date.now()+60000)throw new Error('future');
  const bakeAt=selectedBakeDate()?.getTime()??startedAt+timelineTotalHours(c)*3600000;
  if(bakeAt<=startedAt)throw new Error('future');
  const plan={preparation:prepHours(),bulk:c.bulk,cold:c.cold,ball:c.ball};
  const next=EveningCore.createEvening({id:workshopId(),template,allocation,startedAt,bakeAt,plan,zone:Intl.DateTimeFormat().resolvedOptions().timeZone});
  if(entered){next.runs[0].batch.measurements={...liveMeasurements};next.runs[0].batch.progress={...completedSteps};}
  eveningNotice='';commitEvening(next);showPage(4);
}
function recordEveningEvent(key,at,unknown=false){
  const e=WorkflowCore.clone(activeEvening()),run=e.runs.find(r=>r.id===e.selectedRun);if(!run?.batch)return;
  if(key==='bake'&&e.pizzas.some(p=>p.runId===run.id&&p.events.in!=null))throw new Error('dependent');
  if(WorkflowCore.eventDone(run.batch,key)&&at===null&&!unknown)return;
  const previous=WorkflowCore.clone(run.batch);
  run.batch=unknown?WorkflowCore.recordUnknownEvent(run.batch,key):WorkflowCore.recordEvent(run.batch,key,at??Date.now());
  const stepKeys={bulkStart:['s-mix','s-rest','s-knead','s-manualfinish'],fridgeIn:['s-bulk',...(run.batch.route==='coldBalls'?['s-shape']:[])],fridgeOut:['s-cold'],shape:['s-bulk','s-shape'],bake:['s-ballproof']};
  for(const step of stepKeys[key]||[])run.batch.progress[step]=true;
  e.undo={type:'event',runId:run.id,key,events:previous.events,unknownEvents:previous.unknownEvents||[],progress:previous.progress};e.revision++;
  commitEvening(e);
}
function kitchenCurrentKey(b=activeBatch()){return b?WorkflowCore.eventKeys(b.route).find(k=>!WorkflowCore.eventDone(b,k)):null;}
function eveningButton(action,label,extra='',kind='secondary'){return `<button type="button" class="btn ${kind}" data-evening-action="${action}" ${extra}>${label}</button>`;}
function eveningField(id,label,value,type='text',extra=''){return `<label>${label}<input class="field" id="${id}" type="${type}" value="${esc(value??'')}" ${extra}></label>`;}
function eveningPanel(id,html){
  // Reuse the proven details/focus preserving renderer without sharing notices.
  replaceWorkshopPanel(id,html);
}
function renderKitchen(c){
  const e=activeEvening(),b=activeBatch(),run=selectedRun();
  if(!e){eveningPanel('kitchenWorkspace',`<h2>${L('Keuken','Kitchen')}</h2><p>${L('Je hoeveelheden en alle instructies zijn klaar. Start wanneer je echt gaat mengen.','Your quantities and all instructions are ready. Start when you actually begin mixing.')}</p>${eveningButton('start',L('Start deeg','Start dough'),'','primary')}${eveningNotice?`<p class="info" role="status">${esc(eveningNotice)}</p>`:''}`);return;}
  const key=kitchenCurrentKey(b),view=WorkflowCore.timeline(b),rc=runCalculation(c),m=methodInstructions(rc),wt=waterTemperatureGuidance(rc,waterTempAdvice(rc));
  const title=key==='bulkStart'?L('Mengen, rusten en kneden','Mix, rest and knead'):key==='fridgeIn'||key==='shape'?L('Bulkrijs','Bulk proof'):key==='fridgeOut'?L('Koude fermentatie','Cold fermentation'):L('Opwarmen, openen en bakken','Warm up, open and bake');
  const selected=e.runs.indexOf(run);
  const nextTime=key&&view.times[key]!=null?niceDate(new Date(view.times[key])):L('Tijd onbekend','Time unknown');
  const runNav=e.runs.length>1?`<div class="run-switch" role="group" aria-label="${L('Mixerbeurt','Mixer run')}">${e.runs.map((r,i)=>eveningButton(r.batch?'select-run':'start-run',L(`Beurt ${i+1} · ${r.balls} bollen${r.batch?'':' · starten'}`,`Run ${i+1} · ${r.balls} balls${r.batch?'':' · start'}`),`data-id="${esc(r.id)}" aria-pressed="${r.id===e.selectedRun}"`)).join('')}</div>`:'';
  const mixing=key==='bulkStart'?`<div class="kitchen-ingredients">${['flour','water','salt','yeast','oil'].filter(k=>rc[k]>0).map(k=>`<span><b>${fmt(rc[k],k==='yeast'?runDoseDecimals(rc[k]):rc.practical?0:1)} g</b> ${{flour:L('bloem','flour'),water:L('water','water'),salt:L('zout','salt'),yeast:yeastName(c.yeastType),oil:L('olie','oil')}[k]}</span>`).join('')}</div><div class="kitchen-programme"><p>${wt.reserveLine} ${wt.mainLine}${wt.notes}</p><p>${m.mix}</p><p><b>${c.autolyse?L('30 min autolyse in de koelkast','30 min autolyse in the fridge'):L('20 min hydratatierust','20 min hydration rest')}</b></p><p>${m.add}</p><p>${m.knead}</p><p>${m.note||''}</p>${eveningField('kitchenDoughTemp',L('Direct na kneden gemeten (°C)','Measured directly after kneading (°C)'),liveMeasurements.doughTemp,'number','min="10" max="40" step="0.5"')}<p>${m.finish||''} ${m.finishNote||''}</p><p>${L('Beoordeel samenhang, elasticiteit en een ontspannen windowpane. Sterk maar strak deeg heeft vooral rust nodig.','Assess cohesion, elasticity and a rested windowpane. Strong but tight dough mainly needs rest.')}</p></div>`:'';
  const cues=key==='fridgeIn'?L('Bewaar deze beurt apart. Controleer of het deeg samenhangend en voldoende ontwikkeld is; de klok alleen beslist dat niet.','Keep this run separate. Check that the dough is cohesive and sufficiently developed; time alone does not decide this.'):
    key==='fridgeOut'?L('Het deeg rust in de koelkast. Volgende handeling: uit de koelkast. De kern kan warmer zijn dan de koelkastlucht.','The dough is resting in the fridge. Next action: take it out. The core can be warmer than the fridge air.'):
    L('Zoek luchtigheid, soepelheid en ontspanning. Nog koud of sterk terugverend? Laat afgedekt ontspannen en beoordeel opnieuw. Erg slap deeg vraagt voorzichtig behandelen.','Look for aeration, pliability and relaxation. Still cold or strongly recoiling? Rest covered and reassess. Very slack dough needs gentle handling.');
  const moments=WorkflowCore.eventKeys(b.route).map(k=>`<div class="checkpoint-row"><span>${batchEventName(k)}<small>${b.events[k]!=null?niceDate(new Date(b.events[k])):WorkflowCore.eventDone(b,k)?L('Gedaan, tijd onbekend','Done, time unknown'):L('Nog niet geregistreerd','Not recorded yet')}</small></span>${k==='start'?'':`<div>${eveningButton('correct-event',L('Tijd aanpassen','Correct time'),`data-key="${k}"`)}${!WorkflowCore.eventDone(b,k)?eveningButton('unknown-event',L('Gedaan, tijd onbekend','Done, time unknown'),`data-key="${k}"`):''}</div>`}</div>`).join('');
  const correction=workshopDrafts.eveningCorrectKey?`<div class="workshop-grid">${eveningField('eveningEventAt',batchEventName(workshopDrafts.eveningCorrectKey),workshopDrafts.eveningEventAt||localDateTime(),'datetime-local')}<label>${L('Bij een dubbel uur','For a repeated hour')}<select class="field" id="eveningTimeFold"><option value="first">${L('Eerste voorkomst','First occurrence')}</option><option value="second">${L('Tweede voorkomst','Second occurrence')}</option></select></label></div>${eveningButton('save-event-time',L('Moment bewaren','Save checkpoint'))}`:'';
  const zone=e.zone&&e.zone!==Intl.DateTimeFormat().resolvedOptions().timeZone?`<p class="hint">${L('Oorspronkelijke tijdzone','Original time zone')}: ${esc(e.zone)} · ${new Intl.DateTimeFormat(currentLang==='en'?'en-GB':'nl-NL',{dateStyle:'medium',timeStyle:'short',timeZone:e.zone}).format(e.bakeAt)}. ${L('Hierboven staat je lokale tijd.','Your local time is shown above.')}</p>`:'';
  eveningPanel('kitchenWorkspace',`<div class="kitchen-heading"><div><span class="eyebrow">${L('Keuken','Kitchen')}${e.runs.length>1?` · ${L('Beurt','Run')} ${selected+1}/${e.runs.length}`:''}</span><h2>${title}</h2><p>${pizzaCountLabel(c.pizzas)} · ${L('Eerste pizza in de oven','First pizza in the oven')}: <b>${niceDate(new Date(e.bakeAt))}</b></p>${zone}</div>${eveningButton('wake',eveningWakeLock&&!eveningWakeLock.released?L('Scherm blijft aan','Screen stays awake'):L('Scherm aanhouden','Keep screen awake'),'aria-pressed="'+String(!!eveningWakeLock&&!eveningWakeLock.released)+'"','ghost')}</div>${runNav}${eveningNotice?`<p class="info" role="status">${esc(eveningNotice)}</p>`:''}${mixing}${key!=='bulkStart'?`<p>${cues}</p>`:''}${key&&key!=='bake'?`<p>${L('Volgende handeling','Next action')}: <b>${batchEventName(key)}</b> · ${nextTime}</p>${eveningButton('event-now',batchEventName(key),`data-key="${key}"`,'primary')}`:''}<div class="btnrow">${e.undo?eveningButton('undo',L('Laatste handeling ongedaan maken','Undo latest action'),'','ghost'):''}${eveningButton('help',L('Deeg reageert anders?','Dough behaving differently?'),'','ghost')}</div><details id="kitchenHistory"><summary>${L('Momenten aanvullen of corrigeren','Complete or correct checkpoints')}</summary>${moments}${correction}${b.route==='hybrid'?`<p class="hint">${L('Uit de koelkast is geen geregistreerd opbolmoment. Opbollen blijft een aparte handeling binnen de bestaande eindrijstijd.','Fridge-out is not a recorded shaping time. Shaping remains a separate action within the existing final-proof allowance.')}</p>`:''}</details><details id="kitchenTimers"><summary>${L('Rusttimer en herinneringen','Rest timer and reminders')}</summary>${eveningField('restTimerMinutes',L('Timer (minuten)','Timer (minutes)'),workshopDrafts.restTimerMinutes||5,'number','min="1" max="1440"')}<div class="btnrow">${eveningButton('start-timer',L('Timer starten','Start timer'))}${eveningButton('calendar',L('Planning naar agenda (.ics)','Planning to calendar (.ics)'))}</div><p class="hint">${L('Een timer verandert je planning niet. Bij extra rust kun je de resterende tijden apart aanpassen. De pagina garandeert geen alarm als zij gesloten of gepauzeerd is. Een agenda-export is een momentopname.','A timer does not change the plan. For extra rest, adjust remaining times separately. The page cannot guarantee an alarm when closed or suspended. A calendar export is a snapshot.')}</p></details>${e.timer?`<p class="timer-status" id="eveningTimer" role="status"></p>${eveningButton('stop-timer',L('Timer stoppen','Stop timer'),'','ghost')}`:''}<details id="bakingWorkspace" ${key==='bake'||!key||e.pizzas.some(p=>p.events.in!=null)?'open':''}><summary>${L('Bakvolgorde','Baking queue')} · ${e.pizzas.length} ${L('pizza’s','pizzas')}</summary><div id="bakingQueue">${bakingQueueHtml(c,e)}</div></details><div class="btnrow">${eveningButton('finish',L('Avond bewaren en afsluiten','Save and finish evening'),'','ghost')}</div>`);
  renderEveningTimer();
}
function pizzaLabel(p,e=activeEvening()){const index=e.pizzas.findIndex(x=>x.id===p.id);return `${p.name||L('Pizza','Pizza')+' '+(index+1)} · ${currentLang==='en'?p.snapshot.nameEn:p.snapshot.name}`;}
function toppingSnapshotHtml(p,after=false){
  const items=p.snapshot[after?'after':'before'];return items.length?`<p><b>${after?L('Na het bakken','After baking'):L('Vóór het bakken','Before baking')}</b>: ${items.map(x=>`${esc(currentLang==='en'?x.nameEn:x.name)} <b>${fmt(x.quantity,x.quantity<1?2:1)} ${tUnit(x.unit,x.quantity)}</b>`).join(' · ')}</p>`:after?'':`<p>${L('Geen toppings gekozen.','No toppings selected.')}</p>`;
}
function bakingQueueHtml(c,e){
  const current=e.pizzas.find(p=>p.events.in!=null&&p.events.out==null),next=e.pizzas.find(p=>p.events.in==null),last=e.pizzas.filter(p=>p.events.out!=null).sort((a,b)=>b.events.out-a.events.out)[0];
  const stone=stoneProfile(c.stoneTemp),forecast=EveningCore.forecast(e.pizzas,{low:stone.secLow,high:stone.secHigh,manualGap:e.manualGap},e.pizzas.some(p=>p.events.in!=null)?Date.now():Math.max(Date.now(),e.bakeAt));
  return `<h3>${L('Bakken','Baking')}</h3><p>${L('Steen','Stone')}: <b>${fmt(c.stoneTemp,0)} °C</b> · ${stone.time}. ${L('Controleer de steen en het bakbeeld; de timer is een hulpmiddel.','Check the stone and the bake; the timer is a guide.')}</p>${current?`<div class="pizza-current"><h3>${L('In de oven','In the oven')}: ${esc(pizzaLabel(current,e))}</h3><p>${L('Sinds','Since')} ${niceDate(new Date(current.events.in))} · <span id="bakeElapsed"></span></p>${eveningButton('pizza-out',L('Uit oven','Out of oven'),`data-id="${esc(current.id)}"`,'primary')}</div>`:''}${last?`<div class="pizza-finishing"><b>${L('Net uit de oven','Just out of the oven')}: ${esc(pizzaLabel(last,e))}</b>${toppingSnapshotHtml(last,true)}<small>${L('Uit de oven betekent nog niet afgewerkt of geserveerd.','Out of the oven does not mean garnished or served.')}</small></div>`:''}${next?`<div class="pizza-next"><h3>${L('Volgende','Next')}: ${esc(pizzaLabel(next,e))}</h3><p>${L('Deeg uit beurt','Dough from run')} ${e.runs.findIndex(r=>r.id===next.runId)+1}</p>${toppingSnapshotHtml(next)}${toppingSnapshotHtml(next,true)}${!current?eveningButton('pizza-in',L('In oven','In oven'),`data-id="${esc(next.id)}"`,'primary'):''}</div>`:''}<p class="hint">${L('Gebakken','Baked')}: ${e.pizzas.filter(p=>p.events.out!=null).length}/${e.pizzas.length}. ${forecast.remaining?`${forecast.observed?L('Eerste pizza uit oven','First pizza out of oven'):L('Eerste pizza naar verwachting klaar','First pizza expected ready')}: ${niceDate(new Date(forecast.firstReadyAt))}. ${L('Laatste pizza naar verwachting klaar','Last pizza expected ready')}: ${niceDate(new Date(forecast.finishAt))}. ${forecast.observed?L(`Gebaseerd op ${forecast.observed} baktijden; pauzes apart (${fmt(forecast.gapSeconds/60,1)} min).`,`Based on ${forecast.observed} bake times; gaps kept separate (${fmt(forecast.gapSeconds/60,1)} min).`):L('Schatting volgens het bestaande ovenadvies.','Estimate follows existing oven guidance.')}`:''}</p><details id="queueDetails"><summary>${L('Volgorde en namen aanpassen','Edit order and names')}</summary>${e.pizzas.map((p,i)=>`<div class="queue-row"><span><b>${esc(pizzaLabel(p,e))}</b><small>${p.events.out!=null?L('Uit oven','Out of oven'):p.events.in!=null?L('In oven','In oven'):L('Wachtend','Queued')}</small></span>${p.events.in==null?`<div class="queue-controls"><input class="field" aria-label="${L('Naam pizza','Pizza name')} ${i+1}" data-pizza-name="${esc(p.id)}" value="${esc(p.name)}" maxlength="80" placeholder="${L('Naam (optioneel)','Name (optional)')}">${eveningButton('pizza-up',L('Eerder','Earlier'),`data-id="${esc(p.id)}" ${i===0?'disabled':''}`)}${eveningButton('pizza-down',L('Later','Later'),`data-id="${esc(p.id)}" ${i===e.pizzas.length-1?'disabled':''}`)}${e.template.mode==='full'?eveningButton('pizza-edit',L('Toppings','Toppings'),`data-id="${esc(p.id)}"`):''}</div>`:''}</div>`).join('')}${eveningField('eveningGap',L('Pauze tussen pizza’s (min; leeg = waargenomen)','Gap between pizzas (min; blank = observed)'),e.manualGap==null?'':e.manualGap/60,'number','min="0" max="60" step="0.5"')}</details>`;
}
function renderEveningTimer(){
  const elapsed=$('bakeElapsed'),pizza=activeEvening()?.pizzas.find(p=>p.events.in!=null&&p.events.out==null);
  if(elapsed&&pizza){const seconds=Math.max(0,Math.floor((Date.now()-pizza.events.in)/1000));elapsed.textContent=`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')} ${L('verstreken','elapsed')}`;}
  const element=$('eveningTimer'),timer=activeEvening()?.timer;if(!element||!timer)return;
  const seconds=Math.ceil((timer.endAt-Date.now())/1000),remaining=Math.max(0,seconds);
  element.textContent=seconds<=0?L('Timer klaar · beoordeel het deeg voordat je verdergaat.','Timer finished · assess the dough before continuing.'):`${L('Rusttimer','Rest timer')} · ${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,'0')}`;
}
async function toggleEveningWake(){
  if(eveningWakeLock&&!eveningWakeLock.released){eveningWakeWanted=false;await eveningWakeLock.release();eveningWakeLock=null;}
  else{
    try{eveningWakeWanted=true;eveningWakeLock=await navigator.wakeLock.request('screen');eveningWakeLock.addEventListener('release',()=>{eveningWakeLock=null;renderKitchen(calc());});}
    catch{eveningWakeWanted=false;eveningNotice=L('Scherm aanhouden is niet beschikbaar of is door je apparaat geweigerd.','Keeping the screen awake is unavailable or was refused by your device.');}
  }
  renderKitchen(calc());
}
function parseEveningTime(value,fold='first'){
  const first=parseLocalDateTime(value);if(first===null)return null;
  // Offset transitions may be 30, 60 or 120 minutes; select the actual matching wall time.
  const matches=[first];for(let minutes=15;minutes<=180;minutes+=15)if(localDateTime(first+minutes*60000)===value)matches.push(first+minutes*60000);
  return fold==='second'?matches.at(-1):first;
}
function downloadEveningFile(content,name,type='application/json'){
  const url=URL.createObjectURL(new Blob([typeof content==='string'?content:JSON.stringify(content,null,2)],{type}));
  const link=document.createElement('a');link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function exportEveningCalendar(){
  const e=activeEvening();if(!e)return;
  const stamp=at=>new Date(at).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
  const events=[];
  for(const [i,run] of e.runs.entries()){
    if(!run.batch)continue;const timeline=WorkflowCore.timeline(run.batch);
    for(const key of WorkflowCore.eventKeys(run.batch.route))if(!WorkflowCore.eventDone(run.batch,key)&&timeline.times[key]!=null)events.push(`BEGIN:VEVENT\r\nUID:${run.id}-${key}@pizza-calculator\r\nDTSTAMP:${stamp(Date.now())}\r\nDTSTART:${stamp(timeline.times[key])}\r\nSUMMARY:${L('Beurt','Run')} ${i+1}: ${batchEventName(key)}\r\nEND:VEVENT`);
  }
  downloadEveningFile(`BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Pizza Calculator//Planning//EN\r\n${events.join('\r\n')}\r\nEND:VCALENDAR\r\n`,'pizza-planning.ics','text/calendar;charset=utf-8');
}

function reopenEvening(id){
  if(activeEvening())return;
  const archived=evenings.history.find(e=>e.id===id||e.runs.some(r=>r.id===id));if(!archived||archived.legacyUnknownToppings)return;
  const next=WorkflowCore.clone(archived);next.status='active';delete next.closedAt;next.runs.forEach(r=>{if(r.batch)r.batch.status='active';});
  const history=evenings.history;evenings.history=history.filter(e=>e.id!==archived.id);projectEveningPizzas(next.pizzas);restoreRecipe(next.recipe,false);appMode=next.template.mode;
  try{commitEvening(next);}catch(error){evenings.history=history;throw error;}
  showPage(4);
}
