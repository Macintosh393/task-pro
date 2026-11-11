import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { BOARD_BACKGROUNDS, BOARD_ICONS } from '../board-options.js';
import { CreateBoardDto } from './create-board.dto.js';

async function check(payload: unknown) {
  const dto = plainToInstance(CreateBoardDto, payload);
  const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });

  return { dto, fields: errors.map((error) => error.property) };
}

describe('CreateBoardDto', () => {
  describe('valid input', () => {
    it('accepts a title only', async () => {
      const { fields } = await check({ title: 'Project Alpha' });

      expect(fields).toEqual([]);
    });

    it.each([...BOARD_ICONS])('accepts icon "%s"', async (icon) => {
      const { fields } = await check({ title: 'Board', icon });

      expect(fields).toEqual([]);
    });

    it.each([...BOARD_BACKGROUNDS])('accepts background "%s"', async (background) => {
      const { fields } = await check({ title: 'Board', background });

      expect(fields).toEqual([]);
    });

    it('accepts a title of exactly 255 characters', async () => {
      const { fields } = await check({ title: 'a'.repeat(255) });

      expect(fields).toEqual([]);
    });

    it('trims surrounding whitespace from the title', async () => {
      const { dto, fields } = await check({ title: '   Roadmap  ' });

      expect(fields).toEqual([]);
      expect(dto.title).toBe('Roadmap');
    });

    it('measures the length after trimming', async () => {
      const { dto, fields } = await check({ title: `  ${'a'.repeat(255)}  ` });

      expect(fields).toEqual([]);
      expect(dto.title).toHaveLength(255);
    });

    it('accepts unicode and emoji titles', async () => {
      const { fields } = await check({ title: 'Проєкт «Весна» 🚀' });

      expect(fields).toEqual([]);
    });

    it('leaves icon and background undefined when omitted (defaults are applied by the service)', async () => {
      const { dto } = await check({ title: 'Board' });

      expect(dto.icon).toBeUndefined();
      expect(dto.background).toBeUndefined();
    });
  });

  describe('invalid title', () => {
    it.each([
      ['missing', undefined],
      ['empty string', ''],
      ['whitespace only', '     '],
      ['tabs and newlines only', '\t\n '],
      ['256 characters', 'a'.repeat(256)],
      ['a number', 123],
      ['an object', { value: 'x' }],
      ['an array', ['x']],
      ['null', null],
      ['a boolean', true],
    ])('rejects a title that is %s', async (_label, title) => {
      const { fields } = await check({ title });

      expect(fields).toContain('title');
    });
  });

  describe('invalid icon', () => {
    it.each([
      ['empty string', ''],
      ['wrong case', 'Star'],
      ['unknown id', 'rocket'],
      ['padded id', ' star '],
      ['a number', 1],
      ['null', null],
      ['an object', { id: 'star' }],
      ['an array', ['star']],
    ])('rejects an icon that is %s', async (_label, icon) => {
      const { fields } = await check({ title: 'Board', icon });

      expect(fields).toContain('icon');
    });
  });

  describe('invalid background', () => {
    it.each([
      ['empty string', ''],
      ['out of range (bg-16)', 'bg-16'],
      ['out of range (bg-00)', 'bg-00'],
      ['wrong case', 'BG-01'],
      ['unpadded number', 'bg-1'],
      ['a number', 0],
      ['null', null],
      ['an object', { id: 'none' }],
    ])('rejects a background that is %s', async (_label, background) => {
      const { fields } = await check({ title: 'Board', background });

      expect(fields).toContain('background');
    });
  });

  describe('unexpected fields', () => {
    it.each(['userId', 'id', 'iconId', 'backgroundId', 'createdAt'])('rejects the extra field "%s"', async (field) => {
      const { fields } = await check({ title: 'Board', [field]: 'x' });

      expect(fields).toContain(field);
    });
  });
});
