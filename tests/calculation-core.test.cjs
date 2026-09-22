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
