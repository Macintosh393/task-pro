import { expect, test, type Page } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';

const user = {
  id: 'test-user',
  username: 'Authenticated user',
  email: 'user@example.test',
  avatarUrl: null,
  theme: 'dark',
};

async function swipe(page: Page, selector: string, startX: number, endX: number) {
  const target = page.locator(selector);
  await target.dispatchEvent('touchstart', {
    touches: [{ identifier: 0, clientX: startX, clientY: 200 }],
  });
  await target.dispatchEvent('touchend', {
    changedTouches: [{ identifier: 0, clientX: endX, clientY: 200 }],
  });
}

test('preview needs no auth or API and shares board selection with the drawer', async ({
  page,
}) => {
  const apiRequests: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).pathname.startsWith('/api/')) apiRequests.push(request.url());
  });
  await page.goto('/dev/workspace');
  await expect(page.getByText('DEV fixtures')).toBeVisible();
  await page.getByRole('button', { name: 'Open navigation' }).click();
  const drawer = page.getByRole('dialog', { name: 'Workspace navigation' });
  const close = drawer.getByRole('button', { name: 'Close navigation' });
  await expect(close).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(drawer.getByRole('button', { name: 'Neon Light Project' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  await page
    .getByRole('combobox', { name: 'Theme', exact: true })
    .evaluate((element: HTMLSelectElement) => element.focus());
  await expect(close).toBeFocused();
  await expect(page.locator('html')).toHaveCSS('overflow', 'hidden');
  await drawer.getByRole('button', { name: 'Neon Light Project' }).click();
  await expect(drawer).not.toBeVisible();
  await expect(page.getByRole('heading', { name: 'Neon Light Project' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open navigation' })).toBeFocused();
  await expect(page.locator('html')).not.toHaveCSS('overflow', 'hidden');
  await page.getByLabel('Populated').uncheck();
  await expect(page.getByRole('heading', { name: 'Your workspace' })).toBeVisible();
  expect(apiRequests).toEqual([]);
});

test('drawer scroll lock preserves existing html classes and inline overflow', async ({ page }) => {
  await page.goto('/dev/workspace');
  await page.locator('html').evaluate((element: HTMLElement) => {
    element.classList.add('prior-style');
    element.style.overflow = 'auto';
  });
  const menu = page.getByRole('button', { name: 'Open navigation' });
  await menu.click();
  await expect(page.locator('html')).toHaveCSS('overflow', 'hidden');
  await page.keyboard.press('Escape');
  await expect(page.locator('html')).toHaveCSS('overflow', 'auto');
  expect(
    await page
      .locator('html')
      .evaluate((element: HTMLElement) => ({
        priorClass: element.classList.contains('prior-style'),
        overflow: element.style.overflow,
      })),
  ).toEqual({ priorClass: true, overflow: 'auto' });
  await page.locator('html').evaluate((element) => element.classList.add('overflow-hidden!'));
  await menu.click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.locator('html')).toHaveCSS('overflow', 'hidden');
  expect(
    await page
      .locator('html')
      .evaluate((element) => element.classList.contains('overflow-hidden!')),
  ).toBe(true);
});

test('focus trap skips sidebar controls removed from the Tab order', async ({ page }) => {
  await page.goto('/dev/workspace');
  await page.getByRole('button', { name: 'Open navigation' }).click();
  const drawer = page.getByRole('dialog');
  const close = drawer.getByRole('button', { name: 'Close navigation' });
  const firstBoard = drawer.getByRole('button', { name: 'Project office', exact: true });
  const lastBoard = drawer.locator('button').last();
  for (const mode of ['tabindex', 'visibility', 'inert', 'disabled', 'hidden']) {
    await lastBoard.evaluate((element: HTMLButtonElement, mode) => {
      if (mode === 'tabindex') element.tabIndex = -1;
      if (mode === 'visibility') element.style.visibility = 'hidden';
      if (mode === 'inert') element.inert = true;
      if (mode === 'disabled') element.disabled = true;
      if (mode === 'hidden') element.hidden = true;
    }, mode);
    await close.focus();
    await page.keyboard.press('Shift+Tab');
    await expect(firstBoard).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(close).toBeFocused();
    await lastBoard.evaluate((element: HTMLButtonElement) => {
      element.removeAttribute('tabindex');
      element.style.visibility = '';
      element.inert = false;
      element.disabled = false;
      element.hidden = false;
    });
  }
});

test('a queued close event preserves a drawer that has already reopened', async ({ page }) => {
  await page.goto('/dev/workspace');
  const menu = page.getByRole('button', { name: 'Open navigation' });
  const drawer = page.getByRole('dialog');
  await menu.click();
  await drawer.getByRole('button', { name: 'Close navigation' }).click();
  await menu.click();
  await expect(drawer).toBeVisible();
  await drawer.dispatchEvent('close');
  await expect(drawer).toBeVisible();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(drawer).not.toBeVisible();
  await expect(menu).toBeFocused();
});

test('Escape, backdrop, button and edge swipe close or open navigation without capturing board scroll', async ({
  page,
}) => {
  await page.goto('/dev/workspace');
  const menu = page.getByRole('button', { name: 'Open navigation' });
  const drawer = page.getByRole('dialog');
  await menu.click();
  await page.keyboard.press('Escape');
  await expect(drawer).not.toBeVisible();
  await expect(menu).toBeFocused();
  await menu.click();
  await page.mouse.click(350, 400);
  await expect(drawer).not.toBeVisible();
  await expect(menu).toBeFocused();
  await menu.click();
  await page.getByRole('button', { name: 'Close navigation' }).click();
  await expect(drawer).not.toBeVisible();
  await swipe(page, '.app-shell__swipe-edge', 2, 110);
  await expect(drawer).toBeVisible();
  await swipe(page, '.app-shell__drawer', 180, 40);
  await expect(drawer).not.toBeVisible();
  await swipe(page, '.workspace-canvas', 80, 200);
  await expect(drawer).not.toBeVisible();
  await page.getByRole('region', { name: 'Board canvas' }).evaluate((element) => {
    element.scrollLeft = 300;
  });
  await expect
    .poll(() => page.locator('.workspace-canvas').evaluate((element) => element.scrollLeft))
    .toBe(300);
});

test('resize releases modal state and moves focus to the persistent navigation', async ({
  page,
}) => {
  await page.goto('/dev/workspace');
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.setViewportSize({ width: 1440, height: 770 });
  await expect(page.locator('dialog')).not.toHaveAttribute('open');
  await expect(page.getByRole('complementary', { name: 'Workspace navigation' })).toBeFocused();
  await expect(page.locator('html')).not.toHaveCSS('overflow', 'hidden');
  await expect(page.getByRole('navigation', { name: 'My boards' })).toHaveCount(1);
  await page.getByRole('button', { name: 'Project office', exact: true }).focus();
  await page.setViewportSize({ width: 768, height: 1024 });
  const menu = page.getByRole('button', { name: 'Open navigation' });
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await expect(menu).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Log Out' })).toBeFocused();
  await menu.click();
  await expect(page.getByRole('dialog')).toBeVisible();
});

for (const width of [300, 320, 375, 768, 1440]) {
  test(`bounded workspace and independent scroll at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 300 ? 300 : 600 });
    await page.goto('/dev/workspace');
    const dimensions = await page.evaluate(() => ({
      width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      height: innerHeight,
      scrollHeight: document.documentElement.scrollHeight,
    }));
    expect(dimensions.scrollWidth).toBe(dimensions.width);
    expect(dimensions.scrollHeight).toBe(dimensions.height);
    const header = await page.locator('.app-shell__header').boundingBox();
    const heading = await page.locator('.workspace-board__heading').boundingBox();
    await page.locator('.workspace-canvas').evaluate((element) => {
      element.scrollLeft = 500;
    });
    const list = page.locator('.workspace-preview__list').first();
    const canvasPosition = await page.locator('.workspace-canvas').boundingBox();
    const sidebarPosition =
      width >= 1440 ? await page.locator('.app-shell__sidebar').boundingBox() : null;
    const listDimensions = await list.evaluate((element) => ({
      height: element.clientHeight,
      scrollHeight: element.scrollHeight,
    }));
    expect(listDimensions.scrollHeight).toBeGreaterThan(listDimensions.height);
    await list.evaluate((element) => {
      element.scrollTop = 500;
    });
    await expect.poll(() => list.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    await expect
      .poll(() => page.locator('.workspace-canvas').evaluate((element) => element.scrollLeft))
      .toBeGreaterThan(0);
    expect(await page.locator('.workspace-canvas').boundingBox()).toEqual(canvasPosition);
    if (sidebarPosition)
      expect(await page.locator('.app-shell__sidebar').boundingBox()).toEqual(sidebarPosition);
    expect(await page.locator('.app-shell__header').boundingBox()).toEqual(header);
    expect(await page.locator('.workspace-board__heading').boundingBox()).toEqual(heading);
    await page.getByLabel('Populated').uncheck();
    await expect(page.getByText('Your boards and projects will appear here.')).toBeVisible();
  });
}

for (const theme of ['dark', 'light', 'violet']) {
  test(`workspace accessibility in ${theme}`, async ({ page }) => {
    await page.goto('/dev/workspace');
    await page.getByRole('combobox', { name: 'Theme', exact: true }).selectOption(theme);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.getByRole('button', { name: 'Open navigation' }).click();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.keyboard.press('Escape');
    await page.getByLabel('Populated').uncheck();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
}

test('protected home preserves user display, reload and logout', async ({ page }) => {
  let authenticated = true;
  await page.route('**/api/users/me', (route) =>
    route.fulfill({ status: authenticated ? 200 : 401, json: authenticated ? user : {} }),
  );
  await page.route('**/api/auth/refresh', (route) => route.fulfill({ status: 401, json: {} }));
  await page.route('**/api/auth/logout', (route) => {
    authenticated = false;
    return route.fulfill({ status: 204 });
  });
  await page.goto('/home');
  await expect(page.getByText(user.username, { exact: true })).toBeVisible();
  await expect(page.getByText(user.email, { exact: true })).toBeVisible();
  await expect(page.getByText('DEV fixtures')).toHaveCount(0);
  await page.reload();
  await expect(page.getByText(user.username, { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Log Out' }).click();
  await expect(page).toHaveURL('http://127.0.0.1:5175/');
  await page.goto('/home');
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole('heading', { name: 'Your workspace' })).toHaveCount(0);
});

test('production excludes development route, fixtures and preview assets', async ({ page }) => {
  const assets = readdirSync('dist/assets')
    .filter((name) => name.endsWith('.js'))
    .map((name) => readFileSync(`dist/assets/${name}`, 'utf8'))
    .join('\n');
  expect(assets).not.toContain('/dev/workspace');
  expect(assets).not.toContain('Preview user');
  expect(assets).not.toContain('DEV fixtures');
  expect(assets).not.toContain('Column fixture');
  await page.route('**/api/**', (route) => route.fulfill({ status: 401, json: {} }));
  await page.goto('http://127.0.0.1:4175/dev/workspace');
  await expect(page.getByText('DEV fixtures')).toHaveCount(0);
  await expect(page.getByText('Not Found', { exact: true })).toBeVisible();
});
