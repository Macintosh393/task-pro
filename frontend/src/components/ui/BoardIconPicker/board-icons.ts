export const boardIcons = [
  'project',
  'star',
  'loading',
  'puzzle',
  'container',
  'lightning',
  'colors',
  'hexagon',
] as const;
export type BoardIcon = (typeof boardIcons)[number];
