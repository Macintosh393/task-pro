import { expect, test } from '@playwright/test';

const themes = {
  Dark: {
    selected: 'rgb(31, 31, 31)',
    hover: 'rgb(38, 38, 38)',
    label: 'rgb(184, 184, 184)',
    text: 'rgb(255, 255, 255)',
    helpText: 'rgb(255, 255, 255)',
    helpSurface: 'rgb(31, 31, 31)',
    indicator: 'rgb(190, 219, 176)',
  },
  Light: {
    selected: 'rgb(246, 246, 247)',
    hover: 'rgb(251, 251, 252)',
    label: 'rgb(98, 98, 98)',
    text: 'rgb(22, 22, 22)',
    helpText: 'rgb(22, 22, 22)',
    helpSurface: 'rgb(246, 246, 247)',
    indicator: 'rgb(79, 112, 66)',
  },
  Violet: {
    selected: 'rgb(99, 102, 195)',
    hover: 'rgb(103, 105, 196)',
    label: 'rgb(225, 226, 245)',
    text: 'rgb(255, 255, 255)',
    helpText: 'rgb(22, 22, 22)',
    helpSurface: 'rgb(236, 237, 253)',
    indicator: 'rgb(255, 255, 255)',
  },
} as const;

for (const [theme, colors] of Object.entries(themes)) {
  test(`Sidebar rows, actions and help card use the sidebar roles in ${theme}`, async ({
    page,
  }) => {
    await page.goto(
      `/iframe.html?id=workspace-sidebar--active&viewMode=story&globals=theme:${theme}`,
    );
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme.toLowerCase());

    const rows = page.locator('.workspace-board-list li');
    const active = rows.nth(0);
    const inactive = rows.nth(1);
    const inactiveSelect = inactive.locator('button[title]');
    const edit = inactive.locator('button[aria-label^="Edit "]');

    await expect(active).toHaveCSS('background-color', colors.selected);
    await expect(active.locator('button[title]')).toHaveCSS('color', colors.text);
    await expect(active.locator('span[aria-hidden="true"]')).toHaveCSS(
      'background-color',
      colors.indicator,
    );
    await expect(active.getByRole('button', { name: /^Edit / })).toHaveCSS('display', 'flex');

    await expect(inactive).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(inactiveSelect).toHaveCSS('color', colors.label);
    await expect(edit).toHaveCSS('display', 'none');

    await inactive.hover();
    await expect(inactive).toHaveCSS('background-color', colors.hover);
    await expect(inactiveSelect).toHaveCSS('color', colors.text);
    await expect(edit).toHaveCSS('display', 'flex');
    await edit.hover();
    await expect(edit).toHaveCSS('color', colors.text);

    await page.mouse.move(0, 0);
    await inactiveSelect.focus();
    await page.keyboard.press('Tab');
    await expect(edit).toBeFocused();
    await expect(edit).toHaveCSS('display', 'flex');

    const help = page.getByRole('button', { name: 'Need help?' });
    await expect(help).toHaveCSS('color', colors.helpText);
    await expect(help).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(help.locator('xpath=..')).toHaveCSS('background-color', colors.helpSurface);
    await help.hover();
    await expect(help).toHaveCSS('color', colors.helpText);
    await expect(help).toHaveCSS('text-decoration-line', 'underline');
  });
}
