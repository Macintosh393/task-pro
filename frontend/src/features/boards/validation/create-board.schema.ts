import { z } from 'zod';
import { boardBackgrounds, boardIcons } from '../../../components/ui';

export const createBoardSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(255, 'Title must be at most 255 characters'),
  icon: z.enum(boardIcons),
  background: z.enum(boardBackgrounds),
});

export type CreateBoardValues = z.input<typeof createBoardSchema>;

export const createBoardDefaults: CreateBoardValues = {
  title: '',
  icon: boardIcons[0],
  background: 'none',
};

// Accepts any 8-4-4-4-12 hex id; the backend answers 400 for anything else.
export const boardIdSchema = z.guid();
