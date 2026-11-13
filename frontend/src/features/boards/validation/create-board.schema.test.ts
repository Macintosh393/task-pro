import { describe, expect, it } from 'vitest';
import { boardIdSchema, createBoardDefaults, createBoardSchema } from './create-board.schema';

describe('createBoardSchema', () => {
  it('defaults to the first icon and no background', () => {
    expect(createBoardDefaults).toEqual({ title: '', icon: 'project', background: 'none' });
  });

  it('requires a non-blank title and trims it', () => {
    expect(createBoardSchema.safeParse(createBoardDefaults).success).toBe(false);
    expect(createBoardSchema.safeParse({ ...createBoardDefaults, title: '   ' }).success).toBe(
      false,
    );
    expect(createBoardSchema.parse({ ...createBoardDefaults, title: '  Roadmap ' }).title).toBe(
      'Roadmap',
    );
  });

  it('limits the title to 255 characters', () => {
    expect(
      createBoardSchema.safeParse({ ...createBoardDefaults, title: 'a'.repeat(255) }).success,
    ).toBe(true);
    expect(
      createBoardSchema.safeParse({ ...createBoardDefaults, title: 'a'.repeat(256) }).success,
    ).toBe(false);
  });

  it('accepts only backend icon and background ids', () => {
    expect(
      createBoardSchema.safeParse({ title: 'A', icon: 'hexagon', background: 'bg-15' }).success,
    ).toBe(true);
    expect(
      createBoardSchema.safeParse({ title: 'A', icon: 'rocket', background: 'none' }).success,
    ).toBe(false);
    expect(
      createBoardSchema.safeParse({ title: 'A', icon: 'star', background: 'bg-16' }).success,
    ).toBe(false);
  });
});

describe('boardIdSchema', () => {
  it('accepts uuids and rejects other strings', () => {
    expect(boardIdSchema.safeParse('3f0d6a52-8a0e-4c4f-9f3b-2d6f4a1e9c11').success).toBe(true);
    expect(boardIdSchema.safeParse('office').success).toBe(false);
  });
});
