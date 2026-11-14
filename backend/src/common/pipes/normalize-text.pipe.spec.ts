import type { ArgumentMetadata } from '@nestjs/common';

import { SkipNormalization } from '../decorators/skip-normalization.decorator.js';
import { NormalizeTextPipe } from './normalize-text.pipe.js';

const DECOMPOSED = 'Café'; // "Café" with a combining acute accent
const COMPOSED = 'Café';

class ProfileDto {
  name: string;

  @SkipNormalization()
  pin: string;
}

class ExtendedProfileDto extends ProfileDto {
  @SkipNormalization()
  recoveryPhrase: string;
}

describe('NormalizeTextPipe', () => {
  const pipe = new NormalizeTextPipe();
  const body = (metatype?: ArgumentMetadata['metatype'], data?: string): ArgumentMetadata => ({
    type: 'body',
    metatype,
    data,
  });

  it('normalizes a top-level string to NFC', () => {
    expect(pipe.transform({ title: DECOMPOSED }, body())).toEqual({ title: COMPOSED });
  });

  it('normalizes strings in nested objects and arrays', () => {
    const result = pipe.transform({ columns: [{ title: DECOMPOSED, tags: [DECOMPOSED] }] }, body());

    expect(result).toEqual({ columns: [{ title: COMPOSED, tags: [COMPOSED] }] });
  });

  it.each(['query', 'param'] as const)('normalizes %s values', (type) => {
    expect(pipe.transform({ search: DECOMPOSED }, { type })).toEqual({ search: COMPOSED });
    expect(pipe.transform(DECOMPOSED, { type, data: 'search' })).toBe(COMPOSED);
  });

  it('leaves values from custom param decorators untouched', () => {
    const user = { sub: DECOMPOSED };

    expect(pipe.transform(user, { type: 'custom' })).toBe(user);
  });

  it('leaves non-string primitives and non-plain objects untouched', () => {
    const date = new Date();
    const buffer = Buffer.from(DECOMPOSED);

    expect(pipe.transform({ n: 1, b: true, z: null, u: undefined, date, buffer }, body())).toEqual({
      n: 1,
      b: true,
      z: null,
      u: undefined,
      date,
      buffer,
    });
  });

  it('does not alter variation selectors (length is enforced by @MaxCodePoints)', () => {
    const heart = '❤️';

    expect(pipe.transform({ title: heart }, body())).toEqual({ title: heart });
  });

  describe('sensitive fields', () => {
    it.each(['password', 'newPassword', 'current_password', 'PASSWORD', 'passphrase', 'clientSecret', 'refreshToken'])(
      'keeps "%s" byte-for-byte at any depth',
      (key) => {
        const result = pipe.transform({ [key]: DECOMPOSED, nested: { [key]: DECOMPOSED } }, body());

        expect(result).toEqual({ [key]: DECOMPOSED, nested: { [key]: DECOMPOSED } });
      },
    );

    it('keeps a whole sensitive subtree unchanged', () => {
      const result = pipe.transform({ secrets: { value: DECOMPOSED } }, body());

      expect(result).toEqual({ secrets: { value: DECOMPOSED } });
    });

    it('keeps a field bound directly with @Body("password")', () => {
      expect(pipe.transform(DECOMPOSED, body(String, 'password'))).toBe(DECOMPOSED);
    });

    it('honours @SkipNormalization() on DTO properties, including inherited ones', () => {
      const payload = { name: DECOMPOSED, pin: DECOMPOSED, recoveryPhrase: DECOMPOSED };

      expect(pipe.transform(payload, body(ProfileDto))).toEqual({
        name: COMPOSED,
        pin: DECOMPOSED,
        recoveryPhrase: COMPOSED,
      });
      expect(pipe.transform(payload, body(ExtendedProfileDto))).toEqual({
        name: COMPOSED,
        pin: DECOMPOSED,
        recoveryPhrase: DECOMPOSED,
      });
    });

    it('does not leak @SkipNormalization() from a subclass to its parent', () => {
      expect(pipe.transform({ recoveryPhrase: DECOMPOSED }, body(ProfileDto))).toEqual({ recoveryPhrase: COMPOSED });
    });
  });

  it('does not mutate the input', () => {
    const input = { title: DECOMPOSED, nested: { title: DECOMPOSED } };

    pipe.transform(input, body());

    expect(input).toEqual({ title: DECOMPOSED, nested: { title: DECOMPOSED } });
  });

  it('keeps a "__proto__" JSON key as an own property instead of changing the prototype', () => {
    const input = JSON.parse('{"__proto__": {"polluted": "yes"}, "title": "x"}') as Record<string, unknown>;

    const result = pipe.transform(input, body()) as Record<string, unknown>;

    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
    expect(Object.hasOwn(result, '__proto__')).toBe(true);
    expect((result as { polluted?: unknown }).polluted).toBeUndefined();
  });

  it('preserves a null prototype (as produced by the query string parser)', () => {
    const query = Object.assign(Object.create(null) as Record<string, unknown>, { q: DECOMPOSED });

    const result = pipe.transform(query, { type: 'query' }) as Record<string, unknown>;

    expect(Object.getPrototypeOf(result)).toBeNull();
    expect(result.q).toBe(COMPOSED);
  });

  it('does not overflow the stack on deeply nested input', () => {
    let deep: unknown = DECOMPOSED;
    for (let i = 0; i < 10_000; i += 1) {
      deep = [deep];
    }

    expect(() => pipe.transform({ deep }, body())).not.toThrow();
  });
});
