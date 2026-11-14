import { buildMessage, ValidateBy, type ValidationArguments, type ValidationOptions } from 'class-validator';

export const MAX_CODE_POINTS = 'maxCodePoints';

/**
 * Returns true when `value` has at most `max` Unicode code points.
 *
 * A surrogate pair counts once and a lone surrogate counts once (node-pg sends it
 * as U+FFFD), which is how PostgreSQL measures `varchar(n)` in a UTF-8 database.
 * Counting stops as soon as the limit is exceeded.
 */
export function hasAtMostCodePoints(value: string, max: number): boolean {
  // Every string is at least ceil(length / 2) and at most `length` code points long.
  if (value.length <= max) {
    return true;
  }

  let count = 0;

  // codePointAt returns > 0xFFFF only at the start of a valid surrogate pair.
  for (let index = 0; index < value.length; index += (value.codePointAt(index) ?? 0) > 0xffff ? 2 : 1) {
    count += 1;

    if (count > max) {
      return false;
    }
  }

  return true;
}

/**
 * Drop-in replacement for `@MaxLength()` on columns backed by `varchar(n)`.
 *
 * `@MaxLength()` delegates to `validator.isLength`, which does not count
 * variation selectors (U+FE0E/U+FE0F) and therefore lets through strings that
 * PostgreSQL rejects with SQLSTATE 22001. This decorator counts every code point.
 * Non-string values fail, mirroring `@MaxLength()`.
 */
export function MaxCodePoints(max: number, validationOptions?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    {
      name: MAX_CODE_POINTS,
      constraints: [max],
      validator: {
        validate: (value: unknown, args?: ValidationArguments) =>
          typeof value === 'string' && hasAtMostCodePoints(value, args?.constraints[0] as number),
        defaultMessage: buildMessage(
          (eachPrefix) => `${eachPrefix}$property must be shorter than or equal to $constraint1 characters`,
          validationOptions,
        ),
      },
    },
    validationOptions,
  );
}
