import { db, trainings, representatives } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { UserSessionPayload } from '@/lib/auth';
import { AppError } from '@/lib/errors';
import { z } from 'zod';
import { TrainingSchema } from '@/lib/validation';
import { FilterOptions } from './hospitalService';
import { assertAuthenticatedSession } from '@/lib/authPolicy';
import { resolveWritableRepId } from '@/lib/repAccessPolicy';
import { hierarchyService } from './hierarchyService';
import { inArray } from 'drizzle-orm';

export type TrainingInput = z.input<typeof TrainingSchema>;

/**
 * Creates a new training session record.
 */
export async function createTrainingRecord(
  session: UserSessionPayload | null,
  rawInput: TrainingInput
) {
  assertAuthenticatedSession(session);
  const input = TrainingSchema.parse(rawInput);
  const repId = resolveWritableRepId(session);

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
  assertAuthenticatedSession(session);
  let allowedRepIds=session.role==='REPRESENTATIVE'?[session.repId].filter((id):id is string=>Boolean(id)):await hierarchyService.getScopedRepIds(session);
  if(options?.repId){if(!allowedRepIds.includes(options.repId))throw new AppError('غير مصرح',403);allowedRepIds=[options.repId];}
  else if (options?.repName) {
    const found = await db
      .select()
      .from(representatives)
      .where(eq(representatives.name, options.repName.trim()))
      .get();
    if(!found||!allowedRepIds.includes(found.id))throw new AppError('غير مصرح',403);allowedRepIds=[found.id];
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

  if(!allowedRepIds.length)return [];
  return baseQuery.where(inArray(trainings.repId,allowedRepIds)).all();
}
