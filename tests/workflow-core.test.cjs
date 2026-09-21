'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const W=require('../src/assets/js/workflow-core');
const D=require('../src/assets/js/calculation-core');
const factors={neapolitan:.31,avpn:.38,canotto:.33,ny:.4,thin:.25};
const snapshot=()=>({method:'kitchenaid',preset:'custom',exact:null,checks:{practical:true,autolyse:true,sizeFromDiameter:true},fields:{pizzas:'4',diameter:'30',ballWeight:'220',doughStyle:'neapolitan',hydration:'63',saltPct:'3',yeastPct:'.17',oilPct:'0',stoneTemp:'430',preheatMinutes:'30',bulkHours:'1',coldHours:'20',ballHours:'4',roomTemp:'21',fridgeTemp:'4',finalDoughTemp:'24',flourW:'',flourType:'caputoPizzeria',yeastType:'idy',fermentationMethod:'hybrid',coldStorageMode:'bulk'}});
const start=Date.UTC(2026,0,1,12),now=start+48*W.HOUR;
const batch=()=>W.createBatch({id:'test',recipe:snapshot(),startedAt:start,bakeAt:start+25.9*W.HOUR,plan:{preparation:.9,bulk:1,cold:20,ball:4}});

test('recipe exchange is strict, strips private data, and preserves zero salt/oil and exact yeast',()=>{
  const r=snapshot();r.fields.saltPct='0';r.exact={ySelected:.17345};r.notes='private';r.profile={model:'private'};
  const exported=W.exportRecipe('Weekend',r),imported=W.importRecipe(JSON.parse(JSON.stringify(exported)));
  assert.equal(imported.recipe.preset,'custom');assert.equal(imported.recipe.exact.ySelected,.17345);assert.equal(imported.recipe.fields.saltPct,'0');
  assert.equal(JSON.stringify(exported).includes('private'),false);
  assert.equal(W.importRecipe({...exported,version:99}),null);
  const invalid=structuredClone(exported);delete invalid.recipe.fields.hydration;assert.equal(W.importRecipe(invalid),null);
  invalid.recipe.fields.hydration='Infinity';assert.equal(W.importRecipe(invalid),null);
  invalid.recipe.fields.hydration=63;invalid.recipe.fields.pizzas='2.5';assert.equal(W.importRecipe(invalid),null);
});
test('saved recipe comparison uses the shared weighing calculation for exact and practical routes',()=>{
  for(const practical of [true,false])for(const sizeFromDiameter of [true,false]){
    const r=snapshot();r.checks={...r.checks,practical,sizeFromDiameter};r.exact={h:63.6,ySelected:.173};
    const s=W.summary(r,factors,D),q=D.doughQuantities({pizzas:4,targetBall:220,h:63.6,s:3,y:.173,o:0,practical});
    for(const key of ['flour','water','yeast','actualBall','reserve'])assert.equal(s[key],q[key]);
  }
});
test('actual checkpoints stay fixed and later estimates move from the latest actual anchor',()=>{
  let b=batch();b=W.recordEvent(b,'bulkStart',start+W.HOUR,now);b=W.recordEvent(b,'fridgeIn',start+2.5*W.HOUR,now);
  const t=W.timeline(b);assert.equal(t.times.bulkStart,start+W.HOUR);assert.equal(t.times.fridgeOut,start+22.5*W.HOUR);
  assert.ok(Math.abs(t.delta-.6)<1e-9);assert.equal(b.bakeAt,start+25.9*W.HOUR);
  const changed=W.recordEvent(b,'bulkStart',start+1.2*W.HOUR,now);
  assert.equal(changed.events.fridgeIn,b.events.fridgeIn);assert.equal(changed.revisions.length,1);
  assert.equal(b.events.bulkStart,start+W.HOUR);
});
test('event chronology rejects skips, future entries and corrections beyond neighbouring actual events',()=>{
  let b=batch();assert.throws(()=>W.recordEvent(b,'fridgeIn',start+W.HOUR,now),/missing-previous/);
  assert.throws(()=>W.recordEvent(b,'bulkStart',now+120000,now),/future/);
  b=W.recordEvent(b,'bulkStart',start+W.HOUR,now);b=W.recordEvent(b,'fridgeIn',start+2*W.HOUR,now);
  assert.throws(()=>W.recordEvent(b,'bulkStart',start+3*W.HOUR,now),/order/);
  assert.throws(()=>W.recordEvent(b,'start',start+2*W.HOUR,now),/order/);
});
test('manual revisions cannot erase completed phases or already elapsed final proof',()=>{
  let b=batch();b=W.recordEvent(b,'bulkStart',start+W.HOUR,now);b=W.recordEvent(b,'fridgeIn',start+2*W.HOUR,now);b=W.recordEvent(b,'fridgeOut',start+22*W.HOUR,now);
  assert.throws(()=>W.reviseTimings(b,{bulk:2},start+23*W.HOUR),/completed/);
  assert.throws(()=>W.reviseTimings(b,{ball:.5},start+23*W.HOUR),/elapsed/);
  const revised=W.reviseTimings(b,{ball:3},start+23*W.HOUR);assert.equal(revised.events.fridgeOut,b.events.fridgeOut);assert.equal(revised.bakeAt,b.bakeAt);
});
test('all-room and refrigerated-ball routes expose the correct shaping checkpoint',()=>{
  const room=snapshot();room.fields.fermentationMethod='room';
  const b=W.createBatch({id:'room',recipe:room,startedAt:start,bakeAt:start+6*W.HOUR,plan:{preparation:.9,bulk:1,cold:20,ball:4}});
  assert.deepEqual(W.eventKeys(b.route),['start','bulkStart','shape','bake']);assert.equal(W.timeline(b).times.fridgeOut,undefined);assert.equal(b.timings.cold,0);
  const balls=snapshot();balls.fields.coldStorageMode='balls';
  const cold=W.createBatch({id:'balls',recipe:balls,startedAt:start,bakeAt:start+26*W.HOUR,plan:{preparation:.9,bulk:1,cold:20,ball:4}});
  assert.equal(W.timeline(cold).times.shape,W.timeline(cold).times.fridgeIn);
});
test('temperature proposal preserves anchors, uses actual past durations and only changes final proof',()=>{
  let b=batch();const c=W.summary(b.recipe,factors,D);
  b=W.recordEvent(b,'bulkStart',start+.9*W.HOUR,now);b=W.recordEvent(b,'fridgeIn',start+1.9*W.HOUR,now);b=W.recordEvent(b,'fridgeOut',start+21.9*W.HOUR,now);
  assert.equal(W.finalProofProposal(batch(),c,{doughTemp:24,fridgeTemp:4},D,start+3*W.HOUR).reason,'checkpoint-needed');
  const original=JSON.stringify(b),proposal=W.finalProofProposal(b,c,{doughTemp:24,fridgeTemp:4},D,start+22*W.HOUR);
  assert.equal(proposal.ok,true);assert.ok(Math.abs(proposal.ball-4)<.02);assert.ok(proposal.remaining<4);assert.equal(JSON.stringify(b),original);
  const expired=W.finalProofProposal(b,c,{doughTemp:30,fridgeTemp:8},D,start+35*W.HOUR);assert.equal(expired.ok,false);
});
test('room-temperature deadband remains inclusive and solver failures are explicit',()=>{
  const r=snapshot();r.fields.fermentationMethod='room';const c=W.summary(r,factors,D);
  const b=W.createBatch({id:'room',recipe:r,startedAt:start,bakeAt:start+6*W.HOUR,plan:{preparation:.9,bulk:1,cold:0,ball:4}});
  for(const temp of [23,24,25])assert.equal(W.finalProofProposal(b,c,{doughTemp:temp,fridgeTemp:null},D,start).reason,'deadband');
  assert.equal(W.finalProofProposal(b,c,{doughTemp:null,fridgeTemp:null},D,start).reason,'no-measurement');
});
test('storage sanitization rejects malformed active batches without losing valid recipes or mixer profiles',()=>{
  const saved={recipes:[{id:'r',name:'Weekend',recipe:snapshot()}],profiles:[{id:'p',name:'Artisan',method:'kitchenaid',model:'5KSM...',hook:'Spiral',programme:'Existing staged programme'}],profileId:'p',batch:{...batch(),events:{start,fridgeOut:start}},scale:.01};
  const restored=W.sanitize(saved);assert.equal(restored.batch,null);assert.equal(restored.recipes.length,1);assert.equal(restored.profileId,'p');assert.equal(restored.scale,.01);
  assert.deepEqual(W.sanitizeBatch(batch()),batch());
  assert.equal(W.sanitize({recipes:[...saved.recipes,...saved.recipes]}).recipes.length,1);
});
test('scale resolution is quantified without changing the recipe, including tiny and zero doses',()=>{
  const coarse=W.weighing(.17,1);assert.equal(coarse.nearest,0);assert.equal(coarse.tooCoarse,true);assert.equal(coarse.halfStep,.5);
  assert.equal(W.weighing(.17,.01).tooCoarse,false);assert.equal(W.weighing(0,1).relativeHalfStep,null);
  assert.equal(W.weighing(.95,.1).nearest,1); // Decimal half steps round up consistently.
  assert.throws(()=>W.weighing(NaN,.1));
});
test('cold-storage capacity rounds boxes up and makes a real shortfall visible',()=>{
  assert.deepEqual(W.capacity(7,{ballsPerBox:6,boxes:1}),{needed:2,available:1,missing:1,fits:false});
  assert.equal(W.capacity(24,{ballsPerBox:6,boxes:4}).fits,true);
});
