'use strict';
const {test,expect}=require('playwright/test');
for(const path of ['/index.html','/src/index.html'])test.describe(`v2 evening ${path}`,()=>{
  async function open(page){await page.goto(path);await expect(page.locator('html')).toHaveAttribute('data-app-ready','true');await expect(page.locator('#eveningPlan h2')).toContainText('4');}
  async function expand(page,id){if(!await page.locator(id).evaluate(el=>el.open))await page.locator(`${id} > summary`).click();}
  async function action(page,name){await page.waitForTimeout(550);await page.locator(`[data-evening-action="${name}"]`).click();}
  async function start(page){await page.locator('#eveningPlan [data-evening-action="start"]').click();await expect(page.locator('#kitchenWorkspace')).toContainText('Mengen, rusten en kneden');}
  async function unknownThroughProof(page){
    await expand(page,'#kitchenHistory');
    for(const key of ['bulkStart','fridgeIn','fridgeOut']){await page.waitForTimeout(550);await page.locator(`[data-evening-action="unknown-event"][data-key="${key}"]`).click();}
  }
  for(const width of [320,390,430,760,1024,1280])test(`Plan and Kitchen fit in Dutch/English at ${width}px`,async({page})=>{
    const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width,height:900});await open(page);
    await expect(page.locator('#page1')).toHaveClass(/active/);await expect(page.locator('#appVersion')).toHaveText('v2.0.1');
    for(const lang of ['nl','en']){
      await page.locator(lang==='nl'?'#langNl':'#langEn').click();
      await expect(page.locator('#eveningPlan')).toBeVisible();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    }
    await page.locator('#langNl').click();await start(page);
    await page.locator('[data-evening-action="event-now"]').focus();await page.keyboard.press('Enter');
    expect(await page.evaluate(()=>WorkflowCore.eventDone(activeBatch(),'bulkStart'))).toBe(true);
    await expand(page,'#kitchenHistory');await expand(page,'#bakingWorkspace');await expand(page,'#queueDetails');
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
    await page.locator('#stepDoughMeasurement').evaluate(el=>el.open=true);await page.locator('#stepDoughTemp').fill('25');await page.locator('#stepDoughTemp').blur();
    await page.locator('[data-evening-action="event-now"]').click();
    await page.locator('[data-evening-action="start-run"]').click();await page.locator('#stepDoughMeasurement').evaluate(el=>el.open=true);await page.locator('#stepDoughTemp').fill('23');await page.locator('#stepDoughTemp').blur();
    const before=await page.evaluate(()=>({ids:activeEvening().runs.map(r=>r.id),temps:activeEvening().runs.map(r=>r.batch.measurements.doughTemp),events:activeEvening().runs.map(r=>r.batch.events),yeast:calc().yeast}));
    expect(before.temps).toEqual([25,23]);expect(before.events[0].bulkStart).toBeGreaterThan(0);expect(before.events[1].bulkStart).toBeUndefined();
    await page.reload();await expect(page.locator('html')).toHaveAttribute('data-app-ready','true');await expect(page.locator('#kitchenWorkspace')).toContainText('Beurt 2/2');
    expect(await page.evaluate(()=>({ids:activeEvening().runs.map(r=>r.id),temps:activeEvening().runs.map(r=>r.batch.measurements.doughTemp),events:activeEvening().runs.map(r=>r.batch.events),yeast:calc().yeast}))).toEqual(before);
    await page.locator('[data-evening-action="select-run"]').first().click();await expect(page.locator('#stepDoughTemp')).toHaveValue('25');
  });
  test('unknown history, correction and undo never invent times or discard measurements',async({page})=>{
    await open(page);await start(page);await page.locator('#stepDoughMeasurement').evaluate(el=>el.open=true);await page.locator('#stepDoughTemp').fill('25');
    // Repaint while still editing: native pending change state belongs to the old node.
    await page.evaluate(()=>{eveningNotice='Current phase refreshed';buildSteps(runCalculation(calc()));renderKitchen(calc());});
    await unknownThroughProof(page);
    expect(await page.evaluate(()=>({unknown:activeBatch().unknownEvents,temp:activeBatch().measurements.doughTemp,proposal:batchProposal().reason}))).toEqual({unknown:['bulkStart','fridgeIn','fridgeOut'],temp:25,proposal:'unknown-history'});
    await page.locator('[data-evening-action="undo"]').click();
    expect(await page.evaluate(()=>({unknown:activeBatch().unknownEvents,temp:activeBatch().measurements.doughTemp}))).toEqual({unknown:['bulkStart','fridgeIn'],temp:25});
    await page.reload();await expect(page.locator('html')).toHaveAttribute('data-app-ready','true');expect(await page.evaluate(()=>activeBatch().events.fridgeIn)).toBeUndefined();await expect(page.locator('#kitchenWorkspace')).toContainText('Tijd onbekend');
    await page.locator('[data-evening-action="finish"]').click();expect(await page.evaluate(()=>evenings.history.at(-1).runs[0].batch.measurements.doughTemp)).toBe(25);
  });
  test('pizza queue keeps names, toppings and first launch linked and preserves unbaked pizzas',async({page})=>{
    await open(page);await page.evaluate(()=>{pizzaSelections=['parmaBurrata','margherita','marinara','diavola'];pizzaCustomizations=[];update();});await start(page);await unknownThroughProof(page);
    await expand(page,'#bakingWorkspace');await expand(page,'#queueDetails');await page.locator('[data-pizza-name]').nth(1).fill('Sam');await page.locator('[data-pizza-name]').nth(1).blur();
    await page.locator('[data-evening-action="pizza-up"]').nth(1).click();
    expect(await page.locator('#bakingWorkspace').evaluate(el=>!!(el.compareDocumentPosition(document.getElementById('kitchenHistory'))&Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
    const first=await page.evaluate(()=>activeEvening().pizzas[0]);expect(first.name).toBe('Sam');expect(first.recipeId).toBe('margherita');
    await action(page,'pizza-in');
    expect(await page.evaluate(()=>activeBatch().events.bake)).toBe(await page.evaluate(()=>activeEvening().pizzas[0].events.in));
    await action(page,'pizza-out');await expect(page.locator('.pizza-finishing')).toContainText('Sam');
    await action(page,'pizza-in');await action(page,'pizza-out');
    await expect(page.locator('.pizza-finishing')).toContainText('Na het bakken');await expect(page.locator('.pizza-finishing')).toContainText('Parma');
    await page.reload();await expect(page.locator('html')).toHaveAttribute('data-app-ready','true');await expect(page.locator('.pizza-finishing')).toContainText('Parma');
    await page.locator('[data-evening-action="finish"]').click();expect(await page.evaluate(()=>evenings.history.at(-1).pizzas.filter(p=>p.events.out==null).length)).toBe(2);
  });
  test('templates clear history while private backup restore preserves the running evening exactly',async({page})=>{
    await open(page);await expand(page,'#eveningCollectionDetails');await page.locator('#eveningTemplateName').fill('Friday');await page.locator('[data-evening-action="save-template"]').click();
    await start(page);await unknownThroughProof(page);
    const backup=await page.evaluate(()=>({format:'pizza-private-backup',version:1,createdAt:Date.now(),state:stateSnapshot()}));
    await page.locator('[data-workspace="plan"]').click();await expand(page,'#eveningCollectionDetails');
    await page.locator('#eveningImportFile').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});
    await expect(page.locator('.restore-preview')).toContainText('lopende avond');
    await page.locator('[data-evening-action="confirm-import"]').click();
    expect(await page.evaluate(()=>activeBatch().unknownEvents)).toEqual(['bulkStart','fridgeIn','fridgeOut']);
    await page.locator('[data-evening-action="finish"]').click();await expand(page,'#eveningCollectionDetails');await page.locator('[data-evening-action="load-template"]').click();
    expect(await page.evaluate(()=>({active:activeEvening(),date:evenings.draft.date,events:evenings.draft.pizzas.map(p=>p.events),measurements:liveMeasurements}))).toEqual({active:null,date:'',events:[{},{},{},{}],measurements:{doughTemp:null,fridgeTemp:null}});
  });
  test('invalid and future backups leave storage unchanged',async({page})=>{
    await open(page);await expand(page,'#eveningCollectionDetails');await page.evaluate(()=>saveState());
    const before=await page.evaluate(()=>localStorage.getItem(SAVE_KEY));
    await page.locator('#eveningImportFile').setInputFiles({name:'future.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({format:'pizza-private-backup',version:99}))});
    await expect(page.locator('#eveningPlan [role="status"]')).toContainText('niets vervangen');
    expect(await page.evaluate(()=>localStorage.getItem(SAVE_KEY))).toBe(before);
  });
  test('a second tab cannot overwrite events and takes over only after the writer closes',async({page,context})=>{
    await open(page);await start(page);await page.locator('[data-evening-action="event-now"]').click();
    const second=await context.newPage();await second.goto(path);await expect(second.locator('html')).toHaveAttribute('data-app-ready','true');await expect(second.locator('#storageOwnerNotice')).toBeVisible();
    // Flush the writer's pending UI save before asserting that the reader cannot change its bytes.
    const before=await page.evaluate(()=>{saveState();return localStorage.getItem(SAVE_KEY);});
    expect(await second.evaluate(()=>saveState())).toBe(false);await second.evaluate(()=>resetCalculator());expect(await page.evaluate(()=>localStorage.getItem(SAVE_KEY))).toBe(before);
    await page.close();await second.reload();await expect(second.locator('html')).toHaveAttribute('data-app-ready','true');await expect(second.locator('#storageOwnerNotice')).toHaveCount(0);expect(await second.evaluate(()=>activeBatch().events.bulkStart)).toBeGreaterThan(0);await second.close();
  });
  test('schema 52 migrates one running batch without inventing past toppings',async({page})=>{
    await open(page);await start(page);await action(page,'event-now');
    const legacy=await page.evaluate(()=>{const d=stateSnapshot();d.version=52;d.workshop.batch=WorkflowCore.clone(activeBatch());d.workshop.history=[{...WorkflowCore.clone(activeBatch()),id:'old-archive',status:'finished'}];delete d.evenings;localStorage.setItem('pizzaCalcV52',JSON.stringify(d));localStorage.removeItem(SAVE_KEY);return d;});
    await page.reload();await expect(page.locator('html')).toHaveAttribute('data-app-ready','true');await expect(page.locator('#kitchenWorkspace')).toContainText('Bulkrijs');
    expect(await page.evaluate(()=>activeBatch().events)).toEqual(legacy.workshop.batch.events);
    expect(await page.evaluate(()=>({count:activeEvening().runs.length,provenance:activeEvening().pizzas[0].provenance,archived:evenings.history[0].pizzas,old:localStorage.getItem('pizzaCalcV52')}))).toEqual({count:1,provenance:'legacy-current-choices',archived:[],old:null});
    await page.reload();await expect(page.locator('html')).toHaveAttribute('data-app-ready','true');expect(await page.evaluate(()=>activeBatch().events)).toEqual(legacy.workshop.batch.events);
    await page.locator('[data-workspace="plan"]').click();await expand(page,'#eveningCollectionDetails');await expand(page,'#eveningHistory');await page.locator('.evening-archive > summary').click();await expect(page.locator('.evening-archive')).toContainText('bulk gestart');expect(await page.evaluate(()=>activeBatch().events)).toEqual(legacy.workshop.batch.events);
  });
  test('quota failure during private restore preserves the previous evening',async({page})=>{
    await open(page);await start(page);
    const backup=await page.evaluate(()=>({format:'pizza-private-backup',version:1,createdAt:Date.now(),state:stateSnapshot()}));
    await page.locator('[data-workspace="plan"]').click();await expand(page,'#eveningCollectionDetails');
    await page.locator('#eveningImportFile').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});
    await expect(page.locator('.restore-preview')).toBeVisible();
    const before=await page.evaluate(()=>{saveState();const raw=localStorage.getItem(SAVE_KEY);const write=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===SAVE_KEY)throw new DOMException('Full','QuotaExceededError');return write.call(this,k,v);};return raw;});
    await page.locator('[data-evening-action="confirm-import"]').click();await expect(page.locator('#eveningPlan [role="status"]')).toContainText('Niet opgeslagen');
    expect(await page.evaluate(()=>localStorage.getItem(SAVE_KEY))).toBe(before);expect(await page.evaluate(()=>activeEvening().id)).toBe(backup.state.evenings.active.id);
  });
  test('missing template recipes require an explicit replacement',async({page})=>{
    await open(page);
    const file=await page.evaluate(()=>{const t=captureEveningTemplate('Imported');t.pizzas[0].recipeId='missing-special';t.pizzas[0].custom.recipeId='missing-special';t.pizzas[0].snapshot.name='Old special';return EveningCore.exportTemplate(t);});
    await expand(page,'#eveningCollectionDetails');await page.locator('#eveningImportFile').setInputFiles({name:'evening.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(file))});
    await page.locator('[data-evening-action="confirm-import"]').click();await page.locator('[data-evening-action="load-template"]').click();
    await expect(page.locator('#templateResolution')).toContainText('Old special');
    await page.locator('[data-resolve-pizza]').selectOption('marinara');await page.locator('[data-evening-action="resolve-template"]').click();
    expect(await page.evaluate(()=>pizzaSelections[0])).toBe('marinara');expect(await page.evaluate(()=>evenings.templates[0].pizzas[0].recipeId)).toBe('missing-special');
  });
  test('absolute timer survives reload and a refused wake lock stays off',async({page})=>{
    await page.clock.install({time:new Date('2026-09-22T12:00:00Z')});await open(page);await start(page);await expand(page,'#kitchenTimers');
    await page.locator('#restTimerMinutes').fill('5');await page.locator('[data-evening-action="start-timer"]').click();
    const end=await page.evaluate(()=>activeEvening().timer.endAt);await page.clock.fastForward(2*60000);await page.reload();await expect(page.locator('html')).toHaveAttribute('data-app-ready','true');expect(await page.evaluate(()=>activeEvening().timer.endAt)).toBe(end);
    await page.clock.fastForward(4*60000);await expect(page.locator('#eveningTimer')).toContainText('Timer klaar');expect(await page.evaluate(()=>activeBatch().events.bulkStart)).toBeUndefined();
    await page.evaluate(()=>Object.defineProperty(navigator,'wakeLock',{value:{request:async()=>{throw new Error('Refused');}},configurable:true}));
    await page.locator('[data-evening-action="wake"]').click();await expect(page.locator('[data-evening-action="wake"]')).toHaveAttribute('aria-pressed','false');await expect(page.locator('#kitchenWorkspace .info[role="status"]')).toContainText('geweigerd');
  });
  test('sharing previews and downloads a template without private names or notes',async({page})=>{
    await open(page);await expand(page,'#eveningCollectionDetails');
    await page.evaluate(()=>{evenings.draft.pizzas[0].name='Secret guest';workshop.profiles=[{id:'my-mixer',name:'Secret owner',method:'kitchenaid',model:'Artisan',hook:'Spiral',programme:'Secret note'}];workshop.profileId='my-mixer';});
    await page.locator('[data-evening-action="share-template"]').click();await expect(page.locator('#eveningSharePreview')).toBeVisible();
    const [download]=await Promise.all([page.waitForEvent('download'),page.locator('[data-evening-action="download-shared"]').click()]);
    const fs=require('node:fs/promises'),raw=await fs.readFile(await download.path(),'utf8'),file=JSON.parse(raw);
    expect(raw).not.toContain('Secret');expect(file.format).toBe('pizza-evening-template');expect(file.template.pizzas).toHaveLength(4);expect(file.template.profile.model).toBe('Artisan');
  });
  test('fixed date stays fixed and availability alternatives require explicit application',async({page})=>{
    await page.clock.install({time:new Date('2026-09-22T08:00:00Z')});await open(page);
    await page.locator('#eveningDateDetails summary').click();await page.locator('#eveningBakeDate').fill('2026-09-25T18:30');await page.locator('#eveningBakeDate').blur();
    const target=await page.evaluate(()=>selectedBakeDate().getTime());await page.locator('#eveningEarliest').fill('2026-09-24T19:00');await page.locator('#eveningEarliest').blur();
    await expect(page.locator('#eveningDateDetails')).toContainText('vóór je vroegste start');expect(await page.evaluate(()=>selectedBakeDate().getTime())).toBe(target);
    await page.clock.fastForward(24*3600000);expect(await page.evaluate(()=>selectedBakeDate().getTime())).toBe(target);
  });
});
