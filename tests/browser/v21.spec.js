'use strict';
const {test,expect}=require('playwright/test');

for(const path of ['/index.html','/src/index.html'])test.describe(`v2.1 features ${path}`,()=>{
  async function open(page){await page.goto(path);await expect(page.locator('html')).toHaveAttribute('data-app-ready','true');}
  async function shopping(page){await page.locator('#shoppingPlanCard > summary').click();}
  async function addManual(page,name,quantity='2',unit='st'){
    const form=page.locator('#shoppingPlan .shopping-add-form');
    await form.locator('[data-shopping-name]').fill(name);
    await form.locator('[data-shopping-quantity]').fill(quantity);
    await form.locator('[data-shopping-unit]').selectOption(unit);
    await form.locator('[data-shopping-action="add"]').click();
  }

  test('dough-only link previews without changing data, then loads explicitly',async({page,browser})=>{
    await open(page);await page.locator('#hydration').fill('67');await page.locator('#hydration').blur();
    await page.locator('#shareDoughButton').click();
    const link=await page.locator('[data-dough-share-url]').inputValue();
    expect(link).toContain('#dough=');
    expect(link).not.toContain('margherita');
    const shared=await page.evaluate(()=>decodeDoughLink(location.hash.slice(7))); // no hash on sender
    expect(shared).toBeNull();
    const receiver=await browser.newContext();const receivingPage=await receiver.newPage();
    await receivingPage.goto(link);await expect(receivingPage.locator('html')).toHaveAttribute('data-app-ready','true');
    await expect(receivingPage.locator('#recipeLinkPanel')).toContainText('Gedeeld deegrecept');
    await expect(receivingPage.locator('#hydration')).toHaveValue('63');
    await receivingPage.locator('[data-dough-link-action="apply"]').click();
    await expect(receivingPage.locator('#hydration')).toHaveValue('67');
    expect(await receivingPage.evaluate(()=>({fragment:location.hash,mode:appMode,selected:pizzaSelections[0],saved:JSON.parse(localStorage.getItem(SAVE_KEY)).version}))).toEqual({fragment:'',mode:'full',selected:'margherita',saved:54});
    await receiver.close();
  });

  test('invalid share fragment leaves existing dough unchanged',async({page})=>{
    await page.goto(`${path}#dough=invalid-encoding`);
    await expect(page.locator('html')).toHaveAttribute('data-app-ready','true');
    await expect(page.locator('#recipeLinkPanel')).toContainText('ongeldig');
    await expect(page.locator('#hydration')).toHaveValue('63');
    await page.locator('[data-dough-link-action="close"]').count().then(count=>expect(count).toBe(0));
  });

  test('shopping combines dough, sauce and toppings; quantities invalidate bought items',async({page})=>{
    await open(page);await shopping(page);
    const list=page.locator('#shoppingPlan');
    await expect(list).toContainText('Pizzabloem');
    await expect(list).toContainText('Tomaten voor saus');
    await expect(list).toContainText('Fior di latte');
    const flour=list.locator('[data-shopping-check]').first();
    await flour.check();expect(await page.evaluate(()=>Object.values(evenings.shopping.draft.checked).some(v=>v.checked))).toBe(true);
    await page.locator('#pizzas').fill('6');await page.locator('#pizzas').blur();
    await expect(list.locator('[data-shopping-check]').first()).not.toBeChecked();
    await expect(list).toContainText('Hoeveelheid gewijzigd');
    await addManual(page,'Frisdrank','3','l');
    await expect(list).toContainText('Frisdrank');
    await list.locator('[data-shopping-manual]').check();
    await page.reload();await expect(page.locator('html')).toHaveAttribute('data-app-ready','true');
    await shopping(page);await expect(page.locator('[data-shopping-manual]')).toBeChecked();
    await page.locator('#shoppingPlan [data-shopping-action="edit"]').click();
    await page.locator('#shoppingPlan [data-shopping-edit-form] [data-shopping-quantity]').fill('4');
    await page.locator('#shoppingPlan [data-shopping-action="save-edit"]').click();
    await expect(page.locator('#shoppingPlan [data-shopping-manual]')).not.toBeChecked();
    await expect(page.locator('#shoppingPlan')).toContainText('4 l');
  });

  test('favorites repeat an evening with manual items but no purchased checkmarks',async({page})=>{
    await open(page);await shopping(page);await addManual(page,'Servetten','12','st');
    await page.locator('[data-shopping-manual]').first().check();
    await page.locator('#eveningCollectionDetails > summary').click();
    await page.locator('#eveningTemplateName').fill('Zaterdag');
    await page.locator('[data-evening-action="save-template"]').click();
    await page.locator('[data-evening-action="toggle-favorite"]').click();
    await expect(page.locator('#favoriteQuickPanel')).toContainText('Zaterdag');
    await page.reload();await expect(page.locator('html')).toHaveAttribute('data-app-ready','true');
    await page.locator('#favoriteQuickPanel [data-evening-action="load-template"]').click();
    await expect(page.locator('#shoppingPlan')).toContainText('Servetten');
    await expect(page.locator('#shoppingPlan [data-shopping-manual]')).not.toBeChecked();
    expect(await page.evaluate(()=>({favorites:evenings.favoriteIds.length,manual:evenings.shopping.draft.manual.length,date:evenings.draft.date}))).toEqual({favorites:1,manual:1,date:''});
  });

  test('schema 53 active evening, history and templates migrate intact to 54',async({page})=>{
    await open(page);await page.locator('#eveningCollectionDetails > summary').click();
    await page.locator('#eveningTemplateName').fill('Legacy favorite');
    await page.locator('[data-evening-action="save-template"]').click();
    await page.locator('#eveningPlan [data-evening-action="start"]').click();
    const before=await page.evaluate(()=>{
      const state=stateSnapshot();state.version=53;delete state.evenings.shopping;delete state.evenings.favoriteIds;
      localStorage.setItem('pizzaCalcV53',JSON.stringify(state));localStorage.removeItem('pizzaCalcV54');
      return {evening:state.evenings.active.id,templates:state.evenings.templates.length};
    });
    await page.reload();await expect(page.locator('html')).toHaveAttribute('data-app-ready','true');
    expect(await page.evaluate(()=>({evening:activeEvening()?.id,templates:evenings.templates.length,version:JSON.parse(localStorage.getItem('pizzaCalcV54')).version,legacy:localStorage.getItem('pizzaCalcV53')}))).toEqual({evening:before.evening,templates:before.templates,version:54,legacy:null});
  });
});
