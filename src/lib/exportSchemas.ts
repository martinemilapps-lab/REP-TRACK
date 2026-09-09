import { z } from 'zod';
import { salesAnalyticsQuerySchema } from './salesAnalytics';

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional();
const scopeMode = z.enum(['DIRECT_REPORTS', 'ALL_DESCENDANTS']).default('ALL_DESCENDANTS');

export const reportExportSchema = z.object({
  scopeMode,
  owner: z.enum(['my', 'team']).default('team'),
  repId: z.string().min(1).optional(),
  type: z.enum(['all', 'hospital', 'pharmacy', 'doctor', 'branch', 'availability', 'event', 'training', 'specialTask', 'managerActivity']).default('all'),
  startDate: date,
  endDate: date,
}).strict().refine((v) => !v.startDate || !v.endDate || v.startDate <= v.endDate, 'Invalid date range');

export const weeklyPlanExportSchema = z.object({
  scopeMode,
  repId: z.string().min(1).optional(),
  weekStart: date,
  team: z.enum(['true', 'false']).default('false'),
  includeOwn: z.enum(['true', 'false']).default('true'),
}).strict();

export const listExportSchema = z.object({ repId: z.string().min(1).optional() }).strict();
export const complianceExportSchema = z.object({type:z.enum(['DAILY_REPORT','WEEKLY_PLAN','MONTHLY_PRODUCT']),scopeMode, date,weekStart:date,month:z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional(),position:z.enum(['MR','DM','AM','OM','BUM','PM','MM','SMD']).optional(),employeeId:z.string().min(1).optional(),status:z.enum(['SUBMITTED','NOT_SUBMITTED']).optional(),search:z.string().trim().max(100).optional()}).strict().superRefine((v,c)=>{const key=v.type==='DAILY_REPORT'?'date':v.type==='WEEKLY_PLAN'?'weekStart':'month';if(!v[key])c.addIssue({code:'custom',path:[key],message:`${key} is required`});});
export const salesExportSchema = salesAnalyticsQuerySchema.omit({ page: true, pageSize: true }).strict();
