import { db, weeklyPlans, representatives, managerWeeklyPlans, users } from '@/lib/db';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { UserSessionPayload, resolveAuthorizedRepId } from '@/lib/auth';
import { AppError } from '@/lib/errors';
import { assertAuthenticatedSession, assertManagerSession, assertManagerOwner } from '@/lib/authPolicy';
import { z } from 'zod';
import { WeeklyPlanSchema, WeeklyPlanStatusUpdateSchema, ManagerPlanStatusSchema } from '@/lib/validation';
import { WeeklyPlanRecord } from '@/types';
import { hierarchyService, HierarchyScopeMode } from './hierarchyService';

export type WeeklyPlanInput = z.input<typeof WeeklyPlanSchema>;

/**
 * Saves or updates a weekly plan for a representative or a manager.
 */
export async function saveWeeklyPlan(
  session: UserSessionPayload | null,
  rawInput: WeeklyPlanInput
): Promise<WeeklyPlanRecord> {
  assertAuthenticatedSession(session);
  const input = WeeklyPlanSchema.parse(rawInput);

  if (input.userId !== undefined) {
    assertManagerOwner(session, input.userId);
    if (!input.isManagerPersonal) throw new AppError('userId requires a personal manager plan', 400);
  }
  if (input.isManagerPersonal) {
    assertManagerSession(session);
    // STEP 19 supports submit/resubmit only. Approval and reviewer notes are STEP 20.
    ManagerPlanStatusSchema.parse(input.status);
    if (input.managerNotes) throw new AppError('Administrative notes are unavailable for personal plans', 400);
    const fields = {
      startDate: input.startDate, endDate: input.endDate,
      saturdayAm: input.saturdayAm, saturdayPm: input.saturdayPm,
      sundayAm: input.sundayAm, sundayPm: input.sundayPm,
      mondayAm: input.mondayAm, mondayPm: input.mondayPm,
      tuesdayAm: input.tuesdayAm, tuesdayPm: input.tuesdayPm,
      wednesdayAm: input.wednesdayAm, wednesdayPm: input.wednesdayPm,
      thursdayAm: input.thursdayAm, thursdayPm: input.thursdayPm,
      fridayAm: input.fridayAm, fridayPm: input.fridayPm,
    };
    const values = {
      ...fields,
      userId: session.id,
      weekLabel: input.weekLabel || `${input.startDate} to ${input.endDate}`,
      status: 'Submitted' as const,
      managerNotes: '',
      updatedAt: new Date(),
    };
    // One atomic statement; the database unique index arbitrates concurrent saves.
    const [record] = await db.insert(managerWeeklyPlans).values(values)
      .onConflictDoUpdate({
        target: [managerWeeklyPlans.userId, managerWeeklyPlans.startDate],
        set: values,
      }).returning();
    return {
      ...record,
      rep: session.name,
      isManagerPlan: true,
      submittedAt: record.submittedAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    } as WeeklyPlanRecord;
  }

  let repId = session.role === 'REPRESENTATIVE' ? session.repId : (input.repId || session.repId || null);
  if (session.role === 'REPRESENTATIVE' && !repId) throw new AppError('لا يوجد مندوب مرتبط بالحساب', 403);

  if (!repId && input.rep) {
    const foundRep = await db
      .select()
      .from(representatives)
      .where(eq(representatives.name, input.rep.trim()))
      .get();
    if (foundRep) {
      repId = foundRep.id;
    }
  }

  if (!repId) throw new AppError('لم يتم العثور على المندوب المعتمد', 403);
  if (session.role === 'MANAGER') await hierarchyService.assertRepVisible(session, repId);

  // Check if a plan already exists for this rep and start_date
  const existingPlan = await db
    .select()
    .from(weeklyPlans)
    .where(
      and(
        eq(weeklyPlans.repId, repId),
        eq(weeklyPlans.startDate, input.startDate.trim())
      )
    )
    .get();

  const weekLabel = input.weekLabel || `${input.startDate} to ${input.endDate}`;

  let record;
  if (existingPlan) {
    const [updated] = await db
      .update(weeklyPlans)
      .set({
        endDate: input.endDate.trim(),
        weekLabel,
        saturdayAm: input.saturdayAm ?? '',
        saturdayPm: input.saturdayPm ?? '',
        sundayAm: input.sundayAm ?? '',
        sundayPm: input.sundayPm ?? '',
        mondayAm: input.mondayAm ?? '',
        mondayPm: input.mondayPm ?? '',
        tuesdayAm: input.tuesdayAm ?? '',
        tuesdayPm: input.tuesdayPm ?? '',
        wednesdayAm: input.wednesdayAm ?? '',
        wednesdayPm: input.wednesdayPm ?? '',
        thursdayAm: input.thursdayAm ?? '',
        thursdayPm: input.thursdayPm ?? '',
        fridayAm: input.fridayAm ?? '',
        fridayPm: input.fridayPm ?? '',
        status: (input.status as 'Draft' | 'Submitted' | 'Approved') || 'Submitted',
        managerNotes: input.managerNotes ?? existingPlan.managerNotes,
        updatedAt: new Date(),
      })
      .where(eq(weeklyPlans.id, existingPlan.id))
      .returning();
    record = updated;
  } else {
    const [inserted] = await db
      .insert(weeklyPlans)
      .values({
        repId,
        startDate: input.startDate.trim(),
        endDate: input.endDate.trim(),
        weekLabel,
        saturdayAm: input.saturdayAm ?? '',
        saturdayPm: input.saturdayPm ?? '',
        sundayAm: input.sundayAm ?? '',
        sundayPm: input.sundayPm ?? '',
        mondayAm: input.mondayAm ?? '',
        mondayPm: input.mondayPm ?? '',
        tuesdayAm: input.tuesdayAm ?? '',
        tuesdayPm: input.tuesdayPm ?? '',
        wednesdayAm: input.wednesdayAm ?? '',
        wednesdayPm: input.wednesdayPm ?? '',
        thursdayAm: input.thursdayAm ?? '',
        thursdayPm: input.thursdayPm ?? '',
        fridayAm: input.fridayAm ?? '',
        fridayPm: input.fridayPm ?? '',
        status: (input.status as 'Draft' | 'Submitted' | 'Approved') || 'Submitted',
        managerNotes: input.managerNotes ?? '',
      })
      .returning();
    record = inserted;
  }

  const rep = await db
    .select()
    .from(representatives)
    .where(eq(representatives.id, repId))
    .get();

  return {
    ...record,
    rep: rep?.name || '',
    submittedAt: record.submittedAt ? new Date(record.submittedAt).toISOString() : undefined,
    updatedAt: record.updatedAt ? new Date(record.updatedAt).toISOString() : undefined,
  } as WeeklyPlanRecord;
}

/**
 * Retrieves weekly plans with optional filtering.
 */
export async function getWeeklyPlans(
  session: UserSessionPayload | null,
  options: {
    repId?: string | null;
    repName?: string | null;
    userId?: string | null;
    personalOnly?: boolean;
    limit?: number;
    offset?: number;
  } = {}
): Promise<WeeklyPlanRecord[]> {
  assertAuthenticatedSession(session);
  if (options.userId !== undefined && options.userId !== null) {
    assertManagerOwner(session, options.userId);
  }
  if (options.personalOnly || options.userId) {
    assertManagerSession(session);
    const targetUserId = session.id;

    const results = await db
      .select({
        id: managerWeeklyPlans.id,
        userId: managerWeeklyPlans.userId,
        userName: users.name,
        startDate: managerWeeklyPlans.startDate,
        endDate: managerWeeklyPlans.endDate,
        weekLabel: managerWeeklyPlans.weekLabel,
        saturdayAm: managerWeeklyPlans.saturdayAm,
        saturdayPm: managerWeeklyPlans.saturdayPm,
        sundayAm: managerWeeklyPlans.sundayAm,
        sundayPm: managerWeeklyPlans.sundayPm,
        mondayAm: managerWeeklyPlans.mondayAm,
        mondayPm: managerWeeklyPlans.mondayPm,
        tuesdayAm: managerWeeklyPlans.tuesdayAm,
        tuesdayPm: managerWeeklyPlans.tuesdayPm,
        wednesdayAm: managerWeeklyPlans.wednesdayAm,
        wednesdayPm: managerWeeklyPlans.wednesdayPm,
        thursdayAm: managerWeeklyPlans.thursdayAm,
        thursdayPm: managerWeeklyPlans.thursdayPm,
        fridayAm: managerWeeklyPlans.fridayAm,
        fridayPm: managerWeeklyPlans.fridayPm,
        status: managerWeeklyPlans.status,
        managerNotes: managerWeeklyPlans.managerNotes,
        submittedAt: managerWeeklyPlans.submittedAt,
        updatedAt: managerWeeklyPlans.updatedAt,
      })
      .from(managerWeeklyPlans)
      .leftJoin(users, eq(managerWeeklyPlans.userId, users.id))
      .where(eq(managerWeeklyPlans.userId, targetUserId))
      .orderBy(desc(managerWeeklyPlans.submittedAt))
      .limit(options.limit || 500)
      .offset(options.offset || 0)
      .all();

    return results.map((p) => ({
      ...p,
      rep: p.userName || session?.name || 'Manager',
      isManagerPlan: true,
      submittedAt: p.submittedAt ? new Date(p.submittedAt).toISOString() : undefined,
      updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : undefined,
    })) as WeeklyPlanRecord[];
  }

  const targetRepId = resolveAuthorizedRepId(session, options.repId);
  if (session.role === 'MANAGER') {
    if (!targetRepId) throw new AppError('يجب تحديد مندوب مصرح به', 400);
    await hierarchyService.assertRepVisible(session, targetRepId);
  }

  const query = db
    .select({
      id: weeklyPlans.id,
      repId: weeklyPlans.repId,
      rep: representatives.name,
      startDate: weeklyPlans.startDate,
      endDate: weeklyPlans.endDate,
      weekLabel: weeklyPlans.weekLabel,
      saturdayAm: weeklyPlans.saturdayAm,
      saturdayPm: weeklyPlans.saturdayPm,
      sundayAm: weeklyPlans.sundayAm,
      sundayPm: weeklyPlans.sundayPm,
      mondayAm: weeklyPlans.mondayAm,
      mondayPm: weeklyPlans.mondayPm,
      tuesdayAm: weeklyPlans.tuesdayAm,
      tuesdayPm: weeklyPlans.tuesdayPm,
      wednesdayAm: weeklyPlans.wednesdayAm,
      wednesdayPm: weeklyPlans.wednesdayPm,
      thursdayAm: weeklyPlans.thursdayAm,
      thursdayPm: weeklyPlans.thursdayPm,
      fridayAm: weeklyPlans.fridayAm,
      fridayPm: weeklyPlans.fridayPm,
      status: weeklyPlans.status,
      managerNotes: weeklyPlans.managerNotes,
      submittedAt: weeklyPlans.submittedAt,
      updatedAt: weeklyPlans.updatedAt,
    })
    .from(weeklyPlans)
    .innerJoin(representatives, eq(weeklyPlans.repId, representatives.id))
    .orderBy(desc(weeklyPlans.submittedAt));

  let results;
  if (targetRepId) {
    results = await db
      .select({
        id: weeklyPlans.id,
        repId: weeklyPlans.repId,
        rep: representatives.name,
        startDate: weeklyPlans.startDate,
        endDate: weeklyPlans.endDate,
        weekLabel: weeklyPlans.weekLabel,
        saturdayAm: weeklyPlans.saturdayAm,
        saturdayPm: weeklyPlans.saturdayPm,
        sundayAm: weeklyPlans.sundayAm,
        sundayPm: weeklyPlans.sundayPm,
        mondayAm: weeklyPlans.mondayAm,
        mondayPm: weeklyPlans.mondayPm,
        tuesdayAm: weeklyPlans.tuesdayAm,
        tuesdayPm: weeklyPlans.tuesdayPm,
        wednesdayAm: weeklyPlans.wednesdayAm,
        wednesdayPm: weeklyPlans.wednesdayPm,
        thursdayAm: weeklyPlans.thursdayAm,
        thursdayPm: weeklyPlans.thursdayPm,
        fridayAm: weeklyPlans.fridayAm,
        fridayPm: weeklyPlans.fridayPm,
        status: weeklyPlans.status,
        managerNotes: weeklyPlans.managerNotes,
        submittedAt: weeklyPlans.submittedAt,
        updatedAt: weeklyPlans.updatedAt,
      })
      .from(weeklyPlans)
      .innerJoin(representatives, eq(weeklyPlans.repId, representatives.id))
      .where(eq(weeklyPlans.repId, targetRepId))
      .orderBy(desc(weeklyPlans.submittedAt))
      .limit(options.limit || 500)
      .offset(options.offset || 0)
      .all();
  } else if (options.repName) {
    results = await db
      .select({
        id: weeklyPlans.id,
        repId: weeklyPlans.repId,
        rep: representatives.name,
        startDate: weeklyPlans.startDate,
        endDate: weeklyPlans.endDate,
        weekLabel: weeklyPlans.weekLabel,
        saturdayAm: weeklyPlans.saturdayAm,
        saturdayPm: weeklyPlans.saturdayPm,
        sundayAm: weeklyPlans.sundayAm,
        sundayPm: weeklyPlans.sundayPm,
        mondayAm: weeklyPlans.mondayAm,
        mondayPm: weeklyPlans.mondayPm,
        tuesdayAm: weeklyPlans.tuesdayAm,
        tuesdayPm: weeklyPlans.tuesdayPm,
        wednesdayAm: weeklyPlans.wednesdayAm,
        wednesdayPm: weeklyPlans.wednesdayPm,
        thursdayAm: weeklyPlans.thursdayAm,
        thursdayPm: weeklyPlans.thursdayPm,
        fridayAm: weeklyPlans.fridayAm,
        fridayPm: weeklyPlans.fridayPm,
        status: weeklyPlans.status,
        managerNotes: weeklyPlans.managerNotes,
        submittedAt: weeklyPlans.submittedAt,
        updatedAt: weeklyPlans.updatedAt,
      })
      .from(weeklyPlans)
      .innerJoin(representatives, eq(weeklyPlans.repId, representatives.id))
      .where(eq(representatives.name, options.repName.trim()))
      .orderBy(desc(weeklyPlans.submittedAt))
      .limit(options.limit || 500)
      .offset(options.offset || 0)
      .all();
  } else {
    results = await query
      .limit(options.limit || 500)
      .offset(options.offset || 0)
      .all();
  }

  return results.map((p) => ({
    ...p,
    submittedAt: p.submittedAt ? new Date(p.submittedAt).toISOString() : undefined,
    updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : undefined,
  })) as WeeklyPlanRecord[];
}

export async function getTeamWeeklyPlans(session: UserSessionPayload | null, mode: HierarchyScopeMode = 'ALL_DESCENDANTS'): Promise<WeeklyPlanRecord[]> {
  assertManagerSession(session);
  const [userIds, repIds] = await Promise.all([hierarchyService.getScopedUserIds(session, mode), hierarchyService.getScopedRepIds(session, mode)]);
  const mrSets = await Promise.all(repIds.map((repId) => getWeeklyPlans(session, { repId })));
  const managerRows = userIds.length ? await db.select({
    id: managerWeeklyPlans.id, userId: managerWeeklyPlans.userId, userName: users.name, userPosition: users.positionCode, startDate: managerWeeklyPlans.startDate,
    endDate: managerWeeklyPlans.endDate, weekLabel: managerWeeklyPlans.weekLabel, saturdayAm: managerWeeklyPlans.saturdayAm,
    saturdayPm: managerWeeklyPlans.saturdayPm, sundayAm: managerWeeklyPlans.sundayAm, sundayPm: managerWeeklyPlans.sundayPm,
    mondayAm: managerWeeklyPlans.mondayAm, mondayPm: managerWeeklyPlans.mondayPm, tuesdayAm: managerWeeklyPlans.tuesdayAm,
    tuesdayPm: managerWeeklyPlans.tuesdayPm, wednesdayAm: managerWeeklyPlans.wednesdayAm, wednesdayPm: managerWeeklyPlans.wednesdayPm,
    thursdayAm: managerWeeklyPlans.thursdayAm, thursdayPm: managerWeeklyPlans.thursdayPm, fridayAm: managerWeeklyPlans.fridayAm,
    fridayPm: managerWeeklyPlans.fridayPm, status: managerWeeklyPlans.status, managerNotes: managerWeeklyPlans.managerNotes,
    submittedAt: managerWeeklyPlans.submittedAt, updatedAt: managerWeeklyPlans.updatedAt,
  }).from(managerWeeklyPlans).innerJoin(users, eq(managerWeeklyPlans.userId, users.id))
    .where(and(inArray(managerWeeklyPlans.userId, userIds), eq(users.isActive, true))).orderBy(desc(managerWeeklyPlans.submittedAt)).all() : [];
  const managerPlans = managerRows.map((p) => ({ ...p, rep: p.userName, isManagerPlan: true,
    submittedAt: p.submittedAt ? new Date(p.submittedAt).toISOString() : undefined,
    updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : undefined })) as WeeklyPlanRecord[];
  return [...new Map([...mrSets.flat(), ...managerPlans].map((p) => [p.id, p])).values()];
}

/** Retrieves a single weekly plan by ID. */
export async function getWeeklyPlanById(id: string, session: UserSessionPayload | null): Promise<WeeklyPlanRecord | null> {
  assertAuthenticatedSession(session);
  const plan = await db
    .select({
      id: weeklyPlans.id,
      repId: weeklyPlans.repId,
      rep: representatives.name,
      startDate: weeklyPlans.startDate,
      endDate: weeklyPlans.endDate,
      weekLabel: weeklyPlans.weekLabel,
      saturdayAm: weeklyPlans.saturdayAm,
      saturdayPm: weeklyPlans.saturdayPm,
      sundayAm: weeklyPlans.sundayAm,
      sundayPm: weeklyPlans.sundayPm,
      mondayAm: weeklyPlans.mondayAm,
      mondayPm: weeklyPlans.mondayPm,
      tuesdayAm: weeklyPlans.tuesdayAm,
      tuesdayPm: weeklyPlans.tuesdayPm,
      wednesdayAm: weeklyPlans.wednesdayAm,
      wednesdayPm: weeklyPlans.wednesdayPm,
      thursdayAm: weeklyPlans.thursdayAm,
      thursdayPm: weeklyPlans.thursdayPm,
      fridayAm: weeklyPlans.fridayAm,
      fridayPm: weeklyPlans.fridayPm,
      status: weeklyPlans.status,
      managerNotes: weeklyPlans.managerNotes,
      submittedAt: weeklyPlans.submittedAt,
      updatedAt: weeklyPlans.updatedAt,
    })
    .from(weeklyPlans)
    .innerJoin(representatives, eq(weeklyPlans.repId, representatives.id))
    .where(eq(weeklyPlans.id, id))
    .get();

  if (plan) {
    if (session.role === 'MANAGER') {
      await hierarchyService.assertRepVisible(session, plan.repId);
    } else if (plan.repId !== session.repId) {
      throw new AppError('غير مصرح لك بالوصول إلى هذه الخطة', 403);
    }
    return {
      ...plan,
      submittedAt: plan.submittedAt ? new Date(plan.submittedAt).toISOString() : undefined,
      updatedAt: plan.updatedAt ? new Date(plan.updatedAt).toISOString() : undefined,
    } as WeeklyPlanRecord;
  }

  // Missing MR IDs may refer to personal manager plans.
  assertManagerSession(session);
  // Check managerWeeklyPlans
  const mgrPlan = await db
    .select({
      id: managerWeeklyPlans.id,
      userId: managerWeeklyPlans.userId,
      userName: users.name,
      startDate: managerWeeklyPlans.startDate,
      endDate: managerWeeklyPlans.endDate,
      weekLabel: managerWeeklyPlans.weekLabel,
      saturdayAm: managerWeeklyPlans.saturdayAm,
      saturdayPm: managerWeeklyPlans.saturdayPm,
      sundayAm: managerWeeklyPlans.sundayAm,
      sundayPm: managerWeeklyPlans.sundayPm,
      mondayAm: managerWeeklyPlans.mondayAm,
      mondayPm: managerWeeklyPlans.mondayPm,
      tuesdayAm: managerWeeklyPlans.tuesdayAm,
      tuesdayPm: managerWeeklyPlans.tuesdayPm,
      wednesdayAm: managerWeeklyPlans.wednesdayAm,
      wednesdayPm: managerWeeklyPlans.wednesdayPm,
      thursdayAm: managerWeeklyPlans.thursdayAm,
      thursdayPm: managerWeeklyPlans.thursdayPm,
      fridayAm: managerWeeklyPlans.fridayAm,
      fridayPm: managerWeeklyPlans.fridayPm,
      status: managerWeeklyPlans.status,
      managerNotes: managerWeeklyPlans.managerNotes,
      submittedAt: managerWeeklyPlans.submittedAt,
      updatedAt: managerWeeklyPlans.updatedAt,
    })
    .from(managerWeeklyPlans)
    .leftJoin(users, eq(managerWeeklyPlans.userId, users.id))
    .where(eq(managerWeeklyPlans.id, id))
    .get();

  if (mgrPlan) {
    await hierarchyService.assertUserVisible(session, mgrPlan.userId);
    return {
      ...mgrPlan,
      rep: mgrPlan.userName || 'Manager',
      isManagerPlan: true,
      submittedAt: mgrPlan.submittedAt ? new Date(mgrPlan.submittedAt).toISOString() : undefined,
      updatedAt: mgrPlan.updatedAt ? new Date(mgrPlan.updatedAt).toISOString() : undefined,
    } as WeeklyPlanRecord;
  }

  return null;
}

/**
 * Updates manager notes or approval status for a plan.
 */
export async function updateWeeklyPlanStatus(
  session: UserSessionPayload | null,
  id: string,
  status: 'Draft' | 'Submitted' | 'Approved',
  managerNotes?: string
): Promise<WeeklyPlanRecord> {
  assertAuthenticatedSession(session);
  const update = WeeklyPlanStatusUpdateSchema.parse({ status, managerNotes });
  const existing = await getWeeklyPlanById(id, session);
  if (!existing) throw new AppError('الخطة غير موجودة', 404);
  if (existing.isManagerPlan) {
    if (existing.userId !== session.id) throw new AppError('غير مصرح لك بتعديل هذه الخطة', 403);
    ManagerPlanStatusSchema.parse(update.status);
    if (update.managerNotes) throw new AppError('Administrative notes are unavailable for personal plans', 400);
    await db.update(managerWeeklyPlans).set({ status: 'Submitted', updatedAt: new Date() })
      .where(and(eq(managerWeeklyPlans.id, id), eq(managerWeeklyPlans.userId, session.id)));
  } else {
    if (session.role !== 'MANAGER') throw new AppError('غير مصرح لك بتغيير حالة الخطة', 403);
    await db.update(weeklyPlans).set({ ...update, updatedAt: new Date() }).where(eq(weeklyPlans.id, id));
  }
  return (await getWeeklyPlanById(id, session))!;
}

/** Deletes a plan after authenticating and resolving its owner. */
export async function deleteWeeklyPlan(session: UserSessionPayload | null, id: string): Promise<boolean> {
  assertAuthenticatedSession(session);
  const existing = await getWeeklyPlanById(id, session);
  if (!existing) throw new AppError('الخطة غير موجودة', 404);
  if (existing.isManagerPlan) {
    if (existing.userId !== session.id) throw new AppError('غير مصرح لك بحذف هذه الخطة', 403);
    await db.delete(managerWeeklyPlans)
      .where(and(eq(managerWeeklyPlans.id, id), eq(managerWeeklyPlans.userId, session.id)));
  } else {
    await db.delete(weeklyPlans).where(eq(weeklyPlans.id, id));
  }
  return true;
}
