'use strict';

const {expect,test}=require('playwright/test');

const PUBLICATIONS=[
  {name:'standalone bundle',path:'/index.html'},
  {name:'modular source',path:'/src/index.html'}
];

const VIEWPORTS=[
  {name:'320 px mobile',width:320,height:568},
  {name:'390 px mobile',width:390,height:844},
  {name:'430 px mobile',width:430,height:932},
  {name:'760 px tablet',width:760,height:900},
  {name:'1024 px desktop',width:1024,height:900},
  {name:'1280 px desktop',width:1280,height:900}
];

function observeBrowserFailures(page){
  const failures=[];
  page.on('pageerror',error=>failures.push(`pageerror: ${error.message}`));
  page.on('console',message=>{
    if(message.type()==='error')failures.push(`console: ${message.text()}`);
  });
  page.on('requestfailed',request=>{
    failures.push(`request: ${request.url()} (${request.failure()?.errorText||'failed'})`);
  });
  page.on('response',response=>{
    if(response.status()>=400)failures.push(`response: ${response.status()} ${response.url()}`);
  });
  return failures;
}

test('test server handles the implicit browser favicon request',async({request})=>{
  const response=await request.get('/favicon.ico');
  expect(response.status()).toBe(204);
  expect((await response.body()).length).toBe(0);
});

async function openPicker(page,publication){
  await page.goto(publication.path,{waitUntil:'load'});
  await page.locator('[data-mode-card="full"]').click();
  await page.evaluate(()=>showPage(3));
  await page.locator('#pizzaRecipeAllButton').click();
  await expect(page.locator('#pizzaPickerOverlay')).toHaveClass(/\bopen\b/);
  await expect(page.locator('#pizzaPickerList .picker-item').first()).toBeVisible();
}

for(const publication of PUBLICATIONS){
  test.describe(publication.name,()=>{
    for(const viewport of VIEWPORTS){
      test(`loads without browser or horizontal-layout failures at ${viewport.name}`,async({page})=>{
        const failures=observeBrowserFailures(page);
        await page.setViewportSize({width:viewport.width,height:viewport.height});
        await page.goto(publication.path,{waitUntil:'load'});

        await expect(page).toHaveTitle('Pizzadeegcalculator v1.1.0');
        await expect(page.locator('#page0')).toHaveClass(/\bactive\b/);
        await expect(page.locator('[data-mode-card="full"]')).toBeVisible();

        const runtime=await page.evaluate(()=>({
          appVersion:APP_VERSION,
          hasCalculator:typeof calc==='function',
          horizontalOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth
        }));
        expect(runtime).toEqual({appVersion:'1.1.0',hasCalculator:true,horizontalOverflow:0});
        expect(failures).toEqual([]);
      });
    }

    test('switches Basic and Full without changing recipe values',async({page})=>{
      await page.goto(publication.path,{waitUntil:'load'});
      await expect(page.locator('#experienceBasic')).toHaveAttribute('aria-pressed','true');
      await page.locator('[data-mode-card="dough"]').click();
      await expect(page.locator('#hydration')).not.toBeVisible();
      const before=await page.locator('#hydration').inputValue();
      await page.locator('.mode-choice-nav').click();
      await page.locator('#experienceFull').click();
      await page.locator('[data-mode-card="dough"]').click();
      await expect(page.locator('#hydration')).toBeVisible();
      expect(await page.locator('#hydration').inputValue()).toBe(before);
    });

    test('persists the display mode and migrates existing v1.0 users to Full',async({page})=>{
      await page.addInitScript(()=>localStorage.setItem('pizzaCalcV50',JSON.stringify({version:50,appMode:'dough',hydration:'67'})));
      await page.goto(publication.path,{waitUntil:'load'});
      await expect(page.locator('#experienceFull')).toHaveAttribute('aria-pressed','true');
      await page.locator('#experienceBasic').click();
      await page.waitForTimeout(350);
      expect(await page.evaluate(()=>localStorage.getItem('pizzaCalcV50'))).toBeNull();
      expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('pizzaCalcV51')).version)).toBe(51);
      await page.reload({waitUntil:'load'});
      await expect(page.locator('#experienceBasic')).toHaveAttribute('aria-pressed','true');
      await page.locator('[data-mode-card="dough"]').click();
      expect(await page.locator('#hydration').inputValue()).toBe('67');
    });

    test('shows a custom-settings badge in Basic after Full edits',async({page})=>{
      await page.goto(publication.path,{waitUntil:'load'});
      await page.locator('#experienceFull').click();
      await page.locator('[data-mode-card="dough"]').click();
      await page.locator('#hydration').fill('66');
      await page.locator('#hydration').blur();
      await page.locator('.mode-choice-nav').click();
      await page.locator('#experienceBasic').click();
      await page.locator('[data-mode-card="dough"]').click();
      await expect(page.locator('#experienceCustomBadge')).toBeVisible();
      await expect(page.locator('#experienceCustomBadge')).toHaveText('Eigen instellingen actief');
    });

    for(const viewport of VIEWPORTS.slice(0,3)){
      test(`keeps the picker usable and click-selected at ${viewport.name}`,async({page})=>{
        const failures=observeBrowserFailures(page);
        await page.setViewportSize({width:viewport.width,height:viewport.height});
        await openPicker(page,publication);

        const metrics=await page.evaluate(()=>{
          const modal=document.querySelector('.picker-modal');
          const list=document.querySelector('#pizzaPickerList');
          const chips=document.querySelector('#pizzaFilterChips');
          const modalRect=modal.getBoundingClientRect();
          const listRect=list.getBoundingClientRect();
          const visibleRecipes=[...list.querySelectorAll('.picker-item')].filter(item=>{
            const rect=item.getBoundingClientRect();
            return rect.bottom>listRect.top&&rect.top<listRect.bottom;
          }).length;
          return {
            documentOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
            listHeight:list.clientHeight,
            minimumListHeight:Math.floor(innerHeight*.45),
            modalFits:modalRect.left>=-1&&modalRect.right<=innerWidth+1&&modalRect.top>=-1&&modalRect.bottom<=innerHeight+1,
            modalOverflow:modal.scrollWidth-modal.clientWidth,
            chipsOverflow:chips.scrollWidth>chips.clientWidth,
            visibleRecipes,
            searchFocused:document.activeElement===document.querySelector('#pizzaPickerSearch'),
            previewVisible:getComputedStyle(document.querySelector('#pizzaPickerPreview')).display!=='none'
          };
        });

        expect(metrics.documentOverflow).toBe(0);
        expect(metrics.modalFits).toBe(true);
        expect(metrics.modalOverflow).toBeLessThanOrEqual(1);
        expect(metrics.listHeight).toBeGreaterThanOrEqual(metrics.minimumListHeight);
        expect(metrics.chipsOverflow).toBe(true);
        expect(metrics.visibleRecipes).toBeGreaterThanOrEqual(3);
        expect(metrics.searchFocused).toBe(false);
        expect(metrics.previewVisible).toBe(false);

        await page.locator('[data-recipe-id="salami"]').first().click();
        await expect(page.locator('.picker-modal')).toHaveClass(/\bmobile-preview-open\b/);
        await expect(page.locator('#pizzaPickerPreview h2')).toHaveText('Salami');
        await expect(page.locator('#pizzaPickerPreview')).toBeVisible();
        await expect(page.locator('#pizzaPickerBack')).toBeVisible();
        await expect(page.locator('#pizzaPickerPreviewClose')).toBeVisible();

        await page.locator('#pizzaPickerBack').click();
        await expect(page.locator('.picker-modal')).not.toHaveClass(/\bmobile-preview-open\b/);
        await expect(page.locator('[data-recipe-id="salami"][aria-pressed="true"]').first()).toBeVisible();

        await page.locator('[data-recipe-id="quattroFormaggi"]').first().hover();
        await expect(page.locator('#pizzaPickerPreview h2')).toHaveText('Salami');
        await expect(page.locator('[data-recipe-id="salami"][aria-pressed="true"]').first()).toBeVisible();
        expect(failures).toEqual([]);
      });
    }
  });
}
