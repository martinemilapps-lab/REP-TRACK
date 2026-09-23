import { createWorkbook, sanitizeSheetName, safeFilename, workbookResponse } from '../src/lib/exportWorkbook';
import { cleanPlanCellText } from '../src/lib/services/exportService';

export async function runExportSystemTests() {
  console.log('\n📊 Running Export System & Excel Processing Tests...');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✓ ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      failed++;
    }
  }

  // 1. Sheet name sanitization tests
  const cleaned1 = sanitizeSheetName('Hospitals: Special / Clinic [North]');
  assert(!cleaned1.includes(':') && !cleaned1.includes('/') && !cleaned1.includes('[') && !cleaned1.includes(']'), 'sanitizeSheetName removes invalid characters []:*?/\\');
  assert(cleaned1.length <= 31, 'sanitizeSheetName enforces <= 31 characters');

  const longName = sanitizeSheetName('This is an extremely long sheet name that exceeds the thirty one char limit by far');
  assert(longName.length === 31, 'sanitizeSheetName truncates exactly to 31 characters');

  const emptyCleaned = sanitizeSheetName('');
  assert(emptyCleaned === 'Sheet1', 'sanitizeSheetName falls back to "Sheet1" on empty string');

  // 2. safeFilename RFC 5987 tests
  const arabicFile = safeFilename('تقرير_الزيارات_اليومي_MR36');
  assert(typeof arabicFile === 'string', 'safeFilename returns string');
  assert(arabicFile.endsWith('.xlsx'), 'safeFilename ascii fallback has .xlsx extension');
  assert(!arabicFile.includes(' '), 'safeFilename ascii fallback has no raw spaces');

  // 3. createWorkbook creation with multiple sheets & auto-sizing
  const rawSheets = [
    {
      name: 'Summary KPIs',
      rows: [
        { 'Metric': 'Hospital Coverage', 'Target': 20, 'Actual': 18, 'Rate %': '90%' },
        { 'Metric': 'Doctor Frequency', 'Target': 50, 'Actual': 52, 'Rate %': '104%' },
      ],
    },
    {
      name: 'Customer Breakdown',
      rows: [
        { 'Customer Name': 'Dr. Tarek Omar', 'Category': 'Doctor', 'Cycle (Days)': 7, 'Expected': 4, 'Actual Visited': 4, 'Frequency Status': '🟢 Same frequency', 'Coverage %': '100%' },
        { 'Customer Name': 'Al-Amal Hospital', 'Category': 'Hospital', 'Cycle (Days)': 14, 'Expected': 2, 'Actual Visited': 3, 'Frequency Status': '🔴 Overvisited', 'Coverage %': '100%' },
        { 'Customer Name': 'Care Pharmacy', 'Category': 'Pharmacy', 'Cycle (Days)': 7, 'Expected': 4, 'Actual Visited': 2, 'Frequency Status': '🟡 Less visited', 'Coverage %': '50%' },
      ],
    },
  ];

  const bytes = createWorkbook(rawSheets);
  assert(bytes instanceof Uint8Array, 'createWorkbook returns Uint8Array');
  assert(bytes.length > 0, 'Workbook bytes are not empty');

  // Parse back with XLSX to verify true Excel workbook format
  const XLSX = await import('xlsx');
  const readWb = XLSX.read(bytes, { type: 'buffer' });
  assert(readWb.SheetNames.length === 2, 'Workbook contains 2 sheets');
  assert(readWb.SheetNames[0] === 'Summary KPIs', 'Sheet 1 has correct name');
  assert(readWb.SheetNames[1] === 'Customer Breakdown', 'Sheet 2 has correct name');

  // Test cell content in Sheet 2
  const sheet2 = readWb.Sheets['Customer Breakdown'];
  assert(Boolean(sheet2), 'Customer Breakdown sheet exists');
  assert(sheet2['A1']?.v === 'Customer Name', 'Header A1 matches "Customer Name"');
  assert(sheet2['A2']?.v === 'Dr. Tarek Omar', 'Row 2 A2 matches first customer');
  assert(sheet2['F2']?.v === '🟢 Same frequency', 'Row 2 F2 contains frequency status 🟢');
  assert(sheet2['F3']?.v === '🔴 Overvisited', 'Row 3 F3 contains frequency status 🔴');
  assert(sheet2['F4']?.v === '🟡 Less visited', 'Row 4 F4 contains frequency status 🟡');

  // 4. workbookResponse headers test
  const response = workbookResponse(bytes, 'Test_Report_Export_تقرير');
  assert(response.status === 200, 'workbookResponse returns HTTP 200');
  const contentType = response.headers.get('Content-Type');
  assert(contentType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'workbookResponse sets proper OpenXML .xlsx MIME type');
  const contentDisp = response.headers.get('Content-Disposition') || '';
  assert(Boolean(contentDisp) && contentDisp.includes('attachment; filename='), 'workbookResponse sets attachment Content-Disposition header');
  assert(Boolean(contentDisp) && contentDisp.includes("filename*=UTF-8''"), 'workbookResponse includes RFC 5987 UTF-8 filename');

  // 5. cleanPlanCellText helper tests
  const formattedCell = cleanPlanCellText({
    visitType: 'Double',
    companion: 'DM Hany',
    activities: ['MEETING', 'TRAINING'],
    hospitals: ['Al-Salam Hospital', 'Al-Safwa Hospital'],
    doctors: ['Dr. Ahmed', 'Dr. Mahmoud'],
    pharmacies: ['El-Ezaby Pharmacy'],
    branches: ['Branch Heliopolis'],
    meetingDescription: 'Sales strategy discussion',
    trainingDescription: 'Product XYZ onboarding',
  });

  assert(formattedCell.includes('Double (With: DM Hany)'), 'cleanPlanCellText includes visit type and companion');
  assert(formattedCell.includes('Al-Salam Hospital'), 'cleanPlanCellText includes hospitals');
  assert(formattedCell.includes('Dr. Ahmed'), 'cleanPlanCellText includes doctors');
  assert(formattedCell.includes('El-Ezaby Pharmacy'), 'cleanPlanCellText includes pharmacies');
  assert(formattedCell.includes('Branch Heliopolis'), 'cleanPlanCellText includes branches');
  assert(formattedCell.includes('Meeting: Sales strategy discussion'), 'cleanPlanCellText includes meeting notes');
  assert(formattedCell.includes('Training: Product XYZ onboarding'), 'cleanPlanCellText includes training notes');

  const emptyCell = cleanPlanCellText(null);
  assert(emptyCell === '—', 'cleanPlanCellText returns dash on null or empty cell');

  return { passed, failed };
}
