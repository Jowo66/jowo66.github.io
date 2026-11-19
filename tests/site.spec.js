// Your tests live here. Each test() is one small check.
const { test, expect } = require('@playwright/test');

// TEST 1 (done for you): the fun page loads and nothing crashes.
test('fun page loads with no errors', async ({ page }) => {
  const errors = [];
  // pageerror = a JavaScript crash on the page. We collect them.
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('/neo.html');
  await page.waitForTimeout(2000); // give the alley a moment to start

  await expect(page).toHaveTitle(/.+/); // the page has some title
  expect(errors).toEqual([]);           // and no crashes were collected
});

// TEST 2 (your turn): the ANTI-FUN button leads to the home page.
// Start on the fun page first:  await page.goto('/neo.html');
// Hints:
//   - the button is  page.locator('#afun')
//   - click it with  await page.locator('#afun').click();
//   - then check     await expect(page).toHaveURL(/index\.html/);
test.skip('ANTI-FUN button opens the home page', async ({ page }) => {
  // write me!
});

// TEST 3 (your turn): the Day button changes something.
// Hints:
//   - start on the fun page:  await page.goto('/neo.html');
//   - the button is  page.locator('#day')
//   - clicking it adds a class called "day" to the <html> tag (open the site,
//     press F12, click Day and watch the <html> line at the top change).
//     Check it with:  await expect(page.locator('html')).toHaveClass(/day/);
//   - the button's text also flips from "DAY" to "NIGHT" if you want a second check.
test.skip('Day button toggles daytime', async ({ page }) => {
  // write me!
});

// TEST 4: the home page loads with no errors and shows the name.
test('home page loads with no errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('/index.html');
  await expect(page.locator('h1')).toHaveText('Ejovwo Obahor');
  expect(errors).toEqual([]);
});

// TEST 5: the FUN button on the home page opens Neo-Jowo OS.
test('FUN button opens Neo-Jowo OS', async ({ page }) => {
  await page.goto('/index.html');
  await page.locator('#fun').click();
  await expect(page).toHaveURL(/neo\.html/);
});

// TEST 6: every local link and image on the home page exists.
test('home page has no broken local links or images', async ({ page, request }) => {
  await page.goto('/index.html');
  const urls = await page.evaluate(() => {
    const here = location.origin;
    const found = [...document.querySelectorAll('a[href], img[src]')].map((el) => el.href || el.src);
    return [...new Set(found)].filter((u) => u.startsWith(here)).map((u) => u.split('#')[0]);
  });
  for (const url of urls) {
    const res = await request.get(url);
    expect(res.status(), url).toBe(200);
  }
});

// TEST 8: the garden loads, shows six trees, and the grow button works.
test('garden shows six trees and grows them', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('/garden.html');
  await page.waitForFunction(() => window.gardenReady === true);
  await expect(page.locator('canvas[data-url]')).toHaveCount(6);
  await page.locator('#all').click();
  await expect(page.locator('#all')).toHaveText('Show all codes');
  expect(errors).toEqual([]);
});

// TEST 7: the old address still takes visitors to the home page.
test('serious.html redirects to the home page', async ({ page }) => {
  await page.goto('/serious.html');
  await expect(page).toHaveURL(/index\.html/);
});
