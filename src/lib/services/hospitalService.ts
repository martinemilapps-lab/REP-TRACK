import { db, dailyReports, doctors, hospitalVisitDoctors, hospitals, hospitalVisits, representatives } from '@/lib/db';
import { and, eq, desc, inArray } from 'drizzle-orm';
import { UserSessionPayload, resolveAuthorizedRepId } from '@/lib/auth';
import { findOrCreateHospital } from './masterEntityService';
import { deriveVisitStatus } from '@/lib/business/status';
import { z } from 'zod';
import { HospitalDailyReportSchema, HospitalVisitSchema } from '@/lib/validation';
import { AppError } from '@/lib/errors';
import { assertAuthenticatedSession } from '@/lib/authPolicy';
import { resolveWritableRepId } from '@/lib/repAccessPolicy';

export type HospitalVisitInput = z.input<typeof HospitalVisitSchema>;
export type HospitalDailyReportInput = z.input<typeof HospitalDailyReportSchema>;

export async function saveHospitalDailyReport(session: UserSessionPayload | null, rawInput: HospitalDailyReportInput) {
  assertAuthenticatedSession(session); const input=HospitalDailyReportSchema.parse(rawInput); const repId=resolveWritableRepId(session); const reportId=input.id||crypto.randomUUID();
  if(input.id){const existing=await db.select().from(dailyReports).where(eq(dailyReports.id,input.id)).get();if(!existing||existing.repId!==repId)throw new AppError('Hospital report not found or forbidden',403)}
  const hospitalIds=[...new Set(input.visits.map(v=>v.hospitalId))];const ownedHospitals=await db.select({id:hospitals.id}).from(hospitals).where(and(eq(hospitals.repId,repId),inArray(hospitals.id,hospitalIds))).all();
  const doctorIds=[...new Set(input.visits.flatMap(v=>v.doctors.map(d=>d.doctorId)))];const ownedDoctors=doctorIds.length?await db.select({id:doctors.id,specialty:doctors.specialty}).from(doctors).where(and(eq(doctors.repId,repId),inArray(doctors.id,doctorIds))).all():[];
  if(ownedHospitals.length!==hospitalIds.length||ownedDoctors.length!==doctorIds.length)throw new AppError('A selected hospital or doctor is outside your saved lists',403);
  const specialty=new Map(ownedDoctors.map(d=>[d.id,d.specialty]));const visitRows=input.visits.map(v=>({id:crypto.randomUUID(),visit:v}));
  const operations=[db.insert(dailyReports).values({id:reportId,repId,reportDate:input.reportDate,updatedAt:new Date()}).onConflictDoUpdate({target:dailyReports.id,set:{reportDate:input.reportDate,updatedAt:new Date()}}),db.delete(hospitalVisits).where(eq(hospitalVisits.dailyReportId,reportId)),...visitRows.map(({id,visit})=>db.insert(hospitalVisits).values({id,repId,dailyReportId:reportId,hospitalId:visit.hospitalId,objective:visit.objective,objectiveOtherText:visit.objective.match(/Others:\s*(.+)/i)?.[1]?.trim()||null,dept:visit.dept||null,drsVisited:visit.doctors.length,doctorNames:visit.doctors.map(d=>d.doctorId).join(','),cycleDays:visit.cycle,lastVisitDate:input.reportDate,nextVisitDate:visit.nextVisit||null,visitType:visit.visitType,companion:visit.companion||null,ourProducts:visit.ourProducts||null,competitor:visit.competitor||null,notes:visit.notes||null})),...visitRows.flatMap(({id,visit})=>visit.doctors.map(d=>db.insert(hospitalVisitDoctors).values({id:crypto.randomUUID(),hospitalVisitId:id,doctorId:d.doctorId,specialtySnapshot:specialty.get(d.doctorId)||null,comment:d.comment||null})) )];
  const[first,...rest]=operations;await db.batch([first,...rest]);return{id:reportId,visitCount:visitRows.length,doctorVisitCount:visitRows.reduce((n,x)=>n+x.visit.doctors.length,0)};
}

export interface FilterOptions {
  repName?: string | null;
  repId?: string | null;
  status?: string | null;
  limit?: number;
  offset?: number;
}

/**
 * Creates a new hospital visit historical log.
 * Representative identity is strictly resolved from the authenticated session.
 */
export async function createHospitalVisit(
  session: UserSessionPayload | null,
  rawInput: HospitalVisitInput
) {
  assertAuthenticatedSession(session);
  const input = HospitalVisitSchema.parse(rawInput);
  const repId = resolveWritableRepId(session);

  // 2. Find or Create Master Hospital
  const hospital = await findOrCreateHospital({
    name: input.name,
    area: input.area,
    type: input.type,
    dept: input.dept,
    contact: input.contact,
    phone: input.phone,
    repId,
  });

  // 3. Insert Immutable Historical Visit
  const [visit] = await db
    .insert(hospitalVisits)
    .values({
      repId,
      hospitalId: hospital.id,
      objective: input.objective || null,
      objectiveOtherText: input.objective.match(/(?:^|[،,]\s*)Others:\s*(.+?)(?=$|[،,])/i)?.[1]?.trim() || null,
      dept: input.dept || null,
      drsVisited: input.drsVisited || 0,
      doctorNames: input.doctorNames || null,
      cycleDays: input.cycle || 0,
      lastVisitDate: input.lastVisit || null,
      nextVisitDate: input.nextVisit || null,
      visitType: input.visitType || 'Single',
      companion: input.companion || null,
      ourProducts: input.ourProducts || null,
      competitor: input.competitor || null,
      notes: input.notes || null,
    })
    .returning();

  const computedStatus = deriveVisitStatus({
    lastVisitDate: input.lastVisit,
    nextVisitDate: input.nextVisit,
    cycleDays: input.cycle,
  });

  return {
    ...visit,
    hospitalName: hospital.name,
    area: hospital.area,
    type: hospital.type,
    contact: hospital.contact,
    phone: hospital.phone,
    status: computedStatus,
  };
}

/**
 * Retrieves hospital visit reports scoped by role & ownership.
 */
export async function getHospitalReports(
  session: UserSessionPayload | null,
  options: FilterOptions = {}
) {
  const targetRepId = resolveAuthorizedRepId(session, options.repId);

  const query = db
    .select({
      id: hospitalVisits.id,
      repId: hospitalVisits.repId,
      rep: representatives.name,
      name: hospitals.name,
      area: hospitals.area,
      type: hospitals.type,
      objective: hospitalVisits.objective,
      dept: hospitalVisits.dept,
      drsVisited: hospitalVisits.drsVisited,
      doctorNames: hospitalVisits.doctorNames,
      contact: hospitals.contact,
      phone: hospitals.phone,
      cycle: hospitalVisits.cycleDays,
      lastVisit: hospitalVisits.lastVisitDate,
      nextVisit: hospitalVisits.nextVisitDate,
      visitType: hospitalVisits.visitType,
      companion: hospitalVisits.companion,
      ourProducts: hospitalVisits.ourProducts,
      competitor: hospitalVisits.competitor,
      notes: hospitalVisits.notes,
      submittedAt: hospitalVisits.submittedAt,
    })
    .from(hospitalVisits)
    .innerJoin(hospitals, eq(hospitalVisits.hospitalId, hospitals.id))
    .innerJoin(representatives, eq(hospitalVisits.repId, representatives.id))
    .orderBy(desc(hospitalVisits.submittedAt));

  let results;
  if (targetRepId) {
    results = await db
      .select({
        id: hospitalVisits.id,
        repId: hospitalVisits.repId,
        rep: representatives.name,
        name: hospitals.name,
        area: hospitals.area,
        type: hospitals.type,
        objective: hospitalVisits.objective,
        dept: hospitalVisits.dept,
        drsVisited: hospitalVisits.drsVisited,
        doctorNames: hospitalVisits.doctorNames,
        contact: hospitals.contact,
        phone: hospitals.phone,
        cycle: hospitalVisits.cycleDays,
        lastVisit: hospitalVisits.lastVisitDate,
        nextVisit: hospitalVisits.nextVisitDate,
        visitType: hospitalVisits.visitType,
        companion: hospitalVisits.companion,
        ourProducts: hospitalVisits.ourProducts,
        competitor: hospitalVisits.competitor,
        notes: hospitalVisits.notes,
        submittedAt: hospitalVisits.submittedAt,
      })
      .from(hospitalVisits)
      .innerJoin(hospitals, eq(hospitalVisits.hospitalId, hospitals.id))
      .innerJoin(representatives, eq(hospitalVisits.repId, representatives.id))
      .where(eq(hospitalVisits.repId, targetRepId))
      .orderBy(desc(hospitalVisits.submittedAt))
      .limit(options.limit || 1000)
      .offset(options.offset || 0)
      .all();
  } else {
    results = await query
      .limit(options.limit || 1000)
      .offset(options.offset || 0)
      .all();
  }

  // Hydrate dynamic status and ISO timestamp
  return results.map((h) => ({
    ...h,
    status: deriveVisitStatus({
      lastVisitDate: h.lastVisit,
      nextVisitDate: h.nextVisit,
      cycleDays: h.cycle,
    }),
    submittedAt: h.submittedAt ? new Date(h.submittedAt).toISOString() : undefined,
  }));
}

/**
 * Retrieves the latest visit state for each distinct hospital.
 */
export async function getLatestHospitalVisits(session: UserSessionPayload | null) {
  const allReports = await getHospitalReports(session);
  const map = new Map<string, (typeof allReports)[0]>();

  for (const report of allReports) {
    const key = `${report.name}__${report.area}`;
    if (!map.has(key)) {
      map.set(key, report);
    }
  }

  return Array.from(map.values());
}
