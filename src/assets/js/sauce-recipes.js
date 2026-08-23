function aggregatePizzaCounts(){
  ensurePizzaSelections();
  const counts={};
  pizzaSelections.forEach(id=>counts[id]=(counts[id]||0)+1);
  return counts;
}

// Hoeveel saus je MAAKT is iets anders dan hoeveel je KOOPT.
// Vroeger werd de te maken batch afgerond op hele blikken van 400 g, waardoor
// je voor een enkele Margherita een recept voor 400 g saus kreeg.
// Nu wordt alleen de inkoop op blikken afgerond; de batch volgt de behoefte,
// met een kleine praktische marge en correctie voor kookverlies.
function sauceBatchFor(s,need){
  const yieldFactor=(s.cooked && s.yield)?s.yield:1;
  const raw=need/yieldFactor;                       // rauwe tomaat vóór inkoken
  const batch=Math.max(s.tomato?120:need, roundTo(raw*1.06,5));
  const tins=s.tomato?Math.max(1,Math.ceil(batch/400)):0;
  return {batch,tins,buy:tins?tins*400:batch,yieldFactor};
}

function tomatoPurchaseFor(groups){
  const tomatoGroups=groups.filter(g=>g.s?.tomato);
  if(!tomatoGroups.length)return null;
  // De afzonderlijke sauzen houden hun eigen maakbatch en recept. Alleen de
  // gedeelde inkoop van tomaten wordt samengevoegd, zodat drie kleine sauzen
  // niet automatisch drie vrijwel lege blikken veroorzaken.
  const batch=tomatoGroups.reduce((sum,g)=>sum+g.batch,0);
  const tins=Math.max(1,Math.ceil(batch/400));
  return {batch,tins,buy:tins*400,groupCount:tomatoGroups.length,types:tomatoGroups.map(g=>g.type)};
}
function sauceAggregationResult(groups){
  return {enabled:true,groups,tomatoPurchase:tomatoPurchaseFor(groups)};
}
function defaultSaucePerPizza(type){
  const key=sauces[type]?type:'sanMarzano';
  return Math.max(1,Math.round(sauces[key].perPizza*toppingScale));
}
function manualSaucePerPizza(){
  const type=sauces[$('sauceType').value]?$('sauceType').value:'sanMarzano';
  return boundedNum('saucePerPizza',defaultSaucePerPizza(type));
}
function refreshManualSaucePlaceholder(){
  const el=$('saucePerPizza');
  if(!el)return;
  el.placeholder=String(defaultSaucePerPizza($('sauceType').value));
}
function usesCombinedTomatoPurchase(agg){
  return !!(agg?.tomatoPurchase && agg.tomatoPurchase.groupCount>1);
}
function tomatoPurchaseRowHtml(agg){
  if(!usesCombinedTomatoPurchase(agg))return '';
  const p=agg.tomatoPurchase;
  return `<div class="list-row"><span>${L('Tomaten totaal inkopen','Total tomatoes to buy')}</span><span>${fmt(p.batch,0)} g ${L('nodig','needed')} • ${p.tins}× 400 g</span></div>`;
}
function tomatoPurchaseCopyLine(agg){
  if(!usesCombinedTomatoPurchase(agg))return '';
  const p=agg.tomatoPurchase;
  return `• ${copyLang('Tomaten totaal inkopen','Total tomatoes to buy')}: ${fmt(p.batch,0)} g ${copyLang('nodig','needed')} • ${p.tins}x 400 g`;
}

function aggregateSauceNeeds(c){
  if(appMode==='dough' || !$('includeSauce').checked) return {enabled:false,groups:[],tomatoPurchase:null};

  // In Deeg + saus is de saus bewust losgekoppeld van pizzarecepten.
  if(appMode==='sauce' || !$('autoSauceFromPizzas').checked){
    const type=sauces[$('sauceType').value]?$('sauceType').value:'sanMarzano';
    const s=sauces[type];
    const per=manualSaucePerPizza();
    const count=Math.max(1,c.pizzas);
    const need=per*count;
    const b=sauceBatchFor(s,need);
    return sauceAggregationResult([{
      type,s,count,need,per,...b,
      ingredients:s.ingredients(b.batch,count),
      pizzas:Array.from({length:count},(_,i)=>i+1)
    }]);
  }

  ensurePizzaCustomizations();
  const temp={};
  pizzaSelections.forEach((id,idx)=>{
    if(pizzaCustomizations[idx].noSauce) return;
    const r=recipeById(id), type=effectiveSauceTypeForBall(idx), per=effectiveSauceGramsForBall(idx), s=sauces[type];
    if(!temp[type]) temp[type]={type,s,count:0,need:0,pizzas:[]};
    temp[type].count++;
    temp[type].need+=per;
    temp[type].pizzas.push(idx+1);
  });

  const groups=Object.values(temp).map(g=>{
    const b=sauceBatchFor(g.s,g.need);
    return {...g,...b,per:null,ingredients:g.s.ingredients(b.batch,g.count)};
  });
  return sauceAggregationResult(groups);
}

function updateRecipeSummary(c){
  ensurePizzaCustomizations();
  $('pizzaSummary').innerHTML=pizzaSelections.map((id,idx)=>{
    const r=recipeById(id),custom=pizzaCustomizations[idx],items=includedItemsForBall(idx);
    return `<div class="recipebox"><div class="titleline"><div><h3>${L('Bol','Ball')} ${idx+1} • ${recipeNameText(r)}</h3><div class="hint" style="margin:0">${recipeNoteText(r)}</div></div><span class="tag">${pizzaStyleLabel(custom.pizzaStyle)}</span></div><div class="list"><div class="list-row"><span>${L('Aanbevolen saus','Recommended sauce')}</span><span>${custom.noSauce?L('uitgevinkt','unchecked'):`${sauceName(effectiveSauceTypeForBall(idx))} • ${effectiveSauceGramsForBall(idx)} g`}</span></div>${items.map(x=>`<div class="list-row"><span>${tItem(x[0])}</span><span>${x[1]} ${tUnit(x[2],x[1])}</span></div>`).join('')}</div></div>`;
  }).join('');
}

function updateSauceSummary(c){
  refreshManualSaucePlaceholder();
  if(appMode==='sauce') $('manualSauceControls').classList.remove('hidden'); else $('manualSauceControls').classList.toggle('hidden',$('autoSauceFromPizzas').checked);
  const agg=aggregateSauceNeeds(c);
  if(!agg.enabled){
    $('sauceSummary').innerHTML=`<div class="info">${L('Sausberekening staat uit.','Sauce calculation is turned off.')}</div>`;
    return;
  }

  if(agg.groups.length===0){
    $('sauceSummary').innerHTML=`<div class="info">${L("Alle saus is voor de gekozen pizza's uitgevinkt.",'Sauce is unticked for all selected pizzas.')}</div>`;
    return;
  }

  const sauceGroups=agg.groups.map(g=>`
    <div class="sauce-group">
      <h4>${sauceName(g.type)}</h4>
      <div class="hint" style="margin:0 0 8px">${sauceDesc(g.type)}</div>
      <div class="list">
        <div class="list-row"><span>${L("Voor pizza's","For pizzas")}</span><span>${g.pizzas.join(', ')}</span></div>
        <div class="list-row"><span>${L("Op pizza's nodig","Needed on pizzas")}</span><span>${fmt(g.need,0)} g</span></div>
        ${g.s.tomato?`<div class="list-row"><span>${L('Maken','Make')}</span><span>${fmt(g.batch,0)} g</span></div>${usesCombinedTomatoPurchase(agg)?'':`<div class="list-row"><span>${L('Kopen','Buy')}</span><span>${g.tins}× 400 g</span></div>`}`:''}
        ${g.ingredients.map(x=>`<div class="list-row"><span>${tItem(x[0])}</span><span>${x[1]}</span></div>`).join('')}
      </div>
    </div>`).join('');
  const combinedPurchase=usesCombinedTomatoPurchase(agg)
    ? `<div class="sauce-group"><h4>${L('Gezamenlijke tomateninkoop','Combined tomato purchase')}</h4><div class="hint" style="margin:0 0 8px">${L('De sauzen blijven aparte recepten; alleen de inkoop wordt samengevoegd.','The sauces remain separate recipes; only the purchase is combined.')}</div><div class="list">${tomatoPurchaseRowHtml(agg)}</div></div>`
    : '';
  $('sauceSummary').innerHTML=sauceGroups+combinedPurchase;
}
function buildPizzaCustomize(c){
  ensurePizzaCustomizations();
  $('pizzaCustomize').innerHTML=pizzaSelections.map((id,idx)=>{
    const r=recipeById(id),custom=pizzaCustomizations[idx],after=new Set(r.after||[]),cheese=extraCheeseAdvice(idx,c);
    const effective=effectiveItemsForRecipe(r,custom.pizzaStyle);
    const sauceType=effectiveSauceTypeForBall(idx);
    const sauceG=effectiveSauceGramsForBall(idx);

    const sauceLabel=$('autoSauceFromPizzas').checked
      ? `${sauceName(sauceType)} • ${sauceG} g`
      : `${sauceName($('sauceType').value)} • ${fmt(manualSaucePerPizza(),0)} g`;

    const checks=effective.map(x=>{
      const key=itemKey(x),checked=!custom.excluded[key];
      return `<label class="ingredient-check"><input type="checkbox" ${checked?'checked':''}
        onchange='setIngredientIncluded(${idx},${JSON.stringify(key)},this.checked)'>
        <span>${tItem(x[0])} • ${x[1]} ${tUnit(x[2],x[1])}</span>${after.has(key)?`<span class="after">${currentLang==='en'?'after baking':'na bakken'}</span>`:''}</label>`;
    }).join('');

    const cheeseNote=cheese.allowed
      ? (currentLang==='en'
          ? `${cheese.label}. Roughly ${fmt(cheese.cap,0)} g of cheese before baking is the sensible ceiling at ${fmt(c.stoneTemp,0)} °C.`
          : `${cheese.label}. Maximaal ongeveer ${fmt(cheese.cap,0)} g kaas vóór het bakken bij ${fmt(c.stoneTemp,0)} °C.`)
      : L(`Deze pizza zit qua kaas al rond de verstandige bovengrens voor ${fmt(c.stoneTemp,0)} °C.`,`This pizza is already around the sensible upper cheese limit at ${fmt(c.stoneTemp,0)} °C.`);

    const sauceChoice=`<div class="pizza-style-choice compact">
          <div class="picker-section-title" style="padding-left:0">${L('Saus','Sauce')}</div>
          <div class="style-segment">
            ${SAUCE_CHOICES.map(sc=>`<button type="button" class="${sauceType===sc.id?'active':''}" onclick="setPizzaSauceType(${idx},'${sc.id}')">${sauceChoiceLabel(sc,true)}</button>`).join('')}
          </div>
        </div>`;

    return `<div class="customize-card">
      <div class="customize-head"><div><h3>${L('Bol','Ball')} ${idx+1} • ${recipeNameText(r)}</h3><div class="hint" style="margin:0">${recipeTagText(r)}${hasMushroomsRecipe(r)?L(' • 🍄 bevat champignons',' • 🍄 contains mushrooms'):''}</div></div><button class="btn ghost" style="padding:7px 10px" onclick="resetPizzaCustomization(${idx})">${L('Reset toppings','Reset toppings')}</button></div>
      <div class="pizza-style-choice compact"><div class="style-segment"><button type="button" class="${custom.pizzaStyle!=='nl'?'active':''}" onclick="setPizzaStyle(${idx},'traditional')">🇮🇹 ${L('Traditioneel','Traditional')}</button><button type="button" class="${custom.pizzaStyle==='nl'?'active':''}" onclick="setPizzaStyle(${idx},'nl')">🇳🇱 ${L('NL / afhaal','Dutch takeaway')}</button></div></div>
      ${sauceChoice}
      <div class="ingredient-checks"><label class="ingredient-check"><input type="checkbox" ${!custom.noSauce?'checked':''} onchange="setSauceIncluded(${idx},this.checked)"><span>${L('Saus','Sauce')} • ${sauceLabel}</span></label>${checks}</div>
      <div class="extra-cheese-box ${cheese.allowed?'':'disabled'}"><label><input type="checkbox" ${custom.extraCheese&&cheese.allowed?'checked':''} ${cheese.allowed?'':'disabled'} onchange="setExtraCheese(${idx},this.checked)"><span><b>${cheese.label}</b><br><span class="hint" style="margin:0">${cheeseNote}</span></span></label></div>
    </div>`;
  }).join('');
}

function methodInstructions(c){
  const f=fmt(c.flour,0),mw=fmt(c.mainWater,0),rw=fmt(c.reserve,0),halfRw=fmt(c.reserve/2,0),y=fmt(c.yeast,2),s=fmt(c.salt,0),yn=yeastName(c.yeastType).toLowerCase();
  const first=c.autolyse
    ? L(`Meng <b>${f} g bloem</b> met <b>${mw} g water</b>. <b>Nog geen gist of zout.</b>`,
        `Mix <b>${f} g flour</b> with <b>${mw} g water</b>. <b>No yeast or salt yet.</b>`)
    : L(`Meng <b>${mw} g water</b> met <b>${y} g ${yn}</b> en voeg <b>${f} g bloem</b> toe.`,
        `Mix <b>${mw} g water</b> with <b>${y} g ${yn}</b> and add <b>${f} g flour</b>.`);
  const add=c.autolyse
    ? L(`Voeg na de rust <b>${y} g ${yn}</b> toe met de gereserveerde <b>${rw} g water</b>. Voeg daarna <b>${s} g zout</b> toe.`,
        `After the rest, add <b>${y} g ${yn}</b> together with the reserved <b>${rw} g water</b>. Then add <b>${s} g salt</b>.`)
    : L(`Voeg na de rust <b>${s} g zout</b> en geleidelijk de gereserveerde <b>${rw} g water</b> toe.`,
        `After the rest, add <b>${s} g salt</b> and gradually the reserved <b>${rw} g water</b>.`);

  const coolTip=(brand)=>L(
    `<b>${brand}-tip:</b> zet de kom met bloem + water tijdens deze 20 minuten gerust in de koelkast. Zo koelen deeg én metalen kom wat af vóór het kneden, wat helpt om de einddeegtemperatuur te beperken.`,
    `<b>${brand} tip:</b> feel free to put the bowl with flour + water in the fridge during these 20 minutes. Both the dough and the metal bowl cool down before kneading, which helps keep the final dough temperature in check.`);

  if(currentMethod==='hand') return {
    mix:first+L(' Meng 2–3 min met de hand tot alle bloem bevochtigd is.',' Mix by hand for 2–3 min until all the flour is hydrated.'),
    add,
    knead:L('Kneed daarna ongeveer <b>8–12 min</b> tot het deeg glad en elastisch is.','Then knead for roughly <b>8–12 min</b> until the dough is smooth and elastic.'),
    note:L('Bij veel weerstand: 5 min rust en daarna verder.','If it resists a lot: rest 5 min, then continue.'),
    autolyseCooling:'',finish:'',finishNote:''};
  if(currentMethod==='kenwood') return {
    mix:first+L(' Meng <b>1½–2 min op MIN/laagste stand</b>, alleen tot alle bloem bevochtigd is.',' Mix for <b>1½–2 min on MIN/lowest speed</b>, only until all the flour is hydrated.'),
    add:c.autolyse
      ? L(`Voeg na de rust <b>${y} g ${yn}</b> toe met ongeveer <b>${halfRw} g</b> van het gereserveerde water. Meng <b>3–4 min op MIN/laag</b>. Voeg daarna <b>${s} g zout</b> toe met de resterende ongeveer <b>${halfRw} g water</b>.`,
          `After the rest, add <b>${y} g ${yn}</b> with about <b>${halfRw} g</b> of the reserved water. Mix for <b>3–4 min on MIN/low</b>. Then add <b>${s} g salt</b> with the remaining roughly <b>${halfRw} g water</b>.`)
      : add,
    knead:c.autolyse
      ? L('Meng na het zout nog <b>3 min op lage deegstand</b>; verleng alleen indien nodig tot maximaal ongeveer <b>4 min</b>.','After adding the salt, mix for another <b>3 min on a low dough speed</b>; extend only if needed to roughly <b>4 min maximum</b>.')
      : L('Kneed daarna ongeveer <b>4–6 min op lage deegstand</b>.','Then knead for roughly <b>4–6 min on a low dough speed</b>.'),
    note:L(`Kenwood-modellen verschillen sterk. Volg altijd de modelspecifieke snelheidslimiet en stop eerder zodra het deeg glad en elastisch is, de windowpane voldoende is of de deegtemperatuur richting ${fmt(c.doughTemp,1)} °C gaat.`,
      `Kenwood models differ substantially. Always follow the model-specific speed limit and stop earlier once the dough is smooth and elastic, the windowpane is sufficient, or dough temperature approaches ${fmt(c.doughTemp,1)} °C.`),
    autolyseCooling:coolTip('Kenwood'),
    finish:L('Is de windowpane na een korte rust nog zwak, geef het deeg dan één rustige ronde van <b>4 stretch-and-folds</b> in de kom. Sla dit over als het deeg al sterk of strak aanvoelt.','If the windowpane is still weak after a short rest, give the dough one gentle round of <b>4 stretch-and-folds</b> in the bowl. Skip this if the dough already feels strong or tight.'),
    finishNote:L('Dit is een optionele correctie, geen verplichte extra kneedfase.','This is an optional correction, not a mandatory extra kneading phase.')};
  if(currentMethod==='pro') return {
    mix:first+L(' Meng <b>1½–2 min op lage snelheid</b>.',' Mix for <b>1½–2 min on low speed</b>.'),
    add,
    knead:L('Meng kort laag en gebruik daarna, als jouw machine dat ondersteunt, de hogere kneedstand tot het deeg glad en elastisch is.','Mix briefly on low, then use the higher kneading speed if your machine supports it, until the dough is smooth and elastic.'),
    note:L('Bij professionele spiraalkneders zijn snelheid en minimale deegmassa modelafhankelijk.','On professional spiral mixers, speed and minimum dough mass depend on the model.'),
    autolyseCooling:'',finish:'',finishNote:''};
  return {
    mix:first+L(' Meng met de haak <b>1½–2 min op stand 1</b>, alleen tot alle bloem bevochtigd en het deeg grof samengekomen is.',' Mix with the hook for <b>1½–2 min on speed 1</b>, only until all the flour is hydrated and the dough has roughly come together.'),
    add:c.autolyse
      ? L(`Voeg na de rust <b>${y} g ${yn}</b> toe met ongeveer <b>${halfRw} g</b> van het gereserveerde water. Meng <b>4 min op stand 1</b>, haal het deeg van de haak en controleer temperatuur en windowpane. Verleng alleen bij onvoldoende ontwikkeling tot ongeveer <b>5 min</b>. Voeg daarna <b>${s} g zout</b> toe met de resterende ongeveer <b>${halfRw} g water</b>.`,
          `After the rest, add <b>${y} g ${yn}</b> with about <b>${halfRw} g</b> of the reserved water. Mix for <b>4 min on speed 1</b>, remove the dough from the hook, and check temperature and windowpane. Extend only when development is insufficient, to roughly <b>5 min</b>. Then add <b>${s} g salt</b> with the remaining roughly <b>${halfRw} g water</b>.`)
      : add,
    knead:c.autolyse
      ? L('Meng na het zout <b>3 min op stand 1</b>. Controleer opnieuw en verleng alleen indien nodig tot maximaal ongeveer <b>5 min</b>.','After adding the salt, mix for <b>3 min on speed 1</b>. Check again and extend only if needed to roughly <b>5 min maximum</b>.')
      : L('Meng na de rust ongeveer <b>4–6 min op stand 1</b> en controleer tussendoor temperatuur en windowpane.','After the rest, mix for roughly <b>4–6 min on speed 1</b>, checking temperature and windowpane along the way.'),
    note:L(`Dit is een rustige, gefaseerde pizzamethode. KitchenAid schrijft voor gistdeeg officieel stand 2 voor; ga daarom nooit boven stand 2, blijf bij de machine en stop direct bij duidelijke belasting, sterke opwarming, glanzend/plakkerig deeg of zodra de deegtemperatuur richting ${fmt(c.doughTemp,1)} °C gaat.`,
      `This is a gentle, staged pizza method. KitchenAid officially specifies speed 2 for yeasted dough; therefore never exceed speed 2, stay with the machine, and stop immediately if it strains, heats strongly, the dough turns glossy/sticky, or dough temperature approaches ${fmt(c.doughTemp,1)} °C.`),
    autolyseCooling:coolTip('KitchenAid'),
    finish:L('Laat het deeg <b>5 min afgedekt ontspannen</b>. Duw het daarna op het werkblad rustig van je af, vouw terug en draai een kwartslag; herhaal ongeveer <b>6–10 keer</b>. Niet trekken of scheuren.','Let the dough <b>relax covered for 5 min</b>. Then gently push it away from you on the worktop, fold it back, and turn it a quarter turn; repeat roughly <b>6–10 times</b>. Do not pull or tear it.'),
    finishNote:L('Houd deze handmatige finish kort en sla hem over als het deeg al een goede windowpane heeft of juist sterk en strak aanvoelt.','Keep this manual finish short and skip it if the dough already has a good windowpane or feels strong and tight.')};
}
