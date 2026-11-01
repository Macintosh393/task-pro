import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const viewports = [
  {
    name: 'mobile',
    width: 375,
    height: 812,
    imageSize: 124,
    imageY: 211,
    logoWidth: 166,
    ctaY: 517,
    ctaWidth: 335,
  },
  {
    name: 'tablet',
    width: 768,
    height: 1024,
    imageSize: 162,
    imageY: 293,
    logoWidth: 222,
    ctaY: 647,
    ctaWidth: 344,
  },
  {
    name: 'desktop',
    width: 1440,
    height: 770,
    imageSize: 162,
    imageY: 166,
    logoWidth: 222,
    ctaY: 520,
    ctaWidth: 344,
  },
];

for (const viewport of viewports) {
  for (const theme of ['Dark', 'Light', 'Violet']) {
    test(`Welcome ${viewport.name} keeps source geometry and colors in ${theme}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(
        `/iframe.html?id=pages-welcome--default&viewMode=story&globals=theme:${theme}`,
      );
      const main = page.getByRole('main', { name: 'Task Pro' });
      await expect(main).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme.toLowerCase());

      const illustration = main.locator('img[src*="illustration"]');
      await expect
        .poll(() => illustration.evaluate((image: HTMLImageElement) => image.naturalWidth))
        .toBe(420);
      const imageBox = await illustration.boundingBox();
      expect(imageBox?.width).toBe(viewport.imageSize);
      expect(imageBox?.height).toBe(viewport.imageSize);
      expect(imageBox?.y).toBeCloseTo(viewport.imageY, 0);
      const heading = page.getByRole('heading', { level: 1, name: 'Task Pro' });
      expect((await heading.boundingBox())?.width).toBeCloseTo(viewport.logoWidth, 0);
      const mark = heading.locator('img');
      await expect
        .poll(() => mark.evaluate((image: HTMLImageElement) => image.naturalWidth))
        .toBe(viewport.width < 768 ? 40 : 48);
      await expect(mark).toHaveCSS('width', viewport.width < 768 ? '40px' : '48px');

      const registration = page.getByRole('link', { name: 'Registration', exact: true });
      await expect(registration).toHaveAttribute('href', '/register');
      await expect(registration).toHaveCSS('background-color', 'rgb(22, 22, 22)');
      await expect(registration).toHaveCSS('color', 'rgb(255, 255, 255)');
      const actionBox = await registration.boundingBox();
      expect(actionBox?.width).toBe(viewport.ctaWidth);
      expect(actionBox?.height).toBe(49);
      expect(actionBox?.y).toBeCloseTo(viewport.ctaY, 0);
      const login = page.getByRole('link', { name: 'Log In', exact: true });
      await expect(login).toHaveAttribute('href', '/login');
      expect((await login.boundingBox())?.height).toBeGreaterThanOrEqual(44);
      await expect(login).toHaveCSS('color', 'rgb(22, 22, 22)');

      const texture = main.locator('img[src*="texture"]');
      if (viewport.width < 768) {
        await expect(texture).toBeHidden();
      } else {
        const textureBox = await texture.boundingBox();
        expect(textureBox).toMatchObject({ x: 0, y: -54, width: 1600, height: 900 });
        await expect(texture.locator('..')).toHaveCSS('mix-blend-mode', 'color-burn');
        await expect(texture.locator('..')).toHaveCSS('opacity', '0.02');
      }

      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(viewport.width);
      const report = await new AxeBuilder({ page })
        .include('main')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(report.violations).toEqual([]);
      expect(errors).toEqual([]);
    });
  }
}

test('Welcome links support keyboard navigation to the auth route contract', async ({ page }) => {
  await page.goto('/iframe.html?id=pages-welcome--default&viewMode=story');
  await page.getByRole('main', { name: 'Task Pro' }).waitFor();
  const registration = page.getByRole('link', { name: 'Registration', exact: true });
  const login = page.getByRole('link', { name: 'Log In', exact: true });
  await page.keyboard.press('Tab');
  await expect(registration).toBeFocused();
  await expect(registration).toHaveCSS('outline-style', 'solid');
  await expect(registration).toHaveCSS('outline-color', 'rgb(22, 22, 22)');
  await registration.hover();
  await expect(registration).toHaveCSS('background-color', 'rgb(31, 31, 31)');
  await page.keyboard.press('Tab');
  await expect(login).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(registration).toBeFocused();
  await page.route('**/register', (route) =>
    route.fulfill({ status: 200, contentType: 'text/plain', body: 'Registration route' }),
  );
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/register$/);

  await page.goto('/iframe.html?id=pages-welcome--default&viewMode=story');
  await login.waitFor();
  await login.focus();
  await page.route('**/login', (route) =>
    route.fulfill({ status: 200, contentType: 'text/plain', body: 'Login route' }),
  );
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/login$/);
});

test('Welcome stays scrollable at 320px and increased text size', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 400 });
  await page.goto('/iframe.html?id=pages-welcome--default&viewMode=story');
  const login = page.getByRole('link', { name: 'Log In', exact: true });
  await login.waitFor();
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  const description = page.locator('main p');
  const textMetrics = await description.evaluate((text) => {
    const styles = getComputedStyle(text);
    return {
      fontSize: parseFloat(styles.fontSize),
      lineHeight: parseFloat(styles.lineHeight),
      height: text.getBoundingClientRect().height,
      scrollHeight: text.scrollHeight,
      overflowY: styles.overflowY,
    };
  });
  expect(textMetrics.fontSize).toBe(28);
  expect(textMetrics.lineHeight).toBeGreaterThanOrEqual(textMetrics.fontSize);
  expect(textMetrics.lineHeight / textMetrics.fontSize).toBeCloseTo(18 / 14);
  expect(textMetrics.height).toBeGreaterThanOrEqual(textMetrics.scrollHeight - 2);
  expect(textMetrics.overflowY).toBe('visible');
  const registration = page.getByRole('link', { name: 'Registration', exact: true });
  const descriptionBox = await description.boundingBox();
  const actionBox = await registration.boundingBox();
  expect(descriptionBox!.y + descriptionBox!.height).toBeLessThan(actionBox!.y);
  await login.scrollIntoViewIfNeeded();
  await expect(login).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
});
