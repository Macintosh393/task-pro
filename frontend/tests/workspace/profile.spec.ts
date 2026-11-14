import { test, expect } from '@playwright/test';

for (const width of [375, 768, 1440]) {
  for (const theme of ['dark', 'light', 'violet']) {
    test(`profile saves and restores focus at ${width}px in ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 812 });
      let user = {
        id: 'self',
        username: 'Current user',
        email: 'current@example.com',
        avatarUrl: null,
        theme,
      };
      let saves = 0;
      let finishSave!: () => void;
      const saving = new Promise<void>((resolve) => {
        finishSave = resolve;
      });
      await page.route('**/api/users/me', async (route) => {
        if (route.request().method() === 'PATCH') {
          saves++;
          const data = route.request().postDataJSON();
          await saving;
          user = { ...user, ...data };
        }
        await route.fulfill({ json: user });
      });
      await page.goto('/home');
      await page.evaluate((value) => {
        document.documentElement.dataset.theme = value;
      }, theme);
      const trigger = page.getByRole('button', { name: 'Edit profile: Current user' });
      await trigger.focus();
      await page.keyboard.press('Enter');
      const dialog = page.getByRole('dialog', { name: 'Edit profile' });
      await expect(dialog).toBeVisible();
      await expect(dialog.getByLabel('Name', { exact: true })).toHaveValue(user.username);
      await expect(dialog.getByLabel('Email', { exact: true })).toHaveValue(user.email);
      await dialog.getByRole('button', { name: 'Save changes' }).focus();
      await page.keyboard.press('Tab');
      await expect(dialog.getByRole('button', { name: 'Close dialog' })).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      await expect(dialog.getByRole('button', { name: 'Save changes' })).toBeFocused();
      if (width === 375 && theme === 'dark') {
        await page.screenshot({ path: 'test-results/profile-mobile.png' });
      }
      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();
      await expect(trigger).toBeFocused();
      await trigger.click();
      await dialog.getByLabel('Name', { exact: true }).fill(' Updated user ');
      await dialog.getByLabel('Email', { exact: true }).fill('Updated@Example.COM');
      const save = dialog.getByRole('button', { name: 'Save changes' });
      await save.click();
      await expect(save).toBeDisabled();
      await expect.poll(() => saves).toBe(1);
      finishSave();
      await expect(dialog).not.toBeVisible();
      const updatedTrigger = page.getByRole('button', { name: 'Edit profile: Updated user' });
      await expect(updatedTrigger).toBeVisible();
      await expect(updatedTrigger).toBeFocused();
      await page.reload();
      await updatedTrigger.click();
      await expect(dialog.getByLabel('Email', { exact: true })).toHaveValue('updated@example.com');
      const bounds = await dialog.boundingBox();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
      await dialog.getByRole('button', { name: 'Close dialog' }).click();
      await expect(updatedTrigger).toBeFocused();
    });
  }
}

test('profile preserves edits on conflicts and network errors and permits retry', async ({
  page,
}) => {
  const user = {
    id: 'self',
    username: 'Current user',
    email: 'current@example.com',
    avatarUrl: null,
    theme: 'dark',
  };
  let attempts = 0;
  await page.route('**/api/users/me', async (route) => {
    if (route.request().method() !== 'PATCH') return route.fulfill({ json: user });
    attempts++;
    if (attempts === 1)
      return route.fulfill({ status: 409, json: { message: 'Email is already registered' } });
    if (attempts === 2) return route.abort();
    return route.fulfill({ json: { ...user, ...route.request().postDataJSON() } });
  });
  await page.goto('/home');
  await page.getByRole('button', { name: 'Edit profile: Current user' }).click();
  const dialog = page.getByRole('dialog', { name: 'Edit profile' });
  await dialog.getByLabel('Name', { exact: true }).fill('   ');
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  await expect(dialog.getByText('Name must contain between 1 and 32 characters.')).toBeVisible();
  expect(attempts).toBe(0);
  await dialog.getByLabel('Name', { exact: true }).fill('Edited user');
  await dialog.getByLabel('Email', { exact: true }).fill('taken@example.com');
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  await expect(dialog.getByText('This email is already registered.')).toBeVisible();
  await expect(dialog.getByLabel('Name', { exact: true })).toHaveValue('Edited user');
  await expect(dialog.getByLabel('Email', { exact: true })).toHaveValue('taken@example.com');
  await dialog.getByLabel('Email', { exact: true }).fill('free@example.com');
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  await expect(dialog.getByRole('alert')).toBeVisible();
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Edit profile: Edited user' })).toBeVisible();
});
