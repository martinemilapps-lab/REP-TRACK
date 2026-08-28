import { db, doctors, doctorVisits, representatives } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { UserSessionPayload, resolveAuthorizedRepId } from '@/lib/auth';
import { findOrCreateDoctor } from './masterEntityService';
import { deriveVisitStatus } from '@/lib/business/status';
import { AppError } from '@/lib/errors';
import { z } from 'zod';
import { DoctorVisitSchema } from '@/lib/validation';
import { FilterOptions } from './hospitalService';

export type DoctorVisitInput = z.input<typeof DoctorVisitSchema>;

/**
 * Creates a new doctor visit historical log.
 */
export async function createDoctorVisit(
  session: UserSessionPayload | null,
  rawInput: DoctorVisitInput
) {
  const input = DoctorVisitSchema.parse(rawInput);
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

  const doctor = await findOrCreateDoctor({
    name: input.name,
    area: input.area,
    code: input.code,
    specialty: input.specialty,
    workplace: input.workplace,
    mobile: input.mobile,
    classification: input.cls,
  });

  const [visit] = await db
    .insert(doctorVisits)
    .values({
      repId,
      doctorId: doctor.id,
      objective: input.objective || null,
      visitDate: input.visitDate || null,
      cycleDays: input.cycle || 0,
      nextVisitDate: input.nextVisit || null,
      visitType: input.visitType || 'Single',
      companion: input.companion || null,
      product1: input.f1 || null,
      product2: input.f2 || null,
      product3: input.f3 || null,
      reminderProduct: input.reminder || null,
      notes: input.notes || null,
    })
    .returning();

  const computedStatus = deriveVisitStatus({
    lastVisitDate: input.visitDate,
    nextVisitDate: input.nextVisit,
    cycleDays: input.cycle,
  });

  return {
    ...visit,
    doctorName: doctor.name,
    code: doctor.code,
    specialty: doctor.specialty,
    workplace: doctor.workplace,
    area: doctor.area,
    mobile: doctor.mobile,
    cls: doctor.classification,
    status: computedStatus,
  };
}

/**
 * Retrieves doctor visit reports scoped by role & ownership.
 */
export async function getDoctorReports(
  session: UserSessionPayload | null,
  options: FilterOptions = {}
) {
  const targetRepId = resolveAuthorizedRepId(session, options.repId);

  const query = db
    .select({
      id: doctorVisits.id,
      repId: doctorVisits.repId,
      rep: representatives.name,
      code: doctors.code,
      name: doctors.name,
      objective: doctorVisits.objective,
      specialty: doctors.specialty,
      workplace: doctors.workplace,
      area: doctors.area,
      mobile: doctors.mobile,
      cls: doctors.classification,
      visitDate: doctorVisits.visitDate,
      cycle: doctorVisits.cycleDays,
      nextVisit: doctorVisits.nextVisitDate,
      visitType: doctorVisits.visitType,
      companion: doctorVisits.companion,
      f1: doctorVisits.product1,
      f2: doctorVisits.product2,
      f3: doctorVisits.product3,
      reminder: doctorVisits.reminderProduct,
      notes: doctorVisits.notes,
      submittedAt: doctorVisits.submittedAt,
    })
    .from(doctorVisits)
    .innerJoin(doctors, eq(doctorVisits.doctorId, doctors.id))
    .innerJoin(representatives, eq(doctorVisits.repId, representatives.id))
    .orderBy(desc(doctorVisits.submittedAt));

  let results;
  if (targetRepId) {
    results = await db
      .select({
        id: doctorVisits.id,
        repId: doctorVisits.repId,
        rep: representatives.name,
        code: doctors.code,
        name: doctors.name,
        objective: doctorVisits.objective,
        specialty: doctors.specialty,
        workplace: doctors.workplace,
        area: doctors.area,
        mobile: doctors.mobile,
        cls: doctors.classification,
        visitDate: doctorVisits.visitDate,
        cycle: doctorVisits.cycleDays,
        nextVisit: doctorVisits.nextVisitDate,
        visitType: doctorVisits.visitType,
        companion: doctorVisits.companion,
        f1: doctorVisits.product1,
        f2: doctorVisits.product2,
        f3: doctorVisits.product3,
        reminder: doctorVisits.reminderProduct,
        notes: doctorVisits.notes,
        submittedAt: doctorVisits.submittedAt,
      })
      .from(doctorVisits)
      .innerJoin(doctors, eq(doctorVisits.doctorId, doctors.id))
      .innerJoin(representatives, eq(doctorVisits.repId, representatives.id))
      .where(eq(doctorVisits.repId, targetRepId))
      .orderBy(desc(doctorVisits.submittedAt))
      .limit(options.limit || 1000)
      .offset(options.offset || 0)
      .all();
  } else {
    results = await query
      .limit(options.limit || 1000)
      .offset(options.offset || 0)
      .all();
  }

  return results.map((d) => ({
    ...d,
    status: deriveVisitStatus({
      lastVisitDate: d.visitDate,
      nextVisitDate: d.nextVisit,
      cycleDays: d.cycle,
    }),
    submittedAt: d.submittedAt ? new Date(d.submittedAt).toISOString() : undefined,
  }));
}

/**
 * Retrieves the latest visit state for each distinct doctor.
 */
export async function getLatestDoctorVisits(session: UserSessionPayload | null) {
  const allReports = await getDoctorReports(session);
  const map = new Map<string, (typeof allReports)[0]>();

  for (const report of allReports) {
    const key = `${report.name}__${report.area}`;
    if (!map.has(key)) {
      map.set(key, report);
    }
  }

  return Array.from(map.values());
}
