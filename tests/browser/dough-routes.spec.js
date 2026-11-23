'use strict';
const {test,expect}=require('playwright/test');

for(const {path,lang,width} of [
  {path:'/index.html',lang:'nl',width:390},
  {path:'/src/index.html',lang:'en',width:1024}
]){
  test.describe(`dough routes ${lang} ${width}px`,()=>{
    test.beforeEach(async({page})=>{
      await page.setViewportSize({width,height:840});
      await page.goto(path);
      await page.locator('[data-mode-card="dough"]').click();
      if(lang==='en')await page.locator('#langEn').click();
    });
    test('rest changes preparation, water and kitchen instructions, including after reload',async({page})=>{
      const before=await page.evaluate(()=>({water:solveMainWaterTemperature(calc()).water,prep:prepHours(),yeast:calc().yeast}));
      await page.locator('#autolyseMinutes').selectOption('60');
      await expect(page.locator('#scheduleSummary')).toContainText(lang==='nl'?'1 u 24 min':'1 h 24 min');
      const now=await page.evaluate(()=>({water:solveMainWaterTemperature(calc()).water,prep:prepHours(),yeast:calc().yeast}));
      expect(now.prep-before.prep).toBeCloseTo(.5);
      expect(now.water-before.water).toBeGreaterThan(6);
      expect(now.yeast).toBe(before.yeast);
      await page.locator('[data-workspace="kitchen"]').click();
      await expect(page.locator('[data-step-key="s-rest"].step-card')).toContainText(/60 min/);
      await page.reload();
      await expect(page.locator('html')).toHaveAttribute('data-app-ready','true');
      await expect(page.locator('#autolyseMinutes')).toHaveValue('60');
      await expect(page.locator('#restChoiceHint')).toContainText(lang==='nl'?'bloem en water':'flour and water');
    });
    test('express goes from plan to a saved first-ball check without an extra rest',async({page})=>{
      await page.locator('#preset').selectOption('express');
      await expect(page.locator('#restChoice')).toBeHidden();
      await expect(page.locator('#yeastAdviceDetail')).toContainText('Express');
      const recipe=await page.evaluate(()=>({y:calc().y,prep:prepHours(),cold:calc().cold,water:calc().mainWater,reserve:calc().reserve}));
      expect(recipe.y).toBeCloseTo(4/3);expect(recipe.cold).toBe(0);
      expect(recipe.prep).toBeLessThan(.3);expect(recipe.reserve).toBe(0);
      await page.locator('#eveningPlan [data-evening-action="start"]').click();
      const kitchen=page.locator('#stepsList');
      await expect(kitchen.locator('#step-check-s-rest')).toHaveCount(0);
      await expect(kitchen.locator('[data-step-key="s-bulk"].step-card')).toContainText('20–30');
      const tight=kitchen.locator('[data-ball-feel="tight"]');
      await tight.focus();await page.keyboard.press('Enter');
      await expect(kitchen.locator('#ballOpeningAdvice')).toContainText('10–15');
      await kitchen.locator('[data-ball-feel="again"]').click();
      const check=await page.evaluate(()=>activeBatch().openingCheck);
      expect(check.feel).toBe('tight');expect(check.checkAt).toBeGreaterThan(Date.now()+14*60000);
      await page.reload();await expect(tight).toHaveAttribute('aria-pressed','true');
      await expect(kitchen.locator('#ballOpeningAdvice')).toContainText(lang==='nl'?'Probeer opnieuw om':'Try again at');
      await kitchen.locator('[data-ball-feel="fragile"]').click();
      await expect(kitchen.locator('#ballOpeningAdvice')).toContainText(lang==='nl'?'kleiner':'smaller');
      await kitchen.locator('[data-ball-feel="ready"]').click();
      await kitchen.locator('[data-ball-feel="shape"]').click();
      await expect(kitchen.locator('#step-check-s-open')).toBeFocused();
      expect(await page.evaluate(()=>({yeast:calc().y,bake:activeBatch().events.bake??null,overflow:document.documentElement.scrollWidth>innerWidth}))).toEqual({yeast:recipe.y,bake:null,overflow:false});
    });
    test('a dough-only share retains Express preparation and omits the private kitchen setup',async({page})=>{
      await page.locator('#preset').selectOption('express');
      await page.locator('#experienceFull').click();
      await page.locator('#yeastType').selectOption('fresh');
      const shared=await page.evaluate(()=>{
        const payload=WorkflowCore.exportRecipe('Express',snapshotRecipe());
        return {decoded:decodeDoughLink(encodeDoughLink(payload)),json:JSON.stringify(payload)};
      });
      expect(shared.decoded.recipe.fields.mixRoute).toBe('express');
      expect(Number(shared.decoded.recipe.fields.yeastPct)).toBeCloseTo(4,2);
      expect(shared.json).not.toContain('openingCheck');
      expect(shared.json).not.toContain('bulkBoxes');
      await page.locator('#preset').selectOption('sameDay');
      await expect(page.locator('#routeHint')).toContainText('6');
      expect(await page.evaluate(()=>calc().yeastType)).toBe('idy');
    });
  });
}

test('bulk depth and actual box count are optional and change the thermal estimate',async({page})=>{
  await page.goto('/index.html');
  await page.locator('[data-mode-card="dough"]').click();
  await page.locator('#coldStorageDetails summary').click();
  const depth=page.locator('#storage-depth');
  await expect(depth).toHaveValue('');
  await page.locator('#coldHours').evaluate(input=>{input.value='2';input.dispatchEvent(new Event('change',{bubbles:true}));});
  const exit=()=>page.evaluate(()=>DoughCore.simulateFermentation(calc()).phases[1].coreEnd);
  const old=await exit();
  await page.locator('#storage-bulkBoxes').fill('2');await page.locator('#storage-bulkBoxes').blur();
  await expect.poll(exit).toBeLessThan(old);
  await depth.fill('3');await depth.blur();const shallow=await exit();
  await depth.fill('7');await depth.blur();await expect.poll(exit).toBeGreaterThan(shallow);
  await depth.fill('');await depth.blur();expect(await page.evaluate(()=>calc().storage.measuredDepth)).toBe(false);
  await expect(page.locator('#thermalWindow')).toContainText('18 °C');
  await page.locator('#workshopColdRoute').selectOption('balls');
  await expect(depth).toHaveCount(0);
});

test('schema 54 active evening with old recipe fields resumes at its original time',async({page})=>{
  await page.goto('/index.html');await page.locator('[data-mode-card="dough"]').click();
  await page.locator('#eveningPlan [data-evening-action="start"]').click();
  const previous=await page.evaluate(()=>{
    const state=stateSnapshot();state.version=54;
    delete state.mixRoute;delete state.autolyseMinutes;delete state.draftOpeningCheck;
    const evening=state.evenings.active;
    for(const recipe of [evening.recipe,evening.template.recipe,...evening.runs.map(r=>r.batch.recipe)]){
      delete recipe.fields.mixRoute;delete recipe.fields.autolyseMinutes;
    }
    for(const run of evening.runs)delete run.batch.openingCheck;
    localStorage.setItem('pizzaCalcV54',JSON.stringify(state));localStorage.removeItem(SAVE_KEY);
    return {start:evening.runs[0].batch.startedAt,yeast:calc().yeast,target:evening.bakeAt};
  });
  await page.reload();await expect(page.locator('html')).toHaveAttribute('data-app-ready','true');
  expect(await page.evaluate(()=>({start:activeBatch().startedAt,yeast:calc().yeast,target:activeEvening().bakeAt}))).toEqual(previous);
  expect(await page.evaluate(()=>({rest:activeBatch().recipe.fields.autolyseMinutes,legacy:localStorage.getItem('pizzaCalcV54')}))).toEqual({rest:'30',legacy:null});
});

test('a short deadline offers Express and retains pizza count and toppings',async({page})=>{
  await page.clock.install({time:new Date(2026,10,23,11)});
  await page.goto('/index.html');await page.locator('[data-mode-card="full"]').click();
  await page.locator('#pizzas').fill('7');await page.locator('#pizzas').blur();
  const ids=await page.evaluate(()=>{pizzaSelections[6]='marinara';update();return [...pizzaSelections];});
  await page.locator('#bakeDay').selectOption('0');await page.locator('#bakeTime').fill('13:00');
  await page.locator('#deadlineExpress').click();
  await expect(page.locator('#preset')).toHaveValue('express');await expect(page.locator('#pizzas')).toHaveValue('7');
  expect(await page.evaluate(()=>[...pizzaSelections])).toEqual(ids);
  await expect(page.locator('#bakeTime')).toHaveValue('13:00');
});
