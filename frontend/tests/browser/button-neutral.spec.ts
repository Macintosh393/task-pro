import { expect, test } from '@playwright/test';

for (const theme of ['Dark', 'Light', 'Violet']) {
  test(`Neutral button geometry, icon colors and keyboard activation in ${theme}`, async ({
    page,
  }) => {
    await page.goto(
      `/iframe.html?id=ui-button--add-another-column&viewMode=story&globals=theme:${theme}`,
    );
    const button = page.getByRole('button', { name: 'Add another column', exact: true });
    await expect(button).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme.toLowerCase());
    await expect(button).toHaveCSS('background-color', 'rgb(22, 22, 22)');
    await expect(button).toHaveCSS('color', 'rgb(255, 255, 255)');
    await expect(button).toHaveCSS('border-radius', '8px');
    await expect(button).toHaveCSS('font-size', '14px');
    await expect(button).toHaveCSS('font-family', 'Poppins, sans-serif');
    await expect(button).toHaveCSS('font-weight', '500');
    await expect(button).toHaveCSS('line-height', '21px');
    await expect(button).toHaveCSS('letter-spacing', '-0.28px');
    await expect(button).toHaveCSS('gap', '8px');
    const bounds = await button.boundingBox();
    expect(bounds?.width).toBe(334);
    expect(bounds?.height).toBe(56);
    const icon = button.locator('svg');
    await expect(icon).toHaveAttribute('aria-hidden', 'true');
    await expect(icon).toHaveCSS('width', '28px');
    await expect(icon).toHaveCSS('height', '28px');
    await expect(icon.locator('path').first()).toHaveCSS('fill', 'rgb(255, 255, 255)');
    await expect(icon.locator('path').nth(1)).toHaveCSS('stroke', 'rgb(22, 22, 22)');
    const content = await button.evaluate((element) => {
      const text = Array.from(element.childNodes).find((node) => node.nodeType === Node.TEXT_NODE)!;
      const range = document.createRange();
      range.selectNode(text);
      const label = range.getBoundingClientRect();
      const icon = element.querySelector('svg')!.getBoundingClientRect();
      const button = element.getBoundingClientRect();
      return {
        gap: label.x - icon.right,
        groupWidth: label.right - icon.left,
        buttonWidth: button.width,
        insetX: icon.x - button.x,
        insetY: icon.y - button.y,
      };
    });
    expect(content.gap).toBe(8);
    expect(content.insetX).toBeCloseTo((content.buttonWidth - content.groupWidth) / 2, 1);
    expect(content.insetY).toBe(14);
    await button.hover();
    await expect(button).toHaveCSS('background-color', 'rgb(31, 31, 31)');
    await expect(icon.locator('path').first()).toHaveCSS('fill', 'rgb(255, 255, 255)');
    await button.evaluate((element) => {
      element.dataset.activations = '0';
      element.addEventListener('click', () => {
        element.dataset.activations = String(Number(element.dataset.activations) + 1);
      });
    });
    await button.click();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    await expect(button).toBeFocused();
    await expect(button).toHaveCSS('outline-style', 'solid');
    await expect(button).toHaveCSS('outline-width', '2px');
    await expect(button).toHaveCSS('outline-offset', '2px');
    await expect(button).toHaveCSS(
      'outline-color',
      theme === 'Dark' ? 'rgb(255, 255, 255)' : 'rgb(22, 22, 22)',
    );
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    await expect(button).toHaveAttribute('data-activations', '3');
  });

  test(`Neutral plain and disabled/loading states in ${theme}`, async ({ page }) => {
    await page.goto(`/iframe.html?id=ui-button--neutral&viewMode=story&globals=theme:${theme}`);
    const plain = page.getByRole('button', { name: 'Registration', exact: true });
    await expect(plain).toHaveCSS('background-color', 'rgb(22, 22, 22)');
    await expect(plain).toHaveCSS('color', 'rgb(255, 255, 255)');
    await expect(plain.locator('svg')).toHaveCount(0);
    expect((await plain.boundingBox())?.width).toBe(344);
    expect((await plain.boundingBox())?.height).toBe(56);

    for (const state of ['disabled', 'loading']) {
      await page.goto(
        `/iframe.html?id=ui-button--neutral-${state}&viewMode=story&globals=theme:${theme}`,
      );
      const button = page.getByRole('button', { name: 'Add another column', exact: true });
      await expect(button).toBeDisabled();
      expect((await button.boundingBox())?.width).toBe(334);
      expect((await button.boundingBox())?.height).toBe(56);
      await expect(button).toHaveCSS(
        'background-color',
        theme === 'Dark' ? 'rgb(48, 48, 48)' : 'rgb(231, 231, 231)',
      );
      await expect(button).toHaveCSS(
        'color',
        theme === 'Dark' ? 'rgb(184, 184, 184)' : 'rgb(98, 98, 98)',
      );
      await button.hover({ force: true });
      await expect(button).toHaveCSS(
        'background-color',
        theme === 'Dark' ? 'rgb(48, 48, 48)' : 'rgb(231, 231, 231)',
      );
      expect(
        await button.evaluate((element: HTMLButtonElement) => {
          let activations = 0;
          element.addEventListener('click', () => activations++);
          element.click();
          return activations;
        }),
      ).toBe(0);
      if (state === 'loading') {
        await expect(button).toHaveAttribute('aria-busy', 'true');
        await expect(button.locator('.ui-spinner')).toBeVisible();
      } else {
        await expect(button).not.toHaveAttribute('aria-busy');
      }
    }
  });
}
