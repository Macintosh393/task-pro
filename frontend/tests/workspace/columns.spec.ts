import { expect, test, type Page, type Route } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const user = {
  id: 'test-user',
  username: 'Column owner',
  email: 'columns@example.test',
  avatarUrl: null,
  theme: 'dark',
};

const boardId = '0b1e7f6a-1d2c-4e5f-8a9b-0c1d2e3f4a5b';
const now = new Date().toISOString();
const board = {
  id: boardId,
  title: 'Project office',
  icon: 'project',
  background: 'none',
  createdAt: now,
  updatedAt: now,
};

type Column = {
  id: string;
  boardId: string;
  title: string;
  position: number;
  createdAt: string;
  updatedAt: string;
};

const columnId = (index: number) => `c0000000-0000-4000-8000-${String(index).padStart(12, '0')}`;

/** Test-only in-memory columns API that follows the feat/be-columns contract. */
async function mockColumnsApi(page: Page, titles: string[] = []) {
  const columns: Column[] = titles.map((title, position) => ({
    id: columnId(position + 1),
    boardId,
    title,
    position,
    createdAt: now,
    updatedAt: now,
  }));
  const state = {
    failList: false,
    createError: null as null | { status: number; json: unknown },
    abortCreate: false,
  };
  await page.route('**/api/users/me', (route) => route.fulfill({ status: 200, json: user }));
  await page.route('**/api/auth/refresh', (route) => route.fulfill({ status: 401, json: {} }));
  await page.route('**/api/boards', (route) => route.fulfill({ status: 200, json: [board] }));
  await page.route('**/api/boards/*', (route) => route.fulfill({ status: 200, json: board }));
  await page.route('**/api/boards/*/columns', async (route: Route) => {
    const request = route.request();
    if (request.method() === 'POST') {
      if (state.abortCreate) return route.abort('connectionrefused');
      if (state.createError) return route.fulfill(state.createError);
      const body = request.postDataJSON() as { title: string };
      // Positions may have gaps (after deletions); the order is what counts.
      const position = Math.max(-1, ...columns.map((column) => column.position)) + 2;
      const column = {
        id: columnId(columns.length + 1),
        boardId,
        title: body.title.trim(),
        position,
        createdAt: now,
        updatedAt: now,
      };
      columns.push(column);
      return route.fulfill({ status: 201, json: column });
    }
    if (state.failList) {
      return route.fulfill({ status: 500, json: { message: 'Internal server error' } });
    }
    return route.fulfill({
      status: 200,
      json: [...columns].sort((a, b) => a.position - b.position),
    });
  });
  return state;
}

async function openBoard(page: Page) {
  await page.goto('/home?boardId=' + boardId);
  await expect(page.getByRole('heading', { level: 1, name: 'Project office' })).toBeVisible();
}

const columnTitles = (page: Page) =>
  page.getByRole('list', { name: 'Columns' }).getByRole('heading', { level: 2 }).allTextContents();

const viewports = [
  { width: 375, columnWidth: 335, modalWidth: 335 },
  { width: 768, columnWidth: 334, modalWidth: 350 },
  { width: 1440, columnWidth: 334, modalWidth: 350 },
];

for (const { width, columnWidth, modalWidth } of viewports) {
  test(`loads columns in order and adds one before Add another column at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await mockColumnsApi(page, ['To Do', 'In progress']);
    await openBoard(page);
    expect(await columnTitles(page)).toEqual(['To Do', 'In progress']);
    const firstColumn = page.locator('.workspace-column').first();
    expect((await firstColumn.boundingBox())?.width).toBe(columnWidth);

    const add = page.getByRole('button', { name: 'Add another column' });
    await add.click();
    const modal = page.getByRole('dialog', { name: 'Add column' });
    await expect(modal).toBeVisible();
    expect((await modal.boundingBox())?.width).toBe(modalWidth);
    const title = modal.getByRole('textbox', { name: 'Title' });
    await expect(title).toBeFocused();

    await modal.getByRole('button', { name: 'Add' }).click();
    await expect(modal.getByText('Title is required')).toBeVisible();

    await title.fill('  Done ');
    await modal.getByRole('button', { name: 'Add' }).click();
    await expect(modal).toBeHidden();
    await expect.poll(() => columnTitles(page)).toEqual(['To Do', 'In progress', 'Done']);
    // Add another column stays the last control on the board, right of every column.
    const lastColumn = (await page.locator('.workspace-column').last().boundingBox())!;
    const addBox = (await add.boundingBox())!;
    expect(addBox.x).toBeGreaterThan(lastColumn.x + lastColumn.width);

    await page.reload();
    await expect.poll(() => columnTitles(page)).toEqual(['To Do', 'In progress', 'Done']);
  });
}

test('an empty board shows only Add another column', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockColumnsApi(page);
  await openBoard(page);
  await expect(page.getByRole('button', { name: 'Add another column' })).toBeVisible();
  await expect(page.locator('.workspace-column')).toHaveCount(0);
  await expect(page.getByRole('list', { name: 'Columns' })).toBeHidden();
});

test('column API errors keep the form and its value', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const state = await mockColumnsApi(page, ['To Do']);
  await openBoard(page);
  await page.getByRole('button', { name: 'Add another column' }).click();
  const modal = page.getByRole('dialog', { name: 'Add column' });
  const title = modal.getByRole('textbox', { name: 'Title' });

  state.createError = {
    status: 400,
    json: { message: ['title must be shorter'], error: 'Bad Request', statusCode: 400 },
  };
  await title.fill('Review');
  await modal.getByRole('button', { name: 'Add' }).click();
  await expect(modal.getByRole('alert')).toHaveText('title must be shorter');
  await expect(title).toHaveValue('Review');

  state.createError = null;
  state.abortCreate = true;
  await modal.getByRole('button', { name: 'Add' }).click();
  await expect(modal.getByRole('alert')).toHaveText('Could not add the column. Please try again.');
  await expect(title).toHaveValue('Review');
  expect(await columnTitles(page)).toEqual(['To Do']);

  state.abortCreate = false;
  await modal.getByRole('button', { name: 'Add' }).click();
  await expect(modal).toBeHidden();
  await expect.poll(() => columnTitles(page)).toEqual(['To Do', 'Review']);
});

test('a failed column load recovers with Try again', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const state = await mockColumnsApi(page, ['To Do']);
  state.failList = true;
  await page.goto('/home?boardId=' + boardId);
  const board = page.getByRole('region', { name: 'Board canvas' });
  await expect(board.getByRole('alert')).toHaveText('Could not load the columns of this board.', {
    timeout: 15_000,
  });
  await expect(page.getByRole('button', { name: 'Add another column' })).toHaveCount(0);
  state.failList = false;
  await board.getByRole('button', { name: 'Try again' }).click();
  await expect.poll(() => columnTitles(page)).toEqual(['To Do']);
});

test('the Add column modal works from the keyboard', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockColumnsApi(page);
  await openBoard(page);
  const add = page.getByRole('button', { name: 'Add another column' });
  await add.focus();
  await page.keyboard.press('Enter');
  const modal = page.getByRole('dialog', { name: 'Add column' });
  await expect(modal.getByRole('textbox', { name: 'Title' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(modal).toBeHidden();
  await expect(add).toBeFocused();
  // The focus ring (2px + 2px offset) must not be clipped by the scrolling canvas.
  const ring = (await add.boundingBox())!;
  const canvas = (await page.locator('.workspace-canvas').boundingBox())!;
  expect(ring.y - 4).toBeGreaterThanOrEqual(canvas.y);
  expect(ring.x - 4).toBeGreaterThanOrEqual(canvas.x);

  await page.keyboard.press('Enter');
  await page.keyboard.type('Backlog');
  await page.keyboard.press('Enter');
  await expect(modal).toBeHidden();
  await expect.poll(() => columnTitles(page)).toEqual(['Backlog']);
});

const longTitles = [
  'To Do',
  'In progress',
  'A column with a very long name that does not fit into its header at all',
  'Supercalifragilisticexpialidocious-column-title-without-any-spaces-at-all',
  'Review',
  'Done',
];

for (const width of [375, 768, 1440]) {
  test(`many columns scroll inside the canvas only at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 700 });
    await mockColumnsApi(page, longTitles);
    await openBoard(page);
    await expect(page.locator('.workspace-column')).toHaveCount(longTitles.length);

    const long = page.getByRole('heading', { level: 2, name: longTitles[2] });
    await expect(long).toHaveAttribute('title', longTitles[2]);
    expect(await long.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);

    const fixed = async () => ({
      header: await page.locator('.app-shell__header').boundingBox(),
      heading: await page.locator('.workspace-board__heading').boundingBox(),
      sidebar: width >= 1440 ? await page.locator('.app-shell__sidebar').boundingBox() : null,
    });
    const before = await fixed();
    const canvas = page.locator('.workspace-canvas');
    await canvas.evaluate((element) => {
      element.scrollLeft = element.scrollWidth;
    });
    await expect.poll(() => canvas.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
    expect(await fixed()).toEqual(before);
    expect(
      await page.evaluate(() => ({
        width: document.documentElement.scrollWidth - innerWidth,
        height: document.documentElement.scrollHeight - innerHeight,
      })),
    ).toEqual({ width: 0, height: 0 });
    // At the far right the last control is Add another column, fully inside the canvas.
    const canvasBox = (await canvas.boundingBox())!;
    const addBox = (await page.getByRole('button', { name: 'Add another column' }).boundingBox())!;
    expect(addBox.x + addBox.width).toBeLessThanOrEqual(canvasBox.x + canvasBox.width);
    expect(addBox.x + addBox.width).toBeGreaterThan(canvasBox.x + canvasBox.width - 40);
  });
}

test('each column scrolls its cards while its header and Add another card stay', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 700 });
  await mockColumnsApi(page, ['To Do', 'Done']);
  await openBoard(page);
  const column = page.locator('.workspace-column').first();
  // Card rendering arrives with #44; stress the scroll area with test-only DOM content.
  await column.locator('.workspace-column__cards').evaluate((cards) => {
    for (let index = 0; index < 12; index += 1) {
      const card = document.createElement('div');
      card.textContent = `Stress card ${index}`;
      card.style.height = '154px';
      cards.append(card);
    }
  });
  const header = column.locator('.workspace-column__header');
  const addCard = column.getByRole('button', { name: 'Add another card to To Do' });
  const before = [await header.boundingBox(), await addCard.boundingBox()];
  expect(before[1]!.y + before[1]!.height).toBeLessThanOrEqual(700);

  const cards = column.locator('.workspace-column__cards');
  await cards.evaluate((element) => {
    element.scrollTop = 600;
  });
  await expect.poll(() => cards.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  expect([await header.boundingBox(), await addCard.boundingBox()]).toEqual(before);
  expect(await page.locator('.workspace-canvas').evaluate((element) => element.scrollTop)).toBe(0);
});

const addColumnColors = {
  dark: { surface: 'rgb(18, 18, 18)', tile: 'rgb(255, 255, 255)' },
  light: { surface: 'rgb(255, 255, 255)', tile: 'rgb(22, 22, 22)' },
  violet: { surface: 'rgb(255, 255, 255)', tile: 'rgb(82, 85, 188)' },
};

for (const theme of ['dark', 'light', 'violet'] as const) {
  test(`columns and Add column modal accessibility in ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await mockColumnsApi(page, ['To Do', 'In progress', 'Done']);
    await openBoard(page);
    await page.locator('html').evaluate((element, value) => {
      element.dataset.theme = value;
    }, theme);
    await expect(page.locator('.workspace-column')).toHaveCount(3);
    const add = page.getByRole('button', { name: 'Add another column' });
    await expect(add).toHaveCSS('background-color', addColumnColors[theme].surface);
    await expect(add.locator('svg path').first()).toHaveCSS('fill', addColumnColors[theme].tile);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.getByRole('button', { name: 'Add another column' }).click();
    await expect(page.getByRole('dialog', { name: 'Add column' })).toBeVisible();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
}

test('the no-board prompt opens New board', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await mockColumnsApi(page);
  await page.goto('/home');
  await expect(page.getByRole('heading', { level: 1, name: 'Your workspace' })).toBeAttached();
  await page.getByRole('button', { name: 'to create a board' }).click();
  await expect(page.getByRole('dialog', { name: 'New board' })).toBeVisible();
});
