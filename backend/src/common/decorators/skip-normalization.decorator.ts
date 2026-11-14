import 'reflect-metadata';

export const SKIP_NORMALIZATION_KEY = 'skipNormalization';

/**
 * Excludes a DTO property from `NormalizeTextPipe`, so its value reaches the
 * handler byte-for-byte as the client sent it. Use it for secrets such as
 * passwords, where normalization would change what gets hashed or compared.
 *
 * Applies to top-level properties of the DTO bound to `@Body()`, `@Query()` or
 * `@Param()`. Keys matching `SENSITIVE_KEY_PATTERN` are skipped even without it.
 */
export function SkipNormalization(): PropertyDecorator {
  return (target, propertyKey) => {
    const inherited = getSkippedProperties(target.constructor);

    Reflect.defineMetadata(SKIP_NORMALIZATION_KEY, new Set([...inherited, propertyKey]), target);
  };
}

export function getSkippedProperties(metatype: unknown): ReadonlySet<string | symbol> {
  if (typeof metatype !== 'function' || metatype.prototype === undefined) {
    return new Set();
  }

  return (
    (Reflect.getMetadata(SKIP_NORMALIZATION_KEY, metatype.prototype as object) as Set<string | symbol>) ?? new Set()
  );
}
