/* Immutable recipe snapshots, batch chronology and practical planning helpers. */
const WorkflowCore=(()=>{
  'use strict';
  const HOUR=3600000;
  const METHODS=['hand','kitchenaid','kenwood','pro'];
  const NUMBER_FIELDS={pizzas:[1,24],diameter:[20,40],ballWeight:[100,1000],hydration:[45,85],saltPct:[0,5],yeastPct:[0,3],oilPct:[0,10],stoneTemp:[180,520],preheatMinutes:[5,120],bulkHours:[0,48],coldHours:[0,120],ballHours:[0,48],roomTemp:[10,35],fridgeTemp:[0,15],finalDoughTemp:[10,35],flourW:[90,450]};
  const SELECT_FIELDS={doughStyle:['neapolitan','avpn','canotto','ny','thin'],yeastType:['idy','ady','fresh'],fermentationMethod:['room','hybrid'],coldStorageMode:['bulk','balls'],flourType:['caputoPizzeria','tipo00','manitoba','tarwebloem','speltWit','speltVolkoren','volkorenTarwe','custom']};
  const CHECK_FIELDS=['practical','autolyse','sizeFromDiameter'];
  const FIELD_IDS=[...Object.keys(NUMBER_FIELDS),...Object.keys(SELECT_FIELDS)];
  const clone=value=>JSON.parse(JSON.stringify(value));
  const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
  const bounded=(value,low,high)=>typeof value==='number'&&Number.isFinite(value)&&value>=low&&value<=high;
  const cleanText=(value,length=80)=>typeof value==='string'?value.trim().slice(0,length):'';
  const validTime=value=>bounded(value,0,8640000000000000);
  const id=value=>typeof value==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(value)?value:'';

  // Reject incomplete imports rather than quietly inventing missing ingredients.
  function recipe(value){
    if(!object(value)||!object(value.fields)||!object(value.checks)||!METHODS.includes(value.method))return null;
    const fields={};
    for(const [key,[low,high]] of Object.entries(NUMBER_FIELDS)){
      const raw=value.fields[key];
      if((key==='flourW'||key==='finalDoughTemp')&&raw===''){fields[key]='';continue;}
      if((typeof raw!=='string'&&typeof raw!=='number')||String(raw).trim()===''||!bounded(Number(raw),low,high))return null;
      fields[key]=String(raw);
    }
    if(!Number.isInteger(Number(fields.pizzas)))return null;
    for(const [key,options] of Object.entries(SELECT_FIELDS)){
      if(!options.includes(value.fields[key]))return null;
      fields[key]=value.fields[key];
    }
    const checks={};
    for(const key of CHECK_FIELDS){if(typeof value.checks[key]!=='boolean')return null;checks[key]=value.checks[key];}
    const exact={};
    for(const [key,low,high] of [['h',45,85],['s',0,5],['o',0,10],['ySelected',0,3]]){
      if(object(value.exact)&&bounded(value.exact[key],low,high))exact[key]=value.exact[key];
    }
    return {fields,checks,method:value.method,exact:Object.keys(exact).length?exact:null,preset:cleanText(value.preset)||'custom'};
  }

  function summary(snapshot,factors,core){
    const r=recipe(snapshot);
    if(!r)throw new TypeError('Invalid recipe.');
    const f=r.fields,e=r.exact||{},pizzas=Number(f.pizzas),factor=factors[f.doughStyle];
    if(!bounded(factor,.01,10))throw new TypeError('Missing dough-style factor.');
    const targetBall=r.checks.sizeFromDiameter?Math.round(Math.PI*(Number(f.diameter)/2)**2*factor/5)*5:Math.min(Number(f.ballWeight),Math.round(Math.PI*20**2*factor/5)*5);
    const h=e.h??Number(f.hydration),s=e.s??Number(f.saltPct),y=e.ySelected??Number(f.yeastPct),o=e.o??Number(f.oilPct);
    const ferm=f.fermentationMethod==='room'?'room':f.coldStorageMode==='balls'?'coldBalls':'hybrid';
    return {...core.doughQuantities({pizzas,targetBall,h,s,y,o,practical:r.checks.practical}),pizzas,targetBall,h,s,y,o,practical:r.checks.practical,style:f.doughStyle,presetKey:r.preset,yeastType:f.yeastType,ferm,bulk:Number(f.bulkHours),cold:ferm==='room'?0:Number(f.coldHours),ball:Number(f.ballHours),room:Number(f.roomTemp),fridge:Number(f.fridgeTemp),doughTemp:f.finalDoughTemp===''?24:Number(f.finalDoughTemp),autolyse:r.checks.autolyse,preparation:core.preparationHours(r.checks.autolyse,r.method)};
  }

  function profile(value){
    if(!object(value)||!id(value.id)||!cleanText(value.name)||!METHODS.includes(value.method))return null;
    return {id:value.id,name:cleanText(value.name),method:value.method,model:cleanText(value.model),hook:cleanText(value.hook),programme:cleanText(value.programme,300)};
  }
  function storage(value){
    const v=object(value)?value:{};
    return {ballsPerBox:bounded(v.ballsPerBox,1,24)?Math.floor(v.ballsPerBox):6,boxes:bounded(v.boxes,1,24)?Math.floor(v.boxes):1,depth:bounded(v.depth,1,30)?v.depth:5,layout:['single','stacked'].includes(v.layout)?v.layout:'single',load:['normal','full'].includes(v.load)?v.load:'normal'};
  }
  function capacity(pizzas,settings){
    const s=storage(settings),needed=Math.ceil(pizzas/s.ballsPerBox);
    return {needed,available:s.boxes,missing:Math.max(0,needed-s.boxes),fits:needed<=s.boxes};
  }
  // Resolution is display granularity, not a certified accuracy specification.
  function weighing(grams,resolution){
    const step=[1,.1,.01].includes(resolution)?resolution:.1;
    if(!bounded(grams,0,1000))throw new RangeError('Invalid yeast dose.');
    const nearest=Number((Math.round((grams+Number.EPSILON)/step)*step).toFixed(2));
    return {step,nearest,delta:Math.round((nearest-grams)*1e4)/1e4||0,halfStep:step/2,relativeHalfStep:grams>0?step/2/grams:null,tooCoarse:grams>0&&(nearest===0||step/2/grams>.1)};
  }

  const eventKeys=route=>route==='room'?['start','bulkStart','shape','bake']:['start','bulkStart','fridgeIn','fridgeOut','bake'];
  const eventDone=(batch,key)=>batch.events[key]!=null||(batch.unknownEvents||[]).includes(key);
  function recordUnknownEvent(batch,key,now=Date.now()){
    const keys=eventKeys(batch.route),index=keys.indexOf(key);
    if(index<=0)throw new RangeError('order');
    if(!eventDone(batch,keys[index-1]))throw new RangeError('missing-previous');
    const out=clone(batch);delete out.events[key];
    out.unknownEvents=[...new Set([...(out.unknownEvents||[]),key])];
    return out;
  }
  function durations(value,route){
    if(!object(value))return null;
    const limits={preparation:12,bulk:48,cold:120,ball:48},out={};
    for(const [key,max] of Object.entries(limits)){if(!bounded(value[key],0,max))return null;out[key]=value[key];}
    if(route==='room')out.cold=0;
    return out;
  }
  function createBatch({id:batchId,recipe:snapshot,bakeAt,startedAt,profile:mixer,storage:boxes,scale,plan}){
    const r=recipe(snapshot),route=r?.fields.fermentationMethod==='room'?'room':r?.fields.coldStorageMode==='balls'?'coldBalls':'hybrid';
    if(!r||!id(batchId)||!validTime(startedAt)||!validTime(bakeAt)||bakeAt<=startedAt||!durations(plan,route))throw new RangeError('Invalid batch.');
    return {id:batchId,recipe:r,route,bakeAt,startedAt,initial:durations(plan,route),timings:durations(plan,route),events:{start:startedAt},profile:profile(mixer),storage:storage(boxes),scale:[1,.1,.01].includes(scale)?scale:.1,readings:[],measurements:{doughTemp:null,fridgeTemp:null},progress:{},revisions:[],status:'active'};
  }
  function recordEvent(batch,key,at,now=Date.now()){
    const keys=eventKeys(batch.route),index=keys.indexOf(key);
    if(index<0||!validTime(at)||at>now+60000)throw new RangeError('future');
    const previous=keys.slice(0,index).reverse().map(k=>batch.events[k]).find(at=>at!=null),next=keys.slice(index+1).map(k=>batch.events[k]).find(at=>at!=null);
    if(index>0&&!eventDone(batch,keys[index-1]))throw new RangeError('missing-previous');
    if((previous!=null&&at<previous)||(next!=null&&at>next))throw new RangeError('order');
    if(key==='start'&&at>=batch.bakeAt)throw new RangeError('order');
    const out=clone(batch),old=out.events[key];
    out.events[key]=at;
    if(out.unknownEvents)out.unknownEvents=out.unknownEvents.filter(k=>k!==key);
    if(old!=null&&old!==at)out.revisions=[...out.revisions,{key,from:old,to:at,recordedAt:now}].slice(-40);
    return out;
  }
  function phaseDone(batch,key){
    return eventDone(batch,key==='preparation'?'bulkStart':key==='bulk'?(batch.route==='room'?'shape':'fridgeIn'):key==='cold'?'fridgeOut':'bake');
  }
  function timeline(batch){
    const keys=eventKeys(batch.route),d=batch.timings;
    const lengths=batch.route==='room'?[d.preparation,d.bulk,d.ball]:[d.preparation,d.bulk,d.cold,d.ball];
    let previous=batch.events.start;
    const times={start:previous},actual={start:true};
    keys.slice(1).forEach((key,index)=>{
      actual[key]=batch.events[key]!=null;
      times[key]=actual[key]?batch.events[key]:eventDone(batch,key)||previous===null?null:previous+lengths[index]*HOUR;
      previous=times[key];
    });
    times.ballStart=times[batch.route==='room'?'shape':'fridgeOut'];
    if(batch.route!=='room')times.shape=times[batch.route==='coldBalls'?'fridgeIn':'fridgeOut'];
    return {times,actual,delta:times.bake===null?null:(times.bake-batch.bakeAt)/HOUR};
  }
  function reviseTimings(batch,changes,now=Date.now()){
    const next=durations({...batch.timings,...changes},batch.route);
    if(!next)throw new RangeError('duration');
    const starts={preparation:'start',bulk:'bulkStart',cold:'fridgeIn',ball:batch.route==='room'?'shape':'fridgeOut'};
    for(const key of Object.keys(next)){
      if(next[key]===batch.timings[key])continue;
      if(phaseDone(batch,key))throw new RangeError('completed');
      const began=batch.events[starts[key]];
      if(began!=null&&next[key]<(now-began)/HOUR)throw new RangeError('elapsed');
    }
    return {...clone(batch),timings:next};
  }
  function actualSchedule(batch){
    const t=timeline(batch).times,e=batch.events;
    const duration=(a,b,key)=>a==null||b==null?batch.timings[key]:(b-a)/HOUR;
    return {bulk:duration(t.bulkStart,t[batch.route==='room'?'shape':'fridgeIn'],'bulk'),cold:batch.route==='room'?0:duration(t.fridgeIn,t.fridgeOut,'cold'),ball:duration(t.ballStart,t.bake,'ball'),preparation:duration(e.start,t.bulkStart,'preparation'),...((batch.unknownEvents||[]).length?{uncertain:true}:{})};
  }
  // A proposal changes only unfinished final proof. Actual anchors and the
  // requested bake time never move, and elapsed proof cannot be removed.
  function finalProofProposal(batch,c,measurements,core,now=Date.now()){
    if((batch.unknownEvents||[]).length)return {ok:false,reason:'unknown-history'};
    if(batch.events.bake!=null)return {ok:false,reason:'completed'};
    const md=measurements.doughTemp,mf=measurements.fridgeTemp;
    if(md==null&&mf==null)return {ok:false,reason:'no-measurement'};
    if(batch.route==='room'&&md!=null&&Math.abs(md-c.doughTemp)<=1)return {ok:false,reason:'deadband'};
    const actual=actualSchedule(batch),e=batch.events;
    const keys=eventKeys(batch.route),next=keys.find(key=>e[key]==null),view=timeline(batch);
    if(next&&next!=='bake'&&view.times[next]<now)return {ok:false,reason:'checkpoint-needed'};
    const bulk=Math.max(actual.bulk,e.bulkStart!=null&&!phaseDone(batch,'bulk')?(now-e.bulkStart)/HOUR:0);
    const cold=Math.max(actual.cold,e.fridgeIn!=null&&e.fridgeOut==null?(now-e.fridgeIn)/HOUR:0);
    const began=e[batch.route==='room'?'shape':'fridgeOut'];
    const minimum=Math.max(0,began==null?0:(now-began)/HOUR);
    const target=core.simulateFermentation(c).gas;
    const candidate=ball=>({...c,bulk,cold,ball,doughTemp:md??c.doughTemp,fridge:mf??c.fridge});
    const gas=ball=>core.simulateFermentation(candidate(ball)).gas;
    if(minimum>48||gas(minimum)>target*1.01)return {ok:false,reason:'past-target'};
    if(gas(48)<target)return {ok:false,reason:'unreachable'};
    let low=minimum,high=48;
    for(let i=0;i<28;i++){const middle=(low+high)/2;if(gas(middle)<target)low=middle;else high=middle;}
    const ball=Math.ceil(high*60)/60;
    return {ok:true,ball,remaining:Math.max(0,ball-minimum),gasRatio:gas(ball)/Math.max(.001,target),maturityRatio:core.simulateFermentation(candidate(ball)).maturity/Math.max(.001,core.simulateFermentation(c).maturity)};
  }

  function sanitizeBatch(value){
    try{
      if(!object(value)||!object(value.events))return null;
      let out=createBatch({...value,plan:value.initial});
      if(value.route!==out.route)return null;
      out.timings=durations(value.timings,out.route);if(!out.timings)return null;
      for(const key of eventKeys(out.route)){
        // Persisted observations keep their chronology even if the device clock
        // moved backwards. New input still uses recordEvent's live-clock check.
        if(value.events[key]!=null)out=recordEvent(out,key,value.events[key],Infinity);
        else if((value.unknownEvents||[]).includes(key))out=recordUnknownEvent(out,key,Infinity);
      }
      out.status=value.status==='finished'?'finished':'active';
      out.readings=(Array.isArray(value.readings)?value.readings:[]).filter(x=>object(x)&&['doughTemp','fridgeTemp'].includes(x.kind)&&validTime(x.at)&&bounded(x.value,x.kind==='doughTemp'?10:0,x.kind==='doughTemp'?40:15)).slice(-60).map(x=>({kind:x.kind,value:x.value,at:x.at}));
      for(const kind of ['doughTemp','fridgeTemp'])out.measurements[kind]=bounded(value.measurements?.[kind],kind==='doughTemp'?10:0,kind==='doughTemp'?40:15)?value.measurements[kind]:null;
      out.progress=object(value.progress)?Object.fromEntries(Object.entries(value.progress).filter(([key,checked])=>key.length<=200&&key.startsWith('s-')&&checked===true).slice(0,200)):{};
      out.revisions=(Array.isArray(value.revisions)?value.revisions:[]).filter(x=>object(x)&&eventKeys(out.route).includes(x.key)&&validTime(x.from)&&validTime(x.to)&&validTime(x.recordedAt)).slice(-40).map(x=>({key:x.key,from:x.from,to:x.to,recordedAt:x.recordedAt}));
      return out;
    }catch{return null;}
  }
  function sanitize(value){
    const v=object(value)?value:{};
    const unique=list=>list.filter((item,index)=>list.findIndex(other=>other.id===item.id)===index);
    const recipes=unique((Array.isArray(v.recipes)?v.recipes:[]).slice(0,30).map(x=>object(x)&&id(x.id)&&cleanText(x.name)&&recipe(x.recipe)?{id:x.id,name:cleanText(x.name),recipe:recipe(x.recipe)}:null).filter(Boolean));
    const profiles=unique((Array.isArray(v.profiles)?v.profiles:[]).slice(0,20).map(profile).filter(Boolean));
    const current=sanitizeBatch(v.batch);
    return {recipes,profiles,profileId:profiles.some(p=>p.id===v.profileId)?v.profileId:'',scale:[1,.1,.01].includes(v.scale)?v.scale:.1,storage:storage(v.storage),batch:current?.status==='active'?current:null,history:unique((Array.isArray(v.history)?v.history:[]).slice(-20).map(sanitizeBatch).filter(Boolean))};
  }
  function exportRecipe(name,snapshot){
    const r=recipe(snapshot);if(!r)throw new TypeError('Invalid recipe.');
    return {format:'pizza-dough-recipe',version:1,name:cleanText(name)||'Pizza',recipe:r};
  }
  function importRecipe(value){
    if(!object(value)||value.format!=='pizza-dough-recipe'||value.version!==1||!cleanText(value.name)||!recipe(value.recipe))return null;
    return {name:cleanText(value.name),recipe:{...recipe(value.recipe),preset:'custom'}};
  }
  return Object.freeze({HOUR,FIELD_IDS,CHECK_FIELDS,METHODS,recipe,summary,profile,storage,capacity,weighing,eventKeys,eventDone,recordUnknownEvent,createBatch,recordEvent,phaseDone,timeline,reviseTimings,actualSchedule,finalProofProposal,sanitizeBatch,sanitize,exportRecipe,importRecipe,clone});
})();
if(typeof module!=='undefined'&&module.exports)module.exports=WorkflowCore;
