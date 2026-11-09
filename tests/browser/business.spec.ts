import { expect,test } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import { mkdirSync } from 'node:fs';
test('Negocio: pestaña, ambos temas, contraste y anchos pequeños',async({page})=>{
 mkdirSync('docs/stages/evidence/business01',{recursive:true});
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');
 await page.getByTestId('enter-demo').click();
 await page.getByRole('tab',{name:'Negocio',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Negocio',exact:true})).toBeVisible();
 await expect(page.getByText('Esta vista del navegador no guarda información comercial.',{exact:false})).toBeVisible();
 for(const theme of ['light','dark'] as const){
  await page.getByTestId('theme-picker-open').filter({visible:true}).click();
  await page.getByTestId(`theme-choice-${theme}`).click();
  await expect(page.getByTestId(`theme-${theme}`).filter({visible:true})).toBeVisible();
  const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  expect(audit.violations.map(v=>v.id)).toEqual([]);
  await page.screenshot({path:`docs/stages/evidence/business01/web-${theme}.png`,fullPage:true});
 }
 for(const width of [320,375,430,768]){
  await page.setViewportSize({width,height:900});
  await expect(page.getByRole('tab',{name:'Negocio',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
});
test('Negocio: ruta de registros, regreso y temas compartidos',async({page})=>{
 mkdirSync('docs/stages/evidence/business02',{recursive:true});
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');await page.getByTestId('enter-demo').click();
 await page.getByRole('tab',{name:'Negocio',exact:true}).click();
 await page.getByRole('button',{name:'Ver sección de registros comerciales'}).click();
 await expect(page.getByRole('heading',{name:'Movimientos de Negocio',exact:true})).toBeVisible();
 await expect(page.getByText('Esta vista del navegador no guarda movimientos.',{exact:false})).toBeVisible();
 for(const theme of ['light','dark'] as const){
  await page.getByTestId('theme-picker-open').filter({visible:true}).click();await page.getByTestId(`theme-choice-${theme}`).click();
  const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(audit.violations.map(v=>v.id)).toEqual([]);
  await page.screenshot({path:`docs/stages/evidence/business02/web-${theme}.png`,fullPage:true});
 }
 await page.getByRole('button',{name:'Volver a Negocio',exact:true}).click();await expect(page.getByRole('heading',{name:'Negocio',exact:true})).toBeVisible();
});
test('Negocio: IVU y contratistas, fuentes y navegación en ambos temas',async({page})=>{
 mkdirSync('docs/stages/evidence/business03',{recursive:true});
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');await page.getByTestId('enter-demo').click();
 await page.getByRole('tab',{name:'Negocio',exact:true}).click();
 await page.getByRole('button',{name:'Ver IVU y contratistas',exact:true}).click();
 await expect(page.getByRole('heading',{name:'IVU y contratistas',exact:true})).toBeVisible();
 for(const theme of ['light','dark'] as const){
  await page.getByTestId('theme-picker-open').filter({visible:true}).click();await page.getByTestId(`theme-choice-${theme}`).click();
  for(const flow of ['IVU','Contratistas']){
   await page.getByRole('radio',{name:flow,exact:true}).click();
   await expect(page.getByRole('radio',{name:flow,exact:true})).toHaveAttribute('aria-checked','true');
   if(flow==='Contratistas')await expect(page.getByText('Escenario ficticio ordinario:',{exact:false})).toBeVisible();
   const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(audit.violations.map(v=>v.id)).toEqual([]);
   await page.screenshot({path:`docs/stages/evidence/business03/${flow}-${theme}.png`,fullPage:true});
  }
 }
 for(const width of [320,430,768]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.getByRole('button',{name:'Volver a Negocio',exact:true}).click();await expect(page.getByRole('heading',{name:'Negocio',exact:true})).toBeVisible();
});
test('Negocio: panel, escenarios y calendario en ambos temas',async({page})=>{
 mkdirSync('docs/stages/evidence/business04',{recursive:true});
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');await page.getByTestId('enter-demo').click();
 await page.getByRole('tab',{name:'Negocio',exact:true}).click();
 await page.getByRole('button',{name:'Ver panel y escenarios',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Panel de Negocio',exact:true})).toBeVisible();
 for(const theme of ['light','dark'] as const){
  await page.getByTestId('theme-picker-open').filter({visible:true}).click();await page.getByTestId(`theme-choice-${theme}`).click();
  for(const tab of ['Resultado y efectivo','Comparar escenarios','Calendario']){
   await page.getByRole('radio',{name:tab,exact:true}).click();
   await expect(page.getByRole('radio',{name:tab,exact:true})).toHaveAttribute('aria-checked','true');
   const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(audit.violations.map(v=>v.id)).toEqual([]);
   await page.screenshot({path:`docs/stages/evidence/business04/${tab.split(' ')[0]}-${theme}.png`,fullPage:true});
  }
 }
 for(const width of [320,430,768]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.getByRole('button',{name:'Volver a Negocio',exact:true}).click();await expect(page.getByRole('heading',{name:'Negocio',exact:true})).toBeVisible();
});
