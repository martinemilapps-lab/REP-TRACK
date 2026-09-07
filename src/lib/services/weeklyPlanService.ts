import { db, weeklyPlans, representatives, managerWeeklyPlans, users } from '@/lib/db';
import { eq, and, desc } from 'drizzle-orm';
import { UserSessionPayload, resolveAuthorizedRepId } from '@/lib/auth';
import { AppError } from '@/lib/errors';
import { z } from 'zod';
import { WeeklyPlanSchema } from '@/lib/validation';
import { WeeklyPlanRecord } from '@/types';

export type WeeklyPlanInput = z.input<typeof WeeklyPlanSchema>;

/**
 * Saves or updates a weekly plan for a representative or a manager.
 */
export async function saveWeeklyPlan(
  session: UserSessionPayload | null,
  rawInput: WeeklyPlanInput
): Promise<WeeklyPlanRecord> {
  const input = WeeklyPlanSchema.parse(rawInput);

  const isManagerPlan = Boolean(
    input.isManagerPersonal ||
    (session && session.role === 'MANAGER' && !input.repId && (!input.rep || input.rep === session.name))
  );

  if (isManagerPlan) {
    if (!session || !session.id) {
      throw new AppError('يرجى تسجيل الدخول أولاً كمدير لحفظ الخطة', 401);
    }
    const userId = session.id;
    const weekLabel = input.weekLabel || `${input.startDate} to ${input.endDate}`;

    // Check if manager plan already exists for this user and startDate
    const existingManagerPlan = await db
      .select()
      .from(managerWeeklyPlans)
      .where(
        and(
          eq(managerWeeklyPlans.userId, userId),
          eq(managerWeeklyPlans.startDate, input.startDate.trim())
        )
      )
      .get();

    let record;
    if (existingManagerPlan) {
      const [updated] = await db
        .update(managerWeeklyPlans)
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
          managerNotes: input.managerNotes ?? existingManagerPlan.managerNotes,
          updatedAt: new Date(),
        })
        .where(eq(managerWeeklyPlans.id, existingManagerPlan.id))
        .returning();
      record = updated;
    } else {
      const [inserted] = await db
        .insert(managerWeeklyPlans)
        .values({
          userId,
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

    return {
      ...record,
      rep: session.name || session.username || 'Manager',
      userId: session.id,
      isManagerPlan: true,
      submittedAt: record.submittedAt ? new Date(record.submittedAt).toISOString() : undefined,
      updatedAt: record.updatedAt ? new Date(record.updatedAt).toISOString() : undefined,
    } as WeeklyPlanRecord;
  }

  let repId = session?.repId || input.repId || null;

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

  if (!repId) {
    const firstRep = await db.select().from(representatives).limit(1).get();
    if (!firstRep) {
      throw new AppError('لم يتم العثور على المندوب. يرجى تسجيل الدخول أولاً', 401);
    }
    repId = firstRep.id;
  }

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
  // If requesting manager personal weekly plans:
  if (
    options.personalOnly ||
    (session?.role === 'MANAGER' && options.userId === session.id) ||
    (session?.role === 'MANAGER' && !options.repId && !options.repName && options.userId)
  ) {
    const targetUserId = options.userId || session?.id;
    if (!targetUserId) {
      return [];
    }

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

/**
 * Retrieves a single weekly plan by ID.
 */
export async function getWeeklyPlanById(id: string): Promise<WeeklyPlanRecord | null> {
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
    return {
      ...plan,
      submittedAt: plan.submittedAt ? new Date(plan.submittedAt).toISOString() : undefined,
      updatedAt: plan.updatedAt ? new Date(plan.updatedAt).toISOString() : undefined,
    } as WeeklyPlanRecord;
  }

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
  if (!session || session.role !== 'MANAGER') {
    throw new AppError('فقط مدير النظام يمكنه تغيير حالة الخطة أو إضافة ملاحظات إدارية', 403);
  }

  const existingMgr = await db.select().from(managerWeeklyPlans).where(eq(managerWeeklyPlans.id, id)).get();
  if (existingMgr) {
    await db
      .update(managerWeeklyPlans)
      .set({
        status,
        managerNotes: managerNotes !== undefined ? managerNotes : undefined,
        updatedAt: new Date(),
      })
      .where(eq(managerWeeklyPlans.id, id));
    const plan = await getWeeklyPlanById(id);
    return plan!;
  }

  const [updated] = await db
    .update(weeklyPlans)
    .set({
      status,
      managerNotes: managerNotes !== undefined ? managerNotes : undefined,
      updatedAt: new Date(),
    })
    .where(eq(weeklyPlans.id, id))
    .returning();

  if (!updated) {
    throw new AppError('لم يتم العثور على الخطة المحددة', 404);
  }

  const plan = await getWeeklyPlanById(id);
  return plan!;
}

/**
 * Deletes a weekly plan.
 */
export async function deleteWeeklyPlan(
  session: UserSessionPayload | null,
  id: string
): Promise<boolean> {
  const existingMgr = await db.select().from(managerWeeklyPlans).where(eq(managerWeeklyPlans.id, id)).get();
  if (existingMgr) {
    if (session && session.id !== existingMgr.userId && session.role !== 'MANAGER') {
      throw new AppError('غير مصرح لك بحذف هذه الخطة', 403);
    }
    await db.delete(managerWeeklyPlans).where(eq(managerWeeklyPlans.id, id));
    return true;
  }

  const existing = await db.select().from(weeklyPlans).where(eq(weeklyPlans.id, id)).get();
  if (!existing) {
    throw new AppError('الخطة غير موجودة', 404);
  }

  if (session && session.role !== 'MANAGER' && session.repId && existing.repId !== session.repId) {
    throw new AppError('غير مصرح لك بحذف هذه الخطة', 403);
  }

  await db.delete(weeklyPlans).where(eq(weeklyPlans.id, id));
  return true;
}
