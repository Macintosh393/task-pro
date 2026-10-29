const assert = require('node:assert/strict');
const { expect } = require('@playwright/test');

module.exports = async function checkDesign({ page, go, theme, output }) {
  await go('ui-design-reference--kit', theme);
  await page.evaluate(() => document.fonts.ready);
  const create = page.getByRole('button', { name: 'Create', exact: true });
  const rect = await create.boundingBox();
  assert.equal(rect.width, 302);
  assert.equal(rect.height, 49);
  assert.equal(await create.locator('svg').getAttribute('width'), '28');
  assert.equal(await create.evaluate((el) => getComputedStyle(el).gap), '8px');
  const add = page.getByRole('button', { name: 'Add board' });
  const addRect = await add.boundingBox();
  assert.equal(addRect.width, 44);
  assert.equal(addRect.height, 44);
  const compact = await add.evaluate((el) => {
    const css = getComputedStyle(el, '::before');
    return {
      width: css.width,
      height: css.height,
      radius: css.borderRadius,
      color: css.backgroundColor,
    };
  });
  assert.deepEqual(compact, {
    width: '40px',
    height: '36px',
    radius: '6px',
    color: theme === 'Violet' ? 'rgb(184, 188, 253)' : 'rgb(190, 219, 176)',
  });
  const empty = page.getByRole('textbox', { name: 'Title', exact: true });
  const filled = page.getByRole('textbox', { name: 'Board title', exact: true });
  const accent = theme === 'Violet' ? 'rgb(82, 85, 188)' : 'rgb(190, 219, 176)';
  assert.equal(await filled.evaluate((el) => getComputedStyle(el).borderTopColor), accent);
  assert.equal(
    await empty.evaluate((el) => getComputedStyle(el).backgroundColor),
    theme === 'Dark' ? 'rgb(31, 31, 31)' : 'rgba(0, 0, 0, 0)',
  );
  await empty.focus();
  assert.equal(await empty.evaluate((el) => getComputedStyle(el).borderTopColor), accent);
  await empty.fill('New board');
  await empty.blur();
  assert.equal(await empty.evaluate((el) => getComputedStyle(el).borderTopColor), accent);
  await empty.fill('');
  await empty.blur();
  assert.equal(
    await empty.evaluate((el) => getComputedStyle(el).borderTopColor),
    theme === 'Dark' ? 'rgb(146, 146, 146)' : 'rgb(118, 118, 118)',
  );
  await page.screenshot({ path: `${output}/${theme.toLowerCase()}-reference.png`, fullPage: true });
  await create.hover();
  assert.equal(
    await create.evaluate((el) => getComputedStyle(el).backgroundColor),
    theme === 'Violet' ? 'rgb(70, 73, 166)' : 'rgb(157, 200, 136)',
  );
  await create.screenshot({ path: `${output}/${theme.toLowerCase()}-create-hover.png` });
  await add.hover();
  assert.equal(
    await add.evaluate((el) => getComputedStyle(el, '::before').backgroundColor),
    theme === 'Violet' ? 'rgb(151, 156, 234)' : 'rgb(157, 200, 136)',
  );
  await add.screenshot({ path: `${output}/${theme.toLowerCase()}-add-hover.png` });
  const move = page.getByRole('button', { name: 'Move task', exact: true });
  assert.equal(
    await move.evaluate((el) => getComputedStyle(el).backgroundColor),
    'rgba(0, 0, 0, 0)',
  );
  await move.hover();
  assert.equal(await move.evaluate((el) => getComputedStyle(el).color), accent);
  const logout = page.getByRole('button', { name: 'Log out', exact: true });
  assert.equal(await logout.locator('svg').getAttribute('width'), '32');
  assert.equal(await logout.evaluate((el) => getComputedStyle(el).fontSize), '16px');
  assert.equal(
    await page
      .getByText('Task Pro', { exact: true })
      .evaluate((el) => el.getBoundingClientRect().height),
    32,
  );
  assert.equal(
    await page
      .getByRole('img', { name: 'Your profile', exact: true })
      .evaluate((el) => el.parentElement.getBoundingClientRect().width),
    68,
  );
  await page.getByRole('radio', { name: 'Low', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  assert(await page.getByRole('radio', { name: 'Medium', exact: true }).isChecked());
  await page.getByRole('radio', { name: 'Project', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  assert(await page.getByRole('radio', { name: 'Star', exact: true }).isChecked());
  assert(await page.getByRole('radio', { name: 'Medium', exact: true }).isChecked());
  await page.setViewportSize({ width: 320, height: 600 });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({
    path: `${output}/${theme.toLowerCase()}-reference-narrow.png`,
    fullPage: true,
  });
  await page.setViewportSize({ width: 900, height: 900 });
  await go('ui-design-reference--upload-avatar', theme);
  await page
    .getByLabel('Upload avatar')
    .setInputFiles({
      name: 'profile.png',
      mimeType: 'image/png',
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=',
        'base64',
      ),
    });
  await page.getByRole('status').filter({ hasText: 'Selected: profile.png' }).waitFor();
  const uploadedAvatar = page.getByRole('img', { name: 'Your profile', exact: true });
  await expect(uploadedAvatar).toHaveJSProperty('complete', true);
  await expect.poll(() => uploadedAvatar.evaluate((el) => el.naturalWidth)).toBeGreaterThan(0);
  await go('ui-design-reference--missing-avatar', theme);
  const fallbackAvatar = page.getByRole('img', { name: 'Profile', exact: true });
  await expect(fallbackAvatar).toBeVisible();
  await expect(fallbackAvatar).toHaveJSProperty('tagName', 'svg');
  await go('ui-design-reference--disabled-selections', theme);
  for (const radio of await page.getByRole('radio').all()) assert(await radio.isDisabled());
  await go('ui-design-reference--disabled-upload', theme);
  assert(await page.getByLabel('Upload avatar').isDisabled());
  return {
    theme,
    source: '1058:10396',
    create: '302x49 / 28px boxed plus / 8px gap',
    compact,
    states: 'hover / empty / focused / filled',
    coverage: 'logo / avatar upload and fallback / radio keyboard / ghost and logout',
    narrow: '320px reference no overflow',
  };
};
