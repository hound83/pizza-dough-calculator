'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const E=require('../src/assets/js/evening-core');
const W=require('../src/assets/js/workflow-core');
const D=require('../src/assets/js/calculation-core');
const snapshot=()=>({method:'kitchenaid',preset:'custom',exact:null,checks:{practical:true,autolyse:true,sizeFromDiameter:true},fields:{pizzas:'7',diameter:'30',ballWeight:'220',doughStyle:'neapolitan',hydration:'63',saltPct:'3',yeastPct:'.17',oilPct:'0',stoneTemp:'430',preheatMinutes:'30',bulkHours:'1',coldHours:'20',ballHours:'4',roomTemp:'21',fridgeTemp:'4',finalDoughTemp:'24',flourW:'',flourType:'caputoPizzeria',yeastType:'idy',fermentationMethod:'hybrid',coldStorageMode:'bulk'}});
const c=n=>({...D.doughQuantities({pizzas:n,targetBall:220,h:63,s:3,y:.17,o:0,practical:true}),pizzas:n,practical:true});
const start=Date.UTC(2026,0,1,12),H=3600000;
const pizza=i=>({id:`p${i}`,name:'Private name',recipeId:'margherita',custom:{recipeId:'margherita',excluded:{},noSauce:false,extraCheese:false,pizzaStyle:'traditional',sauceOverride:null},snapshot:{name:'Margherita',nameEn:'Margherita',before:[{name:'Tomaat',nameEn:'Tomato',quantity:80,unit:'g'}],after:[{name:'Basilicum',nameEn:'Basil',quantity:2,unit:'g'}]},runId:'',events:{}});
const template=()=>({id:'t',name:'Friday',recipe:snapshot(),mode:'full',pizzas:Array.from({length:7},(_,i)=>pizza(i)),sauce:{enabled:true,automatic:true,type:'sanMarzano',grams:80},split:{unit:'dough',capacity:900},storage:W.storage(null),scale:.1,profile:null});

test('whole-ball allocation conserves every displayed ingredient and nested water quantities',()=>{
  for(const n of [1,7,8,24])for(const practical of [true,false])for(const unit of ['flour','dough']){
    const q={...D.doughQuantities({pizzas:n,targetBall:220,h:63.6,s:2.7,y:.071,o:1.5,practical}),pizzas:n,practical};
    const result=E.allocate(q,{unit,capacity:unit==='flour'?540:900});assert.equal(result.ok,true);
    assert.equal(result.runs.reduce((s,r)=>s+r.balls,0),n);
    for(const key of ['flour','water','salt','yeast','oil','reserve','mainWater'])assert.ok(Math.abs(result.runs.reduce((s,r)=>s+r.display[key],0)-result.totals[key])<1e-8,key);
    for(const r of result.runs){assert.ok(Math.abs(r.display.water-r.display.mainWater-r.display.reserve)<1e-8);assert.equal(r.display.reserveFirst+r.display.reserveLast,r.display.reserve);assert.ok(r.capacityUsed<=result.capacity+1e-8);assert.ok(r.exact.yeast>0);}
  }
});
test('allocation rejects a single over-capacity ball and splits seven/eight in whole balls',()=>{
  assert.equal(E.allocate(c(1),{unit:'dough',capacity:100}).reason,'one-ball');
  assert.deepEqual(E.allocate(c(7),{unit:'dough',capacity:900}).runs.map(x=>x.balls),[4,3]);
  assert.deepEqual(E.allocate(c(8),{unit:'dough',capacity:900}).runs.map(x=>x.balls),[4,4]);
});
test('tiny positive yeast doses are not rounded to zero by splitting',()=>{
  const q={...c(24),yeast:.01},a=E.allocate(q,{unit:'dough',capacity:230});
  assert.equal(a.ok,true);assert.equal(a.runs.length,24);
  assert.ok(a.runs.every(r=>r.display.yeast>0));assert.ok(Math.abs(a.runs.reduce((s,r)=>s+r.display.yeast,0)-.01)<1e-10);
});
test('split yeast adds up to the displayed parent amount at low non-rounded doses',()=>{
  const a=E.allocate({...c(7),yeast:.07163},{unit:'dough',capacity:900});
  assert.equal(a.totals.yeast,.07);assert.ok(Math.abs(a.runs.reduce((n,r)=>n+r.display.yeast,0)-.07)<1e-9);
});
test('persisted allocations must reproduce the frozen parent recipe, not merely contain valid numbers',()=>{
  const t=template(),quantities=W.summary(t.recipe,{neapolitan:.31},D),e=E.createEvening({id:'valid',template:t,allocation:E.allocate(quantities,t.split),startedAt:start,bakeAt:start+26*H,plan:{preparation:.9,bulk:1,cold:20,ball:4},zone:'Europe/Amsterdam'});
  assert.equal(E.validateAllocations(e,quantities),true);
  e.runs[0].allocation.display.salt+=1;assert.equal(E.validateAllocations(e,quantities),false);
});
test('unknown chronology is distinct from absent; later known times bound corrections',()=>{
  let b=W.createBatch({id:'b',recipe:snapshot(),startedAt:start,bakeAt:start+26*H,plan:{preparation:.9,bulk:1,cold:20,ball:4}});
  b=W.recordUnknownEvent(b,'bulkStart',start+3*H);b=W.recordEvent(b,'fridgeIn',start+2*H,start+3*H);
  assert.equal(W.eventDone(b,'bulkStart'),true);assert.equal(W.timeline(b).times.bulkStart,null);
  assert.equal(W.finalProofProposal(b,{}, {},D,start+3*H).reason,'unknown-history');
  assert.throws(()=>W.recordEvent(b,'bulkStart',start+3*H,start+4*H),/order/);
  assert.equal(W.sanitizeBatch(b).unknownEvents[0],'bulkStart');
  b=W.recordEvent(b,'bulkStart',start+H,start+4*H);assert.deepEqual(b.unknownEvents,[]);
});
test('availability preserves preparation/rest totals and never counts cleanup as fermentation',()=>{
  const plan={preparation:.9,bulk:1,cold:20,ball:4};
  const tasks=E.schedule({plan,route:'hybrid',runBalls:[4,3],bakeAt:start+26*H,autolyse:true,cleanup:5,preheat:30,bakeMinutes:25,sauceMinutes:10});
  const prep=tasks.filter(x=>x.run===0&&['mix','rest','finish'].includes(x.kind));
  assert.equal(prep.reduce((sum,x)=>sum+x.end-x.start,0),.9*H);
  assert.equal(prep.find(x=>x.kind==='rest').end-prep.find(x=>x.kind==='rest').start,30*60000);
  const cold=tasks.find(x=>x.run===0&&x.kind==='fridgeIn');assert.equal(cold.start,prep.at(-1).end+H);
  const absent=[{start:cold.start-60000,end:cold.end+60000}];
  assert.ok(E.conflicts(tasks,{unavailable:absent}).some(x=>x.reason==='unavailable'&&x.task.kind==='fridgeIn'));
});
test('availability alternatives are computed whole-plan shifts and retain task durations',()=>{
  const tasks=[{kind:'mix',start,end:start+30*60000,active:true,run:0}];
  const constraints={earliest:start+H,unavailable:[{start:start+H,end:start+2*H}]};
  const options=E.alternatives(tasks,constraints,120);assert.ok(options.length);
  assert.equal(E.conflicts(options[0].tasks,constraints).length,0);
  assert.equal(options[0].tasks[0].end-options[0].tasks[0].start,30*60000);
});
test('template sharing strips private names and actual data; future formats are rejected',()=>{
  const t=template();t.pizzas[0].events={in:start,out:start+60000};t.notes='private';t.bakeAt=start;
  t.profile={id:'private-profile',name:'Private owner',method:'kitchenaid',model:'Artisan',hook:'Spiral',programme:'Private note'};
  const shared=E.exportTemplate(t),restored=E.importTemplate(shared);
  assert.equal(restored.pizzas[0].name,'');assert.deepEqual(restored.pizzas[0].events,{});assert.equal(restored.recipe.preset,'custom');
  assert.equal(JSON.stringify(shared).includes('Private'),false);assert.equal(shared.template.profile.model,'Artisan');assert.equal(JSON.stringify(shared).includes('bakeAt'),false);
  assert.equal(E.importTemplate({...shared,version:99}),null);
  const bad=structuredClone(shared);bad.template.pizzas[0].snapshot.before[0].quantity=-1;assert.equal(E.importTemplate(bad),null);
});
test('baking queue has stable ownership, one oven slot and atomic first-launch checkpoints',()=>{
  const t=template(),alloc=E.allocate(c(7),t.split);
  let e=E.createEvening({id:'e',template:t,allocation:alloc,startedAt:start,bakeAt:start+26*H,plan:{preparation:.9,bulk:1,cold:20,ball:4},zone:'Europe/Amsterdam'});
  const b=e.runs[0].batch;
  for(const key of ['bulkStart','fridgeIn','fridgeOut'])e.runs[0].batch=W.recordUnknownEvent(e.runs[0].batch,key,start+26*H);
  const chosen=e.pizzas[2];e=E.movePizza(e,chosen.id,-2);assert.equal(e.pizzas[0].id,chosen.id);
  e=E.bake(e,chosen.id,'in',start+26*H);assert.equal(e.runs[0].batch.events.bake,start+26*H);assert.ok(E.sanitizeEvening(e));
  const forged=structuredClone(e);forged.undo.priorRunBake.start-=60000;assert.equal(E.sanitizeEvening(forged),null);
  assert.throws(()=>E.bake(e,e.pizzas[1].id,'in',start+26*H),/oven-busy/);
  e=E.bake(e,chosen.id,'out',start+26*H+90000);assert.equal(e.pizzas[0].snapshot.after[0].name,'Basilicum');
  assert.equal(E.close(e,start+27*H).pizzas.filter(x=>!x.events.out).length,6);
  assert.equal(b.recipe.fields.yeastPct,'.17');
});
test('forecast separates actual baking seconds from a long social gap',()=>{
  const pizzas=[{events:{in:start,out:start+90000}},{events:{in:start+20*60000,out:start+21.5*60000}},{events:{}}];
  const result=E.forecast(pizzas,{low:60,high:120,gap:60},start+22*60000);
  assert.equal(result.bakeSeconds,90);assert.equal(result.gapSeconds,1110);assert.equal(result.remaining,1);
  assert.equal(E.forecast(pizzas,{low:60,high:120,gap:60,manualGap:30},start+22*60000).gapSeconds,30);
});
test('legacy migration preserves real observations without inventing archived toppings',()=>{
  const b=W.createBatch({id:'legacy',recipe:snapshot(),startedAt:start,bakeAt:start+26*H,plan:{preparation:.9,bulk:1,cold:20,ball:4}});
  b.readings=[{kind:'doughTemp',value:24,at:start+H}];b.progress={'s-devcheck':true};
  const migrated=E.migrateLegacy(b,template(),c(7),'Europe/Amsterdam');
  assert.deepEqual(migrated.runs[0].batch,b);assert.equal(migrated.pizzas[0].provenance,'legacy-current-choices');
  const archive=E.migrateLegacy({...b,status:'finished'},null,c(7),'Europe/Amsterdam');assert.deepEqual(archive.pizzas,[]);
});
