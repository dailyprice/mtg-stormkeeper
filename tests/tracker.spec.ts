import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('counts rapid taps, keeps land plays separate, and restores after reload', async ({ page }) => {
  const redPlus = page.getByRole('button', { name: 'Increase red', exact: true });
  for (let i = 0; i < 12; i++) await redPlus.click({ delay: 5 });
  await page.getByRole('button', { name: 'Increase storm count', exact: true }).click();
  await page.getByRole('button', { name: 'Increase lands played', exact: true }).click();
  await expect(page.locator('[data-edit="R"]')).toHaveText('12');
  await expect(page.locator('#mana-total')).toHaveText('12');
  await expect(page.locator('[data-edit="storm"]')).toHaveText('1');
  await expect(page.locator('[data-edit="lands"]')).toHaveText('1');
  await page.reload();
  await expect(page.locator('[data-edit="R"]')).toHaveText('12');
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.locator('[data-edit="lands"]')).toHaveText('0');
  await expect(page.locator('[data-edit="storm"]')).toHaveText('1');
  await expect(page.getByRole('button', { name: 'Decrease lands played', exact: true })).toBeDisabled();
});

test('clear mana and new turn are independently undoable', async ({ page }) => {
  for (const name of ['Increase white', 'Increase blue', 'Increase lands played', 'Increase storm count']) {
    await page.getByRole('button', { name, exact: true }).click();
  }
  await page.getByRole('button', { name: 'Clear mana', exact: true }).click();
  await expect(page.locator('#mana-total')).toHaveText('0');
  await expect(page.locator('[data-edit="lands"]')).toHaveText('1');
  await expect(page.locator('[data-edit="storm"]')).toHaveText('1');
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.locator('#mana-total')).toHaveText('2');
  await page.getByRole('button', { name: 'New turn', exact: true }).click();
  await expect(page.locator('#turn-number')).toHaveText('02');
  await expect(page.locator('#mana-total')).toHaveText('0');
  await expect(page.locator('[data-edit="lands"]')).toHaveText('0');
  await expect(page.locator('[data-edit="storm"]')).toHaveText('0');
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.locator('#turn-number')).toHaveText('01');
  await expect(page.locator('#mana-total')).toHaveText('2');
  await expect(page.locator('[data-edit="lands"]')).toHaveText('1');
});

test('direct input validates amounts, saves large counts, and cancels cleanly', async ({ page }) => {
  await page.locator('[data-edit="G"]').click();
  await page.getByLabel('New amount', { exact: true }).fill('-1');
  await page.getByRole('button', { name: 'Save amount' }).click();
  await expect(page.getByRole('alert')).toContainText('whole number');
  await page.getByLabel('New amount', { exact: true }).fill('1000000');
  await page.getByRole('button', { name: 'Save amount' }).click();
  await expect(page.locator('[data-edit="G"]')).toHaveText('1000000');
  await expect(page.locator('#mana-total')).toHaveText('1,000,000');
  await page.locator('[data-edit="G"]').click();
  await page.getByLabel('New amount', { exact: true }).fill('5');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.locator('[data-edit="G"]')).toHaveText('1000000');
  // Large amounts must remain inside the number button, clear of +/- targets.
  await page.setViewportSize({ width: 320, height: 568 });
  await page.evaluate(() => document.fonts.ready);
  for (const amount of ['999', '999999', '999999999']) {
    await page.locator('[data-edit="G"]').click();
    await page.getByLabel('New amount', { exact: true }).fill(amount);
    await page.getByRole('button', { name: 'Save amount' }).click();
    const fits = await page.locator('[data-edit="G"]').evaluate((button) => {
      const range = document.createRange();
      range.selectNodeContents(button);
      return range.getBoundingClientRect().width <= button.getBoundingClientRect().width;
    });
    expect(fits).toBe(true);
  }
});

test('the built app reloads and remains usable offline', async ({ page, context }) => {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise<void>((resolve) => navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true }));
  });
  await page.getByRole('button', { name: 'Increase black', exact: true }).click();
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('[data-edit="B"]')).toHaveText('1');
  await page.getByRole('button', { name: 'Increase black', exact: true }).click();
  await expect(page.locator('[data-edit="B"]')).toHaveText('2');
  await page.getByRole('button', { name: 'Help and settings' }).click();
  await expect(page.locator('#offline-status')).toHaveText('Ready to use offline.');
});

test('blocked storage does not prevent counting and gives an honest save status', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new Error('Storage unavailable'); };
  });
  await page.reload();
  await page.getByRole('button', { name: 'Increase colorless', exact: true }).click();
  await expect(page.locator('[data-edit="C"]')).toHaveText('1');
  await expect(page.locator('#save-status')).toContainText('Saving unavailable');
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.locator('[data-edit="C"]')).toHaveText('0');
});

test('phone layout fits and all counter controls have usable touch targets', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: testInfo.outputPath('phone.png'), fullPage: true });
  const layout = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    height: document.documentElement.scrollHeight,
    targets: [...document.querySelectorAll('button[data-counter]')].map((button) => {
      const rect = button.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    }),
  }));
  expect(layout.width).toBeLessThanOrEqual(375);
  expect(layout.height).toBeLessThanOrEqual(667);
  for (const target of layout.targets) {
    expect(target.width).toBeGreaterThanOrEqual(44);
    expect(target.height).toBeGreaterThanOrEqual(44);
  }
  await page.setViewportSize({ width: 320, height: 568 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
  await page.getByRole('button', { name: 'New turn', exact: true }).click();
  await expect(page.locator('#turn-number')).toHaveText('02');
});
