'use strict';
const {test,expect}=require('playwright/test');
for(const path of ['/index.html','/src/index.html'])test.describe(`v2 evening ${path}`,()=>{
  async function open(page){await page.goto(path);await expect(page.locator('#eveningPlan h2')).toContainText('4');}
  async function start(page){await page.locator('#eveningPlan [data-evening-action="start"]').click();await expect(page.locator('#kitchenWorkspace')).toContainText('Mengen, rusten en kneden');}
  async function unknownThroughProof(page){
    await page.locator('#kitchenHistory summary').click();
    for(const key of ['bulkStart','fridgeIn','fridgeOut'])await page.locator(`[data-evening-action="unknown-event"][data-key="${key}"]`).click();
  }
  for(const width of [320,390,430,760,1024,1280])test(`Plan and Kitchen fit in Dutch/English at ${width}px`,async({page})=>{
    const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width,height:900});await open(page);
    await expect(page.locator('#page1')).toHaveClass(/active/);await expect(page.locator('#appVersion')).toHaveText('v2.0.0');
    for(const lang of ['nl','en']){
      await page.locator(lang==='nl'?'#langNl':'#langEn').click();
      await expect(page.locator('#eveningPlan')).toBeVisible();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    }
    await page.locator('#langNl').click();await start(page);
    await page.locator('[data-evening-action="event-now"]').focus();await page.keyboard.press('Enter');
    expect(await page.evaluate(()=>WorkflowCore.eventDone(activeBatch(),'bulkStart'))).toBe(true);
    await page.locator('#kitchenHistory summary').click();await page.locator('#queueDetails summary').click();
    for(const lang of ['nl','en']){
      await page.locator(lang==='nl'?'#langNl':'#langEn').click();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
      await page.screenshot({path:test.info().outputPath(`kitchen-${width}-${lang}.png`),fullPage:true});
    }
    expect(errors).toEqual([]);
  });
  test('split runs retain independent checkpoints, allocations and measurements across reload',async({page})=>{
    await open(page);await page.locator('#pizzas').fill('8');await page.locator('#pizzas').blur();
    await page.locator('#eveningSplitDetails summary').click();await page.locator('#splitCapacity').fill('900');await page.locator('#splitCapacity').blur();
    await expect(page.locator('#eveningSplitDetails')).toContainText('4 + 4');await start(page);
    await page.locator('#kitchenDoughTemp').fill('25');await page.locator('#kitchenDoughTemp').blur();
    await page.locator('[data-evening-action="event-now"]').click();
    await page.locator('[data-evening-action="start-run"]').click();await page.locator('#kitchenDoughTemp').fill('23');await page.locator('#kitchenDoughTemp').blur();
    const before=await page.evaluate(()=>({ids:activeEvening().runs.map(r=>r.id),temps:activeEvening().runs.map(r=>r.batch.measurements.doughTemp),events:activeEvening().runs.map(r=>r.batch.events),yeast:calc().yeast}));
    expect(before.temps).toEqual([25,23]);expect(before.events[0].bulkStart).toBeGreaterThan(0);expect(before.events[1].bulkStart).toBeUndefined();
    await page.reload();await expect(page.locator('#kitchenWorkspace')).toContainText('Beurt 2/2');
    expect(await page.evaluate(()=>({ids:activeEvening().runs.map(r=>r.id),temps:activeEvening().runs.map(r=>r.batch.measurements.doughTemp),events:activeEvening().runs.map(r=>r.batch.events),yeast:calc().yeast}))).toEqual(before);
    await page.locator('[data-evening-action="select-run"]').first().click();await expect(page.locator('#kitchenDoughTemp')).toHaveCount(0);
  });
  test('unknown history, correction and undo never invent times or discard measurements',async({page})=>{
    await open(page);await start(page);await page.locator('#kitchenDoughTemp').fill('25');await page.locator('#kitchenDoughTemp').blur();
    await unknownThroughProof(page);
    expect(await page.evaluate(()=>({unknown:activeBatch().unknownEvents,temp:activeBatch().measurements.doughTemp,proposal:batchProposal().reason}))).toEqual({unknown:['bulkStart','fridgeIn','fridgeOut'],temp:25,proposal:'unknown-history'});
    await page.locator('[data-evening-action="undo"]').click();
    expect(await page.evaluate(()=>({unknown:activeBatch().unknownEvents,temp:activeBatch().measurements.doughTemp}))).toEqual({unknown:['bulkStart','fridgeIn'],temp:25});
    await page.reload();expect(await page.evaluate(()=>activeBatch().events.fridgeIn)).toBeUndefined();await expect(page.locator('#kitchenWorkspace')).toContainText('Tijd onbekend');
  });
  test('pizza queue keeps names, toppings and first launch linked and preserves unbaked pizzas',async({page})=>{
    await open(page);await page.evaluate(()=>{pizzaSelections=['parmaBurrata','margherita','marinara','diavola'];pizzaCustomizations=[];update();});await start(page);await unknownThroughProof(page);
    await page.locator('#queueDetails summary').click();await page.locator('[data-pizza-name]').nth(1).fill('Sam');await page.locator('[data-pizza-name]').nth(1).blur();
    await page.locator('[data-evening-action="pizza-up"]').nth(1).click();
    const first=await page.evaluate(()=>activeEvening().pizzas[0]);expect(first.name).toBe('Sam');expect(first.recipeId).toBe('margherita');
    await page.locator('[data-evening-action="pizza-in"]').click();
    expect(await page.evaluate(()=>activeBatch().events.bake)).toBe(await page.evaluate(()=>activeEvening().pizzas[0].events.in));
    await page.locator('[data-evening-action="pizza-out"]').click();await expect(page.locator('.pizza-finishing')).toContainText('Sam');
    await page.locator('[data-evening-action="pizza-in"]').click();await page.locator('[data-evening-action="pizza-out"]').click();
    await expect(page.locator('.pizza-finishing')).toContainText('Na het bakken');await expect(page.locator('.pizza-finishing')).toContainText('Parma');
    await page.reload();await expect(page.locator('.pizza-finishing')).toContainText('Parma');
    await page.locator('[data-evening-action="finish"]').click();expect(await page.evaluate(()=>evenings.history.at(-1).pizzas.filter(p=>p.events.out==null).length)).toBe(2);
  });
  test('templates clear history while private backup restore preserves the running evening exactly',async({page})=>{
    await open(page);await page.locator('#eveningCollectionDetails summary').click();await page.locator('#eveningTemplateName').fill('Friday');await page.locator('[data-evening-action="save-template"]').click();
    await start(page);await unknownThroughProof(page);
    const backup=await page.evaluate(()=>({format:'pizza-private-backup',version:1,createdAt:Date.now(),state:stateSnapshot()}));
    await page.locator('[data-workspace="plan"]').click();await page.locator('#eveningCollectionDetails summary').click();
    await page.locator('#eveningImportFile').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});
    await expect(page.locator('.restore-preview')).toContainText('lopende avond');
    await page.locator('[data-evening-action="confirm-import"]').click();
    expect(await page.evaluate(()=>activeBatch().unknownEvents)).toEqual(['bulkStart','fridgeIn','fridgeOut']);
    await page.locator('[data-evening-action="finish"]').click();await page.locator('#eveningCollectionDetails summary').click();await page.locator('[data-evening-action="load-template"]').click();
    expect(await page.evaluate(()=>({active:activeEvening(),date:evenings.draft.date,events:evenings.draft.pizzas.map(p=>p.events),measurements:liveMeasurements}))).toEqual({active:null,date:'',events:[{},{},{},{}],measurements:{doughTemp:null,fridgeTemp:null}});
  });
  test('invalid and future backups leave storage unchanged, including under quota failure',async({page})=>{
    await open(page);await page.locator('#eveningCollectionDetails summary').click();await page.evaluate(()=>saveState());
    const before=await page.evaluate(()=>localStorage.getItem(SAVE_KEY));
    await page.locator('#eveningImportFile').setInputFiles({name:'future.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({format:'pizza-private-backup',version:99}))});
    await expect(page.locator('#eveningPlan [role="status"]')).toContainText('niets vervangen');
    expect(await page.evaluate(()=>localStorage.getItem(SAVE_KEY))).toBe(before);
  });
  test('a second tab cannot overwrite events and takes over only after the writer closes',async({page,context})=>{
    await open(page);await start(page);await page.locator('[data-evening-action="event-now"]').click();
    const second=await context.newPage();await second.goto(path);await expect(second.locator('#storageOwnerNotice')).toBeVisible();
    const before=await page.evaluate(()=>localStorage.getItem(SAVE_KEY));
    expect(await second.evaluate(()=>saveState())).toBe(false);expect(await page.evaluate(()=>localStorage.getItem(SAVE_KEY))).toBe(before);
    await page.close();await second.reload();await expect(second.locator('#storageOwnerNotice')).toHaveCount(0);expect(await second.evaluate(()=>activeBatch().events.bulkStart)).toBeGreaterThan(0);await second.close();
  });
  test('fixed date stays fixed and availability alternatives require explicit application',async({page})=>{
    await page.clock.install({time:new Date('2026-09-22T08:00:00Z')});await open(page);
    await page.locator('#eveningDateDetails summary').click();await page.locator('#eveningBakeDate').fill('2026-09-25T18:30');await page.locator('#eveningBakeDate').blur();
    const target=await page.evaluate(()=>selectedBakeDate().getTime());await page.locator('#eveningEarliest').fill('2026-09-24T19:00');await page.locator('#eveningEarliest').blur();
    await expect(page.locator('#eveningDateDetails')).toContainText('vóór je vroegste start');expect(await page.evaluate(()=>selectedBakeDate().getTime())).toBe(target);
    await page.clock.fastForward(24*3600000);expect(await page.evaluate(()=>selectedBakeDate().getTime())).toBe(target);
  });
});
