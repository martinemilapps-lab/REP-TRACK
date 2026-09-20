import { z } from 'zod';

export const userStatusSchema = z.object({ active: z.boolean() }).strict();
export const passwordOperationSchema = z.object({ forceChange: z.boolean().default(true) }).strict();
export const demoPasswordsSchema = z.object({ userIds: z.array(z.string().min(1)).min(1).max(100), forceChange: z.boolean().default(false) }).strict();

const positionCodeSchema = z.enum(['MR', 'DM', 'AM', 'OM', 'BUM', 'PM', 'MM', 'SMD']);
export const adminUserCreateSchema = z.object({
  name: z.string().trim().min(2, 'Real name is required').max(160),
  positionCode: positionCodeSchema,
  username: z.string().trim().toUpperCase().regex(/^(MR|DM|AM|OM|BUM|PM|MM|SMD)[1-9]\d*$/, 'Code must look like MR1, DM2, PM1, or SMD1'),
  managerUserId: z.string().min(1, 'Choose the direct manager'),
}).strict().superRefine((value, context) => {
  if (!value.username.startsWith(value.positionCode)) context.addIssue({ code: 'custom', path: ['username'], message: `Code must start with ${value.positionCode}` });
});
