import { z } from 'zod';

export const userStatusSchema = z.object({ active: z.boolean() }).strict();
export const passwordOperationSchema = z.object({ forceChange: z.boolean().default(true) }).strict();
export const demoPasswordsSchema = z.object({ userIds: z.array(z.string().min(1)).min(1).max(100), forceChange: z.boolean().default(false) }).strict();
