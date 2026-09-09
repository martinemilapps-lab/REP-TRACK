import { z } from 'zod';

export const hierarchyCreateSchema = z.object({ subordinateUserId:z.string().min(1), managerUserId:z.string().min(1) }).strict();
export const assignmentCreateSchema = z.object({ userId:z.string().min(1), assignmentType:z.enum(['PRIMARY_REP','PERSONAL_MR','TERRITORY_COVERAGE']), titleRaw:z.string().trim().min(1).max(120), businessLine:z.number().int().min(1).max(99).nullable().optional(), areaId:z.string().nullable().optional(), territoryName:z.string().trim().min(1).max(160), repId:z.string().nullable().optional(), isActive:z.boolean().default(true) }).strict();
export const assignmentUpdateSchema = assignmentCreateSchema.omit({userId:true}).partial().strict();
export const representativeCreateSchema = z.object({ name:z.string().trim().min(1).max(160), area:z.string().trim().min(1).max(160), assignedHospitals:z.number().int().min(0).default(0), assignedPharmacies:z.number().int().min(0).default(0), assignedDrs:z.number().int().min(0).default(0), isActive:z.boolean().default(true) }).strict();
export const representativeUpdateSchema = representativeCreateSchema.partial().strict();
export const areaCreateSchema = z.object({ name:z.string().trim().min(1).max(160), region:z.string().trim().max(160).nullable().optional(), isActive:z.boolean().default(true) }).strict();
export const areaUpdateSchema = areaCreateSchema.partial().strict();
export const productCreateSchema = z.object({ name:z.string().trim().min(1).max(160), code:z.string().trim().max(80).nullable().optional(), category:z.string().trim().max(120).nullable().optional(), isActive:z.boolean().default(true) }).strict();
export const productUpdateSchema = productCreateSchema.partial().strict();
export const objectiveCreateSchema = z.object({ positionCode:z.enum(['MR','DM','AM','OM','BUM','PM','MM','SMD']), objectiveCode:z.string().trim().min(1).max(80), nameAr:z.string().trim().min(1).max(160), nameEn:z.string().trim().min(1).max(160), displayOrder:z.number().int().min(0).max(999), isActive:z.boolean().default(true) }).strict();
export const objectiveUpdateSchema = objectiveCreateSchema.omit({ positionCode:true, objectiveCode:true }).partial().strict();
