import { z } from 'zod';

export const createColumnSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(255, 'Title must be at most 255 characters'),
});

export type CreateColumnValues = z.input<typeof createColumnSchema>;

export const createColumnDefaults: CreateColumnValues = { title: '' };
