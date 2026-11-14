import { Injectable, type ArgumentMetadata, type PipeTransform } from '@nestjs/common';

import { getSkippedProperties } from '../decorators/skip-normalization.decorator.js';

/**
 * Keys whose values are never normalized, at any depth: passwords, secrets and
 * tokens must be hashed and compared exactly as the client typed them.
 */
export const SENSITIVE_KEY_PATTERN = /pass(word|phrase)|secret|token/i;

/** Deeper structures are left untouched instead of risking a stack overflow. */
const MAX_DEPTH = 32;

/**
 * Normalizes every string in the request body, query and route params to
 * Unicode NFC, so that visually identical input (`é` vs `e` + U+0301) is stored,
 * compared and length-checked the same way.
 *
 * Register it before `ValidationPipe`: NFC may change the number of code points,
 * and validation must measure the value that is actually persisted.
 *
 * Skipped: values from custom param decorators (e.g. `@CurrentUser()`), keys
 * matching `SENSITIVE_KEY_PATTERN`, and DTO properties marked `@SkipNormalization()`.
 */
@Injectable()
export class NormalizeTextPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    if (metadata.type === 'custom') {
      return value;
    }

    // `@Body('password')` and the like receive the field itself, not the whole DTO.
    if (metadata.data !== undefined && isSensitiveKey(metadata.data)) {
      return value;
    }

    return normalize(value, getSkippedProperties(metadata.metatype), 0);
  }
}

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERN.test(key);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const prototype: unknown = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}

function normalize(value: unknown, skipped: ReadonlySet<string | symbol>, depth: number): unknown {
  if (typeof value === 'string') {
    return value.normalize('NFC');
  }

  if (depth >= MAX_DEPTH) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalize(item, NO_SKIPPED, depth + 1));
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const result = Object.create(Object.getPrototypeOf(value) as object | null) as Record<string, unknown>;

  for (const [key, item] of Object.entries(value)) {
    const keep = skipped.has(key) || isSensitiveKey(key);

    // defineProperty rather than assignment: a JSON key "__proto__" must stay an own property.
    Object.defineProperty(result, key, {
      value: keep ? item : normalize(item, NO_SKIPPED, depth + 1),
      writable: true,
      enumerable: true,
      configurable: true,
    });
  }

  return result;
}

const NO_SKIPPED: ReadonlySet<string | symbol> = new Set();
