import { BOARD_BACKGROUNDS, BOARD_ICONS, DEFAULT_BOARD_BACKGROUND, DEFAULT_BOARD_ICON } from './board-options.js';

describe('board options', () => {
  it('exposes exactly the 8 icons used by the frontend picker, in order', () => {
    expect([...BOARD_ICONS]).toEqual([
      'project',
      'star',
      'loading',
      'puzzle',
      'container',
      'lightning',
      'colors',
      'hexagon',
    ]);
  });

  it('exposes 16 backgrounds: "none" plus 15 images', () => {
    expect(BOARD_BACKGROUNDS).toHaveLength(16);
    expect(BOARD_BACKGROUNDS).toContain('none');
    expect(BOARD_BACKGROUNDS.filter((id) => id !== 'none')).toHaveLength(15);
  });

  it('names image backgrounds bg-01 … bg-15', () => {
    const images = BOARD_BACKGROUNDS.filter((id) => id !== 'none');

    expect(images).toEqual(Array.from({ length: 15 }, (_, index) => `bg-${String(index + 1).padStart(2, '0')}`));
  });

  it('has no duplicate ids', () => {
    expect(new Set(BOARD_ICONS).size).toBe(BOARD_ICONS.length);
    expect(new Set(BOARD_BACKGROUNDS).size).toBe(BOARD_BACKGROUNDS.length);
  });

  it('defaults to the first icon and no background', () => {
    expect(DEFAULT_BOARD_ICON).toBe(BOARD_ICONS[0]);
    expect(DEFAULT_BOARD_BACKGROUND).toBe('none');
  });

  it('keeps every id within the varchar(50) column limit', () => {
    for (const id of [...BOARD_ICONS, ...BOARD_BACKGROUNDS]) {
      expect(id.length).toBeLessThanOrEqual(50);
    }
  });
});
