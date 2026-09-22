/* Optional planning and reuse surfaces; ordinary cooking never requires setup here. */
function eveningTaskName(task){
  const names={mix:L('Wegen en eerste menging','Weigh and first mix'),rest:L('Passieve rust','Passive rest'),finish:L('Toevoegen, kneden en afwerken','Add, knead and finish'),cleanup:L('Extra opruimbuffer','Extra cleanup buffer'),shape:L('Verdelen en opbollen','Divide and shape'),fridgeIn:L('Koelkast in','Into fridge'),fridgeOut:L('Koelkast uit','Out of fridge'),oven:L('Voorverwarmen · aanwezig blijven','Preheat · remain present'),ovenSetup:L('Oven aanzetten','Set up oven'),ovenCheck:L('Steen controleren','Check stone'),sauce:L('Saus voorbereiden','Prepare sauce'),bake:L('Pizza’s beleggen en bakken','Top and bake pizzas')};
  return `${task.run>=0?L(`Beurt ${task.run+1} · `,`Run ${task.run+1} · `):''}${names[task.kind]||task.kind}`;
}
function eveningSchedule(c,bakeAt=selectedBakeDate()?.getTime()){
  const allocation=EveningCore.allocate(c,evenings.draft.split);if(!allocation.ok||!bakeAt)return null;
  const sauce=aggregateSauceNeeds(c),sauceMinutes=appMode==='dough'||!sauce.enabled?0:sauce.groups.reduce((n,g)=>n+8+(g.s.cooked?5:0),0);
  return EveningCore.schedule({plan:{preparation:prepHours(),bulk:c.bulk,cold:c.cold,ball:c.ball},route:c.ferm,runBalls:allocation.runs.map(r=>r.balls),bakeAt,autolyse:c.autolyse,cleanup:evenings.draft.cleanup,preheat:c.preheat,bakeMinutes:bakeSessionRange(c).high,sauceMinutes});
}
function eveningConstraints(){return {earliest:evenings.draft.earliest?parseEveningTime(evenings.draft.earliest,evenings.draft.fold):null,unavailable:evenings.draft.unavailable};}
let _lastEveningTransition=0;
function renderEveningPlan(c){
  const e=activeEvening(),d=evenings.draft,bake=selectedBakeDate(),allocation=EveningCore.allocate(c,e?.template.split||d.split);
  const modeOptions=[['dough',L('Alleen deeg','Dough only')],['sauce',L('Deeg + saus','Dough + sauce')],['full',L('Volledige pizza’s','Complete pizzas')]];
  eveningPanel('eveningPlan',`<div class="plan-heading"><div><span class="eyebrow">${L('Plan','Plan')}</span><h2>${pizzaCountLabel(c.pizzas)} · ${fmt(c.targetDiameter,1)} cm</h2><p>${bake?`${L('Eerste pizza in de oven','First pizza in the oven')}: <b>${niceDate(bake)}</b>`:L('Hoeveelheden en werkwijze, ook zonder vaste bakdatum.','Quantities and instructions, also without a fixed baking date.')}</p></div><div>${eveningButton(e?'go-kitchen':'start',e?L('Verder in de keuken','Continue in Kitchen'):L('Start deeg','Start dough'),'','primary')}</div></div>${eveningNotice?`<p class="info" role="status">${esc(eveningNotice)}</p>`:''}${!e?`<details id="eveningAlreadyStarted"><summary>${L('Al begonnen?','Already started?')}</summary>${eveningField('eveningStartAt',L('Werkelijke start (lokaal)','Actual start (local)'),workshopDrafts.eveningStartAt||'','datetime-local')}</details>`:''}<div class="plan-shortcuts"><label>${L('Wat maak je?','What are you making?')}<select class="field" id="eveningMode" ${e?'disabled':''}>${modeOptions.map(([value,label])=>`<option value="${value}" ${appMode===value?'selected':''}>${label}</option>`).join('')}</select></label><div class="btnrow">${appMode==='full'?eveningButton('pizzas',L('Pizza’s en toppings','Pizzas and toppings')):''}${appMode!=='dough'?eveningButton('sauces',L('Sauzen','Sauces')):''}${eveningButton('ingredients',L('Alle hoeveelheden','All quantities'))}${eveningButton('go-kitchen',L('Instructies bekijken','View instructions'),'','ghost')}</div></div><p class="hint">${mixerMethodName(currentMethod)}${allocation.ok&&allocation.runs.length>1?` · ${allocation.runs.length} ${L('aparte mixerbeurten','separate mixer runs')}`:''} · ${L('Je huidige werk wordt automatisch bewaard.','Your current work is saved automatically.')}</p>`);
  const split=allocation.ok?`<p>${allocation.runs.length===1?L('Eén mixerbeurt.','One mixer run.'):L(`${allocation.runs.length} aparte beurten: ${allocation.runs.map(r=>r.balls).join(' + ')} bollen.`,`${allocation.runs.length} separate runs: ${allocation.runs.map(r=>r.balls).join(' + ')} balls.`)}</p><div class="table-scroll"><table class="workshop-table"><thead><tr><th>${L('Beurt','Run')}</th>${['flour','water','salt','yeast','oil'].map(k=>`<th>${{flour:L('Bloem','Flour'),water:L('Water','Water'),salt:L('Zout','Salt'),yeast:L('Gist','Yeast'),oil:L('Olie','Oil')}[k]} (g)</th>`).join('')}</tr></thead><tbody>${allocation.runs.map((r,i)=>`<tr><th>${i+1} · ${r.balls} ${L('bollen','balls')}</th>${['flour','water','salt','yeast','oil'].map(k=>`<td>${fmt(r.display[k],k==='yeast'?2:c.practical?0:1)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${allocation.runs.some(r=>WorkflowCore.weighing(r.exact.yeast,workshop.scale).tooCoarse||r.exact.yeast>0&&r.display.yeast===0)?`<p class="warning">${L('Een gistdosis per beurt is klein voor je schaalverdeling. Gebruik een fijnere weegschaal; de oorspronkelijke dosis is niet aangepast.','A per-run yeast dose is small for your scale resolution. Use a finer scale; the original dose was not changed.')}</p>`:''}<p class="hint">${L('Eén kom, beurten achter elkaar. Houd het deeg per beurt apart tijdens de rijs. De capaciteit is jouw opgegeven limiet; algemene merkadviezen zijn geen modelspecificatie.','One bowl, sequential runs. Keep each run separate during proof. Capacity is your entered limit; general brand advice is not a model specification.')}</p>`:`<p class="warning">${allocation.reason==='one-ball'?L('Zelfs één bol overschrijdt deze limiet.','Even one ball exceeds this limit.'):L('Controleer capaciteit en verdeling.','Check capacity and allocation.')}</p>`;
  const tasks=!e?eveningSchedule(c):null,constraints=eveningConstraints(),conflicts=tasks?EveningCore.conflicts(tasks,constraints):[],options=conflicts.length?EveningCore.alternatives(tasks,constraints):[];
  const availability=!tasks?`<p class="hint">${e?L('De avond loopt. Werkelijke tijden corrigeer je in de keuken; de oorspronkelijke agenda blijft een referentie.','The evening is running. Correct actual checkpoints in Kitchen; the original calendar remains a reference.'):L('Kies eerst een bakdatum om je beschikbaarheid te controleren.','Choose a baking date to check your availability.')}</p>`:`<p class="${conflicts.length?'warning':'info'}">${conflicts.length?L(`${conflicts.length} aandachtspunt(en) in deze planning.`,`This plan has ${conflicts.length} conflict(s).`):L('De ingevoerde beschikbaarheid past bij deze planning.','The entered availability fits this plan.')}</p>${conflicts.slice(0,8).map(x=>`<p>${esc(eveningTaskName(x.task))} · ${niceDate(new Date(x.task.start))}: ${x.reason==='resource'?L('overlap met ander actief werk','overlaps other active work'):x.reason==='earliest'?L('vóór je vroegste start','before your earliest start'):L('tijdens afwezigheid','during your absence')}</p>`).join('')}${conflicts.length?options.length?`<details id="availabilityAlternatives"><summary>${L('Andere baktijden met hetzelfde recept','Other bake times with the same recipe')}</summary>${options.map(option=>`<p>${L('Eerste pizza in oven','First pizza in oven')}: <b>${niceDate(new Date(bake.getTime()+option.minutes*60000))}</b>. ${L('Het hele plan schuift','The whole plan shifts')} ${option.minutes} min. ${eveningButton('apply-availability',L('Deze baktijd gebruiken','Use this bake time'),`data-minutes="${option.minutes}"`)}</p>`).join('')}</details>`:`<p class="hint">${L('Geen passend alternatief binnen 24 uur later. Kies bewust een andere bakdag, beschikbaarheid of recept. Meng- en rusttijden worden niet ingekort.','No fitting alternative within 24 hours later. Deliberately choose another bake day, availability or recipe. Mixing and rest times are not shortened.')}</p>`:''}<details id="availabilityTasks"><summary>${L('Actieve taken en wachttijden','Active tasks and waits')}</summary>${tasks.map(t=>`<div class="timeitem"><span>${esc(eveningTaskName(t))}<small>${t.active?L('Actief','Active'):t.attendance?L('Aanwezig blijven','Remain present'):L('Passief','Passive')}</small></span><span>${niceDate(new Date(t.start))} – ${new Date(t.end).toLocaleTimeString(currentLang==='en'?'en-GB':'nl-NL',{hour:'2-digit',minute:'2-digit'})}</span></div>`).join('')}</details>`;
  eveningPanel('eveningOptions',`<details id="eveningDateDetails"><summary>${L('Een andere datum of beschikbaarheid','Another date or availability')}</summary>${eveningField('eveningBakeDate',L('Vaste bakdatum (optioneel)','Fixed bake date (optional)'),d.date,'datetime-local',e?'disabled':'')}<p class="hint">${L('Een vaste datum blijft staan wanneer de dag wisselt. De snelkeuzes morgen/overmorgen blijven relatief zolang je geen vaste datum kiest.','A fixed date stays put when the day changes. Tomorrow/in-two-days shortcuts remain relative until you choose a fixed date.')}</p><div class="workshop-grid">${eveningField('eveningEarliest',L('Ik kan niet eerder beginnen dan','I cannot start before'),d.earliest,'datetime-local',e?'disabled':'')}${eveningField('eveningCleanup',L('Extra opruimen per beurt (min)','Extra cleanup per run (min)'),d.cleanup,'number',`min="0" max="60" ${e?'disabled':''}`)}<label>${L('Bij een dubbel uur','For a repeated hour')}<select class="field" id="planTimeFold" ${e?'disabled':''}><option value="first" ${d.fold!=='second'?'selected':''}>${L('Eerste voorkomst','First occurrence')}</option><option value="second" ${d.fold==='second'?'selected':''}>${L('Tweede voorkomst','Second occurrence')}</option></select></label></div><div class="workshop-grid">${eveningField('unavailableFrom',L('Afwezig vanaf','Unavailable from'),workshopDrafts.unavailableFrom||'','datetime-local',e?'disabled':'')}${eveningField('unavailableUntil',L('Tot','Until'),workshopDrafts.unavailableUntil||'','datetime-local',e?'disabled':'')}</div>${eveningButton('add-unavailable',L('Afwezigheid toevoegen','Add unavailable time'),e?'disabled':'')}${d.unavailable.map((interval,i)=>`<p>${niceDate(new Date(interval.start))} – ${niceDate(new Date(interval.end))} ${eveningButton('remove-unavailable',L('Verwijderen','Remove'),`data-index="${i}" ${e?'disabled':''}`,'ghost')}</p>`).join('')}${availability}<p class="hint">${L('Actief werk en aanwezigheid bij de oven worden gecontroleerd; passieve rust kan overlappen. De opruimbuffer telt niet nogmaals mee als deegrijs.','Active work and oven attendance are checked; passive rest may overlap. Cleanup is not counted again as dough proofing.')}</p></details><details id="eveningSplitDetails"><summary>${L('Verdelen over mixerbeurten','Split into mixer runs')}</summary><div class="workshop-grid"><label>${L('Capaciteit uitgedrukt in','Capacity expressed in')}<select class="field" id="splitUnit" ${e?'disabled':''}><option value="dough" ${(e?.template.split||d.split).unit==='dough'?'selected':''}>${L('Totaal deeg (g)','Total dough (g)')}</option><option value="flour" ${(e?.template.split||d.split).unit==='flour'?'selected':''}>${L('Bloem (g)','Flour (g)')}</option></select></label>${eveningField('splitCapacity',L('Bekende capaciteit (g; leeg = één beurt)','Known capacity (g; blank = one run)'),(e?.template.split||d.split).capacity,'number',`min="1" max="50000" ${e?'disabled':''}`)}</div>${split}</details>`);
}
function renderEveningCollection(){
  const templates=evenings.templates,history=evenings.history;
  const preview=eveningImport?`<div class="restore-preview"><h3>${eveningImport.kind==='backup'?L('Back-up herstellen','Restore backup'):L('Avondsjabloon toevoegen','Add evening template')}</h3><p>${esc(eveningImport.description)}</p>${eveningImport.kind==='backup'?`<p class="warning">${L('Dit vervangt alle lokale gegevens, ook een lopende avond. Download eventueel eerst je huidige back-up.','This replaces all local data, including a running evening. Download your current backup first if needed.')}</p>${eveningButton('backup',L('Huidige back-up downloaden','Download current backup'))}`:''}${eveningButton('confirm-import',L('Herstellen bevestigen','Confirm restore'))}${eveningButton('cancel-import',L('Annuleren','Cancel'),'','ghost')}</div>`:'';
  eveningPanel('eveningCollection',`<details id="eveningCollectionDetails"><summary>${L('Avonden bewaren, herhalen en overzetten','Save, repeat and transfer evenings')}</summary>${eveningField('eveningTemplateName',L('Naam voor deze avond','Name for this evening'),workshopDrafts.eveningTemplateName||'')}<div class="btnrow">${eveningButton('save-template',L('Als avondsjabloon bewaren','Save as evening template'))}${eveningButton('share-template',L('Avond delen (.json)','Share evening (.json)'))}</div><p class="hint">${L('Een sjabloon bewaart het recept, toppings, volgorde en materiaal. Nieuwe avonden beginnen zonder datum, metingen of voortgang. Gedeelde bestanden bevatten geen namen of privégeschiedenis.','A template keeps the recipe, toppings, order and equipment. New evenings start without a date, readings or progress. Shared files contain no names or private history.')}</p>${templates.map(t=>`<div class="collection-row"><b>${esc(t.name)}</b><div>${eveningButton('load-template',L('Opnieuw maken','Make again'),`data-id="${esc(t.id)}" ${activeEvening()?'disabled':''}`)}${eveningButton('delete-template',L('Verwijderen','Delete'),`data-id="${esc(t.id)}"`,'ghost')}</div></div>`).join('')}${history.length?`<details id="eveningHistory"><summary>${L('Eerdere avonden','Previous evenings')} (${history.length})</summary>${history.slice().reverse().map(e=>`<div class="collection-row"><span>${niceDate(new Date(e.createdAt))}<small>${e.legacyUnknownToppings?L('Oude batch · toppings onbekend','Legacy batch · toppings unknown'):L(`${e.pizzas.filter(p=>p.events.out!=null).length}/${e.pizzas.length} pizza’s uit oven geregistreerd`,`${e.pizzas.filter(p=>p.events.out!=null).length}/${e.pizzas.length} pizzas recorded out of oven`)}</small></span>${eveningButton('reopen-evening',L('Openen','Open'),`data-id="${esc(e.id)}" ${activeEvening()||e.legacyUnknownToppings?'disabled':''}`)}${eveningButton('repeat-evening',L('Opnieuw maken','Make again'),`data-id="${esc(e.id)}" ${activeEvening()||e.legacyUnknownToppings?'disabled':''}`)}</div>`).join('')}</details>`:''}<hr><div class="btnrow">${eveningButton('backup',L('Privéback-up downloaden','Download private backup'))}</div><label>${L('Sjabloon of privéback-up openen (.json)','Open template or private backup (.json)')}<input class="field" type="file" accept=".json,application/json" id="eveningImportFile"></label><p class="hint">${L('Een privéback-up bevat alle lokale gegevens, inclusief echte tijden, namen en notities. Herstel om op een ander apparaat verder te gaan; werk daarna op één apparaat. Dit is een momentopname, geen synchronisatie.','A private backup contains all local data, including actual times, names and notes. Restore it to continue on another device; then work on one device. This is a snapshot, not synchronization.')}</p>${preview}</details>`);
}
function applyEveningTemplate(template){
  if(activeEvening())return;
  const t=EveningCore.cleanTemplate(template);if(!t)throw new Error('format');
  // Unknown catalogue references must be resolved explicitly, never mapped to Margherita.
  const missing=t.pizzas.filter(p=>!pizzaRecipes.some(r=>r.id===p.recipeId));
  if(missing.length)throw new Error(L(`Onbekende recepten: ${missing.map(p=>p.snapshot.name).join(', ')}. Het sjabloon blijft bewaard; kies een beschikbaar recept voordat je het gebruikt.`,`Unknown recipes: ${missing.map(p=>p.snapshot.nameEn).join(', ')}. The template remains saved; choose an available recipe before using it.`));
  restoreRecipe(t.recipe,false);appMode=t.mode;projectEveningPizzas(t.pizzas);
  evenings.draft={pizzas:WorkflowCore.clone(t.pizzas).map(p=>({...p,id:workshopId(),events:{},runId:''})),date:'',earliest:'',unavailable:[],cleanup:0,split:WorkflowCore.clone(t.split)};
  workshop.storage=t.storage;workshop.scale=t.scale;
  if(t.profile){if(!workshop.profiles.some(p=>p.id===t.profile.id))workshop.profiles=[...workshop.profiles,t.profile].slice(-20);workshop.profileId=t.profile.id;}
  $('includeSauce').checked=t.sauce.enabled;$('autoSauceFromPizzas').checked=t.sauce.automatic;$('sauceType').value=t.sauce.type;$('saucePerPizza').value=t.sauce.grams;
  $('bakeDay').value='';liveMeasurements={doughTemp:null,fridgeTemp:null};completedSteps={};_livePlanCache={key:null,value:null};saveState();showPage(1);
}
function renderEvening(c){
  if(!$('eveningPlan'))return;
  syncEveningRun();syncEveningPizzas(c);renderEveningPlan(c);renderEveningCollection();renderKitchen(c);
  document.querySelectorAll('[data-workspace]').forEach(button=>{const selected=button.dataset.workspace===(currentWizardPage===4?'kitchen':'plan');button.classList.toggle('active',selected);button.setAttribute('aria-pressed',String(selected));button.textContent=button.dataset.workspace==='kitchen'?L('Keuken','Kitchen'):'Plan';});
  if($('instructionsSummary'))$('instructionsSummary').textContent=L('Alle instructies, tijdlijn en logboek','All instructions, timeline and logbook');
}
async function handleEveningAction(button){
  const action=button.dataset.eveningAction,e=activeEvening();eveningNotice='';
  if(['event-now','unknown-event','pizza-in','pizza-out'].includes(action)){if(Date.now()-_lastEveningTransition<500)return;_lastEveningTransition=Date.now();}
  if(action==='start')startEvening();
  else if(action==='go-kitchen')showPage(4);
  else if(action==='pizzas')showPage(3);
  else if(action==='sauces')showPage(2);
  else if(action==='ingredients')openIngredientsModal();
  else if(action==='event-now')recordEveningEvent(button.dataset.key,null);
  else if(action==='unknown-event')recordEveningEvent(button.dataset.key,null,true);
  else if(action==='correct-event'){workshopDrafts.eveningCorrectKey=button.dataset.key;workshopDrafts.eveningEventAt=localDateTime(activeBatch().events[button.dataset.key]??Date.now());renderKitchen(calc());}
  else if(action==='save-event-time'){const at=parseEveningTime($('eveningEventAt').value,$('eveningTimeFold').value);if(at===null)throw new Error('date');recordEveningEvent(workshopDrafts.eveningCorrectKey,at);delete workshopDrafts.eveningCorrectKey;renderKitchen(calc());}
  else if(action==='select-run'){syncEveningRun();const next=WorkflowCore.clone(e);next.selectedRun=button.dataset.id;commitEvening(next);}
  else if(action==='start-run')commitEvening(EveningCore.startRun(e,button.dataset.id,Date.now()));
  else if(action==='undo')commitEvening(EveningCore.undo(e));
  else if(action==='pizza-in'||action==='pizza-out')commitEvening(EveningCore.bake(e,button.dataset.id,action==='pizza-in'?'in':'out',Date.now()));
  else if(action==='pizza-up'||action==='pizza-down'){const next=EveningCore.movePizza(e,button.dataset.id,action==='pizza-up'?-1:1);projectEveningPizzas(next.pizzas);commitEvening(next);}
  else if(action==='pizza-edit'){const index=e.pizzas.findIndex(p=>p.id===button.dataset.id);if(index>=0&&e.pizzas[index].events.in==null)openPizzaPicker(index);}
  else if(action==='finish'){
    syncEveningRun();const previous=WorkflowCore.clone(evenings);const archived=EveningCore.close(e,Date.now());archived.template=captureEveningTemplate(e.name);evenings.history=[...evenings.history,archived].slice(-20);workshop.history=[...workshop.history,...archived.runs.filter(r=>r.batch).map(r=>r.batch)].slice(-20);evenings.active=null;workshop.batch=null;
    liveMeasurements={doughTemp:null,fridgeTemp:null};completedSteps={};evenings.draft.date='';$('bakeDay').value='';
    if(!saveState()){evenings=previous;bindEveningRun();throw new Error('storage');}
    eveningNotice=L('Avond bewaard. Niet gebakken pizza’s blijven als niet gebakken geregistreerd.','Evening saved. Unbaked pizzas remain recorded as unbaked.');showPage(1);
  }else if(action==='help'){
    const key=kitchenCurrentKey();workshopDrafts.helpStage=key==='bulkStart'?'mix':key==='bake'||!key?'open':'proof';
    renderDoughHelp();$('kitchenInstructions').open=true;$('doughHelpDetails').open=true;$('doughHelp').scrollIntoView({block:'center'});
  }else if(action==='start-timer'){
    const minutes=Number($('restTimerMinutes').value);if(!Number.isFinite(minutes)||minutes<1||minutes>1440)throw new Error(L('Kies 1–1440 minuten.','Choose 1–1440 minutes.'));
    const next=WorkflowCore.clone(e);next.timer={startedAt:Date.now(),endAt:Date.now()+minutes*60000,runId:e.selectedRun,label:'rest'};commitEvening(next);
  }else if(action==='stop-timer'){const next=WorkflowCore.clone(e);next.timer=null;commitEvening(next);}
  else if(action==='wake')await toggleEveningWake();
  else if(action==='calendar')exportEveningCalendar();
  else if(action==='add-unavailable'){
    if(e)return;const from=$('unavailableFrom').value,until=$('unavailableUntil').value,start=parseEveningTime(from,evenings.draft.fold),end=parseEveningTime(until,evenings.draft.fold);
    if(start===null||end===null||end<=start)throw new Error('date');if(evenings.draft.unavailable.length>=20)throw new Error(L('Maximaal 20 perioden.','At most 20 intervals.'));
    evenings.draft.unavailable.push({start,end});delete workshopDrafts.unavailableFrom;delete workshopDrafts.unavailableUntil;saveState();update();
  }else if(action==='remove-unavailable'){if(e)return;evenings.draft.unavailable.splice(Number(button.dataset.index),1);saveState();update();}
  else if(action==='apply-availability'){
    if(e)return;const tasks=eveningSchedule(calc()),minutes=Number(button.dataset.minutes),option=tasks&&EveningCore.alternatives(tasks,eveningConstraints()).find(o=>o.minutes===minutes);
    if(!option)throw new Error(L('Het voorstel is veranderd. Controleer opnieuw.','The proposal has changed. Review it again.'));
    evenings.draft.date=localDateTime(selectedBakeDate().getTime()+minutes*60000);$('bakeDay').value='';saveState();update();
  }else if(action==='save-template'){
    if(evenings.templates.length>=30)throw new Error('collection-full');const name=$('eveningTemplateName').value.trim();if(!name)throw new Error(L('Geef de avond een naam.','Give the evening a name.'));
    const template=captureEveningTemplate(name);if(!template)throw new Error('format');evenings.templates.push(template);if(!saveState()){evenings.templates.pop();throw new Error('storage');}eveningNotice=L('Avondsjabloon bewaard.','Evening template saved.');renderEvening(calc());
  }else if(action==='load-template')applyEveningTemplate(evenings.templates.find(t=>t.id===button.dataset.id));
  else if(action==='reopen-evening')reopenEvening(button.dataset.id);
  else if(action==='repeat-evening')applyEveningTemplate(evenings.history.find(h=>h.id===button.dataset.id)?.template);
  else if(action==='delete-template'){const previous=evenings.templates;evenings.templates=previous.filter(t=>t.id!==button.dataset.id);if(!saveState()){evenings.templates=previous;throw new Error('storage');}renderEvening(calc());}
  else if(action==='share-template'){
    const template=captureEveningTemplate($('eveningTemplateName').value||L('Pizza-avond','Pizza evening'));downloadEveningFile(EveningCore.exportTemplate(template),'pizza-evening.json');
    eveningNotice=L('Gedeeld: deeg, toppings, volgorde en materiaal. Namen, datums en echte momenten zijn weggelaten.','Shared: dough, toppings, order and equipment. Names, dates and actual checkpoints were omitted.');renderEvening(calc());
  }else if(action==='backup')downloadEveningFile({format:'pizza-private-backup',version:1,createdAt:Date.now(),appVersion:APP_VERSION,state:stateSnapshot()},'pizza-private-backup.json');
  else if(action==='cancel-import'){eveningImport=null;renderEveningCollection();}
  else if(action==='confirm-import'){
    if(!eveningImport)return;
    if(eveningImport.kind==='template'){
      if(evenings.templates.length>=30)throw new Error('collection-full');const t={...eveningImport.value,id:workshopId()};evenings.templates.push(t);if(!saveState()){evenings.templates.pop();throw new Error('storage');}
    }else restoreEveningBackup(eveningImport.value);
    eveningImport=null;eveningNotice=L('Bestand hersteld.','File restored.');update();
  }
}
function wireEveningEvents(){
  document.querySelectorAll('[data-workspace]').forEach(button=>button.addEventListener('click',()=>showPage(button.dataset.workspace==='kitchen'?4:1)));
  for(const id of eveningPanels){
    const root=$(id);if(!root)continue;
    root.addEventListener('click',async event=>{const button=event.target.closest('[data-evening-action]');if(!button||button.disabled)return;try{await handleEveningAction(button);}catch(error){eveningFailure(error);}});
    root.addEventListener('input',event=>{if(event.target.id)workshopDrafts[event.target.id]=event.target.value;});
    root.addEventListener('change',async event=>{
      const el=event.target;eveningNotice='';
      try{
        if(el.id==='eveningMode'){if(activeEvening())return;selectAppMode(el.value);update();}
        else if(['eveningBakeDate','eveningEarliest','planTimeFold','eveningCleanup','splitUnit','splitCapacity'].includes(el.id)){
          if(activeEvening())return;
          if(el.id==='eveningBakeDate'||el.id==='eveningEarliest'){
            if(el.value&&parseEveningTime(el.value,evenings.draft.fold)===null)throw new Error('date');evenings.draft[el.id==='eveningBakeDate'?'date':'earliest']=el.value;if(el.id==='eveningBakeDate')$('bakeDay').value='';
          }else if(el.id==='planTimeFold')evenings.draft.fold=el.value;
          else if(el.id==='eveningCleanup'){const value=Number(el.value);if(!Number.isFinite(value)||value<0||value>60)throw new Error(L('Gebruik 0–60 minuten.','Use 0–60 minutes.'));evenings.draft.cleanup=value;}
          else if(el.id==='splitUnit')evenings.draft.split.unit=el.value;
          else{const value=el.value===''?null:Number(el.value);if(value!==null&&(!Number.isFinite(value)||value<1||value>50000))throw new Error('capacity');evenings.draft.split.capacity=value;}
          saveState();update();
        }else if(el.id==='kitchenDoughTemp'){setLiveMeasurement('doughTemp',el.value);saveState();}
        else if(el.dataset.pizzaName){const e=WorkflowCore.clone(activeEvening()),p=e.pizzas.find(p=>p.id===el.dataset.pizzaName);if(p&&p.events.in==null){p.name=el.value.trim().slice(0,80);commitEvening(e);}}
        else if(el.id==='eveningGap'){const e=WorkflowCore.clone(activeEvening()),value=el.value===''?null:Number(el.value);if(value!==null&&(!Number.isFinite(value)||value<0||value>60))throw new Error(L('Gebruik 0–60 minuten.','Use 0–60 minutes.'));e.manualGap=value===null?null:value*60;commitEvening(e);}
        else if(el.id==='eveningImportFile'){
          const file=el.files?.[0];if(!file)return;if(file.size>2000000)throw new Error('format');let value;try{value=JSON.parse(await file.text());}catch{throw new Error('format');}
          if(value.format==='pizza-evening-template'){
            if(file.size>250000)throw new Error('format');const t=EveningCore.importTemplate(value);if(!t)throw new Error('format');eveningImport={kind:'template',value:t,description:`${t.name} · ${t.pizzas.length} ${L('pizza’s','pizzas')}`};
          }else{
            const candidate=validateEveningBackup(value);if(!candidate)throw new Error('format');eveningImport={kind:'backup',value:candidate,description:`${L('Gemaakt','Created')}: ${niceDate(new Date(value.createdAt))} · ${candidate.evenings.templates.length} ${L('sjablonen','templates')}, ${candidate.evenings.history.length} ${L('avonden','evenings')}${candidate.evenings.active?' · '+L('lopende avond','running evening'):''}`};
          }
          renderEveningCollection();
        }
      }catch(error){eveningFailure(error);}
    });
  }
  window.setInterval(renderEveningTimer,1000);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){renderEveningTimer();if(currentWizardPage===4&&activeEvening())renderKitchen(calc());}});
}
