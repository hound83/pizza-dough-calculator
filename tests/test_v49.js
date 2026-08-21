const fs=require('fs');
const vm=require('vm');

const html=fs.readFileSync('pizzadeeg_calculator_v49.html','utf8');
const script=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).join('\n');

class DummyClassList{
  constructor(){this.values=new Set();}
  add(...x){x.forEach(v=>this.values.add(v));}
  remove(...x){x.forEach(v=>this.values.delete(v));}
  contains(x){return this.values.has(x);}
  toggle(x,force){
    const next=force===undefined?!this.values.has(x):!!force;
    if(next)this.values.add(x);else this.values.delete(x);
    return next;
  }
}
class DummyElement{
  constructor(id=''){
    this.id=id;this.value='';this.checked=false;this.min='';this.max='';this.step='';
    this.textContent='';this.innerHTML='';this.className='';this.classList=new DummyClassList();
    this.style={};this.dataset={};this.children=[];this.attributes={};
  }
  addEventListener(){}
  removeEventListener(){}
  setAttribute(k,v){this.attributes[k]=String(v);}
  getAttribute(k){return this.attributes[k]??null;}
  appendChild(x){this.children.push(x);return x;}
  prepend(x){this.children.unshift(x);return x;}
  focus(){}
  scrollIntoView(){}
  querySelector(){return null;}
  querySelectorAll(){return [];}
  closest(){return null;}
}

const elements=new Map();
const get=id=>{
  if(!elements.has(id))elements.set(id,new DummyElement(id));
  return elements.get(id);
};
const app=new DummyElement('app');
const storage={data:new Map(),fail:false,
  getItem(k){if(this.fail)throw new Error('blocked');return this.data.has(k)?this.data.get(k):null;},
  setItem(k,v){if(this.fail)throw new Error('blocked');this.data.set(k,String(v));},
  removeItem(k){if(this.fail)throw new Error('blocked');this.data.delete(k);}
};
const document={
  getElementById:get,
  addEventListener(){},
  querySelector(sel){return sel==='.app'?app:null;},
  querySelectorAll(sel){
    if(sel==='input[type="number"]')return [...elements.values()].filter(el=>el.type==='number');
    return [];
  },
  createElement(tag){return new DummyElement(tag);},
  body:new DummyElement('body'),
  documentElement:new DummyElement('html')
};
const ctx={
  console,document,localStorage:storage,
  navigator:{clipboard:{writeText:async()=>{}}},
  window:{addEventListener(){},scrollTo(){},confirm(){return true;},setTimeout,clearTimeout,isSecureContext:true},
  alert(){},confirm(){return true;},MutationObserver:class{observe(){} disconnect(){}},
  setTimeout,clearTimeout,Date,Intl,Math,JSON,Number,String,Array,Object,Set,Map,WeakMap,
  encodeURIComponent,decodeURIComponent,parseFloat,parseInt,isFinite
};
ctx.window.window=ctx.window;ctx.window.document=document;ctx.window.navigator=ctx.navigator;
vm.createContext(ctx);
vm.runInContext(script,ctx,{filename:'pizzadeeg_calculator_v49.html'});

function setField(id,value,{min='',max='',checked,type}={}){
  const el=get(id);el.value=String(value);el.min=String(min);el.max=String(max);
  el.type=type||(min!==''||max!==''?'number':el.type||'text');
  if(checked!==undefined)el.checked=checked;
  return el;
}
function defaults(){
  setField('pizzas',4,{min:1,max:24});
  setField('diameter',32,{min:20,max:40});
  setField('ballWeight',270,{min:100,max:1000});
  setField('doughStyle','neapolitan');
  setField('hydration',63,{min:45,max:85});
  setField('saltPct',3,{min:0,max:5});
  setField('yeastType','idy');
  setField('yeastPct',0.17,{min:0,max:3});
  setField('oilPct',0,{min:0,max:10});
  setField('practical','',{checked:true});
  setField('sizeFromDiameter','',{checked:true});
  setField('autolyse','',{checked:true});
  setField('fermentationMethod','hybrid');
  setField('coldStorageMode','bulk');
  setField('bulkHours',1,{min:0,max:48});
  setField('coldHours',20,{min:0,max:120});
  setField('ballHours',4,{min:0,max:48});
  setField('roomTemp',21,{min:10,max:35});
  setField('fridgeTemp',4,{min:0,max:15});
  setField('finalDoughTemp',24,{min:10,max:35});
  setField('flourType','caputoPizzeria');
  setField('flourW','',{min:90,max:450});
  setField('stoneTemp',430,{min:180,max:520});
  setField('preheatMinutes',30,{min:5,max:120});
  setField('bakeDay','');setField('bakeTime','');
  setField('includeSauce','',{checked:true});
  setField('autoSauceFromPizzas','',{checked:true});
  setField('sauceType','sanMarzano');setField('saucePerPizza',80,{min:0,max:200});
  setField('preset','kodaNight');
  setField('logNotes','');setField('logRiseRating','good');setField('logWaterTemp','',{min:0,max:50});
}
defaults();
const run=source=>vm.runInContext(source,ctx);
const approx=(a,b,tol=0.02)=>Math.abs(a-b)<=tol;
let passed=0;
function test(name,fn){
  try{fn();passed++;console.log(`PASS ${name}`);}
  catch(err){console.error(`FAIL ${name}: ${err.message}`);process.exitCode=1;}
}
function assert(value,message='assertion failed'){if(!value)throw new Error(message);}
function typeThroughCalc(id,text){
  const el=get(id);el.value='';
  const states=[];
  for(const ch of String(text)){
    el.value+=ch;
    run('calc()');
    states.push(el.value);
  }
  return states;
}

test('v49 storage key and v48 first migration key',()=>{
  const x=run('({key:SAVE_KEY,version:SAVE_VERSION,legacy:LEGACY_KEYS[0]})');
  assert(x.key==='pizzaCalcV49'&&x.version===49&&x.legacy==='pizzaCalcV48',JSON.stringify(x));
});

test('catalogue invariants remain 92 recipes and 7 valid sauces',()=>{
  const x=run(`({recipes:pizzaRecipes.length,sauces:Object.keys(sauces).length,invalid:pizzaRecipes.filter(r=>!sauces[r.sauce]).map(r=>r.id)})`);
  assert(x.recipes===92&&x.sauces===7&&x.invalid.length===0,JSON.stringify(x));
});

test('room deadband leaves ±1 °C plan unchanged',()=>{
  run(`$('fermentationMethod').value='room';$('bulkHours').value='2';$('ballHours').value='6';$('roomTemp').value='24';$('finalDoughTemp').value='24';$('bakeDay').value='';$('bakeTime').value='';exactOverride=null;`);
  const result=run(`(()=>{const c=calc();return [24,24.5,25].map(t=>{liveMeasurements={doughTemp:t,fridgeTemp:null};_livePlanCache={key:null,value:null};const p=liveFermentationPlan(c);return {t,bulk:p.effective.bulk,ball:p.effective.ball,deadband:p.roomDeadband,changed:p.changed};});})()`);
  assert(result.every(x=>x.bulk===2&&x.ball===6&&x.deadband&&!x.changed),JSON.stringify(result));
});

test('room correction above deadband preserves ratio and solves total',()=>{
  const x=run(`(()=>{const c=calc();liveMeasurements={doughTemp:26,fridgeTemp:null};_livePlanCache={key:null,value:null};const p=liveFermentationPlan(c);return {bulk:p.effective.bulk,ball:p.effective.ball,total:p.effective.bulk+p.effective.ball,ratio:p.effective.bulk/(p.effective.bulk+p.effective.ball),converged:p.roomAlternative.converged,gas:p.roomAlternative.gasRatio};})()`);
  assert(x.converged&&approx(x.ratio,.25,.002)&&x.total>7&&x.total<8&&approx(x.gas,1,.01),JSON.stringify(x));
});

test('deadline change invalidates cache immediately',()=>{
  const x=run(`(()=>{const c=calc();liveMeasurements={doughTemp:30,fridgeTemp:null};$('bakeDay').value='';$('bakeTime').value='';_livePlanCache={key:null,value:null};const before=liveFermentationPlan(c);$('bakeDay').value='0';$('bakeTime').value='23:59';const after=liveFermentationPlan(c);return {before:before.effective.bulk+before.effective.ball,after:after.effective.bulk+after.effective.ball,afterBulk:after.effective.bulk,afterBall:after.effective.ball,deadline:hasValidBakeDeadline()};})()`);
  assert(x.deadline&&x.before<7.5&&x.afterBulk===2&&x.afterBall===6,JSON.stringify(x));
});

test('day without time is not treated as deadline',()=>{
  const x=run(`(()=>{const c=calc();liveMeasurements={doughTemp:30,fridgeTemp:null};$('bakeDay').value='0';$('bakeTime').value='';_livePlanCache={key:null,value:null};const p=liveFermentationPlan(c);return {valid:hasValidBakeDeadline(),total:p.effective.bulk+p.effective.ball,changed:p.changed};})()`);
  assert(!x.valid&&x.changed&&x.total<8,JSON.stringify(x));
});

test('cold room solver expands bracket and reports real convergence',()=>{
  run(`$('bulkHours').value='1';$('ballHours').value='3';$('roomTemp').value='10';$('finalDoughTemp').value='24';$('bakeDay').value='';$('bakeTime').value='';`);
  const x=run(`(()=>{const c=calc();liveMeasurements={doughTemp:10,fridgeTemp:null};_livePlanCache={key:null,value:null};const p=liveFermentationPlan(c);return {total:p.roomAlternative.total,gas:p.roomAlternative.gasRatio,converged:p.roomAlternative.converged,reason:p.roomAlternative.reason};})()`);
  assert(x.converged&&x.total>10&&x.total<20&&approx(x.gas,1,.01),JSON.stringify(x));
});

test('all-zero room phases fail honestly without crash',()=>{
  const x=run(`(()=>{const c={...calc(),bulk:0,ball:0,cold:0,ferm:'room'};const p=solveRoomEquivalentTotal(c,10);return {converged:p.converged,reason:p.reason,total:p.total};})()`);
  assert(!x.converged&&x.reason==='no-target'&&x.total===0,JSON.stringify(x));
});

test('room solver stays bounded and converges across a temperature matrix',()=>{
  const rows=run(`(()=>{$('fermentationMethod').value='room';$('bulkHours').value='2';$('ballHours').value='6';$('roomTemp').value='24';$('finalDoughTemp').value='24';$('bakeDay').value='';$('bakeTime').value='';const c=calc();return [10,14,18,22,26,30,35].map(t=>{const s=solveRoomEquivalentTotal(c,t);return {t,converged:s.converged,bulk:s.bulk,ball:s.ball,gas:s.gasRatio};});})()`);
  assert(rows.every(x=>x.converged&&x.bulk>=0&&x.bulk<=48&&x.ball>=0&&x.ball<=48&&approx(x.gas,1,.01)),JSON.stringify(rows));
});

test('room solver remains finite and honest across 1,512 schedule cases',()=>{
  defaults();
  const x=run(`(()=>{const bad=[];let count=0,converged=0,rejected=0;for(const room of [10,15,20,24,30,35])for(const measured of [10,15,20,25,30,35,40])for(const bulk of [0,1,4,12,24,48])for(const ball of [0,1,4,12,24,48]){const c={...calc(),ferm:'room',room,doughTemp:24,bulk,cold:0,ball};const s=solveRoomEquivalentTotal(c,measured);count++;const finite=[s.total,s.bulk,s.ball].every(Number.isFinite);const bounded=s.bulk>=0&&s.bulk<=48.0001&&s.ball>=0&&s.ball<=48.0001;const truthful=s.converged?Number.isFinite(s.gasRatio)&&Math.abs(s.gasRatio-1)<=.01:['no-target','above-upper-bound','below-lower-bound'].includes(s.reason);if(s.converged)converged++;else rejected++;if(!finite||!bounded||!truthful)bad.push({room,measured,bulk,ball,s});}return {count,converged,rejected,bad:bad.slice(0,5)};})()`);
  assert(x.count===1512&&x.converged>0&&x.rejected>0&&x.bad.length===0,JSON.stringify(x));
});

test('fridge-only measurement performs one optimizer pass',()=>{
  run(`$('fermentationMethod').value='hybrid';$('coldStorageMode').value='bulk';$('bulkHours').value='1';$('coldHours').value='20';$('ballHours').value='4';$('roomTemp').value='21';$('fridgeTemp').value='4';$('finalDoughTemp').value='24';`);
  const calls=run(`(()=>{const c=calc();liveMeasurements={doughTemp:null,fridgeTemp:5};_livePlanCache={key:null,value:null};const original=_optimizeLiveSchedule;let n=0;_optimizeLiveSchedule=(...a)=>{n++;return original(...a)};try{liveFermentationPlan(c);}finally{_optimizeLiveSchedule=original;}return n;})()`);
  assert(calls===1,`optimizer calls=${calls}`);
});

test('DDT stats ignore null instead of coercing it to zero',()=>{
  const x=run(`(()=>{bakeLog=[{method:'kitchenaid',ddtCorrection:null},{method:'kitchenaid',ddtCorrection:null},{method:'kitchenaid',ddtCorrection:14}];return ddtLogStats('kitchenaid');})()`);
  assert(x.count===1&&x.median===14,JSON.stringify(x));
});

test('bake-log sanitizer preserves planned fridge and bounds metadata',()=>{
  const x=run(`sanitizeBakeLog([{ts:-99,method:'nope',preset:'nope',fridgePlanned:5,notes:'x'.repeat(600),ddtCorrection:null}])[0]`);
  assert(x.fridgePlanned===5&&x.method==='kitchenaid'&&x.preset==='custom'&&x.notes.length===500&&x.ts>=0&&x.ddtCorrection===null,JSON.stringify(x));
});

test('empty measurement fields remain null after sanitizing and reload logic',()=>{
  const x=run(`(()=>{const row=sanitizeBakeLog([{ts:123,method:'kitchenaid',waterTemp:null,finalDoughTemp:'',fridgeTempActual:null,ddtCorrection:null}])[0];bakeLog=[row];return {water:row.waterTemp,dough:row.finalDoughTemp,fridge:row.fridgeTempActual,ddt:row.ddtCorrection,stats:ddtLogStats('kitchenaid')};})()`);
  assert(x.water===null&&x.dough===null&&x.fridge===null&&x.ddt===null&&x.stats.count===0&&x.stats.median===null,JSON.stringify(x));
});

test('v48 state migrates to v49 and keeps live/log data',()=>{
  storage.data.clear();
  storage.data.set('pizzaCalcV48',JSON.stringify({version:48,pizzas:'999',hydration:'99',fridgeTemp:'14',currentMethod:'kenwood',liveMeasurements:{doughTemp:25,fridgeTemp:5},bakeLog:[{ts:123456,method:'kenwood',preset:'kodaNight',fridgePlanned:4,ddtCorrection:12}]}));
  const x=run(`(()=>{const ok=loadState();return {ok,pizzas:$('pizzas').value,hydration:$('hydration').value,plannedFridge:$('fridgeTemp').value,method:currentMethod,dough:liveMeasurements.doughTemp,fridge:liveMeasurements.fridgeTemp,loggedFridge:bakeLog[0]?.fridgePlanned,old:SAFE.get('pizzaCalcV48'),fresh:!!SAFE.get('pizzaCalcV49')};})()`);
  assert(x.ok&&x.pizzas==='24'&&x.hydration==='85'&&x.plannedFridge==='14'&&x.method==='kenwood'&&x.dough===25&&x.fridge===5&&x.loggedFridge===4&&x.old===null&&x.fresh,JSON.stringify(x));
});

test('picker resets leaked BBQ sauce when changing recipe',()=>{
  const x=run(`(()=>{$('pizzas').value='1';pizzaSelections=['bbqChicken'];pizzaCustomizations=[{recipeId:'bbqChicken',excluded:{},noSauce:false,extraCheese:false,pizzaStyle:'traditional',sauceOverride:'bbq'}];pickerTarget=0;pickerPendingSauceType='bbq';loadPickerPendingCustomization('quattroFormaggi');return pickerPendingSauceType;})()`);
  assert(x==='bianca',`pending sauce=${x}`);
});

test('manual zero bulk gets neutral wording',()=>{
  const html=run(`(()=>{const c={...calc(),ferm:'room',bulk:0,cold:0,ball:4};const live={active:false,changed:false,effective:c,orig:{bulk:0,cold:0,ball:4}};_stepKeys=[];return fermentationSteps(c,1,live).html.join('');})()`);
  assert(html.includes('geen aparte warme bulk gepland')&&!html.includes('live temperatuurcorrectie'),html.slice(0,400));
});

test('zero bulk does not blame an unrelated live correction',()=>{
  const x=run(`(()=>{const c={...calc(),ferm:'hybrid',bulk:0,cold:18,ball:5};const unrelated={active:true,changed:true,effective:{...c,cold:18,ball:5},orig:{bulk:0,cold:20,ball:4}};_stepKeys=[];const neutral=fermentationSteps(c,1,unrelated).html.join('');const removed={active:true,changed:true,effective:{...c,bulk:0},orig:{bulk:1,cold:18,ball:5}};_stepKeys=[];const corrected=fermentationSteps(c,1,removed).html.join('');return {neutral,corrected};})()`);
  assert(x.neutral.includes('geen aparte warme bulk gepland')&&!x.neutral.includes('door de live temperatuurcorrectie')&&x.corrected.includes('door de live temperatuurcorrectie'),JSON.stringify({neutral:x.neutral.slice(0,300),corrected:x.corrected.slice(0,300)}));
});

test('character-by-character typing never rewrites the active numeric field',()=>{
  defaults();
  run(`exactOverride=null;$('sizeFromDiameter').checked=true;$('fermentationMethod').value='hybrid';`);
  const cases=[
    ['hydration','72'],['roomTemp','24'],['stoneTemp','480'],['preheatMinutes','45'],
    ['flourW','320'],['finalDoughTemp','26'],['diameter','35'],['pizzas','24']
  ];
  const result=cases.map(([id,value])=>({id,value,states:typeThroughCalc(id,value),actual:get(id).value}));
  assert(result.every(x=>x.actual===x.value&&x.states[x.states.length-1]===x.value),JSON.stringify(result));
});

test('ball-weight mode also leaves the typed source field untouched',()=>{
  defaults();
  run(`exactOverride=null;$('sizeFromDiameter').checked=false;`);
  const states=typeThroughCalc('ballWeight','380');
  assert(get('ballWeight').value==='380'&&states.join('|')==='3|38|380',JSON.stringify(states));
});

test('editing a middle digit is not clamped before the replacement is typed',()=>{
  defaults();
  const x=run(`(()=>{$('stoneTemp').value='40';const interim=calc();const afterInterim=$('stoneTemp').value;$('stoneTemp').value='480';const final=calc();return {afterInterim,afterFinal:$('stoneTemp').value,interimCalc:interim.stoneTemp,finalCalc:final.stoneTemp};})()`);
  assert(x.afterInterim==='40'&&x.afterFinal==='480'&&x.interimCalc===180&&x.finalCalc===480,JSON.stringify(x));
});

test('visible normalization happens only after editing and respects domains',()=>{
  defaults();
  const x=run(`(()=>{$('hydration').value='100';calc();const before=$('hydration').value;normalizeNumericInput($('hydration'));$('diameter').value='99';calc();const diameterBefore=$('diameter').value;normalizeNumericInput($('diameter'));$('fridgeTemp').value='14';normalizeNumericInput($('fridgeTemp'));$('pizzas').value='999';ensurePizzaSelections();const cards=pizzaSelections.length;normalizeNumericInput($('pizzas'));$('finalDoughTemp').value='';$('flourW').value='';normalizeNumericInput($('finalDoughTemp'));normalizeNumericInput($('flourW'));return {before,hydration:$('hydration').value,diameterBefore,diameter:$('diameter').value,fridge:$('fridgeTemp').value,pizzas:$('pizzas').value,cards,dough:$('finalDoughTemp').value,w:$('flourW').value};})()`);
  assert(x.before==='100'&&x.hydration==='85'&&x.diameterBefore==='99'&&x.diameter==='40'&&x.fridge==='14'&&x.pizzas==='24'&&x.cards===24&&x.dough===''&&x.w==='',JSON.stringify(x));
});

test('yeast type conversion keeps field override and calculation identical',()=>{
  defaults();
  const x=run(`(()=>{exactOverride={h:63,s:3,o:0,ySelected:1.2};$('yeastPct').value='1.2';previousYeastType='idy';$('yeastType').value='fresh';const converted=applyYeastTypeConversion('idy','fresh');const c=calc();return {converted,field:Number($('yeastPct').value),override:exactOverride.ySelected,selected:selectedYeastPct(),calcPct:c.y};})()`);
  assert(x.converted===3&&x.field===3&&x.override===3&&x.selected===3&&x.calcPct===3,JSON.stringify(x));
});

test('yeast conversions preserve effective IDY across every type pair',()=>{
  defaults();
  const x=run(`(()=>{const rows=[];for(const from of Object.keys(yeastTypes))for(const to of Object.keys(yeastTypes)){const start=.2*yeastTypes[from].mult;$('yeastType').value=from;$('yeastPct').value=String(start);previousYeastType=from;exactOverride={h:63,s:3,o:0,ySelected:start};const converted=applyYeastTypeConversion(from,to);const c=calc();rows.push({from,to,converted,field:Number($('yeastPct').value),selected:selectedYeastPct(),calc:c.y,effective:c.y/yeastTypes[to].mult});}return rows;})()`);
  assert(x.every(r=>approx(r.field,r.converted,.0005)&&approx(r.selected,r.converted,.0005)&&approx(r.calc,r.converted,.0005)&&approx(r.effective,.2,.0005)),JSON.stringify(x));
});

test('core recipe arithmetic stays finite across methods, sizes and hydration bounds',()=>{
  defaults();
  const x=run(`(()=>{const bad=[];let count=0;for(const method of ['hybrid','room'])for(const diameter of [20,32,40])for(const hydration of [45,63,85])for(const pizzas of [1,24]){exactOverride=null;$('fermentationMethod').value=method;$('diameter').value=String(diameter);$('hydration').value=String(hydration);$('pizzas').value=String(pizzas);$('sizeFromDiameter').checked=true;const c=calc();count++;const sum=c.flour+c.water+c.salt+c.yeast+c.oil;const finite=['flour','water','salt','yeast','oil','total','actualBall','actualH','targetDiameter'].every(k=>Number.isFinite(c[k]));if(!finite||c.total<=0||c.actualBall<=0||Math.abs(sum-c.total)>.001||c.pizzas!==pizzas||c.targetDiameter!==diameter)bad.push({method,diameter,hydration,pizzas,c,sum});}return {count,bad:bad.slice(0,3)};})()`);
  assert(x.count===36&&x.bad.length===0,JSON.stringify(x));
});

test('numeric input bounds clamp negatives and diameter/weight limits',()=>{
  run(`$('fermentationMethod').value='hybrid';$('bulkHours').value='-5';$('coldHours').value='999';$('roomTemp').value='-8';$('diameter').value='99';$('sizeFromDiameter').checked=true;$('saucePerPizza').value='-20';`);
  const x=run(`(()=>{const c=calc();return {bulk:c.bulk,cold:c.cold,room:c.room,diameter:c.targetDiameter,ballMax:Number($('ballWeight').max),expected:recommendedBallWeight(40),sauce:manualSaucePerPizza()};})()`);
  assert(x.bulk===0&&x.cold===120&&x.room===10&&x.diameter===40&&x.ballMax===x.expected&&x.sauce===0,JSON.stringify(x));
});

test('stored exact overrides are clamped to visible product bounds',()=>{
  const x=run(`sanitizeExactOverride({h:-10,s:99,o:-2,ySelected:44})`);
  assert(x.h===45&&x.s===5&&x.o===0&&x.ySelected===3,JSON.stringify(x));
});

test('English search includes explicit translated chicken recipe data',()=>{
  const x=run(`(()=>{currentLang='en';const r=recipeById('polloFunghiWhite');return {hit:pizzaSearchHaystack(r).includes('chicken'),name:recipeNameText(r)};})()`);
  assert(x.hit&&x.name.startsWith('Chicken'),JSON.stringify(x));
});

test('English search keeps both display translations and common synonyms',()=>{
  const x=run(`(()=>{currentLang='en';clearSearchCaches();const count=q=>pizzaRecipes.filter(r=>pizzaMatchesQuery(r,q)).length;return {eggplant:count('eggplant'),aubergine:count('aubergine'),zucchini:count('zucchini'),courgette:count('courgette'),porciniMushrooms:count('porcini mushrooms')};})()`);
  assert(x.eggplant>=2&&x.aubergine>=2&&x.zucchini>=1&&x.courgette>=1&&x.porciniMushrooms>=2,JSON.stringify(x));
});

test('spicy filter retains Amatriciana and all eleven recipes',()=>{
  const x=run(`(()=>{currentLang='nl';clearSearchCaches();const hits=pizzaRecipes.filter(r=>recipeMatchesSingleFilter(r,'spicy')).map(r=>r.id);return {count:hits.length,amatriciana:hits.includes('amatriciana')};})()`);
  assert(x.count===11&&x.amatriciana,JSON.stringify(x));
});

test('BBQ is classified as no-tomato and not tomato',()=>{
  const x=run(`(()=>{const r=recipeById('bbqChicken');return {noTomato:recipeMatchesSingleFilter(r,'noTomato'),tomato:recipeMatchesSingleFilter(r,'tomato')};})()`);
  assert(x.noTomato&&!x.tomato,JSON.stringify(x));
});

test('three small tomato sauces share one 400 g purchase',()=>{
  defaults();
  const x=run(`(()=>{currentLang='nl';appMode='full';$('pizzas').value='3';$('includeSauce').checked=true;$('autoSauceFromPizzas').checked=true;pizzaSelections=['margherita','marinara','polpette'];pizzaCustomizations=[];const c=calc();const a=aggregateSauceNeeds(c);updateSauceSummary(c);return {groups:a.groups.length,batch:a.tomatoPurchase.batch,tins:a.tomatoPurchase.tins,combined:usesCombinedTomatoPurchase(a),summary:$('sauceSummary').innerHTML};})()`);
  assert(x.groups===3&&x.batch<=400&&x.tins===1&&x.combined&&x.summary.includes('Gezamenlijke tomateninkoop')&&!x.summary.includes('3× 400 g'),JSON.stringify({...x,summary:x.summary.slice(-300)}));
});

test('combined ingredient copy shows one tomato purchase line',()=>{
  const copy=run(`ingredientsCopyText(calc())`);
  const lines=copy.split('\n');
  assert(lines.filter(x=>x.includes('Tomaten totaal inkopen')).length===1&&lines.filter(x=>x.startsWith('• Kopen:')).length===0,copy);
});

test('ingredients modal shows combined tomato purchase exactly once',()=>{
  const x=run(`(()=>{appMode='full';buildIngredientsModal(calc());const html=$('ingredientsModalBody').innerHTML;return {count:(html.match(/Tomaten totaal inkopen/g)||[]).length,html};})()`);
  assert(x.count===1,JSON.stringify({count:x.count,tail:x.html.slice(-500)}));
});

test('blank manual sauce amount uses the diameter-scaled default',()=>{
  defaults();
  const x=run(`(()=>{appMode='sauce';$('diameter').value='40';$('sizeFromDiameter').checked=true;$('sauceType').value='sanMarzano';$('saucePerPizza').value='';const c=calc();refreshManualSaucePlaceholder();return {scale:c.toppingScale,amount:manualSaucePerPizza(),placeholder:$('saucePerPizza').placeholder};})()`);
  assert(approx(x.scale,1.5625,.0001)&&x.amount===125&&x.placeholder==='125',JSON.stringify(x));
});

test('blank sauce defaults scale consistently for all seven sauce types',()=>{
  defaults();
  const x=run(`(()=>{const rows=[];for(const diameter of [20,32,40]){setToppingScale(diameter);for(const type of Object.keys(sauces)){$('sauceType').value=type;$('saucePerPizza').value='';refreshManualSaucePlaceholder();const expected=Math.max(1,Math.round(sauces[type].perPizza*toppingScale));rows.push({diameter,type,actual:manualSaucePerPizza(),placeholder:Number($('saucePerPizza').placeholder),expected});}}return rows;})()`);
  assert(x.length===21&&x.every(r=>r.actual===r.expected&&r.placeholder===r.expected),JSON.stringify(x));
});

test('fermentation dashboard has direct English labels and no known fragments',()=>{
  defaults();
  const x=run(`(()=>{currentLang='en';exactOverride=null;const c=calc(),a=yeastRecommendation(c);buildFermentationScience(c,a);const html=$('fermentDashboard').innerHTML+$('fermentWarnings').innerHTML;return {html,bad:['ruime marge','binnen bereik','richtwaarde','Gistactiviteit','Huidige gist'].filter(t=>html.includes(t))};})()`);
  assert(x.bad.length===0&&x.html.includes('Yeast activity')&&x.html.includes('Visual final check'),JSON.stringify({bad:x.bad,html:x.html.slice(0,600)}));
});

test('recipe copy reports live-adjusted fermentation time',()=>{
  const text=run(`(()=>{currentLang='nl';appMode='dough';$('fermentationMethod').value='room';$('bulkHours').value='2';$('ballHours').value='6';$('roomTemp').value='24';$('finalDoughTemp').value='24';$('bakeDay').value='';$('bakeTime').value='';liveMeasurements={doughTemp:30,fridgeTemp:null};_livePlanCache={key:null,value:null};globalThis.__copied='';navigator.clipboard.writeText=t=>{globalThis.__copied=t;return Promise.resolve()};copyRecipe();return globalThis.__copied;})()`);
  assert(text.includes('Fermentatie live aangepast')&&text.includes('oorspronkelijk 8'),text);
});

test('method labels are user-facing and no automatic learning is applied',()=>{
  const x=run(`(()=>{currentLang='nl';const c=calc();bakeLog=[{method:'hand',ddtCorrection:25}];return {label:methodLabel('hand'),water:waterTempAdvice(c),source:waterTempAdvice.toString()};})()`);
  assert(x.label==='handmatig kneden'&&!x.water.calibrated&&x.water.correctionCount===0&&!x.source.includes('ddtLogStats('),JSON.stringify(x));
});

test('blocked local storage warns once without breaking save',()=>{
  storage.fail=true;
  const x=run(`(()=>{_storageWarningShown=false;const ok=saveState();return {ok,shown:_storageWarningShown};})()`);
  storage.fail=false;
  assert(x.ok===false&&x.shown===true,JSON.stringify(x));
});

console.log(`\n${passed} regression tests passed`);
