// DDT startwaarden. Dit zijn nadrukkelijk GEEN universele mixerconstanten.
// Standmixers kunnen afhankelijk van model, snelheid, tijd en deegmassa veel
// meer warmte inbrengen. Het logboek kan daarom een persoonlijke effectieve
// correctie afleiden uit jouw werkelijke water- en einddeegtemperatuur.
// Die effectieve correctie mag ook koeling uit jouw vaste autolyseroutine
// absorberen: voor herhaalbaarheid is dat nuttiger dan doen alsof het pure
// mechanische wrijving is.
const DDT_START_CORRECTION={hand:3,kitchenaid:12,kenwood:12,pro:14};
const METHOD_LABELS={
  hand:{nl:'handmatig kneden',en:'hand kneading'},
  kitchenaid:{nl:'KitchenAid',en:'KitchenAid'},
  kenwood:{nl:'Kenwood',en:'Kenwood'},
  pro:{nl:'spiraalkneder',en:'spiral mixer'}
};
function methodLabel(method=currentMethod){
  const x=METHOD_LABELS[method]||METHOD_LABELS.kitchenaid;
  return currentLang==='en'?x.en:x.nl;
}
let bakeLog=[];

function median(values){
  const a=values.filter(Number.isFinite).slice().sort((x,y)=>x-y);
  if(!a.length)return null;
  const m=Math.floor(a.length/2);
  return a.length%2?a[m]:(a[m-1]+a[m])/2;
}
function ddtLogStats(method=currentMethod){
  const samples=bakeLog
    .filter(x=>x && x.method===method && x.ddtCorrection!=null && Number.isFinite(Number(x.ddtCorrection)))
    .map(x=>Number(x.ddtCorrection))
    .filter(x=>x>=-12&&x<=30)
    .slice(-8);
  return {count:samples.length,median:median(samples)};
}
function waterTempAdvice(c){
  // v50: logboekdata verandert het advies bewust NIET automatisch.
  // De gebruiker kan recept, proces en temperaturen zelf aanpassen; een vorige
  // bake is daarom context, geen automatische modelparameter.
  const correction=DDT_START_CORRECTION[currentMethod]??12;
  const flourT=c.room;
  const raw=3*c.doughTemp-flourT-c.room-correction;
  const water=clamp(raw,1,45);
  return {
    water,raw,correction,correctionCount:0,calibrated:false,target:c.doughTemp,
    clamped:Math.abs(raw-water)>0.05,
    cold:raw<14,
    hot:raw>32,
    avpnRange:raw>=16&&raw<=22
  };
}

const MIXER_FLOUR_GUIDE={
  kitchenaid:{label:'KitchenAid 4,8 L',maxFlour:1000,sourceNote:'veelvoorkomende 4,8 L Artisan-referentie'},
  kenwood:{label:'Kenwood Chef',maxFlour:1300,sourceNote:'gewone Chef-referentie'}
};
function mixerCapacityAdvice(c){
  const g=MIXER_FLOUR_GUIDE[currentMethod];
  if(!g)return null;
  const ratio=c.flour/g.maxFlour;
  return {g,ratio,over:ratio>1,near:ratio>=0.85};
}
function buildMixerCapacityNote(c){
  const box=$('mixerCapacityNote');
  if(!box)return;
  const x=mixerCapacityAdvice(c);
  if(!x){box.innerHTML='';return;}
  if(!x.near && !x.over){box.innerHTML='';return;}
  const cls=x.over?'warning':'info';
  const msg=x.over
    ? L(`<b>Batchgrootte:</b> ${fmt(c.flour,0)} g bloem ligt boven de praktische ${x.g.label}-referentie van ongeveer ${fmt(x.g.maxFlour,0)} g bloem. Verdeel dit deeg bij voorkeur over meerdere mixerbatches of controleer de handleiding van jouw exacte model.`,
        `<b>Batch size:</b> ${fmt(c.flour,0)} g flour exceeds the practical ${x.g.label} reference of about ${fmt(x.g.maxFlour,0)} g flour. Prefer splitting the dough into multiple mixer batches or check the manual for your exact model.`)
    : L(`<b>Batchgrootte:</b> ${fmt(c.flour,0)} g bloem zit dicht bij de praktische ${x.g.label}-referentie van ongeveer ${fmt(x.g.maxFlour,0)} g bloem. Houd motorgeluid, kombeweging en deegtemperatuur extra in de gaten; exacte modellen verschillen.`,
        `<b>Batch size:</b> ${fmt(c.flour,0)} g flour is close to the practical ${x.g.label} reference of about ${fmt(x.g.maxFlour,0)} g flour. Watch motor load, bowl movement and dough temperature more closely; exact models differ.`);
  box.innerHTML=`<div class="${cls}">${msg}</div>`;
}

// ---------------------------------------------------------------------
// LIVE FERMENTATIE-AANPASSING (v50)
// ---------------------------------------------------------------------
// Vooraf worden gist en tijden gekozen op basis van de DOEL-einddeegtemperatuur
// en de verwachte koelkasttemperatuur. Na het kneden staat de gist vast.
// Een werkelijke temperatuurmeting hoort daarom NIET achteraf de gistdosering
// te veranderen, maar alleen de nog toekomstige fermentatiefasen.
//
// Het doel van deze routine is bewust conservatief:
// 1) neem de oorspronkelijke simulatie als doel voor gasontwikkeling + rijping;
// 2) gebruik de werkelijk gemeten start-/koelkasttemperatuur;
// 3) verschuif tijd tussen warme en koude fasen, bij voorkeur zonder de totale
//    fermentatieduur (en dus een geplande baktijd) te veranderen;
// 4) zodra de koelkasttemperatuur wordt gemeten, is de bulkfase verleden tijd
//    en wordt die niet meer herschreven;
// 5) toon richtbereiken en een visuele eindcheck, geen schijnexacte minuten.

function validMeasured(x,min,max){
  if(x==null||String(x).trim()==='')return null;
  const n=Number(x);return Number.isFinite(n)&&n>=min&&n<=max?n:null;
}
function liveMeasurementValue(kind){
  return kind==='doughTemp'?validMeasured(liveMeasurements.doughTemp,10,40):validMeasured(liveMeasurements.fridgeTemp,0,15);
}
function setLiveMeasurement(kind,value){
  const raw=String(value??'').trim();
  if(kind==='doughTemp') liveMeasurements.doughTemp=raw===''?null:validMeasured(parseFloat(raw),10,40);
  if(kind==='fridgeTemp') liveMeasurements.fridgeTemp=raw===''?null:validMeasured(parseFloat(raw),0,15);
  _livePlanCache={key:null,value:null};
  update();
  scheduleSave();
}
function liveMeasureDisplay(kind){
  const v=liveMeasurementValue(kind);
  return v==null?'':fieldNum(v,1);
}
function smartHours(h){
  const x=Math.max(0,Number(h)||0);
  if(x<2)return `${Math.max(0,Math.round(x*60/5)*5)} min`;
  return `${fmt(x,2)} ${L('uur','h')}`;
}
function liveUncertaintyClass(c,live){
  const d=live?.measuredDough==null?0:Math.abs(live.measuredDough-c.doughTemp);
  const f=live?.measuredFridge==null?0:Math.abs(live.measuredFridge-c.fridge);
  if(d<=1&&f<=.5)return 'small';
  if(d<=3&&f<=1.5)return 'medium';
  return 'large';
}
function phaseRange(h,c,live,key){
  const x=Math.max(0,Number(h)||0);
  const cls=liveUncertaintyClass(c,live);
  // Coarse UX bands, not measurement precision. Temperature deviation is the
  // leading factor; cold phases receive a wider window than warm phases.
  const pads={
    small:{bulk:.15,ball:.20,cold:.35},
    medium:{bulk:.30,ball:.40,cold:.75},
    large:{bulk:.50,ball:.60,cold:1.25}
  };
  const pad=(pads[cls]||pads.medium)[key]??.35;
  return {low:Math.max(0,x-pad),high:x+pad,cls};
}
function phasePlanLabel(now,original,c,live,key){
  if(Math.abs(now-original)<0.08)return `<b>${smartHours(now)}</b>`;
  const r=phaseRange(now,c,live,key);
  return `<b>${smartHours(r.low)}–${smartHours(r.high)}</b> <span class="hint" style="display:inline;margin:0">(${L('modelmidden','model midpoint')} ${smartHours(now)} • ${L('was','was')} ${smartHours(original)})</span>`;
}
function simulateWithSchedule(c,startTemp,fridgeTemp,b,cold,ball){
  return simulateFermentation({...c,doughTemp:startTemp,fridge:fridgeTemp,bulk:b,cold,ball});
}
function _scheduleCost(sim,target,cand,orig){
  const gasErr=Math.abs(Math.log(Math.max(.001,sim.gas)/Math.max(.001,target.gas)));
  const matErr=Math.abs(Math.log(Math.max(.001,sim.maturity)/Math.max(.001,target.maturity)));
  // Voorkeur: temperatuurafwijkingen eerst opvangen met de bulk/koelkast-overgang.
  // De laatste bolrijs is culinair belangrijk voor ontspanning en openen en krijgt
  // daarom een hogere wijzigingsstraf. Dit is een productkeuze, geen natuurwet.
  const bulkPenalty=.015*Math.abs(cand.bulk-orig.bulk)/Math.max(.75,orig.bulk+.5);
  const ballPenalty=.080*Math.abs(cand.ball-orig.ball)/Math.max(1,orig.ball);
  const coldPenalty=.015*Math.abs(cand.cold-orig.cold)/Math.max(4,orig.cold||4);
  return gasErr+.18*matErr+bulkPenalty+ballPenalty+coldPenalty;
}
function _optimizeLiveSchedule(c,startTemp,fridgeTemp,freezeBulk=null){
  const target=simulateFermentation(c);
  const orig={bulk:c.bulk,cold:c.ferm==='room'?0:c.cold,ball:c.ball};
  const total=orig.bulk+orig.cold+orig.ball;
  let best=null;

  const evalCandidate=(bulk,cold,ball)=>{
    if(bulk<0||cold<0||ball<0)return;
    const sim=simulateWithSchedule(c,startTemp,fridgeTemp,bulk,cold,ball);
    const cand={bulk,cold,ball};
    const cost=_scheduleCost(sim,target,cand,orig);
    if(!best||cost<best.cost)best={...cand,sim,cost};
  };

  if(c.ferm==='room'){
    const b0=freezeBulk==null?Math.max(0,orig.bulk-3):freezeBulk;
    const b1=freezeBulk==null?Math.min(total,orig.bulk+3):freezeBulk;
    for(let b=b0;b<=b1+1e-8;b+=.25)evalCandidate(b,0,Math.max(0,total-b));
  }else{
    const b0=freezeBulk==null?Math.max(0,orig.bulk-2):freezeBulk;
    const b1=freezeBulk==null?Math.min(total,orig.bulk+2):freezeBulk;
    const ball0=Math.max(0,orig.ball-3),ball1=Math.min(total,orig.ball+3);
    for(let b=b0;b<=b1+1e-8;b+=.25){
      for(let ball=ball0;ball<=ball1+1e-8;ball+=.25){
        const cold=total-b-ball;
        if(cold>=0)evalCandidate(b,cold,ball);
      }
    }
  }

  return {best,target,total,orig};
}

const ROOM_TEMP_DEADBAND=1;     // sluit aan op de bestaande small-uncertaintyklasse
const ROOM_PHASE_MAX_HOURS=48;  // dezelfde grens als de zichtbare bulk-/bolrijsvelden

function solveRoomEquivalentTotal(c,startTemp){
  const target=simulateFermentation(c);
  const origTotal=c.bulk+c.ball;
  const fallbackSim=simulateWithSchedule(c,startTemp,c.fridge,c.bulk,0,c.ball);
  if(!Number.isFinite(target.gas)||target.gas<=0||!Number.isFinite(origTotal)||origTotal<=0){
    return {converged:false,reason:'no-target',total:Math.max(0,origTotal||0),bulk:Math.max(0,c.bulk||0),ball:Math.max(0,c.ball||0),sim:fallbackSim,gasRatio:null};
  }

  const ratio=clamp(c.bulk/origTotal,0,1);
  const candidate=(total)=>{
    const bulk=Math.max(0,total*ratio);
    const ball=Math.max(0,total-bulk);
    const sim=simulateWithSchedule(c,startTemp,c.fridge,bulk,0,ball);
    return {total,bulk,ball,sim,gasRatio:sim.gas/target.gas};
  };

  // Breid de bracket gecontroleerd uit zolang beide room-fasen binnen hun
  // bestaande 48-uurs productgrens blijven. Een eindpunt is nooit automatisch
  // een oplossing: convergentie wordt expliciet teruggegeven.
  const maxByBulk=ratio>0?ROOM_PHASE_MAX_HOURS/ratio:Infinity;
  const maxByBall=ratio<1?ROOM_PHASE_MAX_HOURS/(1-ratio):Infinity;
  const maxTotal=Math.max(origTotal,Math.min(maxByBulk,maxByBall));
  let low=0,high=Math.min(maxTotal,Math.max(origTotal*2.5,origTotal+6));
  let lo=candidate(low),hi=candidate(high);
  while(hi.gasRatio<1 && high<maxTotal-1e-8){
    high=Math.min(maxTotal,Math.max(high*1.6,high+4));
    hi=candidate(high);
  }
  if(lo.gasRatio>1)return {...lo,converged:false,reason:'below-lower-bound'};
  if(hi.gasRatio<1)return {...hi,converged:false,reason:'above-upper-bound'};

  for(let i=0;i<20;i++){
    const mid=(low+high)/2;
    const m=candidate(mid);
    if(m.gasRatio<1)low=mid;else high=mid;
  }
  const solved=candidate((low+high)/2);
  return {...solved,converged:Number.isFinite(solved.gasRatio)&&Math.abs(solved.gasRatio-1)<=.01,reason:'solved'};
}

function liveFermentationPlan(c){
  const md=liveMeasurementValue('doughTemp');
  const mf=c.ferm==='room'?null:liveMeasurementValue('fridgeTemp');
  const deadlineKey=[String($('bakeDay')?.value||''),String($('bakeTime')?.value||'')].join('@');
  const key=[c.ferm,c.bulk,c.cold,c.ball,c.room,c.fridge,c.doughTemp,c.total,c.actualBall,md,mf,currentLang,deadlineKey].join('|');
  if(_livePlanCache.key===key)return _livePlanCache.value;

  const none=md==null&&mf==null;
  if(none){
    const result={active:false,effective:{...c},orig:{bulk:c.bulk,cold:c.cold,ball:c.ball},measuredDough:null,measuredFridge:null,gasRatio:1,maturityRatio:1,gasError:0,changed:false,stage:'plan'};
    _livePlanCache={key,value:result};return result;
  }

  const startTemp=md==null?c.doughTemp:md;
  if(c.ferm==='room'){
    const target=simulateFermentation(c);
    const originalSim=simulateWithSchedule(c,startTemp,c.fridge,c.bulk,0,c.ball);
    const roomDeadband=md!=null&&Math.abs(md-c.doughTemp)<=ROOM_TEMP_DEADBAND;
    const roomAlternative=roomDeadband?null:solveRoomEquivalentTotal(c,startTemp);
    const hasDeadline=hasValidBakeDeadline();
    const useAlternative=!hasDeadline&&roomAlternative?.converged;
    const b=useAlternative
      ? {bulk:roomAlternative.bulk,cold:0,ball:roomAlternative.ball,sim:roomAlternative.sim}
      : {bulk:c.bulk,cold:0,ball:c.ball,sim:originalSim};
    const gasRatio=b.sim.gas/Math.max(.001,target.gas);
    const maturityRatio=b.sim.maturity/Math.max(.001,target.maturity);
    const effective={...c,bulk:Math.max(0,b.bulk),cold:0,ball:Math.max(0,b.ball),doughTemp:startTemp};
    const changed=Math.abs(effective.bulk-c.bulk)>.08||Math.abs(effective.ball-c.ball)>.08;
    const result={active:true,effective,orig:{bulk:c.bulk,cold:0,ball:c.ball},measuredDough:md,measuredFridge:null,gasRatio,maturityRatio,gasError:Math.abs(gasRatio-1),changed,stage:'postKnead',roomAlternative,roomDeadband};
    _livePlanCache={key,value:result};return result;
  }

  // Alleen een koelkastmeting betekent dat de bulk al vaststaat; in dat geval
  // is de eerste optimalisatiepass niet nodig. Met beide metingen gebruiken we
  // die pass wel om de post-knead bulkcorrectie te bevriezen.
  let first=(mf==null||md!=null)?_optimizeLiveSchedule(c,startTemp,c.fridge,null):null;
  let freezeBulk=null;
  // Een werkelijk gemeten koelkasttemperatuur wordt logisch pas gebruikt op het
  // moment dat de koude fase begint. De bulk is dan al uitgevoerd en blijft staan.
  if(mf!=null)freezeBulk=(md==null||!first?.best)?c.bulk:first.best.bulk;
  const solved=mf!=null?_optimizeLiveSchedule(c,startTemp,mf,freezeBulk):first;
  let b=solved.best||{bulk:c.bulk,cold:c.cold,ball:c.ball,sim:simulateWithSchedule(c,startTemp,mf??c.fridge,c.bulk,c.cold,c.ball)};
  const target=solved.target;
  let gasRatio=b.sim.gas/Math.max(.001,target.gas);
  let maturityRatio=b.sim.maturity/Math.max(.001,target.maturity);

  const effective={...c,bulk:Math.max(0,b.bulk),cold:Math.max(0,b.cold),ball:Math.max(0,b.ball),doughTemp:startTemp,fridge:mf??c.fridge};
  const changed=Math.abs(effective.bulk-c.bulk)>.08||Math.abs(effective.cold-c.cold)>.08||Math.abs(effective.ball-c.ball)>.08||Math.abs((mf??c.fridge)-c.fridge)>.1;
  const result={active:true,effective,orig:{bulk:c.bulk,cold:c.cold,ball:c.ball},measuredDough:md,measuredFridge:mf,gasRatio,maturityRatio,gasError:Math.abs(gasRatio-1),changed,stage:mf!=null?'fridge':'postKnead',roomAlternative:null,roomDeadband:false};
  _livePlanCache={key,value:result};return result;
}
function livePlanClass(live,c){
  const d=live.measuredDough==null?0:Math.abs(live.measuredDough-c.doughTemp);
  const f=live.measuredFridge==null?0:Math.abs(live.measuredFridge-c.fridge);
  if(d>4||f>3||live.gasError>.08)return 'hot';
  if(d>1.5||f>1||live.changed)return 'warn';
  return '';
}
function livePlanChangesHtml(c,live){
  const e=live.effective,o=live.orig;
  const chip=(label,n,old)=>`<span class="live-plan-chip${Math.abs(n-old)>.08?' changed':''}">${label}: ${smartHours(n)}${Math.abs(n-old)>.08?` • ${L('was','was')} ${smartHours(old)}`:''}</span>`;
  let out=chip(L('bulk','bulk'),e.bulk,o.bulk);
  if(c.ferm!=='room')out+=chip(L('koelkast','fridge'),e.cold,o.cold);
  out+=chip(L('eindrijs','final proof'),e.ball,o.ball);
  return `<div class="live-plan-changes">${out}</div>`;
}
function livePlanSummaryHtml(c,live,context='dough'){
  if(!live.active)return '';
  const cls=livePlanClass(live,c);
  const d=live.measuredDough;
  const f=live.measuredFridge;
  let intro='';
  if(context==='dough'&&d!=null){
    const diff=d-c.doughTemp;
    intro=Math.abs(diff)<=1
      ? L(`Gemeten <b>${fmt(d,1)} °C</b>: dit ligt dicht bij het doel van ${fmt(c.doughTemp,1)} °C; er is weinig reden om het schema te verschuiven.`,
          `Measured <b>${fmt(d,1)} °C</b>: this is close to the ${fmt(c.doughTemp,1)} °C target; there is little reason to shift the schedule.`)
      : L(`Gemeten <b>${fmt(d,1)} °C</b> versus doel <b>${fmt(c.doughTemp,1)} °C</b>. De gist zit al in het deeg en blijft dus onveranderd; alleen de resterende tijden worden herschikt.`,
          `Measured <b>${fmt(d,1)} °C</b> versus a <b>${fmt(c.doughTemp,1)} °C</b> target. The yeast is already in the dough and therefore stays unchanged; only the remaining times are rearranged.`);
  }else if(context==='fridge'&&f!=null){
    intro=L(`Werkelijk gemiddeld <b>${fmt(f,1)} °C</b> versus gepland <b>${fmt(c.fridge,1)} °C</b>. De bulk ligt nu achter je; alleen de nog resterende koude fase en eindrijs worden aangepast.`,
            `Actual average <b>${fmt(f,1)} °C</b> versus planned <b>${fmt(c.fridge,1)} °C</b>. The bulk phase is now in the past; only the remaining cold phase and final proof are adjusted.`);
  }else intro=L('Live fermentatiecorrectie actief.','Live fermentation correction is active.');
  const mat=Math.abs(live.maturityRatio-1)>.10
    ? L(` <b>Let op:</b> de geschatte rijpingsindex wijkt ondanks de tijdcorrectie ongeveer ${fmt(Math.abs(live.maturityRatio-1)*100,0)}% af; kijk extra naar deegsterkte en volume.`,
        ` <b>Note:</b> the estimated maturation index still differs by about ${fmt(Math.abs(live.maturityRatio-1)*100,0)}%; pay extra attention to dough strength and volume.`)
    : '';
  let residual='';
  if(c.ferm==='room'&&live.roomDeadband){
    residual=L(
      ` De afwijking valt binnen de praktische meetmarge van ${fmt(ROOM_TEMP_DEADBAND,0)} °C. Het oorspronkelijke bulk- en bolrijsschema blijft daarom bewust ongewijzigd.`,
      ` The difference is within the practical ${fmt(ROOM_TEMP_DEADBAND,0)} °C measurement margin. The original bulk and final-proof schedule therefore deliberately remains unchanged.`);
  }else if(c.ferm==='room'&&live.roomAlternative&&!live.roomAlternative.converged){
    residual=L(
      ` <b>Geen betrouwbare tijdoplossing:</b> het oorspronkelijke gasdoel kan binnen de toegestane room-fasetijden niet worden bereikt. Verander de omgevingstemperatuur en gebruik tijd alleen als brede richtlijn; deegvolume, spanning en uiterlijk blijven leidend.`,
      ` <b>No reliable timing solution:</b> the original gas target cannot be reached within the allowed room-phase durations. Change the ambient temperature and use time only as a broad guide; dough volume, tension and appearance remain decisive.`);
  }else if(c.ferm==='room'&&live.roomAlternative){
    const alt=live.roomAlternative,origTotal=live.orig.bulk+live.orig.ball;
    const delta=alt.total-origTotal;
    const hasDeadline=hasValidBakeDeadline();
    if(hasDeadline){
      residual=L(
        ` Binnen volledig kamertemperatuurschema kun je de afwijking niet zinvol alleen tussen bulk en eindrijs verschuiven. Hetzelfde gasdoel ligt met deze gemeten starttemperatuur rond <b>${smartHours(alt.total)}</b> totaal (${delta<0?`ongeveer ${smartHours(Math.abs(delta))} eerder`:`ongeveer ${smartHours(delta)} later`}). Omdat je een baktijd hebt gekozen verandert de calculator die deadline niet stilzwijgend; fermenteer koeler of beoordeel het deeg eerder.`,
        ` In an all-room-temperature schedule, the deviation cannot be usefully corrected just by shifting time between bulk and final proof. With this measured starting temperature, the same gas target is around <b>${smartHours(alt.total)}</b> total (${delta<0?`about ${smartHours(Math.abs(delta))} earlier`:`about ${smartHours(delta)} later`}). Because you set a bake time, the calculator does not silently move that deadline; ferment cooler or inspect the dough earlier.`);
    }else{
      residual=L(
        ` Bij volledig kamertemperatuurfermenteren is totale tijd de sterke knop. Het schema is daarom naar ongeveer <b>${smartHours(alt.total)}</b> totale fermentatie verschoven; de oorspronkelijke bulk/eindrijs-verhouding blijft zoveel mogelijk behouden.`,
        ` With all-room-temperature fermentation, total time is the strong control. The schedule is therefore shifted to roughly <b>${smartHours(alt.total)}</b> total fermentation while preserving the original bulk/final-proof ratio as much as possible.`);
    }
  }else if(live.gasError>.06){
    residual=L(' De oorspronkelijke gasontwikkelingsdoelstelling kan binnen dezelfde totale fermentatietijd niet netjes worden gematcht; gebruik de tijden als brede richtlijn en beoordeel het deeg eerder.',' The original gas-development target cannot be matched cleanly within the same total fermentation time; use the timings as a broad guide and inspect the dough earlier.');
  }else{
    residual=L(' De totale fermentatieduur blijft zoveel mogelijk gelijk; tijd wordt vooral tussen warme en koude fasen verschoven.',' Total fermentation duration is kept the same as much as possible; time is mainly shifted between warm and cold phases.');
  }
  return `<div class="live-plan-summary ${cls}">${intro}${residual}${mat}${livePlanChangesHtml(c,live)}</div>`;
}
function doughMeasurementControl(c,live){
  return `<div class="live-measure"><div class="live-measure-grid"><label>${L('Werkelijk gemeten direct na kneden (°C)','Actually measured directly after kneading (°C)')}<input class="field" type="number" min="10" max="40" step="0.5" value="${liveMeasureDisplay('doughTemp')}" placeholder="${fmt(c.doughTemp,1)}" onchange="setLiveMeasurement('doughTemp',this.value)"></label><div class="hint" style="margin:0">${L(`Doel: ${fmt(c.doughTemp,1)} °C • leeg = oorspronkelijk plan.`,`Target: ${fmt(c.doughTemp,1)} °C • blank = original plan.`)}</div></div>${live.measuredDough!=null?livePlanSummaryHtml(c,live,'dough'):''}</div>`;
}
function fridgeMeasurementControl(c,live){
  if(c.ferm==='room')return '';
  return `<div class="live-measure"><div class="live-measure-grid"><label>${L('Werkelijk gemiddelde koelkasttemp. bij het deeg (°C)','Actual average refrigerator temp. where the dough sits (°C)')}<input class="field" type="number" min="0" max="15" step="0.5" value="${liveMeasureDisplay('fridgeTemp')}" placeholder="${fmt(c.fridge,1)}" onchange="setLiveMeasurement('fridgeTemp',this.value)"></label><div class="hint" style="margin:0">${L(`Gepland: ${fmt(c.fridge,1)} °C • weet je het niet, laat leeg.`,`Planned: ${fmt(c.fridge,1)} °C • leave blank if unknown.`)}</div></div>${live.measuredFridge!=null?livePlanSummaryHtml(c,live,'fridge'):''}</div>`;
}
function phaseAdjustmentDetail(c,live,key){
  if(!live.active)return '';
  const now=live.effective[key],old=live.orig[key];
  if(Math.abs(now-old)<.08)return '';
  const labels={bulk:L('Aangepaste bulk','Adjusted bulk'),cold:L('Aangepaste koude fase','Adjusted cold phase'),ball:L('Aangepaste eindrijs','Adjusted final proof')};
  return `${labels[key]}: ${phasePlanLabel(now,old,c,live,key)}. ${L('De bandbreedte wordt ruimer naarmate de gemeten temperaturen verder van het plan liggen; het uiterlijk en de spanning van het deeg blijven leidend.','The range widens as measured temperatures move further from plan; dough appearance and tension remain the final guide.')}`;
}

function stepStorageKey(title){
  return encodeURIComponent(
    String(title)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')
      .replace(/[^a-z0-9]+/g,'-')
      .replace(/^-+|-+$/g,'')
  );
}

// Vinkjes hingen aan de titel van een stap. "Beleggen • bol 1" bleef daardoor
// aangevinkt als je bol 1 een ander recept gaf. Stappen hebben nu een stabiel
// semantisch id waarin het recept of saustype verwerkt zit.
let _stepKeys=[];
function step(n,title,text,detail='',id=null){
  const key=id?('s-'+id):stepStorageKey(title);
  _stepKeys.push(key);
  const checked=!!completedSteps[key];
  return `<div class="step-card${checked?' completed':''}" data-step-key="${key}">
    <label class="step-check" title="${currentLang==='en'?'Mark step complete':'Stap afvinken'}">
      <input type="checkbox" data-step-key="${key}" ${checked?'checked':''} onchange="toggleStepComplete(this)">
      <span class="step-check-mark"></span>
    </label>
    <div class="num">${n}</div>
    <div class="step-content"><h3>${title}</h3><p>${text}</p>${detail?`<div class="detail">${detail}</div>`:''}</div>
  </div>`;
}

function toggleStepComplete(input){
  const key=input?.dataset?.stepKey;
  if(!key)return;
  if(input.checked)completedSteps[key]=true;
  else delete completedSteps[key];
  input.closest('.step-card')?.classList.toggle('completed',input.checked);
  updateStepProgress();
  saveState();
}

function updateStepProgress(){
  const cards=[...document.querySelectorAll('#stepsList .step-card')];
  const total=cards.length;
  const done=cards.filter(card=>card.querySelector('.step-check input:checked')).length;
  const text=$('stepsProgressText'),bar=$('stepsProgressBar');
  if(text)text.textContent=currentLang==='en'
    ? `${done} of ${total} steps completed`
    : `${done} van ${total} stappen afgerond`;
  if(bar)bar.style.width=total?`${done/total*100}%`:'0%';
}

function clearStepProgress(){
  completedSteps={};
  document.querySelectorAll('#stepsList .step-check input').forEach(input=>input.checked=false);
  document.querySelectorAll('#stepsList .step-card').forEach(card=>card.classList.remove('completed'));
  updateStepProgress();
  saveState();
}

function pruneCompletedStepState(){
  if(_deferDependentStatePrune)return false;
  const liveKeys=new Set(_stepKeys);
  let prunedAny=false;
  Object.keys(completedSteps).forEach(key=>{
    if(!liveKeys.has(key)){
      delete completedSteps[key];
      prunedAny=true;
    }
  });
  if(prunedAny)saveState();
  return prunedAny;
}

function fermentationSteps(c,startIndex,live){
  let i=startIndex,arr=[];
  const p=live.effective;
  const skipBulk=p.bulk<0.10;
  const skipBulkReason=(live.active&&live.orig.bulk>=0.10&&live.effective.bulk<0.10)
    ? L('De warme bulk is door de live temperatuurcorrectie praktisch vervallen. ','The warm bulk has effectively disappeared because of the live temperature correction. ')
    : L('In dit schema is geen aparte warme bulk gepland. ','No separate warm bulk is planned in this schedule. ');
  const bulkTxt=L(`Laat de hele deegmassa ongeveer <b>${smartHours(p.bulk)}</b> bij ongeveer ${fmt(c.room,1)} °C afgedekt staan.`,
                  `Leave the whole dough mass covered for about <b>${smartHours(p.bulk)}</b> at roughly ${fmt(c.room,1)} °C.`);
  const coldBulkTxt=L(`Zet de deegmassa ongeveer <b>${smartHours(p.cold)}</b> bij gemiddeld ${fmt(p.fridge,1)} °C in de koelkast.`,
                      `Put the dough mass in the refrigerator for about <b>${smartHours(p.cold)}</b> at an average of ${fmt(p.fridge,1)} °C.`);
  const shapeTxt=L(`Verdeel in <b>${c.pizzas} bollen van ongeveer ${fmt(c.actualBall,1)} g</b> en bol strak maar voorzichtig op.`,
                   `Divide into <b>${c.pizzas} balls of about ${fmt(c.actualBall,1)} g</b> and shape them tightly but gently.`);
  const shapeShort=L(`Verdeel in <b>${c.pizzas} bollen van ongeveer ${fmt(c.actualBall,1)} g</b>.`,
                     `Divide into <b>${c.pizzas} balls of about ${fmt(c.actualBall,1)} g</b>.`);
  const fridgeControl=fridgeMeasurementControl(c,live);

  if(c.ferm==='hybrid'){
    if(!skipBulk)arr.push(step(i++,L('Bulkrijs op kamertemperatuur','Bulk proof at room temperature'),bulkTxt,phaseAdjustmentDetail(c,live,'bulk'),'bulk'));
    arr.push(step(i++,skipBulk?L('Direct koud zetten','Refrigerate immediately'):L('Koude fermentatie als één massa','Cold fermentation as one mass'),
      skipBulk
        ? L(`Sla de warme bulk over en zet de deegmassa direct ongeveer <b>${smartHours(p.cold)}</b> bij gemiddeld ${fmt(p.fridge,1)} °C in de koelkast.`,
            `Skip the warm bulk and refrigerate the dough mass immediately for about <b>${smartHours(p.cold)}</b> at an average of ${fmt(p.fridge,1)} °C.`)
        : coldBulkTxt,
      `${skipBulk?skipBulkReason:''}${phaseAdjustmentDetail(c,live,'cold')}${fridgeControl}`,'cold'));
    arr.push(step(i++,L('Verdelen en opbollen','Divide and shape'),shapeTxt,'','shape'));
    arr.push(step(i++,L('Bolrijs','Ball proof'),L(`Laat de bollen ongeveer <b>${smartHours(p.ball)}</b> bij ongeveer ${fmt(c.room,1)} °C verder rijzen.`,`Let the balls continue proofing for about <b>${smartHours(p.ball)}</b> at roughly ${fmt(c.room,1)} °C.`),phaseAdjustmentDetail(c,live,'ball'),'ballproof'));
  }else if(c.ferm==='room'){
    if(!skipBulk)arr.push(step(i++,L('Bulkrijs op kamertemperatuur','Bulk proof at room temperature'),bulkTxt,phaseAdjustmentDetail(c,live,'bulk'),'bulk'));
    arr.push(step(i++,skipBulk?L('Direct verdelen en opbollen','Divide and shape immediately'):L('Verdelen en opbollen','Divide and shape'),
      skipBulk
        ? L(`Sla de warme bulk over en verdeel het deeg direct in <b>${c.pizzas} bollen van ongeveer ${fmt(c.actualBall,1)} g</b>.`,
            `Skip the warm bulk and immediately divide the dough into <b>${c.pizzas} balls of about ${fmt(c.actualBall,1)} g</b>.`)
        : shapeShort,
      skipBulk?skipBulkReason.trim():'','shape'));
    arr.push(step(i++,L('Bolrijs op kamertemperatuur','Ball proof at room temperature'),L(`Laat de bollen nog ongeveer <b>${smartHours(p.ball)}</b> bij ongeveer ${fmt(c.room,1)} °C rijzen.`,`Let the balls proof for roughly another <b>${smartHours(p.ball)}</b> at about ${fmt(c.room,1)} °C.`),phaseAdjustmentDetail(c,live,'ball'),'ballproof'));
  }else{
    if(!skipBulk)arr.push(step(i++,L('Korte bulkrijs','Short bulk proof'),bulkTxt,phaseAdjustmentDetail(c,live,'bulk'),'bulk'));
    arr.push(step(i++,skipBulk?L('Direct verdelen en opbollen','Divide and shape immediately'):L('Verdelen en opbollen','Divide and shape'),
      skipBulk
        ? L(`Sla de warme bulk over en verdeel direct in <b>${c.pizzas} bollen van ongeveer ${fmt(c.actualBall,1)} g</b>.`,
            `Skip the warm bulk and immediately divide into <b>${c.pizzas} balls of about ${fmt(c.actualBall,1)} g</b>.`)
        : shapeShort,
      skipBulk?skipBulkReason.trim():'','shape'));
    arr.push(step(i++,L('Koude fermentatie als bollen','Cold fermentation as balls'),L(`Zet de afgedekte bollen ongeveer <b>${smartHours(p.cold)}</b> bij gemiddeld ${fmt(p.fridge,1)} °C in de koelkast.`,`Put the covered balls in the refrigerator for about <b>${smartHours(p.cold)}</b> at an average of ${fmt(p.fridge,1)} °C.`),`${phaseAdjustmentDetail(c,live,'cold')}${fridgeControl}`,'cold'));
    arr.push(step(i++,L('Laatste opwarming / eindrijs','Final warm-up / final proof'),L(`Haal de bollen ongeveer <b>${smartHours(p.ball)}</b> voor het bakken uit de koelkast.`,`Take the balls out of the refrigerator about <b>${smartHours(p.ball)}</b> before baking.`),phaseAdjustmentDetail(c,live,'ball'),'ballproof'));
  }
  return {html:arr,next:i};
}

function buildSteps(c){
  ensurePizzaCustomizations();
  const m=methodInstructions(c),aggSauce=aggregateSauceNeeds(c),bake=stoneProfile(c.stoneTemp),live=liveFermentationPlan(c);
  const oilText=c.o>0?L(` Voeg <b>${fmt(c.oil,0)} g olijfolie</b> pas tegen het einde van het kneden toe.`,` Add <b>${fmt(c.oil,0)} g olive oil</b> only towards the end of the kneading.`):'';
  let i=1,steps=[];
  _stepKeys=[];
  const wt=waterTempAdvice(c);
  const waterTempExtra=wt.cold
    ? L(' Dit advies gebruikt relatief koud water. Een korte koude autolyse kan de einddeegtemperatuur nog verder drukken; meet daarom na het kneden en stuur daarna op tijd, niet op extra gist.',
        ' This guidance uses relatively cold water. A short refrigerated autolyse can lower final dough temperature further; measure after kneading and then adjust time, not yeast.')
    : (wt.hot
        ? L(' Dit advies gebruikt relatief warm water. Meet de einddeegtemperatuur extra zorgvuldig en gebruik nooit heet water om een afwijking blind te compenseren.',
            ' This guidance uses relatively warm water. Measure final dough temperature carefully and never use hot water to blindly compensate for a deviation.')
        : '');
  const waterLine=L(
      `Streef naar <b>${fmt(c.doughTemp,1)} °C</b> einddeegtemperatuur. De DDT-berekening gebruikt voor ${methodLabel()} een vaste praktische startcorrectie van <b>${fmt(wt.correction,1)} °C</b> en komt uit op ongeveer <b>${fmt(wt.water,0)} °C water</b>`,
      `Aim for a final dough temperature of <b>${fmt(c.doughTemp,1)} °C</b>. The DDT calculation uses a fixed practical starting correction of <b>${fmt(wt.correction,1)} °C</b> for ${methodLabel()} and estimates roughly <b>${fmt(wt.water,0)} °C water</b>`)
    +(wt.clamped?L(' (praktisch begrensd)',' (practically capped)'):'')+'.'
    +L(` Logboekmetingen worden bewaard als referentie maar veranderen dit advies in v${APP_VERSION} bewust niet automatisch.`,
       ` Log measurements are kept as reference but deliberately do not automatically change this guidance in v${APP_VERSION}.`)
    +waterTempExtra
    +(wt.water>=40?L(' Gebruik geen water ≥40 °C voor gistdeeg; koel het eerst terug.',' Do not use water ≥40 °C for yeasted dough; cool it first.'):'')
    +(($('preset').value==='avpnMid'&&!wt.avpnRange)?L(` Voor de AVPN-preset blijft de officiële 16–22 °C waterrange de primaire referentie.`,
      ` For the AVPN preset, the official 16–22 °C water range remains the primary reference.`):'');
  steps.push(step(i++,L('Weeg de ingrediënten','Weigh the ingredients'),
    L(`Bloem <b>${fmt(c.flour,0)} g</b> • water <b>${fmt(c.water,0)} g</b> • zout <b>${fmt(c.salt,0)} g</b> • ${yeastName(c.yeastType).toLowerCase()} <b>${fmt(c.yeast,2)} g</b>${c.o>0?` • olie <b>${fmt(c.oil,0)} g</b>`:''}.`,
      `Flour <b>${fmt(c.flour,0)} g</b> • water <b>${fmt(c.water,0)} g</b> • salt <b>${fmt(c.salt,0)} g</b> • ${yeastName(c.yeastType).toLowerCase()} <b>${fmt(c.yeast,2)} g</b>${c.o>0?` • oil <b>${fmt(c.oil,0)} g</b>`:''}.`),
    L(`Houd ongeveer <b>${fmt(c.reserve,0)} g water</b> apart voor na de rust. ${waterLine}`,
      `Hold back about <b>${fmt(c.reserve,0)} g water</b> for after the rest. ${waterLine}`),'weigh'));
  steps.push(step(i++,L('Eerste menging','First mix'),m.mix,'','mix'));
  steps.push(step(
    i++,
    c.autolyse?L('Autolyse (bloem + water) • 20 min','Autolyse (flour + water) • 20 min'):L('Hydratatierust • 20 min','Hydration rest • 20 min'),
    c.autolyse
      ? L(`Dek de kom af en laat <b>20 minuten</b> rusten.${m.autolyseCooling?` ${m.autolyseCooling}`:''}`,
          `Cover the bowl and rest for <b>20 minutes</b>.${m.autolyseCooling?` ${m.autolyseCooling}`:''}`)
      : L('Dek de kom af en laat <b>20 minuten</b> staan.','Cover the bowl and leave it for <b>20 minutes</b>.'),
    c.autolyse
      ? L('Alleen bloem + water tijdens deze rust. Een koude autolyse van 20 minuten is geen probleem; hydratatie en glutenontwikkeling gaan gewoon door, alleen iets rustiger.',
          'Flour + water only during this rest. A cold 20-minute autolyse is fine; hydration and gluten development continue, just a little slower.')
      : L('De gist zit al in het deeg; dit is dus geen klassieke autolyse.','The yeast is already in the dough, so this is not a classic autolyse.'),
    'rest'
  ));
  steps.push(step(i++,L('Toevoegen & kneden','Add & knead'),m.add+' '+m.knead+oilText,m.note,'knead'));
  steps.push(step(i++,L('Controleer deegontwikkeling','Check dough development'),
    L('Stop wanneer het deeg gladder, soepel en elastisch is en redelijk dun kan uitrekken voordat het scheurt.','Stop when the dough is smoother, supple and elastic, and can stretch reasonably thin before tearing.'),
    L('Een perfecte windowpane is niet nodig.','A perfect windowpane is not required.'),'devcheck'));
  const sci=yeastRecommendation(c);
  steps.push(step(i++,L('Meet de werkelijke deegtemperatuur','Measure the actual dough temperature'),
    L(`Doel vóór het kneden: <b>${fmt(c.doughTemp,1)} °C</b>${c.doughTempDefault?' (standaarddoel)':''}. Meet nu direct na het kneden in het midden van de deegmassa.`,
      `Target before kneading: <b>${fmt(c.doughTemp,1)} °C</b>${c.doughTempDefault?' (default target)':''}. Now measure directly after kneading in the centre of the dough mass.`),
    `${L('De gist zit nu al in het deeg. Een afwijkende meting verandert daarom <b>niet</b> achteraf de gistdosering; de calculator past alleen de nog toekomstige fermentatietijden aan.','The yeast is already in the dough. A different measurement therefore does <b>not</b> retroactively change the yeast dose; the calculator only adjusts the future fermentation timings.')}${doughMeasurementControl(c,live)}`,'doughtemp'));
  const fs=fermentationSteps(c,i,live);steps.push(...fs.html);i=fs.next;
  steps.push(step(i++,L('Kijk naar het deeg, niet alleen naar de klok','Watch the dough, not just the clock'),
    L(`Richtwaarde bulk: <b>${sci.rise.bulk}</b>. Voor het bakken: <b>${sci.rise.final}</b>.`,
      `Target for bulk: <b>${sci.rise.bulk}</b>. Before baking: <b>${sci.rise.final}</b>.`),
    L(`Bij duidelijk sneller of trager rijzen mag je de tijd aanpassen; temperatuur, bloem en gistpartij verschillen in de praktijk.`,
      `If it rises clearly faster or slower, adjust the timing; temperature, flour and yeast batch all vary in practice.`),'visual'));

  if(aggSauce.enabled){
    if(usesCombinedTomatoPurchase(aggSauce)){
      const p=aggSauce.tomatoPurchase;
      steps.push(step(i++,L('Koop tomaten voor de sauzen','Buy tomatoes for the sauces'),
        L(`Voor de afzonderlijke sausrecepten is samen <b>${fmt(p.batch,0)} g</b> tomaat nodig. Koop <b>${p.tins}× 400 g</b>; de sausrecepten en maakbatches blijven apart.`,
          `The separate sauce recipes need <b>${fmt(p.batch,0)} g</b> of tomatoes in total. Buy <b>${p.tins}× 400 g</b>; the recipes and batches remain separate.`),
        '', 'sauce-tomato-purchase'));
    }
    aggSauce.groups.forEach(g=>{
      const buyPart=g.s.tomato && !usesCombinedTomatoPurchase(aggSauce)?` ${L('en koop','and buy')} <b>${g.tins}× 400 g</b>`:'';
      steps.push(step(i++,`${L('Maak','Make')} ${sauceName(g.type)}`,`${sauceDesc(g.type)} ${L("Nodig voor pizza's",'Needed for pizzas')} <b>${g.pizzas.join(', ')}</b>: ${L('ongeveer','roughly')} <b>${fmt(g.need,0)} g</b>${g.s.tomato?` • ${L('maak','make')} <b>${fmt(g.batch,0)} g</b>${buyPart}`:''}.`,g.ingredients.map(x=>`${tItem(x[0])}: ${x[1]}`).join(' • '),`sauce-${g.type}`));
    });
  }

  steps.push(step(i++,L('Breng de steen op temperatuur','Bring the stone up to temperature'),
    L(`Mik op een <b>steentemperatuur van ${fmt(c.stoneTemp,0)} °C</b>.`,`Aim for a <b>stone temperature of ${fmt(c.stoneTemp,0)} °C</b>.`),bake.note,'stone'));
  const openNotes=[];
  if(c.targetDiameter>PEEL_DIAMETER+0.01)openNotes.push(L(
    `Op je 12"-schep (${fmt(PEEL_DIAMETER,1)} cm) is ${fmt(c.targetDiameter,1)} cm krap; bestuif goed en lanceer in één vloeiende beweging.`,
    `On your 12" peel (${fmt(PEEL_DIAMETER,1)} cm), ${fmt(c.targetDiameter,1)} cm is tight; dust well and launch in one smooth motion.`));
  if(c.targetDiameter>OVEN_DIAMETER+0.01)openNotes.push(L(
    `${fmt(c.targetDiameter,1)} cm is groter dan het huidige 14"-Koda-2-profiel (${fmt(OVEN_DIAMETER,1)} cm). Dit is een bewuste override, geen blokkade: controleer fysiek je oven/opstelling.`,
    `${fmt(c.targetDiameter,1)} cm is larger than the current 14" Koda 2 profile (${fmt(OVEN_DIAMETER,1)} cm). This is a deliberate override, not a block: physically verify your oven/setup.`));
  const peelNote=openNotes.length?' '+openNotes.join(' '):'';
  steps.push(step(i++,L('Open de deegbol','Open the dough ball'),
    L(`Bestuif licht met bloem of semola. Druk vanuit het midden naar buiten en laat de buitenste <b>${fmt(1.5*Math.sqrt(toppingScale),1)}–${fmt(2*Math.sqrt(toppingScale),1)} cm</b> zoveel mogelijk met rust. ${c.byWeight ? `Met dit bolgewicht en deze deegstijl kom je als richtwaarde op ongeveer <b>${fmt(c.targetDiameter,1)} cm</b>.` : `Rek uit tot ongeveer <b>${fmt(c.targetDiameter,1)} cm</b>.`}`,
      `Dust lightly with flour or semola. Press outwards from the centre and leave the outer <b>${fmt(1.5*Math.sqrt(toppingScale),1)}–${fmt(2*Math.sqrt(toppingScale),1)} cm</b> alone as much as possible. ${c.byWeight ? `With this ball weight and dough style you should land at roughly <b>${fmt(c.targetDiameter,1)} cm</b>.` : `Stretch to roughly <b>${fmt(c.targetDiameter,1)} cm</b>.`}`)+peelNote,'','open'));

  if(appMode==='sauce' && aggSauce.enabled && aggSauce.groups.length){
    const g=aggSauce.groups[0];
    steps.push(step(i++,L('Saus aanbrengen','Apply the sauce'),`${L('Verdeel ongeveer','Spread roughly')} <b>${fmt(g.per??manualSaucePerPizza(),0)} g ${sauceName(g.type)}</b> ${L('per pizza. Laat de buitenste rand vrij.','per pizza. Leave the outer rim clear.')}`,L('Gebruik liever iets te weinig dan te veel; overtollige saus maakt de bodem sneller zacht.','Use slightly too little rather than too much; excess sauce softens the base.'),`sauceapply-${g.type}`));
  }

  if(appMode==='full') pizzaSelections.forEach((rid,idx)=>{
    const r=recipeById(rid);
    const custom=pizzaCustomizations[idx];
    const items=includedItemsForBall(idx);
    const before=items.filter(x=>!(r.after||[]).includes(itemKey(x)));
    const after=items.filter(x=>(r.after||[]).includes(itemKey(x)));
    const cheese=extraCheeseAdvice(idx,c);

    let parts=[];
    if(!custom.noSauce){
      const sauceText=$('autoSauceFromPizzas').checked
        ? `${sauceName(effectiveSauceTypeForBall(idx))} ${effectiveSauceGramsForBall(idx)} g`
        : `${sauceName($('sauceType').value)} ${fmt(manualSaucePerPizza(),0)} g`;
      parts.push(sauceText);
    }
    parts.push(...before.map(x=>`${tItem(x[0])} ${x[1]} ${tUnit(x[2],x[1])}`));
    if(custom.extraCheese && cheese.allowed) parts.push(`${cheese.name} +${fmt(cheese.amount,0)} g extra`);

    let topping=`<b>${L('Bol','Ball')} ${idx+1} • ${recipeNameText(r)} • ${pizzaStyleLabel(custom.pizzaStyle)}</b>: ${parts.length?parts.join(' • '):L('geen toppings vóór het bakken','no toppings before baking')}.`;
    if(after.length)topping+=` <b>${L('Na het bakken:','After baking:')}</b> ${after.map(x=>`${tItem(x[0])} ${x[1]} ${tUnit(x[2],x[1])}`).join(' • ')}.`;
    // Het recept-id zit in de sleutel, zodat een ander recept ook een vers vinkje krijgt.
    steps.push(step(i++,`${L('Beleggen • bol','Top • ball')} ${idx+1}`,topping,`${recipeNoteText(r)} • ${L('Temperatuuradvies','Temperature guidance')}: ${recipeTempFor(rid).low}–${recipeTempFor(rid).high} °C ${L('steen','stone')}.`,`top-${idx}-${rid}-${custom.pizzaStyle}`));
  });
  steps.push(step(i++,L('Bakken','Bake'),
    L(`Bak bij deze steentemperatuur als startpunt ongeveer <b>${bake.time}</b> en draai <b>${bake.turn}</b>.`,
      `At this stone temperature, bake for roughly <b>${bake.time}</b> as a starting point and turn <b>${bake.turn}</b>.`),
    L(`Steentemperatuur is de basis; vlam/bovenwarmte en hoeveelheid beleg blijven mede bepalend. Voor ${c.pizzas} ${c.pizzas===1?'pizza':"pizza's"} achter elkaar: reken op ongeveer <b>${bakeSessionRange(c).low}–${bakeSessionRange(c).high} minuten</b> totale baksessie.`,
      `Stone temperature is the basis; flame/top heat and the amount of topping matter too. For ${c.pizzas} ${c.pizzas===1?'pizza':'pizzas'} in a row, allow roughly <b>${bakeSessionRange(c).low}–${bakeSessionRange(c).high} minutes</b> for the full baking session.`),'bake'));
  $('stepsList').innerHTML=steps.join('');
  // Vinkjes van stappen die niet meer bestaan opruimen, zodat ze niet
  // eeuwig in localStorage blijven staan en later verkeerd terugkomen.
  pruneCompletedStepState();
  updateStepProgress();

  $('recipeBadges').innerHTML=[
    `<span class="badge">🌾 ${fmt(c.flour,0)} g ${L('bloem','flour')}</span>`,
    `<span class="badge">💧 ${fmt(c.water,0)} g ${L('water','water')}</span>`,
    `<span class="badge">🧂 ${fmt(c.salt,0)} g ${L('zout','salt')}</span>`,
    `<span class="badge">🫧 ${fmtFixed(c.yeast,2)} g ${yeastShort(c.yeastType)}</span>`,
    `<span class="badge">${c.autolyse?L('✅ autolyse','✅ autolyse'):L('↪️ hydratatierust','↪️ hydration rest')}</span>`,
    `<span class="badge">🍕 ${c.pizzas} × ${fmt(c.actualBall,0)} g</span>`
  ].join('');
}

