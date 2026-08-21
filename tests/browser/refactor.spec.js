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

        await expect(page).toHaveTitle('Pizzadeegcalculator v1.0.0');
        await expect(page.locator('#page0')).toHaveClass(/\bactive\b/);
        await expect(page.locator('[data-mode-card="full"]')).toBeVisible();

        const runtime=await page.evaluate(()=>({
          appVersion:APP_VERSION,
          hasCalculator:typeof calc==='function',
          horizontalOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth
        }));
        expect(runtime).toEqual({appVersion:'1.0.0',hasCalculator:true,horizontalOverflow:0});
        expect(failures).toEqual([]);
      });
    }

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
            minimumListHeight:Math.floor(innerHeight*.24),
            modalFits:modalRect.left>=-1&&modalRect.right<=innerWidth+1&&modalRect.top>=-1&&modalRect.bottom<=innerHeight+1,
            modalOverflow:modal.scrollWidth-modal.clientWidth,
            chipsOverflow:chips.scrollWidth>chips.clientWidth,
            visibleRecipes
          };
        });

        expect(metrics.documentOverflow).toBe(0);
        expect(metrics.modalFits).toBe(true);
        expect(metrics.modalOverflow).toBeLessThanOrEqual(1);
        expect(metrics.listHeight).toBeGreaterThanOrEqual(metrics.minimumListHeight);
        expect(metrics.chipsOverflow).toBe(true);
        expect(metrics.visibleRecipes).toBeGreaterThan(0);

        await page.locator('[data-recipe-id="salami"]').first().click();
        await expect(page.locator('#pizzaPickerPreview h2')).toHaveText('Salami');
        await expect(page.locator('[data-recipe-id="salami"][aria-pressed="true"]').first()).toBeVisible();

        await page.locator('[data-recipe-id="quattroFormaggi"]').first().hover();
        await expect(page.locator('#pizzaPickerPreview h2')).toHaveText('Salami');
        await expect(page.locator('[data-recipe-id="salami"][aria-pressed="true"]').first()).toBeVisible();
        expect(failures).toEqual([]);
      });
    }
  });
}
