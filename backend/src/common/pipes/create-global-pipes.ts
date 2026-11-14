import { ValidationPipe, type PipeTransform } from '@nestjs/common';

import { NormalizeTextPipe } from './normalize-text.pipe.js';

/**
 * Global pipes in execution order. Shared by `main.ts` and the e2e tests so that
 * both run requests through the same pipeline. Normalization must come first, so
 * that validation measures the value that gets persisted.
 */
export function createGlobalPipes(): PipeTransform[] {
  return [
    new NormalizeTextPipe(),
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  ];
}
