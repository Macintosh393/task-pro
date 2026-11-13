import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('home shows the current user avatar and falls back when it is unavailable', async ({
  page,
}) => {
  let avatarUrl: string | null = '/test-avatar.svg';
  await page.route('**/api/users/me', (route) =>
    route.fulfill({
      json: {
        id: 'test',
        username: 'Current user',
        email: 'user@example.test',
        avatarUrl,
        theme: 'dark',
      },
    }),
  );
  await page.route('**/test-avatar.svg', (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="blue"/></svg>',
    }),
  );
  await page.goto('/home');
  const profile = page.getByRole('button', { name: 'Edit profile: Current user' });
  const image = profile.locator('img');
  await expect(image).toBeVisible();
  await expect(image).toHaveAttribute('src', '/test-avatar.svg');
  await expect.poll(() => image.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBe(32);
  avatarUrl = '/missing-avatar.png';
  await page.route('**/missing-avatar.png', (route) => route.fulfill({ status: 404, body: '' }));
  await page.reload();
  await expect(profile.locator('svg')).toBeVisible();
  await expect(image).toHaveCount(0);
  avatarUrl = null;
  await page.reload();
  await expect(profile.locator('svg')).toBeVisible();
  await expect(image).toHaveCount(0);
});

for (const width of [320, 375, 768, 1440]) {
  test(`headers support keyboard, global themes and long names at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 812 });
    const username = 'A very long current user name '.repeat(8);
    await page.route('**/api/users/me', (route) =>
      route.fulfill({
        json: {
          id: 'test',
          username,
          email: 'user@example.test',
          avatarUrl: null,
          theme: 'dark',
        },
      }),
    );
    await page.goto('/home');
    const trigger = page.getByRole('button', { name: 'Theme', exact: true });
    const profile = page.getByRole('button', { name: `Edit profile: ${username}` });
    await expect(profile).toBeVisible();
    for (const theme of ['Light', 'Violet', 'Dark']) {
      await trigger.focus();
      await page.keyboard.press('Enter');
      await expect(page.getByRole('menuitemradio', { checked: true })).toBeFocused();
      await page.keyboard.press('Home');
      if (theme === 'Dark') await page.keyboard.press('ArrowDown');
      if (theme === 'Violet') await page.keyboard.press('End');
      await page.keyboard.press('Enter');
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme.toLowerCase());
      await expect(trigger).toBeFocused();
      await trigger.click();
      await expect(page.getByRole('menuitemradio', { name: theme })).toHaveAttribute(
        'aria-checked',
        'true',
      );
      await page.keyboard.press('Escape');
      await expect(page.getByRole('menu')).toHaveCount(0);
      await expect(trigger).toBeFocused();
      const bounds = await profile.boundingBox();
      const themeBounds = await trigger.boundingBox();
      expect(bounds!.x).toBeGreaterThanOrEqual(themeBounds!.x + themeBounds!.width);
      expect(await page.locator('html').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
        true,
      );
    }
    await trigger.click();
    await page
      .getByRole('region', { name: 'Board canvas' })
      .click({ position: { x: 200, y: 250 } });
    await expect(page.getByRole('menu')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Filters' })).toBeDisabled();
    await trigger.focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Home');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('menu')).toHaveCount(0);
    await expect(profile).toBeFocused();
    await trigger.click();
    await page.keyboard.press('Shift+Tab');
    await expect(trigger).toBeFocused();
    await expect(page.getByRole('menu')).toHaveCount(0);
    await trigger.click();
    await trigger.focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('menuitemradio', { checked: true })).toBeFocused();
  });
}

for (const width of [375, 768, 1440]) {
  test(`header geometry and theme surfaces match the design at ${width}px`, async ({
    page,
  }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 812 });
    await page.route('**/api/users/me', (route) =>
      route.fulfill({
        json: {
          id: 'test',
          username: 'Ivetta',
          email: 'user@example.test',
          avatarUrl: null,
          theme: 'dark',
        },
      }),
    );
    await page.goto('/home');
    await page.evaluate(() => document.fonts.ready);
    const trigger = page.getByRole('button', { name: 'Theme', exact: true });
    const header = page.getByRole('banner');
    const profile = page.getByRole('button', { name: 'Edit profile: Ivetta' });
    await expect(profile).toBeVisible();
    await expect(header).toHaveCSS('height', width < 768 ? '60px' : '68px');
    await expect(profile).toHaveCSS('font-family', /Poppins/);
    await expect(profile).toHaveCSS('font-size', '14px');
    await expect(profile).toHaveCSS('font-weight', '500');
    await expect(profile.locator('div')).toHaveCSS('width', '32px');
    await expect(profile.locator('div')).toHaveCSS('height', '32px');
    await expect(trigger.locator('span')).toHaveCSS('width', '16px');
    await expect(page.getByRole('button', { name: 'Filters' }).locator('svg')).toHaveCSS(
      'width',
      '16px',
    );
    if (width < 1440) {
      const menuIcon = await page.locator('.workspace-menu__icon').boundingBox();
      expect(menuIcon!.x).toBe(width < 768 ? 20 : 32);
      expect(menuIcon!.width).toBe(width < 768 ? 24 : 32);
    }
    for (const theme of [
      { name: 'Light', header: 'rgb(252, 252, 252)', canvas: 'rgb(246, 246, 247)' },
      {
        name: 'Violet',
        header: width < 1440 ? 'rgb(252, 252, 252)' : 'rgb(255, 255, 255)',
        canvas: 'rgb(236, 237, 253)',
      },
      { name: 'Dark', header: 'rgb(22, 22, 22)', canvas: 'rgb(31, 31, 31)' },
    ]) {
      await trigger.click();
      await page.getByRole('menuitemradio', { name: theme.name }).click();
      await expect(header).toHaveCSS('background-color', theme.header);
      await expect(page.locator('.app-shell')).toHaveCSS('background-color', theme.canvas);
      await trigger.click();
      const menu = page.getByRole('menu', { name: 'Theme' });
      await expect(menu).toHaveCSS('width', '100px');
      await expect(menu).toHaveCSS('height', '107px');
      expect(
        (await new AxeBuilder({ page }).include('.app-shell__header').analyze()).violations,
      ).toEqual([]);
      await page.screenshot({
        path: testInfo.outputPath(`${theme.name.toLowerCase()}-${width}.png`),
      });
      await page.keyboard.press('Escape');
    }
    const heading = page.locator('.workspace-board__heading h1');
    await heading.evaluate((el) => {
      el.textContent = 'Very long board title '.repeat(30);
    });
    const titleBounds = await heading.boundingBox();
    const filterBounds = await page.getByRole('button', { name: 'Filters' }).boundingBox();
    expect(titleBounds!.x + titleBounds!.width).toBeLessThanOrEqual(filterBounds!.x);
    expect(await page.locator('html').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
      true,
    );
    expect(errors).toEqual([]);
  });
}
