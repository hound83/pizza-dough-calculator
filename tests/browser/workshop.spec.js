'use strict';
const {test,expect}=require('playwright/test');

for(const path of ['/index.html','/src/index.html']){
  test.describe(`v1.4 workshop ${path}`,()=>{
    async function open(page){
      await page.goto(path,{waitUntil:'load'});
      await page.locator('[data-mode-card="dough"]').click();
    }
    for(const blocked of [false,true])test(`schema 51 upgrade ${blocked?'retains the original on write failure':'preserves the running recipe and observations'}`,async({page})=>{
      const legacy={version:51,preset:'custom',pizzas:'6',diameter:'32',hydration:'66',yeastPct:'.17345',exactOverride:{h:66,ySelected:.17345},currentMethod:'kitchenaid',currentLang:'en',experienceMode:'full',appMode:'full',currentWizardPage:4,practical:false,autolyse:true,sizeFromDiameter:true,completedSteps:{'s-weigh':true},liveMeasurements:{doughTemp:25.5,fridgeTemp:4.5},pizzaSelections:Array(6).fill('napoletana'),pizzaCustomizations:[],bakeLog:[{ts:Date.UTC(2026,8,20),method:'kitchenaid',notes:'Legacy bake note',hydration:66,rating:'good'}]};
      await page.addInitScript(({legacy,blocked})=>{
        if(!sessionStorage.getItem('migration-seeded')){
          localStorage.setItem('pizzaCalcV51',JSON.stringify(legacy));sessionStorage.setItem('migration-seeded','yes');
        }
        if(blocked){
          const write=Storage.prototype.setItem;
          Storage.prototype.setItem=function(key,value){if(key==='pizzaCalcV52')throw new DOMException('Test quota','QuotaExceededError');return write.call(this,key,value);};
        }
      },{legacy,blocked});
      await page.goto(path,{waitUntil:'load'});
      const read=()=>page.evaluate(()=>({diameter:$('diameter').value,pizzas:calc().pizzas,hydration:calc().h,yeastPct:calc().y,lang:currentLang,mode:experienceMode,temp:liveMeasurementValue('doughTemp'),fridge:liveMeasurementValue('fridgeTemp'),checked:completedSteps['s-weigh'],log:bakeLog[0].notes,recipes:pizzaSelections.length,old:localStorage.getItem('pizzaCalcV51'),version:JSON.parse(localStorage.getItem('pizzaCalcV52')||'null')?.version??null}));
      const state=await read();
      expect(state).toMatchObject({diameter:'32',pizzas:6,hydration:66,yeastPct:.17345,lang:'en',mode:'full',temp:25.5,fridge:4.5,checked:true,log:'Legacy bake note',recipes:6});
      if(blocked){
        expect(state.old).toBe(JSON.stringify(legacy));expect(state.version).toBeNull();
        await expect(page.locator('#storageWarning')).toBeVisible();
      }else{
        expect(state.old).toBeNull();expect(state.version).toBe(52);
        await page.reload();expect(await read()).toEqual(state);
      }
    });

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
      await page.evaluate(()=>setExperienceMode('full'));
      await expect(page.locator('#applyYeastAdviceButton')).toHaveText('Dough already mixed · yeast fixed');
      await expect(page.locator('#applyYeastAdviceButton')).toBeDisabled();
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
      await expect(page.locator('#recipeWorkbench [role="status"]')).toContainText('geen geldig');
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
      await expect(page.locator('#bakeComparison label').first()).toContainText('Bak A');
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
    test('persisted active and archived batches survive a five-minute backward clock correction',async({page})=>{
      const now=new Date('2026-09-21T12:00:00Z');await page.clock.install({time:now});await open(page);
      await page.locator('#batchPlanner [data-workshop-action="start-batch"]').click();
      await page.locator('[data-workshop-action="record-now"]').click();
      const events=await page.evaluate(()=>activeBatch().events);
      await page.locator('[data-workshop-action="close-batch"]').click();
      await page.locator('#batchPlanner [data-workshop-action="start-batch"]').click();
      await page.locator('[data-workshop-action="record-now"]').click();
      const active=await page.evaluate(()=>JSON.stringify(activeBatch()));
      await page.clock.setSystemTime(new Date(now.getTime()-5*60000));await page.reload();
      expect(await page.evaluate(()=>JSON.stringify(activeBatch()))).toBe(active);
      expect(await page.evaluate(()=>workshop.history[0].events)).toEqual(events);
      await page.evaluate(()=>showPage(1));await expect(page.locator('#pizzas')).toBeDisabled();
      await page.clock.setSystemTime(new Date(now.getTime()+30*60000));await page.reload();
      expect(await page.evaluate(()=>JSON.stringify(activeBatch()))).toBe(active);
    });
    test('oven settings are editable during a batch and persist across reload and archive/reopen',async({page})=>{
      await open(page);await page.evaluate(()=>setExperienceMode('full'));await page.locator('#bakeDay').selectOption('2');
      await page.evaluate(()=>showPage(4));await expect(page.locator('[data-step-key="s-weigh"] .step-moment')).toContainText('Gepland');
      await page.locator('#batchRunner [data-workshop-action="start-batch"]').click();
      await expect(page.locator('[data-step-key="s-weigh"] .step-moment')).toContainText('Werkelijk');
      await expect(page.locator('[data-step-key="s-cold"] .step-moment')).toContainText('Verwacht');
      const before=await page.evaluate(()=>({yeast:calc().yeast,flour:calc().flour,events:activeBatch().events,target:activeBatch().bakeAt}));
      await page.evaluate(()=>showPage(1));await expect(page.locator('#stoneTemp')).toBeEnabled();
      await page.locator('#stoneTemp').fill('400');await page.locator('#stoneTemp').blur();
      await page.locator('#preheatMinutes').fill('45');await page.locator('#preheatMinutes').blur();
      await page.reload();await expect(page.locator('#stoneTemp')).toHaveValue('400');await expect(page.locator('#preheatMinutes')).toHaveValue('45');
      expect(await page.evaluate(()=>({yeast:calc().yeast,flour:calc().flour,events:activeBatch().events,target:activeBatch().bakeAt}))).toEqual(before);
      await page.evaluate(()=>showPage(4));
      expect(await page.evaluate(()=>$('timeline').textContent.includes(niceDate(new Date(WorkflowCore.timeline(activeBatch()).times.bake-45*60000))))).toBe(true);
      await page.locator('[data-workshop-action="close-batch"]').click();
      await page.locator('#stoneTemp').fill('300');await page.locator('#stoneTemp').blur();
      await page.locator('#batchArchive summary').click();await page.locator('[data-workshop-action="resume-batch"]').first().click();
      await page.evaluate(()=>showPage(1));await expect(page.locator('#stoneTemp')).toHaveValue('400');await expect(page.locator('#preheatMinutes')).toHaveValue('45');
    });
    for(const width of [320,390,760,1280])test(`workshop errors stay beside the action and inside the viewport at ${width}px`,async({page})=>{
      await page.setViewportSize({width,height:800});await open(page);await page.locator('#recipeWorkbenchDetails summary').click();
      const visible=async()=>{
        const status=page.locator('#recipeWorkbench [role="status"]');await expect(status).toBeVisible();
        await expect.poll(async()=>status.evaluate(el=>{const r=el.getBoundingClientRect();return Math.max(-r.top,r.bottom-innerHeight);})).toBeLessThanOrEqual(1);
        await expect(page.locator('#batchPlanner [role="status"]')).toHaveCount(0);
      };
      await page.locator('[data-workshop-action="save-recipe"]').click();await expect(page.locator('#recipeWorkbench [role="status"]')).toContainText('Geef je recept');await visible();
      for(const [lang,message] of [['nl','geen geldig deegreceptbestand'],['en','not a valid dough recipe file']]){
        await page.locator(lang==='nl'?'#langNl':'#langEn').click();
        await page.locator('#importRecipeFile').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('dit is geen json')});
        await expect(page.locator('#recipeWorkbench [role="status"]')).toContainText(message);await visible();
      }
      await page.locator('#importRecipeFile').setInputFiles({name:'large.json',mimeType:'application/json',buffer:Buffer.alloc(50001,32)});
      await expect(page.locator('#recipeWorkbench [role="status"]')).toContainText('larger than 50 kB');await visible();
      await page.locator('#coldStorageDetails summary').click();await page.locator('#storage-ballsPerBox').fill('0');await page.locator('#storage-ballsPerBox').blur();
      await expect(page.locator('#coldStoragePlanner [role="status"]')).toContainText('within the indicated bounds');
      await expect.poll(()=>page.locator('#coldStoragePlanner [role="status"]').evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;})).toBe(true);
      expect(await page.evaluate(()=>workshop.recipes.length)).toBe(0);
    });
    test('same-day proof advice refreshes on reopening and returning to the page',async({page})=>{
      const now=new Date('2026-09-21T12:00:00Z');await page.clock.install({time:now});await open(page);
      await page.locator('#preset').selectOption('sameDay');await page.locator('#batchPlanner [data-workshop-action="start-batch"]').click();
      await page.locator('[data-workshop-action="record-now"]').click();await page.evaluate(()=>setLiveMeasurement('doughTemp','26'));
      await page.locator('#batchTimingDetails summary').click();await expect(page.locator('[data-workshop-action="apply-proof"]')).toBeVisible();
      await page.locator('#batchTimingDetails summary').click();await page.clock.setSystemTime(new Date(now.getTime()+3*3600000));
      await page.locator('#batchTimingDetails summary').click();await expect(page.locator('#batchTimingDetails')).toContainText('overgangsmoment is verstreken');
      await expect(page.locator('[data-workshop-action="apply-proof"]')).toHaveCount(0);
      await page.clock.setSystemTime(now);await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await expect(page.locator('[data-workshop-action="apply-proof"]')).toBeVisible();
      await page.clock.setSystemTime(new Date(now.getTime()+3*3600000));await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
      await expect(page.locator('#batchTimingDetails')).toContainText('overgangsmoment is verstreken');await expect(page.locator('[data-workshop-action="apply-proof"]')).toHaveCount(0);
    });
    for(const width of [320,390,430,760,1024,1280]){
      test(`expanded planning and running-batch controls fit at ${width}px`,async({page})=>{
        const failures=[];page.on('pageerror',e=>failures.push(e.message));await page.setViewportSize({width,height:900});await open(page);
        for(const id of ['coldStorageDetails','scaleDetails','recipeWorkbenchDetails'])await page.locator(`#${id}>summary`).click();
        await page.locator('#savedRecipeName').fill('Mijn lange weekendrecept met een duidelijke naam');await page.locator('[data-workshop-action="save-recipe"]').click();
        expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBe(0);
        await page.screenshot({path:test.info().outputPath(`workshop-plan-${width}.png`),fullPage:true});
        await page.locator('#langEn').click();
        expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBe(0);
        await page.screenshot({path:test.info().outputPath(`workshop-plan-en-${width}.png`),fullPage:true});
        await page.locator('#langNl').click();
        await page.locator('#batchPlanner [data-workshop-action="start-batch"]').click();
        for(const id of ['batchEventDetails','batchTimingDetails','mixerProfileDetails','doughHelpDetails'])await page.locator(`#${id}>summary`).click();
        expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBe(0);
        await page.locator('#batchRunner [data-workshop-action="record-now"]').focus();await page.keyboard.press('Enter');
        expect(await page.evaluate(()=>activeBatch().events.bulkStart)).toBeGreaterThan(0);
        await page.screenshot({path:test.info().outputPath(`workshop-batch-${width}.png`),fullPage:true});
        await page.locator('#langEn').click();
        expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBe(0);
        await page.screenshot({path:test.info().outputPath(`workshop-batch-en-${width}.png`),fullPage:true});expect(failures).toEqual([]);
      });
    }
  });
}
