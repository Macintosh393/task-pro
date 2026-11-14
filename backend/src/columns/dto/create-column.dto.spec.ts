import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CreateColumnDto } from './create-column.dto.js';

async function check(payload: unknown) {
  const dto = plainToInstance(CreateColumnDto, payload);
  const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });

  return { dto, fields: errors.map((error) => error.property) };
}

describe('CreateColumnDto', () => {
  describe('valid input', () => {
    it('accepts a title', async () => {
      const { fields } = await check({ title: 'To Do' });

      expect(fields).toEqual([]);
    });

    it('trims surrounding whitespace and measures the length after trimming', async () => {
      const { dto, fields } = await check({ title: `  ${'a'.repeat(255)}  ` });

      expect(fields).toEqual([]);
      expect(dto.title).toHaveLength(255);
    });

    it('accepts 255 code points that include variation selectors', async () => {
      const { fields } = await check({ title: `${'❤️'.repeat(127)}a` });

      expect(fields).toEqual([]);
    });

    it('counts a surrogate-pair emoji as a single code point, like PostgreSQL', async () => {
      const { fields } = await check({ title: '\u{1F680}'.repeat(255) });

      expect(fields).toEqual([]);
    });

    it('accepts unicode titles', async () => {
      const { fields } = await check({ title: 'У процесі 🚧' });

      expect(fields).toEqual([]);
    });
  });

  describe('invalid input', () => {
    it.each<[string, unknown]>([
      ['a missing title', {}],
      ['an empty title', { title: '' }],
      ['a whitespace-only title', { title: ' \t\n ' }],
      ['a 256-character title', { title: 'a'.repeat(256) }],
      ['256 code points with variation selectors', { title: '❤️'.repeat(128) }],
      ['a title with a null character', { title: 'To\u0000Do' }],
      ['a numeric title', { title: 1 }],
      ['a null title', { title: null }],
      ['an array title', { title: ['To Do'] }],
    ])('rejects %s', async (_label, payload) => {
      const { fields } = await check(payload);

      expect(fields).toEqual(['title']);
    });

    it.each(['boardId', 'position', 'id', 'createdAt'])('rejects an extra "%s" field', async (field) => {
      const { fields } = await check({ title: 'To Do', [field]: 'x' });

      expect(fields).toEqual([field]);
    });
  });
});
