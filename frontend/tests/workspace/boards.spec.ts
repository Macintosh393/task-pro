import { expect, test, type Page, type Route } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const user = {
  id: 'test-user',
  username: 'Board owner',
  email: 'owner@example.test',
  avatarUrl: null,
  theme: 'dark',
};

type Board = {
  id: string;
  title: string;
  icon: string;
  background: string;
  createdAt: string;
  updatedAt: string;
};

const officeId = '0b1e7f6a-1d2c-4e5f-8a9b-0c1d2e3f4a5b';
const plainId = 'aaaa7d6c-5b4a-4c3d-8e2f-1a0b9c8d7e6f';
const unknownId = '9f8e7d6c-5b4a-4c3d-8e2f-1a0b9c8d7e6f';
const slowId = '2c3d4e5f-6a7b-4c8d-9e0f-1a2b3c4d5e6f';

function makeBoard(id: string, title: string, icon = 'project', background = 'none'): Board {
  const now = new Date().toISOString();
  return { id, title, icon, background, createdAt: now, updatedAt: now };
}

/** Test-only in-memory boards API that follows the feat/boards-backend contract. */
async function mockBoardsApi(page: Page, initial: Board[] = []) {
  const boards = [...initial];
  const state = { failList: false, created: 0 };
  await page.route('**/api/users/me', (route) => route.fulfill({ status: 200, json: user }));
  await page.route('**/api/auth/refresh', (route) => route.fulfill({ status: 401, json: {} }));
  await page.route('**/api/boards', async (route: Route) => {
    const request = route.request();
    if (request.method() === 'POST') {
      const body = request.postDataJSON() as Partial<Board>;
      state.created += 1;
      const board = makeBoard(
        '1a2b3c4d-0000-4000-8000-' + String(state.created).padStart(12, '0'),
        String(body.title).trim(),
        body.icon,
        body.background,
      );
      boards.push(board);
      return route.fulfill({ status: 201, json: board });
    }
    if (state.failList) {
      return route.fulfill({ status: 500, json: { message: 'Internal server error' } });
    }
    return route.fulfill({ status: 200, json: boards });
  });
  await page.route('**/api/boards/*', (route: Route) => {
    const id = new URL(route.request().url()).pathname.split('/').at(-1);
    const board = boards.find((item) => item.id === id);
    return board
      ? route.fulfill({ status: 200, json: board })
      : route.fulfill({
          status: 404,
          json: { message: 'Board not found', error: 'Not Found', statusCode: 404 },
        });
  });
  return state;
}

async function navigation(page: Page) {
  const width = page.viewportSize()?.width ?? 375;
  if (width < 1440) {
    await page.getByRole('button', { name: 'Open navigation' }).click();
    return page.getByRole('dialog', { name: 'Workspace navigation' });
  }
  return page.getByRole('complementary', { name: 'Workspace navigation' });
}

const viewports = [
  { width: 375, modalWidth: 335, asset: 'mobile' },
  { width: 768, modalWidth: 350, asset: 'tablet' },
  { width: 1440, modalWidth: 350, asset: 'desktop' },
];

for (const { width, modalWidth, asset } of viewports) {
  test(`create → open → reload at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await mockBoardsApi(page);
    await page.goto('/home');
    await expect(page.getByText('Your boards will appear here.')).toBeAttached();

    const nav = await navigation(page);
    await nav.getByRole('button', { name: 'Create a new board' }).click();
    const modal = page.getByRole('dialog', { name: 'New board' });
    await expect(modal).toBeVisible();
    // On mobile/tablet the drawer gives way to the modal.
    await expect(page.getByRole('dialog', { name: 'Workspace navigation' })).toBeHidden();
    expect((await modal.boundingBox())?.width).toBe(modalWidth);
    await expect(modal.getByRole('textbox', { name: 'Title' })).toBeFocused();
    await expect(modal.getByRole('radio', { name: 'Project' })).toBeChecked();
    await expect(modal.getByRole('radio', { name: 'No background' })).toBeChecked();

    await modal.getByRole('button', { name: 'Create' }).click();
    await expect(modal.getByText('Title is required')).toBeVisible();

    await modal.getByRole('textbox', { name: 'Title' }).fill('  Product launch ');
    await modal.getByRole('radio', { name: 'Star' }).check();
    await modal.getByRole('radio', { name: 'Background 5' }).check();
    await modal.getByRole('button', { name: 'Create' }).click();

    await expect(modal).toBeHidden();
    await expect(page).toHaveURL(/\/home\?boardId=1a2b3c4d-0000-4000-8000-000000000001$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Product launch' })).toBeVisible();
    const board = page.locator('section.workspace-board');
    await expect(board).toHaveAttribute('data-board-background', 'bg-05');
    await expect(board).toHaveCSS('background-image', new RegExp(`bg-05-${asset}`));

    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: 'Product launch' })).toBeVisible();
    await expect(board).toHaveCSS('background-image', new RegExp(`bg-05-${asset}`));
    const reloadedNav = await navigation(page);
    await expect(
      reloadedNav.getByRole('button', { name: 'Product launch', exact: true }),
    ).toHaveAttribute('aria-current', 'true');
  });
}

test('selecting a board changes route, highlight, title and background together', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockBoardsApi(page, [
    makeBoard(officeId, 'Project office', 'project', 'bg-02'),
    makeBoard(plainId, 'Plain board'),
  ]);
  await page.goto('/home');
  const nav = await navigation(page);
  await nav.getByRole('button', { name: 'Project office', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`boardId=${officeId}`));
  await expect(nav.getByRole('button', { name: 'Project office', exact: true })).toHaveAttribute(
    'aria-current',
    'true',
  );
  await expect(page.getByRole('heading', { level: 1, name: 'Project office' })).toBeVisible();
  await expect(page.locator('section.workspace-board')).toHaveCSS(
    'background-image',
    /bg-02-desktop/,
  );

  await nav.getByRole('button', { name: 'Plain board', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`boardId=${plainId}`));
  await expect(
    nav.getByRole('button', { name: 'Project office', exact: true }),
  ).not.toHaveAttribute('aria-current', 'true');
  await expect(page.getByRole('heading', { level: 1, name: 'Plain board' })).toBeVisible();
  await expect(page.locator('section.workspace-board')).toHaveCSS('background-image', 'none');
});

test('a late board response does not replace the current selection', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockBoardsApi(page, [makeBoard(officeId, 'Project office')]);
  // Registered later, so it takes precedence for the slow board only.
  await page.route('**/api/boards/' + slowId, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await route.fulfill({ status: 200, json: makeBoard(slowId, 'Slow board') });
  });
  await page.goto('/home?boardId=' + slowId);
  await expect(
    page.getByRole('region', { name: 'Board workspace' }).getByRole('status'),
  ).toBeAttached();
  const nav = await navigation(page);
  await nav.getByRole('button', { name: 'Project office', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Project office' })).toBeVisible();
  await page.waitForTimeout(1800);
  await expect(page.getByRole('heading', { level: 1, name: 'Project office' })).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`boardId=${officeId}`));
});

for (const boardId of [unknownId, 'not-a-board']) {
  test(`unknown or inaccessible boardId "${boardId}" shows not found`, async ({ page }) => {
    await mockBoardsApi(page, [makeBoard(officeId, 'Project office')]);
    await page.goto('/home?boardId=' + boardId);
    await expect(page.getByRole('heading', { level: 1, name: 'Board not found' })).toBeVisible();
    await page.getByRole('button', { name: 'Back to workspace' }).click();
    await expect(page).toHaveURL(/\/home$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Your workspace' })).toBeVisible();
  });
}

test('board list error recovers with Try again', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const state = await mockBoardsApi(page, [makeBoard(officeId, 'Project office')]);
  state.failList = true;
  await page.goto('/home');
  const nav = await navigation(page);
  await expect(nav.getByRole('alert')).toHaveText('Could not load your boards.', {
    timeout: 15_000,
  });
  state.failList = false;
  await nav.getByRole('button', { name: 'Try again' }).click();
  await expect(nav.getByRole('button', { name: 'Project office', exact: true })).toBeVisible();
});

test('logout clears cached boards before the next user signs in', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockBoardsApi(page, [makeBoard(officeId, 'Project office')]);
  await page.route('**/api/auth/logout', (route) => route.fulfill({ status: 204 }));
  await page.goto('/home');
  const nav = await navigation(page);
  await expect(nav.getByRole('button', { name: 'Project office', exact: true })).toBeVisible();
  await page.route('**/api/users/me', (route) => route.fulfill({ status: 401, json: {} }));
  await nav.getByRole('button', { name: 'Log out', exact: true }).click();
  await expect(page).toHaveURL(/127\.0\.0\.1:5175\/$/);

  const other = { ...user, id: 'other-user', username: 'Other user' };
  let releaseList = () => {};
  const listGate = new Promise<void>((resolve) => {
    releaseList = resolve;
  });
  await page.route('**/api/boards', async (route) => {
    await listGate;
    await route.fulfill({ status: 200, json: [] });
  });
  await page.route('**/api/auth/login', (route) => route.fulfill({ status: 200, json: other }));
  await page
    .getByRole('link', { name: /log in/i })
    .first()
    .click();
  await page.getByRole('textbox', { name: 'Email' }).fill('other@example.test');
  await page.getByLabel('Password', { exact: true }).fill('secret123');
  await page.getByRole('button', { name: 'Log In Now' }).click();
  await expect(page.getByText('Other user', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Project office', exact: true })).toHaveCount(0);
  releaseList();
  await expect(page.getByText('Your boards will appear here.')).toBeVisible();
});

for (const theme of ['dark', 'light', 'violet']) {
  test(`board and create modal accessibility in ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await mockBoardsApi(page, [makeBoard(officeId, 'Project office', 'star', 'bg-07')]);
    await page.goto('/home?boardId=' + officeId);
    await page.locator('html').evaluate((element, value) => {
      element.dataset.theme = value;
    }, theme);
    await expect(page.getByRole('heading', { level: 1, name: 'Project office' })).toBeVisible();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.getByRole('button', { name: 'Create a new board' }).click();
    await expect(page.getByRole('dialog', { name: 'New board' })).toBeVisible();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
}
