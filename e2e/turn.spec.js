const { test, expect } = require('@playwright/test');

// Turning the island and reading a tract, by mouse, finger and keyboard.
const ready = async page => { await page.goto('/'); await expect(page.locator('#facts .fact').first()).toBeVisible(); await page.waitForTimeout(900); };
const picture = page => page.evaluate(() => document.getElementById('cv').toDataURL().length + ':' + document.getElementById('cv').toDataURL().slice(-200));
// a point on the nearest tract's roof, in page coordinates
const roof = page => page.evaluate(() => {
  const r = document.getElementById('cv').getBoundingClientRect();
  for (let k = tops.length - 1; k >= 0; k--) {
    const t = tops[k].poly, c = [t.reduce((s, p) => s + p[0], 0) / t.length, t.reduce((s, p) => s + p[1], 0) / t.length];
    let hit = null; for (let i = tops.length - 1; i >= 0; i--) if (inside(c, tops[i].poly)) { hit = tops[i].t; break; }
    if (hit && hit.id === tops[k].t.id) return { x: r.left + c[0], y: r.top + c[1], id: hit.id };   // its middle is on its own roof
  }
});
const touch = (page, type, x, y) => page.evaluate(([type, x, y]) => document.getElementById('cv').dispatchEvent(new PointerEvent(type, { pointerType: 'touch', pointerId: 7, clientX: x, clientY: y, bubbles: true })), [type, x, y]);

test('the Turn buttons turn the island, from the keyboard too', async ({ page }) => {
  await ready(page);
  const before = await picture(page);
  await page.getByRole('button', { name: 'Turn right' }).click();
  const turned = await picture(page);
  expect(turned).not.toBe(before);
  await page.getByRole('button', { name: 'Turn left' }).focus();
  await page.keyboard.press('Enter');
  expect(await picture(page)).toBe(before);                   // right, then left: back where it was
});

test('a tap on a tract shows its numbers, inside the picture', async ({ page }) => {
  await ready(page);
  await page.locator('#cv').scrollIntoViewIfNeeded();
  const at = await roof(page);
  await expect(page.locator('#tip')).toBeHidden();
  await touch(page, 'pointerdown', at.x, at.y);
  await touch(page, 'pointerup', at.x, at.y);
  const tip = page.locator('#tip');
  await expect(tip).toBeVisible();
  await expect(tip).toContainText('Tract ' + at.id);
  await expect(tip).toContainText('p/ha');
  const [t, s] = [await tip.boundingBox(), await page.locator('#stage').boundingBox()];
  expect(t.x).toBeGreaterThanOrEqual(s.x);
  expect(t.x + t.width).toBeLessThanOrEqual(s.x + s.width + 1);
  // a tap on empty water puts it away
  await touch(page, 'pointerdown', s.x + 6, s.y + 6);
  await touch(page, 'pointerup', s.x + 6, s.y + 6);
  await expect(tip).toBeHidden();
});

test('a finger dragged sideways turns it; a still finger does not', async ({ page }) => {
  await ready(page);
  const box = await page.locator('#cv').boundingBox(), y = box.y + box.height / 2, x = box.x + box.width / 2;
  const before = await picture(page);
  await touch(page, 'pointerdown', x, y);
  await touch(page, 'pointermove', x + 2, y);                 // a wobble, not a drag
  expect(await picture(page)).toBe(before);
  await touch(page, 'pointermove', x + 60, y);
  await touch(page, 'pointerup', x + 60, y);
  expect(await picture(page)).not.toBe(before);
  await expect(page.locator('#tip')).toBeHidden();          // a drag is not a tap
});

test('the page still scrolls up and down over the picture on a phone', async ({ page }) => {
  await ready(page);
  expect(await page.locator('#cv').evaluate(el => getComputedStyle(el).touchAction)).toBe('pan-y');
});
