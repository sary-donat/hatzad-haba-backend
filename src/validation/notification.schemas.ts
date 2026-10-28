import { z } from './zod';
import { booleanQuery, idSchema, paginationQuery } from './common.schemas';

export const listNotificationsQuery = z.object({
  unreadOnly: booleanQuery.optional(),
  ...paginationQuery,
});

export const dashboardQuery = z.object({
  userId: idSchema.optional(),
});
