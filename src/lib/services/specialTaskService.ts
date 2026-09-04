import { db, specialTasks, representatives } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { UserSessionPayload } from '@/lib/auth';
import { AppError } from '@/lib/errors';
import { z } from 'zod';
import { SpecialTaskSchema } from '@/lib/validation';
import { FilterOptions } from './hospitalService';

export type SpecialTaskInput = z.input<typeof SpecialTaskSchema>;

/**
 * Creates a new special task record.
 */
export async function createSpecialTaskRecord(
  session: UserSessionPayload | null,
  rawInput: SpecialTaskInput
) {
  const input = SpecialTaskSchema.parse(rawInput);
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

  if (targetRepId) {
    return baseQuery.where(eq(specialTasks.repId, targetRepId)).all();
  }

  return baseQuery.all();
}
