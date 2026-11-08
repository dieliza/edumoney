import { expect, test } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import { mkdirSync } from 'node:fs';
const evidence = 'docs/stages/evidence';
mkdirSync(evidence, { recursive: true });
test('navegación, temas, automático y persistencia', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByTestId('enter-demo').click();
  await expect(page.getByText('DEMOSTRACIÓN · DATOS FICTICIOS').filter({ visible: true })).toBeVisible();
  for (const theme of ['dark', 'light'] as const) {
    await page.getByTestId('theme-picker-open').filter({ visible: true }).click();
    await page.getByTestId(`theme-choice-${theme}`).click();
    await expect(page.getByTestId(`theme-${theme}`).filter({ visible: true })).toBeVisible();
    await page.screenshot({ path: `${evidence}/02-${theme}-money.png`, fullPage: true });
    for (const label of ['Mis metas', 'Aprende', 'Mi progreso', 'Mi dinero']) {
      await page.getByRole('tab', { name: label }).click();
      await expect(page.getByRole('heading', { name: label, exact: true })).toBeVisible();
      await expect(page.getByText('DEMOSTRACIÓN · DATOS FICTICIOS').filter({ visible: true })).toBeVisible();
    }
    await page.reload();
    await expect(page.getByTestId(`theme-${theme}`).filter({ visible: true })).toBeVisible();
  }
  await page.getByTestId('theme-picker-open').filter({ visible: true }).click();
  await page.getByTestId('theme-choice-automatic').click();
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.getByTestId('theme-dark').filter({ visible: true })).toBeVisible();
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.getByTestId('theme-light').filter({ visible: true })).toBeVisible();
  await page.reload();
  await expect(page.getByTestId('theme-light').filter({ visible: true })).toBeVisible();
  await page.getByTestId('theme-picker-open').filter({ visible: true }).click();
  await expect(page.getByRole('radio', { name: 'Automático', exact: true })).toHaveAttribute('aria-checked', 'true');
  expect(errors).toEqual([]);
});
test('pantallas, contraste y ancho de dispositivo', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByTestId('enter-demo').click();
  for (const theme of ['dark', 'light'] as const) {
    await page.getByTestId('theme-picker-open').filter({ visible: true }).click();
    await page.getByTestId(`theme-choice-${theme}`).click();
    for (const [label, slug] of [['Mis metas', 'goals'], ['Aprende', 'learn'], ['Mi progreso', 'progress']] as const) {
      await page.getByRole('tab', { name: label }).click();
      await expect(page.getByRole('heading', { name: label, exact: true })).toBeVisible();
      await page.screenshot({ path: `${evidence}/02-${theme}-${slug}.png`, fullPage: true });
      const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(result.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
    }
    await page.getByRole('tab', { name: 'Mi dinero' }).click();
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(result.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
  }
  for (const width of [320, 375, 430, 768, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByRole('tab', { name: 'Mi progreso' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});


test('bienvenida, selector y acciones de demostración', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await expect(page.getByTestId('enter-demo')).toBeVisible();
  for (const theme of ['light', 'dark'] as const) {
    await page.getByTestId('theme-picker-open').click();
    await page.getByTestId(`theme-choice-${theme}`).click();
    await page.screenshot({ path: `${evidence}/02-${theme}-welcome.png`, fullPage: true });
  }
  await page.getByTestId('theme-picker-open').click();
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(result.violations.map(v => v.id)).toEqual([]);
  await page.screenshot({ path: `${evidence}/02-theme-picker.png` });
  await page.getByRole('button', { name: 'Cerrar selector de tema' }).click();
  await page.getByTestId('enter-demo').click();
  await page.getByRole('button', { name: 'Añadir ingreso', exact: true }).click();
  await expect(page.getByText('Estás explorando una demostración de EduMoney. Las cantidades son ficticias y no se guardarán movimientos.')).toBeVisible();
  await page.getByRole('button', { name: 'Seguir explorando' }).click();
  await expect(page.getByRole('heading', { name: 'Mi dinero', exact: true })).toBeVisible();
});
