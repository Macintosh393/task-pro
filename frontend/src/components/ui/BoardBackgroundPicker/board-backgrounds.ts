export const boardBackgrounds = [
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
export type BoardBackground = (typeof boardBackgrounds)[number];
