'use strict';
const {test,expect}=require('playwright/test');

for(const path of ['/index.html','/src/index.html']){
  test.describe(`v1.4 workshop ${path}`,()=>{
    async function open(page){
      await page.goto(path,{waitUntil:'load'});
      await page.locator('[data-mode-card="dough"]').click();
    }
    test('running batch fixes recipe and calendar date across midnight, language and reload',async({page})=>{
      const failures=[];page.on('pageerror',error=>failures.push(error.message));
      await page.clock.install({time:new Date('2026-09-21T23:50:00Z')});await open(page);
      await page.locator('#bakeDay').selectOption('2');
      const before=await page.evaluate(()=>({yeast:calc().yeast,target:selectedBakeDate().getTime()}));
      await page.locator('#batchPlanner [data-workshop-action="start-batch"]').click();
      await expect(page.locator('#batchRunner')).toContainText('Jouw lopende batch');
      await expect(page.locator('[data-method="hand"]')).toBeDisabled();
      await page.locator('#batchRunner [data-workshop-action="record-now"]').click();
      const started=await page.evaluate(()=>activeBatch().events.bulkStart);
      await page.clock.fastForward(20*60000);
      await page.locator('#langEn').click();
      await expect(page.locator('#batchRunner')).toContainText('Your current batch');
      await page.reload();
      expect(await page.evaluate(()=>({target:selectedBakeDate().getTime(),start:activeBatch().events.bulkStart,yeast:calc().yeast}))).toEqual({target:before.target,start:started,yeast:before.yeast});
      await page.evaluate(()=>showPage(1));
      await expect(page.locator('#pizzas')).toBeDisabled();await expect(page.locator('#bakeDay')).toBeDisabled();await expect(page.locator('#applyYeastAdviceButton')).toBeDisabled();
      await page.evaluate(()=>{applyPreset('avpnMid');setMethod('hand');applyYeastAdvice();applyDeadlinePlan();});
      expect(await page.evaluate(()=>({yeast:calc().yeast,method:currentMethod}))).toEqual({yeast:before.yeast,method:'kitchenaid'});
      await expect(page.locator('#batchPlanner')).toContainText('recipe fixed');
      expect(failures).toEqual([]);
    });
    test('actual checkpoints validate chronology and archive/resume preserves progress and cleared measurements',async({page})=>{
      await page.clock.install({time:new Date('2026-09-21T12:00:00Z')});await open(page);
      await page.locator('#coldStorageDetails summary').click();await page.locator('#workshopColdRoute').selectOption('balls');
      await page.locator('#batchStartDetails summary').click();await page.locator('#batchStartAt').fill('2026-09-21T09:00');
      await page.locator('#batchPlanner [data-workshop-action="start-batch"]').click();
      await page.locator('#batchEventDetails summary').click();await page.locator('#batchEventAt').fill('2026-09-22T10:00');
      await page.locator('[data-workshop-action="record-time"]').click();await expect(page.locator('#batchRunner [role="status"]')).toContainText('uiterlijk nu');
      expect(await page.evaluate(()=>activeBatch().events.bulkStart)).toBeUndefined();
      await page.locator('#batchEventAt').fill('2026-09-21T10:00');await page.locator('[data-workshop-action="record-time"]').click();
      await expect(page.locator('#batchEventKey')).toHaveValue('fridgeIn');
      await page.locator('#batchEventAt').fill('2026-09-21T11:00');await page.locator('[data-workshop-action="record-time"]').click();
      const anchor=await page.evaluate(()=>activeBatch().events.fridgeIn);
      await expect(page.locator('[data-step-key="s-shape"] .step-moment')).toContainText('Werkelijk');
      await page.locator('#batchEventKey').selectOption('bulkStart');await page.locator('#batchEventAt').fill('2026-09-21T11:30');
      await page.locator('[data-workshop-action="record-time"]').click();await expect(page.locator('#batchRunner [role="status"]')).toContainText('vorige en volgende');
      expect(await page.evaluate(()=>activeBatch().events.fridgeIn)).toBe(anchor);
      await page.locator('#stepsList .step-check').first().click();
      await expect(page.locator('#stepsList .step-check input').first()).toBeChecked();
      await page.evaluate(()=>{setLiveMeasurement('doughTemp','25');setLiveMeasurement('doughTemp','');});
      await page.locator('[data-workshop-action="close-batch"]').click();
      await page.locator('#batchArchive summary').click();await page.locator('[data-workshop-action="resume-batch"]').first().click();
      await expect(page.locator('#stepsList .step-check input').first()).toBeChecked();
      expect(await page.evaluate(()=>({at:activeBatch().events.fridgeIn,temp:liveMeasurementValue('doughTemp')}))).toEqual({at:anchor,temp:null});
    });
    test('named recipes compare and round trip through an explicit private-data-free file',async({page})=>{
      await open(page);await page.locator('#recipeWorkbenchDetails summary').click();
      await page.locator('#savedRecipeName').fill('Weekend <special>');await page.locator('[data-workshop-action="save-recipe"]').click();
      const id=await page.evaluate(()=>workshop.recipes[0].id);
      await page.locator('#pizzas').fill('6');await page.locator('#pizzas').blur();
      await page.locator('#comparePlanB').selectOption(id);
      await expect(page.locator('#recipeWorkbench tbody tr').first()).toHaveText(/Aantal bollen\s*6\s*4/);
      const [download]=await Promise.all([page.waitForEvent('download'),page.locator('[data-workshop-action="export-recipe"]').click()]);
      const fs=require('node:fs/promises'),file=JSON.parse(await fs.readFile(await download.path(),'utf8'));
      expect(file.recipe.fields.pizzas).toBe('6');expect(Object.keys(file).sort()).toEqual(['format','name','recipe','version']);
      await page.locator('#importRecipeFile').setInputFiles({name:'shared.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(file))});
      await expect.poll(()=>page.evaluate(()=>workshop.recipes.length)).toBe(2);
      await page.locator(`[data-workshop-action="load-recipe"][data-id="${id}"]`).click();await expect(page.locator('#pizzas')).toHaveValue('4');
      await page.reload();expect(await page.evaluate(()=>workshop.recipes.length)).toBe(2);
      await page.locator('#recipeWorkbenchDetails summary').click();
      await page.locator('#importRecipeFile').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{"format":"pizza-dough-recipe","version":1}')});
      await expect(page.locator('#batchPlanner [role="status"]')).toContainText('geen geldig');
      expect(await page.evaluate(()=>workshop.recipes.length)).toBe(2);
    });
    test('scale resolution and container capacity guide a real plan without changing grams silently',async({page})=>{
      await open(page);const yeast=await page.evaluate(()=>calc().yeast);
      await page.locator('#scaleDetails summary').click();await page.locator('#yeastScale').selectOption('1');
      await expect(page.locator('#scalePlanner .warning')).toContainText('Recept');expect(await page.evaluate(()=>calc().yeast)).toBe(yeast);
      await page.locator('#coldStorageDetails summary').click();await page.locator('#storage-ballsPerBox').fill('2');await page.locator('#storage-ballsPerBox').blur();
      await expect(page.locator('#coldStoragePlanner .warning').first()).toContainText('tekort');
      await page.locator('#workshopColdRoute').selectOption('balls');expect(await page.evaluate(()=>calc().ferm)).toBe('coldBalls');
      await page.locator('#storage-layout').selectOption('stacked');await expect(page.locator('#coldStoragePlanner')).toContainText('minder overdraagbaar');
      await page.reload();expect(await page.evaluate(()=>({scale:workshop.scale,boxes:workshop.storage.ballsPerBox,route:calc().ferm}))).toEqual({scale:1,boxes:2,route:'coldBalls'});
    });
    test('mixer attachment observations are saved with bake results and compared without model learning',async({page})=>{
      await open(page);await page.evaluate(()=>showPage(4));
      await page.locator('#mixerProfileDetails summary').click();await page.locator('#profileName').fill('Artisan spiraal');await page.locator('#profileModel').fill('Mijn Artisan');await page.locator('#profileHook').fill('Spiraalhaak');
      await page.locator('[data-workshop-action="save-profile"]').click();expect(await page.evaluate(()=>currentMixerProfile().method)).toBe('kitchenaid');
      const before=await page.evaluate(()=>waterTempAdvice(calc()).raw);
      await page.locator('#logMixMinutes').fill('9');await page.locator('#logWaterTemp').fill('18');await page.evaluate(()=>setLiveMeasurement('doughTemp','24'));
      await page.getByRole('button',{name:'Bakresultaat opslaan',exact:true}).click();
      await page.locator('#logWaterTemp').fill('19');await page.evaluate(()=>setLiveMeasurement('doughTemp','25'));await page.getByRole('button',{name:'Bakresultaat opslaan',exact:true}).click();
      await page.locator('#bakeComparisonDetails summary').click();await expect(page.locator('#bakeComparison')).toContainText('Spiraalhaak');await expect(page.locator('#bakeComparison')).toContainText('9 min');
      expect(await page.evaluate(()=>waterTempAdvice(calc()).raw)).toBe(before);
      await page.reload();expect(await page.evaluate(()=>bakeLog[0].profile.hook)).toBe('Spiraalhaak');
      await page.locator('#langEn').click();await page.locator('#bakeComparisonDetails summary').click();await expect(page.locator('#bakeComparison')).toContainText('Actual main water');
    });
    test('dough troubleshooting branches by stage and symptom in both languages',async({page})=>{
      await open(page);await page.evaluate(()=>showPage(4));await page.locator('#doughHelpDetails summary').click();
      await expect(page.locator('#doughHelpAdvice')).toContainText('6–10');
      await page.locator('#helpStage').selectOption('open');await expect(page.locator('#doughHelpAdvice')).toContainText('Scheuren alleen');
      await page.locator('#helpSymptom').selectOption('slack');await expect(page.locator('#doughHelpAdvice')).toContainText('steeds slapper');
      await page.locator('#langEn').click();await expect(page.locator('#doughHelpAdvice')).toContainText('progressively');
      await page.locator('#helpSymptom').selectOption('recoil');await expect(page.locator('#doughHelpAdvice')).toContainText('Extra kneading is not an automatic solution');
    });
    for(const width of [320,390,430,760,1024,1280]){
      test(`expanded planning and running-batch controls fit at ${width}px`,async({page})=>{
        const failures=[];page.on('pageerror',e=>failures.push(e.message));await page.setViewportSize({width,height:900});await open(page);
        for(const id of ['coldStorageDetails','scaleDetails','recipeWorkbenchDetails'])await page.locator(`#${id}>summary`).click();
        await page.locator('#savedRecipeName').fill('Mijn lange weekendrecept met een duidelijke naam');await page.locator('[data-workshop-action="save-recipe"]').click();
        expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBe(0);
        await page.screenshot({path:test.info().outputPath(`workshop-plan-${width}.png`),fullPage:true});
        await page.locator('#batchPlanner [data-workshop-action="start-batch"]').click();
        for(const id of ['batchEventDetails','batchTimingDetails','mixerProfileDetails','doughHelpDetails'])await page.locator(`#${id}>summary`).click();
        expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBe(0);
        await page.locator('#batchRunner [data-workshop-action="record-now"]').focus();await page.keyboard.press('Enter');
        expect(await page.evaluate(()=>activeBatch().events.bulkStart)).toBeGreaterThan(0);
        await page.screenshot({path:test.info().outputPath(`workshop-batch-${width}.png`),fullPage:true});expect(failures).toEqual([]);
      });
    }
  });
}
