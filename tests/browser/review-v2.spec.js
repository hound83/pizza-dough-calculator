'use strict';
const {test,expect}=require('playwright/test');

for(const path of ['/index.html','/src/index.html'])test.describe(`v2 review ${path}`,()=>{
  async function ready(page){await expect(page.locator('html')).toHaveAttribute('data-app-ready','true');}
  async function open(page){await page.goto(path);await ready(page);}
  async function start(page){await page.locator('#eveningPlan [data-evening-action="start"]').click();}
  async function nextUnknown(page){
    await page.waitForTimeout(550);
    await page.locator('[data-evening-action="unknown-event"]').click();
  }
  for(const touch of [false,true])test(`typing then one ${touch?'touch':'mouse'} action saves both the value and action`,async({browser})=>{
    const context=await browser.newContext({hasTouch:touch,viewport:{width:390,height:844}});
    const page=await context.newPage();
    try{
      await page.goto('http://127.0.0.1:4173'+path);await ready(page);await start(page);
      await page.locator('#kitchenDoughMeasurement > summary').click();
      await page.locator('#kitchenDoughTemp').pressSequentially('26');
      const transition=page.locator('[data-evening-action="event-now"]');
      if(touch)await transition.tap();else await transition.click();
      await expect(page.locator('#kitchenWorkspace h2')).toHaveText('Bulkrijs');
      expect(await page.evaluate(()=>activeBatch().measurements.doughTemp)).toBe(26);
      expect(await page.evaluate(()=>activeBatch().events.bulkStart)).toBeGreaterThan(0);
      await page.locator('#kitchenHistory > summary').click();await nextUnknown(page);await nextUnknown(page);
      await page.locator('#queueDetails > summary').click();
      const name=page.locator('[data-pizza-name]').first();await name.pressSequentially('Lyndsey');
      const launch=page.locator('[data-evening-action="pizza-in"]');
      await page.waitForTimeout(550);
      if(touch)await launch.tap();else await launch.click();
      await expect(page.locator('.pizza-current')).toContainText('Lyndsey');
      expect(await page.evaluate(()=>activeEvening().pizzas[0].events.in)).toBeGreaterThan(0);
      await page.reload();await ready(page);
      expect(await page.evaluate(()=>({name:activeEvening().pizzas[0].name,temp:activeBatch().measurements.doughTemp}))).toEqual({name:'Lyndsey',temp:26});
    }finally{await context.close();}
  });
  test('Basic has optional readings; Plan switches preserve recipe, readings and progress',async({page})=>{
    await open(page);await expect(page.locator('#experienceBasic')).toBeVisible();
    await start(page);await expect(page.locator('#kitchenDoughTemp')).toBeHidden();
    await expect(page.locator('#kitchenDoughMeasurement > summary')).toContainText('optioneel');
    const before=await page.evaluate(()=>({recipe:snapshotRecipe(),events:activeBatch().events,progress:completedSteps}));
    await page.locator('#kitchenDoughMeasurement > summary').click();await page.locator('#kitchenDoughTemp').fill('25');await page.locator('#kitchenDoughTemp').blur();
    await page.locator('[data-workspace="plan"]').click();await page.locator('#experienceFull').click();
    await page.locator('[data-workspace="kitchen"]').click();await expect(page.locator('#kitchenDoughTemp')).toBeVisible();await expect(page.locator('#kitchenDoughTemp')).toHaveValue('25');
    await page.locator('[data-workspace="plan"]').click();await page.locator('#experienceBasic').click();await page.locator('[data-workspace="kitchen"]').click();
    await expect(page.locator('#kitchenDoughTemp')).toBeHidden();await expect(page.locator('#kitchenDoughMeasurement > summary')).toContainText('25');
    expect(await page.evaluate(()=>({recipe:snapshotRecipe(),events:activeBatch().events,progress:completedSteps}))).toEqual(before);
    await page.locator('#kitchenInstructions > summary').click();
    await expect(page.locator('#stepDoughMeasurement')).toBeVisible();await expect(page.locator('#stepDoughMeasurement input')).toBeHidden();
    await expect(page.locator('#stepsList [data-step-key="s-doughtemp"]')).toHaveCount(0);
    await expect(page.locator('#stepFridgeMeasurement input')).toBeHidden();
    await page.locator('#langEn').click();await expect(page.locator('#kitchenDoughMeasurement > summary')).toContainText('optional');
    await expect(page.locator('#stepFridgeMeasurement > summary')).toContainText('optional');
    await page.reload();await ready(page);await expect(page.locator('#kitchenDoughTemp')).toBeHidden();
    expect(await page.evaluate(()=>liveMeasurementValue('doughTemp'))).toBe(25);
  });
  test('blank readings never block progress and unknown actions follow chronological order',async({page})=>{
    await open(page);await start(page);await page.locator('#kitchenHistory > summary').click();
    for(const key of ['bulkStart','fridgeIn','fridgeOut','bake']){
      await expect(page.locator('[data-evening-action="unknown-event"]')).toHaveCount(1);
      await expect(page.locator('[data-evening-action="unknown-event"]')).toHaveAttribute('data-key',key);
      await nextUnknown(page);
    }
    await expect(page.locator('[data-evening-action="unknown-event"]')).toHaveCount(0);
    expect(await page.evaluate(()=>activeBatch().measurements)).toMatchObject({doughTemp:null,fridgeTemp:null});
  });
  test('keyboard after typing and a canceled pointer leave controls usable',async({page})=>{
    await open(page);await start(page);await page.locator('#kitchenDoughMeasurement > summary').click();
    await page.locator('#kitchenDoughTemp').fill('24');await page.keyboard.press('Tab');
    await expect(page.locator('[data-evening-action="event-now"]')).toBeFocused();await page.keyboard.press('Enter');
    await expect(page.locator('#kitchenWorkspace h2')).toHaveText('Bulkrijs');
    await expect(page.locator('[data-evening-action="event-now"][data-key="fridgeIn"]')).toBeFocused();
    expect(await page.evaluate(()=>activeBatch().measurements.doughTemp)).toBe(24);
    await page.locator('[data-evening-action="event-now"]').dispatchEvent('pointerdown',{pointerId:1});
    await page.evaluate(()=>{eveningNotice='Canceled touch';renderKitchen(calc());});
    await page.locator('[data-evening-action="event-now"]').dispatchEvent('pointercancel',{pointerId:1});
    await expect(page.locator('#kitchenWorkspace')).toContainText('Canceled touch');
    await expect(page.locator('[data-evening-action="event-now"][data-key="fridgeIn"]')).toBeFocused();
    await page.waitForTimeout(550);await page.locator('[data-evening-action="event-now"]').click();
    await expect(page.locator('#kitchenWorkspace h2')).toHaveText('Koude fermentatie');
  });
  test('delayed ownership keeps startup inert and cannot save or remove legacy data early',async({page})=>{
    await page.addInitScript(()=>{
      localStorage.setItem('pizzaCalcV52',JSON.stringify({version:52,appMode:'dough',pizzas:'6',experienceMode:'basic'}));
      const request=navigator.locks.request.bind(navigator.locks);
      const gate=new Promise(resolve=>{window.releaseTestStartup=resolve;});
      navigator.locks.request=async(...args)=>{await gate;return request(...args);};
      window.testWrites=0;const set=Storage.prototype.setItem;
      Storage.prototype.setItem=function(key,value){if(key==='pizzaCalcV53')window.testWrites++;return set.call(this,key,value);};
    });
    await page.goto(path);
    await expect(page.locator('.app')).toHaveAttribute('inert','');await expect(page.locator('#startupStatus')).toBeVisible();
    await expect(page.locator('#page0')).toBeHidden();expect(await page.evaluate(()=>saveState())).toBe(false);
    expect(await page.evaluate(()=>({writes:window.testWrites,legacy:!!localStorage.getItem('pizzaCalcV52')}))).toEqual({writes:0,legacy:true});
    await page.evaluate(()=>window.releaseTestStartup());await ready(page);
    await expect(page.locator('.app')).not.toHaveAttribute('inert','');await expect(page.locator('#startupStatus')).toBeHidden();
    await expect(page.locator('#eveningMode')).toHaveValue('dough');await expect(page.locator('#pizzas')).toHaveValue('6');
    expect(await page.evaluate(()=>localStorage.getItem('pizzaCalcV52'))).toBeNull();
    await page.locator('#eveningMode').selectOption('full');await expect(page.locator('#eveningMode')).toHaveValue('full');
  });
  test('a delayed second tab cannot write before or after ownership denial',async({page,context})=>{
    await open(page);await start(page);const before=await page.evaluate(()=>{saveState();return localStorage.getItem(SAVE_KEY);});
    const second=await context.newPage();
    try{
      await second.addInitScript(()=>{
        const request=navigator.locks.request.bind(navigator.locks),gate=new Promise(resolve=>window.releaseTestStartup=resolve);
        navigator.locks.request=async(...args)=>{await gate;return request(...args);};
      });
      await second.goto(path);expect(await second.evaluate(()=>saveState())).toBe(false);
      expect(await page.evaluate(()=>localStorage.getItem(SAVE_KEY))).toBe(before);
      await second.evaluate(()=>window.releaseTestStartup());await ready(second);
      await expect(second.locator('#storageOwnerNotice')).toBeVisible();expect(await second.evaluate(()=>saveState())).toBe(false);
      expect(await page.evaluate(()=>localStorage.getItem(SAVE_KEY))).toBe(before);
    }finally{await second.close();}
  });
});
