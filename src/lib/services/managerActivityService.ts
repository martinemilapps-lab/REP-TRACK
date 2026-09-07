import { db, managerActivities, users } from '@/lib/db';
import { eq, and, desc, gte, lte, inArray } from 'drizzle-orm';
import { UserSessionPayload } from '@/lib/auth';
import { assertManagerSession, assertManagerOwner } from '@/lib/authPolicy';
import { ManagerActivitySchema, ManagerActivityFiltersSchema } from '@/lib/validation';
import { ManagerActivityRecord } from '@/types';
import { z } from 'zod';
import { hierarchyService, HierarchyScopeMode } from './hierarchyService';

export type ManagerActivityInput = z.infer<typeof ManagerActivitySchema>;

/**
 * Saves a manager activity report linked directly to the authenticated user identity.
 * Never uses or fakes a representative ID.
 */
export async function saveManagerActivity(
  session: UserSessionPayload | null,
  rawInput: unknown
): Promise<ManagerActivityRecord> {
  assertManagerSession(session);

  const parsed = ManagerActivitySchema.parse(rawInput);
  const now = new Date();

  const [inserted] = await db
    .insert(managerActivities)
    .values({
      userId: session.id,
      activityType: parsed.activityType,
      activityDate: parsed.activityDate,
      visitType: parsed.activityType === 'Visit' ? parsed.visitType : null,
      accompaniedPerson: parsed.activityType === 'Visit' && parsed.visitType === 'Double' ? parsed.accompaniedPerson : null,
      morningHospitalName: parsed.activityType === 'Visit' ? parsed.morningHospitalName : null,
      morningDoctorNames: parsed.activityType === 'Visit' ? parsed.morningDoctorNames : null,
      morningSpecialty: parsed.activityType === 'Visit' ? parsed.morningSpecialty : null,
      morningHospitalComment: parsed.activityType === 'Visit' ? parsed.morningHospitalComment : null,
      afternoonDoctorNames: parsed.activityType === 'Visit' ? parsed.afternoonDoctorNames : null,
      afternoonSpecialty: parsed.activityType === 'Visit' ? parsed.afternoonSpecialty : null,
      afternoonDoctorComment: parsed.activityType === 'Visit' ? parsed.afternoonDoctorComment : null,
      afternoonPharmacyName: parsed.activityType === 'Visit' ? parsed.afternoonPharmacyName : null,
      afternoonPharmacyComment: parsed.activityType === 'Visit' ? parsed.afternoonPharmacyComment : null,
      generalComment: parsed.activityType === 'Visit' ? parsed.generalComment : null,
      eventName: parsed.activityType === 'Event' ? parsed.eventName : null,
      eventType: parsed.activityType === 'Event' ? parsed.eventType : null,
      location: parsed.activityType === 'Event' ? parsed.location : null,
      attendees: parsed.activityType === 'Event' ? parsed.attendees : null,
      budget: parsed.activityType === 'Event' ? parsed.budget : null,
      trainingType: parsed.activityType === 'Training' ? parsed.trainingType : null,
      trainingTopic: parsed.activityType === 'Training' ? parsed.trainingTopic : null,
      trainingLocation: parsed.activityType === 'Training' ? parsed.trainingLocation : null,
      participants: parsed.activityType === 'Training' ? parsed.participants : null,
      workSummary: parsed.activityType === 'Office Working' ? parsed.workSummary : null,
      description: parsed.activityType === 'Others' ? parsed.description : null,
      notes: parsed.notes || null,
      submittedAt: now,
      updatedAt: now,
    })
    .returning();

  return formatManagerActivity(inserted, session.name, session.positionCode ?? undefined);
}

export async function getManagerActivitiesForTeam(session: UserSessionPayload | null, filters: {
  startDate?: string; endDate?: string; activityType?: string; subordinateUserId?: string; positionCode?: string; scopeMode?: HierarchyScopeMode;
} = {}): Promise<ManagerActivityRecord[]> {
  assertManagerSession(session);
  let userIds = await hierarchyService.getScopedUserIds(session, filters.scopeMode);
  if (filters.subordinateUserId) {
    if (!userIds.includes(filters.subordinateUserId)) return [];
    userIds = [filters.subordinateUserId];
  }
  if (!userIds.length) return [];
  const conditions = [inArray(managerActivities.userId, userIds)];
  if (filters.startDate) conditions.push(gte(managerActivities.activityDate, filters.startDate));
  if (filters.endDate) conditions.push(lte(managerActivities.activityDate, filters.endDate));
  if (filters.activityType && filters.activityType !== 'All') conditions.push(eq(managerActivities.activityType, filters.activityType as ManagerActivityRecord['activityType']));
  if (filters.positionCode) conditions.push(eq(users.positionCode, filters.positionCode));
  const rows = await db.select({ activity: managerActivities, userName: users.name, userPosition: users.positionCode })
    .from(managerActivities).innerJoin(users, eq(managerActivities.userId, users.id)).where(and(...conditions))
    .orderBy(desc(managerActivities.activityDate), desc(managerActivities.submittedAt)).all();
  return rows.map((r) => formatManagerActivity(r.activity, r.userName, r.userPosition ?? undefined));
}

/**
 * Retrieves activities for the logged-in manager with optional date and type filters.
 */
export async function getManagerActivities(
  session: UserSessionPayload | null,
  filters: {
    startDate?: string;
    endDate?: string;
    activityType?: string;
  } = {}
): Promise<ManagerActivityRecord[]> {
  assertManagerSession(session);

  filters = ManagerActivityFiltersSchema.parse(filters);
  const conditions = [eq(managerActivities.userId, session.id)];

  if (filters.startDate) {
    conditions.push(gte(managerActivities.activityDate, filters.startDate));
  }
  if (filters.endDate) {
    conditions.push(lte(managerActivities.activityDate, filters.endDate));
  }
  if (filters.activityType && filters.activityType !== 'All') {
    conditions.push(eq(managerActivities.activityType, filters.activityType as ManagerActivityRecord['activityType']));
  }

  const rows = await db
    .select()
    .from(managerActivities)
    .where(and(...conditions))
    .orderBy(desc(managerActivities.activityDate), desc(managerActivities.submittedAt))
    .all();

  return rows.map((r) => formatManagerActivity(r, session.name, session.positionCode ?? undefined));
}

/**
 * Retrieves a single manager activity by ID.
 */
export async function getManagerActivityById(
  session: UserSessionPayload | null,
  id: string
): Promise<ManagerActivityRecord | null> {
  assertManagerSession(session);

  const row = await db
    .select()
    .from(managerActivities)
    .where(eq(managerActivities.id, id))
    .get();

  if (!row) return null;

  // Enforce access control
  await hierarchyService.assertUserVisible(session, row.userId);

  const owner = await db.select({ name: users.name, positionCode: users.positionCode })
    .from(users).where(eq(users.id, row.userId)).get();
  return formatManagerActivity(row, owner?.name, owner?.positionCode ?? undefined);
}

/**
 * Deletes a manager activity by ID.
 */
export async function deleteManagerActivity(
  session: UserSessionPayload | null,
  id: string
): Promise<boolean> {
  assertManagerSession(session);

  const existing = await db
    .select()
    .from(managerActivities)
    .where(eq(managerActivities.id, id))
    .get();

  if (!existing) return false;

  assertManagerOwner(session, existing.userId);

  await db.delete(managerActivities).where(and(eq(managerActivities.id, id), eq(managerActivities.userId, session.id))).run();
  return true;
}

function formatManagerActivity(
  row: typeof managerActivities.$inferSelect,
  userName?: string,
  userPosition?: string
): ManagerActivityRecord {
  return {
    id: row.id,
    userId: row.userId,
    userName,
    userPosition,
    activityType: row.activityType,
    activityDate: row.activityDate,
    visitType: row.visitType ?? undefined,
    accompaniedPerson: row.accompaniedPerson ?? undefined,
    morningHospitalName: row.morningHospitalName ?? undefined,
    morningDoctorNames: row.morningDoctorNames ?? undefined,
    morningSpecialty: row.morningSpecialty ?? undefined,
    morningHospitalComment: row.morningHospitalComment ?? undefined,
    afternoonDoctorNames: row.afternoonDoctorNames ?? undefined,
    afternoonSpecialty: row.afternoonSpecialty ?? undefined,
    afternoonDoctorComment: row.afternoonDoctorComment ?? undefined,
    afternoonPharmacyName: row.afternoonPharmacyName ?? undefined,
    afternoonPharmacyComment: row.afternoonPharmacyComment ?? undefined,
    generalComment: row.generalComment ?? undefined,
    eventName: row.eventName ?? undefined,
    eventType: row.eventType ?? undefined,
    location: row.location ?? undefined,
    attendees: row.attendees ?? undefined,
    budget: row.budget ?? undefined,
    trainingType: row.trainingType ?? undefined,
    trainingTopic: row.trainingTopic ?? undefined,
    trainingLocation: row.trainingLocation ?? undefined,
    participants: row.participants ?? undefined,
    workSummary: row.workSummary ?? undefined,
    description: row.description ?? undefined,
    notes: row.notes ?? undefined,
    submittedAt: row.submittedAt ? new Date(row.submittedAt).toISOString() : undefined,
    updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : undefined,
  };
}
