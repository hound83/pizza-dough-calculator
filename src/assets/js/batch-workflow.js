let workshop=WorkflowCore.sanitize(null);
let workshopNotice='';
let workshopNoticeFor='batchPlanner';
let workshopNoticeAnchor='';
const BATCH_OVEN_FIELDS=new Set(['stoneTemp','preheatMinutes']);
const workshopDrafts={};
const workshopPanels=['batchPlanner','batchRunner','scalePlanner','coldStoragePlanner','recipeWorkbench','mixerProfiles','bakeComparison','doughHelp'];

function activeBatch(){return workshop.batch;}
function workshopId(){return `w-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`;}
function snapshotRecipe(){
  const fields={},checks={};
  for(const key of WorkflowCore.FIELD_IDS)fields[key]=$(key).value;
  for(const key of WorkflowCore.CHECK_FIELDS)checks[key]=$(key).checked;
  return WorkflowCore.recipe({fields,checks,method:currentMethod,exact:exactOverride,preset:$('preset').value});
}
function restoreRecipe(snapshot,preserveOven=!!activeBatch()&&snapshot===activeBatch().recipe){
  const r=WorkflowCore.recipe(snapshot);if(!r)return false;
  suppressCustom=true;
  for(const [key,value] of Object.entries(r.fields))if(!preserveOven||!BATCH_OVEN_FIELDS.has(key))$(key).value=value;
  for(const [key,value] of Object.entries(r.checks))$(key).checked=value;
  currentMethod=r.method;exactOverride=r.exact?{...r.exact}:null;
  $('preset').value=presets[r.preset]?r.preset:'custom';previousYeastType=r.fields.yeastType;
  suppressCustom=false;
  document.querySelectorAll('.method').forEach(button=>{const selected=button.dataset.method===currentMethod;button.classList.toggle('active',selected);button.setAttribute('aria-pressed',String(selected));});
  return true;
}
function captureBatchOven(){
  const b=activeBatch();if(!b)return;
  // Only baking preferences remain mutable; the dough and method stay fixed.
  // Keep them with the existing recipe so archive/reopen retains this batch's oven.
  for(const id of BATCH_OVEN_FIELDS){
    const el=$(id),value=Number(el.value);
    if(el.value.trim()!==''&&Number.isFinite(value)&&value>=Number(el.min)&&value<=Number(el.max))b.recipe.fields[id]=el.value;
  }
}
function enforceBatchRecipe(){
  const b=activeBatch();if(b)restoreRecipe(b.recipe);
  for(const id of [...WorkflowCore.FIELD_IDS,...WorkflowCore.CHECK_FIELDS,'preset','bakeDay','bakeTime']){
    const el=$(id);if(el)el.disabled=!!b&&!BATCH_OVEN_FIELDS.has(id);
  }
  document.querySelectorAll('.method').forEach(button=>{button.disabled=!!b;});
}
function localDateTime(value=Date.now()){
  const date=new Date(value),pad=n=>String(n).padStart(2,'0');
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
function parseLocalDateTime(value){
  if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))return null;
  const at=new Date(value).getTime();
  // A spring-forward nonexistent wall-clock time is not accepted as another hour.
  return Number.isFinite(at)&&localDateTime(at)===value?at:null;
}
function batchEventName(key){
  const b=activeBatch(),balls=b?.route==='coldBalls';
  return ({start:L('Deeg gestart','Dough started'),bulkStart:L('Afwerken klaar · bulk gestart','Finishing done · bulk started'),fridgeIn:balls?L('Opgebold · koelkast in','Shaped · into the fridge'):L('Koelkast in · bulk','Into the fridge · bulk'),fridgeOut:balls?L('Koelkast uit · opwarmen','Out of the fridge · warm up'):L('Koelkast uit · verdelen en opbollen','Out of the fridge · divide and shape'),shape:L('Opgebold · eindrijs gestart','Shaped · final proof started'),bake:L('Eerste pizza in de oven','First pizza in the oven')})[key]||key;
}
function batchMomentIsActual(key){
  const b=activeBatch();if(!b)return false;
  if(key==='shape'&&b.route!=='room')key=b.route==='coldBalls'?'fridgeIn':'fridgeOut';
  if(key==='ballStart')key=b.route==='room'?'shape':'fridgeOut';
  return b.events[key]!=null;
}
function observedBatchHours(){
  const b=activeBatch();if(!b)return null;
  const d=WorkflowCore.actualSchedule(b);
  return Object.fromEntries(['bulk','cold','ball'].map(key=>[key,b.route==='room'&&key==='cold'?0:WorkflowCore.phaseDone(b,key)?d[key]:null]));
}
function currentMixerProfile(){const b=activeBatch();return b?b.profile:workshop.profiles.find(p=>p.id===workshop.profileId)||null;}
function saveWorkshop(){saveState();update();}
function workshopError(error,panel=workshopNoticeFor,anchor=workshopNoticeAnchor){
  workshopNoticeFor=panel;workshopNoticeAnchor=anchor;
  const messages={future:L('Kies een werkelijk moment, uiterlijk nu.','Choose an actual time, no later than now.'),'missing-previous':L('Registreer eerst het voorafgaande moment.','Record the preceding checkpoint first.'),order:L('Dit moment moet tussen de vorige en volgende geregistreerde stap liggen.','This time must lie between the previous and next recorded checkpoint.'),duration:L('Gebruik geldige tijden: bulk en eindrijs 0–48 uur, koelkast 0–120 uur.','Use valid durations: bulk and final proof 0–48 hours, fridge 0–120 hours.'),completed:L('Een afgeronde fase blijft vaststaan. Corrigeer zo nodig het geregistreerde moment.','A completed phase stays fixed. Correct its recorded checkpoint if necessary.'),elapsed:L('De nieuwe totale faseduur is korter dan de tijd die al verstreken is.','The new total phase duration is shorter than the time already elapsed.')};
  workshopNotice=messages[error.message]||error.message;renderWorkshop(calc());
}
function startBatch(){
  if(activeBatch())return;
  normalizeStoredNumberInputs();
  const r=snapshotRecipe(),c=calc(),entered=$('batchStartAt')?.value||'';
  const startedAt=entered?parseLocalDateTime(entered):Date.now();
  if(startedAt==null||startedAt>Date.now()+60000)throw new Error('future');
  const bake=selectedBakeDate(),plan={preparation:prepHours(),bulk:c.bulk,cold:c.cold,ball:c.ball};
  const bakeAt=bake?.getTime()??startedAt+timelineTotalHours(c)*WorkflowCore.HOUR;
  if(bakeAt<=startedAt)throw new Error(L('Kies een baktijd ná je werkelijke start.','Choose a bake time after your actual start.'));
  if(!entered){liveMeasurements={doughTemp:null,fridgeTemp:null};completedSteps={};}
  workshop.batch=WorkflowCore.createBatch({id:workshopId(),recipe:r,startedAt,bakeAt,plan,profile:currentMixerProfile(),storage:workshop.storage,scale:workshop.scale});
  // Existing measurements/check marks can belong to an already-started batch.
  // Preserve them when the user records their actual start retrospectively.
  for(const kind of ['doughTemp','fridgeTemp']){
    const value=liveMeasurementValue(kind);workshop.batch.measurements[kind]=value;if(value!=null)workshop.batch.readings.push({kind,value,at:Date.now()});
  }
  workshopNotice='';resetBatchEventDraft();
  saveWorkshop();showPage(4);$('batchRunnerTitle')?.focus({preventScroll:true});
}
function resetBatchEventDraft(){
  const b=activeBatch(),key=WorkflowCore.eventKeys(b.route).find(x=>b.events[x]==null)||'bake';
  workshopDrafts.batchEventKey=key;workshopDrafts.batchEventAt=localDateTime(b.events[key]??Date.now());
  if($('batchEventKey'))$('batchEventKey').value=key;
  if($('batchEventAt'))$('batchEventAt').value=workshopDrafts.batchEventAt;
}
function recordBatchEvent(key,at){
  if(!activeBatch())return;
  workshop.batch=WorkflowCore.recordEvent(activeBatch(),key,at);
  workshopNotice='';resetBatchEventDraft();
  saveWorkshop();
}
function closeBatch(){
  const b=activeBatch();if(!b)return;
  captureBatchOven();
  workshop.history=[...workshop.history,{...WorkflowCore.clone(b),status:'finished'}].slice(-20);
  workshop.batch=null;liveMeasurements={doughTemp:null,fridgeTemp:null};completedSteps={};_livePlanCache={key:null,value:null};
  delete workshopDrafts.batchStartAt;
  $('bakeDay').value='';workshopNoticeFor='batchPlanner';workshopNoticeAnchor='';workshopNotice=L('Batch bewaard. Je kunt een nieuw plan maken.','Batch saved. You can make a new plan.');
  saveWorkshop();showPage(1);
}
function resumeBatch(id){
  if(activeBatch())return;
  const b=workshop.history.find(x=>x.id===id);if(!b)return;
  workshop.batch={...WorkflowCore.clone(b),status:'active'};workshop.history=workshop.history.filter(x=>x.id!==id);
  restoreRecipe(b.recipe,false);liveMeasurements={doughTemp:null,fridgeTemp:null};
  liveMeasurements={...b.measurements};
  completedSteps={...b.progress};resetBatchEventDraft();workshopNotice='';saveWorkshop();showPage(4);
}
function batchLivePlan(c){
  const b=activeBatch(),d=WorkflowCore.actualSchedule(b);
  const md=liveMeasurementValue('doughTemp'),mf=liveMeasurementValue('fridgeTemp');
  return {batch:true,active:md!=null||mf!=null,orig:{bulk:c.bulk,cold:c.cold,ball:c.ball},effective:{...c,bulk:d.bulk,cold:d.cold,ball:d.ball,doughTemp:md??c.doughTemp,fridge:mf??c.fridge},measuredDough:md,measuredFridge:mf,gasRatio:1,maturityRatio:1,gasError:0,changed:d.bulk!==c.bulk||d.cold!==c.cold||d.ball!==c.ball,stage:'tracked'};
}
function recordBatchMeasurement(kind,value){
  const b=activeBatch();if(!b)return;
  b.measurements[kind]=value;
  if(value!=null)b.readings=[...b.readings,{kind,value,at:Date.now()}].slice(-60);
}
function batchProposal(){return WorkflowCore.finalProofProposal(activeBatch(),calc(),{doughTemp:liveMeasurementValue('doughTemp'),fridgeTemp:liveMeasurementValue('fridgeTemp')},DoughCore);}
function batchProposalHtml(){
  const p=batchProposal();
  const reasons={'checkpoint-needed':L('Een verwacht overgangsmoment is verstreken. Registreer de werkelijke overgang, of verleng eerst de huidige fase; daarna kan het model de resterende eindrijs voorstellen.','An expected phase transition has passed. Record the actual transition, or extend the current phase first; the model can then propose remaining final proof.'),'no-measurement':L('Vul eerst een werkelijke deeg- of koelkasttemperatuur in het stappenplan in.','First enter an actual dough or fridge temperature in the workflow.'),deadband:L('De deegtemperatuur ligt binnen ±1 °C van het doel; het kamertemperatuurschema blijft staan.','Dough temperature is within ±1 °C of the target; the room-temperature schedule stays unchanged.'),'past-target':L('Het modeldoel lijkt al bereikt. Eerder verstreken tijd kan niet worden teruggedraaid: beoordeel het deeg nu.','The model target appears to have been reached already. Elapsed time cannot be undone: inspect the dough now.'),unreachable:L('Geen modeloplossing binnen 48 uur eindrijs. Gebruik dit niet als betrouwbaar tijdadvies.','No model solution within 48 hours of final proof. Do not treat this as reliable timing advice.'),completed:L('De bakstart is geregistreerd; het schema wordt niet meer aangepast.','The bake checkpoint is recorded; the schedule will no longer be adjusted.')};
  if(!p.ok)return `<p class="hint">${reasons[p.reason]}</p>`;
  return `<p>${L('Modelvoorstel voor de totale eindrijs','Model proposal for total final proof')}: <b>${durationLabel(p.ball)}</b> · ${L('nog ongeveer','roughly remaining')} ${durationLabel(p.remaining)}.</p><p class="hint">${L('Gebaseerd op gemeten temperaturen en geregistreerde fases. Dit evenaart alleen de geschatte gasontwikkeling, niet automatisch glutensterkte of smaak. Bulk en koelkast worden niet ingekort. De vaste baktijd blijft zichtbaar; vergelijk het deeg met de gereedheidskenmerken.','Based on measured temperatures and recorded phases. This only matches estimated gas development, not automatically gluten strength or flavour. Bulk and refrigeration are not shortened. The fixed bake target stays visible; compare the dough with the readiness cues.')}</p><button type="button" class="btn secondary" data-workshop-action="apply-proof">${L('Dit voorstel voor eindrijs gebruiken','Use this final-proof proposal')}</button>`;
}
function renderBatchTimeline(){
  const b=activeBatch();if(!b)return '';
  const t=WorkflowCore.timeline(b);
  const rows=WorkflowCore.eventKeys(b.route).map(key=>`<div class="timeitem"><b>${batchEventName(key)}<small>${t.actual[key]?L('Werkelijk geregistreerd','Actually recorded'):L('Verwacht','Expected')}</small></b><span>${niceDate(new Date(t.times[key]))}</span></div>`).join('');
  const offset=Math.abs(t.delta);
  return `<div class="batch-target"><span>${L('Vaste gewenste bakstart','Fixed requested bake time')}</span><strong>${niceDate(new Date(b.bakeAt))}</strong></div>${offset>1/60?`<p class="warning">${L('De huidige verwachting ligt','The current estimate is')} ${durationLabel(offset)} ${t.delta>0?L('ná','after'):L('vóór','before')} ${L('je gewenste bakstart. Er worden geen rust- of kneedstappen automatisch ingekort.','your requested bake time. No rest or kneading stages are automatically shortened.')}</p>`:''}${rows}<p class="hint">${L('Verwachte tijden schuiven mee met je werkelijke momenten. Een verstreken tijd betekent niet dat de stap is uitgevoerd. Afvinkvakjes registreren geen tijdstip.','Expected times follow your actual checkpoints. A time passing does not mean the step has happened. Checkboxes do not record timestamps.')}</p>`;
}
function renderBatchPanels(){
  const b=activeBatch();
  if(!b){
    const history=workshop.history.slice().reverse();
    const archive=history.length?`<details id="batchArchive"><summary>${L('Opgeslagen batches','Saved batches')} (${history.length})</summary><div class="workshop-list">${history.map(x=>`<div><span>${niceDate(new Date(x.events.start))} · ${x.events.bake?L('bakstart vastgelegd','bake checkpoint recorded'):L('nog niet afgebakken','not yet baked')}</span><button class="btn ghost" type="button" data-workshop-action="resume-batch" data-id="${esc(x.id)}">${L('Openen','Open')}</button></div>`).join('')}</div></details>`:'';
    replaceWorkshopPanel('batchPlanner',`<h3>${L('Van plan naar jouw batch','From plan to your batch')}</h3><p class="hint">${L('Start zodra je deeg gaat maken. Recept, mixer en bakdatum worden vastgezet. Een nieuwe batch begint met lege metingen en vinkjes; via “Al begonnen?” neem je ze juist over.','Start when you begin making dough. Recipe, mixer and bake date are fixed. A new batch clears measurements and checkmarks; use “Already started?” to retain them instead.')}</p><details id="batchStartDetails"><summary>${L('Al begonnen? Vul je werkelijke start in','Already started? Enter your actual start')}</summary><label for="batchStartAt">${L('Werkelijke start (lokale tijd; leeg = nu)','Actual start (local time; blank = now)')}</label><input class="field" type="datetime-local" id="batchStartAt" data-draft value="${esc(workshopDrafts.batchStartAt||'')}"></details><button class="btn" type="button" data-workshop-action="start-batch">${L('Start deze batch','Start this batch')}</button>${archive}`);
    replaceWorkshopPanel('batchRunner',`<h2 id="batchRunnerTitle" tabindex="-1">${L('Houd je batch bij','Track your batch')}</h2><p>${L('Zet dit recept vast om echte start-, koelkast- en bakmomenten te bewaren.','Fix this recipe to save actual start, fridge and bake checkpoints.')}</p><button class="btn" type="button" data-workshop-action="start-batch">${L('Start deze batch','Start this batch')}</button>`);
    return;
  }
  const keys=WorkflowCore.eventKeys(b.route),next=keys.find(key=>b.events[key]==null);
  const options=keys.filter(key=>b.events[key]!=null||key===next);
  const selected=options.includes(workshopDrafts.batchEventKey)?workshopDrafts.batchEventKey:(next||'bake');
  const phases=[['bulk',L('Bulk buiten','Bulk at room temperature')],...(b.route==='room'?[]:[['cold',L('Koelkast','Fridge')]]),['ball',L('Eindrijs / opwarmen','Final proof / warm-up')]];
  const note=`<p class="hint">${L('De deegvelden staan vast voor deze batch. Sluit de batch af om een nieuw recept te plannen.','Dough fields are fixed for this batch. Close the batch to plan a new recipe.')}</p>`;
  replaceWorkshopPanel('batchPlanner',`<h3>${L('Batch loopt · recept staat vast','Batch in progress · recipe fixed')}</h3><p><b>${L('Bakken','Bake')}: ${niceDate(new Date(b.bakeAt))}</b></p>${note}<button class="btn secondary" type="button" data-workshop-action="go-batch">${L('Naar de werkelijke momenten','Go to actual checkpoints')}</button>`);
  replaceWorkshopPanel('batchRunner',`<h2 id="batchRunnerTitle" tabindex="-1">${L('Jouw lopende batch','Your current batch')}</h2>${note}${next?`<p class="batch-next">${L('Volgende moment','Next checkpoint')}: <b>${batchEventName(next)}</b></p><button class="btn" type="button" data-workshop-action="record-now" data-key="${next}">${L('Dit moment nu vastleggen','Record this checkpoint now')}</button>`:`<p class="info">${L('Alle momenten zijn geregistreerd. Sla je bakresultaat hieronder op en sluit daarna de batch af.','All checkpoints are recorded. Save your bake result below, then close the batch.')}</p>`}<details id="batchEventDetails"><summary>${L('Eerder moment invullen of corrigeren','Enter or correct an earlier checkpoint')}</summary><div class="workshop-grid"><label>${L('Moment','Checkpoint')}<select class="field" id="batchEventKey" data-draft>${options.map(key=>`<option value="${key}" ${key===selected?'selected':''}>${batchEventName(key)}</option>`).join('')}</select></label><label>${L('Datum en tijd (lokaal)','Date and time (local)')}<input class="field" type="datetime-local" id="batchEventAt" data-draft value="${esc(workshopDrafts.batchEventAt||localDateTime(b.events[selected]??Date.now()))}"></label></div><button type="button" class="btn secondary" data-workshop-action="record-time">${L('Opgegeven moment bewaren','Save entered checkpoint')}</button><p class="hint">${L('Bij een dubbel uur tijdens de wintertijd kiest je browser de eerste voorkomst. Gebruik “nu vastleggen” voor het huidige moment.','During a repeated daylight-saving hour your browser chooses the first occurrence. Use “record now” for the current instant.')}</p></details><details id="batchTimingDetails"><summary>${L('Resterende tijden beoordelen','Review remaining times')}</summary>${batchProposalHtml()}<div class="workshop-grid">${phases.map(([key,label])=>`<label>${label} · ${L('totale fase (uur)','total phase (hours)')}<input class="field" type="number" id="batchHours-${key}" min="0" max="${key==='cold'?120:48}" step="0.25" value="${fieldNum(WorkflowCore.phaseDone(b,key)?WorkflowCore.actualSchedule(b)[key]:b.timings[key])}" ${WorkflowCore.phaseDone(b,key)?'disabled':''}></label>`).join('')}</div><p class="hint">${L('Dit zijn totale faseduren, inclusief reeds verstreken tijd. Afgeronde fases kun je hier niet wijzigen.','These are total phase durations, including elapsed time. Completed phases cannot be changed here.')}</p><button class="btn secondary" type="button" data-workshop-action="save-times">${L('Mijn resterende planning bewaren','Save my remaining plan')}</button></details><div class="btnrow"><button class="btn ghost" type="button" data-workshop-action="close-batch">${L('Batch bewaren en afsluiten','Save and close batch')}</button></div>`);
}

function replaceWorkshopPanel(id,html){
  const root=$(id),notice=id===workshopNoticeFor?workshopNotice:'';
  const noticeKey=JSON.stringify([notice,notice?workshopNoticeAnchor:'']);
  if(!root||(root._workshopHtml===html&&root._workshopNoticeKey===noticeKey))return;
  const newNotice=!!notice&&root._workshopNoticeKey!==noticeKey;
  const open=[...root.querySelectorAll('details[open]')].map(el=>el.id);
  const focused=document.activeElement,focusId=root.contains?.(focused)?focused.id:null;
  const focusValue=focusId&&focused.tagName==='INPUT'?focused.value:null;
  root.innerHTML=html;root._workshopHtml=html;root._workshopNoticeKey=noticeKey;
  for(const key of open){const el=$(key);if(el)el.open=true;}
  if(notice){
    const status=document.createElement('p');status.className='info workshop-notice';status.setAttribute('role','status');status.textContent=notice;
    const trigger=workshopNoticeAnchor?root.querySelector(workshopNoticeAnchor):null;
    const anchor=trigger?.closest('.btnrow')||trigger?.closest('label')||trigger;
    if(anchor)anchor.insertAdjacentElement('afterend',status);else root.prepend(status);
    if(newNotice)requestAnimationFrame(()=>status.scrollIntoView({block:'nearest'}));
  }
  if(focusId){const input=$(focusId);if(input){if(focusValue!==null)input.value=focusValue;input.focus({preventScroll:true});}}
}
function collectWorkshopDrafts(){
  for(const id of workshopPanels)for(const el of $(id)?.querySelectorAll('[data-draft]')||[])workshopDrafts[el.id]=el.value;
}
function renderWorkshop(c){
  if($('actualMixMinutesLabel'))$('actualMixMinutesLabel').textContent=L('Werkelijke machinetijd / actief kneden (min)','Actual machine time / active kneading (min)');
  collectWorkshopDrafts();renderBatchPanels();renderScalePlanner(c);renderColdStoragePlanner(c);renderRecipeWorkbench();renderMixerProfiles();renderBakeComparison();renderDoughHelp();
}
function wireWorkshopEvents(){
  for(const id of workshopPanels){
    const root=$(id);if(!root)continue;
    root.addEventListener('click',event=>{
      const button=event.target.closest('[data-workshop-action]');if(!button||button.disabled)return;
      collectWorkshopDrafts();workshopNotice='';workshopNoticeFor=id;workshopNoticeAnchor=`[data-workshop-action="${button.dataset.workshopAction}"]`;
      try{
        const action=button.dataset.workshopAction;
        if(action==='start-batch')startBatch();
        else if(action==='go-batch')showPage(4);
        else if(action==='record-now')recordBatchEvent(button.dataset.key,Date.now());
        else if(action==='record-time'){
          const at=parseLocalDateTime($('batchEventAt').value);if(at==null)throw new Error(L('Vul een bestaande lokale datum en tijd in.','Enter an existing local date and time.'));
          recordBatchEvent($('batchEventKey').value,at);
        }else if(action==='close-batch')closeBatch();
        else if(action==='resume-batch')resumeBatch(button.dataset.id);
        else if(action==='save-times'){
          const changes={};for(const key of ['bulk','cold','ball']){const input=$(`batchHours-${key}`);if(input&&!input.disabled&&String(input.value).trim()!=='')changes[key]=Number(input.value);}
          workshop.batch=WorkflowCore.reviseTimings(activeBatch(),changes);saveWorkshop();
        }else if(action==='apply-proof'){
          const p=batchProposal();if(!p.ok)throw new Error(L('Het voorstel is vervallen; beoordeel de actuele tijden opnieuw.','The proposal has expired; review the current times again.'));
          workshop.batch=WorkflowCore.reviseTimings(activeBatch(),{ball:p.ball});saveWorkshop();
        }else handleWorkshopAction(action,button);
      }catch(error){workshopError(error);}
    });
    root.addEventListener('change',event=>{
      const el=event.target;workshopNotice='';workshopNoticeFor=id;workshopNoticeAnchor=el.id?`#${el.id}`:'';
      if(el.dataset.draft!==undefined)workshopDrafts[el.id]=el.value;
      if(el.id==='batchEventKey'){delete workshopDrafts.batchEventAt;const b=activeBatch();$('batchEventAt').value=localDateTime(b?.events[el.value]??Date.now());return;}
      try{handleWorkshopChange(el);}catch(error){workshopError(error);}
    });
  }
  $('batchRunner').addEventListener('toggle',event=>{
    if(event.target.id==='batchTimingDetails'&&event.target.open&&event.target.isConnected)renderWorkshop(calc());
  },true);
}
