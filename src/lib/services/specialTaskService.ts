import { db, specialTasks, representatives } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { UserSessionPayload } from '@/lib/auth';
import { AppError } from '@/lib/errors';
import { z } from 'zod';
import { SpecialTaskSchema } from '@/lib/validation';
import { FilterOptions } from './hospitalService';
import { assertAuthenticatedSession } from '@/lib/authPolicy';
import { resolveWritableRepId } from '@/lib/repAccessPolicy';
import { hierarchyService } from './hierarchyService';
import { inArray } from 'drizzle-orm';

export type SpecialTaskInput = z.input<typeof SpecialTaskSchema>;

/**
 * Creates a new special task record.
 */
export async function createSpecialTaskRecord(
  session: UserSessionPayload | null,
  rawInput: SpecialTaskInput
) {
  assertAuthenticatedSession(session);
  const input = SpecialTaskSchema.parse(rawInput);
  const repId = resolveWritableRepId(session);

  const [record] = await db
    .insert(specialTasks)
    .values({
      repId,
      title: input.title,
      taskCategory: input.taskCategory,
      taskDate: input.taskDate,
      assignedBy: input.assignedBy || null,
      priority: input.priority || 'Normal',
      status: input.status || 'Completed',
      description: input.description || null,
      notes: input.notes || null,
    })
    .returning();

  return record;
}

/**
 * Retrieves special tasks with role-based scoping (Rep sees own, Manager sees all or filtered).
 */
export async function getSpecialTasksList(
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
      id: specialTasks.id,
      repId: specialTasks.repId,
      rep: representatives.name,
      title: specialTasks.title,
      taskCategory: specialTasks.taskCategory,
      taskDate: specialTasks.taskDate,
      assignedBy: specialTasks.assignedBy,
      priority: specialTasks.priority,
      status: specialTasks.status,
      description: specialTasks.description,
      notes: specialTasks.notes,
      submittedAt: specialTasks.submittedAt,
    })
    .from(specialTasks)
    .innerJoin(representatives, eq(specialTasks.repId, representatives.id))
    .orderBy(desc(specialTasks.submittedAt));

  if(!allowedRepIds.length)return [];
  return baseQuery.where(inArray(specialTasks.repId,allowedRepIds)).all();
}
