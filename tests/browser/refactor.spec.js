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

        await expect(page).toHaveTitle('Pizzadeegcalculator v1.2.1');
        await expect(page.locator('#page0')).toHaveClass(/\bactive\b/);
        await expect(page.locator('[data-mode-card="full"]')).toBeVisible();

        const runtime=await page.evaluate(()=>({
          appVersion:APP_VERSION,
          hasCalculator:typeof calc==='function',
          horizontalOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth
        }));
        expect(runtime).toEqual({appVersion:'1.2.1',hasCalculator:true,horizontalOverflow:0});
        expect(failures).toEqual([]);
      });
    }

    test('switches Basic and Full without changing recipe values',async({page})=>{
      await page.goto(publication.path,{waitUntil:'load'});
      await expect(page.locator('#experienceBasic')).toHaveAttribute('aria-pressed','true');
      await expect(page.locator('#experienceFull b')).toHaveText('Uitgebreid');
      await page.locator('#langEn').click();
      await expect(page.locator('#experienceFull b')).toHaveText('Full');
      await page.locator('#langNl').click();
      await page.locator('[data-mode-card="dough"]').click();
      await expect(page.locator('#hydration')).not.toBeVisible();
      const before=await page.locator('#hydration').inputValue();
      await page.locator('.mode-choice-nav').click();
      await page.locator('#experienceFull').click();
      await page.locator('[data-mode-card="dough"]').click();
      await expect(page.locator('#hydration')).toBeVisible();
      expect(await page.locator('#hydration').inputValue()).toBe(before);
    });

    test('keeps Custom hidden during routine Basic input',async({page})=>{
      await page.goto(publication.path,{waitUntil:'load'});
      await page.locator('[data-mode-card="dough"]').click();
      const cases=[
        ['#pizzas','6','input'],['#diameter','30','input'],['#roomTemp','22','input'],['#fridgeTemp','5','input'],
        ['#stoneTemp','450','input'],['#bakeDay','1','select'],['#bakeTime','19:30','input']
      ];
      for(const [selector,value,control] of cases){
        if(control==='select')await page.locator(selector).selectOption(value);
        else await page.locator(selector).fill(value);
        await page.locator(selector).blur();
        await expect(page.locator('#preset')).toHaveValue('kodaNight');
        await expect(page.locator('#experienceCustomBadge')).toBeHidden();
      }
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

    test('keeps explicit yeast advice usable and explained in Basic',async({page})=>{
      await page.goto(publication.path,{waitUntil:'load'});
      await page.locator('[data-mode-card="dough"]').click();
      await expect(page.locator('#yeastApplyHelp')).toHaveText('Past alleen de berekende hoeveelheid gist aan.');
      await page.locator('#applyYeastAdviceButton').click();
      await expect(page.locator('#preset')).toHaveValue('custom');
      await expect(page.locator('#experienceCustomBadge')).toBeVisible();
      await expect(page.locator('#hydration')).toBeHidden();
      await expect(page.locator('#yeastPct')).toBeHidden();
    });

    test('uses practical percentage spinner grids while preserving off-grid preset precision',async({page})=>{
      await page.goto(publication.path,{waitUntil:'load'});
      await page.locator('#experienceFull').click();
      await page.locator('[data-mode-card="dough"]').click();
      await expect(page.locator('#diameter')).toHaveValue('30');

      const controls=[
        {selector:'#hydration',step:'0.5',start:'63',firstUp:'63.5',secondUp:'64',typed:'63.05'},
        {selector:'#saltPct',step:'0.25',start:'3',firstUp:'3.25',secondUp:'3.5',typed:'3.21'},
        {selector:'#yeastPct',step:'0.025',start:'0.17',firstUp:'0.175',secondUp:'0.2',typed:'0.176'},
        {selector:'#oilPct',step:'0.25',start:'0.25',firstUp:'0.5',secondUp:'0.75',typed:'0.3'}
      ];
      for(const control of controls){
        const field=page.locator(control.selector);
        await expect(field).toHaveAttribute('step',control.step);
        await field.fill(control.typed);
        await field.blur();
        await expect(field).toHaveValue(control.typed);
        await field.fill(control.start);
        await field.press('ArrowUp');
        await expect(field).toHaveValue(control.firstUp);
        await field.press('ArrowUp');
        await expect(field).toHaveValue(control.secondUp);
        await field.press('ArrowDown');
        await expect(field).toHaveValue(control.firstUp);
      }
    });

    test('renders staged main-water and room-temperature reserve guidance bilingually',async({page})=>{
      await page.goto(publication.path,{waitUntil:'load'});
      await page.locator('[data-mode-card="dough"]').click();
      await page.evaluate(()=>{
        currentMethod='kitchenaid';
        $('autolyse').checked=true;
        $('roomTemp').value='21';
        $('fridgeTemp').value='4';
        $('finalDoughTemp').value='24';
        update();showPage(4);
      });
      const weigh=page.locator('div.step-card[data-step-key="s-weigh"]');
      await expect(weigh).toContainText('reservewater');
      await expect(weigh).toContainText('afgedekt op kamertemperatuur');
      await expect(weigh).toContainText('315 g hoofdwater');
      await expect(weigh).toContainText('18 °C');
      await expect(weigh).not.toContainText('vaste praktische startcorrectie');
      await expect(weigh).not.toContainText('nog verder drukken');

      await page.locator('#langEn').click();
      await expect(weigh).toContainText('reserved water');
      await expect(weigh).toContainText('covered at room temperature');
      await expect(weigh).toContainText('315 g main water');
      await expect(weigh).not.toContainText('lower final dough temperature further');
    });

    test('shows practical water bands and route-correct hot-water warnings',async({page})=>{
      await page.goto(publication.path,{waitUntil:'load'});
      await page.locator('[data-mode-card="dough"]').click();
      await page.evaluate(()=>showPage(4));
      const weigh=page.locator('div.step-card[data-step-key="s-weigh"]');

      await page.evaluate(()=>{
        currentLang='nl';currentMethod='kitchenaid';$('autolyse').checked=false;
        $('roomTemp').value='24';$('finalDoughTemp').value='24';update();showPage(4);
      });
      await expect(weigh).toContainText('Koud kraanwater kan hiervoor voldoende zijn');
      await expect(weigh).not.toContainText('ijswater nodig');

      await page.evaluate(()=>{$('roomTemp').value='27';update();showPage(4);});
      await expect(weigh).toContainText('Hiervoor is ijswater nodig');
      await expect(weigh).toContainText('weeg daarna opnieuw precies');

      await page.evaluate(()=>{
        $('roomTemp').value='30';$('finalDoughTemp').value='20';update();showPage(4);
      });
      await expect(weigh).toContainText('niet haalbaar');
      await expect(weigh).toContainText('1 °C hoofdwater');
      await expect(weigh).toContainText('Hiervoor is ijswater nodig');

      await page.evaluate(()=>{
        currentMethod='hand';$('roomTemp').value='21';$('autolyse').checked=true;
        const c=calc();$('finalDoughTemp').value=String(predictFinalDoughTemp(41,c,'hand'));
        update();showPage(4);
      });
      await expect(weigh).toContainText('handkneden met koude autolyse');
      await expect(weigh).not.toContainText('op deze directe route');

      await page.evaluate(()=>{
        $('autolyse').checked=false;const c=calc();
        $('finalDoughTemp').value=String(predictFinalDoughTemp(41,c,'hand'));
        update();showPage(4);
      });
      await expect(weigh).toContainText('op deze directe route');
      await expect(weigh).toContainText('≥40 °C bij de gist');
      await expect(weigh).not.toContainText('handkneden met koude autolyse');
    });

    test('keeps recipe sauce alternatives collapsed until requested',async({page})=>{
      await page.setViewportSize({width:1280,height:900});
      await openPicker(page,publication);

      const disclosure=page.locator('#pizzaPickerPreview .sauce-choice-disclosure');
      await expect(disclosure).toBeVisible();
      await expect(disclosure).not.toHaveAttribute('open','');
      await expect(disclosure.locator('.sauce-choice-current')).toContainText('San Marzano');
      await expect(disclosure.locator('.sauce-choice-options')).toBeHidden();

      await disclosure.locator('summary').click();
      await expect(disclosure).toHaveAttribute('open','');
      await expect(disclosure.locator('.sauce-choice-options')).toBeVisible();
      await expect(disclosure.locator('[data-sauce-group]')).toHaveCount(2);
      await expect(disclosure.locator('[data-sauce-choice]')).toHaveCount(7);

      await disclosure.locator('[data-sauce-choice="pesto"]').click();
      await expect(page.locator('#pizzaPickerPreview .sauce-choice-disclosure')).not.toHaveAttribute('open','');
      await expect(page.locator('#pizzaPickerPreview .sauce-choice-current')).toContainText('Pesto');

      // The language switch sits behind the modal by design. Close the picker
      // through its real keyboard interaction, switch language, then reopen it.
      await page.keyboard.press('Escape');
      await expect(page.locator('#pizzaPickerOverlay')).not.toHaveClass(/\bopen\b/);
      await page.locator('#langEn').click();
      await page.locator('#pizzaRecipeAllButton').click();
      await expect(page.locator('#pizzaPickerOverlay')).toHaveClass(/\bopen\b/);
      await expect(page.locator('#pizzaPickerPreview .sauce-choice-action')).toHaveText('Choose another sauce');
      await expect(page.locator('#sauceType option')).toHaveCount(7);
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
