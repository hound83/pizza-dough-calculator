'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const core=require('../src/assets/js/calculation-core.js');
const reference={total:880,actualBall:220,bulk:1,cold:20,ball:4,ferm:'hybrid',room:21,fridge:4,doughTemp:24,s:3,style:'neapolitan'};

test('exported yeast assumptions cannot be mutated by an adapter',()=>{
  assert.ok(Object.isFrozen(core.YEAST_TEMP_CURVE));
  for(const point of core.YEAST_TEMP_CURVE)assert.ok(Object.isFrozen(point));
  assert.throws(()=>{core.YEAST_TEMP_CURVE[6][1]=2;},TypeError);
  assert.equal(core.yeastTempActivity(21),1);
});

test('thermal exchange is composable, approaches the environment and preserves equilibrium',()=>{
  for(const [start,ambient] of [[24,4],[4,21],[21,21]]){
    const once=core.thermalEndTemperature(start,ambient,4,1.1);
    const twice=core.thermalEndTemperature(core.thermalEndTemperature(start,ambient,2,1.1),ambient,2,1.1);
    assert.ok(Math.abs(once-twice)<1e-12);
    assert.ok(once>=Math.min(start,ambient)&&once<=Math.max(start,ambient));
  }
  assert.throws(()=>core.thermalEndTemperature(24,4,2,0),RangeError);
});
test('thermal equilibrium conserves heat capacity without accepting invalid parts',()=>{
  const r=core.thermalEquilibrium([{mass:100,cp:4,temperature:10},{mass:200,cp:2,temperature:30}]);
  assert.deepEqual(r,{temperature:20,capacity:800});
  assert.throws(()=>core.thermalEquilibrium([{mass:100,cp:4,temperature:NaN}]),RangeError);
});
test('yeast advice takes style from explicit input and needs no DOM or language state',()=>{
  const sim=core.simulateFermentation(reference);
  const regular=core.genericYeastModel(reference,sim);
  const thin=core.genericYeastModel({...reference,style:'thin'},sim);
  assert.ok(Math.abs(thin.idy/regular.idy-.86)<1e-12);
  assert.equal(sim.phases.length,3);
  assert.ok(sim.phases[0].endTemp===sim.phases[1].startTemp);
});
test('all routes share coherent preparation, shaping and fridge offsets',()=>{
  for(const method of ['hand','kitchenaid','kenwood','pro'])for(const autolyse of [true,false])for(const ferm of ['room','hybrid','coldBalls']){
    const prep=core.preparationHours(autolyse,method),c={...reference,ferm};
    const times=core.scheduleOffsets(c,prep);
    assert.ok(Math.abs(times.bake-prep-times.fermentation)<1e-10);
    assert.equal(times.bulkStart,prep);
    if(ferm==='room')assert.equal(times.fridgeOut,null);
    else {
      assert.equal(times.fridgeOut-times.fridgeIn,20);
      assert.equal(times.shape,ferm==='coldBalls'?times.fridgeIn:times.fridgeOut);
    }
  }
  assert.equal(core.scheduleOffsets(reference,.9).beforeFridge,1.9);
});
test('zero-duration phases stay valid and never introduce phantom fridge time',()=>{
  const c={...reference,bulk:0,cold:0,ball:0};
  assert.equal(core.scheduleOffsets(c,.9).bake,.9);
  assert.equal(core.simulateFermentation(c).gas,0);
  assert.throws(()=>core.scheduleOffsets({...c,bulk:-1},.9),RangeError);
});
test('heat crosses the outside before the core and survives phase changes',()=>{
  const plan={...reference,doughTemp:20,room:20,bulk:0,cold:1,ball:2};
  const {phases}=core.simulateFermentation(plan);
  const chilled=phases[1],warm=phases[2];
  assert.ok(chilled.shellEnd<chilled.endTemp && chilled.endTemp<chilled.coreEnd && chilled.coreEnd<20);
  assert.equal(warm.coreStart,chilled.coreEnd);
  assert.equal(warm.shellStart,chilled.shellEnd);
  assert.ok(warm.shellEnd>warm.coreEnd);
  const equilibrium=core.simulateFermentation({...plan,fridge:20}).phases;
  assert.ok(equilibrium.every(p=>p.coreEnd===20 && p.shellEnd===20));
});

test('bulk depth, amount per box and shelf exposure affect only the applicable phases',()=>{
  const base={...reference,doughTemp:20,room:20,bulk:0,cold:2,ball:0};
  const cold=(storage,ferm='hybrid')=>core.simulateFermentation({...base,storage,ferm}).phases[1].coreEnd;
  assert.ok(cold({depth:3,measuredDepth:true}) < cold({depth:7,measuredDepth:true}));
  assert.ok(cold({bulkBoxes:2}) < cold({bulkBoxes:1}));
  assert.ok(cold({layout:'stacked'}) > cold({layout:'single'}));
  assert.equal(cold({bulkBoxes:3,depth:3,measuredDepth:true},'coldBalls'),cold({},'coldBalls'));
  const range=core.warmupWindow(reference);
  assert.ok(range.fast>0 && range.slow>range.fast);
  assert.equal(core.warmupWindow({...reference,room:17}).reachable,false);
});

test('rest choice and express preparation use distinct elapsed times',()=>{
  assert.equal(core.preparationHours(true,'kitchenaid',60),1.4);
  assert.equal(core.preparationHours(true,'kitchenaid',30),.9);
  assert.equal(core.preparationHours(false,'kitchenaid',60),.6);
  assert.ok(core.preparationHours(false,'hand',30,'express')<=.3);
});

test('cold bulk scenario follows the independent Nippala core readings at the stated mass bound',()=>{
  const dough={...reference,total:1000,room:19.9,doughTemp:19.9,fridge:3,bulk:0,ball:0};
  for(const [hours,reading] of [[1,17.9],[2,12.8],[4,7.3],[8,4.0]]){
    const sample=core.simulateFermentation({...dough,cold:hours}).phases[1];
    assert.ok(Math.abs(sample.coreEnd-reading)<1.5,`hour ${hours}: ${sample.coreEnd}`);
  }
  // Lehmann reported a 2–2.5 hour crossing for a group up to 340 g.
  const lab={...reference,total:340,actualBall:340,doughTemp:1.67,room:20.55,fridge:1.67,bulk:0,cold:24,ferm:'coldBalls'};
  const window=core.warmupWindow(lab,10);
  assert.ok(window.fast<=2 && window.slow>=2.5);
  const room={...reference,ferm:'room'};
  assert.deepEqual(core.simulateFermentation(room),core.simulateFermentation({...room,storage:{bulkBoxes:4,depth:2,measuredDepth:true,layout:'stacked'}}));
});
