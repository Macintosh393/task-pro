import { MaxLength, validate } from 'class-validator';

import { hasAtMostCodePoints, MaxCodePoints } from './max-code-points.decorator.js';

class Sample {
  @MaxCodePoints(5)
  value: unknown;
}

class LegacySample {
  @MaxLength(5)
  value: unknown;
}

async function errorsFor(type: new () => { value: unknown }, value: unknown) {
  const instance = Object.assign(new type(), { value });

  return validate(instance);
}

const HEART = '❤️'; // ❤️ — two code points: U+2764 and VARIATION SELECTOR-16

describe('hasAtMostCodePoints', () => {
  it.each([
    ['empty string', '', 0, true],
    ['ASCII at the limit', 'abcde', 5, true],
    ['ASCII over the limit', 'abcdef', 5, false],
    ['variation selector counted separately', HEART.repeat(3), 5, false],
    ['variation selectors at the limit', `${HEART.repeat(2)}a`, 5, true],
    ['text variation selector U+FE0E', 'abcd︎', 4, false],
    ['surrogate pair counted once', '\u{1F680}'.repeat(5), 5, true],
    ['combining mark counted separately', 'é'.repeat(3), 5, false],
    ['lone surrogate counted once', 'abcd\uD800', 5, true],
  ])('%s', (_label, value, max, expected) => {
    expect(hasAtMostCodePoints(value, max)).toBe(expected);
  });
});

describe('@MaxCodePoints', () => {
  it('accepts a string within the limit', async () => {
    expect(await errorsFor(Sample, 'abcde')).toHaveLength(0);
  });

  it('rejects a string over the limit with a MaxLength-compatible message', async () => {
    const [error] = await errorsFor(Sample, 'abcdef');

    expect(error.constraints).toEqual({ maxCodePoints: 'value must be shorter than or equal to 5 characters' });
  });

  // Regression: validator 13.15.x isLength does not count U+FE0E/U+FE0F, PostgreSQL varchar does.
  it('rejects variation selectors that @MaxLength lets through', async () => {
    const value = HEART.repeat(3); // 6 code points

    expect(await errorsFor(LegacySample, value)).toHaveLength(0);
    expect(await errorsFor(Sample, value)).toHaveLength(1);
  });

  it.each([
    ['a number', 12],
    ['null', null],
    ['an array', ['a']],
    ['an object', { length: 1 }],
  ])('rejects %s, like @MaxLength', async (_label, value) => {
    expect(await errorsFor(Sample, value)).toHaveLength(1);
  });
});
