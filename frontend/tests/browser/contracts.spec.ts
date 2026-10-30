import { test } from '@playwright/test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

test('keyboard, modal, fields, upload and Figma geometry in three themes', async () => {
  await promisify(execFile)(process.execPath, ['scripts/ui-kit-browser.cjs'], {
    env: { ...process.env, UI_KIT_QA_OUTPUT: `test-results/${process.platform}/contracts` },
    timeout: 170_000,
  });
});
