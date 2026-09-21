import { db, dailyReports, hospitalVisitDepartmentDoctors, hospitalVisitDepartments, hospitals, hospitalVisits, products, representatives } from '@/lib/db';
import { and, eq, desc, inArray } from 'drizzle-orm';
import { UserSessionPayload, resolveAuthorizedRepId } from '@/lib/auth';
import { findOrCreateHospital } from './masterEntityService';
import { deriveVisitStatus } from '@/lib/business/status';
import { z } from 'zod';
import { HospitalDailyReportSchema, HospitalVisitSchema } from '@/lib/validation';
import { AppError } from '@/lib/errors';
import { assertAuthenticatedSession } from '@/lib/authPolicy';
import { resolveWritableRepId } from '@/lib/repAccessPolicy';
import { assertReportSubmissionOpen } from '@/lib/business/reportDeadline';

export type HospitalVisitInput = z.input<typeof HospitalVisitSchema>;
export type HospitalDailyReportInput = z.input<typeof HospitalDailyReportSchema>;

export async function saveHospitalDailyReport(session: UserSessionPayload | null, rawInput: HospitalDailyReportInput) {
  assertAuthenticatedSession(session); const input=HospitalDailyReportSchema.parse(rawInput); assertReportSubmissionOpen(input.reportDate); const repId=resolveWritableRepId(session); const reportId=input.id||crypto.randomUUID();
  if(session?.positionCode!=='BUM'&&input.visits.some(visit=>visit.departments.length===0))throw new AppError('At least one Department and Doctor Visited entry is required',400);
  if(input.id){const existing=await db.select().from(dailyReports).where(eq(dailyReports.id,input.id)).get();if(!existing||existing.repId!==repId)throw new AppError('Hospital report not found or forbidden',403)}
  const hospitalIds=[...new Set(input.visits.map(v=>v.hospitalId))];const ownedHospitals=await db.select({id:hospitals.id,defaultCycle:hospitals.defaultCycle}).from(hospitals).where(and(eq(hospitals.repId,repId),inArray(hospitals.id,hospitalIds))).all();
  if(ownedHospitals.length!==hospitalIds.length)throw new AppError('A selected hospital is outside your saved lists',403);
  const cycleByHospital=new Map(ownedHospitals.map(h=>[h.id,h.defaultCycle||7]));const productIds=[...new Set(input.visits.flatMap(v=>v.productIds))];const activeProducts=productIds.length?await db.select({id:products.id,name:products.name}).from(products).where(and(eq(products.isActive,true),inArray(products.id,productIds))).all():[];if(activeProducts.length!==productIds.length)throw new AppError('Invalid or inactive product',400);const productNames=new Map(activeProducts.map(p=>[p.id,p.name]));
  const visitRows=input.visits.map(v=>({id:crypto.randomUUID(),visit:v}));const departmentRows=visitRows.flatMap(({id,visit})=>visit.departments.map((department,displayOrder)=>({id:crypto.randomUUID(),hospitalVisitId:id,department,displayOrder})));
  const operations=[db.insert(dailyReports).values({id:reportId,repId,reportDate:input.reportDate,updatedAt:new Date()}).onConflictDoUpdate({target:dailyReports.id,set:{reportDate:input.reportDate,updatedAt:new Date()}}),db.delete(hospitalVisits).where(eq(hospitalVisits.dailyReportId,reportId)),...visitRows.map(({id,visit})=>db.insert(hospitalVisits).values({id,repId,dailyReportId:reportId,hospitalId:visit.hospitalId,drsVisited:visit.departments.reduce((n,d)=>n+d.doctors.length,0),doctorNames:JSON.stringify(visit.departments.flatMap(d=>d.doctors)),cycleDays:cycleByHospital.get(visit.hospitalId),lastVisitDate:input.reportDate,visitType:visit.visitType,companion:visit.visitType==='Double'?visit.companion:null,ourProducts:JSON.stringify(visit.productIds.map(productId=>({productId,name:productNames.get(productId)}))),objective:visit.hasOthers?'Others':null,objectiveOtherText:visit.hasOthers&&visit.othersDescription?visit.othersDescription.trim():null,notes:visit.hasOthers&&visit.othersDescription?`Others: ${visit.othersDescription.trim()}`:null})) ,...departmentRows.map(row=>db.insert(hospitalVisitDepartments).values({id:row.id,hospitalVisitId:row.hospitalVisitId,department:row.department.department,displayOrder:row.displayOrder})),...departmentRows.flatMap(row=>row.department.doctors.map((doctorName,displayOrder)=>db.insert(hospitalVisitDepartmentDoctors).values({id:crypto.randomUUID(),departmentId:row.id,doctorName,displayOrder})))];
  const[first,...rest]=operations;await db.batch([first,...rest]);return{id:reportId,visitCount:visitRows.length,doctorVisitCount:visitRows.reduce((n,x)=>n+x.visit.departments.reduce((sum,d)=>sum+d.doctors.length,0),0)};
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
  assertReportSubmissionOpen(input.lastVisit || new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' }));
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
      objective: input.objective || (input.hasOthers ? 'Others' : null),
      objectiveOtherText: (input.hasOthers && input.othersDescription ? input.othersDescription.trim() : null) || input.objective.match(/(?:^|[،,]\s*)Others:\s*(.+?)(?=$|[،,])/i)?.[1]?.trim() || null,
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
      notes: input.notes || (input.hasOthers && input.othersDescription ? `Others: ${input.othersDescription.trim()}` : null),
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

  const selectFields = {
    id: hospitalVisits.id,
    repId: hospitalVisits.repId,
    rep: representatives.name,
    name: hospitals.name,
    area: hospitals.area,
    type: hospitals.type,
    objective: hospitalVisits.objective,
    objectiveOtherText: hospitalVisits.objectiveOtherText,
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
  };

  let results;
  if (targetRepId) {
    results = await db
      .select(selectFields)
      .from(hospitalVisits)
      .innerJoin(hospitals, eq(hospitalVisits.hospitalId, hospitals.id))
      .innerJoin(representatives, eq(hospitalVisits.repId, representatives.id))
      .where(eq(hospitalVisits.repId, targetRepId))
      .orderBy(desc(hospitalVisits.submittedAt))
      .limit(options.limit || 1000)
      .offset(options.offset || 0)
      .all();
  } else {
    results = await db
      .select(selectFields)
      .from(hospitalVisits)
      .innerJoin(hospitals, eq(hospitalVisits.hospitalId, hospitals.id))
      .innerJoin(representatives, eq(hospitalVisits.repId, representatives.id))
      .orderBy(desc(hospitalVisits.submittedAt))
      .limit(options.limit || 1000)
      .offset(options.offset || 0)
      .all();
  }

  // Hydrate dynamic status and ISO timestamp
  return Promise.all(results.map(async(h) => ({
    ...h,
    departments: await Promise.all((await db.select().from(hospitalVisitDepartments).where(eq(hospitalVisitDepartments.hospitalVisitId,h.id)).orderBy(hospitalVisitDepartments.displayOrder).all()).map(async department=>({...department,doctors:await db.select({name:hospitalVisitDepartmentDoctors.doctorName,displayOrder:hospitalVisitDepartmentDoctors.displayOrder}).from(hospitalVisitDepartmentDoctors).where(eq(hospitalVisitDepartmentDoctors.departmentId,department.id)).orderBy(hospitalVisitDepartmentDoctors.displayOrder).all()}))),
    status: deriveVisitStatus({
      lastVisitDate: h.lastVisit,
      nextVisitDate: h.nextVisit,
      cycleDays: h.cycle,
    }),
    submittedAt: h.submittedAt ? new Date(h.submittedAt).toISOString() : undefined,
  })));
}

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
