import { spawnSync } from 'node:child_process';

const image =
  'mcr.microsoft.com/playwright:v1.64.1-noble@sha256:47b510dd9230bf0b9bfc9b20102241e577ea7a99334ab4c3ca19f19770e9b8ea';
const result = spawnSync(
  'docker',
  [
    'run',
    '--rm',
    '--platform',
    'linux/amd64',
    '--ipc=host',
    '-v',
    `${process.cwd()}:/work`,
    '-w',
    '/work',
    '-e',
    'CI=1',
    image,
    'node',
    'node_modules/@playwright/test/cli.js',
    'test',
    '--grep',
    '@visual',
    ...process.argv.slice(2),
  ],
  { stdio: 'inherit' },
);
if (result.error) console.error(result.error.message);
process.exitCode = result.status ?? 1;
