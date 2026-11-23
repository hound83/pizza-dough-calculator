// DOM-independent numerical core. No browser state, translation or persistence.
const DoughCore=(()=>{
'use strict';
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
// Shared household thermal constants. These values describe the deliberately
// simple v1.2 model boundary; mixer/bowl/handling losses remain inside the
// effective stage rises in fermentation-live.js.
const CP_FLOUR=1.850; // J/(g*K)
const CP_WATER=4.186; // J/(g*K)
const CP_SALT=0.900;  // J/(g*K), engineering approximation
const CP_OIL=2.000;   // J/(g*K), engineering approximation
const AUTOLYSE_REST_HOURS=0.5;
const DIRECT_REST_HOURS=1/3;
const EFFECTIVE_REST_TAU_HOURS=2.27;

function thermalEquilibrium(parts){
  if(!Array.isArray(parts)||!parts.length)throw new RangeError('Thermal equilibrium requires parts.');
  let energy=0,capacity=0;
  for(const part of parts){
    if(!part||typeof part.temperature!=='number'||!Number.isFinite(part.temperature))throw new RangeError('Invalid thermal-part temperature.');
    const hasCapacity=part.capacity!=null;
    if(hasCapacity&&(typeof part.capacity!=='number'||!Number.isFinite(part.capacity)))throw new RangeError('Invalid thermal-part capacity.');
    if(!hasCapacity&&(
      typeof part.mass!=='number'||!Number.isFinite(part.mass)||
      typeof part.cp!=='number'||!Number.isFinite(part.cp)
    ))throw new RangeError('Invalid thermal-part mass or specific heat.');
    const partCapacity=hasCapacity?part.capacity:part.mass*part.cp;
    if(!Number.isFinite(partCapacity)||partCapacity<0)throw new RangeError('Invalid thermal-part capacity.');
    if(partCapacity===0)continue;
    energy+=partCapacity*Number(part.temperature);
    capacity+=partCapacity;
  }
  if(!Number.isFinite(energy)||!Number.isFinite(capacity)||capacity<=0)throw new RangeError('Invalid total thermal capacity.');
  return {temperature:energy/capacity,capacity};
}

function thermalEndTemperature(startTemp,environmentTemp,hours,tauHours){
  const values=[startTemp,environmentTemp,hours,tauHours];
  if(values.some(x=>!Number.isFinite(x))||values[2]<0||values[3]<=0)throw new RangeError('Invalid thermal phase.');
  return values[1]+(values[0]-values[1])*Math.exp(-values[2]/values[3]);
}

// Versioned household yeast-activity assumptions, not a measured universal curve.
// The warm tail models falling activity, not constant performance above 35 C.
const YEAST_TEMP_CURVE=Object.freeze([
  [0,0.01],[4,0.04],[8,0.09],[12,0.20],[16,0.42],[18,0.62],
  [21,1.00],[24,1.55],[27,2.35],[30,3.35],[32,3.55],[35,3.00],
  [38,2.20],[42,0.90],[46,0.10],[50,0.02]
].map(point=>Object.freeze(point)));

function interpolateCurve(points,x){
  if(x<=points[0][0])return points[0][1];
  if(x>=points[points.length-1][0])return points[points.length-1][1];
  for(let i=0;i<points.length-1;i++){
    const [x1,y1]=points[i],[x2,y2]=points[i+1];
    if(x>=x1&&x<=x2){const f=(x-x1)/(x2-x1);return y1+(y2-y1)*f;}
  }
  return 1;
}

function yeastTempActivity(t){
  return interpolateCurve(YEAST_TEMP_CURVE,clamp(t,0,50));
}

// A separate heuristic maturation index, not a laboratory measurement.
function maturationActivity(t){
  return clamp(Math.pow(2,(clamp(t,0,35)-21)/10),0.15,2.6);
}

function thermalTauHours(massKg,asBalls=false,ballWeight=250){
  if(asBalls){
    return clamp(1.10*Math.pow(Math.max(100,ballWeight)/250,1/3),0.7,2.0);
  }
  return clamp(2.40*Math.pow(Math.max(0.25,massKg),1/3),1.5,4.5);
}

function simulateThermalPhase(startTemp,envTemp,hours,tau,name,kind){
  if(hours<=0)return {name,kind,hours:0,envTemp,startTemp,endTemp:startTemp,gas:0,maturity:0};
  const step=Math.min(.10,Math.max(.025,hours/200));
  const n=Math.max(1,Math.ceil(hours/step)),dt=hours/n;
  let t=startTemp,gas=0,maturity=0;
  for(let i=0;i<n;i++){
    const next=thermalEndTemperature(t,envTemp,dt,tau);
    const mid=(t+next)/2;
    gas+=yeastTempActivity(mid)*dt;
    maturity+=maturationActivity(mid)*dt;
    t=next;
  }
  return {name,kind,hours,envTemp,startTemp,endTemp:t,gas,maturity,tau};
}

// Two heat capacities exchange energy through the dough. Only the outside
// exchanges heat with the kitchen or fridge. Rates are per hour.
const DOUGH_DENSITY=1100; // kg/m³
const DOUGH_HEAT_CAPACITY=2700; // J/(kg·K)
const DOUGH_CONDUCTIVITY=.40; // W/(m·K)
const CORE_FRACTION=0.4;
const SHELL_FRACTION=1-CORE_FRACTION;
function thermalGeometry(c,balls,storage={}){
  const boxes=clamp(Number(storage.bulkBoxes)||1,1,24);
  const kg=(balls?c.actualBall:c.total/boxes)/1000;
  const volume=kg/DOUGH_DENSITY;
  const radius=Math.cbrt(3*volume/(4*Math.PI));
  const height=balls?1.55*radius:storage.measuredDepth?clamp(storage.depth,1,30)/100:1.55*radius;
  const z=height/2, r=Math.sqrt(3*volume/(4*Math.PI*z));
  const p=1.6075;
  const area=4*Math.PI*Math.pow((Math.pow(r*r,p)+2*Math.pow(r*z,p))/3,1/p);
  const capacity=kg*DOUGH_HEAT_CAPACITY;
  // Diffusion length for an ellipsoid; the spherical limit is 6*alpha/R².
  const inside=3600*2*(DOUGH_CONDUCTIVITY/(DOUGH_DENSITY*DOUGH_HEAT_CAPACITY))*(2/(r*r)+1/(z*z));
  return {inside,outside:3600*area/(SHELL_FRACTION*capacity)};
}
function exchangeRate(cold,storage,exposure=1){
  const stacked=storage.layout==='stacked';
  const base=cold?6.5:8;
  return base*exposure*(cold&&stacked?.72:1)*(cold&&storage.load==='full'?.85:1);
}
// Exact matrix exponential for core/outside temperatures relative to ambient.
// Stable for long holds and for short, thin layers where explicit Euler fails.
function zoneStep(geometry,exchange,hours){
  const a=geometry.inside,b=a*CORE_FRACTION/SHELL_FRACTION,d=geometry.outside*exchange;
  const sum=a+b+d, gap=Math.sqrt((a-b-d)**2+4*a*b);
  const slow=2*a*d/(sum+gap),fast=(sum+gap)/2;
  const fastDecay=Math.exp(-fast*hours);
  const scale=(Math.exp(-slow*hours)-fastDecay)/gap;
  return {cc:fastDecay+(fast-a)*scale,cs:a*scale,sc:b*scale,ss:fastDecay+(fast-b-d)*scale};
}
function advanceZones(state,env,m){
  const core=state.core-env,shell=state.shell-env;
  return {core:env+m.cc*core+m.cs*shell,shell:env+m.sc*core+m.ss*shell};
}
function zoneMean(state){return CORE_FRACTION*state.core+SHELL_FRACTION*state.shell;}

function simulateFermentation(c){
  const storage=c.storage||{};
  const bulk=thermalGeometry(c,false),ball=thermalGeometry(c,true);
  let state={core:c.doughTemp,shell:c.doughTemp};
  const phases=[];
  function add(env,hours,geometry,name,kind,cold=false){
    const start=state;
    const steps=Math.max(1,Math.ceil(hours/.12)),dt=hours/steps;
    const m=zoneStep(geometry,exchangeRate(cold,storage),dt);
    let gas=0,maturity=0;
    for(let i=0;i<steps&&hours>0;i++){
      const next=advanceZones(state,env,m);
      const core=(state.core+next.core)/2,shell=(state.shell+next.shell)/2;
      gas+=dt*(CORE_FRACTION*yeastTempActivity(core)+SHELL_FRACTION*yeastTempActivity(shell));
      maturity+=dt*(CORE_FRACTION*maturationActivity(core)+SHELL_FRACTION*maturationActivity(shell));
      state=next;
    }
    phases.push({name,kind,hours,envTemp:env,startTemp:zoneMean(start),endTemp:zoneMean(state),
      coreStart:start.core,shellStart:start.shell,coreEnd:state.core,shellEnd:state.shell,gas,maturity});
  }
  add(c.room,c.bulk,bulk,'Bulk at room temp','bulk');
  if(c.ferm!=='room'){
    const asBalls=c.ferm==='coldBalls';
    add(c.fridge,c.cold,asBalls?ball:thermalGeometry(c,false,storage),asBalls?'Fridge • balls':'Fridge • bulk',asBalls?'coldBalls':'coldBulk',true);
  }
  add(c.room,c.ball,ball,c.ferm==='room'?'Ball proof at room temp':'Final warm-up',c.ferm==='room'?'ballRoom':'ballWarm');
  return {phases,gas:phases.reduce((v,p)=>v+p.gas,0),maturity:phases.reduce((v,p)=>v+p.maturity,0),
    endTemp:zoneMean(state),coreEnd:state.core,shellEnd:state.shell,massKg:c.total/1000,ballWeight:c.actualBall};
}

// Time from fridge exit to a reference core temperature. The two exposure
// scenarios are illustrative kitchen conditions, not statistical percentiles.
function warmupWindow(c,target=18){
  if(c.ferm==='room'||!c.cold)return null;
  const storage=c.storage||{};
  const bulk=thermalGeometry(c,false),ball=thermalGeometry(c,true);
  const coldGeometry=c.ferm==='coldBalls'?ball:thermalGeometry(c,false,storage);
  function crossing(coolFactor,warmFactor){
    const initial={core:c.doughTemp,shell:c.doughTemp};
    const beforeCold=advanceZones(initial,c.room,zoneStep(bulk,exchangeRate(false,storage),c.bulk));
    const atExit=advanceZones(beforeCold,c.fridge,zoneStep(coldGeometry,exchangeRate(true,storage,coolFactor),c.cold));
    if(atExit.core>=target)return 0;
    if(c.room<=target)return Infinity;
    const h=exchangeRate(false,storage,warmFactor);
    const tempAt=t=>advanceZones(atExit,c.room,zoneStep(ball,h,t)).core;
    let low=0,high=1;
    while(high<96 && tempAt(high)<target)high*=2;
    if(tempAt(high)<target)return Infinity;
    for(let i=0;i<18;i++){
      const mid=(low+high)/2;
      if(tempAt(mid)<target)low=mid;else high=mid;
    }
    return high;
  }
  const exposure=[.4,1.8];
  // A fridge can be warmer than a very cold starting batch. Check both
  // cooling assumptions against both warming assumptions before ordering.
  const times=exposure.flatMap(cooling=>exposure.map(warming=>crossing(cooling,warming)));
  const fast=Math.min(...times),slow=Math.max(...times);
  return {target,fast,slow,reachable:Number.isFinite(slow)};
}

function genericYeastModel(c,sim){
  const eq=Math.max(2,sim.gas);
  const styleFactor={neapolitan:1,avpn:1,canotto:1.08,ny:.95,thin:.86}[c.style]||1;
  const saltFactor=Math.exp((c.s-2.5)*0.09);
  let idy=0.68/Math.pow(eq,0.80);
  idy*=saltFactor*styleFactor;
  idy=clamp(idy,0.015,0.55);
  return {eq,idy,saltFactor,styleFactor};
}

// Baker percentages and practical weighing are shared by live and saved recipes.
function doughQuantities({pizzas,targetBall,h,s,y,o,practical}){
  const round=(value,step)=>Math.round(value/step)*step;
  const totalTarget=pizzas*targetBall;
  const factor=1+h/100+s/100+y/100+o/100;
  const flourExact=totalTarget/factor;
  let flour,water,salt,yeast,oil;
  if(practical){
    flour=round(flourExact,5);
    water=round(flour*h/100,5);
    salt=round(flour*s/100,1);
    yeast=round(flour*y/100,0.1);
    oil=round(flour*o/100,1);
  }else{
    flour=round(flourExact,0.1);
    water=round(flour*h/100,0.1);
    salt=round(flour*s/100,0.1);
    yeast=round(flour*y/100,0.01);
    oil=round(flour*o/100,0.1);
  }
  const total=flour+water+salt+yeast+oil;
  const actualBall=total/pizzas;
  const actualH=water/flour*100,actualS=salt/flour*100,actualY=yeast/flour*100,actualO=oil/flour*100;
  let reserve=round(water*(20/380),practical?5:0.1);
  reserve=clamp(reserve,practical?5:1,Math.max(practical?5:1,water*0.10));
  const mainWater=water-reserve;
  return {flour,water,salt,yeast,oil,total,actualBall,actualH,actualS,actualY,actualO,reserve,mainWater};
}

// Elapsed preparation includes the existing rest and all mixing stages.
function restHours(autolyse,minutes=30,mixRoute='standard'){
  if(mixRoute==='express')return 0;
  return autolyse?(Number(minutes)===60?1:AUTOLYSE_REST_HOURS):DIRECT_REST_HOURS;
}
function preparationHours(autolyse,method,minutes=30,mixRoute='standard',yeastType='idy'){
  if(mixRoute==='express')return ((method==='hand'?16:12)+(yeastType==='ady'?5:0))/60;
  if(autolyse)return restHours(true,minutes)+0.4;
  return DIRECT_REST_HOURS+(method==='hand'?5/12:4/15);
}

// One elapsed-time model for cards, deadlines and workflow checkpoints.
// Offsets are hours from the beginning of preparation; presentation owns dates.
function scheduleOffsets(c,preparation){
  const bulk=Number(c.bulk),cold=c.ferm==='room'?0:Number(c.cold),ball=Number(c.ball);
  if([preparation,bulk,cold,ball].some(v=>!Number.isFinite(v)||v<0))throw new RangeError('Invalid schedule duration.');
  const coldRoute=c.ferm!=='room';
  const bulkStart=preparation,fridgeIn=coldRoute?preparation+bulk:null;
  const fridgeOut=coldRoute?fridgeIn+cold:null;
  const ballStart=coldRoute?fridgeOut:preparation+bulk;
  return {start:0,bulkStart,fridgeIn,fridgeOut,ballStart,
    shape:c.ferm==='coldBalls'?fridgeIn:ballStart,
    bake:ballStart+ball,fermentation:bulk+cold+ball,
    beforeFridge:coldRoute?fridgeIn:null,preparation};
}
return Object.freeze({doughQuantities,CP_FLOUR,CP_WATER,CP_SALT,CP_OIL,AUTOLYSE_REST_HOURS,DIRECT_REST_HOURS,EFFECTIVE_REST_TAU_HOURS,YEAST_TEMP_CURVE,thermalEquilibrium,thermalEndTemperature,interpolateCurve,yeastTempActivity,maturationActivity,thermalTauHours,simulateThermalPhase,simulateFermentation,warmupWindow,restHours,genericYeastModel,preparationHours,scheduleOffsets});
})();
if(typeof module!=='undefined'&&module.exports)module.exports=DoughCore;
