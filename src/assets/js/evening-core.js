/* Pure evening identities, allocation, availability and portable templates. */
const EveningCore=(()=>{
  'use strict';
  const W=typeof WorkflowCore!=='undefined'?WorkflowCore:require('./workflow-core');
  const M=60000,H=60*M;
  const clone=W.clone;
  const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
  const number=(x,min,max)=>typeof x==='number'&&Number.isFinite(x)&&x>=min&&x<=max;
  const time=x=>number(x,0,8640000000000000);
  const id=x=>typeof x==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(x);
  const text=(x,n=80)=>typeof x==='string'?x.trim().slice(0,n):'';
  const unique=xs=>new Set(xs).size===xs.length;
  const amountKeys=['flour','water','salt','yeast','oil'];
  function apportion(total,weights,step){
    const units=Math.round(total/step),sum=weights.reduce((a,b)=>a+b,0);
    const exact=weights.map(w=>units*w/sum),out=exact.map(Math.floor);
    const order=exact.map((v,i)=>({i,remainder:v-out[i]})).sort((a,b)=>b.remainder-a.remainder||a.i-b.i);
    const remaining=units-out.reduce((a,b)=>a+b,0);
    for(let j=0;j<remaining;j++)out[order[j].i]++;
    return out.map(v=>Number((v*step).toFixed(8)));
  }
  function allocate(c,settings={}){
    if(!number(c.pizzas,1,24)||!Number.isInteger(c.pizzas)||!amountKeys.every(k=>number(c[k],0,50000))||!(c.flour>0)||!number(c.reserve,0,c.water))return {ok:false,reason:'ingredients'};
    const unit=settings.unit==='flour'?'flour':'dough',capacity=settings.capacity==null||settings.capacity===''?null:Number(settings.capacity);
    if(capacity!==null&&!number(capacity,1,50000))return {ok:false,reason:'capacity'};
    // Preserve a positive dose even when splitting the smallest parent dose.
    // More decimals describe allocation, never a claim that a scale can weigh it.
    const yeastStep=c.yeast>0?Math.min(.01,10**(Math.floor(Math.log10(c.yeast/c.pizzas))-1)):.01;
    const steps=Object.fromEntries([...amountKeys,'reserve'].map(k=>[k,k==='yeast'?yeastStep:c.practical?1:.1]));
    const totals=Object.fromEntries([...amountKeys,'reserve'].map(k=>[k,Number((Math.round(c[k]/steps[k])*steps[k]).toFixed(8))]));
    // Match the parent readout; use extra precision only for a dose that would
    // otherwise disappear entirely, or to share its displayed total across runs.
    const parentYeast=Math.round(c.yeast*100)/100;
    if(parentYeast>0)totals.yeast=parentYeast;
    totals.mainWater=Number((totals.water-totals.reserve).toFixed(8));
    const parentMass=amountKeys.reduce((s,k)=>s+c[k],0),perBall=(unit==='flour'?c.flour:parentMass)/c.pizzas;
    if(capacity!==null&&perBall>capacity+1e-8)return {ok:false,reason:'one-ball'};
    for(let count=1;count<=c.pizzas;count++){
      const weights=Array.from({length:count},(_,i)=>Math.floor(c.pizzas/count)+(i<c.pizzas%count?1:0));
      const parts=Object.fromEntries(Object.keys(steps).map(k=>[k,apportion(totals[k],weights,steps[k])]));
      const runs=weights.map((balls,i)=>{
        const exact=Object.fromEntries([...amountKeys,'reserve'].map(k=>[k,c[k]*balls/c.pizzas]));exact.mainWater=exact.water-exact.reserve;
        const display=Object.fromEntries(Object.keys(steps).map(k=>[k,parts[k][i]]));
        display.mainWater=Number((display.water-display.reserve).toFixed(8));
        display.reserveFirst=Number((Math.floor(display.reserve/steps.reserve/2)*steps.reserve).toFixed(8));display.reserveLast=Number((display.reserve-display.reserveFirst).toFixed(8));
        const exactMass=amountKeys.reduce((s,k)=>s+exact[k],0),displayMass=amountKeys.reduce((s,k)=>s+display[k],0);
        const capacityUsed=unit==='flour'?Math.max(exact.flour,display.flour):Math.max(exactMass,displayMass);
        return {balls,exact,display,capacityUsed,hydration:display.water/display.flour*100,yeastPct:display.yeast/display.flour*100};
      });
      if(runs.every(r=>(capacity===null||r.capacityUsed<=capacity+1e-8)&&r.display.mainWater>=0&&r.display.flour>0))return {ok:true,unit,capacity,totals,runs};
    }
    return {ok:false,reason:'rounding-capacity'};
  }

  function cleanSnapshot(value){
    if(!object(value)||!text(value.name)||!Array.isArray(value.before)||!Array.isArray(value.after))return null;
    const clean=xs=>xs.length<=40?xs.map(x=>object(x)&&text(x.name)&&number(x.quantity,0,20000)&&['g','ml','st'].includes(x.unit)?{name:text(x.name,160),nameEn:text(x.nameEn,160)||text(x.name,160),quantity:x.quantity,unit:x.unit}:null):null;
    const before=clean(value.before),after=clean(value.after);if(!before||!after||[...before,...after].some(x=>!x))return null;
    return {name:text(value.name,160),nameEn:text(value.nameEn,160)||text(value.name,160),before,after};
  }
  function cleanPizza(p,{history=false,privateNames=true}={}){
    if(!object(p)||!id(p.id)||!id(p.recipeId)||!object(p.custom))return null;
    const snapshot=cleanSnapshot(p.snapshot);if(!snapshot)return null;
    const cu=p.custom;if(!object(cu.excluded)||Object.keys(cu.excluded).length>50)return null;
    const excluded=Object.fromEntries(Object.entries(cu.excluded).filter(([k,v])=>k.length<=160&&v===true));
    if(!['traditional','nl'].includes(cu.pizzaStyle)||!['noSauce','extraCheese'].every(k=>typeof cu[k]==='boolean'))return null;
    if(cu.sauceOverride!==null&&!id(cu.sauceOverride))return null;
    const events={};
    if(history){
      if(!object(p.events))return null;
      for(const k of ['in','out'])if(p.events[k]!=null){if(!time(p.events[k]))return null;events[k]=p.events[k];}
      if(events.out!=null&&(events.in==null||events.out<events.in))return null;
    }
    return {id:p.id,name:privateNames?text(p.name):'',recipeId:p.recipeId,custom:{recipeId:p.recipeId,excluded,noSauce:cu.noSauce,extraCheese:cu.extraCheese,pizzaStyle:cu.pizzaStyle,sauceOverride:cu.sauceOverride},snapshot,runId:history&&id(p.runId)?p.runId:'',events,...(p.provenance==='legacy-current-choices'?{provenance:p.provenance}:{})};
  }
  function cleanTemplate(value,{privateNames=true,imported=false}={}){
    if(!object(value)||!id(value.id)||!text(value.name)||!['dough','sauce','full'].includes(value.mode))return null;
    const recipe=W.recipe(value.recipe);if(!recipe)return null;
    if(imported)recipe.preset='custom';
    if(!Array.isArray(value.pizzas)||value.pizzas.length!==Number(recipe.fields.pizzas))return null;
    const pizzas=value.pizzas.map(p=>cleanPizza(p,{privateNames}));if(pizzas.some(p=>!p)||!unique(pizzas.map(p=>p.id)))return null;
    const s=value.sauce;if(!object(s)||typeof s.enabled!=='boolean'||typeof s.automatic!=='boolean'||!id(s.type)||!number(s.grams,0,400))return null;
    const split=value.split;if(!object(split)||!['flour','dough'].includes(split.unit)||(split.capacity!==null&&!number(split.capacity,1,50000)))return null;
    return {id:value.id,name:text(value.name),recipe,mode:value.mode,pizzas,sauce:{enabled:s.enabled,automatic:s.automatic,type:s.type,grams:s.grams},split:{unit:split.unit,capacity:split.capacity},storage:W.storage(value.storage),scale:[1,.1,.01].includes(value.scale)?value.scale:.1,profile:W.profile(value.profile)};
  }
  function exportTemplate(value){
    const t=cleanTemplate(value,{privateNames:false});if(!t)throw new Error('template');
    t.name='Pizza evening';
    if(t.profile){t.profile.name='Mixer';t.profile.programme='';}
    return {format:'pizza-evening-template',version:1,template:t};
  }
  function importTemplate(value){return object(value)&&value.format==='pizza-evening-template'&&value.version===1?cleanTemplate(value.template,{imported:true,privateNames:false}):null;}

  function createEvening({id:eveningId,template,allocation,startedAt,bakeAt,plan,zone}){
    const t=cleanTemplate(template);if(!t||!id(eveningId)||!allocation.ok||allocation.runs.reduce((s,r)=>s+r.balls,0)!==t.pizzas.length)throw new Error('evening');
    let cursor=0;
    const runs=allocation.runs.map((part,i)=>{
      const runId=`${eveningId}-r${i+1}`,pizzaIds=t.pizzas.slice(cursor,cursor+part.balls).map(p=>p.id);cursor+=part.balls;
      return {id:runId,balls:part.balls,allocation:clone(part),pizzaIds,batch:i===0?W.createBatch({id:runId,recipe:t.recipe,startedAt,bakeAt,plan,profile:t.profile,storage:t.storage,scale:t.scale}):null};
    });
    return {id:eveningId,name:t.name,template:t,recipe:clone(t.recipe),bakeAt,createdAt:startedAt,zone:text(zone,80),plan:clone(plan),runs,pizzas:t.pizzas.map(p=>({...p,runId:runs.find(r=>r.pizzaIds.includes(p.id)).id})),selectedRun:runs[0].id,revision:0,status:'active',timer:null,undo:null,manualGap:null};
  }
  function startRun(e,runId,at){
    const out=clone(e),run=out.runs.find(r=>r.id===runId),i=out.runs.indexOf(run);
    if(!run||run.batch)return out;
    if(i>0&&!W.eventDone(out.runs[i-1].batch||{events:{}},'bulkStart'))throw new Error('bowl-busy');
    if(!time(at)||at>Date.now()+60000||at>=e.bakeAt)throw new Error('future');
    const previous=out.runs[i-1]?.batch?.events.bulkStart;if(previous!=null&&at<previous)throw new Error('order');
    run.batch=W.createBatch({id:run.id,recipe:e.recipe,startedAt:at,bakeAt:e.bakeAt,plan:e.plan,profile:e.template.profile,storage:e.template.storage,scale:e.template.scale});
    out.selectedRun=run.id;out.undo=null;out.revision++;return out;
  }
  function movePizza(e,pizzaId,offset){
    const out=clone(e),index=out.pizzas.findIndex(p=>p.id===pizzaId);if(index<0||out.pizzas[index].events.in!=null)throw new Error('completed');
    const next=Math.max(0,Math.min(out.pizzas.length-1,index+offset));
    const [pizza]=out.pizzas.splice(index,1);out.pizzas.splice(next,0,pizza);out.revision++;return out;
  }
  function bake(e,pizzaId,action,at){
    if(!time(at)||at>Date.now()+60000)throw new Error('future');
    const out=clone(e),p=out.pizzas.find(p=>p.id===pizzaId);if(!p)throw new Error('pizza');
    const run=out.runs.find(r=>r.id===p.runId);if(!run?.batch)throw new Error('run-not-started');
    if(action==='in'){
      if(p.events.in!=null)return out;
      if(out.pizzas.some(p=>p.events.in!=null&&p.events.out==null))throw new Error('oven-busy');
      const lastOut=Math.max(0,...out.pizzas.map(p=>p.events.out||0));if(at<lastOut)throw new Error('order');
      if(!W.eventDone(run.batch,'bake'))run.batch=W.recordEvent(run.batch,'bake',at);
      else if(run.batch.events.bake!=null&&at<run.batch.events.bake)throw new Error('order');
      p.events.in=at;
    }else if(action==='out'){
      if(p.events.out!=null)return out;
      if(p.events.in==null||at<p.events.in)throw new Error('order');p.events.out=at;
    }else throw new Error('event');
    out.undo={type:'pizza',id:pizzaId,action,at,priorRunBake:clone(e.runs.find(r=>r.id===p.runId).batch.events),priorUnknown:clone(e.runs.find(r=>r.id===p.runId).batch.unknownEvents||[])};
    out.revision++;return out;
  }
  function undo(e){
    if(!e.undo)throw new Error('nothing-to-undo');const out=clone(e),u=out.undo;
    if(u.type==='pizza'){
      const p=out.pizzas.find(p=>p.id===u.id);if(!p||p.events[u.action]!==u.at)throw new Error('dependent');
      if(out.pizzas.some(other=>other.id!==p.id&&Object.values(other.events).some(at=>at>=u.at)))throw new Error('dependent');
      if(u.action==='in'&&p.events.out!=null)throw new Error('dependent');delete p.events[u.action];
      const run=out.runs.find(r=>r.id===p.runId);run.batch.events=u.priorRunBake;run.batch.unknownEvents=u.priorUnknown;
    }else if(u.type==='event'){
      const run=out.runs.find(r=>r.id===u.runId);if(!run?.batch)throw new Error('dependent');
      const keys=W.eventKeys(run.batch.route),index=keys.indexOf(u.key);
      if(keys.slice(index+1).some(k=>W.eventDone(run.batch,k)))throw new Error('dependent');
      run.batch.events=clone(u.events);run.batch.unknownEvents=clone(u.unknownEvents);run.batch.progress=clone(u.progress);
    }else throw new Error('nothing-to-undo');
    out.undo=null;out.revision++;return out;
  }
  function close(e,at){const out=clone(e);out.status='finished';out.closedAt=at;out.timer=null;out.undo=null;out.runs.forEach(r=>{if(r.batch)r.batch.status='finished';});return out;}
  function forecast(pizzas,{low,high,gap=60,manualGap=null},now){
    const baked=pizzas.filter(p=>p.events.out!=null).sort((a,b)=>a.events.in-b.events.in);
    const mean=xs=>xs.reduce((s,x)=>s+x,0)/xs.length;
    const bakeSeconds=baked.length?mean(baked.map(p=>(p.events.out-p.events.in)/1000)):(low+high)/2;
    const launches=pizzas.filter(p=>p.events.in!=null).sort((a,b)=>a.events.in-b.events.in);
    const gaps=launches.slice(1).map((p,i)=>launches[i].events.out==null?null:(p.events.in-launches[i].events.out)/1000).filter(x=>x!==null&&x>=0);
    const gapSeconds=number(manualGap,0,3600)?manualGap:gaps.length?mean(gaps):gap;
    const queued=pizzas.filter(p=>p.events.in==null).length,inOven=pizzas.find(p=>p.events.in!=null&&p.events.out==null);
    const ovenRemaining=inOven?Math.max(0,bakeSeconds-(now-inOven.events.in)/1000):0;
    return {bakeSeconds,gapSeconds,observed:baked.length,gaps:gaps.length,remaining:queued+(inOven?1:0),finishAt:now+(ovenRemaining+queued*bakeSeconds+Math.max(0,queued-(inOven?0:1))*gapSeconds)*1000,firstReadyAt:baked[0]?.events.out??now+(inOven?ovenRemaining:bakeSeconds)*1000};
  }

  function schedule({plan,route,runBalls,bakeAt,autolyse,cleanup=0,preheat=30,bakeMinutes=20,sauceMinutes=0}){
    const tasks=[],base=bakeAt-(plan.preparation+plan.bulk+(route==='room'?0:plan.cold)+plan.ball)*H;
    const add=(kind,start,minutes,run,active=true)=>tasks.push({kind,start,end:start+minutes*M,run,active});
    const prep=plan.preparation*60,rest=autolyse?30:20,mix=4,finish=prep-rest-mix;
    for(let i=0;i<runBalls.length;i++){
      const start=base+i*(prep+cleanup)*M,bulk=start+prep*M;
      add('mix',start,mix,i);add('rest',start+mix*M,rest,i,false);add('finish',start+(mix+rest)*M,finish,i);
      if(cleanup)add('cleanup',bulk,cleanup,i);
      const inAt=bulk+plan.bulk*H,outAt=inAt+(route==='room'?0:plan.cold)*H;
      if(route==='room')add('shape',inAt,Math.max(3,runBalls[i]*1.2),i);
      else{add('fridgeIn',inAt,route==='coldBalls'?Math.max(3,runBalls[i]*1.2):2,i);add('fridgeOut',outAt,2,i);if(route==='hybrid')add('shape',outAt+2*M,Math.max(3,runBalls[i]*1.2),i);}
    }
    const oven=bakeAt-preheat*M;
    // Reserve attendance across preheat. A hot oven is never assumed safe to leave.
    add('oven',oven,preheat,-1,false);tasks.at(-1).attendance=true;
    add('ovenSetup',oven,2,-1);add('ovenCheck',bakeAt-2*M,2,-1);
    if(sauceMinutes)add('sauce',oven-sauceMinutes*M,sauceMinutes,-1);
    add('bake',bakeAt,bakeMinutes+(runBalls.length-1)*(prep+cleanup),-1);
    return tasks.sort((a,b)=>a.start-b.start||a.run-b.run);
  }
  const overlap=(a,b)=>a.start<b.end&&b.start<a.end;
  function conflicts(tasks,{earliest=null,unavailable=[]}={}){
    const out=[];
    for(const task of tasks){
      if(!task.active&&!task.attendance)continue;
      if(earliest!=null&&task.start<earliest)out.push({reason:'earliest',task});
      if(unavailable.some(interval=>overlap(task,interval)))out.push({reason:'unavailable',task});
    }
    const active=tasks.filter(t=>t.active);
    for(let i=0;i<active.length;i++)for(let j=i+1;j<active.length;j++)if(overlap(active[i],active[j]))out.push({reason:'resource',task:active[j],other:active[i]});
    return out;
  }
  function alternatives(tasks,constraints,maxMinutes=1440){
    const out=[];
    for(let minutes=15;minutes<=maxMinutes&&out.length<2;minutes+=15){
      const shifted=tasks.map(t=>({...t,start:t.start+minutes*M,end:t.end+minutes*M}));
      if(!conflicts(shifted,constraints).length){out.push({minutes,tasks:shifted});minutes+=45;}
    }
    return out;
  }
  function migrateLegacy(batch,template,quantities,zone){
    if(!batch)return null;
    const allocation=allocate(quantities),base=template?cleanTemplate(template):null;
    const r={id:batch.id,balls:Number(batch.recipe.fields.pizzas),allocation:allocation.runs[0],pizzaIds:base?base.pizzas.map(p=>p.id):[],batch:clone(batch)};
    const fallback={id:`legacy-${batch.id}`,name:'Pizza',recipe:clone(batch.recipe),mode:'dough',pizzas:[],sauce:{enabled:false,automatic:true,type:'sanMarzano',grams:80},split:{unit:'dough',capacity:null},storage:batch.storage,scale:batch.scale,profile:batch.profile};
    return {id:batch.id,name:base?.name||'Pizza',template:base||fallback,recipe:clone(batch.recipe),bakeAt:batch.bakeAt,createdAt:batch.startedAt,zone,plan:clone(batch.initial),runs:[r],pizzas:base?base.pizzas.map(p=>({...p,runId:r.id,provenance:'legacy-current-choices'})):[],selectedRun:r.id,revision:0,status:batch.status,timer:null,undo:null,manualGap:null,legacyUnknownToppings:!base};
  }
  function sanitizeEvening(v){
    try{
      if(!object(v)||!id(v.id)||!W.recipe(v.recipe)||!time(v.bakeAt)||!time(v.createdAt)||v.createdAt>=v.bakeAt||!['active','finished'].includes(v.status))return null;
      const legacy=v.legacyUnknownToppings===true&&v.status==='finished',template=legacy?clone(v.template):cleanTemplate(v.template);if(!template)return null;
      if(!Array.isArray(v.runs)||v.runs.length<1||v.runs.length>24||!unique(v.runs.map(r=>r.id)))return null;
      const runs=v.runs.map(r=>{
        if(!object(r)||!id(r.id)||!Number.isInteger(r.balls)||!number(r.balls,1,24)||!object(r.allocation)||!Array.isArray(r.pizzaIds))throw new Error('run');
        const batch=r.batch===null?null:W.sanitizeBatch(r.batch);if(r.batch!==null&&!batch)throw new Error('batch');
        if(batch&&(batch.id!==r.id||batch.bakeAt!==v.bakeAt||JSON.stringify(batch.recipe)!==JSON.stringify(W.recipe(v.recipe))))throw new Error('snapshot');
        for(const k of [...amountKeys,'reserve','mainWater'])if(!number(r.allocation.exact?.[k],0,50000)||!number(r.allocation.display?.[k],0,50000))throw new Error('allocation');
        if(Math.abs(r.allocation.display.water-r.allocation.display.reserve-r.allocation.display.mainWater)>1e-7)throw new Error('water');
        return {...clone(r),batch};
      });
      if(runs.reduce((s,r)=>s+r.balls,0)!==Number(v.recipe.fields.pizzas))return null;
      if(!Array.isArray(v.pizzas)||v.pizzas.length!==(legacy?0:Number(v.recipe.fields.pizzas)))return null;
      const pizzas=v.pizzas.map(p=>cleanPizza(p,{history:true}));if(pizzas.some(p=>!p)||!unique(pizzas.map(p=>p.id)))return null;
      if(pizzas.filter(p=>p.events.in!=null&&p.events.out==null).length>1)return null;
      for(const p of pizzas){const run=runs.find(r=>r.id===p.runId);if(!run||!run.pizzaIds.includes(p.id))return null;if(p.events.in!=null&&(!run.batch||!W.eventDone(run.batch,'bake')))return null;}
      if(!legacy&&runs.some(r=>r.pizzaIds.length!==r.balls||r.pizzaIds.some(pid=>!pizzas.some(p=>p.id===pid&&p.runId===r.id))))return null;
      if(!runs.some(r=>r.id===v.selectedRun&&r.batch))return null;
      const launched=pizzas.filter(p=>p.events.in!=null).sort((a,b)=>a.events.in-b.events.in);
      if(launched.some((p,i)=>i>0&&(launched[i-1].events.out==null||p.events.in<launched[i-1].events.out)))return null;
      if(launched.some(p=>{const b=runs.find(r=>r.id===p.runId).batch;return b.events.bake!=null&&p.events.in<b.events.bake;}))return null;
      if(v.undo!=null){
        const u=v.undo,run=u.type==='event'?runs.find(r=>r.id===u.runId):runs.find(r=>r.pizzaIds.includes(u.id));
        if(!object(u)||!run?.batch)return null;
        const events=u.type==='event'?u.events:u.priorRunBake,unknown=u.type==='event'?u.unknownEvents:u.priorUnknown;
        const prior=W.sanitizeBatch({...run.batch,events,unknownEvents:unknown,progress:u.type==='event'?u.progress:run.batch.progress});
        if(!prior||!Array.isArray(unknown)||JSON.stringify(prior.events)!==JSON.stringify(events)||JSON.stringify(prior.unknownEvents||[])!==JSON.stringify(unknown))return null;
        const changed=u.type==='event'?u.key:'bake';
        if(!W.eventKeys(run.batch.route).includes(changed))return null;
        for(const key of W.eventKeys(run.batch.route).filter(k=>k!==changed))if(events[key]!==run.batch.events[key]||unknown.includes(key)!==(run.batch.unknownEvents||[]).includes(key))return null;
        if(u.type==='pizza'){
          const p=pizzas.find(p=>p.id===u.id);if(!p||!['in','out'].includes(u.action)||p.events[u.action]!==u.at)return null;
        }else if(u.type!=='event'||JSON.stringify(prior.progress)!==JSON.stringify(u.progress))return null;
      }
      const timer=v.timer===null?null:object(v.timer)&&time(v.timer.endAt)&&time(v.timer.startedAt)&&v.timer.endAt>=v.timer.startedAt&&id(v.timer.runId)?{startedAt:v.timer.startedAt,endAt:v.timer.endAt,runId:v.timer.runId,label:text(v.timer.label)}:null;
      const plan=v.plan;if(!object(plan)||!['preparation','bulk','cold','ball'].every(k=>number(plan[k],0,k==='cold'?120:k==='preparation'?12:48)))return null;
      return {...clone(v),name:text(v.name),recipe:W.recipe(v.recipe),template,runs,pizzas,timer,revision:Number.isSafeInteger(v.revision)&&v.revision>=0?v.revision:0,zone:text(v.zone),manualGap:number(v.manualGap,0,3600)?v.manualGap:null,undo:object(v.undo)?clone(v.undo):null};
    }catch{return null;}
  }
  function validateAllocations(e,quantities){
    const expected=allocate(quantities,e.legacyUnknownToppings?{}:e.template.split);
    if(!expected.ok||expected.runs.length!==e.runs.length)return false;
    return e.runs.every((run,i)=>run.balls===expected.runs[i].balls&&
      ['exact','display'].every(kind=>Object.entries(expected.runs[i][kind]).every(([key,value])=>number(run.allocation[kind]?.[key],0,50000)&&Math.abs(run.allocation[kind][key]-value)<1e-7)));
  }
  return Object.freeze({allocate,apportion,cleanPizza,cleanTemplate,cleanSnapshot,exportTemplate,importTemplate,createEvening,startRun,movePizza,bake,undo,close,forecast,schedule,conflicts,alternatives,migrateLegacy,sanitizeEvening,validateAllocations});
})();
if(typeof module!=='undefined'&&module.exports)module.exports=EveningCore;
