import { db, doctors, doctorVisitProducts, doctorVisits, representatives } from '@/lib/db';
import { and, eq, desc } from 'drizzle-orm';
import { UserSessionPayload, resolveAuthorizedRepId } from '@/lib/auth';
import { findOrCreateDoctor } from './masterEntityService';
import { deriveVisitStatus } from '@/lib/business/status';
import { z } from 'zod';
import { DoctorVisitSchema, DoctorVisitV3Schema } from '@/lib/validation';
import { FilterOptions } from './hospitalService';
import { assertAuthenticatedSession } from '@/lib/authPolicy';
import { resolveWritableRepId } from '@/lib/repAccessPolicy';
import { AppError } from '@/lib/errors';
import { requireBusinessProducts } from './businessProductService';
import { assertReportSubmissionOpen } from '@/lib/business/reportDeadline';

export type DoctorVisitInput = z.input<typeof DoctorVisitSchema>;

/**
 * Creates a new doctor visit historical log.
 */
export async function createDoctorVisit(
  session: UserSessionPayload | null,
  rawInput: DoctorVisitInput
) {
  assertAuthenticatedSession(session);
  assertReportSubmissionOpen(new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' }));
  const modern=DoctorVisitV3Schema.safeParse(rawInput);
  if(modern.success){const repId=resolveWritableRepId(session);const doctor=await db.select().from(doctors).where(and(eq(doctors.id,modern.data.doctorId),eq(doctors.repId,repId))).get();if(!doctor)throw new AppError('Doctor is not in your saved list',403);const names=await requireBusinessProducts(modern.data.products.map(x=>x.productId));const visitId=crypto.randomUUID();const ops=[db.insert(doctorVisits).values({id:visitId,repId,doctorId:doctor.id,prescriptionRate:null,visitDate:new Date().toISOString().slice(0,10),cycleDays:doctor.defaultCycle||7,visitType:modern.data.visitType,companion:modern.data.visitType==='Double'?modern.data.companion:null}),...modern.data.products.map((item,displayOrder)=>db.insert(doctorVisitProducts).values({id:crypto.randomUUID(),doctorVisitId:visitId,productId:item.productId,productNameSnapshot:names.get(item.productId)!,prescriptionRate:item.prescriptionRate,displayOrder}))];const[first,...rest]=ops;await db.batch([first,...rest]);return{id:visitId,doctorName:doctor.name,specialty:doctor.specialty,products:modern.data.products}}
  const input = DoctorVisitSchema.parse(rawInput);
  if (input.visitDate) assertReportSubmissionOpen(input.visitDate);
  const repId = resolveWritableRepId(session);

  const doctor = await findOrCreateDoctor({
    name: input.name,
    area: input.area,
    specialty: input.specialty,
    workplace: input.workplace,
    mobile: input.mobile,
    classification: input.cls,
    repId,
  });

  const [visit] = await db
    .insert(doctorVisits)
    .values({
      repId,
      doctorId: doctor.id,
      objective: input.objective || null,
      objectiveOtherText: input.objective.match(/(?:^|[،,]\s*)Others:\s*(.+?)(?=$|[،,])/i)?.[1]?.trim() || null,
      prescriptionRate: input.prescriptionRate || 'Awareness',
      nearbyPharmacy: input.nearbyPharmacy || null,
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
    specialty: doctor.specialty,
    workplace: doctor.workplace,
    area: doctor.area,
    mobile: doctor.mobile,
    cls: doctor.classification,
    prescriptionRate: visit.prescriptionRate,
    nearbyPharmacy: visit.nearbyPharmacy,
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
      name: doctors.name,
      objective: doctorVisits.objective,
      prescriptionRate: doctorVisits.prescriptionRate,
      nearbyPharmacy: doctorVisits.nearbyPharmacy,
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
        name: doctors.name,
        objective: doctorVisits.objective,
        prescriptionRate: doctorVisits.prescriptionRate,
        nearbyPharmacy: doctorVisits.nearbyPharmacy,
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

  return Promise.all(results.map(async(d) => ({
    ...d, products: await db.select({productId:doctorVisitProducts.productId,name:doctorVisitProducts.productNameSnapshot,prescriptionRate:doctorVisitProducts.prescriptionRate,displayOrder:doctorVisitProducts.displayOrder}).from(doctorVisitProducts).where(eq(doctorVisitProducts.doctorVisitId,d.id)).orderBy(doctorVisitProducts.displayOrder).all(),
    status: deriveVisitStatus({
      lastVisitDate: d.visitDate,
      nextVisitDate: d.nextVisit,
      cycleDays: d.cycle,
    }),
    submittedAt: d.submittedAt ? new Date(d.submittedAt).toISOString() : undefined,
  })));
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
