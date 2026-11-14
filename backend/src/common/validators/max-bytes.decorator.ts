import { buildMessage, ValidateBy, type ValidationArguments, type ValidationOptions } from 'class-validator';

export const MAX_BYTES = 'maxBytes';

/**
 * Fails unless the value is a string of at most `max` bytes in UTF-8.
 *
 * Use it where a limit is defined in bytes rather than characters, such as
 * bcrypt, which silently ignores everything after the first 72 bytes. A Cyrillic
 * letter takes 2 bytes and most emoji take 4, so a character limit is not enough.
 *
 * Unlike `@IsByteLength()`, it does not throw on lone surrogates (they count as
 * U+FFFD, 3 bytes, which is also how bcryptjs encodes them).
 */
export function MaxBytes(max: number, validationOptions?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    {
      name: MAX_BYTES,
      constraints: [max],
      validator: {
        validate: (value: unknown, args?: ValidationArguments) =>
          typeof value === 'string' && Buffer.byteLength(value, 'utf8') <= (args?.constraints[0] as number),
        defaultMessage: buildMessage(
          (eachPrefix) => `${eachPrefix}$property must be at most $constraint1 bytes long in UTF-8`,
          validationOptions,
        ),
      },
    },
    validationOptions,
  );
}
