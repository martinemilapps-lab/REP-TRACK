import { db, weeklyPlans, representatives } from '@/lib/db';
import { eq, and, desc } from 'drizzle-orm';
import { UserSessionPayload, resolveAuthorizedRepId } from '@/lib/auth';
import { AppError } from '@/lib/errors';
import { z } from 'zod';
import { WeeklyPlanSchema } from '@/lib/validation';
import { WeeklyPlanRecord } from '@/types';

export type WeeklyPlanInput = z.input<typeof WeeklyPlanSchema>;

/**
 * Saves or updates a weekly plan for a representative.
 */
export async function saveWeeklyPlan(
  session: UserSessionPayload | null,
  rawInput: WeeklyPlanInput
): Promise<WeeklyPlanRecord> {
  const input = WeeklyPlanSchema.parse(rawInput);
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
  options: { repId?: string | null; repName?: string | null; limit?: number; offset?: number } = {}
): Promise<WeeklyPlanRecord[]> {
  const targetRepId = resolveAuthorizedRepId(session, options.repId);

  let query = db
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

  if (!plan) return null;

  return {
    ...plan,
    submittedAt: plan.submittedAt ? new Date(plan.submittedAt).toISOString() : undefined,
    updatedAt: plan.updatedAt ? new Date(plan.updatedAt).toISOString() : undefined,
  } as WeeklyPlanRecord;
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
