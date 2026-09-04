import { db, events, representatives } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { UserSessionPayload } from '@/lib/auth';
import { AppError } from '@/lib/errors';
import { z } from 'zod';
import { EventSchema } from '@/lib/validation';
import { FilterOptions } from './hospitalService';

export type EventInput = z.input<typeof EventSchema>;

/**
 * Creates a new event record.
 */
export async function createEventRecord(
  session: UserSessionPayload | null,
  rawInput: EventInput
) {
  const input = EventSchema.parse(rawInput);
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

  if (targetRepId) {
    return baseQuery.where(eq(events.repId, targetRepId)).all();
  }

  return baseQuery.all();
}
