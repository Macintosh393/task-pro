import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const user = {
  id: 'test-user',
  username: 'Authenticated user',
  email: 'user@example.test',
  avatarUrl: null,
  theme: 'dark',
};

async function openHome(page: Page) {
  await page.route('**/api/users/me', (route) => route.fulfill({ status: 200, json: user }));
  await page.route('**/api/auth/refresh', (route) => route.fulfill({ status: 401, json: {} }));
  await page.goto('/home');
  await expect(page.getByText(user.username, { exact: true })).toBeVisible();
}

async function addOverflowContent(page: Page) {
  await page.getByRole('region', { name: 'Board canvas' }).evaluate((canvas) => {
    const content = document.createElement('div');
    Object.assign(content.style, { width: '2000px', height: '100%' });
    const list = document.createElement('div');
    list.dataset.testid = 'overflow-list';
    list.tabIndex = 0;
    Object.assign(list.style, { overflowY: 'auto', height: '100%' });
    const tallContent = document.createElement('div');
    tallContent.textContent = 'Test overflow content';
    tallContent.style.height = '2000px';
    list.append(tallContent);
    content.append(list);
    canvas.replaceChildren(content);
  });
}

async function swipe(page: Page, selector: string, startX: number, endX: number) {
  const target = page.locator(selector);
  await target.dispatchEvent('touchstart', {
    touches: [{ identifier: 0, clientX: startX, clientY: 200 }],
  });
  await target.dispatchEvent('touchend', {
    changedTouches: [{ identifier: 0, clientX: endX, clientY: 200 }],
  });
}

test('home drawer contains focus and blocks background interaction', async ({ page }) => {
  await openHome(page);
  await expect(page.getByText('Your boards and projects will appear here.')).toBeVisible();
  await page.getByRole('button', { name: 'Open navigation' }).click();
  const drawer = page.getByRole('dialog', { name: 'Workspace navigation' });
  const create = drawer.getByRole('button', { name: 'Create a new board' });
  const logout = drawer.getByRole('button', { name: 'Log out' });
  await expect(create).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(logout).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(create).toBeFocused();
  await page
    .getByRole('region', { name: 'Board canvas' })
    .evaluate((element: HTMLElement) => element.focus());
  await expect(create).toBeFocused();
  await expect(page.locator('html')).toHaveCSS('overflow', 'hidden');
  await page.keyboard.press('Escape');
  await expect(drawer).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Open navigation' })).toBeFocused();
  await expect(page.locator('html')).not.toHaveCSS('overflow', 'hidden');
});

async function openSidebar(page: Page, width: number) {
  if (width < 1440) await page.getByRole('button', { name: 'Open navigation' }).click();
  return width < 1440
    ? page.getByRole('dialog')
    : page.getByRole('complementary', { name: 'Workspace navigation' });
}

for (const width of [320, 375, 768, 1440]) {
  test(`long board lists scroll without covering help or logout at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await openHome(page);
    const sidebar = await openSidebar(page, width);
    await sidebar.locator('.workspace-board-list').evaluate((element) => {
      const list = document.createElement('ul');
      for (let index = 0; index < 30; index++) {
        const item = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'min-h-12 w-full px-5 text-left';
        button.textContent =
          index === 0 ? `Test board ${'very long title '.repeat(12)}` : `Test board ${index + 1}`;
        item.append(button);
        list.append(item);
      }
      element.replaceChildren(list);
    });
    const listBox = sidebar.locator('.workspace-board-list');
    const sizes = await listBox.evaluate((element) => ({
      height: element.clientHeight,
      scrollHeight: element.scrollHeight,
    }));
    expect(sizes.scrollHeight).toBeGreaterThan(sizes.height);
    const lastItem = sidebar.getByRole('button', { name: 'Test board 30', exact: true });
    await lastItem.scrollIntoViewIfNeeded();
    await expect.poll(() => listBox.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    await expect(lastItem).toBeVisible();
    const list = (await listBox.boundingBox())!;
    const footer = (await sidebar.locator('.workspace-sidebar__footer').boundingBox())!;
    expect(footer.y).toBeGreaterThanOrEqual(list.y + list.height - 1);
    expect(footer.y + footer.height).toBeLessThanOrEqual(900);
    await expect(sidebar.getByRole('button', { name: 'Need help?' })).toBeInViewport();
    await expect(sidebar.getByRole('button', { name: 'Log out' })).toBeInViewport();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBe(true);
    const sidebarRoot = sidebar.locator('.workspace-sidebar');
    expect(
      await sidebarRoot.evaluate((element) => element.scrollWidth <= element.clientWidth),
    ).toBe(true);
  });
}

test('short viewports keep help and logout reachable by scrolling the sidebar', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 480 });
  await openHome(page);
  const sidebar = await openSidebar(page, 320);
  const logout = sidebar.getByRole('button', { name: 'Log out' });
  await logout.scrollIntoViewIfNeeded();
  await expect(logout).toBeInViewport();
  const list = (await sidebar.locator('.workspace-board-list').boundingBox())!;
  const footer = (await sidebar.locator('.workspace-sidebar__footer').boundingBox())!;
  expect(footer.y).toBeGreaterThanOrEqual(list.y + list.height - 1);
});

test('sidebar shows create above the list, help copy and a text-only help button', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openHome(page);
  const sidebar = await openSidebar(page, 1440);
  const create = (await sidebar.getByRole('button', { name: 'Create a new board' }).boundingBox())!;
  const list = (await sidebar.locator('.workspace-board-list').boundingBox())!;
  expect(create.y + create.height).toBeLessThanOrEqual(list.y);
  await expect(
    sidebar.getByText(
      'If you need help with TaskPro, check out our support resources or reach out to our customer support team.',
    ),
  ).toBeVisible();
  const help = sidebar.getByRole('button', { name: 'Need help?' });
  await expect(help).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(help).toHaveCSS('border-top-color', 'rgba(0, 0, 0, 0)');
});

test('log out clears the session and returns to Welcome', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openHome(page);
  let loggedOut = false;
  await page.route('**/api/auth/logout', (route) => {
    loggedOut = true;
    return route.fulfill({ status: 204 });
  });
  await page.route('**/api/users/me', (route) =>
    loggedOut
      ? route.fulfill({ status: 401, json: {} })
      : route.fulfill({ status: 200, json: user }),
  );
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page).toHaveURL('http://127.0.0.1:5175/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('.app-shell')).toHaveCount(0);
});

test('drawer scroll lock preserves existing html classes and inline overflow', async ({ page }) => {
  await openHome(page);
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
    await page.locator('html').evaluate((element: HTMLElement) => ({
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
  await openHome(page);
  await page.getByRole('button', { name: 'Open navigation' }).click();
  const drawer = page.getByRole('dialog');
  const first = drawer.getByRole('button', { name: 'Create a new board' });
  const last = drawer.getByRole('button', { name: 'Log out' });
  await drawer.evaluate((element) => {
    const control = document.createElement('button');
    control.textContent = 'Test focus control';
    control.dataset.testid = 'focus-control';
    element.append(control);
  });
  const lastControl = drawer.getByTestId('focus-control');
  for (const mode of ['tabindex', 'visibility', 'inert', 'disabled', 'hidden']) {
    await lastControl.evaluate((element: HTMLButtonElement, mode) => {
      if (mode === 'tabindex') element.tabIndex = -1;
      if (mode === 'visibility') element.style.visibility = 'hidden';
      if (mode === 'inert') element.inert = true;
      if (mode === 'disabled') element.disabled = true;
      if (mode === 'hidden') element.hidden = true;
    }, mode);
    await first.focus();
    await page.keyboard.press('Shift+Tab');
    await expect(last).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(first).toBeFocused();
    await lastControl.evaluate((element: HTMLButtonElement) => {
      element.removeAttribute('tabindex');
      element.style.visibility = '';
      element.inert = false;
      element.disabled = false;
      element.hidden = false;
    });
  }
});

test('a queued close event preserves a drawer that has already reopened', async ({ page }) => {
  await openHome(page);
  const menu = page.getByRole('button', { name: 'Open navigation' });
  const drawer = page.getByRole('dialog');
  await menu.click();
  await page.keyboard.press('Escape');
  await menu.click();
  await expect(drawer).toBeVisible();
  await drawer.dispatchEvent('close');
  await expect(drawer).toBeVisible();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(drawer).not.toBeVisible();
  await expect(menu).toBeFocused();
});

test('Escape, backdrop, button and edge swipe work without capturing canvas scroll', async ({
  page,
}) => {
  await openHome(page);
  await addOverflowContent(page);
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

test('resize releases modal state and transfers navigation focus', async ({ page }) => {
  await openHome(page);
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.setViewportSize({ width: 1440, height: 770 });
  await expect(page.locator('dialog')).not.toHaveAttribute('open');
  const sidebar = page.getByRole('complementary', { name: 'Workspace navigation' });
  await expect(sidebar).toBeFocused();
  await expect(page.locator('html')).not.toHaveCSS('overflow', 'hidden');
  await expect(page.getByRole('navigation', { name: 'My boards' })).toHaveCount(1);
  await sidebar.focus();
  await page.setViewportSize({ width: 768, height: 1024 });
  const menu = page.getByRole('button', { name: 'Open navigation' });
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await expect(menu).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Theme', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: `Edit profile: ${user.username}` })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('region', { name: 'Board canvas' })).toBeFocused();
  await menu.click();
  await expect(page.getByRole('dialog')).toBeVisible();
});

for (const width of [300, 320, 375, 768, 1440]) {
  test(`home bounds independent content scroll at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 300 ? 300 : 600 });
    await openHome(page);
    await expect(page.getByText('Your boards and projects will appear here.')).toBeVisible();
    await addOverflowContent(page);
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
    const list = page.getByTestId('overflow-list').first();
    const canvasPosition = await page.locator('.workspace-canvas').boundingBox();
    const sidebarPosition =
      width >= 1440 ? await page.locator('.app-shell__sidebar').boundingBox() : null;
    const sizes = await list.evaluate((element) => ({
      height: element.clientHeight,
      scrollHeight: element.scrollHeight,
    }));
    expect(sizes.scrollHeight).toBeGreaterThan(sizes.height);
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
    await page.reload();
    await expect(page.getByText('Your boards and projects will appear here.')).toBeVisible();
    await expect(page.getByTestId('overflow-list')).toHaveCount(0);
  });
}

for (const theme of ['dark', 'light', 'violet']) {
  test(`home accessibility in ${theme}`, async ({ page }) => {
    await openHome(page);
    await page.locator('html').evaluate((element, value) => {
      element.dataset.theme = value;
    }, theme);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.getByRole('button', { name: 'Open navigation' }).click();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.keyboard.press('Escape');
    await page.setViewportSize({ width: 1440, height: 770 });
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
}

for (const width of [375, 1440]) {
  test(`protected empty home preserves user display and reload at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 812 });
    await openHome(page);
    await expect(page.getByRole('button', { name: `Edit profile: ${user.username}` })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Your workspace', exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByText(user.username, { exact: true })).toBeVisible();
    if (width < 1440) await page.getByRole('button', { name: 'Open navigation' }).click();
    const navigation =
      width < 1440
        ? page.getByRole('dialog')
        : page.getByRole('complementary', { name: 'Workspace navigation' });
    await expect(navigation.locator('.workspace-board-list').getByRole('button')).toHaveCount(0);
    await expect(navigation.getByRole('button', { name: 'Create a new board' })).toBeVisible();
    await expect(navigation.getByRole('button', { name: 'Need help?' })).toBeVisible();
    await expect(navigation.getByRole('button', { name: 'Log out', exact: true })).toBeVisible();
    await expect(page.getByText('Your boards will appear here.')).toBeVisible();
  });
}

test('guest cannot access the home foundation', async ({ page }) => {
  await page.route(
    (url) => url.pathname.startsWith('/api/'),
    (route) => route.fulfill({ status: 401, json: {} }),
  );
  await page.goto('/home');
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole('heading', { name: 'Log In', exact: true })).toBeVisible();
  await expect(page.locator('.app-shell')).toHaveCount(0);
});

test('removed development workspace is unknown in dev and production', async ({ page }) => {
  await page.route(
    (url) => url.pathname.startsWith('/api/'),
    (route) => route.fulfill({ status: 401, json: {} }),
  );
  for (const origin of ['http://127.0.0.1:5175', 'http://127.0.0.1:4175']) {
    await page.goto(`${origin}/dev/workspace`);
    await expect(page.getByText('Not Found', { exact: true })).toBeVisible();
    await expect(page.locator('.app-shell')).toHaveCount(0);
  }
});
