import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as XLSX from 'xlsx';
import { createWorkbook, dedupeById, safeFilename, XLSX_MIME } from '../src/lib/exportWorkbook';
import { reportExportSchema, weeklyPlanExportSchema } from '../src/lib/exportSchemas';

assert.equal(safeFilename('REP TRACK\r\nunsafe'), 'REP_TRACK_unsafe.xlsx');
assert.equal(safeFilename('../'), 'REP_TRACK_Export.xlsx');
assert.deepEqual(dedupeById([{id:'same',v:1},{id:'same',v:2},{id:'other',v:3}]),[{id:'same',v:2},{id:'other',v:3}]);
assert.equal(XLSX_MIME,'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
assert.equal(reportExportSchema.safeParse({scopeMode:'ALL_DESCENDANTS',type:'all',owner:'team',repId:'target'}).success,true);
assert.equal(reportExportSchema.safeParse({scopeMode:'COMPANY',type:'all'}).success,false);
assert.equal(weeklyPlanExportSchema.safeParse({team:'true',scopeMode:'DIRECT_REPORTS',weekStart:'2026-09-05'}).success,true);

const bytes=createWorkbook([{name:'Summary',rows:[{Expected:2,Submitted:1,'Submission Rate %':50}]},{name:'Detail',rows:[{ID:'a',Sales:12,Meta:''}]}]);
const workbook=XLSX.read(bytes,{type:'buffer'});
assert.deepEqual(workbook.SheetNames,['Summary','Detail']);
assert.equal((XLSX.utils.sheet_to_json(workbook.Sheets.Summary)[0] as Record<string,unknown>)['Submission Rate %'],50);
assert.equal((XLSX.utils.sheet_to_json(workbook.Sheets.Detail)[0] as Record<string,unknown>).Sales,12,'numeric values remain numeric');
assert.doesNotMatch(JSON.stringify(XLSX.utils.sheet_to_json(workbook.Sheets.Detail)),/\[object Object\]/);

const service=readFileSync('src/lib/services/exportService.ts','utf8');
assert.match(service,/getVisibleReports\(session/,'team report export reuses canonical visibility');
assert.match(service,/getTeamWeeklyPlans\(session/,'team plan export reuses canonical hierarchy');
assert.match(service,/getSalesAnalytics\(session/,'sales export reuses STEP 21');
assert.match(service,/getCompliance\(session/,'compliance export reuses STEP 22');
assert.match(service,/getScopedMasterListsForManager\(session/,'manager list export requires scoped selection');
assert.match(service,/dedupeById\(/,'canonical IDs are deduplicated');
assert.match(service,/PERSONAL_MR|Assignment Type/,'personal assignments remain explicitly identified');
assert.doesNotMatch(service,/passwordHash|sessionToken|apiKey/i,'security material is not exported');

for(const name of ['reports','weekly-plans','lists','sales','compliance']){
  const route=readFileSync(`src/app/api/exports/${name}/route.ts`,'utf8');
  assert.match(route,/requireAuthenticatedUser\(\)|requireManager\(\)/,`${name} authenticates on server`);
  assert.match(route,/\.parse\(/,`${name} validates browser parameters`);
  assert.match(route,/workbookResponse\(/,`${name} uses safe file response`);
}
const legacy=readFileSync('src/app/api/export/excel/route.ts','utf8');
assert.match(legacy,/requireManager\(\)/);
assert.match(legacy,/buildReportsExport/);
assert.doesNotMatch(legacy,/db\.select|from\(representatives\)/,'legacy route no longer exports the company directly');
const response=readFileSync('src/lib/exportWorkbook.ts','utf8');
assert.match(response,/private, no-store/);assert.match(response,/X-Content-Type-Options/);assert.match(response,/Content-Disposition/);
const ui=readFileSync('src/components/exports/ExportCenter.tsx','utf8');
assert.match(ui,/Generating…/);assert.match(ui,/dir=\{ar\?'rtl':'ltr'\}/);assert.match(ui,/URL\.revokeObjectURL/);
console.log('STEP 23 workbook quality, authorization reuse, hierarchy scope, deduplication, PERSONAL_MR, file security, RTL and download UX tests passed');
