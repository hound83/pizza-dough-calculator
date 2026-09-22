function workshopInput(id,label,value,{type='text',min='',max='',step='',draft=true,disabled=false}={}){
  return `<label>${label}<input class="field" id="${id}" type="${type}" value="${esc(value??'')}" ${min!==''?`min="${min}"`:''} ${max!==''?`max="${max}"`:''} ${step!==''?`step="${step}"`:''} ${draft?'data-draft':''} ${disabled?'disabled':''} ${type==='text'?'maxlength="300"':''}></label>`;
}
function workshopSelect(id,label,options,value,{draft=false,disabled=false}={}){
  return `<label>${label}<select class="field" id="${id}" ${draft?'data-draft':''} ${disabled?'disabled':''}>${options.map(([key,text])=>`<option value="${esc(key)}" ${String(key)===String(value)?'selected':''}>${esc(text)}</option>`).join('')}</select></label>`;
}
function recipePlanSummary(recipe){return WorkflowCore.summary(recipe,Object.fromEntries(Object.entries(doughStyles).map(([key,value])=>[key,value.factor])),DoughCore);}
function mixerMethodName(method){return ({hand:L('Met de hand','By hand'),kitchenaid:'KitchenAid',kenwood:'Kenwood',pro:L('Spiraalkneder','Spiral mixer')})[method]||method;}

function renderScalePlanner(c){
  const scale=activeBatch()?.scale??workshop.scale,w=WorkflowCore.weighing(c.yeast,scale);
  const mixed=!!activeBatch()||liveMeasurementValue('doughTemp')!=null||liveMeasurementValue('fridgeTemp')!=null;
  replaceWorkshopPanel('scalePlanner',`<details id="scaleDetails"><summary>${L('Kan ik deze hoeveelheid gist goed afwegen?','Can I weigh this yeast dose reliably?')}</summary>${workshopSelect('yeastScale',L('Kleinste stap van je weegschaal','Smallest step on your scale'),[[1,'1 g'],[.1,`${fmt(.1,1)} g`],[.01,`${fmt(.01,2)} g`]],scale,{disabled:!!activeBatch()})}<p class="${w.tooCoarse?'warning':'info'}">${L('Recept','Recipe')}: <b>${fmt(c.yeast,2)} g</b>. ${L('Dichtstbijzijnde schaalstap','Nearest scale step')}: <b>${fmt(w.nearest,2)} g</b>${c.yeast>0?` (${L('verschil','difference')} ${fmt(w.delta,2)} g; ${L('een halve schaalstap is','half a scale step is')} ${fmt((w.relativeHalfStep||0)*100,0)}% ${L('van deze dosis','of this dose')})`:''}.</p><p class="hint">${w.tooCoarse?L('Deze schaal is grof voor deze kleine dosis. Gebruik bij voorkeur een fijnere weegschaal; met verse gist is de af te wegen hoeveelheid groter.','This scale is coarse for this small dose. Prefer a finer scale; fresh yeast requires a larger weighed amount.'):L('De schaalverdeling is bruikbaar voor deze hoeveelheid. Controleer ook de minimumlast en nauwkeurigheid van je eigen weegschaal.','The scale resolution is usable for this amount. Also check your scale’s minimum load and accuracy.')} ${L('Schaalverdeling is geen garantie op nauwkeurigheid. Dit advies verandert je recept niet automatisch.','Resolution does not guarantee accuracy. This advice does not automatically change your recipe.')}</p>${c.yeastType!=='fresh'?`<button class="btn secondary" type="button" data-workshop-action="fresh-yeast" ${mixed?'disabled':''}>${L('Recept omrekenen naar verse gist','Convert recipe to fresh yeast')}</button>`:''}</details>`);
}
function renderColdStoragePlanner(c){
  const s=activeBatch()?.storage||workshop.storage,capacity=WorkflowCore.capacity(c.pizzas,s),locked=!!activeBatch();
  replaceWorkshopPanel('coldStoragePlanner',`<details id="coldStorageDetails"><summary>${L('Past mijn deeg in de koelkast?','Will my dough fit in the fridge?')}</summary>${c.ferm==='room'?`<p class="hint">${L('Dit recept rijst volledig buiten de koelkast. De bakindeling blijft beschikbaar voor je volgende koude batch.','This recipe proofs entirely outside the fridge. Container settings remain available for your next cold batch.')}</p>`:''}<div class="workshop-grid">${workshopSelect('workshopColdRoute',L('Koude fermentatie in','Cold fermentation in'),[['bulk',L('Bulk · één deegmassa','Bulk · one dough mass')],['balls',L('Losse bollen','Individual balls')]],c.ferm==='coldBalls'?'balls':'bulk',{disabled:locked||c.ferm==='room'})}${workshopInput('storage-ballsPerBox',L('Bollen die ruim in één bak passen','Balls fitting comfortably in one box'),s.ballsPerBox,{type:'number',min:1,max:24,step:1,draft:false,disabled:locked})}${workshopInput('storage-boxes',L('Beschikbare bakken die in je koelkast passen','Available boxes that fit in your fridge'),s.boxes,{type:'number',min:1,max:24,step:1,draft:false,disabled:locked})}${workshopInput('storage-depth',L('Hoogte van je deegmassa (cm)','Depth of your dough mass (cm)'),s.depth,{type:'number',min:1,max:30,step:.5,draft:false,disabled:locked})}${workshopSelect('storage-layout',L('Plaatsing','Placement'),[['single',L('Naast elkaar','Side by side')],['stacked',L('Gestapeld','Stacked')]],s.layout,{disabled:locked})}${workshopSelect('storage-load',L('Koelkastbezetting','Fridge load'),[['normal',L('Ruimte rond de bakken','Space around the boxes')],['full',L('Vrij vol','Quite full')]],s.load,{disabled:locked})}</div><p class="${capacity.fits?'info':'warning'}">${L('Voor','For')} ${c.pizzas} ${L('bollen heb je','balls you need')} <b>${capacity.needed}</b> ${L('bak(ken) nodig','box(es)')}. ${capacity.fits?L('Volgens jouw invulling past dat.','According to your entries, they fit.'):L(`Je komt ${capacity.missing} bak(ken) tekort. Verklein de batch of regel meer passende bakken.`,`You are ${capacity.missing} box(es) short. Reduce the batch or arrange more boxes that fit.`)}</p><p class="hint">${L(`Bulkhoogte: ${fmt(s.depth,1)} cm. Het temperatuurmodel onderscheidt bulk en bollen, maar is niet gekalibreerd op jouw bakdiepte, stapeling of koelkastbelasting. Geef bollen ruimte om te rijzen en laat lucht rond de bakken circuleren. De temperatuur in het midden van deeg loopt achter op de koelkastlucht.`,`Bulk depth: ${fmt(s.depth,1)} cm. The temperature model distinguishes bulk and balls, but is not calibrated for your container depth, stacking or fridge load. Leave room for balls to rise and for air around the boxes. Dough core temperature lags behind fridge air.`)}</p>${s.layout==='stacked'||s.load==='full'?`<p class="warning">${L('Gestapelde bakken of een volle koelkast maken de geschatte koeltijd minder overdraagbaar. Meet de koelkast bij het deeg; gebruik de geplande koelkasttijd niet als bewijs dat de deegkern al op temperatuur is.','Stacked boxes or a full fridge make the estimated cooling time less transferable. Measure the fridge near the dough; planned refrigeration time does not prove the dough core has reached that temperature.')}</p>`:''}</details>`);
}
function renderRecipeWorkbench(){
  const recipes=workshop.recipes,current=snapshotRecipe();if(!current)return;
  const options=[['current',L('Huidig plan','Current plan')],...recipes.map(r=>[r.id,r.name])];
  const find=key=>recipes.find(r=>r.id===key)?.recipe||current;
  const a=options.some(([key])=>key===workshopDrafts.comparePlanA)?workshopDrafts.comparePlanA:'current';
  const b=options.some(([key])=>key===workshopDrafts.comparePlanB)?workshopDrafts.comparePlanB:(recipes[0]?.id||'current');
  const sa=recipePlanSummary(find(a)),sb=recipePlanSummary(find(b));
  const method=r=>mixerMethodName(r.method);
  const route=s=>s.ferm==='room'?L('Kamer','Room'):s.ferm==='coldBalls'?L('Koelkast · bollen','Fridge · balls'):L('Koelkast · bulk','Fridge · bulk');
  const rows=[
    [L('Aantal bollen','Dough balls'),sa.pizzas,sb.pizzas],
    [L('Bloem','Flour'),`${fmt(sa.flour,1)} g`,`${fmt(sb.flour,1)} g`],
    [L('Water','Water'),`${fmt(sa.water,1)} g`,`${fmt(sb.water,1)} g`],
    [L('Zout','Salt'),`${fmt(sa.salt,1)} g`,`${fmt(sb.salt,1)} g`],
    [L('Gist','Yeast'),`${fmt(sa.yeast,2)} g ${yeastName(sa.yeastType)}`,`${fmt(sb.yeast,2)} g ${yeastName(sb.yeastType)}`],
    [L('Werkelijke hydratatie','Actual hydration'),`${fmt(sa.actualH,2)}%`,`${fmt(sb.actualH,2)}%`],
    [L('Methode','Method'),method(find(a)),method(find(b))],
    [L('Koelkastroute','Fridge route'),route(sa),route(sb)],
    [L('Kamer / koelkast','Room / fridge'),`${fmt(sa.room,1)} / ${fmt(sa.fridge,1)} °C`,`${fmt(sb.room,1)} / ${fmt(sb.fridge,1)} °C`],
    ...[['preparation',L('Bereiding','Preparation')],['bulk',L('Bulk','Bulk')],['cold',L('Koelkast','Fridge')],['ball',L('Eindrijs','Final proof')]].map(([key,label])=>[label,durationLabel(sa[key]),durationLabel(sb[key])]),
    [L('Totale doorlooptijd','Total lead time'),durationLabel(sa.preparation+sa.bulk+sa.cold+sa.ball),durationLabel(sb.preparation+sb.bulk+sb.cold+sb.ball)]
  ];
  replaceWorkshopPanel('recipeWorkbench',`<details id="recipeWorkbenchDetails"><summary>${L('Eigen deegrecepten & plannen vergelijken','My dough recipes & plan comparison')}</summary><p class="hint">${L('Bewaar een deegrecept met mengmethode en fermentatieschema. De bakdatum, temperatuurmetingen, privénotities en pizzatoppings worden niet meegenomen.','Save a dough recipe with its mixing method and fermentation schedule. Bake date, temperature readings, private notes and pizza toppings are not included.')}</p>${workshopInput('savedRecipeName',L('Naam voor dit deegrecept','Name for this dough recipe'),workshopDrafts.savedRecipeName||'')}<div class="btnrow"><button class="btn secondary" type="button" data-workshop-action="save-recipe">${L('Huidig recept bewaren','Save current recipe')}</button><button class="btn ghost" type="button" data-workshop-action="export-recipe">${L('Receptbestand downloaden','Download recipe file')}</button></div><label>${L('Receptbestand importeren (.json, max. 50 kB)','Import recipe file (.json, max. 50 kB)')}<input class="field" type="file" accept=".json,application/json" id="importRecipeFile"></label>${recipes.length?`<div class="workshop-list">${recipes.map(r=>`<div><b>${esc(r.name)}</b><span><button type="button" class="btn secondary" data-workshop-action="load-recipe" data-id="${esc(r.id)}" ${activeBatch()?'disabled':''}>${L('Als nieuw plan laden','Load as new plan')}</button><button type="button" class="btn ghost" data-workshop-action="delete-recipe" data-id="${esc(r.id)}" aria-label="${esc(L('Verwijder','Delete')+' '+r.name)}">${L('Verwijderen','Delete')}</button></span></div>`).join('')}</div>`:''}<p class="hint">${L('Laden begint een nieuwe planning en wist de huidige metingen en vinkjes. Opgeslagen bakresultaten blijven behouden.','Loading starts a new plan and clears current measurements and checkmarks. Saved bake results are retained.')}</p><h3>${L('Twee plannen naast elkaar','Two plans side by side')}</h3><div class="workshop-grid">${workshopSelect('comparePlanA',L('Plan A','Plan A'),options,a,{draft:true})}${workshopSelect('comparePlanB',L('Plan B','Plan B'),options,b,{draft:true})}</div>${workshopTable([L('Eigenschap','Property'),'A','B'],rows)}<p class="hint">${L('Vergelijking van de opgeslagen recepten vóór temperatuurcorrecties. Gelijke tijden en gist betekenen niet automatisch een gelijk bakresultaat.','Comparison of stored recipes before temperature corrections. Equal times and yeast do not automatically mean an equal bake result.')}</p></details>`);
}
function workshopTable(headings,rows){
  return `<div class="workshop-table-wrap"><table class="workshop-table"><thead><tr>${headings.map(x=>`<th scope="col">${esc(x)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map((x,index)=>index===0?`<th scope="row">${esc(x)}</th>`:`<td>${esc(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

function renderMixerProfiles(){
  const selected=currentMixerProfile(),locked=!!activeBatch();
  const options=[['',L('Geen profiel gekozen','No profile selected')],...workshop.profiles.map(p=>[p.id,p.name])];
  replaceWorkshopPanel('mixerProfiles',`<details id="mixerProfileDetails"><summary>${L('Mijn mixer, haak & programma','My mixer, hook & programme')}</summary>${workshopSelect('mixerProfileChoice',L('Opgeslagen profiel','Saved profile'),options,locked?(selected?.id||''):workshop.profileId,{disabled:locked})}${selected?`<p class="info"><b>${esc(selected.name)}</b> · ${esc(selected.model||mixerMethodName(selected.method))} · ${esc(selected.hook||L('Haak niet ingevuld','Hook not entered'))}<br>${esc(selected.programme||L('Programma volgens het stappenplan','Programme follows the workflow'))}</p>`:''}<p class="hint">${L('Een spiraalhaak op een KitchenAid blijft de KitchenAid-methode. Alleen een echte spiraalkneder gebruikt de spiraalkneder-methode. Dit profiel registreert je materiaal; het verandert geen mixtijden of warmteconstanten.','A spiral hook on a KitchenAid still uses the KitchenAid method. Only an actual spiral mixer uses the spiral-mixer method. This profile records your equipment; it does not change mixing times or thermal constants.')}</p><div class="workshop-grid">${workshopInput('profileName',L('Profielnaam','Profile name'),workshopDrafts.profileName||'',{disabled:locked})}${workshopInput('profileModel',L('Exact mixermodel','Exact mixer model'),workshopDrafts.profileModel||'',{disabled:locked})}${workshopInput('profileHook',L('Haak / hulpstuk','Hook / attachment'),workshopDrafts.profileHook||'',{disabled:locked})}${workshopInput('profileProgramme',L('Programmanotitie (referentie)','Programme note (reference)'),workshopDrafts.profileProgramme||'',{disabled:locked})}</div><p class="hint">${L('Het nieuwe profiel hoort bij de hierboven gekozen methode','The new profile belongs to the method selected above')}: <b>${mixerMethodName(currentMethod)}</b>.</p><button class="btn secondary" type="button" data-workshop-action="save-profile" ${locked?'disabled':''}>${L('Als nieuw profiel bewaren','Save as a new profile')}</button>${selected&&!locked?`<button class="btn ghost" type="button" data-workshop-action="delete-profile">${L('Dit profiel verwijderen','Delete this profile')}</button>`:''}</details>`);
}
function renderBakeComparison(){
  const entries=bakeLog.map((value,index)=>({value,index})).reverse();
  const options=entries.map(({value,index})=>[String(index),`${new Date(value.ts).toLocaleDateString(currentLang==='en'?'en-GB':'nl-NL')} · ${value.profile?.name||mixerMethodName(value.method)} · ${fmt(value.flour||0,0)} g`]);
  let compare=`<p class="hint">${L('Sla minstens twee bakresultaten op om ze te vergelijken.','Save at least two bake results to compare them.')}</p>`;
  if(entries.length>=2){
    const a=options.some(([key])=>key===workshopDrafts.compareBakeA)?workshopDrafts.compareBakeA:options[0][0];
    const b=options.some(([key])=>key===workshopDrafts.compareBakeB)?workshopDrafts.compareBakeB:options[1][0];
    const av=bakeLog[Number(a)],bv=bakeLog[Number(b)];
    const value=(x,key,unit,dec=1)=>x[key]==null?'—':`${fmt(x[key],dec)}${unit}`;
    const rows=[
      [L('Mixerprofiel','Mixer profile'),av.profile?.name||mixerMethodName(av.method),bv.profile?.name||mixerMethodName(bv.method)],
      [L('Model / haak','Model / hook'),[av.profile?.model,av.profile?.hook].filter(Boolean).join(' · ')||'—',[bv.profile?.model,bv.profile?.hook].filter(Boolean).join(' · ')||'—'],
      ...[['flour',L('Bloem','Flour'),' g'],['totalDough',L('Deegmassa','Dough mass'),' g'],['hydration',L('Hydratatie','Hydration'),'%'],['mixMinutes',L('Werkelijk gemixt','Actually mixed'),' min'],['waterTemp',L('Werkelijk hoofdwater','Actual main water'),' °C'],['finalDoughTemp',L('Gemeten na kneden','Measured after kneading'),' °C'],['room',L('Kamer','Room'),' °C'],['fridgeTempActual',L('Gemeten koelkast','Measured fridge'),' °C']].map(([key,label,unit])=>[label,value(av,key,unit),value(bv,key,unit)]),
      [L('Autolyse','Autolyse'),av.autolyse==null?'—':av.autolyse?L('30 min koud','30 min cold'):L('Directe route','Direct route'),bv.autolyse==null?'—':bv.autolyse?L('30 min koud','30 min cold'):L('Directe route','Direct route')],
      [L('Koelkastroute','Fridge route'),av.route==null?'—':av.route==='room'?L('Kamer','Room'):av.route==='coldBalls'?L('Bollen','Balls'):L('Bulk','Bulk'),bv.route==null?'—':bv.route==='room'?L('Kamer','Room'):bv.route==='coldBalls'?L('Bollen','Balls'):L('Bulk','Bulk')],
      ...[['bulk',L('Werkelijke bulk','Actual bulk')],['cold',L('Werkelijk in koelkast','Actual refrigeration')],['ball',L('Werkelijke eindrijs','Actual final proof')]].map(([key,label])=>[label,av.observedHours?.[key]==null?'—':durationLabel(av.observedHours[key]),bv.observedHours?.[key]==null?'—':durationLabel(bv.observedHours[key])]),
      [L('Uitkomst','Outcome'),ratingLabel(av.rating),ratingLabel(bv.rating)]
    ];
    compare=`<div class="workshop-grid">${workshopSelect('compareBakeA',L('Bak A','Bake A'),options,a,{draft:true})}${workshopSelect('compareBakeB',L('Bak B','Bake B'),options,b,{draft:true})}</div>${workshopTable([L('Meting','Measurement'),'A','B'],rows)}`;
  }
  replaceWorkshopPanel('bakeComparison',`<details id="bakeComparisonDetails"><summary>${L('Bakes en mixerprofielen vergelijken','Compare bakes and mixer profiles')}</summary>${compare}<p class="hint">${L('Vergelijk bij voorkeur dezelfde bloem, hydratatie, batchgrootte, rustroute en mengstappen. Verschillen zijn waarnemingen, geen automatische kalibratie of bewijs dat langer kneden beter is.','Prefer comparisons with the same flour, hydration, batch size, rest route and mixing stages. Differences are observations, not automatic calibration or evidence that longer kneading is better.')}</p></details>`);
}

function renderDoughHelp(){
  const stage=['mix','proof','open'].includes(workshopDrafts.helpStage)?workshopDrafts.helpStage:'mix';
  const symptom=['tear','recoil','cold','slack','slow'].includes(workshopDrafts.helpSymptom)?workshopDrafts.helpSymptom:'tear';
  const advice={
    tear:stage==='mix'?L('Laat na het bestaande kneedprogramma 5 minuten afgedekt rusten en probeer opnieuw een windowpane. Is het deeg daarna nog duidelijk zwak? Gebruik het bestaande herstelpad: 6–10 rustige duw-vouw-draaibewegingen, 5–10 minuten rust, opnieuw beoordelen. Voeg niet automatisch extra machinetijd toe.','After the existing kneading programme, rest covered for 5 minutes and try a windowpane again. Still clearly weak? Use the existing recovery path: 6–10 gentle push-fold-turn movements, rest 5–10 minutes, reassess. Do not automatically add machine time.'):L('Controleer eerst of de bol nog koud of strak is en geef zo nodig afgedekte ontspanning. Open rustig vanuit het midden. Een rijpe, gasrijke bol opnieuw lang kneden herstelt niet automatisch zijn structuur. Scheuren alleen bewijst geen onvoldoende kneden.','First check whether the ball is still cold or tight and allow covered relaxation if needed. Open gently from the centre. Long kneading of a mature, gas-filled ball does not automatically restore its structure. Tearing alone does not prove insufficient kneading.'),
    recoil:L('Sterk terugveren kan bij een koud of nog strak deeg passen. Geef afgedekte ontspanning en controleer de deegtemperatuur voordat je harder trekt. Extra kneden is hier geen vanzelfsprekende oplossing. Kijk daarnaast naar luchtigheid en de totale rijsontwikkeling.','Strong recoil can fit cold or still-tight dough. Allow covered relaxation and check dough temperature before pulling harder. Extra kneading is not an automatic solution. Also assess aeration and overall proof development.'),
    cold:L('Koelkastlucht en deegkern zijn niet direct even warm. Laat afgedekt opwarmen en controleer zowel de kerntemperatuur als soepelheid en rijs. “Warm genoeg” alleen betekent niet “voldoende gerezen”; een vaste universele opwarmtijd is niet betrouwbaar. Pas zo nodig alleen de resterende eindrijs aan.','Fridge air and dough core do not immediately share a temperature. Warm covered and check core temperature, pliability and proof development. “Warm enough” alone does not mean “proofed enough”; a universal fixed warm-up time is unreliable. Adjust only remaining final proof if needed.'),
    slack:L('Wordt het deeg tijdens de rijs steeds slapper en houdt het weinig spanning? Dat kan passen bij te ver gerezen of verzwakt deeg, maar ook bloem en hydratatie spelen mee. Voeg niet automatisch meer warme rust of machinetijd toe. Beoordeel het deeg nu, behandel voorzichtig en bak eventueel eerder of gebruik een bakvorm. Noteer het verloop voor je volgende batch.','Does dough become progressively slacker during proof and hold little tension? This can fit overproofed or weakened dough, while flour and hydration also matter. Do not automatically add warm rest or machine time. Inspect it now, handle gently and consider baking earlier or using a pan. Record the progression for your next batch.'),
    slow:L('Weinig volume kan passen bij koud deeg, weinig gistactiviteit of een deeg dat gas minder goed vasthoudt. Controleer temperatuur, gistsoort en de werkelijk afgewogen hoeveelheid. Voeg geen gist toe aan deze gemengde batch. Geef alleen meer eindrijs als de deegsterkte dat toelaat en controleer opnieuw op luchtigheid en ontspanning.','Low volume can fit cold dough, low yeast activity or dough that retains gas poorly. Check temperature, yeast type and the actual weighed dose. Do not add yeast to this mixed batch. Allow more final proof only if dough strength permits, then reassess aeration and relaxation.')
  };
  replaceWorkshopPanel('doughHelp',`<details id="doughHelpDetails"><summary>${L('Mijn deeg reageert anders — wat nu?','My dough behaves differently — what now?')}</summary><div class="workshop-grid">${workshopSelect('helpStage',L('Waar ben je?','Which stage are you at?'),[['mix',L('Na kneden','After kneading')],['proof',L('Tijdens rijs / opwarmen','During proof / warm-up')],['open',L('Tijdens openen','While opening')]],stage,{draft:true})}${workshopSelect('helpSymptom',L('Wat zie je vooral?','What do you mainly see?'),[['tear',L('Het scheurt snel','It tears easily')],['recoil',L('Het veert sterk terug','It recoils strongly')],['cold',L('Het voelt nog koud','It still feels cold')],['slack',L('Het wordt steeds slapper','It becomes progressively slack')],['slow',L('Er is weinig volumeontwikkeling','There is little volume increase')]],symptom,{draft:true})}</div><div class="info" id="doughHelpAdvice">${advice[symptom]}</div><p class="hint">${L('Dit helpt je beoordelen; één symptoom geeft geen zekere diagnose. Het bestaande kneedprogramma blijft staan. Bij sterke machinebelasting of oververhitting pauzeren en de handleiding volgen.','This helps assessment; one symptom does not give a certain diagnosis. The existing kneading programme is retained. Pause for excessive mixer load or overheating and follow the manual.')}</p></details>`);
}

function handleWorkshopAction(action,button){
  if(action==='save-recipe'){
    const name=String($('savedRecipeName').value||'').trim().slice(0,80);
    if(!name)throw new Error(L('Geef je recept eerst een naam.','Give your recipe a name first.'));
    if(workshop.recipes.length>=30)throw new Error(L('Er passen 30 recepten in je verzameling. Verwijder eerst een recept.','Your collection holds 30 recipes. Delete a recipe first.'));
    const recipe=snapshotRecipe();if(!recipe)throw new Error(L('Controleer de deegvelden voordat je opslaat.','Check the dough fields before saving.'));
    workshop.recipes.push({id:workshopId(),name,recipe});workshopNotice=L('Deegrecept opgeslagen.','Dough recipe saved.');saveWorkshop();
  }else if(action==='load-recipe'){
    if(activeBatch())return;
    const saved=workshop.recipes.find(r=>r.id===button.dataset.id);if(!saved)return;
    restoreRecipe(saved.recipe);liveMeasurements={doughTemp:null,fridgeTemp:null};completedSteps={};_livePlanCache={key:null,value:null};$('bakeDay').value='';
    if(currentMixerProfile()?.method!==currentMethod)workshop.profileId='';
    workshopNotice=L('Recept als nieuwe planning geladen.','Recipe loaded as a new plan.');saveWorkshop();
  }else if(action==='delete-recipe'){
    workshop.recipes=workshop.recipes.filter(r=>r.id!==button.dataset.id);saveWorkshop();
  }else if(action==='export-recipe'){
    const content=WorkflowCore.exportRecipe($('savedRecipeName').value||L('Mijn pizzadeeg','My pizza dough'),snapshotRecipe());
    const url=URL.createObjectURL(new Blob([JSON.stringify(content,null,2)],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download='pizza-dough-recipe.json';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }else if(action==='fresh-yeast'){
    if(activeBatch()||liveMeasurementValue('doughTemp')!=null||liveMeasurementValue('fridgeTemp')!=null)return;
    const old=$('yeastType').value;$('yeastType').value='fresh';applyYeastTypeConversion(old,'fresh');markCustom(false);saveWorkshop();
  }else if(action==='save-profile'){
    if(activeBatch())return;
    const profile=WorkflowCore.profile({id:workshopId(),name:$('profileName').value,method:currentMethod,model:$('profileModel').value,hook:$('profileHook').value,programme:$('profileProgramme').value});
    if(!profile)throw new Error(L('Geef je mixerprofiel een naam.','Give your mixer profile a name.'));
    if(workshop.profiles.length>=20)throw new Error(L('Verwijder eerst een profiel; je kunt er 20 bewaren.','Delete a profile first; you can save 20.'));
    workshop.profiles.push(profile);workshop.profileId=profile.id;saveWorkshop();
  }else if(action==='delete-profile'){
    if(activeBatch())return;
    workshop.profiles=workshop.profiles.filter(p=>p.id!==workshop.profileId);workshop.profileId='';saveWorkshop();
  }
}
function handleWorkshopChange(el){
  if(el.id==='yeastScale'){
    if(activeBatch())return;workshop.scale=Number(el.value);saveWorkshop();
  }else if(el.id==='workshopColdRoute'){
    if(activeBatch())return;$('coldStorageMode').value=el.value;markCustom(false);saveWorkshop();
  }else if(el.id.startsWith('storage-')){
    if(activeBatch())return;
    const key=el.id.slice(8),numeric=['depth','boxes','ballsPerBox'].includes(key),value=numeric?Number(el.value):el.value;
    if(numeric&&(!el.value.trim()||!Number.isFinite(value)||value<Number(el.min)||value>Number(el.max)))throw new Error(L('Vul een waarde binnen de aangegeven grenzen in.','Enter a value within the indicated bounds.'));
    workshop.storage=WorkflowCore.storage({...workshop.storage,[key]:value});saveWorkshop();
  }else if(el.id==='mixerProfileChoice'){
    if(activeBatch())return;
    workshop.profileId=el.value;const profile=currentMixerProfile();if(profile)setMethod(profile.method);saveWorkshop();
  }else if(['comparePlanA','comparePlanB','compareBakeA','compareBakeB','helpStage','helpSymptom'].includes(el.id))renderWorkshop(calc());
  else if(el.id==='importRecipeFile'){
    const file=el.files?.[0];if(!file)return;
    if(file.size>50000)throw new Error(L('Receptbestand is groter dan 50 kB.','Recipe file is larger than 50 kB.'));
    file.text().then(text=>{
      try{
        let parsed=null;try{parsed=JSON.parse(text);}catch{}
        const imported=WorkflowCore.importRecipe(parsed);
        if(!imported)throw new Error(L('Dit is geen geldig deegreceptbestand voor deze versie.','This is not a valid dough recipe file for this version.'));
        if(workshop.recipes.length>=30)throw new Error(L('Je hebt al 30 opgeslagen recepten.','You already have 30 saved recipes.'));
        workshop.recipes.push({id:workshopId(),...imported});workshopNoticeFor='recipeWorkbench';workshopNoticeAnchor='#importRecipeFile';workshopNotice=L('Recept als eigen profiel geïmporteerd. Je kunt het vergelijken of als nieuw plan laden.','Recipe imported as a custom profile. You can compare it or load it as a new plan.');saveWorkshop();
      }catch(error){workshopError(error,'recipeWorkbench','#importRecipeFile');}
    }).catch(()=>workshopError(new Error(L('Het bestand kon niet worden gelezen.','The file could not be read.')),'recipeWorkbench','#importRecipeFile'));
  }
}
