import type { UserSessionPayload } from '@/lib/auth';
import { AppError } from '@/lib/errors';
import { getVisibleReports } from './reportService';
import { getWeeklyPlans, getTeamWeeklyPlans } from './weeklyPlanService';
import { getMasterListsForRep, getScopedMasterListsForManager, resolveRepOwnership } from './masterListService';
import { getCompliance } from './complianceService';
import { getSalesAnalytics } from './salesAnalyticsService';
import { getManagerActivities } from './managerActivityService';
import { createWorkbook, dedupeById, metadataRows, type ExportRow } from '@/lib/exportWorkbook';
import type { z } from 'zod';
import type { reportExportSchema, weeklyPlanExportSchema, listExportSchema, complianceExportSchema, salesExportSchema } from '@/lib/exportSchemas';

type ReportInput = z.infer<typeof reportExportSchema>;
type PlanInput = z.infer<typeof weeklyPlanExportSchema>;
type ListInput = z.infer<typeof listExportSchema>;
type ComplianceInput = z.infer<typeof complianceExportSchema>;
type SalesInput = z.infer<typeof salesExportSchema>;
type AnyRow = Record<string, unknown> & { id: string };

const value = (input: unknown): string | number | boolean => input instanceof Date ? input.toISOString() : typeof input === 'number' || typeof input === 'boolean' ? input : typeof input === 'string' ? input : input && typeof input === 'object' ? JSON.stringify(input) : '';
const pick = (row: Record<string, unknown>, keys: Array<[string, string]>): ExportRow => Object.fromEntries(keys.map(([key, label]) => [label, value(row[key])]));
const dateOf = (row: Record<string, unknown>) => String(row.submittedAt ?? row.activityDate ?? row.eventDate ?? row.trainingDate ?? row.taskDate ?? row.month ?? '');
const inRange = (row: Record<string, unknown>, start?: string, end?: string) => (!start || dateOf(row).slice(0, 10) >= start) && (!end || dateOf(row).slice(0, 10) <= end);

const reportColumns: Array<[string, string]> = [
  ['id','Record ID'],['rep','Employee'],['userName','Employee'],['positionCode','Position'],['name','Customer / Record'],['title','Title'],
  ['activityType','Activity Type'],['eventType','Event Type'],['trainingType','Training Type'],['taskCategory','Task Category'],['objective','Objective'],
  ['area','Area'],['location','Location'],['specialty','Specialty'],['workplace','Workplace'],['month','Month'],['product','Product'],
  ['sales','Sales Units'],['status','Status'],['isAvailable','Available'],['visitType','Visit Type'],['companion','Companion'],
  ['lastVisit','Visit Date'],['visitDate','Visit Date'],['eventDate','Event Date'],['trainingDate','Training Date'],['taskDate','Task Date'],['activityDate','Activity Date'],
  ['attendeesCount','Attendees'],['durationHours','Duration Hours'],['budget','Budget'],['eventFeedback','Event Feedback'],['productsDiscussed','Products Discussed'],['visits','AM / PM Visits'],['notes','Notes'],['submittedAt','Submitted At'],
];

export async function buildReportsExport(session: UserSessionPayload, input: ReportInput) {
  if (input.owner === 'my' && session.role === 'MANAGER') {
    const rows = await getManagerActivities(session, { startDate: input.startDate, endDate: input.endDate, activityType: input.type === 'managerActivity' || input.type === 'all' ? undefined : input.type });
    return createWorkbook([{ name: 'Export Info', rows: metadataRows(session, { Scope: 'MY_RECORDS', 'Start Date': input.startDate, 'End Date': input.endDate }) }, { name: 'Manager Activities', rows: dedupeById(rows).map((row) => pick(row as unknown as Record<string, unknown>, reportColumns)) }]);
  }
  const data = await getVisibleReports(session, { requestedRepId: input.repId, scopeMode: input.scopeMode, limit: 5000 });
  if(input.type==='availability'){
    const allRows=data.availabilities as AnyRow[];
    if(input.hospitalId&&!allRows.some(row=>row.hospitalId===input.hospitalId))throw new AppError('Hospital is outside your authorized hierarchy',403);
    if(input.productId&&!allRows.some(row=>row.productId===input.productId))throw new AppError('Product is not present in your authorized availability scope',403);
    const rows=allRows.filter(row=>inRange(row,input.startDate,input.endDate)&&(!input.hospitalId||row.hospitalId===input.hospitalId)&&(!input.productId||row.productId===input.productId)&&(!input.availabilityStatus||row.status===input.availabilityStatus)&&(!input.month||row.month===input.month));
    const detail=rows.map(row=>pick(row,[['rep','MR Name'],['username','Username'],['positionCode','Position'],['area','Territory / Area'],['month','Reporting Period'],['hospital','Hospital'],['hospitalType','Hospital Type'],['product','Product'],['productCode','Product Code'],['status','Availability Status'],['submittedAt','Submitted At']]));
    const productNames=[...new Set(rows.map(row=>String(row.product||'')).filter(Boolean))];const grouped=new Map<string,ExportRow>();for(const row of rows){const key=`${row.rep}|${row.month}|${row.hospital}`;if(!grouped.has(key))grouped.set(key,{'MR Name':value(row.rep),'Reporting Period':value(row.month),Hospital:value(row.hospital)});grouped.get(key)![String(row.product)]=value(row.status)}
    const summary=[...new Map(rows.map(row=>[`${row.rep}|${row.product}|${row.status}`,row])).values()].map(row=>({'MR Name':value(row.rep),Product:value(row.product),Status:value(row.status),Count:rows.filter(item=>item.rep===row.rep&&item.product===row.product&&item.status===row.status).length}));
    return createWorkbook([{name:'Export Info',rows:metadataRows(session,{Scope:session.role==='REPRESENTATIVE'?'MY_RECORDS':input.scopeMode,'Start Date':input.startDate,'End Date':input.endDate,Legend:'Available = green; Not Available = red'})},{name:'Detailed Availability',rows:detail},{name:'Hospital Product Matrix',rows:[...grouped.values()].map(row=>Object.fromEntries([['MR Name',row['MR Name']],['Reporting Period',row['Reporting Period']],['Hospital',row.Hospital],...productNames.map(name=>[name,row[name]||''])]))},{name:'Summary',rows:summary}]);
  }
  const sets: Array<[string, AnyRow[]]> = [
    ['Hospitals', data.hospitals as AnyRow[]], ['Pharmacies', data.pharmacies as AnyRow[]], ['Doctors', data.doctors as AnyRow[]],
    ['Distribution Branches', data.branches as AnyRow[]], ['Product Availability', data.availabilities as AnyRow[]], ['Events', data.events as AnyRow[]],
    ['Training', data.trainings as AnyRow[]], ['Special Tasks', data.specialTasks as AnyRow[]], ['Manager Activities', data.managerActivities as unknown as AnyRow[]],
  ];
  const typeNames: Record<string,string> = { hospital:'Hospitals', pharmacy:'Pharmacies', doctor:'Doctors', branch:'Distribution Branches', availability:'Product Availability', event:'Events', training:'Training', specialTask:'Special Tasks', managerActivity:'Manager Activities' };
  const selected = input.type === 'all' ? sets : sets.filter(([name]) => name === typeNames[input.type]);
  const sheets = selected.map(([name, rows]) => ({ name, rows: dedupeById(rows).filter((row) => inRange(row, input.startDate, input.endDate)).map((row) => pick(row, reportColumns)) }));
  return createWorkbook([{ name: 'Export Info', rows: metadataRows(session, { Scope: session.role === 'REPRESENTATIVE' ? 'MY_RECORDS' : input.scopeMode, 'Start Date': input.startDate, 'End Date': input.endDate, 'Report Type': input.type }) }, ...sheets]);
}

const planColumns: Array<[string,string]> = [['id','Plan ID'],['rep','Employee'],['userPosition','Position'],['isManagerPlan','Manager Personal Plan'],['startDate','Saturday'],['endDate','Friday'],['weekLabel','Week'],['saturdayAm','Saturday AM'],['saturdayPm','Saturday PM'],['sundayAm','Sunday AM'],['sundayPm','Sunday PM'],['mondayAm','Monday AM'],['mondayPm','Monday PM'],['tuesdayAm','Tuesday AM'],['tuesdayPm','Tuesday PM'],['wednesdayAm','Wednesday AM'],['wednesdayPm','Wednesday PM'],['thursdayAm','Thursday AM'],['thursdayPm','Thursday PM'],['fridayAm','Friday AM'],['fridayPm','Friday PM'],['submittedAt','Submitted At']];

export async function buildWeeklyPlansExport(session: UserSessionPayload, input: PlanInput) {
  if (session.role === 'REPRESENTATIVE' && input.team === 'true') throw new AppError('MR users cannot export team plans', 403);
  if (session.role === 'REPRESENTATIVE' && input.repId && input.repId !== session.repId) throw new AppError('Requested representative is outside your authorized scope', 403);
  let plans = input.team === 'true' ? await getTeamWeeklyPlans(session, input.scopeMode) : await getWeeklyPlans(session, session.role === 'MANAGER' ? { personalOnly: true } : { repId: session.repId });
  if (input.repId) plans = plans.filter((plan) => plan.repId === input.repId);
  if (input.weekStart) plans = plans.filter((plan) => plan.startDate === input.weekStart);
  return createWorkbook([{ name: 'Export Info', rows: metadataRows(session, { Scope: input.team === 'true' ? input.scopeMode : 'MY_RECORDS', 'Week Start': input.weekStart }) }, { name: 'Weekly Plans', rows: dedupeById(plans).map((row) => pick(row as unknown as Record<string, unknown>, planColumns)) }]);
}

export async function buildListsExport(session: UserSessionPayload, input: ListInput) {
  let lists;
  let owner = session.name;
  if (session.role === 'REPRESENTATIVE') {
    if (input.repId && input.repId !== session.repId) throw new AppError('MR users can export only their own lists', 403);
    lists = await getMasterListsForRep(await resolveRepOwnership(session));
  } else {
    if (!input.repId) throw new AppError('Select an authorized representative; no fallback is used', 400);
    const result = await getScopedMasterListsForManager(session, input.repId);
    lists = result.lists; owner = result.targetRep?.name ?? owner;
  }
  const common: Array<[string,string]> = [['id','Record ID'],['name','Name'],['area','Area'],['type','Type'],['specialty','Specialty'],['workplace','Workplace'],['address','Address'],['contact','Contact'],['phone','Phone'],['mobile','Mobile'],['classification','Classification'],['defaultCycle','Default Cycle (Days)'],['createdAt','Created At']];
  const listSheets: Array<[string, Array<{ id: string }>]> = [['Hospitals',lists.hospitals],['Doctors',lists.doctors],['Pharmacies',lists.pharmacies],['Distribution Branches',lists.branches]];
  return createWorkbook([{ name: 'Export Info', rows: metadataRows(session, { 'List Owner': owner }) }, ...listSheets.map(([name, rows]) => ({ name, rows: dedupeById(rows).map((row) => pick(row as unknown as Record<string, unknown>, common)) }))]);
}

export async function buildComplianceExport(session: UserSessionPayload, input: ComplianceInput) {
  const result = await getCompliance(session, { ...input, page: 1, pageSize: 100 });
  const allRows=[...result.rows];
  for(let page=2;(page-1)*100<result.total&&page<=200;page++){const next=await getCompliance(session,{...input,page,pageSize:100});allRows.push(...next.rows)}
  const details = dedupeById(allRows).map((row) => ({ Employee: row.name, Username: row.username, Position: row.position, 'Assignment / Territory': row.assignmentSummary, 'Submission Type': row.submissionType, Period: row.period, Status: row.status, 'Submitted At': row.submittedAt ?? '' }));
  return createWorkbook([{ name: 'Export Info', rows: metadataRows(session, { Scope: input.scopeMode, Type: input.type, Period: input.date ?? input.weekStart ?? input.month }) }, { name: 'Summary', rows: [{ Expected: result.summary.expected, Submitted: result.summary.submitted, 'Not Submitted': result.summary.notSubmitted, 'Submission Rate %': result.summary.submissionRate ?? '' }] }, { name: 'Employee Status', rows: details }]);
}

export async function buildSalesExport(session: UserSessionPayload, input: SalesInput) {
  const result = await getSalesAnalytics(session, { ...input, page: 1, pageSize: 100 });
  const metrics = (row: Record<string, unknown>): ExportRow => pick(row, [['label','Name'],['position','Position'],['assignmentType','Assignment Type'],['monthlySales','Monthly Sales'],['monthlyTarget','Monthly Target'],['achievementPct','Achievement %'],['ytdSales','YTD Sales'],['ytdTarget','YTD Target'],['ytdAchievementPct','YTD Achievement %'],['recordedPotentiality','Recorded Potentiality'],['recordCount','Record Count']]);
  const allDetails=[...result.details];
  for(let page=2;(page-1)*100<result.total&&page<=200;page++){const next=await getSalesAnalytics(session,{...input,page,pageSize:100});allDetails.push(...next.details)}
  const detailRows = dedupeById(allDetails).map((row) => pick(row as unknown as Record<string, unknown>, [['id','Record ID'],['employee','Employee'],['position','Position'],['territory','Territory'],['assignmentType','Assignment Type'],['month','Month'],['product','Product'],['sales','Sales'],['monthlyTarget','Monthly Target'],['annualTarget','Annual Target'],['potentiality','Recorded Potentiality'],['assignmentActive','Assignment Current'],['productActive','Product Current']]));
  return createWorkbook([{ name: 'Export Info', rows: metadataRows(session, { Month: input.month, Scope: input.scope, Note: result.potentialityDefinition }) }, { name: 'Summary', rows: [metrics({ label: 'Selected Scope', ...result.summary })] }, { name: 'Products', rows: result.products.map((row) => metrics(row)) }, { name: 'Employees', rows: result.employees.map((row) => metrics(row)) }, { name: 'Assignments', rows: result.assignments.map((row) => metrics(row)) }, { name: 'Detail', rows: detailRows }]);
}
