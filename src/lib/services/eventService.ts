import { db, events, representatives } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { UserSessionPayload } from '@/lib/auth';
import { AppError } from '@/lib/errors';
import { z } from 'zod';
import { EventSchema } from '@/lib/validation';
import { FilterOptions } from './hospitalService';
import { assertAuthenticatedSession } from '@/lib/authPolicy';
import { resolveWritableRepId } from '@/lib/repAccessPolicy';
import { hierarchyService } from './hierarchyService';
import { inArray } from 'drizzle-orm';

export type EventInput = z.input<typeof EventSchema>;

/**
 * Creates a new event record.
 */
export async function createEventRecord(
  session: UserSessionPayload | null,
  rawInput: EventInput
) {
  assertAuthenticatedSession(session);
  const input = EventSchema.parse(rawInput);
  const repId = resolveWritableRepId(session);

  const [record] = await db
    .insert(events)
    .values({
      repId,
      title: input.title,
      eventType: input.eventType,
      eventDate: input.eventDate,
      location: input.location || null,
      attendeesCount: input.attendeesCount ?? 0,
      targetSpecialty: input.targetSpecialty || null,
      products: input.products || null,
      budget: input.budget || null,
      feedback: input.feedback || null,
      notes: input.notes || null,
    })
    .returning();

  return record;
}

/**
 * Retrieves events with role-based scoping (Rep sees own, Manager sees all or filtered).
 */
export async function getEventsList(
  session: UserSessionPayload | null,
  options?: FilterOptions
) {
  assertAuthenticatedSession(session);
  let allowedRepIds = session.role === 'REPRESENTATIVE' ? [session.repId].filter((id):id is string=>Boolean(id)) : await hierarchyService.getScopedRepIds(session);
  if (options?.repId) {
    if(!allowedRepIds.includes(options.repId)) throw new AppError('غير مصرح',403);
    allowedRepIds=[options.repId];
  } else if (options?.repName) {
    const found = await db
      .select()
      .from(representatives)
      .where(eq(representatives.name, options.repName.trim()))
      .get();
    if (!found || !allowedRepIds.includes(found.id)) throw new AppError('غير مصرح',403);
    allowedRepIds=[found.id];
  }

  const baseQuery = db
    .select({
      id: events.id,
      repId: events.repId,
      rep: representatives.name,
      title: events.title,
      eventType: events.eventType,
      eventDate: events.eventDate,
      location: events.location,
      attendeesCount: events.attendeesCount,
      targetSpecialty: events.targetSpecialty,
      products: events.products,
      budget: events.budget,
      feedback: events.feedback,
      notes: events.notes,
      submittedAt: events.submittedAt,
    })
    .from(events)
    .innerJoin(representatives, eq(events.repId, representatives.id))
    .orderBy(desc(events.submittedAt));

  if(!allowedRepIds.length)return [];
  return baseQuery.where(inArray(events.repId,allowedRepIds)).all();
}
