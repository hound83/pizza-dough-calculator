// Omrekening tussen gistsoorten, uitgedrukt als factor op de IDY-massa.
// ADY is merk- en productspecifiek: fabrikanten adviseren grofweg van 1:1
// tot circa 1,25× ten opzichte van instant gist. De calculator gebruikt
// 1,25× als voorzichtige praktische default; fabrikantadvies gaat voor.
// Voor AVPN blijft de officiële regel droog = 1/3 van vers leidend.
const yeastTypes={
  idy:{name:'Instant droge gist',nameEn:'Instant dry yeast',short:'IDY',mult:1},
  ady:{name:'Actieve droge gist',nameEn:'Active dry yeast',short:'ADY',mult:1.25},
  fresh:{name:'Verse gist',nameEn:'Fresh yeast',short:'vers',shortEn:'fresh',mult:3.0}
};
function yeastName(key){const y=yeastTypes[key]||yeastTypes.idy;return currentLang==='en'?(y.nameEn||y.name):y.name;}
function yeastShort(key){const y=yeastTypes[key]||yeastTypes.idy;return currentLang==='en'?(y.shortEn||y.short):y.short;}
function sauceName(key){const x=sauces[key];if(!x)return '';return currentLang==='en'?(x.nameEn||x.name):x.name;}
function sauceDesc(key){const x=sauces[key];if(!x)return '';return currentLang==='en'?(x.descEn||x.desc):x.desc;}

const doughStyles={
  neapolitan:{name:'Napolitaans',factor:250/(Math.PI*16*16)},
  avpn:{name:'AVPN middenprofiel',factor:240/(Math.PI*14.25*14.25)},
  canotto:{name:'Canotto',factor:0.335},
  ny:{name:'New York',factor:0.275},
  thin:{name:'Dun / krokant',factor:0.245}
};


function stoneProfile(temp){
  const t=clamp(temp,180,520);
  let time,turn,oilLow,oilHigh,note;
  if(t<270){time='6–10 min';turn=L('eenmaal rond halverwege','once around halfway');oilLow=2;oilHigh=3;note=L('Lange bak. De korst wordt eerder krokant/broodachtig dan klassiek Napolitaans.','Long bake. The crust turns crisp/bready rather than classic Neapolitan.');}
  else if(t<300){time='5–7 min';turn=L('eenmaal rond halverwege','once around halfway');oilLow=1.5;oilHigh=2.5;note=L('Geschikt voor een gewone oven; wat olie helpt met kleur en malsheid.','Suitable for a normal oven; some oil helps with colour and tenderness.');}
  else if(t<330){time='4–6 min';turn='1×';oilLow=1;oilHigh=2;note=L('Middellange bak. Olie kan nog duidelijk helpen met bruining.','Medium bake. Oil still clearly helps with browning.');}
  else if(t<360){time='3–4 min';turn='1–2×';oilLow=.5;oilHigh=1.5;note=L('Snellere bak; gebruik olie vooral als je een zachtere/NY-achtige korst wilt.','Faster bake; use oil mainly if you want a softer, NY-style crust.');}
  else if(t<390){time='2–3 min';turn=L('regelmatig','regularly');oilLow=.5;oilHigh=1;note=L('Vrij heet. Voor Napolitaanse stijl wordt olie steeds minder nodig.','Fairly hot. For Neapolitan style, oil becomes less and less necessary.');}
  else if(t<420){time='90–150 sec';turn=L('elke 25–35 sec','every 25–35 sec');oilLow=0;oilHigh=.5;note=L('Zeer geschikt voor lichte Italiaanse pizza’s; weinig tot geen olie nodig.','Well suited to light Italian pizzas; little to no oil needed.');}
  else if(t<450){time='60–100 sec';turn=L('elke 20–30 sec','every 20–30 sec');oilLow=0;oilHigh=0;note=L('Napolitaans bereik. Olie in het deeg is doorgaans niet nodig.','Neapolitan range. Oil in the dough is usually unnecessary.');}
  else {time='50–80 sec';turn=L('zeer regelmatig','very regularly');oilLow=0;oilHigh=0;note=L('Extreem heet. Let extra op verbrande bodem en toppings; bovenwarmte/vlam moet hierbij passen.','Extremely hot. Watch for a burnt base and toppings; top heat/flame must match.');}
  // Numerieke baktijd zodat de tijdlijn kan rekenen met meerdere pizza's achter elkaar.
  const secs={'6–10 min':[360,600],'5–7 min':[300,420],'4–6 min':[240,360],'3–4 min':[180,240],
              '2–3 min':[120,180],'90–150 sec':[90,150],'60–100 sec':[60,100],'50–80 sec':[50,80]}[time]||[90,150];
  return {temp:t,time,turn,oilLow,oilHigh,note,secLow:secs[0],secHigh:secs[1],targetOil:roundTo((oilLow+oilHigh)/2,.5)};
}

const recipeTemps={
  amatriciana:{low:420,high:450,note:'Guanciale en pecorino houden van kort en heet; het vet rendert snel uit.'},
  gricia:{low:410,high:440,note:'Zonder tomaat droogt de bodem sneller uit; iets minder heet dan Amatriciana.'},
  pancettaScamorza:{low:410,high:440,note:'Scamorza smelt traag; iets meer tijd helpt hem doorlopen.'},
  cottoProvola:{low:420,high:450,note:'Gekookte ham is al gaar; kort en heet houdt hem sappig.'},
  salameProvola:{low:420,high:450,note:'Dun gesneden salami krult mooi op bij hoog vuur.'},
  salsicciaCipolla:{low:395,high:425,note:'Rauwe worst en ui hebben iets meer tijd nodig; verkruimel de worst klein.'},
  porchettaProvola:{low:410,high:440,note:'Porchetta is voorgegaard; te heet maakt hem droog.'},
  polpette:{low:395,high:425,note:'Gehaktballetjes moeten doorwarmen; houd ze klein of gaar ze voor.'},
  raguParmigiano:{low:410,high:440,note:'Dikke ragù is al gaar; vooral doorwarmen en de bodem droog houden.'},
  salsicciaPatate:{low:385,high:415,note:'Aardappel en rauwe worst vragen de langste baktijd van deze bibliotheek.'},
  patateRosmarino:{low:380,high:410,note:'Aardappel gaart niet in 90 seconden; snijd flinterdun of gaar voor.'},
  taleggioSalsiccia:{low:400,high:430,note:'Taleggio wordt snel vloeibaar; matig vuur voorkomt een plas.'},
  cottoBurrata:{low:425,high:455,note:'Burrata gaat pas ná het bakken op de pizza; de bodem mag heet en snel.'},
  pancettaPecorino:{low:420,high:450,note:'Pancetta rendert snel uit; pecorino niet te lang blootstellen.'},
  caprese:{low:430,high:460,note:'Verse tomaat en basilicum grotendeels na het bakken; korte, hete bak.'},
  biancaProsciutto:{low:430,high:460,note:'Prosciutto gaat na het bakken erop; de witte bodem mag kort en heet.'},
  calabrese:{low:420,high:450,note:'Pittige salami en \'nduja smelten snel uit bij hoog vuur.'},
  siciliana:{low:420,high:450,note:'Ansjovis, olijven en kappertjes zijn zout; kort bakken houdt ze fris.'},
  romana:{low:420,high:450,note:'Klassiek Napolitaans profiel met ansjovis; hoog vuur werkt goed.'},
  ricottaSalame:{low:410,high:440,note:'Ricotta droogt uit bij extreem vuur; iets gematigder is beter.'},
  ricottaNduja:{low:415,high:445,note:'\'Nduja smelt uit in de ricotta; net iets heter mag.'},
  gorgonzolaPera:{low:395,high:425,note:'Peer geeft vocht af en verbrandt snel aan de randen.'},
  tartufoSalsiccia:{low:400,high:430,note:'Truffel verliest aroma bij extreme hitte; voeg truffelcrème liefst na het bakken toe.'},
  margherita:{low:420,high:450,note:'Lichte klassieke topping; hoog vuur werkt uitstekend.'},
  marinara:{low:430,high:460,note:'Geen kaas, dus kan relatief heet en snel.'},
  margheritaExtra:{low:400,high:430,note:'Buffelmozzarella is vochtiger; iets rustiger helpt.'},
  napoletana:{low:410,high:440,note:'Ansjovis en kappertjes verdragen hitte goed, maar laat ze niet uitdrogen.'},
  diavola:{low:400,high:430,note:'Salami kleurt en vet snel; iets lager dan een pure Margherita is prettig.'},
  prosciuttoFunghi:{low:390,high:420,note:'Meer en vochtiger beleg; geef de topping iets meer tijd.'},
  quattroFormaggi:{low:380,high:410,note:'Veel kaas kan bij zeer hoge hitte snel verbranden of splitsen.'},
  capricciosa:{low:380,high:410,note:'Relatief zware topping; iets langere bak is meestal mooier.'},
  quattroStagioni:{low:380,high:410,note:'Veel verschillende toppings; iets lager geeft gelijkmatiger resultaat.'},
  ortolana:{low:390,high:420,note:'Voorgegaarde/gegrilde groenten werken goed in dit bereik.'},
  salsicciaFriarielli:{low:390,high:420,note:'Gebruik voorgegaarde of zeer kleine stukjes worst bij korte baktijden.'},
  tonnoCipolla:{low:390,high:420,note:'Tonijn droogt snel uit; niet onnodig heet bakken.'},
  parmigiana:{low:390,high:420,note:'Aubergine is al gaar; middelheet houdt kaas en topping in balans.'},
  mortadella:{low:420,high:450,note:'De rijke toppings gaan na het bakken erop, dus de basis mag heet en snel.'},
  nduja:{low:410,high:440,note:"'Nduja bakt snel; burrata gaat na het bakken erop."},
  prosciuttoCrudo:{low:420,high:450,note:'Parmaham, rucola en Parmezaan gaan na het bakken erop; de basis kan heet en snel.'},
  prosciuttoCrudoSimple:{low:420,high:450,note:'Parmaham gaat na het bakken erop, dus de tomaat/kaasbasis kan heet en snel.'},
  burrataPomodoro:{low:420,high:450,note:'Burrata gaat na het bakken erop; de basis kan relatief heet worden gebakken.'},
  speckGorgonzola:{low:390,high:420,note:'Gorgonzola vraagt iets meer rust; speck en walnoot gaan na het bakken erop.'},
  salameFunghi:{low:390,high:420,note:'Champignons bevatten vocht en salami kleurt snel; iets rustiger bakken werkt beter.'},
  carbonara:{low:390,high:420,note:'Bak de basis iets rustiger; eidooier en harde kaas pas na het bakken.'},
  cacioPepe:{low:390,high:420,note:'Veel harde kaas; iets lager voorkomt verbranden en splitsen.'},
  cinqueFormaggi:{low:370,high:400,note:'Zeer kaasrijk; lagere steentemperatuur geeft de kazen meer tijd zonder verbranden.'},
  quattroFormaggiRosso:{low:380,high:410,note:'Veel kaas; iets rustiger dan Margherita bakken.'},
  salsicciaGorgonzola:{low:380,high:410,note:'Worst plus veel kaas vraagt een iets langere, rustigere bak.'},
  diavolaGorgonzola:{low:390,high:420,note:'Salami en Gorgonzola kleuren snel.'},
  parmaBurrata:{low:420,high:450,note:'Parmaham en burrata gaan na het bakken erop, dus de basis kan heet en snel.'},
  bresaolaRucola:{low:420,high:450,note:'Bresaola, rucola en Parmezaan gaan na het bakken erop.'},
  taleggioSpeck:{low:390,high:420,note:'Taleggio is rijk; speck gaat na het bakken erop.'},
  gorgonzolaNduja:{low:390,high:420,note:'Vet en kaasrijk beleg; iets rustiger bakken.'},
  pestoMortadella:{low:410,high:440,note:'Gebruik pesto dun; mortadella en stracciatella gaan na het bakken erop.'},
  pestoParmaBurrata:{low:410,high:440,note:'Rijke toppings gaan na het bakken erop; basis kan relatief heet.'},
  tartufoProsciutto:{low:420,high:450,note:'Truffel en Parmaham pas na het bakken voor maximaal aroma.'},
  funghi:{low:390,high:420,note:'Champignons geven vocht af; iets rustiger bakken helpt.'},
  boscaiola:{low:380,high:410,note:'Worst en champignons vragen wat meer tijd dan een lichte Margherita.'},
  salsicciaFunghi:{low:380,high:410,note:'Worst plus champignons: iets rustiger bakken voor goede garing.'},
  speckFunghi:{low:390,high:420,note:'Champignons bakken mee; speck gaat pas na het bakken erop.'},
  parmaFunghi:{low:390,high:420,note:'Champignons bakken mee; Parmaham pas na het bakken.'},
  gorgonzolaFunghi:{low:380,high:410,note:'Gorgonzola en champignons zijn rijk en vochtig; bak iets rustiger.'},
  porciniTaleggio:{low:380,high:410,note:'Porcini en Taleggio profiteren van een iets langere, rustigere bak.'},
  porciniSalsiccia:{low:380,high:410,note:'Porcini plus worst vraagt meer tijd dan een lichte pizza.'},
  quattroFormaggiFunghi:{low:370,high:400,note:'Veel kaas plus champignons; lagere steentemperatuur voorkomt verbranden.'},
  tartufoFunghi:{low:390,high:420,note:'Champignons bakken mee; truffelcrème pas na het bakken.'},
  salami:{low:400,high:430,note:'Salami kleurt snel; middelheet tot heet werkt goed.'},
  pepperoni:{low:390,high:420,note:'Pepperoni geeft vet af en kleurt snel; iets rustiger bakken.'},
  hawaii:{low:380,high:410,note:'Ananas bevat vocht; goed uitlekken en iets rustiger bakken.'},
  prosciuttoCotto:{low:400,high:430,note:'Ham en mozzarella kunnen goed op een middelhete tot hete steen.'},
  quattroFormaggiPiccante:{low:370,high:400,note:'Veel kaas plus ’nduja: rustiger bakken voorkomt verbranden en vet afscheiden.'},
  quattroFormaggiSalame:{low:370,high:400,note:'Veel kaas en salami vragen een wat langere, rustigere bak.'},
  quattroFormaggiProsciutto:{low:380,high:410,note:'Parmaham gaat na het bakken erop; de kaasbasis vraagt iets meer tijd.'},
  quattroFormaggiSalsiccia:{low:370,high:400,note:'Veel kaas plus worst: lager en langer voor gelijkmatige garing.'},
  quattroFormaggiNduja:{low:370,high:400,note:'Veel kaas en ’nduja zijn rijk; rustig bakken werkt het best.'},
  quattroFormaggiAffumicata:{low:380,high:410,note:'Rijke smeltkazen; iets rustiger dan een Margherita.'},
  quattroFormaggiTaleggio:{low:380,high:410,note:'Taleggio is zeer romig; middelhoge steentemperatuur werkt mooi.'},
  quattroFormaggiPecorino:{low:380,high:410,note:'Harde kaas kan snel kleuren; bak iets rustiger.'},
  tonno:{low:390,high:420,note:'Tonijn droogt snel uit; middelheet werkt beter dan extreem heet.'},
  tonnoOlive:{low:390,high:420,note:'Tonijn droogt snel; olijven kunnen gewoon mee bakken.'},
  tonnoCapperi:{low:390,high:420,note:'Tonijn droogt snel; kappertjes zijn al krachtig van smaak.'},
  tonnoPiccante:{low:390,high:420,note:'Tonijn en ui profiteren van een iets rustigere bak.'},
  tonnoGorgonzola:{low:380,high:410,note:'Tonijn plus Gorgonzola is rijk; iets lager houdt de kaas mooier.'},
  tonnoMais:{low:380,high:410,note:'Mais en tonijn bevatten vocht; goed uitlekken en rustiger bakken.'},
  salmoneRucola:{low:410,high:440,note:'Zalm en rucola gaan na het bakken erop; de basis mag relatief heet.'},
  gamberiAglio:{low:380,high:410,note:'Gebruik voorgegaarde garnalen; voorkom uitdrogen met een iets rustigere bak.'},
  fruttiMare:{low:370,high:400,note:'Zeevruchten geven vocht af; lager en iets langer werkt beter.'},
  sardineCipolla:{low:390,high:420,note:'Sardines zijn al gaar; ui moet vooral zacht worden.'},
  acciugheOlive:{low:400,high:430,note:'Ansjovis hoeft niet lang te garen; middelheet tot heet is prima.'},
  polloFunghiWhite:{low:380,high:410,note:'Romige saus, kip en champignons vragen iets meer tijd en rustiger vuur.'},
  bbqChicken:{low:380,high:410,note:'BBQ-saus bevat suiker en kleurt snel; bak rustiger dan een Margherita.'},
  bbqChickenPancetta:{low:375,high:405,note:'BBQ-saus en pancetta kleuren snel; iets lager voorkomt verbranden.'}
};

function recipeTempFor(id){return recipeTemps[id]||{low:400,high:430,note:'Algemeen Italiaans bereik.'};}
function selectedRecipeTempAdvice(){
  ensurePizzaSelections();
  const rows=pizzaSelections.map((id,i)=>({i:i+1,id,r:recipeById(id),...recipeTempFor(id)}));
  const commonLow=Math.max(...rows.map(x=>x.low));
  const commonHigh=Math.min(...rows.map(x=>x.high));
  let suggested,hasCommon=commonLow<=commonHigh;
  if(hasCommon) suggested=roundTo((commonLow+commonHigh)/2,5);
  else suggested=roundTo(rows.reduce((a,x)=>a+(x.low+x.high)/2,0)/rows.length,5);
  return {rows,commonLow,commonHigh,hasCommon,suggested};
}

const presets={
  avpnMid:{
    name:'AVPN • 28,5 cm • 58,8% • 18 uur',
    h:58.823529411765,s:2.941176470588,yIdy:0.030392156863,ySelected:0.091176470588,yeastType:'fresh',o:0,
    pizzas:4,diameter:28.5,style:'avpn',fermentation:'room',bulk:2,cold:0,ball:16,
    room:19,fridge:4,autolyse:false,practical:false,flourW:285,flourType:'custom',stoneTemp:405,avpn:true
  },
  kodaNight:{
    name:'Mijn standaardrecept • 30 cm • 63% • 25 uur',
    h:63,s:18/600*100,yIdy:0.17,o:0,
    pizzas:4,diameter:30,style:'neapolitan',fermentation:'hybrid',bulk:1,cold:20,ball:4,
    room:21,fridge:4,autolyse:true,flourType:'caputoPizzeria'
  },
  sameDay:{
    name:'Napolitaans • 32 cm • 63% • 8 uur',
    h:63,s:2.5,yIdy:0.12,o:0,
    pizzas:4,diameter:32,style:'neapolitan',fermentation:'room',bulk:2,cold:0,ball:6,
    room:21,fridge:4,autolyse:false
  },
  cold48:{
    name:'Napolitaans • 32 cm • 65% • 48 uur',
    h:65,s:3,yIdy:0.15,o:0,
    pizzas:4,diameter:32,style:'neapolitan',fermentation:'hybrid',bulk:1,cold:43,ball:4,
    room:21,fridge:4,autolyse:true
  },
  cold72:{
    name:'Napolitaans • 32 cm • 65% • 72 uur',
    h:65,s:3,yIdy:0.13,o:0,
    pizzas:4,diameter:32,style:'neapolitan',fermentation:'hybrid',bulk:1,cold:67,ball:4,
    room:21,fridge:4,autolyse:true
  },
  canotto:{
    name:'Canotto • 32 cm • 68% • 25 uur',
    h:68,s:3,yIdy:0.18,o:0,
    pizzas:4,diameter:32,style:'canotto',fermentation:'hybrid',bulk:1,cold:20,ball:4,
    room:21,fridge:4,autolyse:true
  },
  home24:{
    name:'New York • 32 cm • 65% • 25 uur',
    h:65,s:2.5,yIdy:0.17,o:2,
    pizzas:4,diameter:32,style:'ny',fermentation:'hybrid',bulk:1,cold:20,ball:4,
    room:21,fridge:4,autolyse:false
  }
};

const sauces={
  sanMarzano:{
    name:'San Marzano crudo',nameEn:'San Marzano crudo',perPizza:80,tomato:true,cooked:false,
    desc:'Ongekookt. Tomaten met de hand fijnknijpen.',
    descEn:'Uncooked. Crush the tomatoes by hand.',
    ingredients:(batch,p)=>[
      ['San Marzano gepelde tomaten',`${fmt(batch,0)} g`],
      ['Fijn zeezout',`${fmt(batch*0.01,1)} g`],
      ['Basilicum',`${p}–${Math.ceil(p*1.5)} ${L('blaadjes','leaves')}`],
      ['EVOO',L('optioneel, klein scheutje','optional, small drizzle')]
    ]
  },
  marinara:{
    name:'Marinara',nameEn:'Marinara',perPizza:80,tomato:true,cooked:false,
    desc:'Ongekookte tomatenbasis met knoflook en oregano.',
    descEn:'Uncooked tomato base with garlic and oregano.',
    ingredients:(batch,p)=>[
      ['San Marzano tomaten',`${fmt(batch,0)} g`],
      ['Fijn zeezout',`${fmt(batch*0.01,1)} g`],
      ['Knoflook',`${Math.max(1,Math.ceil(batch/250))} ${L('teen/tenen','clove(s)')}`],
      ['Gedroogde oregano',`${fmt(batch*0.002,1)} g`],
      ['EVOO',`${fmt(batch*0.015,1)} g`]
    ]
  },
  ny:{
    name:'New York tomatensaus',nameEn:'New York tomato sauce',perPizza:90,tomato:true,cooked:true,yield:0.75,
    desc:'Kort gekookte, iets krachtigere tomatensaus.',
    descEn:'Briefly cooked, slightly richer tomato sauce.',
    ingredients:(batch,p)=>[
      ['Tomaten',`${fmt(batch,0)} g`],
      ['Zout',`${fmt(batch*0.012,1)} g`],
      ['EVOO',`${fmt(batch*0.02,1)} g`],
      ['Oregano',`${fmt(batch*0.0025,1)} g`],
      ['Knoflook',`${Math.max(1,Math.ceil(batch/300))} ${L('teen/tenen','clove(s)')}`],
      ['Suiker',L('optioneel, alleen indien de tomaten zuur zijn','optional, only if the tomatoes are sharp')]
    ]
  },
  bianca:{
    name:'Bianca • olijfolie (traditioneler)',nameEn:'Bianca • olive oil (more traditional)',perPizza:5,tomato:false,cooked:false,
    desc:'Traditionelere witte basis zonder saus: alleen een dun laagje extra vierge olijfolie.',
    descEn:'More traditional white base with no sauce: just a thin layer of extra virgin olive oil.',
    ingredients:(batch,p)=>[
      ['Extra vierge olijfolie',`${fmt(batch,0)} g`],
      ['Fijn zout',L('heel licht, naar smaak','very light, to taste')]
    ]
  },
  white:{
    name:'Romige witte saus • crème fraîche',nameEn:'Creamy white sauce • crème fraîche',perPizza:65,tomato:false,cooked:false,
    desc:'Romige, minder traditionele witte pizzabasis met crème fraîche. Dun aanbrengen; vooral geschikt voor aardappel, kip, kaas en groenten.',
    descEn:'Creamy, less traditional white pizza base with crème fraîche. Spread thinly; especially good with potato, chicken, cheese and vegetables.',
    ingredients:(batch,p)=>[
      ['Crème fraîche',`${fmt(batch*0.88,0)} g`],
      ['Parmigiano Reggiano',`${fmt(batch*0.10,0)} g`],
      ['Knoflook',`${Math.max(1,Math.ceil(batch/300))} ${L('teen/tenen','clove(s)')}`],
      ['Fijn zout',L('heel licht, naar smaak','very light, to taste')],
      ['Zwarte peper',L('naar smaak','to taste')]
    ]
  },
  bbq:{
    name:'BBQ-saus',nameEn:'BBQ sauce',perPizza:55,tomato:false,cooked:false,
    desc:'Dunne laag BBQ-saus; gebruik wat minder dan tomatensaus omdat deze zoeter en geconcentreerder is.',
    descEn:'Thin layer of BBQ sauce; use a little less than tomato sauce because it is sweeter and more concentrated.',
    ingredients:(batch,p)=>[
      ['BBQ-saus',`${fmt(batch,0)} g`]
    ]
  },
  pesto:{
    name:'Pesto-basis',nameEn:'Pesto base',perPizza:30,tomato:false,cooked:false,
    desc:'Dunne pestolaag; voeg bij zeer hete pizzaovens liever een deel na het bakken toe.',
    descEn:'Thin layer of pesto; with very hot pizza ovens, add part of it after baking.',
    ingredients:(batch,p)=>[
      ['Pesto',`${fmt(batch,0)} g`]
    ]
  }
};

const pizzaRecipes=[
  {id:'margherita',name:'Margherita',tag:'Traditioneel',sauce:'sanMarzano',sauceG:80,
   items:[['Fior di latte (mozzarella)',85,'g'],['Parmigiano Reggiano (optioneel)',6,'g'],['Basilicum',3,'blaadjes'],['EVOO',5,'g']],
   note:'Tomaat, fior di latte (mozzarella), basilicum en olijfolie. Een klein beetje geraspte Parmigiano is optioneel en kan in de ingrediëntenpicker worden uitgevinkt.'},
  {id:'marinara',name:'Marinara',tag:'Traditioneel',sauce:'marinara',sauceG:80,
   items:[['Knoflook',1,'teen'],['Oregano',0.5,'g'],['EVOO',5,'g']],
   note:'Zonder kaas. Simpel, uitgesproken en klassiek.'},
  {id:'margheritaExtra',name:'Margherita Extra / Bufalina',tag:'Traditioneel',sauce:'sanMarzano',sauceG:80,
   items:[['Mozzarella di bufala',95,'g'],['Parmigiano Reggiano (optioneel)',6,'g'],['Basilicum',3,'blaadjes'],['EVOO',5,'g']],
   note:'Variant met mozzarella di bufala. Laat de buffelmozzarella zeer goed uitlekken; Parmigiano is optioneel.'},
  {id:'napoletana',name:'Napoletana met ansjovis & kappertjes',nameEn:'Napoletana with anchovies & capers',tag:'Klassiek Italiaans',tagEn:'Classic Italian',sauce:'sanMarzano',sauceG:80,
   items:[['Fior di latte (mozzarella)',75,'g'],['Ansjovis',15,'g'],['Kappertjes',8,'g'],['Oregano',0.4,'g'],['EVOO',4,'g']],
   note:'Zout beleg, dus wees terughoudend met extra zout.'},
  {id:'diavola',name:'Diavola',tag:'Klassiek',sauce:'sanMarzano',sauceG:80,
   items:[['Fior di latte (mozzarella)',80,'g'],['Pittige salami',50,'g'],['EVOO',3,'g']],
   note:'Gebruik dun gesneden pittige salami.'},
  {id:'prosciuttoFunghi',name:'Prosciutto e Funghi',tag:'Klassiek',sauce:'sanMarzano',sauceG:80,
   items:[['Fior di latte (mozzarella)',80,'g'],['Gekookte ham',50,'g'],['Champignons',50,'g'],['EVOO',3,'g']],
   note:'Snijd champignons dun zodat ze snel garen.'},
  {id:'quattroFormaggi',name:'Quattro Formaggi',tag:'Klassiek',sauce:'bianca',sauceG:5,
   items:[['Fior di latte (mozzarella)',55,'g'],['Gorgonzola',30,'g'],['Provolone',25,'g'],['Parmigiano Reggiano',15,'g']],
   note:'Witte pizza; kazen variëren per streek en pizzeria.'},
  {id:'capricciosa',name:'Capricciosa',tag:'Klassiek',sauce:'sanMarzano',sauceG:75,
   items:[['Fior di latte (mozzarella)',70,'g'],['Gekookte ham',35,'g'],['Champignons',35,'g'],['Artisjok',35,'g'],['Olijven',20,'g'],['EVOO',3,'g']],
   note:'Klassieke combinatie; regionale uitvoeringen verschillen.'},
  {id:'quattroStagioni',name:'Quattro Stagioni',tag:'Klassiek',sauce:'sanMarzano',sauceG:75,
   items:[['Fior di latte (mozzarella)',70,'g'],['Ham',30,'g'],['Champignons',30,'g'],['Artisjok',30,'g'],['Olijven',15,'g']],
   note:'Verdeel de toppings in vier duidelijke kwarten.'},
  {id:'ortolana',name:'Ortolana',tag:'Klassiek',sauce:'sanMarzano',sauceG:70,
   items:[['Fior di latte (mozzarella)',70,'g'],['Aubergine',35,'g'],['Courgette',35,'g'],['Paprika',35,'g'],['EVOO',4,'g']],
   note:'Groenten vooraf licht grillen helpt tegen overtollig vocht.'},
  {id:'salsicciaFriarielli',name:'Salsiccia e Friarielli',tag:'Napolitaanse klassieker',sauce:'bianca',sauceG:5,
   items:[['Provola of fior di latte',75,'g'],['Italiaanse worst',70,'g'],['Friarielli',60,'g'],['EVOO',3,'g']],
   note:'Geen tomaat. Een echte Campania-combinatie. Gebruik bij een zeer korte bak bij voorkeur voorgegaarde worst of heel kleine stukjes.'},
  {id:'tonnoCipolla',name:'Tonno e Cipolla (Tonijn & Ui)',tag:'Italiaanse klassieker',sauce:'sanMarzano',sauceG:75,
   items:[['Fior di latte (mozzarella)',70,'g'],['Tonijn, uitgelekt',60,'g'],['Rode ui',30,'g'],['EVOO',3,'g']],
   note:'Snijd de ui zeer dun.'},
  {id:'parmigiana',name:'Parmigiana',tag:'Klassiek',sauce:'sanMarzano',sauceG:75,
   items:[['Fior di latte (mozzarella)',70,'g'],['Aubergine, gegrild/gebakken',60,'g'],['Parmigiano Reggiano',15,'g'],['Basilicum',3,'blaadjes'],['EVOO',3,'g']],
   note:'Geïnspireerd op melanzane alla parmigiana.'},
  {id:'mortadella',name:'Mortadella, Pistacchio & Stracciatella',tag:'Modern Italiaans',sauce:'bianca',sauceG:5,
   items:[['Fior di latte (mozzarella)',65,'g'],['Mortadella',60,'g'],['Stracciatella',50,'g'],['Pistache',10,'g']],
   after:['Mortadella','Stracciatella','Pistache'],
   note:'Mortadella, stracciatella en pistache pas na het bakken.'},
  {id:'nduja',name:"'Nduja & Burrata",tag:'Modern Italiaans',tagEn:'Modern Italian',sauce:'sanMarzano',sauceG:70,
   items:[['Fior di latte (mozzarella)',60,'g'],["'Nduja",30,'g'],['Burrata',60,'g'],['Basilicum',2,'blaadjes']],
   after:['Burrata','Basilicum'],
   note:"Burrata pas na het bakken; 'nduja in kleine dotjes verdelen.",noteEn:"Add the burrata after baking; distribute the 'nduja in small dollops."},

  {id:'prosciuttoCrudo',name:'Prosciutto Crudo e Rucola',tag:'Italiaanse klassieker',sauce:'sanMarzano',sauceG:75,
   items:[['Fior di latte (mozzarella)',75,'g'],['Prosciutto crudo / Parmaham',55,'g'],['Rucola',20,'g'],['Parmigiano Reggiano',12,'g'],['EVOO',3,'g']],
   after:['Prosciutto crudo / Parmaham','Rucola','Parmigiano Reggiano'],
   note:'Tomatensaus + kaas als basis; Parmaham, rucola en Parmezaan pas na het bakken.'},

  {id:'prosciuttoCrudoSimple',name:'Prosciutto Crudo',tag:'Klassiek',sauce:'sanMarzano',sauceG:80,
   items:[['Fior di latte (mozzarella)',80,'g'],['Prosciutto crudo / Parmaham',60,'g'],['Basilicum',2,'blaadjes'],['EVOO',3,'g']],
   after:['Prosciutto crudo / Parmaham','Basilicum'],
   note:'Eenvoudig: tomaat, mozzarella en Parmaham. Ham na het bakken voor de beste textuur.'},

  {id:'burrataPomodoro',name:'Burrata & Pomodoro',tag:'Modern Italiaans',sauce:'sanMarzano',sauceG:75,
   items:[['Fior di latte (mozzarella)',50,'g'],['Burrata',70,'g'],['Basilicum',3,'blaadjes'],['Parmigiano Reggiano',10,'g'],['EVOO',4,'g']],
   after:['Burrata','Basilicum'],
   note:'Burrata na het bakken toevoegen zodat hij romig blijft.'},

  {id:'speckGorgonzola',name:'Speck & Gorgonzola',tag:'Noord-Italiaans',sauce:'bianca',sauceG:5,
   items:[['Fior di latte (mozzarella)',60,'g'],['Gorgonzola',35,'g'],['Speck',50,'g'],['Walnoot',10,'g']],
   after:['Speck','Walnoot'],
   note:'Witte pizza. Speck en walnoot liefst na het bakken toevoegen.'},

  {id:'salameFunghi',name:'Salame e Funghi',tag:'Klassiek',sauce:'sanMarzano',sauceG:75,
   items:[['Fior di latte (mozzarella)',75,'g'],['Salami',45,'g'],['Champignons',45,'g'],['EVOO',3,'g']],
   note:'Een eenvoudige klassieke combinatie met tomaat, kaas, salami en champignons.'},

  {id:'carbonara',name:'Carbonara',tag:'Modern Romeins',sauce:'bianca',sauceG:5,
   items:[['Fior di latte (mozzarella)',55,'g'],['Guanciale',45,'g'],['Pecorino Romano',22,'g'],['Eidooier',1,'stuk'],['Zwarte peper',0.5,'g']],
   after:['Eidooier','Pecorino Romano','Zwarte peper'],
   note:'Witte pizza geïnspireerd op carbonara. Eidooier, Pecorino en peper na het bakken toevoegen.'},

  {id:'amatriciana',name:'Amatriciana',tag:'Modern Romeins',sauce:'sanMarzano',sauceG:75,
   items:[['Fior di latte (mozzarella)',55,'g'],['Guanciale',50,'g'],['Pecorino Romano',18,'g'],['Chilivlokken',0.3,'g']],
   after:['Pecorino Romano'],
   note:'Tomaat, guanciale en Pecorino; geïnspireerd op pasta all’amatriciana.'},

  {id:'gricia',name:'Gricia',tag:'Modern Romeins',sauce:'bianca',sauceG:5,
   items:[['Fior di latte (mozzarella)',55,'g'],['Guanciale',50,'g'],['Pecorino Romano',22,'g'],['Zwarte peper',0.5,'g']],
   after:['Pecorino Romano','Zwarte peper'],
   note:'Witte pizza met guanciale, Pecorino en zwarte peper.'},

  {id:'cacioPepe',name:'Cacio e Pepe',tag:'Modern Romeins',sauce:'bianca',sauceG:5,
   items:[['Fior di latte (mozzarella)',55,'g'],['Pecorino Romano',35,'g'],['Parmigiano Reggiano',12,'g'],['Zwarte peper',0.8,'g']],
   after:['Pecorino Romano','Parmigiano Reggiano','Zwarte peper'],
   note:'Zeer kaasgericht; een deel van de harde kaas na het bakken houdt hem romiger.'},

  {id:'salsicciaGorgonzola',name:'Salsiccia & Gorgonzola',tag:'Rijk Italiaans',sauce:'bianca',sauceG:5,
   items:[['Fior di latte (mozzarella)',55,'g'],['Italiaanse worst',65,'g'],['Gorgonzola',35,'g'],['Parmigiano Reggiano',10,'g']],
   note:'Rijke witte pizza met worst en blauwe kaas.'},

  {id:'diavolaGorgonzola',name:'Diavola & Gorgonzola',tag:'Modern Italiaans',sauce:'sanMarzano',sauceG:70,
   items:[['Fior di latte (mozzarella)',60,'g'],['Pittige salami',45,'g'],['Gorgonzola',30,'g']],
   note:'Pittige salami en Gorgonzola; zwaar genoeg om iets rustiger te bakken.'},

  {id:'parmaBurrata',name:'Parmaham & Burrata',tag:'Modern Italiaans',sauce:'sanMarzano',sauceG:70,
   items:[['Fior di latte (mozzarella)',50,'g'],['Prosciutto crudo / Parmaham',60,'g'],['Burrata',70,'g'],['Parmigiano Reggiano',10,'g']],
   after:['Prosciutto crudo / Parmaham','Burrata','Parmigiano Reggiano'],
   note:'Tomaat en lichte mozzarella-basis; Parmaham en burrata na het bakken.'},

  {id:'bresaolaRucola',name:'Bresaola, Rucola & Parmigiano',tag:'Noord-Italiaans',sauce:'bianca',sauceG:5,
   items:[['Fior di latte (mozzarella)',60,'g'],['Bresaola',55,'g'],['Rucola',20,'g'],['Parmigiano Reggiano',15,'g'],['EVOO',3,'g']],
   after:['Bresaola','Rucola','Parmigiano Reggiano'],
   note:'Lichte witte basis; bresaola, rucola en Parmezaan na het bakken.'},

  {id:'pancettaScamorza',name:'Pancetta & Scamorza',tag:'Italiaans',sauce:'bianca',sauceG:5,
   items:[['Scamorza',75,'g'],['Pancetta',55,'g'],['Parmigiano Reggiano',10,'g']],
   note:'Rokerig en kaasrijk; scamorza geeft veel karakter.'},

  {id:'cottoProvola',name:'Prosciutto Cotto & Provola',tag:'Italiaans',sauce:'sanMarzano',sauceG:75,
   items:[['Provola',80,'g'],['Gekookte ham',55,'g'],['Parmigiano Reggiano',10,'g']],
   note:'Tomaat, gerookte/volle provola en gekookte ham.'},

  {id:'salameProvola',name:'Salame & Provola',tag:'Italiaans',sauce:'sanMarzano',sauceG:75,
   items:[['Provola',80,'g'],['Salami',50,'g'],['Parmigiano Reggiano',8,'g']],
   note:'Eenvoudig en stevig: tomaat, provola en salami.'},

  {id:'salsicciaCipolla',name:'Salsiccia e Cipolla',tag:'Italiaanse klassieker',sauce:'sanMarzano',sauceG:70,
   items:[['Fior di latte (mozzarella)',70,'g'],['Italiaanse worst',65,'g'],['Rode ui',30,'g']],
   note:'Worst en zeer dun gesneden ui. Gebruik bij zeer korte bak kleine of voorgegaarde stukjes worst.'},

  {id:'porchettaProvola',name:'Porchetta & Provola',tag:'Modern Italiaans',sauce:'bianca',sauceG:5,
   items:[['Provola',75,'g'],['Porchetta',70,'g'],['Parmigiano Reggiano',10,'g']],
   after:['Porchetta'],
   note:'Porchetta liefst pas na het bakken of alleen heel kort mee verwarmen.'},

  {id:'polpette',name:'Polpette & Parmigiano',tag:'Italiaans-Amerikaans',sauce:'ny',sauceG:85,
   items:[['Fior di latte (mozzarella)',70,'g'],['Kleine gehaktballetjes',70,'g'],['Parmigiano Reggiano',15,'g'],['Basilicum',2,'blaadjes']],
   note:'Gebruik volledig gegaarde kleine gehaktballetjes.'},

  {id:'raguParmigiano',name:'Ragù & Parmigiano',tag:'Modern Italiaans',sauce:'sanMarzano',sauceG:50,
   items:[['Fior di latte (mozzarella)',55,'g'],['Dik vleesragù',70,'g'],['Parmigiano Reggiano',18,'g']],
   after:['Parmigiano Reggiano'],
   note:'Gebruik een dikke, niet-waterige ragù zodat de bodem niet zompig wordt.'},

  {id:'salsicciaPatate',name:'Salsiccia e Patate',tag:'Italiaans',sauce:'white',sauceG:60,
   items:[['Fior di latte (mozzarella)',60,'g'],['Italiaanse worst',60,'g'],['Aardappel, dun voorgegaard',60,'g'],['Rozemarijn',0.5,'g']],
   note:'Aardappel dun snijden en vooraf garen; worst klein of voorgegaard.'},

  {id:'patateRosmarino',name:'Patate e Rosmarino',tag:'Italiaans',sauce:'white',sauceG:60,
   items:[['Fior di latte (mozzarella)',65,'g'],['Aardappel, dun voorgegaard',70,'g'],['Parmigiano Reggiano',12,'g'],['Rozemarijn',0.5,'g']],
   note:'Witte pizza met dunne voorgegaarde aardappel en rozemarijn.'},

  {id:'taleggioSpeck',name:'Taleggio & Speck',tag:'Noord-Italiaans',sauce:'bianca',sauceG:5,
   items:[['Fior di latte (mozzarella)',45,'g'],['Taleggio',45,'g'],['Speck',55,'g']],
   after:['Speck'],
   note:'Taleggio smelt zeer rijk; speck na het bakken voor betere textuur.'},

  {id:'taleggioSalsiccia',name:'Taleggio & Salsiccia',tag:'Noord-Italiaans',sauce:'bianca',sauceG:5,
   items:[['Fior di latte (mozzarella)',45,'g'],['Taleggio',45,'g'],['Italiaanse worst',60,'g']],
   note:'Volle kaas en worst; bak iets rustiger dan een Margherita.'},

  {id:'gorgonzolaNduja',name:"Gorgonzola & 'Nduja",tag:'Modern Italiaans',sauce:'sanMarzano',sauceG:65,
   items:[['Fior di latte (mozzarella)',50,'g'],['Gorgonzola',35,'g'],["'Nduja",30,'g']],
   note:'Pittig, vet en kaasrijk. Kleine dotjes ’nduja zijn genoeg.'},

  {id:'cottoBurrata',name:'Prosciutto Cotto & Burrata',tag:'Modern Italiaans',sauce:'sanMarzano',sauceG:70,
   items:[['Fior di latte (mozzarella)',50,'g'],['Gekookte ham',55,'g'],['Burrata',65,'g']],
   after:['Burrata'],
   note:'Gekookte ham kan mee bakken; burrata pas erna.'},

  {id:'pancettaPecorino',name:'Pancetta & Pecorino',tag:'Italiaans',sauce:'sanMarzano',sauceG:70,
   items:[['Fior di latte (mozzarella)',55,'g'],['Pancetta',55,'g'],['Pecorino Romano',20,'g'],['Zwarte peper',0.4,'g']],
   after:['Pecorino Romano','Zwarte peper'],
   note:'Zout en krachtig; voeg harde kaas na het bakken toe.'},

  {id:'caprese',name:'Caprese',tag:'Italiaans',sauce:'sanMarzano',sauceG:65,
   items:[['Fior di latte (mozzarella)',75,'g'],['Cherrytomaat',45,'g'],['Basilicum',4,'blaadjes'],['EVOO',4,'g']],
   after:['Basilicum'],
   note:'Fris en eenvoudig. Gebruik niet te veel verse tomaat vanwege vocht.'},

  {id:'biancaProsciutto',name:'Pizza Bianca con Prosciutto',tag:'Italiaans',sauce:'bianca',sauceG:5,
   items:[['Fior di latte (mozzarella)',75,'g'],['Prosciutto crudo / Parmaham',60,'g'],['Parmigiano Reggiano',12,'g']],
   after:['Prosciutto crudo / Parmaham','Parmigiano Reggiano'],
   note:'Witte kaasbasis met Parmaham en Parmezaan na het bakken.'},

  {id:'calabrese',name:'Calabrese',tag:'Zuid-Italiaans',sauce:'sanMarzano',sauceG:70,
   items:[['Fior di latte (mozzarella)',65,'g'],['Pittige salami',40,'g'],["'Nduja",20,'g'],['Olijven',15,'g']],
   note:'Pittige Zuid-Italiaanse stijl met salami en ’nduja.'},

  {id:'siciliana',name:'Siciliana',tag:'Zuid-Italiaans',sauce:'sanMarzano',sauceG:75,
   items:[['Fior di latte (mozzarella)',55,'g'],['Ansjovis',15,'g'],['Kappertjes',8,'g'],['Olijven',20,'g'],['Oregano',0.4,'g']],
   note:'Zout, hartig en aromatisch; wees zuinig met extra zout.'},

  {id:'romana',name:'Romana',tag:'Klassiek Italiaans',sauce:'sanMarzano',sauceG:75,
   items:[['Fior di latte (mozzarella)',70,'g'],['Ansjovis',15,'g'],['Kappertjes',8,'g'],['Oregano',0.4,'g']],
   note:'Een veelvoorkomende klassieke combinatie van tomaat, mozzarella, ansjovis en kappertjes.'},

  {id:'pestoMortadella',name:'Pesto, Mortadella & Stracciatella',tag:'Modern Italiaans',sauce:'pesto',sauceG:25,
   items:[['Fior di latte (mozzarella)',45,'g'],['Mortadella',60,'g'],['Stracciatella',50,'g'],['Pistache',10,'g']],
   after:['Mortadella','Stracciatella','Pistache'],
   note:'Pesto dun gebruiken; rijke toppings na het bakken.'},

  {id:'pestoParmaBurrata',name:'Pesto, Parmaham & Burrata',tag:'Modern Italiaans',sauce:'pesto',sauceG:25,
   items:[['Fior di latte (mozzarella)',40,'g'],['Prosciutto crudo / Parmaham',55,'g'],['Burrata',65,'g'],['Parmigiano Reggiano',10,'g']],
   after:['Prosciutto crudo / Parmaham','Burrata','Parmigiano Reggiano'],
   note:'Pesto als dunne basis, Parmaham en burrata na het bakken.'},

  {id:'ricottaSalame',name:'Ricotta & Salame',tag:'Italiaans',sauce:'sanMarzano',sauceG:70,
   items:[['Fior di latte (mozzarella)',50,'g'],['Ricotta',45,'g'],['Salami',45,'g'],['Parmigiano Reggiano',8,'g']],
   note:'Romige ricotta met salami; ricotta in kleine dotjes verdelen.'},

  {id:'ricottaNduja',name:"Ricotta & 'Nduja",tag:'Modern Italiaans',sauce:'sanMarzano',sauceG:65,
   items:[['Fior di latte (mozzarella)',45,'g'],['Ricotta',50,'g'],["'Nduja",30,'g'],['Parmigiano Reggiano',8,'g']],
   note:'Ricotta tempert de pittigheid van ’nduja.'},

  {id:'gorgonzolaPera',name:'Gorgonzola & Pera',tag:'Kaasgericht',sauce:'bianca',sauceG:5,
   items:[['Fior di latte (mozzarella)',45,'g'],['Gorgonzola',45,'g'],['Peer, dun gesneden',35,'g'],['Walnoot',10,'g']],
   after:['Walnoot'],
   note:'Zoet-hartig en kaasgericht. Gebruik peer zeer dun zodat hij niet te nat wordt.'},

  {id:'quattroFormaggiRosso',name:'Quattro Formaggi Rosso',tag:'Kaasgericht',sauce:'sanMarzano',sauceG:60,
   items:[['Fior di latte (mozzarella)',45,'g'],['Gorgonzola',25,'g'],['Provolone',20,'g'],['Parmigiano Reggiano',12,'g']],
   note:'Vier kazen met een lichte tomatenbasis.'},

  {id:'cinqueFormaggi',name:'Cinque Formaggi',tag:'Kaasgericht',sauce:'bianca',sauceG:5,
   items:[['Fior di latte (mozzarella)',40,'g'],['Gorgonzola',22,'g'],['Taleggio',22,'g'],['Provolone',18,'g'],['Parmigiano Reggiano',12,'g']],
   note:'Zeer kaasrijk. Houd de totale hoeveelheid beheerst zodat hij goed bakt.'},

  {id:'tartufoProsciutto',name:'Tartufo & Prosciutto Crudo',tag:'Modern Italiaans',sauce:'bianca',sauceG:5,
   items:[['Fior di latte (mozzarella)',65,'g'],['Prosciutto crudo / Parmaham',55,'g'],['Parmigiano Reggiano',12,'g'],['Truffelcrème',12,'g']],
   after:['Prosciutto crudo / Parmaham','Parmigiano Reggiano','Truffelcrème'],
   note:'Truffelcrème en Parmaham na het bakken voor het meeste aroma.'},

  {id:'tartufoSalsiccia',name:'Tartufo & Salsiccia',tag:'Modern Italiaans',sauce:'bianca',sauceG:5,
   items:[['Fior di latte (mozzarella)',60,'g'],['Italiaanse worst',60,'g'],['Parmigiano Reggiano',12,'g'],['Truffelcrème',10,'g']],
   after:['Parmigiano Reggiano','Truffelcrème'],
   note:'Worst en truffel; truffelcrème pas na het bakken toevoegen.'},

  {id:'funghi',name:'Funghi',tag:'Klassiek',sauce:'sanMarzano',sauceG:75,
   items:[['Fior di latte (mozzarella)',80,'g'],['Champignons',60,'g'],['Parmigiano Reggiano',8,'g'],['EVOO',3,'g']],
   note:'Eenvoudige klassieke pizza met tomaat, mozzarella en champignons.'},

  {id:'boscaiola',name:'Boscaiola',tag:'Klassiek Italiaans',sauce:'bianca',sauceG:5,
   items:[['Fior di latte (mozzarella)',65,'g'],['Italiaanse worst',55,'g'],['Champignons',55,'g'],['Parmigiano Reggiano',10,'g']],
   note:'Witte pizza met worst en champignons; een bekende hartige combinatie.'},

  {id:'salsicciaFunghi',name:'Salsiccia e Funghi',tag:'Klassiek Italiaans',sauce:'sanMarzano',sauceG:70,
   items:[['Fior di latte (mozzarella)',70,'g'],['Italiaanse worst',60,'g'],['Champignons',50,'g'],['Parmigiano Reggiano',8,'g']],
   note:'Tomaat, mozzarella, worst en champignons.'},

  {id:'speckFunghi',name:'Speck e Funghi',tag:'Noord-Italiaans',sauce:'bianca',sauceG:5,
   items:[['Fior di latte (mozzarella)',65,'g'],['Speck',50,'g'],['Champignons',50,'g'],['Parmigiano Reggiano',10,'g']],
   after:['Speck'],
   note:'Champignons bakken mee; speck pas na het bakken voor betere textuur.'},

  {id:'parmaFunghi',name:'Prosciutto Crudo e Funghi',tag:'Italiaans',sauce:'sanMarzano',sauceG:70,
   items:[['Fior di latte (mozzarella)',70,'g'],['Champignons',45,'g'],['Prosciutto crudo / Parmaham',55,'g'],['Parmigiano Reggiano',10,'g']],
   after:['Prosciutto crudo / Parmaham','Parmigiano Reggiano'],
   note:'Champignons bakken mee; Parmaham en Parmezaan pas na het bakken.'},

  {id:'gorgonzolaFunghi',name:'Gorgonzola e Funghi',tag:'Kaasgericht',sauce:'bianca',sauceG:5,
   items:[['Fior di latte (mozzarella)',55,'g'],['Gorgonzola',35,'g'],['Champignons',50,'g'],['Parmigiano Reggiano',8,'g']],
   note:'Romige witte pizza met Gorgonzola en champignons.'},

  {id:'porciniTaleggio',name:'Porcini & Taleggio',tag:'Noord-Italiaans',sauce:'bianca',sauceG:5,
   items:[['Fior di latte (mozzarella)',45,'g'],['Taleggio',45,'g'],['Porcini / eekhoorntjesbrood',45,'g'],['Parmigiano Reggiano',10,'g']],
   note:'Aardse porcini met volle Taleggio; gebruik goed uitgelekte paddenstoelen.'},

  {id:'porciniSalsiccia',name:'Porcini & Salsiccia',tag:'Italiaans',sauce:'bianca',sauceG:5,
   items:[['Fior di latte (mozzarella)',55,'g'],['Porcini / eekhoorntjesbrood',45,'g'],['Italiaanse worst',60,'g'],['Parmigiano Reggiano',10,'g']],
   note:'Rijke witte pizza met porcini en worst.'},

  {id:'quattroFormaggiFunghi',name:'Quattro Formaggi e Funghi',tag:'Kaasgericht',sauce:'bianca',sauceG:5,
   items:[['Fior di latte (mozzarella)',40,'g'],['Gorgonzola',25,'g'],['Provolone',20,'g'],['Parmigiano Reggiano',12,'g'],['Champignons',40,'g']],
   note:'Vier kazen plus champignons; bak iets rustiger vanwege de totale toppingmassa.'},

  {id:'tartufoFunghi',name:'Tartufo e Funghi',tag:'Modern Italiaans',sauce:'bianca',sauceG:5,
   items:[['Fior di latte (mozzarella)',65,'g'],['Champignons',50,'g'],['Parmigiano Reggiano',12,'g'],['Truffelcrème',12,'g']],
   after:['Parmigiano Reggiano','Truffelcrème'],
   note:'Champignons bakken mee; truffelcrème en Parmezaan pas na het bakken.'},

  {id:'polloFunghiWhite',name:'Pollo & Funghi • romige witte saus',nameEn:'Chicken & Mushrooms • creamy white sauce',tag:'Modern Italiaans',tagEn:'Modern Italian',sauce:'white',sauceG:60,
   items:[['Fior di latte (mozzarella)',55,'g'],['Kip, voorgegaard',60,'g'],['Champignons',45,'g'],['Parmigiano Reggiano',10,'g']],
   note:'Niet traditioneel Napolitaans, maar een logische romige witte combinatie. Gebruik voorgegaarde kip en dun gesneden champignons.',noteEn:'Not traditional Neapolitan, but a logical creamy white combination. Use pre-cooked chicken and thinly sliced mushrooms.'},

  {id:'bbqChicken',name:'BBQ Chicken & Rode Ui',nameEn:'BBQ Chicken & Red Onion',tag:'NL / afhaal',tagEn:'Dutch / takeaway',sauce:'bbq',sauceG:55,
   items:[['Geraspte mozzarella / pizzakaas',75,'g'],['Kip, voorgegaard',65,'g'],['Rode ui',20,'g']],
   note:'Niet traditioneel Italiaans. Gebruik een dunne laag BBQ-saus en volledig voorgegaarde kip.',noteEn:'Not traditional Italian. Use a thin layer of BBQ sauce and fully pre-cooked chicken.'},

  {id:'bbqChickenPancetta',name:'BBQ Chicken & Pancetta',nameEn:'BBQ Chicken & Pancetta',tag:'NL / afhaal',tagEn:'Dutch / takeaway',sauce:'bbq',sauceG:50,
   items:[['Geraspte mozzarella / pizzakaas',70,'g'],['Kip, voorgegaard',55,'g'],['Pancetta',30,'g'],['Rode ui',15,'g']],
   note:'Rijk en niet-traditioneel; gebruik BBQ-saus dun omdat saus en pancetta snel kleuren.',noteEn:'Rich and non-traditional; use BBQ sauce sparingly because the sauce and pancetta brown quickly.'},

  {id:'salami',name:'Salami',tag:'Klassiek',sauce:'sanMarzano',sauceG:75,
   items:[['Fior di latte (mozzarella)',80,'g'],['Salami',50,'g'],['EVOO',3,'g']],
   note:'Eenvoudige publieksfavoriet met tomaat, mozzarella en salami.'},

  {id:'pepperoni',name:'Pepperoni',tag:'Italiaans-Amerikaans',sauce:'ny',sauceG:85,
   items:[['Fior di latte (mozzarella)',80,'g'],['Pepperoni',50,'g']],
   note:'Klassieke Italiaans-Amerikaanse combinatie met pittige pepperoni.'},

  {id:'hawaii',name:'Hawaii',tag:'Populair',sauce:'sanMarzano',sauceG:70,
   items:[['Fior di latte (mozzarella)',75,'g'],['Gekookte ham',50,'g'],['Ananas, goed uitgelekt',45,'g']],
   note:'Bekende combinatie met ham en ananas. Laat ananas zeer goed uitlekken vanwege vocht.'},

  {id:'prosciuttoCotto',name:'Prosciutto Cotto',tag:'Klassiek',sauce:'sanMarzano',sauceG:75,
   items:[['Fior di latte (mozzarella)',80,'g'],['Gekookte ham',55,'g'],['EVOO',3,'g']],
   note:'Klassieke pizza met tomaat, mozzarella en gekookte ham.'},

  {id:'quattroFormaggiPiccante',name:'Quattro Formaggi Piccante',tag:'Kaasgericht',sauce:'bianca',sauceG:5,
   items:[['Fior di latte (mozzarella)',40,'g'],['Gorgonzola',25,'g'],['Provolone',22,'g'],['Parmigiano Reggiano',12,'g'],["'Nduja",20,'g']],
   note:'Vier kazen met kleine dotjes pittige ’nduja.'},

  {id:'quattroFormaggiSalame',name:'Quattro Formaggi e Salame',tag:'Kaas & vlees',sauce:'sanMarzano',sauceG:55,
   items:[['Fior di latte (mozzarella)',38,'g'],['Gorgonzola',22,'g'],['Provolone',20,'g'],['Parmigiano Reggiano',10,'g'],['Salami',40,'g']],
   note:'Vier kazen met salami en een lichte tomatenbasis.'},

  {id:'quattroFormaggiProsciutto',name:'Quattro Formaggi e Prosciutto',tag:'Kaas & vlees',sauce:'sanMarzano',sauceG:55,
   items:[['Fior di latte (mozzarella)',38,'g'],['Gorgonzola',22,'g'],['Provolone',20,'g'],['Parmigiano Reggiano',10,'g'],['Prosciutto crudo / Parmaham',50,'g']],
   after:['Prosciutto crudo / Parmaham'],
   note:'Vier kazen met Parmaham; ham pas na het bakken toevoegen.'},

  {id:'quattroFormaggiSalsiccia',name:'Quattro Formaggi e Salsiccia',tag:'Kaas & vlees',sauce:'bianca',sauceG:5,
   items:[['Fior di latte (mozzarella)',38,'g'],['Gorgonzola',22,'g'],['Provolone',20,'g'],['Parmigiano Reggiano',10,'g'],['Italiaanse worst',50,'g']],
   note:'Rijke witte vierkazenpizza met Italiaanse worst.'},

  {id:'quattroFormaggiNduja',name:"Quattro Formaggi e 'Nduja",tag:'Kaas & pittig',sauce:'sanMarzano',sauceG:50,
   items:[['Fior di latte (mozzarella)',38,'g'],['Gorgonzola',22,'g'],['Provolone',20,'g'],['Parmigiano Reggiano',10,'g'],["'Nduja",22,'g']],
   note:'Vier kazen met pittige ’nduja; gebruik kleine dotjes.'},

  {id:'quattroFormaggiAffumicata',name:'Quattro Formaggi Affumicata',tag:'Kaasgericht',sauce:'bianca',sauceG:5,
   items:[['Scamorza Affumicata',35,'g'],['Fior di latte (mozzarella)',32,'g'],['Gorgonzola',22,'g'],['Parmigiano Reggiano',12,'g']],
   note:'Rokerige vierkazenvariant met gerookte scamorza.'},

  {id:'quattroFormaggiTaleggio',name:'Quattro Formaggi al Taleggio',tag:'Kaasgericht',sauce:'bianca',sauceG:5,
   items:[['Fior di latte (mozzarella)',35,'g'],['Taleggio',28,'g'],['Gorgonzola',20,'g'],['Parmigiano Reggiano',12,'g']],
   note:'Romige vierkazenvariant waarin Taleggio de hoofdrol krijgt.'},

  {id:'quattroFormaggiPecorino',name:'Quattro Formaggi con Pecorino',tag:'Kaasgericht',sauce:'bianca',sauceG:5,
   items:[['Fior di latte (mozzarella)',38,'g'],['Gorgonzola',22,'g'],['Provolone',20,'g'],['Pecorino Romano',14,'g']],
   note:'Zout-krachtige vierkazenvariant met Pecorino Romano.'},

  {id:'tonno',name:'Tonno / Tonijn',nameEn:'Tonno / Tuna',tag:'Populair',tagEn:'Popular',sauce:'sanMarzano',sauceG:75,
   items:[['Fior di latte (mozzarella)',70,'g'],['Tonijn, uitgelekt',65,'g'],['EVOO',3,'g']],
   note:'Eenvoudige tonijnpizza met tomaat, mozzarella en goed uitgelekte tonijn.'},

  {id:'tonnoOlive',name:'Tonno e Olive',tag:'Italiaans',sauce:'sanMarzano',sauceG:70,
   items:[['Fior di latte (mozzarella)',65,'g'],['Tonijn, uitgelekt',60,'g'],['Olijven',20,'g'],['EVOO',3,'g']],
   note:'Tonijn met olijven; zout en hartig, dus rustig met extra zout.'},

  {id:'tonnoCapperi',name:'Tonno e Capperi',tag:'Italiaans',sauce:'sanMarzano',sauceG:70,
   items:[['Fior di latte (mozzarella)',65,'g'],['Tonijn, uitgelekt',60,'g'],['Kappertjes',8,'g'],['EVOO',3,'g']],
   note:'Tonijn met kappertjes; fris-zout en eenvoudig.'},

  {id:'tonnoPiccante',name:'Tonno Piccante',tag:'Pittig',sauce:'sanMarzano',sauceG:70,
   items:[['Fior di latte (mozzarella)',65,'g'],['Tonijn, uitgelekt',60,'g'],['Rode ui',20,'g'],['Chilivlokken',0.4,'g'],['EVOO',3,'g']],
   note:'Pittige tonijnpizza met dunne rode ui en chilivlokken.'},

  {id:'tonnoGorgonzola',name:'Tonno & Gorgonzola',tag:'Kaas & vis',sauce:'sanMarzano',sauceG:60,
   items:[['Fior di latte (mozzarella)',45,'g'],['Tonijn, uitgelekt',55,'g'],['Gorgonzola',30,'g'],['Rode ui',15,'g']],
   note:'Krachtige combinatie van tonijn en Gorgonzola; gebruik een lichte tomatenbasis.'},

  {id:'tonnoMais',name:'Tonijn & Mais',tag:'NL / afhaal',sauce:'sanMarzano',sauceG:70,
   items:[['Fior di latte (mozzarella)',70,'g'],['Tonijn, uitgelekt',60,'g'],['Mais, uitgelekt',30,'g'],['Rode ui',20,'g']],
   note:'Bekende afhaalstijl-combinatie; laat tonijn en mais goed uitlekken.'},

  {id:'salmoneRucola',name:'Salmone Affumicato & Rucola',tag:'Modern Italiaans',sauce:'bianca',sauceG:5,
   items:[['Fior di latte (mozzarella)',55,'g'],['Gerookte zalm',55,'g'],['Rucola',20,'g'],['Parmigiano Reggiano',10,'g'],['EVOO',3,'g']],
   after:['Gerookte zalm','Rucola','Parmigiano Reggiano'],
   note:'Gerookte zalm en rucola pas na het bakken toevoegen.'},

  {id:'gamberiAglio',name:'Gamberi e Aglio',tag:'Vis',sauce:'sanMarzano',sauceG:65,
   items:[['Fior di latte (mozzarella)',55,'g'],['Garnalen, voorgegaard',65,'g'],['Knoflook',1,'teen'],['Peterselie',2,'g'],['EVOO',3,'g']],
   after:['Peterselie'],
   note:'Gebruik voorgegaarde, goed droge garnalen; voeg peterselie na het bakken toe.'},

  {id:'fruttiMare',name:'Frutti di Mare',tag:'Vis',sauce:'sanMarzano',sauceG:65,
   items:[['Fior di latte (mozzarella)',45,'g'],['Zeevruchtenmix, voorgegaard en droog',90,'g'],['Knoflook',1,'teen'],['Peterselie',2,'g'],['EVOO',3,'g']],
   after:['Peterselie'],
   note:'Gebruik voorgegaarde en goed uitgelekte zeevruchten om een natte bodem te voorkomen.'},

  {id:'sardineCipolla',name:'Sardine e Cipolla',tag:'Vis',sauce:'sanMarzano',sauceG:70,
   items:[['Fior di latte (mozzarella)',55,'g'],['Sardines, uitgelekt',45,'g'],['Rode ui',25,'g'],['Kappertjes',6,'g']],
   note:'Krachtige, zoute vispizza; ui zeer dun snijden.'},

  {id:'acciugheOlive',name:'Acciughe e Olive',tag:'Klassiek Italiaans',sauce:'sanMarzano',sauceG:75,
   items:[['Fior di latte (mozzarella)',60,'g'],['Ansjovis',15,'g'],['Olijven',20,'g'],['Kappertjes',6,'g'],['Oregano',0.3,'g']],
   note:'Klassieke zoute combinatie van ansjovis, olijven en kappertjes.'}
];

// Ingrediëntnamen en telbare eenheden worden meteen in de juiste taal
// gegenereerd. De MutationObserver kon ze niet vertalen omdat ze vaak midden
// in een langere zin staan en dus geen eigen tekstnode vormen.
const ITEM_EN={
  "Aardappel, dun voorgegaard":"Potato, thinly pre-cooked",
  "Ananas, goed uitgelekt":"Pineapple, well drained",
  "Ansjovis":"Anchovies",
  "Artisjok":"Artichoke",
  "Aubergine":"Aubergine",
  "Aubergine, gegrild/gebakken":"Aubergine, grilled/fried",
  "BBQ-saus":"BBQ sauce",
  "Basilicum":"Basil",
  "Bresaola":"Bresaola",
  "Burrata":"Burrata",
  "Champignons":"Mushrooms",
  "Cherrytomaat":"Cherry tomato",
  "Chilivlokken":"Chilli flakes",
  "Courgette":"Courgette",
  "Crème fraîche":"Crème fraîche",
  "Dik vleesragù":"Thick meat ragù",
  "EVOO":"EVOO",
  "Eidooier":"Egg yolk",
  "Extra vierge olijfolie":"Extra virgin olive oil",
  "Fijn zeezout":"Fine sea salt",
  "Fijn zout":"Fine salt",
  "Fior di latte (mozzarella)":"Fior di latte (mozzarella)",
  "Friarielli":"Friarielli",
  "Garnalen, voorgegaard":"Prawns, pre-cooked",
  "Gedroogde oregano":"Dried oregano",
  "Gekookte ham":"Cooked ham",
  "Geraspte mozzarella / pizzakaas":"Grated mozzarella / pizza cheese",
  "Gerookte zalm":"Smoked salmon",
  "Gorgonzola":"Gorgonzola",
  "Guanciale":"Guanciale",
  "Ham":"Ham",
  "Italiaanse worst":"Italian sausage",
  "Kappertjes":"Capers",
  "Kip, voorgegaard":"Chicken, pre-cooked",
  "Kleine gehaktballetjes":"Small meatballs",
  "Knoflook":"Garlic",
  "Mais, uitgelekt":"Sweetcorn, drained",
  "Mortadella":"Mortadella",
  "Mozzarella di bufala":"Mozzarella di bufala",
  "Olijven":"Olives",
  "Oregano":"Oregano",
  "Pancetta":"Pancetta",
  "Paprika":"Bell pepper",
  "Parmigiano Reggiano":"Parmigiano Reggiano",
  "Parmigiano Reggiano (optioneel)":"Parmigiano Reggiano (optional)",
  "Pecorino Romano":"Pecorino Romano",
  "Peer, dun gesneden":"Pear, thinly sliced",
  "Pepperoni":"Pepperoni",
  "Pesto":"Pesto",
  "Peterselie":"Parsley",
  "Pistache":"Pistachio",
  "Pittige salami":"Spicy salami",
  "Porchetta":"Porchetta",
  "Porcini / eekhoorntjesbrood":"Porcini",
  "Prosciutto crudo / Parmaham":"Prosciutto crudo / Parma ham",
  "Provola":"Provola",
  "Provola of fior di latte":"Provola or fior di latte",
  "Provolone":"Provolone",
  "Ricotta":"Ricotta",
  "Rode ui":"Red onion",
  "Rozemarijn":"Rosemary",
  "Rucola":"Rocket",
  "Salami":"Salami",
  "San Marzano gepelde tomaten":"San Marzano peeled tomatoes",
  "San Marzano tomaten":"San Marzano tomatoes",
  "Sardines, uitgelekt":"Sardines, drained",
  "Scamorza":"Scamorza",
  "Scamorza Affumicata":"Scamorza Affumicata",
  "Speck":"Speck",
  "Stracciatella":"Stracciatella",
  "Suiker":"Sugar",
  "Taleggio":"Taleggio",
  "Tomaten":"Tomatoes",
  "Tonijn, uitgelekt":"Tuna, drained",
  "Truffelcrème":"Truffle cream",
  "Walnoot":"Walnut",
  "Zeevruchtenmix, voorgegaard en droog":"Seafood mix, pre-cooked and dry",
  "Zout":"Salt",
  "Zwarte peper":"Black pepper"
};
function tItem(name){ return currentLang==='en' ? (ITEM_EN[name]||name) : name; }
// Tekst die in een langere zin terechtkomt wordt meteen in de juiste taal
// gegenereerd; achteraf vertalen per tekstnode knipt zinnen in stukken.
function L(nl,en){ return currentLang==='en' ? en : nl; }
function tUnit(unit,qty){
  if(currentLang!=='en') return unit;
  const one=Number(qty)===1;
  if(unit==='blaadjes') return one?'leaf':'leaves';
  if(unit==='teen') return one?'clove':'cloves';
  if(unit==='stuk') return one?'piece':'pieces';
  return unit;
}

function recipeById(id){return pizzaRecipes.find(r=>r.id===id)||pizzaRecipes[0];}

// Alle saustypes zijn nu ook per bol te kiezen. Witte saus, BBQ en NY-saus
// bestonden wel als object maar waren nergens bereikbaar.
const SAUCE_CHOICES=[
  {id:'sanMarzano',label:'🔴 Rood / San Marzano',labelEn:'🔴 Red / San Marzano',short:'🔴 Rood',shortEn:'🔴 Red'},
  {id:'marinara',  label:'🍅 Marinara',labelEn:'🍅 Marinara',short:'🍅 Marinara',shortEn:'🍅 Marinara'},
  {id:'ny',        label:'🗽 New York-saus',labelEn:'🗽 New York sauce',short:'🗽 NY',shortEn:'🗽 NY'},
  {id:'bianca',    label:'⚪ Bianca • olijfolie',labelEn:'⚪ Bianca • olive oil',short:'⚪ Bianca',shortEn:'⚪ Bianca'},
  {id:'white',     label:'🥛 Romige witte saus • crème fraîche',labelEn:'🥛 Creamy white sauce • crème fraîche',short:'🥛 Romig wit',shortEn:'🥛 Creamy white'},
  {id:'pesto',     label:'🌿 Pesto',labelEn:'🌿 Pesto',short:'🌿 Pesto',shortEn:'🌿 Pesto'},
  {id:'bbq',       label:'🍖 BBQ',labelEn:'🍖 BBQ',short:'🍖 BBQ',shortEn:'🍖 BBQ'}
];
