// Your tests live here. Each test() is one small check.
const { test, expect } = require('@playwright/test');

// TEST 1 (done for you): the fun page loads and nothing crashes.
test('fun page loads with no errors', async ({ page }) => {
  const errors = [];
  // pageerror = a JavaScript crash on the page. We collect them.
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('/index.html');
  await page.waitForTimeout(2000); // give the alley a moment to start

  await expect(page).toHaveTitle(/.+/); // the page has some title
  expect(errors).toEqual([]);           // and no crashes were collected
});

// TEST 2 (your turn): the ANTI-FUN button leads to the serious page.
// Hints:
//   - the button is  page.locator('#afun')
//   - click it with  await page.locator('#afun').click();
//   - then check     await expect(page).toHaveURL(/serious\.html/);
test.skip('ANTI-FUN button opens the serious page', async ({ page }) => {
  // write me!
});

// TEST 3 (your turn): the Day button changes something.
// Hints:
//   - the button is  page.locator('#day')
//   - clicking it adds a class called "day" to the <html> tag (open the site,
//     press F12, click Day and watch the <html> line at the top change).
//     Check it with:  await expect(page.locator('html')).toHaveClass(/day/);
//   - the button's text also flips from "DAY" to "NIGHT" if you want a second check.
test.skip('Day button toggles daytime', async ({ page }) => {
  // write me!
});
