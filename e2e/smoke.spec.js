const { test, expect } = require('@playwright/test');

// The page loads without errors; `npm run screenshot` also saves preview.png (link previews, projects page).
const APP = '/';
const PREVIEW = 'preview.png';
const READY = '#facts .fact';

test('app loads without errors @desktop', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.goto(APP);
  await expect(page.locator(READY).first()).toBeVisible();
  expect(errors).toEqual([]);
  if (process.env.UPDATE_PREVIEW) {
    await page.waitForTimeout(750);
    await page.screenshot({ path: PREVIEW });
  }
});

test('findings read exactly as on the original page', async ({ page }) => {
  await page.goto(APP);
  const facts = page.locator('#facts .fact');
  await expect(facts).toHaveCount(4);
  await expect(facts.nth(0)).toContainText('270 / 310');
  await expect(facts.nth(1)).toContainText('32 up · 8 down');
  await expect(facts.nth(2)).toContainText('1,110');
  await expect(facts.nth(2)).toContainText('(154.03, Upper East Side-Yorkville)');
  await expect(facts.nth(3)).toContainText('403 → 417');
  await expect(facts.nth(3)).toContainText('Up 3.5%.');
});

test('year and change views switch the legend and the big label', async ({ page }) => {
  await page.goto(APP);
  await expect(page.locator('#yr')).toHaveText('2020');
  await page.locator('#v10').click();
  await expect(page.locator('#yr')).toHaveText('2010');
  await expect(page.locator('#v10')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#legend')).toContainText('1,200–2,400');
  await page.locator('#vch').click();
  await expect(page.locator('#yr')).toHaveText('2010→2020');
  await expect(page.locator('#legend')).toContainText('Within ±10');
});

test('hovering a tract shows its numbers @desktop', async ({ page }) => {
  await page.goto(APP);
  await expect(page.locator(READY).first()).toBeVisible();
  const box = await page.locator('#cv').boundingBox();
  let shown = false;
  for (let fx = 0.3; fx <= 0.7 && !shown; fx += 0.05) {
    await page.mouse.move(box.x + box.width * fx, box.y + box.height * 0.6);
    shown = await page.locator('#tip').isVisible();
  }
  expect(shown).toBe(true);
  await expect(page.locator('#tip')).toContainText('p/ha');
});

test('nothing scrolls sideways and the footer shows contact and version', async ({ page }) => {
  await page.goto(APP);
  const w = page.viewportSize().width;
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(w);
  await expect(page.locator('footer')).toContainText('corey.sciuto+manhattan@gmail.com');
  await expect(page.locator('.version')).toHaveText(/^(dev|v1\.\d+)$/);
});

test('contact and a link back to the projects page', async ({ page }) => {
  for (const p of [APP]) {
    await page.goto(p);
    await expect(page.getByText(/corey\.sciuto\+\w+@gmail\.com/).first()).toBeAttached();
    await expect(page.locator('a[href="https://corey.sciu.to/projects/"]').first()).toBeAttached();
  }
});
