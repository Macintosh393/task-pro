const { chromium } = require('@playwright/test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const checkDesign = require('./ui-kit-design-checks.cjs');
const base = process.env.UI_KIT_URL || 'http://127.0.0.1:6008';
const output = process.env.UI_KIT_QA_OUTPUT || '/tmp/taskpro-ui-kit-qa';
fs.mkdirSync(output, { recursive: true });
(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-gpu', '--disable-software-rasterizer', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage({ viewport: { width: 900, height: 900 } });
  await page.addInitScript(() => {
    window.qaStoryResults = [];
    const timer = setInterval(() => {
      const channel = window.__STORYBOOK_ADDONS_CHANNEL__;
      if (channel) {
        channel.on('storyFinished', (result) => window.qaStoryResults.push(result));
        clearInterval(timer);
      }
    }, 0);
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const results = [];
  const go = async (story, theme) => {
    await page.goto(`${base}/iframe.html?id=${story}&viewMode=story&globals=theme:${theme}`);
    await page.locator('#storybook-root').waitFor();

    await page.waitForFunction(
      () => document.querySelector('#storybook-root')?.childElementCount > 0,
    );
    await page.waitForFunction(() => window.qaStoryResults.length > 0, null, { timeout: 15000 });
    assert.equal(await page.evaluate(() => window.qaStoryResults.at(-1).status), 'success', story);
  };
  try {
    for (const theme of ['Dark', 'Light', 'Violet']) {
      results.push(await checkDesign({ page, go, theme, output }));
      await go('ui-overview--overview', theme);
      await page.getByRole('heading', { name: 'Small pieces, shared foundations' }).waitFor();
      await page.evaluate(() => document.fonts.ready);
      assert(await page.evaluate(() => document.fonts.check('500 18px Poppins')));
      const accent = await page
        .getByRole('button', { name: 'Save changes', exact: true })
        .evaluate((el) => getComputedStyle(el).backgroundColor);
      assert.equal(accent, theme === 'Violet' ? 'rgb(82, 85, 188)' : 'rgb(190, 219, 176)');
      await page.screenshot({ path: `${output}/${theme.toLowerCase()}.png`, fullPage: true });
      await go('ui-button--primary', theme);
      const button = page.getByRole('button', { name: 'Save changes' });
      await button.waitFor();
      await button.evaluate((el) => {
        window.qaClicks = 0;
        el.addEventListener('click', () => window.qaClicks++);
      });
      await page.keyboard.press('Tab');
      await button.focus();
      assert.deepEqual(
        await button.evaluate((el) => ({
          style: getComputedStyle(el).outlineStyle,
          width: getComputedStyle(el).outlineWidth,
        })),
        { style: 'solid', width: '2px' },
      );
      await page.keyboard.press('Enter');
      await page.keyboard.press('Space');
      assert.equal(await page.evaluate(() => window.qaClicks), 2);
      for (const state of ['disabled', 'loading']) {
        await go(`ui-button--${state}`, theme);
        const b = page.getByRole('button', { name: 'Save changes' });
        await b.waitFor();
        assert(await b.isDisabled());
        await b.evaluate((el) => {
          window.qaClicks = 0;
          el.addEventListener('click', () => window.qaClicks++);
          el.click();
        });
        await page.keyboard.press('Tab');
        await page.keyboard.press('Enter');
        assert.equal(await page.evaluate(() => window.qaClicks), 0);
      }
      for (const name of ['input', 'textarea']) {
        await go(`ui-${name}--controlled`, theme);
        const field = page.getByRole('textbox', { name: 'Description' });
        await field.fill('Hello');
        assert.equal(await field.inputValue(), 'Hello');
        await page.getByText('5 characters', { exact: true }).waitFor();
        await go(`ui-${name}--error`, theme);
        const invalid = page.getByRole('textbox');
        await invalid.waitFor();
        assert.equal(await invalid.getAttribute('aria-invalid'), 'true');
        const ids = (await invalid.getAttribute('aria-describedby')).split(' ');
        assert.equal(ids.length, 2);
        for (const id of ids)
          assert(
            await page.evaluate((id) => Boolean(document.getElementById(id)?.textContent), id),
          );
        await go(`ui-${name}--disabled`, theme);
        assert(await page.getByRole('textbox').isDisabled());
      }
      await go('ui-modal--default', theme);
      const trigger = page.getByRole('button', { name: 'Open dialog' });
      await trigger.click();
      const dialog = page.getByRole('dialog', { name: 'Edit details' });
      await dialog.waitFor();
      assert.equal(await page.evaluate(() => document.activeElement?.tagName), 'H2');
      await dialog.evaluate((el) => {
        const hidden = document.createElement('button');
        hidden.style.visibility = 'hidden';
        hidden.textContent = 'Hidden';
        el.append(hidden);
        const inert = document.createElement('div');
        inert.inert = true;
        inert.innerHTML = '<button>Inert</button>';
        el.append(inert);
      });
      for (let i = 0; i < 8; i++) {
        await page.keyboard.press('Tab');
        assert(await dialog.evaluate((el) => el.contains(document.activeElement)));
      }
      for (let i = 0; i < 8; i++) {
        await page.keyboard.press('Shift+Tab');
        assert(await dialog.evaluate((el) => el.contains(document.activeElement)));
      }
      await page.keyboard.press('Escape');
      await dialog.waitFor({ state: 'hidden' });
      assert(await trigger.evaluate((el) => el === document.activeElement));
      await trigger.click();
      await page.getByRole('button', { name: 'Close dialog' }).click();
      await dialog.waitFor({ state: 'hidden' });
      assert(await trigger.evaluate((el) => el === document.activeElement));
      await trigger.click();
      await page.getByRole('button', { name: 'Done', exact: true }).click();
      await dialog.waitFor({ state: 'hidden' });
      assert(await trigger.evaluate((el) => el === document.activeElement));
      await go('ui-modal--initial-field-focus', theme);
      await page.getByRole('button', { name: 'Open dialog' }).click();
      assert(
        await page
          .getByRole('textbox', { name: 'Title' })
          .evaluate((el) => el === document.activeElement),
      );
      await page.keyboard.press('Escape');
      await page.setViewportSize({ width: 320, height: 400 });
      await go('ui-modal--long-content', theme);
      await page.getByRole('button', { name: 'Open dialog' }).click();
      const long = page.getByRole('dialog');
      const rect = await long.boundingBox();
      assert(
        rect.x >= 15 && rect.y >= 15 && rect.x + rect.width <= 305 && rect.y + rect.height <= 385,
      );
      await page.getByRole('button', { name: 'Done', exact: true }).click();
      await long.waitFor({ state: 'hidden' });
      await go('ui-overview--overview', theme);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({
        path: `${output}/${theme.toLowerCase()}-narrow.png`,
        fullPage: true,
      });
      await page.setViewportSize({ width: 900, height: 900 });
      results.push({
        theme,
        accent,
        keyboard:
          'Enter/Space, disabled/loading guard, Tab/Shift+Tab modal containment, Escape/close/action return',
        fields: 'controlled input/textarea, error associations, disabled',
        viewport: '320x400 modal scroll and overview no overflow',
        font: 'Poppins loaded',
      });
    }
    assert.deepEqual(errors, []);
    fs.writeFileSync(
      `${output}/results.json`,
      JSON.stringify({ results, pageErrors: errors }, null, 2),
    );
    console.log(JSON.stringify(results, null, 2));
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
