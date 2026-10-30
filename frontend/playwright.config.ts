import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  outputDir: `test-results/${process.platform}`,
  fullyParallel: true,
  workers: 2,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  timeout: 180_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: { animations: 'disabled', maxDiffPixelRatio: 0.001 },
  },
  use: {
    baseURL: 'http://127.0.0.1:6008',
    browserName: 'chromium',
    viewport: { width: 900, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
    locale: 'en-US',
    timezoneId: 'Europe/Kyiv',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node scripts/serve-storybook.mjs',
    url: 'http://127.0.0.1:6008/index.json',
    reuseExistingServer: false,
  },
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: `playwright-report/${process.platform}` }],
  ],
});
