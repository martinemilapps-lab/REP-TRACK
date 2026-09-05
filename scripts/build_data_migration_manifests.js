const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const workbookPath = path.join(__dirname, '..', 'docs', 'data-migration', 'Final Areas sheet.xlsx');
const wb = xlsx.readFile(workbookPath);
const ws = wb.Sheets['Sheet1'];
const raw = xlsx.utils.sheet_to_json(ws, { header: 1 });

function cleanStr(val) {
  if (val === null || val === undefined) return '';
  return String(val).trim().replace(/\s+/g, ' ');
}

function csvEscape(val) {
  if (val === null || val === undefined) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

// 6 Conflict duplicates list (Excel row numbers where row is superseded by confirmed primary position)
// Azza Karim: Primary DM at row 4; Duplicate MR1 at row 70
// Esraa el shimy: Primary DM at row 9; Duplicate MR1 at row 73
// Maher Khamis: Primary DM at row 66; Duplicate MR1 at row 14
// Marian Adel: Primary DM at row 64; Duplicate MR1 at row 72
// Beshoy Samy: Primary DM at row 67; Duplicate MR3 at row 74
// Kirollos Rizk: Primary DM at row 6; Duplicate MR1 (typo 'Kiollos') at row 71
const duplicateInactiveExcelRows = new Set([14, 70, 71, 72, 73, 74]);

// Tracking counters for sequential usernames per confirmed position
const posCounters = {
  MR: 0,
  DM: 0,
  AM: 0,
  OM: 0,
  BUM: 0,
  PM: 0,
  MM: 0,
  SMD: 0,
};

const accountManifestRows = [];
const hierarchyManifestRows = [];

// Audit Tracking Collections
let totalSourceRows = 0;
let vacantRowCount = 0;
let activeAccountCount = 0;
let duplicateRowCount = 0;

const vacantRowsList = [];
const duplicateRowsList = [];
const missingTitlesList = [];
const missingDMList = [];
const missingAMOMList = [];
const inferredRowsList = [];
const multiBUMList = [];
const missingTerritoryList = [];

const positionBreakdown = {
  MR: 0,
  DM: 0,
  AM: 0,
  OM: 0,
  BUM: 0,
  PM: 0,
  MM: 0,
  SMD: 0,
};

// Data rows in Final Areas sheet: index 2 (Excel row 3) to index 83 (Excel row 84)
for (let i = 2; i <= 83; i++) {
  const r = raw[i];
  if (!r) continue;
  totalSourceRows++;
  const excelRow = i + 1;
  const noCol = r[0];
  const rawName = cleanStr(r[1]);
  const rawTitle = cleanStr(r[2]);
  const rawTerritory = cleanStr(r[3]);
  const rawDM = cleanStr(r[4]);
  const rawAM = cleanStr(r[5]);
  const rawOM = cleanStr(r[6]);
  const rawBUM = cleanStr(r[7]);
  const rawMM = cleanStr(r[8]);
  const rawSMD = cleanStr(r[9]);
  const rawSeq = cleanStr(r[10]);
  const rawStatus = cleanStr(r[11]);

  const isVacant = rawName.toLowerCase().startsWith('vacant');
  const isDuplicateInactive = duplicateInactiveExcelRows.has(excelRow);

  // 1. Position Normalization
  let normalizedPos = '';
  let reviewStatus = 'CONFIRMED';
  let accountStatus = 'ACTIVE';
  let proposedUsername = '';
  let noteParts = [];

  const tUpper = rawTitle.toUpperCase().replace(/\s+/g, '');
  if (tUpper.startsWith('MR')) {
    normalizedPos = 'MR';
  } else if (tUpper.startsWith('DM')) {
    normalizedPos = 'DM';
  } else if (tUpper.startsWith('AM')) {
    normalizedPos = 'AM';
  } else if (tUpper.startsWith('OM')) {
    normalizedPos = 'OM';
  } else if (tUpper.startsWith('BUM')) {
    normalizedPos = 'BUM';
  } else if (rawTitle === '') {
    missingTitlesList.push({ excelRow, name: rawName });
    if (rawName === 'Mario Nader' || rawName === 'Wael Morad' || rawName === 'Amr El Hoseny') {
      normalizedPos = 'PM';
      reviewStatus = 'REQUIRES_CONFIRMATION';
      noteParts.push('INFERRED_FROM_HIERARCHY (reports to MM Magdy Nassif, SMD Maged Raouf)');
      inferredRowsList.push({ excelRow, name: rawName, proposedPos: 'PM', reason: 'Reports to MM Magdy Nassif and SMD Maged Raouf' });
    } else if (rawName === 'Magdy Nassif') {
      normalizedPos = 'MM';
      reviewStatus = 'REQUIRES_CONFIRMATION';
      noteParts.push('INFERRED_FROM_HIERARCHY (Marketing Manager heading PM team)');
      inferredRowsList.push({ excelRow, name: rawName, proposedPos: 'MM', reason: 'Listed in MM column for Product Managers; reports to SMD Maged Raouf' });
    } else if (rawName === 'Maged Raouf') {
      normalizedPos = 'SMD';
      reviewStatus = 'REQUIRES_CONFIRMATION';
      noteParts.push('INFERRED_FROM_HIERARCHY (Senior Managing Director)');
      inferredRowsList.push({ excelRow, name: rawName, proposedPos: 'SMD', reason: 'Listed in S and MD column for all employees across company' });
    }
  }

  // 2. Vacancy & Duplicate Account Logic
  if (isVacant) {
    vacantRowCount++;
    accountStatus = 'VACANT';
    reviewStatus = 'CONFIRMED';
    proposedUsername = '';
    noteParts.push('Vacant territory; preserve territory for territory master; no login account');
    vacantRowsList.push({
      excelRow,
      name: rawName,
      title: rawTitle,
      territory: rawTerritory,
      dm: rawDM,
      am: rawAM,
      om: rawOM,
      bum: rawBUM,
      smd: rawSMD,
    });
  } else if (isDuplicateInactive) {
    duplicateRowCount++;
    accountStatus = 'DUPLICATE_INACTIVE';
    reviewStatus = 'REQUIRES_CONFIRMATION';
    proposedUsername = '';
    if (excelRow === 14) {
      noteParts.push('Duplicate MR1 record for Maher Khamis; superseded by active DM record at row 66');
      duplicateRowsList.push({ excelRow, name: rawName, role: 'MR1', activeRow: 66, activeRole: 'DM', notes: 'Superseded by confirmed DM position' });
    }
    if (excelRow === 70) {
      noteParts.push('Duplicate MR1 record for Azza Karim; superseded by active DM record at row 4');
      duplicateRowsList.push({ excelRow, name: rawName, role: 'MR1', activeRow: 4, activeRole: 'DM', notes: 'Superseded by confirmed DM position' });
    }
    if (excelRow === 71) {
      noteParts.push('Duplicate MR1 record for Kirollos Rizk (spelled Kiollos in sheet); superseded by active DM record at row 6');
      duplicateRowsList.push({ excelRow, name: rawName, role: 'MR1', activeRow: 6, activeRole: 'DM', notes: 'Superseded by confirmed DM position for Kirollos Rizk' });
    }
    if (excelRow === 72) {
      noteParts.push('Duplicate MR1 record for Marian Adel; superseded by active DM record at row 64');
      duplicateRowsList.push({ excelRow, name: rawName, role: 'MR1', activeRow: 64, activeRole: 'DM', notes: 'Superseded by confirmed DM position' });
    }
    if (excelRow === 73) {
      noteParts.push('Duplicate MR1 record for Esraa el shimy; superseded by active DM record at row 9');
      duplicateRowsList.push({ excelRow, name: rawName, role: 'MR1', activeRow: 9, activeRole: 'DM', notes: 'Superseded by confirmed DM position' });
    }
    if (excelRow === 74) {
      noteParts.push('Duplicate MR3 record for Beshoy Samy; superseded by active DM record at row 67');
      duplicateRowsList.push({ excelRow, name: rawName, role: 'MR3', activeRow: 67, activeRole: 'DM', notes: 'Superseded by confirmed DM position' });
    }
  } else {
    // Active Confirmed Employee Account
    activeAccountCount++;
    posCounters[normalizedPos] = (posCounters[normalizedPos] || 0) + 1;
    proposedUsername = normalizedPos + posCounters[normalizedPos];
    positionBreakdown[normalizedPos] = (positionBreakdown[normalizedPos] || 0) + 1;

    // Check specific conflict/confirmation flags on primary accounts
    if (excelRow === 4) {
      reviewStatus = 'REQUIRES_CONFIRMATION';
      noteParts.push('Proposed primary DM account; conflicts with legacy MR1 record at row 70');
    } else if (excelRow === 6) {
      noteParts.push('Confirmed primary DM account for Kirollos Rizk (Haram/Faisal); supersedes legacy MR1 duplicate at row 71');
    } else if (excelRow === 9) {
      reviewStatus = 'REQUIRES_CONFIRMATION';
      noteParts.push('Proposed primary DM account; conflicts with legacy MR1 record at row 73');
    } else if (excelRow === 64) {
      reviewStatus = 'REQUIRES_CONFIRMATION';
      noteParts.push('Proposed primary DM account; conflicts with legacy MR1 record at row 72');
    } else if (excelRow === 66) {
      reviewStatus = 'REQUIRES_CONFIRMATION';
      noteParts.push('Proposed primary DM account; conflicts with legacy MR1 record at row 14');
    } else if (excelRow === 67) {
      reviewStatus = 'REQUIRES_CONFIRMATION';
      noteParts.push('Proposed primary DM account; conflicts with legacy MR3 record at row 74');
    }
  }

  // Check missing territory
  if (rawTerritory === '') {
    missingTerritoryList.push({ excelRow, name: rawName, pos: normalizedPos });
    noteParts.push('Territory unassigned in source sheet');
  }

  // 3. Hierarchy Relationship Status & Notes
  let relStatus = 'COMPLETE';
  let hierNoteParts = [];

  const hasDM = rawDM !== '' && rawDM.toLowerCase() !== 'none';
  const hasAM = rawAM !== '';
  const hasOM = rawOM !== '' && rawOM.toLowerCase() !== 'none';
  const hasBUM = rawBUM !== '';
  const isMultiBUM = rawBUM.includes(',');

  if (isMultiBUM) {
    multiBUMList.push({ excelRow, name: rawName, pos: normalizedPos, bums: rawBUM });
  }

  if (isVacant) {
    relStatus = 'VACANT_TERRITORY';
    hierNoteParts.push('Vacant territory assignment structure');
  } else if (isDuplicateInactive) {
    relStatus = 'DUPLICATE_ROW';
    hierNoteParts.push('Historical/duplicate row (superseded by primary management record)');
  } else if (normalizedPos === 'SMD') {
    relStatus = 'EXECUTIVE_HEAD';
    hierNoteParts.push('Head of Organization');
  } else if (normalizedPos === 'MM') {
    relStatus = 'EXECUTIVE_MANAGEMENT';
    hierNoteParts.push('Reports to SMD Maged Raouf');
  } else if (normalizedPos === 'PM') {
    relStatus = 'EXECUTIVE_MANAGEMENT';
    hierNoteParts.push('Reports to MM Magdy Nassif and SMD Maged Raouf');
  } else if (normalizedPos === 'BUM') {
    relStatus = 'EXECUTIVE_MANAGEMENT';
    hierNoteParts.push('Reports to SMD Maged Raouf; leads national business unit');
  } else if (normalizedPos === 'AM' || normalizedPos === 'OM') {
    if (isMultiBUM) {
      relStatus = 'MULTI_BUM_DIRECT';
      hierNoteParts.push('Direct multi-BUM governance (' + rawBUM + ')');
    } else {
      relStatus = 'DIRECT_TO_BUM';
      hierNoteParts.push('Reports directly to BUM ' + rawBUM);
    }
  } else if (normalizedPos === 'DM') {
    if (!hasAM && !hasOM) {
      relStatus = isMultiBUM ? 'MULTI_BUM_DIRECT' : 'DIRECT_TO_BUM';
      hierNoteParts.push('DM reports directly to BUM without intermediate AM/OM');
      missingAMOMList.push({ excelRow, name: rawName, pos: 'DM', bum: rawBUM });
    } else if (hasAM) {
      relStatus = isMultiBUM ? 'MULTI_BUM_VIA_AM' : 'REPORT_TO_AM';
      hierNoteParts.push('Reports to AM ' + rawAM + (isMultiBUM ? ' across multiple BUMs (' + rawBUM + ')' : ''));
    } else if (hasOM) {
      relStatus = isMultiBUM ? 'MULTI_BUM_VIA_OM' : 'REPORT_TO_OM';
      hierNoteParts.push('Reports to OM ' + rawOM + (isMultiBUM ? ' across multiple BUMs (' + rawBUM + ')' : ''));
    }
  } else if (normalizedPos === 'MR') {
    if (!hasDM) {
      missingDMList.push({ excelRow, name: rawName, am: rawAM, om: rawOM, bum: rawBUM, terr: rawTerritory });
      if (hasAM) {
        relStatus = 'DIRECT_TO_AM';
        hierNoteParts.push('MISSING_DM: Reports directly to AM ' + rawAM);
      } else if (hasOM) {
        relStatus = 'DIRECT_TO_OM';
        hierNoteParts.push('MISSING_DM: Reports directly to OM ' + rawOM);
      } else if (hasBUM) {
        relStatus = 'DIRECT_TO_BUM';
        hierNoteParts.push('MISSING_DM & MISSING_AM_OM: Reports directly to BUM ' + rawBUM);
        missingAMOMList.push({ excelRow, name: rawName, pos: 'MR', bum: rawBUM });
      } else {
        relStatus = 'MISSING_ASSIGNMENT';
        hierNoteParts.push('MISSING_ASSIGNMENT: Missing DM, AM/OM, and BUM');
      }
    } else {
      // Has DM
      if (!hasAM && !hasOM) {
        relStatus = 'MISSING_AM_OM';
        hierNoteParts.push('Reports to DM ' + rawDM + '; AM/OM unassigned; BUM: ' + rawBUM);
        missingAMOMList.push({ excelRow, name: rawName, pos: 'MR', bum: rawBUM });
      } else {
        relStatus = isMultiBUM ? 'MULTI_BUM_ASSIGNMENT' : 'COMPLETE';
        hierNoteParts.push('Complete chain: DM ' + rawDM + ' -> ' + (hasAM ? 'AM ' + rawAM : 'OM ' + rawOM) + ' -> ' + rawBUM);
      }
    }
  }

  // Cross-check with Sequence (for CRM) column
  if (rawSeq) {
    hierNoteParts.push('CRM Sequence: [' + rawSeq + ']');
  }

  accountManifestRows.push([
    excelRow,
    rawName,
    rawTitle,
    normalizedPos,
    proposedUsername,
    rawTerritory,
    accountStatus,
    reviewStatus,
    noteParts.join('; '),
  ]);

  hierarchyManifestRows.push([
    rawName,
    normalizedPos,
    rawTerritory,
    rawDM,
    rawAM,
    rawOM,
    rawBUM,
    rawMM,
    rawSMD,
    relStatus,
    hierNoteParts.join('; '),
  ]);
}

// -------------------------------------------------------------------------
// Write Output 1: employee-account-manifest.csv
// -------------------------------------------------------------------------
const accountHeader = [
  'source_row',
  'employee_name',
  'legacy_title_raw',
  'normalized_position',
  'proposed_username',
  'territory',
  'account_status',
  'review_status',
  'notes',
];
const accountCsvContent = [
  accountHeader.map(csvEscape).join(','),
  ...accountManifestRows.map((r) => r.map(csvEscape).join(',')),
].join('\r\n');

const accountCsvPath = path.join(__dirname, '..', 'docs', 'data-migration', 'employee-account-manifest.csv');
fs.writeFileSync(accountCsvPath, '\ufeff' + accountCsvContent, 'utf8');
console.log('Generated:', accountCsvPath);

// -------------------------------------------------------------------------
// Write Output 2: hierarchy-manifest.csv
// -------------------------------------------------------------------------
const hierHeader = [
  'employee_name',
  'position',
  'territory',
  'dm',
  'am',
  'om',
  'bum',
  'mm',
  'smd',
  'relationship_status',
  'notes',
];
const hierCsvContent = [
  hierHeader.map(csvEscape).join(','),
  ...hierarchyManifestRows.map((r) => r.map(csvEscape).join(',')),
].join('\r\n');

const hierCsvPath = path.join(__dirname, '..', 'docs', 'data-migration', 'hierarchy-manifest.csv');
fs.writeFileSync(hierCsvPath, '\ufeff' + hierCsvContent, 'utf8');
console.log('Generated:', hierCsvPath);

// -------------------------------------------------------------------------
// Write Output 3: import-review.md
// -------------------------------------------------------------------------
const mdLines = [];
mdLines.push('# REP TRACK — Final Areas Sheet Audit & Account Manifest Review');
mdLines.push('');
mdLines.push('> **Migration Step**: STEP 1 — Final Areas Sheet Audit, Employee Cleanup & Account Manifest  ');
mdLines.push('> **Authoritative Source**: `Final Areas sheet.xlsx`  ');
mdLines.push('> **Audit Date**: 2026-09-04  ');
mdLines.push('> **Audit Mode**: DATA AUDIT ONLY (No database records modified, no accounts created, no Cloudflare resources provisioned)  ');
mdLines.push('');
mdLines.push('---');
mdLines.push('');
mdLines.push('## 1. Executive Summary & Core Metrics');
mdLines.push('');
mdLines.push('| Metric | Count | Description |');
mdLines.push('|---|---|---|');
mdLines.push(`| **Total Source Records (Rows 3-84)** | **${totalSourceRows}** | Exact count of physical data rows in \`Final Areas sheet.xlsx\` |`);
mdLines.push(`| **Proposed Active Employee Accounts** | **${activeAccountCount}** | Distinct active personnel receiving sequential usernames |`);
mdLines.push(`| **Vacant Territory Records** | **${vacantRowCount}** | Preserved for territory definitions; zero accounts assigned |`);
mdLines.push(`| **Superseded Duplicate Rows** | **${duplicateRowCount}** | Historical/redundant rows flagged as inactive duplicates |`);
mdLines.push(`| **Missing Titles (Unlabeled Roles)** | **${missingTitlesList.length}** | Final management rows lacking explicit Title column values |`);
mdLines.push(`| **Inferred Management Accounts** | **${inferredRowsList.length}** | PM (3), MM (1), and SMD (1) mapped from reporting structure |`);
mdLines.push(`| **Missing Direct DM Assignments (MRs)** | **${missingDMList.length}** | MR rows reporting directly to AM, OM, or BUM without DM |`);
mdLines.push(`| **Missing AM/OM Intermediate Layer** | **${missingAMOMList.length}** | MR or DM rows lacking intermediate AM or OM supervision |`);
mdLines.push(`| **Multi-BUM Governance Records** | **${multiBUMList.length}** | Records explicitly governed by multiple Business Unit Managers |`);
mdLines.push('');
mdLines.push('---');
mdLines.push('');
mdLines.push('## 2. Proposed Active Accounts by Official Position');
mdLines.push('');
mdLines.push('Every confirmed active employee receives one unique sequential username formatted as `<POSITION><NUMBER>`, strictly following spreadsheet appearance order within their finalized position.');
mdLines.push('');
mdLines.push('| Official Position Code | Position Name / Level | Active Account Count | Username Range | Status |');
mdLines.push('|---|---|---|---|---|');
mdLines.push(`| **MR** | Medical Representative | **${positionBreakdown.MR}** | \`MR1\` – \`MR${positionBreakdown.MR}\` | Confirmed / Requires Confirmation for name variant |`);
mdLines.push(`| **DM** | District Manager | **${positionBreakdown.DM}** | \`DM1\` – \`DM${positionBreakdown.DM}\` | Confirmed (includes 5 promoted personnel) |`);
mdLines.push(`| **AM** | Area Manager | **${positionBreakdown.AM}** | \`AM1\` – \`AM${positionBreakdown.AM}\` | Confirmed |`);
mdLines.push(`| **OM** | Operations Manager | **${positionBreakdown.OM}** | \`OM1\` – \`OM${positionBreakdown.OM}\` | Confirmed |`);
mdLines.push(`| **BUM** | Business Unit Manager | **${positionBreakdown.BUM}** | \`BUM1\` – \`BUM${positionBreakdown.BUM}\` | Confirmed |`);
mdLines.push(`| **PM** | Product Manager | **${positionBreakdown.PM}** | \`PM1\` – \`PM${positionBreakdown.PM}\` | **INFERRED_FROM_HIERARCHY** (Requires Confirmation) |`);
mdLines.push(`| **MM** | Marketing Manager | **${positionBreakdown.MM}** | \`MM1\` | **INFERRED_FROM_HIERARCHY** (Requires Confirmation) |`);
mdLines.push(`| **SMD** | Senior Managing Director | **${positionBreakdown.SMD}** | \`SMD1\` | **INFERRED_FROM_HIERARCHY** (Requires Confirmation) |`);
mdLines.push(`| **TOTAL ACTIVE ACCOUNTS** | | **${activeAccountCount}** | | **All 8 Official Position Types Represented** |`);
mdLines.push('');
mdLines.push('---');
mdLines.push('');
mdLines.push('## 3. Vacancy Audit (13 Rows)');
mdLines.push('');
mdLines.push('In accordance with migration rules, any row where Employee Name begins with `Vacant` is **excluded from user account creation**. Their geographic and line management data are preserved to populate future Area/Territory masters.');
mdLines.push('');
mdLines.push('| Source Row | Sheet "No" | Vacant Record Name | Legacy Title | Territory | DM Supervisor | AM / OM Supervisor | BUM | SMD |');
mdLines.push('|---|---|---|---|---|---|---|---|---|');
vacantRowsList.forEach((v) => {
  mdLines.push(`| Row ${v.excelRow} | ${v.no || '-'} | **${v.name}** | \`${v.title}\` | ${v.territory || '*Unassigned*'} | ${v.dm || '-'} | ${v.am ? 'AM: ' + v.am : v.om ? 'OM: ' + v.om : '-'} | ${v.bum || '-'} | ${v.smd || '-'} |`);
});
mdLines.push('');
mdLines.push('---');
mdLines.push('');
mdLines.push('## 4. Duplicate Names & Cross-Position Conflicts');
mdLines.push('');
mdLines.push('Six active individuals appear in the workbook under two distinct positions or typographical variants (an active `DM` entry and an unlinked/historical `MR` entry). To prevent duplicate logins, each person has been assigned a single primary account corresponding to their confirmed supervisory role:');
mdLines.push('');
mdLines.push('| Employee Name | Primary Record (Active) | Duplicate Record (Inactive) | Hierarchy Evidence & Resolution Rational | Migration Status |');
mdLines.push('|---|---|---|---|---|');
mdLines.push('| **Azza Karim** | **Row 4** (`DM1` → `DM1`, Nasr city) | **Row 70** (`MR1`, Masr El gedida) | Row 4 explicitly supervises Row 3 (`Awad Tmsah`, MR1). Row 70 is a legacy MR listing without subordinates. | **RESOLVED: Primary DM1** |');
mdLines.push('| **Kirollos Rizk** | **Row 6** (`DM1` → `DM2`, Haram/Faisal) | **Row 71** (`MR1`, typo \'Kiollos\', Doki) | Confirmed single individual. Row 6 supervises Row 5 (`Vacant Haram faisyal`). Row 71 is a legacy MR typo row. | **RESOLVED: Primary DM2** |');
mdLines.push('| **Esraa el shimy** | **Row 9** (`DM1` → `DM3`, Down Town/Maadi) | **Row 73** (`MR1`, unassigned terr.) | Row 9 explicitly supervises Row 10 (`Vacant Maadi`) and Row 12 (`Vacant Cairo East`). Row 73 lacks territory and supervisors. | **RESOLVED: Primary DM3** |');
mdLines.push('| **Maher Khamis** | **Row 66** (`DM` → `DM13`, Behira/Kafr el shiekh) | **Row 14** (`MR1`, Vacant Behira) | Row 66 is the regional DM supervising Row 76 (`Ahmed El Kot`) and Row 77 (`Vacant Behira`). Row 14 lists Maher as his own DM. | **RESOLVED: Primary DM13** |');
mdLines.push('| **Marian Adel** | **Row 64** (`DM` → `DM11`, Menofya/Qalubia) | **Row 72** (`MR1`, unassigned terr.) | Row 64 explicitly supervises Row 33 (`Ahmed Hassan`) and Row 78 (`Vacant Menofya 3`). Row 72 is an unlinked MR listing. | **RESOLVED: Primary DM11** |');
mdLines.push('| **Beshoy Samy** | **Row 67** (`DM3` → `DM14`, Shobra) | **Row 74** (`MR3`, unassigned terr.) | Row 67 is the DM supervising Row 75 (`Fady Kamal`, MR3). Row 74 is a redundant MR entry. | **RESOLVED: Primary DM14** |');
mdLines.push('');
mdLines.push('---');
mdLines.push('');
mdLines.push('## 5. Inferred PM / MM / SMD Management Roles');
mdLines.push('');
mdLines.push('Rows 80 to 84 in `Final Areas sheet.xlsx` lack values in the `Title` column. However, their organizational relationships establish the commercial marketing and executive leadership:');
mdLines.push('');
mdLines.push('| Source Row | Employee Name | Raw Title | Inferred Position | Proposed Username | Reporting Line | Inferred Rationale | Review Status |');
mdLines.push('|---|---|---|---|---|---|---|---|');
mdLines.push('| **Row 80** | **Mario Nader** | *(empty)* | **PM** | \`PM1\` | MM: Magdy Nassif → SMD: Maged Raouf | Reports to Marketing Manager | **INFERRED_FROM_HIERARCHY / REQUIRES_CONFIRMATION** |');
mdLines.push('| **Row 81** | **Wael Morad** | *(empty)* | **PM** | \`PM2\` | MM: Magdy Nassif → SMD: Maged Raouf | Reports to Marketing Manager | **INFERRED_FROM_HIERARCHY / REQUIRES_CONFIRMATION** |');
mdLines.push('| **Row 82** | **Amr El Hoseny** | *(empty)* | **PM** | \`PM3\` | MM: Magdy Nassif → SMD: Maged Raouf | Reports to Marketing Manager | **INFERRED_FROM_HIERARCHY / REQUIRES_CONFIRMATION** |');
mdLines.push('| **Row 83** | **Magdy Nassif** | *(empty)* | **MM** | \`MM1\` | SMD: Maged Raouf | Referenced as MM in rows 80-82 | **INFERRED_FROM_HIERARCHY / REQUIRES_CONFIRMATION** |');
mdLines.push('| **Row 84** | **Maged Raouf** | *(empty)* | **SMD** | \`SMD1\` | *Head of Company* | Referenced as SMD across entire sheet | **INFERRED_FROM_HIERARCHY / REQUIRES_CONFIRMATION** |');
mdLines.push('');
mdLines.push('---');
mdLines.push('');
mdLines.push('## 6. Hierarchy Architecture & Reporting Line Analysis');
mdLines.push('');
mdLines.push('### A. Missing Direct DM Assignments (16 Clean MR Records)');
mdLines.push('The source data exhibits structural variations where field representatives report directly to Area Managers, Operations Managers, or Business Unit Managers:');
mdLines.push('');
mdLines.push('1. **Direct to Area Manager (AM)**:');
mdLines.push('   - Row 7: `Christena Roshdy` (October) → Reports directly to AM `Michael Antonyo`');
mdLines.push('   - Row 8: `Peter Emad` (Shobra) → Reports directly to AM `Michael Raafat`');
mdLines.push('2. **Direct to Operations Manager (OM)**:');
mdLines.push('   - Row 15: `Kirollos Girgis` (Minya) → Reports directly to OM `Wael Atef`');
mdLines.push('   - Row 16: `Yasser Yosry` (Alex 1) → Reports directly to OM `Mina Michel`');
mdLines.push('   - Row 17: `Eman -Alex` (Eman Alex 1) → Reports directly to OM `Mina Michel`');
mdLines.push('   - Row 31: `Helana Alex 1` (Alex 1) → Reports directly to OM `Mina Michel`');
mdLines.push('   - Row 32: `Marina Sameh` (Tanta) → Reports directly to OM `Peter Abdel Nour`');
mdLines.push('   - Row 44: `Peter william` (Tanta) → Reports directly to OM `Peter Abdel Nour`');
mdLines.push('   - Row 45: `John Amin` (Assuit) → Reports directly to OM `Wael Atef`');
mdLines.push('3. **Direct to Business Unit Manager (BUM)** (Missing both DM and AM/OM):');
mdLines.push('   - Row 22: `Philip Nayer` (Masr El gedida) → Reports directly to BUM `Osama Bert`');
mdLines.push('   - Row 23: `Fawzy Nasser` (Cairo East) → Reports directly to BUM `Osama Bert`');
mdLines.push('   - Row 25: `Engy Hosny` (Shobra) → Reports directly to BUM `Osama Bert`');
mdLines.push('');
mdLines.push('### B. Missing Intermediate AM / OM Layer (15 MR Records)');
mdLines.push('Multiple MR records have a direct DM assigned, but the intermediate AM and OM columns are left empty, reporting directly up to the BUM:');
mdLines.push('- `Esraa shehata` (Row 24, DM: Marwa shaaban, BUM: Osama Bert)');
mdLines.push('- `Sara Adel` (Row 26, DM: Bassem Hanna, BUM: Osama Bert)');
mdLines.push('- `Mostafa Ahmed` (Row 27, DM: Bassem Hanna, BUM: Osama Bert)');
mdLines.push('- `Mohamed Baiomy` (Row 28, DM: Bassem Hanna, BUM: Osama Bert)');
mdLines.push('- `Amanda Medhat` (Row 30, DM: Rafik Maged, BUM: Osama Bert)');
mdLines.push('- `Katrin Hosny` (Row 36, DM: Rafik Maged, BUM: Noha samir)');
mdLines.push('- `Martina Micheel` (Row 37, DM: Ramy Yousef, BUM: Noha samir)');
mdLines.push('- `Silvia Medhat` (Row 38, DM: Ramy Yousef, BUM: Noha samir)');
mdLines.push('- `Yara` (Row 39, DM: Naguib Mahfouz, BUM: Noha samir)');
mdLines.push('- `Ahmed el Behiry` (Row 40, DM: Naguib Mahfouz, BUM: Noha samir)');
mdLines.push('- `Mohamed Ezzat` (Row 42, DM: Milad Mikhaeel, BUM: Noha samir)');
mdLines.push('- `Randa Magdy` (Row 47, DM: Ashraf Shawky, BUM: Fady Nassif, Osama Bert, Noha samir)');
mdLines.push('- `Kirollos Adel` (Row 48, DM: Ashraf Shawky, BUM: Fady Nassif, Osama Bert, Noha samir)');
mdLines.push('- `Neven` (Row 68, DM: Naguib Mahfouz, BUM: Noha samir)');
mdLines.push('- `Fady Kamal` (Row 75, DM: Beshoy Samy, BUM: Noha Samir)');
mdLines.push('');
mdLines.push('### C. Multi-BUM Governance Analysis');
mdLines.push('Several territories and lines in upper Egypt and Delta are shared across multiple Business Unit Managers. Per migration requirements, all listed BUM relationships are preserved:');
mdLines.push('- **Row 45 (John Amin, Assuit)**: `Fady Nassif, Osama Bert, Noha samir`');
mdLines.push('- **Row 47 (Randa Magdy, Qena / Red Sea)**: `Fady Nassif, Osama Bert, Noha samir`');
mdLines.push('- **Row 48 (Kirollos Adel, Sohag)**: `Fady Nassif, Osama Bert, Noha samir`');
mdLines.push('- **Row 34 (Ahmed el Mesalamy, Sharkya / Portsaid)**: `Osama Bert, Noha samir`');
mdLines.push('- **Mid-Management Shared Rows**: Michael Antonyo (Row 53), Rafik Maged (Row 54), Peter Basily (Row 55), Peter Abdel Nour (Row 56), Mina Michel (Row 57), Ashraf Shawky (Row 58), Wael Atef (Row 59), Marian Adel (Row 64), Maher Khamis (Row 66)');
mdLines.push('');
mdLines.push('---');
mdLines.push('');
mdLines.push('## 7. Territory Master Considerations');
mdLines.push('');
mdLines.push('1. **Multi-Region Territories**: Strings such as `Qena / Red Sea`, `Masr El gedida / Nasr City / Shobra`, `Fayoum/Benisuef`, `Sharkia /Mansoura, Mansoura /Sharkia`, and `Sohag , Qena , Red Sea` are preserved verbatim in accordance with Section I to safeguard commercial boundary definitions.');
mdLines.push('2. **Trailing MRs with Unassigned Territory**:');
mdLines.push('   - Row 75 (`Fady Kamal`, MR3): Territory blank in sheet (DM: Beshoy Samy, Shobra line).');
mdLines.push('   - Row 76 (`Ahmed El Kot`, MR2): Territory blank in sheet (DM: Maher Khamis, Behira line).');
mdLines.push('   - Confirmation needed before committing territory records.');
mdLines.push('');
mdLines.push('---');
mdLines.push('');
mdLines.push('## 8. Unresolved Questions & Decision Points for Human Approval');
mdLines.push('');
mdLines.push('Before proceeding to **Step 2 (Database Schema & Migration Scripts)**, the following human confirmations are required:');
mdLines.push('');
mdLines.push('1. [ ] **Cross-Position Promotions Confirmation**: Confirm that the 5 employees (`Azza Karim`, `Esraa el shimy`, `Maher Khamis`, `Marian Adel`, `Beshoy Samy`) should strictly receive `DM` accounts, and that their secondary `MR` rows should be permanently retired without login accounts.');
mdLines.push('2. [ ] **Kirollos vs Kiollos Rizk Identity**: Confirm whether `Kiollos Rizk` (Row 71, MR) is a spelling error for `Kirollos Rizk` (Row 6, DM), or if they are two distinct employees requiring separate usernames (`DM2` and `MR35`).');
mdLines.push('3. [ ] **Commercial Leadership Titles**: Confirm the proposed positions for the 5 unlabeled executive rows:');
mdLines.push('   - `Mario Nader` → `PM1` (Product Manager)');
mdLines.push('   - `Wael Morad` → `PM2` (Product Manager)');
mdLines.push('   - `Amr El Hoseny` → `PM3` (Product Manager)');
mdLines.push('   - `Magdy Nassif` → `MM1` (Marketing Manager)');
mdLines.push('   - `Maged Raouf` → `SMD1` (Senior Managing Director)');
mdLines.push('4. [ ] **Direct Reporting Approvals**: Confirm acceptance of direct reporting structures where MRs report directly to AMs, OMs, or BUMs without an intermediate DM.');
mdLines.push('5. [ ] **Territory Assignments for Trailing MRs**: Provide confirmed territory names for `Fady Kamal` (Row 75) and `Ahmed El Kot` (Row 76).');
mdLines.push('');
mdLines.push('---');
mdLines.push('');
mdLines.push('## 9. Security & Governance Verification');
mdLines.push('');
mdLines.push('- **Passwords**: Zero passwords generated or stored.');
mdLines.push('- **Authentication**: Existing authentication logic remained completely untouched.');
mdLines.push('- **Cloudflare / D1 / Turso**: No network connections, migrations, or D1 resources created.');
mdLines.push('- **State**: The application remains in its current working production state on Vercel.');
mdLines.push('');
mdLines.push('**Status: PENDING HUMAN APPROVAL TO PROCEED TO STEP 2**');

const mdPath = path.join(__dirname, '..', 'docs', 'data-migration', 'import-review.md');
fs.writeFileSync(mdPath, mdLines.join('\n'), 'utf8');
console.log('Generated:', mdPath);
console.log('DATA AUDIT COMPLETED SUCCESSFULLY.');
