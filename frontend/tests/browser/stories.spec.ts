import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';

type Entry = { id: string; title: string; type: string };
const index = JSON.parse(
  readFileSync(new URL('../../storybook-static/index.json', import.meta.url), 'utf8'),
) as { entries: Record<string, Entry> };
const stories = Object.values(index.entries).filter((entry) => entry.type === 'story');

const initialized = new WeakSet<Page>();

async function openStory(page: Page, id: string, theme: string) {
  if (!initialized.has(page)) {
    initialized.add(page);
    await page.addInitScript(() => {
      const state = window as typeof window & {
        storyResult?: { status: string };
        __STORYBOOK_ADDONS_CHANNEL__?: {
          on: (event: string, listener: (result: { status: string }) => void) => void;
        };
      };
      const timer = setInterval(() => {
        if (state.__STORYBOOK_ADDONS_CHANNEL__) {
          state.__STORYBOOK_ADDONS_CHANNEL__.on('storyFinished', (result) => {
            state.storyResult = result;
          });
          clearInterval(timer);
        }
      }, 0);
    });
  }
  await page.goto(`/iframe.html?id=${id}&viewMode=story&globals=theme:${theme}`);
  await page.waitForFunction(() =>
    Boolean((window as typeof window & { storyResult?: unknown }).storyResult),
  );
  expect(
    await page.evaluate(
      () => (window as typeof window & { storyResult?: { status: string } }).storyResult?.status,
    ),
    id,
  ).toBe('success');
  await page.evaluate(() => document.fonts.ready);
}

async function tokenColor(page: Page, token: string) {
  return page.evaluate((name) => {
    const probe = document.createElement('span');
    probe.style.color = `var(${name})`;
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }, token);
}

for (const theme of ['Dark', 'Light', 'Violet']) {
  for (const story of stories) {
    test(`${theme}: ${story.id} renders, plays and passes axe`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await openStory(page, story.id, theme);
      const report = await new AxeBuilder({ page })
        .include('#storybook-root')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(report.violations, `${theme}: ${story.id}`).toEqual([]);
      expect(errors).toEqual([]);
    });
  }

  test(`${theme}: open modal passes axe`, async ({ page }) => {
    await openStory(page, 'ui-modal--default', theme);
    await page.getByRole('button', { name: 'Open dialog' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    const report = await new AxeBuilder({ page })
      .include('dialog')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(report.violations).toEqual([]);
  });

  test(`${theme}: icon paint follows interactive state colors`, async ({ page }) => {
    await openStory(page, 'ui-design-reference--kit', theme);
    const edit = page.getByRole('button', { name: 'Edit task', exact: true });
    await expect(edit.locator('path').first()).toHaveCSS(
      'stroke',
      await tokenColor(page, '--icon-action'),
    );
    await page.evaluate(() => {
      document.documentElement.style.setProperty('--icon-action-active', 'rgb(12, 34, 56)');
    });
    await edit.hover();
    await expect(edit.locator('path').first()).toHaveCSS('stroke', 'rgb(12, 34, 56)');

    const project = page.getByRole('radio', { name: 'Project', exact: true });
    const star = page.getByRole('radio', { name: 'Star', exact: true });
    const projectGlyph = page.locator('label').filter({ has: project }).locator('path').first();
    const starGlyph = page.locator('label').filter({ has: star }).locator('path').first();
    const primary = await tokenColor(page, '--text-primary');
    const muted = await tokenColor(page, '--control-muted');
    await expect(projectGlyph).toHaveCSS('stroke', primary);
    await expect(starGlyph).toHaveCSS('stroke', muted);
    await star.check();
    await expect(projectGlyph).toHaveCSS('stroke', muted);
    await expect(starGlyph).toHaveCSS('stroke', primary);

    await openStory(page, 'ui-iconbutton--destructive', theme);
    await expect(
      page.getByRole('button', { name: 'Delete item' }).locator('path').first(),
    ).toHaveCSS('stroke', await tokenColor(page, '--action-on-danger'));
    await openStory(page, 'ui-iconbutton--disabled', theme);
    await expect(page.getByRole('button', { name: 'Add item' }).locator('path').first()).toHaveCSS(
      'stroke',
      await tokenColor(page, '--control-disabled-text'),
    );

    await openStory(page, 'ui-avatarupload--disabled', theme);
    const upload = page.getByLabel('Upload avatar');
    await expect(upload).toBeDisabled();
    await expect(page.locator('label').filter({ has: upload }).locator('path').first()).toHaveCSS(
      'stroke',
      await tokenColor(page, '--control-disabled-text'),
    );

    await openStory(page, 'ui-logoutbutton--default', theme);
    const logout = page.getByRole('button', { name: 'Log out' });
    await expect(logout.locator('path').first()).toHaveCSS(
      'stroke',
      await tokenColor(page, '--logout-icon'),
    );
    await logout.hover();
    await expect(logout.locator('path').first()).toHaveCSS(
      'stroke',
      await tokenColor(page, '--logout-hover'),
    );
    await openStory(page, 'ui-logoutbutton--disabled', theme);
    await expect(page.getByRole('button', { name: 'Log out' }).locator('path').first()).toHaveCSS(
      'stroke',
      await tokenColor(page, '--control-disabled-text'),
    );
  });

  test(`${theme}: icon artwork responds to semantic token overrides`, async ({ page }) => {
    await openStory(page, 'ui-design-reference--kit', theme);
    await page.evaluate(() => {
      for (const token of [
        '--logo-tile',
        '--logo-mark',
        '--button-icon-surface',
        '--button-icon-ink',
        '--avatar-ink',
      ]) {
        document.documentElement.style.setProperty(token, 'rgb(12, 34, 56)');
      }
    });
    const logo = page.getByText('Task Pro', { exact: true });
    await expect(logo.locator('path')).toHaveCount(2);
    for (const path of await logo.locator('path').all()) {
      await expect(path).toHaveCSS('fill', 'rgb(12, 34, 56)');
    }
    const create = page.getByRole('button', { name: 'Create', exact: true });
    await expect(create.locator('path').first()).toHaveCSS('fill', 'rgb(12, 34, 56)');
    await expect(create.locator('path').nth(1)).toHaveCSS('stroke', 'rgb(12, 34, 56)');
    const avatar = page.getByRole('img', { name: 'Your profile' });
    await expect(avatar.locator('circle')).toHaveCSS('fill', 'rgb(12, 34, 56)');
    await expect(avatar.locator('path')).toHaveCSS('fill', 'rgb(12, 34, 56)');
  });

  test(`${theme}: focus tokens and inherited line heights remain configurable`, async ({
    page,
  }) => {
    await openStory(page, 'ui-modal--default', theme);
    await page.evaluate(() => {
      document.documentElement.style.setProperty('--focus-ring-width', '3px');
      document.documentElement.style.setProperty('--focus-ring-offset', '5px');
    });
    const trigger = page.getByRole('button', { name: 'Open dialog' });
    await trigger.focus();
    await expect(trigger).toHaveCSS('outline-width', '3px');
    await expect(trigger).toHaveCSS('outline-offset', '5px');
    await trigger.press('Enter');
    const heading = page.getByRole('heading', { name: 'Edit details' });
    await expect(heading).toBeFocused();
    await expect(heading).toHaveCSS('outline-width', '3px');
    await expect(heading).toHaveCSS('outline-offset', '5px');
    await expect(page.getByText('Title', { exact: true })).toHaveCSS('line-height', '21px');
    await expect(page.getByText('A reusable modal shell.')).toHaveCSS('line-height', '21px');
    await page.getByRole('textbox', { name: 'Title' }).focus();
    await expect(page.getByRole('textbox', { name: 'Title' })).toHaveCSS('outline-width', '3px');

    await openStory(page, 'ui-avatarupload--default', theme);
    await page.evaluate(() => {
      document.documentElement.style.setProperty('--focus-ring-width', '3px');
      document.documentElement.style.setProperty('--focus-ring-offset', '5px');
    });
    const upload = page.getByLabel('Upload avatar');
    await upload.focus();
    const uploadLabel = page.locator('label').filter({ has: upload });
    await expect(uploadLabel).toHaveCSS('outline-width', '3px');
    await expect(uploadLabel).toHaveCSS('outline-offset', '5px');
  });

  test(`${theme}: visual baselines @visual`, async ({ page }) => {
    for (const id of [
      'ui-design-reference--kit',
      'ui-overview--overview',
      'ui-button--disabled',
      'ui-button--loading',
      'ui-input--error',
    ]) {
      await openStory(page, id, theme);
      await expect(page).toHaveScreenshot(`${theme}-${id}.png`, { fullPage: true });
    }
    await openStory(page, 'ui-design-reference--kit', theme);
    for (const name of ['Create', 'Add board', 'Log out', 'Move task']) {
      const button = page.getByRole('button', { name, exact: true });
      await button.hover();
      await expect(button).toHaveScreenshot(`${theme}-${name}-hover.png`);
    }
    await page.setViewportSize({ width: 320, height: 600 });
    await page.mouse.move(0, 0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      320,
    );
    await expect(page).toHaveScreenshot(`${theme}-mobile.png`, { fullPage: true });
    await openStory(page, 'ui-modal--default', theme);
    await page.getByRole('button', { name: 'Open dialog' }).click();
    await expect(page).toHaveScreenshot(`${theme}-modal.png`);
  });
}
