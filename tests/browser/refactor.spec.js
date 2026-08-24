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

async function installFeedbackMock(page,{status=201,code='',issueNumber=42}={}){
  const state={payload:null,postCount:0};
  await page.addInitScript(()=>{
    window.PIZZA_FEEDBACK_API_URL='http://127.0.0.1:4173/__feedback_api';
    window.turnstile={
      render(container,options){
        window.__feedbackTurnstileOptions=options;
        const marker=document.createElement('div');
        marker.dataset.testTurnstile='ready';
        marker.textContent='Turnstile test widget';
        container.appendChild(marker);
        queueMicrotask(()=>options.callback('browser-test-token'));
        return 'browser-test-widget';
      },
      remove(){},
      reset(){queueMicrotask(()=>window.__feedbackTurnstileOptions?.callback('browser-test-token-renewed'));}
    };
  });
  await page.route('**/__feedback_api/config',route=>route.fulfill({
    status:200,
    contentType:'application/json',
    body:JSON.stringify({enabled:true,siteKey:'1x00000000000000000000AA'})
  }));
  await page.route('**/__feedback_api/feedback',async route=>{
    state.postCount++;
    state.payload=route.request().postDataJSON();
    const ok=status>=200&&status<300;
    await route.fulfill({
      status,
      contentType:'application/json',
      body:JSON.stringify(ok
        ? {ok:true,issueUrl:`https://github.com/hound83/pizza-dough-calculator/issues/${issueNumber}`,issueNumber}
        : {ok:false,code:code||'service_unavailable'})
    });
  });
  return state;
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

        await expect(page).toHaveTitle('Pizzadeegcalculator v1.3.0');
        await expect(page.locator('#page0')).toHaveClass(/\bactive\b/);
        await expect(page.locator('[data-mode-card="full"]')).toBeVisible();

        const runtime=await page.evaluate(()=>({
          appVersion:APP_VERSION,
          hasCalculator:typeof calc==='function',
          horizontalOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth
        }));
        expect(runtime).toEqual({appVersion:'1.3.0',hasCalculator:true,horizontalOverflow:0});
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
      const weigh=page.locator('[data-step-key="s-weigh"]');
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
      const weigh=page.locator('[data-step-key="s-weigh"]');

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

    test('submits bilingual anonymous feedback with only opted-in safe context',async({page})=>{
      const failures=observeBrowserFailures(page);
      const feedback=await installFeedbackMock(page);
      await page.setViewportSize({width:320,height:700});
      await page.goto(publication.path,{waitUntil:'load'});
      await page.locator('#langEn').click();
      await page.locator('#feedbackButton').click();

      await expect(page.locator('#feedbackTitle')).toHaveText('Send feedback');
      await expect(page.locator('#feedbackIntro')).toContainText('No GitHub account');
      await expect(page.locator('#feedbackPrivacy')).toContainText('public GitHub issue');
      await expect(page.locator('#feedbackThirdParty')).toContainText('anti-bot check');
      await expect(page.locator('#feedbackThirdParty a')).toHaveAttribute('href','https://www.cloudflare.com/privacypolicy/');
      await expect(page.locator('#feedbackIncludeDiagnostics')).not.toBeChecked();
      await expect(page.locator('#feedbackSendButton')).toBeEnabled();
      await expect(page.locator('#feedbackModal')).toHaveAttribute('aria-hidden','false');
      await expect(page.locator('.app')).toHaveAttribute('aria-hidden','true');

      const metrics=await page.evaluate(()=>{
        const panel=document.querySelector('#feedbackPanel').getBoundingClientRect();
        return {
          documentOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
          panelFits:panel.left>=-1&&panel.right<=innerWidth+1&&panel.top>=-1&&panel.bottom<=innerHeight+1,
          panelOverflow:document.querySelector('#feedbackPanel').scrollWidth-document.querySelector('#feedbackPanel').clientWidth
        };
      });
      expect(metrics.documentOverflow).toBe(0);
      expect(metrics.panelFits).toBe(true);
      expect(metrics.panelOverflow).toBeLessThanOrEqual(1);

      await page.locator('#feedbackCategory').selectOption('bug');
      await page.locator('#feedbackSummary').fill('Picker button is clipped');
      await page.locator('#feedbackMessage').fill('The final picker button is outside the visible phone screen.');
      await page.locator('#feedbackSteps').fill('Open Complete pizzas, open the picker, then choose Salami.');
      await page.locator('#feedbackIncludeDiagnostics').check();
      await page.locator('#feedbackSendButton').click();

      await expect(page.locator('#feedbackStatus')).toHaveText('Thank you! Your feedback was saved as a GitHub issue.');
      await expect(page.locator('#feedbackIssueLink')).toBeVisible();
      await expect(page.locator('#feedbackIssueLink')).toHaveAttribute('href','https://github.com/hound83/pizza-dough-calculator/issues/42');
      expect(feedback.postCount).toBe(1);
      expect(feedback.payload).toMatchObject({
        category:'bug',summary:'Picker button is clipped',language:'en',turnstileToken:'browser-test-token',
        diagnostics:{appVersion:'1.3.0',language:'en',experienceMode:'basic',outputMode:'full',wizardPage:0,viewport:'320x700'}
      });
      expect(Object.keys(feedback.payload.diagnostics).sort()).toEqual(['appVersion','experienceMode','language','outputMode','viewport','wizardPage'].sort());
      expect(JSON.stringify(feedback.payload)).not.toMatch(/hydration|yeastPct|bakeLog|localStorage|email/i);
      await page.locator('#feedbackCloseButton').click();
      await expect(page.locator('#feedbackModal')).toHaveAttribute('aria-hidden','true');
      await expect(page.locator('.app')).not.toHaveAttribute('aria-hidden');
      await expect(page.locator('#feedbackButton')).toBeFocused();
      expect(failures).toEqual([]);
    });

    test('keeps the calculator usable when anonymous feedback is not configured',async({page})=>{
      const failures=observeBrowserFailures(page);
      await page.goto(publication.path,{waitUntil:'load'});
      await page.locator('#feedbackButton').click();
      await expect(page.locator('#feedbackStatus')).toHaveText('De feedbackservice is nog niet geconfigureerd. Er is niets verstuurd.');
      await expect(page.locator('#feedbackSendButton')).toBeDisabled();
      await expect(page.locator('#feedbackTurnstile')).toBeEmpty();
      await page.locator('#feedbackCloseButton').click();
      await page.locator('[data-mode-card="dough"]').click();
      await expect(page.locator('#page1')).toHaveClass(/\bactive\b/);
      expect(await page.evaluate(()=>({version:APP_VERSION,flour:calc().flour}))).toEqual({version:'1.3.0',flour:expect.any(Number)});
      expect(failures).toEqual([]);
    });

    test('preserves a feedback draft and shows a safe retry path after backend failure',async({page})=>{
      const feedback=await installFeedbackMock(page,{status:502,code:'service_unavailable'});
      await page.goto(publication.path,{waitUntil:'load'});
      await page.locator('#feedbackButton').click();
      await expect(page.locator('#feedbackSendButton')).toBeEnabled();
      await page.locator('#feedbackCategory').selectOption('idea');
      await page.locator('#feedbackSummary').fill('Maak de tijdlijn compacter');
      await page.locator('#feedbackMessage').fill('De tijdlijn neemt op mijn telefoon erg veel verticale ruimte in.');
      await page.locator('#feedbackSendButton').click();
      await expect(page.locator('#feedbackStatus')).toHaveText('De feedbackservice is nu niet bereikbaar. Je tekst blijft staan; probeer het later opnieuw.');
      await expect(page.locator('#feedbackSummary')).toHaveValue('Maak de tijdlijn compacter');
      await expect(page.locator('#feedbackMessage')).toHaveValue('De tijdlijn neemt op mijn telefoon erg veel verticale ruimte in.');
      await expect(page.locator('#feedbackSendButton')).toBeEnabled();
      expect(feedback.postCount).toBe(1);
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
