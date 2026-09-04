import { db, trainings, representatives } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { UserSessionPayload } from '@/lib/auth';
import { AppError } from '@/lib/errors';
import { z } from 'zod';
import { TrainingSchema } from '@/lib/validation';
import { FilterOptions } from './hospitalService';

export type TrainingInput = z.input<typeof TrainingSchema>;

/**
 * Creates a new training session record.
 */
export async function createTrainingRecord(
  session: UserSessionPayload | null,
  rawInput: TrainingInput
) {
  const input = TrainingSchema.parse(rawInput);
  let repId = session?.repId || null;

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

  const [record] = await db
    .insert(trainings)
    .values({
      repId,
      title: input.title,
      trainingType: input.trainingType,
      trainingDate: input.trainingDate,
      trainer: input.trainer || null,
      attendees: input.attendees || null,
      durationHours: input.durationHours ?? 1,
      outcomes: input.outcomes || null,
      notes: input.notes || null,
    })
    .returning();

  return record;
}

/**
 * Retrieves training records with role-based scoping (Rep sees own, Manager sees all or filtered).
 */
export async function getTrainingsList(
  session: UserSessionPayload | null,
  options?: FilterOptions
) {
  const isManager = session?.role === 'MANAGER';
  let targetRepId: string | null = null;

  if (!isManager) {
    targetRepId = session?.repId || null;
  } else if (options?.repName) {
    const found = await db
      .select()
      .from(representatives)
      .where(eq(representatives.name, options.repName.trim()))
      .get();
    if (found) targetRepId = found.id;
  }

  const baseQuery = db
    .select({
      id: trainings.id,
      repId: trainings.repId,
      rep: representatives.name,
      title: trainings.title,
      trainingType: trainings.trainingType,
      trainingDate: trainings.trainingDate,
      trainer: trainings.trainer,
      attendees: trainings.attendees,
      durationHours: trainings.durationHours,
      outcomes: trainings.outcomes,
      notes: trainings.notes,
      submittedAt: trainings.submittedAt,
    })
    .from(trainings)
    .innerJoin(representatives, eq(trainings.repId, representatives.id))
    .orderBy(desc(trainings.submittedAt));

  if (targetRepId) {
    return baseQuery.where(eq(trainings.repId, targetRepId)).all();
  }

  return baseQuery.all();
}
