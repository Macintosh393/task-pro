export const BOARD_ICONS = [
  'project',
  'star',
  'loading',
  'puzzle',
  'container',
  'lightning',
  'colors',
  'hexagon',
] as const;

export const BOARD_BACKGROUNDS = [
  'none',
  'bg-01',
  'bg-02',
  'bg-03',
  'bg-04',
  'bg-05',
  'bg-06',
  'bg-07',
  'bg-08',
  'bg-09',
  'bg-10',
  'bg-11',
  'bg-12',
  'bg-13',
  'bg-14',
  'bg-15',
] as const;

export type BoardIcon = (typeof BOARD_ICONS)[number];
export type BoardBackground = (typeof BOARD_BACKGROUNDS)[number];

export const DEFAULT_BOARD_ICON: BoardIcon = BOARD_ICONS[0];
export const DEFAULT_BOARD_BACKGROUND: BoardBackground = 'none';
