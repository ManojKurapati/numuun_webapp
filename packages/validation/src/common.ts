import { z } from 'zod';

/** A UUID path/identifier. */
export const uuidSchema = z.string().uuid();

/** Standard pagination query for list endpoints. Values are coerced from strings. */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQuery = z.infer<typeof paginationSchema>;
