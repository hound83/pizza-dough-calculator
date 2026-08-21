function roundedPct(x,step){return roundTo(x,step);}

// exactOverride bewaart de onafgeronde presetwaarden. Vroeger werd het hele
// object gewist zodra je EEN percentageveld aanraakte, waardoor de gist
// terugviel op de afgeronde veldwaarde en ongemerkt kon verspringen.
// Nu vervalt alleen de aangeraakte waarde.
const EXACT_FIELDS={hydration:'h',saltPct:'s',yeastPct:'ySelected',oilPct:'o'};
function exactVal(key,id){
  const el=$(id);
  const raw=(exactOverride && exactOverride[key]!=null && Number.isFinite(exactOverride[key]))
    ? exactOverride[key] : boundedNum(id,0);
  return clampToInputBounds(el,raw);
}
function selectedYeastPct(){return exactVal('ySelected','yeastPct');}
function selectedHydration(){return exactVal('h','hydration');}
function selectedSalt(){return exactVal('s','saltPct');}
function selectedOil(){return exactVal('o','oilPct');}
function applyYeastTypeConversion(oldKey,newKey){
  const old=yeastTypes[oldKey]||yeastTypes.idy;
  const neu=yeastTypes[newKey]||yeastTypes.idy;
  const oldEffective=selectedYeastPct()/old.mult;
  exactOverride=exactOverride||{h:selectedHydration(),s:selectedSalt(),o:selectedOil(),ySelected:selectedYeastPct()};
  const converted=clampToInputBounds($('yeastPct'),oldEffective*neu.mult);
  // Eén afronding is de bron voor zowel veld als berekening; daardoor kan de
  // zichtbare waarde nooit submilligram afwijken van het gebruikte percentage.
  const rounded=Number(fieldNum(converted,3));
  exactOverride.ySelected=rounded;
  $('yeastPct').value=fieldNum(rounded,3);
  previousYeastType=newKey;
  return rounded;
}

function recommendedBallWeight(diameter=num('diameter')){
  const style=doughStyles[$('doughStyle').value]||doughStyles.neapolitan;
  const d=clamp(Number(diameter)||REF_DIAMETER,MIN_DIAMETER,MAX_DIAMETER);
  return Math.round(Math.PI*Math.pow(d/2,2)*style.factor/5)*5;
}

function estimatedDiameterFromWeight(weight=num('ballWeight')){
  const style=doughStyles[$('doughStyle').value]||doughStyles.neapolitan;
  if(!weight || !style.factor) return num('diameter');
  return 2*Math.sqrt(weight/(Math.PI*style.factor));
}


function refreshAvpnPresetInfo(){
  const box=$('avpnPresetInfo');
  if(!box)return;
  box.classList.toggle('hidden',$('preset').value!=='avpnMid');
  // Dit lange informatieblok wordt bewust volledig taalafhankelijk opgebouwd.
  // De generieke tekstnode-vertaler kan samengestelde HTML stil gedeeltelijk
  // vertalen en gaf hier daardoor Nederlands én Engelse getalnotatie door elkaar.
  box.innerHTML=L(
    `<b>AVPN middenprofiel:</b> ${fmt(28.5,1)} cm • 240 g per bol • ${fmt(58.8,1)}% hydratatie • ${fmt(2.94,2)}% zout • W285 • 18 uur totale fermentatie • 19 °C rijsomgeving • 405 °C steen.
      Verse gist: rekenkundig midden van de AVPN-range, <b>${fmt(1.55,2)} g per liter water</b>.
      <span class="avpn-caveat">Let op: die officiële range (${fmt(.1,1)}–3 g/L) spant een factor 30 en dekt bewust heel verschillende tijden, temperaturen en seizoenen. Het rekenkundige midden daarvan is een rekensom, geen aanbeveling — de balk hieronder toont daarom ook wat het praktische model voor dit specifieke schema voorstelt.</span>
      <span class="avpn-caveat">De 2 uur bulk + 16 uur bolrijs is een praktische verdeling binnen de 18 uur; AVPN schrijft die onderlinge verdeling niet exact voor. De combinatie 240 g + ${fmt(28.5,1)} cm zijn de afzonderlijke middelpunten van de toegestane gewicht- en diameterbereiken. Praktisch afronden wordt voor deze preset uitgeschakeld, zodat de middenwaarden niet door keukenafronding verschuiven.</span>`,
    `<b>AVPN midpoint profile:</b> ${fmt(28.5,1)} cm • 240 g per dough ball • ${fmt(58.8,1)}% hydration • ${fmt(2.94,2)}% salt • W285 • 18 hours total fermentation • 19 °C proofing environment • 405 °C stone.
      Fresh yeast: arithmetic midpoint of the AVPN range, <b>${fmt(1.55,2)} g per litre of water</b>.
      <span class="avpn-caveat">Note: the official range (${fmt(.1,1)}–3 g/L) spans a factor of 30 and deliberately covers very different times, temperatures and seasons. Its arithmetic midpoint is a calculation, not a recommendation — the bar below therefore also shows what the practical model suggests for this specific schedule.</span>
      <span class="avpn-caveat">The 2-hour bulk + 16-hour ball proof is a practical split within the 18 hours; AVPN does not prescribe that internal split exactly. The combination of 240 g + ${fmt(28.5,1)} cm uses the separate midpoints of the permitted weight and diameter ranges. Practical rounding is disabled for this preset so kitchen rounding does not shift the midpoint values.</span>`);
}

function refreshSizeModeUI(){
  const byWeight=!$('sizeFromDiameter').checked;
  const styleMaxBall=recommendedBallWeight(MAX_DIAMETER);
  $('ballWeight').max=styleMaxBall;
  $('diameterField').classList.toggle('hidden',byWeight);
  $('ballWeightField').classList.toggle('hidden',!byWeight);
  $('diameterModeLabel').classList.toggle('active',!byWeight);
  $('weightModeLabel').classList.toggle('active',byWeight);
  $('sizeModeHint').textContent=byWeight
    ? L('Bolgewicht invoeren → de verwachte pizzadiameter wordt ter indicatie berekend.',
        'Enter dough-ball weight → the expected pizza diameter is calculated as an indication.')
    : L('Diameter invoeren → het benodigde bolgewicht wordt automatisch berekend.',
        'Enter diameter → the required dough-ball weight is calculated automatically.');
}

function calc(){
  refreshSizeModeUI();
  const byWeight=!$('sizeFromDiameter').checked;
  let targetBall, targetDiameter;

  if(byWeight){
    const maxBall=recommendedBallWeight(MAX_DIAMETER);
    targetBall=clamp(num('ballWeight')||100,100,maxBall);
    targetDiameter=clamp(estimatedDiameterFromWeight(targetBall),MIN_DIAMETER,MAX_DIAMETER);
    // Alleen het afgeleide, verborgen tegenveld wordt live bijgewerkt. Het
    // zichtbare bolgewichtveld waarin iemand typt blijft volledig ongemoeid.
    if(Number($('diameter').value)!==roundTo(targetDiameter,0.5)) $('diameter').value=roundTo(targetDiameter,0.5);
  }else{
    targetDiameter=clamp(num('diameter')||REF_DIAMETER,MIN_DIAMETER,MAX_DIAMETER);
    targetBall=recommendedBallWeight(targetDiameter);
    // In diametermodus is bolgewicht afgeleid; diameter zelf wordt pas bij
    // change/blur genormaliseerd en nooit tijdens een tussenliggende toets.
    if(Number($('ballWeight').value)!==targetBall) $('ballWeight').value=targetBall;
  }
  // Receptgrammen zijn geschreven voor 32 cm; alles schaalt mee met het oppervlak.
  setToppingScale(targetDiameter);

  // Aantal pizza's én absolute diameter hebben een praktische appgrens.
  // Binnen die 40 cm blijft de 12"-schep / 14"-Koda-waarschuwing bewust zacht.
  const pizzasRaw=Math.round(num('pizzas'));
  const pizzas=clamp(Number.isFinite(pizzasRaw)&&pizzasRaw>0?pizzasRaw:1,1,MAX_PIZZAS);
  const h=selectedHydration(),s=selectedSalt(),y=selectedYeastPct(),o=selectedOil();
  const totalTarget=pizzas*targetBall;
  const factor=1+h/100+s/100+y/100+o/100;
  const flourExact=totalTarget/factor;
  const practical=$('practical').checked;
  let flour,water,salt,yeast,oil;
  if(practical){
    flour=roundTo(flourExact,5);
    water=roundTo(flour*h/100,5);
    salt=roundTo(flour*s/100,1);
    yeast=roundTo(flour*y/100,0.1);
    oil=roundTo(flour*o/100,1);
  }else{
    flour=roundTo(flourExact,0.1);
    water=roundTo(flour*h/100,0.1);
    salt=roundTo(flour*s/100,0.1);
    yeast=roundTo(flour*y/100,0.01);
    oil=roundTo(flour*o/100,0.1);
  }
  const total=flour+water+salt+yeast+oil;
  const actualBall=total/pizzas;
  const actualH=water/flour*100,actualS=salt/flour*100,actualY=yeast/flour*100,actualO=oil/flour*100;
  let reserve=roundTo(water*(20/380),practical?5:0.1);
  reserve=clamp(reserve,practical?5:1,Math.max(practical?5:1,water*0.10));
  const mainWater=water-reserve;
  const ferm=$('fermentationMethod').value==='room'
    ? 'room'
    : ($('coldStorageMode').value==='balls'?'coldBalls':'hybrid');
  const bulk=nonNegativeNum('bulkHours'),cold=ferm==='room'?0:nonNegativeNum('coldHours'),ball=nonNegativeNum('ballHours');
  return {
    pizzas,targetBall,targetDiameter,byWeight,h,s,y,o,flour,water,salt,yeast,oil,total,actualBall,actualH,actualS,actualY,actualO,
    reserve,mainWater,bulk,cold,ball,
    room:boundedNum('roomTemp',21),fridge:boundedNum('fridgeTemp',4),autolyse:$('autolyse').checked,ferm,
    yeastType:$('yeastType').value,stoneTemp:boundedNum('stoneTemp',430),preheat:boundedNum('preheatMinutes',30),
    doughTemp:boundedNumDefault('finalDoughTemp',FERMENT_DEFAULTS.finalDoughTemp),
    flourW:(String($('flourW').value).trim()!==''?boundedNum('flourW',FERMENT_DEFAULTS.flourW):(currentFlourType().w??FERMENT_DEFAULTS.flourW)),
    flourWKnown:(String($('flourW').value).trim()!=='' || currentFlourType().w!=null),
    flourTypeKey:($('flourType')&&flourTypes[$('flourType').value])?$('flourType').value:'caputoPizzeria',
    flourName:flourTypeName(currentFlourType()),
    flourOfficial:currentFlourType().official,
    flourStructure:currentFlourType().structure,
    flourNote:flourTypeNote(currentFlourType()),
    doughTempDefault:!$('finalDoughTemp').value.trim(),
    flourWDefault:!$('flourW').value.trim() && currentFlourType().w!=null,
    toppingScale
  };
}

function fermentationHours(c){
  if(c.ferm==='room') return c.bulk+c.ball;
  return c.bulk+c.cold+c.ball;
}

// Praktische thuiskalibratie, geen natuurwet. Doorgetrokken boven 35 graden
// zodat een warme rijskast of proofbox niet als "even snel als 35 graden"
// wordt gemodelleerd; boven ~45 graden loopt gist snel dood.
const YEAST_TEMP_CURVE=[
  [0,0.01],[4,0.04],[8,0.09],[12,0.20],[16,0.42],[18,0.62],
  [21,1.00],[24,1.55],[27,2.35],[30,3.35],[32,3.55],[35,3.00],
  [38,2.20],[42,0.90],[46,0.10],[50,0.02]
];

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

// Een aparte, mildere klok voor enzymatische/rheologische rijping.
// Dit is bewust een index en geen directe labmeting.
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
    const next=envTemp+(t-envTemp)*Math.exp(-dt/tau);
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

  add(c.room,c.bulk,bulkTau,L('Bulk buiten','Bulk at room temp'),'bulk');
  if(c.ferm==='hybrid'){
    add(c.fridge,c.cold,bulkTau,L('Koelkast • bulk','Fridge • bulk'),'coldBulk');
    add(c.room,c.ball,ballTau,L('Bolrijs / opwarming','Ball proof / warm-up'),'ballWarm');
  }else if(c.ferm==='coldBalls'){
    add(c.fridge,c.cold,ballTau,L('Koelkast • bollen','Fridge • balls'),'coldBalls');
    add(c.room,c.ball,ballTau,L('Laatste opwarming','Final warm-up'),'ballWarm');
  }else{
    add(c.room,c.ball,ballTau,L('Bolrijs buiten','Ball proof at room temp'),'ballRoom');
  }

  return {
    phases,
    gas:phases.reduce((a,p)=>a+p.gas,0),
    maturity:phases.reduce((a,p)=>a+p.maturity,0),
    endTemp:t,
    bulkTau,ballTau,massKg,ballWeight
  };
}

function riseTarget(style){
  const map={
    neapolitan:{bulk:'+20–40%',final:L('ongeveer 1,5–1,8× het volume van een verse bol','roughly 1.5–1.8× the volume of a fresh ball')},
    avpn:{bulk:'+20–40%',final:L('ongeveer 1,5–1,8× het volume van een verse bol','roughly 1.5–1.8× the volume of a fresh ball')},
    canotto:{bulk:'+30–50%',final:L('ongeveer 1,7–2,1×; duidelijk luchtig maar nog sterk','roughly 1.7–2.1×; clearly airy but still strong')},
    ny:{bulk:'+40–70%',final:L('ongeveer 1,7–2,1×; zacht en goed ontspannen','roughly 1.7–2.1×; soft and well relaxed')},
    thin:{bulk:'+25–45%',final:L('ongeveer 1,4–1,7×; niet maximaal laten opblazen','roughly 1.4–1.7×; do not let it inflate fully')}
  };
  return map[style]||map.neapolitan;
}

function flourRisk(c,sim){
  const hydrationLoad=1+Math.max(0,c.h-65)*0.025;
  const load=sim.maturity*hydrationLoad;
  if(!c.flourWKnown){
    return {w:null,load,capacity:null,ratio:null,level:'unknown',label:L('W onbekend','W unknown'),cls:'warn'};
  }
  const w=clamp(c.flourW,90,450);
  const capacity=clamp(20+(w-220)*0.16,5,48);
  const ratio=load/capacity;
  let level,label,cls;
  if(ratio<.70){level='low';label=L('ruime marge','wide margin');cls='good';}
  else if(ratio<1.0){level='normal';label=L('goed passend','good fit');cls='good';}
  else if(ratio<1.25){level='elevated';label=L('opletten','watch closely');cls='warn';}
  else{level='high';label=L('hoog risico','high risk');cls='hot';}
  return {w,load,capacity,ratio,level,label,cls};
}


// Het empirische thuismodel, losgetrokken zodat de AVPN-tak er ook mee kan vergelijken.
function genericYeastModel(c,sim){
  const eq=Math.max(2,sim.gas);
  const styleFactor={neapolitan:1,avpn:1,canotto:1.08,ny:.95,thin:.86}[ $('doughStyle').value ]||1;
  const saltFactor=Math.exp((c.s-2.5)*0.09);
  let idy=0.68/Math.pow(eq,0.80);
  idy*=saltFactor*styleFactor;
  idy=clamp(idy,0.015,0.55);
  return {eq,idy,saltFactor,styleFactor};
}

function avpnMidpointYeastAdvice(c){
  const sim=simulateFermentation(c);
  const freshMidPct=(1.55/1700)*100;
  const freshLowPct=(0.1/1700)*100;
  const freshHighPct=(3/1700)*100;
  const idyMidPct=freshMidPct/3;
  const idyLowPct=freshLowPct/3;
  const idyHighPct=freshHighPct/3;
  const selected=c.yeastType==='fresh'?freshMidPct:idyMidPct;
  const low=c.yeastType==='fresh'?freshLowPct:idyLowPct;
  const high=c.yeastType==='fresh'?freshHighPct:idyHighPct;
  const risk=flourRisk(c,sim),rise=riseTarget($('doughStyle').value);
  const gen=genericYeastModel(c,sim);
  const mult=yeastTypes[c.yeastType].mult;
  const modelSelected=clamp(gen.idy*mult,low,high);      // modelvoorstel binnen de officiële range
  const modelRaw=gen.idy*mult;                            // ongeclampt, om conflict te kunnen tonen
  const ratio=gen.idy/idyMidPct;

  const warnings=[{
    cls:'good',
    text:L(
      'AVPN-preset: de balk is de officiële verse-gistrange (0,1–3 g per liter water), omgerekend naar de gekozen gistsoort en batch. Het rekenkundige midden is 1,55 g/L.',
      'AVPN preset: the bar shows the official fresh-yeast range (0.1–3 g per litre of water), converted to the selected yeast type and batch. The arithmetic midpoint is 1.55 g/L.')
  }];
  if(ratio>=1.5||ratio<=1/1.5){
    warnings.push({cls:'warn',text:L(
      `Let op: het praktische fermentatiemodel van deze calculator komt voor dit schema uit op ongeveer <b>${fmt(c.flour*modelRaw/100,2)} g</b>, tegen <b>${fmt(c.flour*selected/100,2)} g</b> voor het rekenkundige AVPN-midden — een factor ${fmt(ratio,1)}. Die 0,1–3 g/L is een zeer brede range die AVPN bewust openlaat voor verschillende tijden, temperaturen en seizoenen; een rekenkundig midden daarvan is geen aanbeveling. Voor deze AVPN-preset laten we beide waarden zichtbaar staan; de officiële range blijft leidend.`,
      `Note: for this schedule, the calculator's practical fermentation model gives about <b>${fmt(c.flour*modelRaw/100,2)} g</b>, versus <b>${fmt(c.flour*selected/100,2)} g</b> for the arithmetic AVPN midpoint — a factor of ${fmt(ratio,1)}. The 0.1–3 g/L range is deliberately broad to accommodate different times, temperatures and seasons; its arithmetic midpoint is not a recommendation. This AVPN preset shows both values; the official range remains leading.`)});
  }
  if(modelRaw>high){
    warnings.push({cls:'warn',text:L(
      'Het generieke thuismodel valt hier zelfs boven de officiële AVPN-bovengrens. Omdat 18 uur bij 19 °C juist midden in AVPN\'s eigen tijd- en temperatuurbereik ligt, behandelen we dit als een kalibratiebeperking van het generieke model. Voor de AVPN-preset heeft de officiële AVPN-range daarom voorrang.',
      "The generic home model is even above the official AVPN upper limit here. Because 18 hours at 19 °C sits well within AVPN's own time and temperature range, this is treated as a calibration limitation of the generic model. The official AVPN range therefore takes precedence for this preset.")});
  }

  return {
    eq:Math.max(2,sim.gas),
    idy:idyMidPct,
    selected,low,high,
    lowIdy:idyLowPct,highIdy:idyHighPct,
    modelSelected,modelRaw,modelIdy:gen.idy,ratio,
    sim,risk,rise,
    uncertainty:null,
    warnings,
    saltFactor:1,styleFactor:1,
    avpnOfficial:true
  };
}

function yeastRecommendation(c){
  if($('preset').value==='avpnMid')return avpnMidpointYeastAdvice(c);
  const sim=simulateFermentation(c);

  // Empirisch gekalibreerde thuiscurve. Tijd/temperatuur zit in de geïntegreerde gas-klok;
  // zout corrigeert bescheiden, hydratatie niet rechtstreeks.
  const gen=genericYeastModel(c,sim);
  const eq=gen.eq,idy=gen.idy,styleFactor=gen.styleFactor,saltFactor=gen.saltFactor;

  const coldUncertainty=c.ferm==='room'?0:(c.cold>=48?.08:c.cold>=18?.05:.03);
  const tempUncertainty=c.fridge<=4.5&&c.ferm!=='room'?.03:0;
  const uncertainty=clamp(.20+coldUncertainty+tempUncertainty,.20,.34);

  const mult=yeastTypes[c.yeastType].mult;
  const selected=idy*mult;
  const low=selected*(1-uncertainty),high=selected*(1+uncertainty);
  const risk=flourRisk(c,sim),rise=riseTarget($('doughStyle').value);

  const warnings=[];
  if(c.fridge>=8&&c.ferm!=='room')warnings.push({cls:'warn',text:L(`Je koelkast staat op ${fmt(c.fridge,1)} °C. Dat is een actieve koude fermentatie, geen sterke retardatie; controleer het deeg eerder.`,`Your refrigerator is at ${fmt(c.fridge,1)} °C. That is active cold fermentation rather than strong retardation; check the dough earlier.`)});
  if(c.fridge<=3&&c.ferm!=='room')warnings.push({cls:'good',text:L(`Bij ${fmt(c.fridge,1)} °C wordt gist zeer sterk afgeremd. De warme fasen en het langzaam afkoelen leveren relatief veel van de gasproductie.`,`At ${fmt(c.fridge,1)} °C yeast is strongly slowed. Warm phases and gradual cooling contribute a relatively large part of gas production.`)});
  if(c.doughTemp>=28)warnings.push({cls:'warn',text:L(`Doel-einddeegtemperatuur ${fmt(c.doughTemp,1)} °C is hoog voor een lang schema: de eerste uren verlopen duidelijk sneller.`,`Target final dough temperature ${fmt(c.doughTemp,1)} °C is high for a long schedule: the first hours will progress noticeably faster.`)});
  if(c.doughTemp<=19)warnings.push({cls:'warn',text:L(`Doel-einddeegtemperatuur ${fmt(c.doughTemp,1)} °C is laag: de start van de fermentatie is trager dan normaal.`,`Target final dough temperature ${fmt(c.doughTemp,1)} °C is low: fermentation starts more slowly than normal.`)});
  if(risk.level==='elevated'||risk.level==='high')warnings.push({cls:risk.cls,text:L(`Rijpingsbelasting versus W${fmt(c.flourW,0)}: ${risk.label}. Kijk extra naar deegsterkte en volume in plaats van alleen naar de klok.`,`Maturation load versus W${fmt(c.flourW,0)}: ${risk.label}. Pay extra attention to dough strength and volume rather than only the clock.`)});
  if(risk.level==='unknown')warnings.push({cls:'warn',text:L(`Bloemsoort <b>${esc(c.flourName)}</b>: W is onbekend, dus de calculator geeft bewust geen numerieke W-risicoscore. ${esc(c.flourNote)}`,`Flour type <b>${esc(c.flourName)}</b>: W is unknown, so the calculator deliberately does not show a numerical W-risk score. ${esc(c.flourNote)}`)});
  if(c.flourWKnown && ['spelt','speltWhole','wholegrain'].includes(c.flourStructure))warnings.push({cls:'warn',text:L(`De ingevulde W-waarde wordt gebruikt, maar W alleen beschrijft <b>${esc(c.flourName)}</b> niet volledig. Controleer structuur en volume extra visueel.`,`The entered W value is used, but W alone does not fully describe <b>${esc(c.flourName)}</b>. Check structure and volume visually with extra care.`)});
  if(c.yeastType==='ady')warnings.push({cls:'warn',text:L('ADY-conversie is merkafhankelijk. De calculator gebruikt 1,25× IDY als praktische default; fabrikantadvies gaat voor.','ADY conversion depends on the product. The calculator uses 1.25× IDY as a practical default; manufacturer guidance takes precedence.')});
  if(c.cold>72)warnings.push({cls:'warn',text:L('Meer dan 72 uur koud is sterk afhankelijk van bloem, koelkast en deegtemperatuur; de onzekerheidsmarge wordt groter.','More than 72 hours cold depends strongly on flour, refrigerator and dough temperature; uncertainty increases.')});

  return {eq,idy,selected,low,high,sim,risk,rise,uncertainty,warnings,saltFactor,styleFactor};
}

function update(){
  refreshFermentationUI();
  refreshAvpnPresetInfo();
  applyAppModeUI();
  const c=calc();
  const advice=yeastRecommendation(c);
  const yt=yeastTypes[c.yeastType];

  $('targetSummary').textContent=c.byWeight
    ? L(`${c.pizzas} pizza's • ${fmt(c.targetBall,0)} g per bol • geschat ±${fmt(c.targetDiameter,1)} cm`,`${c.pizzas} pizzas • ${fmt(c.targetBall,0)} g per dough ball • estimated ±${fmt(c.targetDiameter,1)} cm`)
    : L(`${c.pizzas} pizza's • ${fmt(c.targetDiameter,1)} cm • berekend ±${fmt(c.targetBall,0)} g per bol`,`${c.pizzas} pizzas • ${fmt(c.targetDiameter,1)} cm • calculated ±${fmt(c.targetBall,0)} g per dough ball`);
  $('flourOut').textContent=`${fmt(c.flour,1)} g`;
  $('waterOut').textContent=`${fmt(c.water,1)} g`;
  $('saltOut').textContent=`${fmt(c.salt,1)} g`;
  $('yeastOut').textContent=`${fmt(c.yeast,2)} g`;
  $('oilOut').textContent=`${fmt(c.oil,1)} g`;
  $('yeastName').textContent=yeastName(c.yeastType);
  $('oilCard').classList.toggle('hidden',c.o<=0);

  $('hydOut').textContent=L(`werkelijk ${fmt(c.actualH,1)}%`,`actual ${fmt(c.actualH,1)}%`);
  $('saltPOut').textContent=L(`werkelijk ${fmt(c.actualS,2)}%`,`actual ${fmt(c.actualS,2)}%`);
  $('yeastPOut').textContent=L(`werkelijk ${fmt(c.actualY,3)}%`,`actual ${fmt(c.actualY,3)}%`);
  $('oilPOut').textContent=L(`werkelijk ${fmt(c.actualO,2)}%`,`actual ${fmt(c.actualO,2)}%`);

  // Onthoudregel en de hint bovenaan komen allebei uit dezelfde berekening,
  // zodat het label nooit meer kan afwijken van wat de calculator uitrekent.
  const memoryLine=`${fmt(c.flour,0)} – ${fmt(c.water,0)} – ${fmt(c.salt,0)} – ${fmtFixed(c.yeast,c.yeast<10?1:0)}${c.o>0?' – '+fmt(c.oil,0):''}`;
  $('memoryOut').textContent=memoryLine;
  if($('presetSummaryValue')) $('presetSummaryValue').textContent=`${memoryLine} g`;
  if($('presetSummaryHint')) $('presetSummaryHint').innerHTML=L(
    `Deze preset komt uit op <b id="presetSummaryValue">${memoryLine} g</b> (bloem – water – zout – gist).`,
    `This preset works out to <b id="presetSummaryValue">${memoryLine} g</b> (flour – water – salt – yeast).`);
  if($('flourSmall')) $('flourSmall').textContent=c.flourName+(c.flourWKnown?` • W${fmt(c.flourW,0)}`:L(' • W onbekend',' • W unknown'));
  // Huidige hardware als zachte referentie: 12" schep en 14" Koda 2.
  const peel=$('peelHint');
  if(peel){
    const notes=[];
    if(c.targetDiameter>PEEL_DIAMETER+0.01) notes.push(L(
      `<b>12″ schep:</b> ${fmt(c.targetDiameter,1)} cm is groter dan ${fmt(PEEL_DIAMETER,1)} cm. Dat kan bewust zijn, maar lanceren wordt duidelijk lastiger.`,
      `<b>12″ peel:</b> ${fmt(c.targetDiameter,1)} cm is larger than ${fmt(PEEL_DIAMETER,1)} cm. This may be intentional, but launching becomes noticeably harder.`));
    if(c.targetDiameter>OVEN_DIAMETER+0.01) notes.push(L(
      `<b>14″ Koda 2:</b> ${fmt(c.targetDiameter,1)} cm ligt boven de huidige ovenreferentie van ${fmt(OVEN_DIAMETER,1)} cm. De calculator rekent door omdat dit een bewuste override kan zijn; controleer zelf of je andere oven/opstelling dit aankan.`,
      `<b>14″ Koda 2:</b> ${fmt(c.targetDiameter,1)} cm exceeds the current oven reference of ${fmt(OVEN_DIAMETER,1)} cm. The calculator keeps calculating because this may be a deliberate override; verify that your actual oven/setup can handle it.`));
    peel.classList.toggle('hidden',notes.length===0);
    peel.innerHTML=notes.join('<br>');
  }
  $('totalOut').textContent=`${fmt(c.total,1)} g`;
  $('actualBallOut').textContent=`${fmt(c.actualBall,1)} g`;
  {const lp=liveFermentationPlan(c);$('fermentOut').textContent=`${fmt(fermentationHours(lp.effective),1)} ${L('u','h')}${lp.active?L(' • live',' • live'):''}`;}

  const dh=Math.abs(c.actualH-c.h);
  const yeastDev=c.y>0?Math.abs(c.actualY-c.y)/c.y:0;
  $('roundingInfo').innerHTML=L(
      `Praktisch afgerond. Doelhydratatie <b>${fmt(c.h,2)}%</b> → werkelijk <b>${fmt(c.actualH,2)}%</b> (${dh<0.01?'vrijwel exact':`${fmt(dh,2)} procentpunt verschil`}).`,
      `Practically rounded. Target hydration <b>${fmt(c.h,2)}%</b> → actual <b>${fmt(c.actualH,2)}%</b> (${dh<0.01?'virtually exact':`${fmt(dh,2)} percentage-point difference`}).`)
    +(yeastDev>0.08?L(
      ` <b>Let op:</b> door het afronden op 0,1 g wijkt de gist ${fmt(yeastDev*100,0)}% van het doel af. Bij zulke kleine hoeveelheden helpt een 0,01 g-weegschaal, verse gist, of praktisch afronden uitzetten.`,
      ` <b>Note:</b> rounding to 0.1 g makes the yeast differ by ${fmt(yeastDev*100,0)}% from target. At such small amounts, a 0.01 g scale, fresh yeast or disabling practical rounding helps.`):'');

  const estFlour=c.flour||600;
  const recGrams=estFlour*advice.selected/100;
  const lowG=estFlour*advice.low/100, highG=estFlour*advice.high/100;
  // De bandbreedte is nu het hoofdgetal. Een enkel getal suggereert een
  // precisie die dit model niet heeft.
  const nlAdv=currentLang!=='en';
  $('yeastAdvice').textContent=`${fmt(lowG,2)} – ${fmt(highG,2)} g ${yt.short}`;
  if(advice.avpnOfficial){
    const modelG=estFlour*advice.modelRaw/100;
    $('yeastAdviceDetail').textContent=nlAdv
      ? `Officiële AVPN-range • rekenkundig midden ${fmt(recGrams,2)} g • dit model stelt ${fmt(modelG,2)} g voor bij 18 u @ 19 °C`
      : `Official AVPN range • arithmetic midpoint ${fmt(recGrams,2)} g • this model suggests ${fmt(modelG,2)} g for 18 h @ 19 °C`;
  }else{
    $('yeastAdviceDetail').textContent=nlAdv
      ? `Midden ${fmt(recGrams,2)} g • onzekerheid ±${fmt(advice.uncertainty*100,0)}% • ${fmt(advice.eq,1)} gistactiviteitsuren @ 21 °C`
      : `Midpoint ${fmt(recGrams,2)} g • uncertainty ±${fmt(advice.uncertainty*100,0)}% • ${fmt(advice.eq,1)} yeast-activity hours @ 21 °C`;
  }
  renderYeastRangeBar(c,advice,estFlour,yt);
  buildFermentationScience(c,advice);
  buildDeadlineAdvice(c);

  buildPizzaBallSelectors();
  updateSauceSummary(c);
  updateRecipeSummary(c);
  buildPizzaCustomize(c);
  buildSteps(c);
  buildMixerCapacityNote(c);
  buildTimeline(c);
  renderBakeLog(c);
  buildShopping(c);
  buildStoneAdvice(c);
  // De ingrediëntenmodal werd bij elke toetsaanslag herbouwd, ook dicht.
  if(!$('ingredientsModal').classList.contains('hidden')) buildIngredientsModal(c);
  scheduleSave();
}

// Visuele bandbreedte. Voor de AVPN-preset staat de officiële range op de
// balk met daarin twee markeringen: het rekenkundige midden en wat het
// praktische model voor dit schema voorstelt.
function renderYeastRangeBar(c,advice,estFlour,yt){
  const box=$('yeastRangeBar');
  if(!box)return;
  const nl=currentLang!=='en';
  const g=pct=>estFlour*pct/100;
  const lo=g(advice.low),hi=g(advice.high);
  const mid=g(advice.selected);
  const current=c.yeast;

  if(advice.avpnOfficial){
    const model=g(advice.modelRaw);
    const axisMax=Math.max(hi,model,current)*1.08||1;
    const pos=v=>clamp(v/axisMax*100,0,100);
    box.innerHTML=`
      <div class="bar">
        <div class="span" style="left:${pos(lo)}%;width:${Math.max(1.5,pos(hi)-pos(lo))}%"></div>
        <div class="mark" style="left:${pos(mid)}%"></div>
        <div class="mark model" style="left:${pos(model)}%"></div>
      </div>
      <div class="scale"><span>0 g</span><span>${fmt(axisMax,2)} g ${yt.short}</span></div>
      <div class="legend">
        <span class="key" style="background:rgba(240,180,90,.5)"></span>${nl?'officiële AVPN-range':'official AVPN range'} ${fmt(lo,2)}–${fmt(hi,2)} g •
        <span class="key" style="background:var(--text)"></span>${nl?'rekenkundig midden':'arithmetic midpoint'} ${fmt(mid,2)} g •
        <span class="key" style="background:var(--accent)"></span>${nl?'wat dit model voorstelt':'what this model suggests'} ${fmt(model,2)} g
      </div>`;
    return;
  }

  const axisMax=Math.max(hi,current)*1.15||1;
  const pos=v=>clamp(v/axisMax*100,0,100);
  box.innerHTML=`
    <div class="bar">
      <div class="span" style="left:${pos(lo)}%;width:${Math.max(1.5,pos(hi)-pos(lo))}%"></div>
      <div class="mark" style="left:${pos(mid)}%"></div>
      <div class="mark model" style="left:${pos(current)}%"></div>
    </div>
    <div class="scale"><span>0 g</span><span>${fmt(axisMax,2)} g ${yt.short}</span></div>
    <div class="legend">
      <span class="key" style="background:rgba(240,180,90,.5)"></span>${nl?'adviesbereik':'guidance range'} ${fmt(lo,2)}–${fmt(hi,2)} g •
      <span class="key" style="background:var(--text)"></span>${nl?'midden':'midpoint'} ${fmt(mid,2)} g •
      <span class="key" style="background:var(--accent)"></span>${nl?'nu in je recept':'currently in your recipe'} ${fmt(current,2)} g
    </div>`;
}

function buildFermentationScience(c,a){
  const currentIdy=c.y/yeastTypes[c.yeastType].mult;
  let currentStatus,currentCls;
  const statusLowIdy=a.lowIdy!=null?a.lowIdy:a.idy*(1-a.uncertainty);
  const statusHighIdy=a.highIdy!=null?a.highIdy:a.idy*(1+a.uncertainty);
  if(currentIdy<statusLowIdy){currentStatus=L('onder advies','below guidance');currentCls='warn';}
  else if(currentIdy>statusHighIdy){currentStatus=L('boven advies','above guidance');currentCls='warn';}
  else{currentStatus=a.avpnOfficial?L('binnen AVPN-range','within AVPN range'):L('binnen bereik','within range');currentCls='good';}

  const tempSourceText=currentLang==='en'
    ? (c.doughTempDefault
        ? 'starting dough: default 24 °C; temperature path estimated'
        : `starting dough: measured ${fmt(c.doughTemp,1)} °C; subsequent path estimated`)
    : (c.doughTempDefault
        ? 'startdeeg: standaard 24 °C; temperatuurverloop geschat'
        : `startdeeg: gemeten ${fmt(c.doughTemp,1)} °C; verloop daarna geschat`);
  const flourSourceText=currentLang==='en'
    ? (c.flourWKnown
        ? `${esc(c.flourName)} • ${c.flourOfficial&&c.flourWDefault?'manufacturer specification':(c.flourWDefault?'known default':'entered W value')}`
        : `${esc(c.flourName)} • W unknown; no numerical risk score`)
    : (c.flourWKnown
        ? `${esc(c.flourName)} • ${c.flourOfficial&&c.flourWDefault?'fabrieksspecificatie':(c.flourWDefault?'bekende standaard':'zelf ingevulde W-waarde')}`
        : `${esc(c.flourName)} • W onbekend; geen numerieke risicoscore`);

  $('fermentDashboard').innerHTML=`
    <div class="ferment-metric"><span>${L('Gistactiviteit','Yeast activity')}</span><b>${fmt(a.eq,1)} ${L('u','h')} @ 21 °C</b><small>${tempSourceText}</small></div>
    <div class="ferment-metric"><span>${L('Rijpingsindex','Maturation index')}</span><b>${fmt(a.sim.maturity,1)}</b><small>${L('modelindex voor tijd/temperatuur; geen labwaarde','model index for time/temperature; not a lab value')}</small></div>
    <div class="ferment-metric"><span>${L('Bloemschatting','Flour estimate')}</span><b>${c.flourWKnown?`W${fmt(c.flourW,0)} • ${a.risk.label}`:a.risk.label}</b><small>${flourSourceText}</small></div>
    <div class="ferment-metric"><span>${L('Huidige gist','Current yeast')}</span><b>${currentStatus}</b><small>${fmt(c.yeast,2)} g ${yeastShort(c.yeastType)} ${L('in recept','in recipe')}</small></div>`;

  const base=[{cls:currentCls,text:L(
    `Huidige gist: <b>${fmt(c.yeast,2)} g ${yeastShort(c.yeastType)}</b> is ${currentStatus} ten opzichte van de berekende bandbreedte.`,
    `Current yeast: <b>${fmt(c.yeast,2)} g ${yeastShort(c.yeastType)}</b> is ${currentStatus} relative to the calculated range.`)}];
  const target={cls:'good',text:L(
    `Visuele eindcheck: bulk richtwaarde <b>${a.rise.bulk}</b>; voor bakken <span class="rise-target">${a.rise.final}</span>. De klok is een planning, niet het enige eindpunt.`,
    `Visual final check: bulk target <b>${a.rise.bulk}</b>; before baking <span class="rise-target">${a.rise.final}</span>. The clock is a planning tool, not the only endpoint.`)};
  $('fermentWarnings').innerHTML=[...base,...a.warnings,target].map(w=>`<div class="ferment-warning ${w.cls}">${w.text}</div>`).join('');

  const phaseRows=a.sim.phases.filter(p=>p.hours>0).map(p=>`<div class="phase-row">
    <span>${p.name}</span><span>${fmt(p.hours,1)} u</span><span>${fmt(p.startTemp,1)}→${fmt(p.endTemp,1)} °C</span><span>${fmt(p.gas,2)}</span><span>${fmt(p.maturity,2)}</span>
  </div>`).join('');
  const technicalModelText=currentLang==='en'
    ? `<div class="tech-note">
        <b>Model values:</b> starting dough ${fmt(c.doughTemp,1)} °C (${c.doughTempDefault?'default':'measured'}); room ${fmt(c.room,1)} °C; refrigerator ${fmt(c.fridge,1)} °C; ${c.flourWKnown?`W${fmt(c.flourW,0)}`:'W unknown'} (${esc(c.flourName)}${c.flourWKnown?(c.flourWDefault?(c.flourOfficial?', manufacturer specification':', known default'):', entered manually'):', no numerical W-risk score'}).
        Practical thermal model constant: bulk ${fmt(a.sim.bulkTau,2)} h, dough ball ${fmt(a.sim.ballTau,2)} h.
        ${a.avpnOfficial
          ? `AVPN midpoint yeast: IDY-equivalent ${fmt(a.idy,3)}% flour; based on the official 0.1–3 g fresh yeast per litre water range.`
          : `IDY-equivalent guidance ${fmt(a.idy,3)}% flour; salt correction ×${fmt(a.saltFactor,2)}; style correction ×${fmt(a.styleFactor,2)}.`}
        In this model hydration mainly affects the structural/maturation warning and does not directly change yeast activity.
      </div>
      <div class="tech-note"><b>Evidence & limits:</b> AVPN 2024/2026 is used for traditional dough, timing and yeast reference ranges; Covino et al. (2023) and Di Stasio et al. (2025) for time-dependent changes in pizza dough; general <i>S. cerevisiae</i> literature for the direction of temperature effects; and Caputo for the W260–280 specification of Pizzeria flour. The exact yeast curve, thermal model constants, maturation index and W-risk score are practical home calibrations and have not been validated together as one predictive laboratory model. Yeast conversion: ADY uses a practical 1.25 × IDY default, but manufacturer guidance varies from roughly 1:1 to 1.25:1; fresh yeast ≈ 3 × IDY.</div>`
    : `<div class="tech-note">
        <b>Modelwaarden:</b> startdeeg ${fmt(c.doughTemp,1)} °C (${c.doughTempDefault?'standaard':'gemeten'}); kamer ${fmt(c.room,1)} °C; koelkast ${fmt(c.fridge,1)} °C; ${c.flourWKnown?`W${fmt(c.flourW,0)}`:'W onbekend'} (${esc(c.flourName)}${c.flourWKnown?(c.flourWDefault?(c.flourOfficial?', fabrieksspecificatie':', bekende standaard'):', zelf ingevuld'):', geen numerieke W-risicoscore'}).
        Praktische thermische modelconstante: bulk ${fmt(a.sim.bulkTau,2)} u, bol ${fmt(a.sim.ballTau,2)} u.
        ${a.avpnOfficial
          ? `AVPN-middengist: IDY-equivalent ${fmt(a.idy,3)}% bloem; gebaseerd op de officiële range 0,1–3 g verse gist per liter water.`
          : `IDY-equivalent advies ${fmt(a.idy,3)}% bloem; zoutcorrectie ×${fmt(a.saltFactor,2)}; stijlcorrectie ×${fmt(a.styleFactor,2)}.`}
        Hydratatie beïnvloedt in dit model vooral de structurele/rijpingswaarschuwing en niet rechtstreeks de gistactiviteit.
      </div>
      <div class="tech-note"><b>Onderbouwing & grenzen:</b> AVPN 2024/2026 voor traditionele deeg-, tijd- en gistkaders; Covino et al. (2023) en Di Stasio et al. (2025) voor tijdsafhankelijke veranderingen in pizzadeeg; algemene <i>S. cerevisiae</i>-literatuur voor de richting van temperatuureffecten; Caputo voor W260–280 van Pizzeria. De exacte gistcurve, thermische modelconstanten, rijpingsindex en W-risicoscore zijn praktische thuis-kalibraties en niet als één voorspellend model laboratorium-gevalideerd. Gistconversie: ADY gebruikt praktisch 1,25 × IDY als standaard, maar fabrikantadvies varieert grofweg van 1:1 tot 1,25:1; verse gist ≈ 3 × IDY.</div>`;

  $('fermentationTechnical').innerHTML=`
    <div class="phase-grid">
      <div class="phase-row head"><span>${currentLang==='en'?'Phase':'Fase'}</span><span>${currentLang==='en'?'Time':'Tijd'}</span><span>${currentLang==='en'?'Dough temp':'Deegtemp'}</span><span>${currentLang==='en'?'Yeast-h':'Gist-u'}</span><span>${currentLang==='en'?'Maturation':'Rijping'}</span></div>
      ${phaseRows}
    </div>
    ${technicalModelText}`;
}

function applyYeastAdvice(){
  const c=calc();
  const a=yeastRecommendation(c);
  exactOverride=exactOverride||{h:selectedHydration(),s:selectedSalt(),o:selectedOil(),ySelected:selectedYeastPct()};
  exactOverride.ySelected=a.selected;
  $('yeastPct').value=fieldNum(a.selected,3);
  markCustom(false);
  update();
}

function applyPreset(key){
  if(key==='custom') return;
  const p=presets[key]; if(!p)return;
  liveMeasurements={doughTemp:null,fridgeTemp:null};
  _livePlanCache={key:null,value:null};
  suppressCustom=true;
  $('preset').value=key;
  $('pizzas').value=p.pizzas;
  $('diameter').value=p.diameter;
  $('doughStyle').value=p.style;
  // Presetwaarden worden op volle precisie in de velden gezet. Vroeger werden
  // ze op 0,1 afgerond, waardoor 0,17% gist als 0,2% in beeld kwam en bij de
  // eerste bewerking ook echt 0,2% werd.
  $('hydration').value=fieldNum(p.h,2);
  $('saltPct').value=fieldNum(p.s,2);
  const presetYeastType=p.yeastType||'idy';
  $('yeastType').value=presetYeastType;
  previousYeastType=presetYeastType;
  const presetYeastSelected=p.ySelected!=null?p.ySelected:(p.yIdy*yeastTypes[presetYeastType].mult);
  $('yeastPct').value=fieldNum(presetYeastSelected,3);
  $('oilPct').value=fieldNum(p.o,1);
  $('fermentationMethod').value=p.fermentation==='room'?'room':'hybrid';
  $('coldStorageMode').value=p.fermentation==='coldBalls'?'balls':'bulk';
  $('bulkHours').value=p.bulk;
  $('coldHours').value=p.cold;
  $('ballHours').value=p.ball;
  $('roomTemp').value=p.room;
  $('fridgeTemp').value=p.fridge;
  $('flourType').value=p.flourType||'caputoPizzeria';
  if(p.flourW!=null)$('flourW').value=p.flourW; else $('flourW').value='';
  if(p.avpn)$('finalDoughTemp').value='';
  if(p.stoneTemp!=null)$('stoneTemp').value=p.stoneTemp;
  $('autolyse').checked=p.autolyse;
  // Expliciete default: zonder deze regel bleef 'praktisch afronden' uit staan
  // nadat de AVPN-preset hem had uitgezet.
  $('practical').checked=p.practical!==false;
  $('autoSauceFromPizzas').checked=true;
  ensurePizzaSelections();
  exactOverride={h:p.h,s:p.s,o:p.o,ySelected:presetYeastSelected};
  $('ballWeight').value=recommendedBallWeight(p.diameter);
  suppressCustom=false;
  // Een programmatische presetwissel kan in tests of toekomstige modulaire UI
  // plaatsvinden terwijl een getalveld focus houdt. Laat leegmaken daarna de
  // nieuw zichtbare presetwaarde herstellen, niet de waarde van vóór de wissel.
  const activeField=document.activeElement;
  if(activeField?.type==='number')rememberNumericEditStart(activeField);
  update();
}

function markCustom(clearExact=true){
  if(suppressCustom)return;
  $('preset').value='custom';
  if(clearExact) exactOverride=null;
}

// Alleen het bewerkte percentageveld verliest zijn exacte presetwaarde.
function markCustomField(id){
  if(suppressCustom)return;
  $('preset').value='custom';
  const key=EXACT_FIELDS[id];
  if(key && exactOverride) delete exactOverride[key];
}

function refreshFermentationUI(){
  const base=$('fermentationMethod').value;
  const coldMode=$('coldStorageMode').value||'bulk';
  const usingCold=base!=='room';

  $('coldStorageMode').disabled=!usingCold;
  $('coldStorageModeWrap').classList.toggle('disabled-control',!usingCold);
  $('coldStorageHint').classList.toggle('hidden',!usingCold);

  $('bulkLabel').textContent=L('Bulk buiten (uur)','Bulk at room temp (hours)');
  if(!usingCold){
    $('coldLabel').textContent=L('Geen koelkast','No refrigerator');
    $('ballLabel').textContent=L('Bolrijs buiten (uur)','Dough-ball proof at room temp (hours)');
    $('coldHours').disabled=true;
  }else if(coldMode==='balls'){
    $('coldLabel').textContent=L('Koelkast als bollen (uur)','Refrigerator as dough balls (hours)');
    $('ballLabel').textContent=L('Laatste opwarming buiten (uur)','Final warm-up at room temp (hours)');
    $('coldHours').disabled=false;
  }else{
    $('coldLabel').textContent=L('Koelkast als één massa (uur)','Refrigerator as one mass (hours)');
    $('ballLabel').textContent=L('Bolrijs buiten (uur)','Dough-ball proof at room temp (hours)');
    $('coldHours').disabled=false;
  }
}


