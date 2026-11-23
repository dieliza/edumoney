import { expect, test } from '@playwright/test';

test('Planilla guiada persiste y descarga sin radicar', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('/planilla?year=2025');
  await page.getByTestId('web-password').fill('QA-example-only-2025!');
  await page.getByTestId('web-password-repeat').fill('QA-example-only-2025!');
  await page.getByTestId('web-unlock').click();
  await expect(page.getByText('¿De dónde vinieron tus ingresos?', {exact:false})).toBeVisible({timeout:25000});
  const salaryProfile = page.getByRole('radiogroup', {name:'Empleado con salario', exact:true});
  await salaryProfile.getByRole('radio', {name:'Incluir', exact:true}).click();
  const residency = page.getByRole('radiogroup', {name:'¿Viviste en Puerto Rico durante todo el año?', exact:true});
  await expect(residency).toBeVisible();
  await residency.getByRole('radio', {name:'Sí', exact:true}).click();
  await page.getByTestId('closure-reason').fill('Prueba ficticia de cierre');
  await page.getByTestId('closure-save').click();
  await expect(page.getByText('Entrevista guardada en el expediente local.',{exact:false})).toBeVisible();
  await page.reload();
  await page.getByTestId('web-password').fill('QA-example-only-2025!');
  await page.getByTestId('web-unlock').click();
  await expect(residency.getByRole('radio',{name:'Sí',exact:true})).toHaveAttribute('aria-checked','true',{timeout:25000});
  for (const id of ['closure-annual-pdf','closure-withholding-pdf']) {
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId(id).click()]);
    expect(download.suggestedFilename()).toMatch(/EduMoney-.*-2025\.pdf/);
    expect(await download.failure()).toBeNull();
  }
  await page.getByTestId('closure-review').click();
  const [final] = await Promise.all([page.waitForEvent('download'),page.getByTestId('closure-pdf-share').click()]);
  expect(final.suggestedFilename()).toBe('EduMoney-cierre-2025-no-radicado.pdf');
  expect(await final.failure()).toBeNull();
});
