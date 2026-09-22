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

function simulateFermentation(c){
  const massKg=Math.max(.25,c.total/1000);
  const ballWeight=Math.max(100,c.actualBall);
  const bulkTau=thermalTauHours(massKg,false,ballWeight);
  const ballTau=thermalTauHours(ballWeight/1000,true,ballWeight);
  let t=c.doughTemp,phases=[];

  const add=(env,hours,tau,name,kind)=>{
    const p=simulateThermalPhase(t,env,hours,tau,name,kind);phases.push(p);t=p.endTemp;
  };

  add(c.room,c.bulk,bulkTau,'Bulk at room temp','bulk');
  if(c.ferm==='hybrid'){
    add(c.fridge,c.cold,bulkTau,'Fridge • bulk','coldBulk');
    add(c.room,c.ball,ballTau,'Ball proof / warm-up','ballWarm');
  }else if(c.ferm==='coldBalls'){
    add(c.fridge,c.cold,ballTau,'Fridge • balls','coldBalls');
    add(c.room,c.ball,ballTau,'Final warm-up','ballWarm');
  }else{
    add(c.room,c.ball,ballTau,'Ball proof at room temp','ballRoom');
  }

  return {
    phases,
    gas:phases.reduce((a,p)=>a+p.gas,0),
    maturity:phases.reduce((a,p)=>a+p.maturity,0),
    endTemp:t,
    bulkTau,ballTau,massKg,ballWeight
  };
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

// Elapsed preparation includes the existing rest and all mixing stages.
function preparationHours(autolyse,method){
  if(autolyse)return AUTOLYSE_REST_HOURS+0.4;
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
return Object.freeze({CP_FLOUR,CP_WATER,CP_SALT,CP_OIL,AUTOLYSE_REST_HOURS,DIRECT_REST_HOURS,EFFECTIVE_REST_TAU_HOURS,YEAST_TEMP_CURVE,thermalEquilibrium,thermalEndTemperature,interpolateCurve,yeastTempActivity,maturationActivity,thermalTauHours,simulateThermalPhase,simulateFermentation,genericYeastModel,preparationHours,scheduleOffsets});
})();
if(typeof module!=='undefined'&&module.exports)module.exports=DoughCore;
