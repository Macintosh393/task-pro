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

for (const theme of ['Dark', 'Light', 'Violet']) {
  test(`${theme}: every story renders, plays and passes axe`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    for (const story of stories) {
      await test.step(story.id, async () => {
        await openStory(page, story.id, theme);
        const report = await new AxeBuilder({ page })
          .include('#storybook-root')
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze();
        expect(report.violations, `${theme}: ${story.id}`).toEqual([]);
      });
    }
    expect(errors).toEqual([]);
  });

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
