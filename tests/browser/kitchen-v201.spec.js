'use strict';
const {test,expect}=require('playwright/test');
for(const path of ['/index.html','/src/index.html'])test.describe(`kitchen workbench ${path}`,()=>{
  async function open(page){await page.goto(path);await expect(page.locator('html')).toHaveAttribute('data-app-ready','true');}
  test('individual steps are visible immediately and persist without inventing checkpoints',async({page})=>{
    await open(page);await page.getByRole('button',{name:'Keuken',exact:true}).click();
    await expect(page.locator('#kitchenInstructions')).not.toHaveAttribute('open','');
    for(const key of ['weigh','mix','rest','knead','devcheck','shape','bake'])await expect(page.locator(`#step-check-s-${key}`)).toBeVisible();
    const before=await page.evaluate(()=>snapshotRecipe());
    await page.locator('#step-check-s-weigh').check();await page.locator('#step-check-s-rest').check();
    await expect(page.locator('#step-check-s-mix')).not.toBeChecked();await expect(page.locator('#step-check-s-knead')).not.toBeChecked();
    expect(await page.evaluate(()=>activeEvening())).toBeNull();
    await page.getByRole('button',{name:'Plan',exact:true}).click();await page.getByRole('button',{name:'Keuken',exact:true}).click();
    await expect(page.locator('#step-check-s-weigh')).toBeChecked();await expect(page.locator('#step-check-s-rest')).toBeChecked();
    await page.locator('#langEn').click();await expect(page.locator('#kitchenStepsTitle')).toHaveText('Step by step');
    await page.getByRole('button',{name:'Proof',exact:true}).click();await expect(page.locator('#kitchen-proof')).toBeFocused();
    await page.reload();await expect(page.locator('html')).toHaveAttribute('data-app-ready','true');
    await expect(page.locator('#step-check-s-weigh')).toBeChecked();await expect(page.locator('#step-check-s-rest')).toBeChecked();
    expect(await page.evaluate(()=>snapshotRecipe())).toEqual(before);
    await page.locator('#step-check-s-rest').uncheck();await expect(page.locator('#step-check-s-weigh')).toBeChecked();
  });
  test('step checkmarks belong to the selected mixer run',async({page})=>{
    await open(page);await page.locator('#pizzas').fill('8');await page.locator('#pizzas').blur();
    await page.locator('#eveningSplitDetails > summary').click();await page.locator('#splitCapacity').fill('900');await page.locator('#splitCapacity').blur();
    await page.locator('#eveningPlan [data-evening-action="start"]').click();
    await page.locator('#step-check-s-weigh').check();await page.locator('#step-check-s-devcheck').check();
    await page.locator('[data-evening-action="event-now"]').click();await page.locator('[data-evening-action="start-run"]').click();
    await expect(page.locator('#step-check-s-weigh')).not.toBeChecked();await expect(page.locator('#step-check-s-devcheck')).not.toBeChecked();
    await page.locator('#step-check-s-mix').check();
    await page.locator('[data-evening-action="select-run"]').first().click();
    await expect(page.locator('#step-check-s-weigh')).toBeChecked();await expect(page.locator('#step-check-s-devcheck')).toBeChecked();
    await page.reload();await expect(page.locator('html')).toHaveAttribute('data-app-ready','true');
    await expect(page.locator('#step-check-s-weigh')).toBeChecked();
    await page.locator('[data-evening-action="select-run"]').nth(1).click();
    await expect(page.locator('#step-check-s-mix')).toBeChecked();await expect(page.locator('#step-check-s-weigh')).not.toBeChecked();
  });
});
