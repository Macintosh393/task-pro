import { expect, test } from '@playwright/test';

for (const initialPath of ['/register', '/login']) {
  test(`auth tabs preserve the document from ${initialPath}`, async ({ page }) => {
    await page.route('**/api/users/me', (route) => route.fulfill({ status: 401, json: {} }));
    await page.route('**/api/auth/refresh', (route) => route.fulfill({ status: 401, json: {} }));
    await page.goto(`${initialPath}?redirect=%2Fhome`);
    await expect(page.locator('form')).toBeVisible();
    const identity = await page.evaluate(() => {
      const marker = crypto.randomUUID();
      Reflect.set(window, 'authTransitionDocument', marker);
      return { marker, timeOrigin: performance.timeOrigin };
    });
    const documents: string[] = [];
    const authRequests: string[] = [];
    page.on('request', (request) => {
      if (request.resourceType() === 'document') documents.push(request.url());
      const path = new URL(request.url()).pathname;
      if (path === '/api/users/me' || path === '/api/auth/refresh') authRequests.push(path);
    });
    for (let index = 0; index < 4; index++) {
      const nextPath = new URL(page.url()).pathname === '/register' ? '/login' : '/register';
      const name = nextPath === '/login' ? 'Log In' : 'Registration';
      const link = page.getByRole('link', { name, exact: true });
      await expect(link).toHaveAttribute('href', nextPath);
      await link.click();
      await expect(page).toHaveURL(`http://127.0.0.1:5175${nextPath}`);
      await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
      expect(
        await page.evaluate(() => ({
          marker: Reflect.get(window, 'authTransitionDocument'),
          timeOrigin: performance.timeOrigin,
        })),
      ).toEqual(identity);
    }
    expect(documents).toEqual([]);
    expect(authRequests).toEqual([]);
  });
}
