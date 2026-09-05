const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { hashSync } = require('bcrypt-ts');

// 1. Helper for CSV parsing
function parseCSV(text) {
  const rows = [];
  let row = [];
  let inQuote = false;
  let cell = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuote && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else {
        inQuote = !inQuote;
      }
    } else if (char === ',' && !inQuote) {
      row.push(cell.trim());
      cell = '';
    } else if ((char === '\n' || char === '\r') && !inQuote) {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(cell.trim());
      if (row.some(c => c.length > 0)) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim());
    if (row.some(c => c.length > 0)) rows.push(row);
  }
  return rows;
}

function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return "'" + String(str).replace(/'/g, "''") + "'";
}

// 2. Read manifests
const employeeCsvPath = path.join(__dirname, '../docs/data-migration/employee-account-manifest.csv');
const hierarchyCsvPath = path.join(__dirname, '../docs/data-migration/hierarchy-manifest.csv');

const empRows = parseCSV(fs.readFileSync(employeeCsvPath, 'utf8'));
const empHeader = empRows[0];
const employees = empRows.slice(1).map(r => {
  const obj = {};
  empHeader.forEach((h, i) => obj[h] = r[i] || '');
  return obj;
});

const hierRows = parseCSV(fs.readFileSync(hierarchyCsvPath, 'utf8'));
const hierHeader = hierRows[0];
const hierarchy = hierRows.slice(1).map(r => {
  const obj = {};
  hierHeader.forEach((h, i) => obj[h] = r[i] || '');
  return obj;
});

console.log('Read', employees.length, 'employee manifest rows');
console.log('Read', hierarchy.length, 'hierarchy manifest rows');

// 3. Approved Positions
const approvedPositions = [
  { code: 'MR', title_en: 'Medical Representative', title_ar: 'مندوب دعاية طبية', level: 1 },
  { code: 'DM', title_en: 'District Manager', title_ar: 'مدير منطقة', level: 2 },
  { code: 'AM', title_en: 'Area Manager', title_ar: 'مدير إقليمي', level: 3 },
  { code: 'OM', title_en: 'Operations Manager', title_ar: 'مدير عمليات', level: 3 },
  { code: 'BUM', title_en: 'Business Unit Manager', title_ar: 'مدير وحدة أعمال', level: 4 },
  { code: 'PM', title_en: 'Product Manager', title_ar: 'مدير منتج', level: 4 },
  { code: 'MM', title_en: 'Marketing Manager', title_ar: 'مدير تسويق', level: 5 },
  { code: 'SMD', title_en: 'Senior Managing Director', title_ar: 'رئيس مجلس الإدارة التنفيذي', level: 6 },
];

// 4. Visit Objectives (48 official bilingual visit objectives, 6 per position)
const visitObjectives = [
  // MR
  { id: 'obj-mr-01', pos: 'MR', code: 'SCIENTIFIC_PROMOTION', ar: 'الترويج العلمي / للمنتج', en: 'Scientific / Product Promotion', order: 1 },
  { id: 'obj-mr-02', pos: 'MR', code: 'DOCTOR_FOLLOW_UP', ar: 'متابعة طبيب', en: 'Doctor Follow-up', order: 2 },
  { id: 'obj-mr-03', pos: 'MR', code: 'PHARMACY_STOCK_CHECK', ar: 'فحص المخزون والتوفر بالصيدلية', en: 'Pharmacy Stock & Availability Check', order: 3 },
  { id: 'obj-mr-04', pos: 'MR', code: 'PRODUCT_AVAILABILITY_SURVEY', ar: 'حصر توفر المنتجات بالمستشفيات', en: 'Hospital Product Availability Survey', order: 4 },
  { id: 'obj-mr-05', pos: 'MR', code: 'DISTRIBUTION_ORDER_COLLECTION', ar: 'متابعة وتجميع طلبيات الموزعين', en: 'Distribution Order Follow-up', order: 5 },
  { id: 'obj-mr-06', pos: 'MR', code: 'KEY_OPINION_LEADER_ENGAGEMENT', ar: 'التواصل مع كبار الأطباء والعملاء', en: 'Key Opinion Leader (KOL) Engagement', order: 6 },
  // DM
  { id: 'obj-dm-01', pos: 'DM', code: 'FIELD_COACHING_DOUBLE_VISIT', ar: 'زيارة مرافقة وتدريب ميداني', en: 'Field Coaching / Double Visit', order: 1 },
  { id: 'obj-dm-02', pos: 'DM', code: 'REP_PERFORMANCE_AUDIT', ar: 'تقييم أداء المندوبين والميدان', en: 'Representative Performance Audit', order: 2 },
  { id: 'obj-dm-03', pos: 'DM', code: 'DISTRICT_KEY_ACCOUNT_VISIT', ar: 'زيارة كبار عملاء المنطقة والمستشفيات', en: 'District Key Account & Hospital Visit', order: 3 },
  { id: 'obj-dm-04', pos: 'DM', code: 'DISTRIBUTOR_STOCK_AUDIT', ar: 'مراجعة مخزون وتغطية فروع التوزيع', en: 'Distributor Branch Stock & Coverage Audit', order: 4 },
  { id: 'obj-dm-05', pos: 'DM', code: 'TERRITORY_SALES_REVIEW', ar: 'مراجعة المبيعات وتحقيق المستهدفات', en: 'Territory Sales Target Review', order: 5 },
  { id: 'obj-dm-06', pos: 'DM', code: 'COMPETITIVE_THREAT_ANALYSIS', ar: 'تحليل الأنشطة التنافسية بالمنطقة', en: 'Regional Competitive Threat Analysis', order: 6 },
  // AM
  { id: 'obj-am-01', pos: 'AM', code: 'REGIONAL_STRATEGY_ALIGNMENT', ar: 'مواءمة الاستراتيجية الإقليمية', en: 'Regional Strategy Alignment', order: 1 },
  { id: 'obj-am-02', pos: 'AM', code: 'TERRITORY_EXPANSION_ASSESSMENT', ar: 'تقييم توسيع رقعة التغطية الإقليمية', en: 'Territory Expansion & Coverage Assessment', order: 2 },
  { id: 'obj-am-03', pos: 'AM', code: 'INSTITUTIONAL_CONTRACT_FOLLOW_UP', ar: 'متابعة عقود المستشفيات والمؤسسات الكبرى', en: 'Institutional Contract & Tender Follow-up', order: 3 },
  { id: 'obj-am-04', pos: 'AM', code: 'CROSS_DISTRICT_PERFORMANCE_AUDIT', ar: 'مراجعة الأداء عبر مختلف المناطق', en: 'Cross-District Performance Audit', order: 4 },
  { id: 'obj-am-05', pos: 'AM', code: 'MANAGEMENT_COACHING', ar: 'تدريب وتوجيه مديري المناطق (DMs)', en: 'District Manager Coaching & Supervision', order: 5 },
  { id: 'obj-am-06', pos: 'AM', code: 'REGIONAL_MARKET_INTELLIGENCE', ar: 'استخبارات السوق والقطاع الصحي الإقليمي', en: 'Regional Market Intelligence Review', order: 6 },
  // OM
  { id: 'obj-om-01', pos: 'OM', code: 'SUPPLY_CHAIN_BOTTLENECK_AUDIT', ar: 'مراجعة تدفق التوريدات وسلاسل الإمداد', en: 'Supply Chain & Inventory Flow Audit', order: 1 },
  { id: 'obj-om-02', pos: 'OM', code: 'DISTRIBUTION_EFFICIENCY_REVIEW', ar: 'تقييم كفاءة وموثوقية شركات التوزيع', en: 'Distribution Efficiency & Delivery Review', order: 2 },
  { id: 'obj-om-03', pos: 'OM', code: 'HOSPITAL_STOCKOUT_INTERVENTION', ar: 'التدخل لحل نواقص المستشفيات الكبرى', en: 'Hospital Stockout Emergency Intervention', order: 3 },
  { id: 'obj-om-04', pos: 'OM', code: 'FIELD_OPERATION_COMPLIANCE', ar: 'التدقيق التشغيلي والامتثال الميداني', en: 'Field Operations Compliance Audit', order: 4 },
  { id: 'obj-om-05', pos: 'OM', code: 'RESOURCE_ALLOCATION_AUDIT', ar: 'مراجعة تخصيص الموارد والعينات الطبية', en: 'Resource Allocation & Sample Auditing', order: 5 },
  { id: 'obj-om-06', pos: 'OM', code: 'BRANCH_LOGISTICS_OPTIMIZATION', ar: 'تحسين المسارات اللوجستية وتغطية الفروع', en: 'Branch Logistics & Territory Route Optimization', order: 6 },
  // BUM
  { id: 'obj-bum-01', pos: 'BUM', code: 'BU_PORTFOLIO_PERFORMANCE_AUDIT', ar: 'مراجعة أداء محفظة وحدة الأعمال', en: 'Business Unit Portfolio Performance Audit', order: 1 },
  { id: 'obj-bum-02', pos: 'BUM', code: 'NATIONAL_KEY_ACCOUNT_MANAGEMENT', ar: 'إدارة وتفاوض الحسابات الاستراتيجية القومية', en: 'National Key Account Engagement', order: 2 },
  { id: 'obj-bum-03', pos: 'BUM', code: 'MARKET_PENETRATION_STRATEGY', ar: 'تقييم خطط النفاذ والتوسع السوقي للمنتجات', en: 'Market Penetration & Growth Strategy Review', order: 3 },
  { id: 'obj-bum-04', pos: 'BUM', code: 'TENDER_FULFILLMENT_SUPERVISION', ar: 'الإشراف على توريدات المناقصات الحكومية والجامعية', en: 'Government & University Tender Supervision', order: 4 },
  { id: 'obj-bum-05', pos: 'BUM', code: 'MULTI_REGIONAL_FIELD_INSPECTION', ar: 'جولة تفتيش ميدانية شاملة متعددة الأقاليم', en: 'Multi-Regional Field Leadership Tour', order: 5 },
  { id: 'obj-bum-06', pos: 'BUM', code: 'CROSS_FUNCTIONAL_KPI_REVIEW', ar: 'تقييم مؤشرات الأداء مع التسويق والعمليات', en: 'Cross-Functional Commercial KPI Review', order: 6 },
  // PM
  { id: 'obj-pm-01', pos: 'PM', code: 'PRODUCT_CAMPAIGN_FEEDBACK', ar: 'استطلاع رأي الأطباء حول الحملة التسويقية', en: 'Marketing Campaign Effectiveness Survey', order: 1 },
  { id: 'obj-pm-02', pos: 'PM', code: 'SCIENTIFIC_CONTENT_EVALUATION', ar: 'تقييم استيعاب الرسالة العلمية والمواد الترويجية', en: 'Scientific Message Delivery Evaluation', order: 2 },
  { id: 'obj-pm-03', pos: 'PM', code: 'KOL_ADVISORY_ENGAGEMENT', ar: 'جلسة استشارية علمية مع قادة الرأي الطبي', en: 'KOL Advisory Board & Engagement', order: 3 },
  { id: 'obj-pm-04', pos: 'PM', code: 'NEW_LAUNCH_FIELD_MONITORING', ar: 'متابعة ميدانية مكثفة لإطلاق منتج جديد', en: 'New Product Launch Field Monitoring', order: 4 },
  { id: 'obj-pm-05', pos: 'PM', code: 'COMPETITOR_MESSAGING_ANALYSIS', ar: 'رصد رسائل المنافسين والبدائل العلاجية', en: 'Competitor Scientific Messaging Analysis', order: 5 },
  { id: 'obj-pm-06', pos: 'PM', code: 'PATIENT_JOURNEY_INSIGHTS', ar: 'دراسة مسار المريض وبروتوكولات العلاج بالمستشفيات', en: 'Patient Treatment Journey Field Insights', order: 6 },
  // MM
  { id: 'obj-mm-01', pos: 'MM', code: 'MARKETING_STRATEGY_VALIDATION', ar: 'التحقق الميداني من فاعلية الخطة التسويقية', en: 'Marketing Strategy Field Validation', order: 1 },
  { id: 'obj-mm-02', pos: 'MM', code: 'NATIONAL_MEDICAL_SOCIETY_MEETING', ar: 'التنسيق مع الجمعيات الطبية والمؤتمرات القومية', en: 'National Medical Society Partnership Meeting', order: 2 },
  { id: 'obj-mm-03', pos: 'MM', code: 'BRAND_EQUITY_AUDIT', ar: 'تقييم القيمة السوقية والصورة الذهنية للعلامات', en: 'Brand Equity & Health System Reputation Audit', order: 3 },
  { id: 'obj-mm-04', pos: 'MM', code: 'PORTFOLIO_SYNERGY_INSPECTION', ar: 'مراجعة تكامل وترويج باقات المنتجات المشتركة', en: 'Cross-Portfolio Synergy & Promotion Review', order: 4 },
  { id: 'obj-mm-05', pos: 'MM', code: 'PM_TEAM_FIELD_EVALUATION', ar: 'مرافقة وتقييم أداء مديري المنتجات ميدانياً', en: 'Product Management Team Field Supervision', order: 5 },
  { id: 'obj-mm-06', pos: 'MM', code: 'ANNUAL_MARKETING_PLAN_AUDIT', ar: 'مراجعة وتحديث أهداف المخطط التسويقي السنوي', en: 'Annual Commercial Marketing Plan Review', order: 6 },
  // SMD
  { id: 'obj-smd-01', pos: 'SMD', code: 'EXECUTIVE_FIELD_OVERSIGHT', ar: 'جولة الرقابة التنفيذية العليا للإدارة', en: 'Executive Field Oversight & Governance', order: 1 },
  { id: 'obj-smd-02', pos: 'SMD', code: 'STRATEGIC_HEALTHCARE_PARTNERSHIPS', ar: 'شراكات استراتيجية مع كبرى الهيئات الصحية', en: 'Strategic Healthcare Leadership Partnership', order: 2 },
  { id: 'obj-smd-03', pos: 'SMD', code: 'ORGANIZATIONAL_CULTURE_REVIEW', ar: 'تعزيز ثقافة التميز والنزاهة المهنية ميدانياً', en: 'Organizational Culture & Field Integrity Review', order: 3 },
  { id: 'obj-smd-04', pos: 'SMD', code: 'NATIONWIDE_COMMERCIAL_AUDIT', ar: 'التدقيق التجاري الشامل للعمليات على مستوى الجمهورية', en: 'Nationwide Commercial Operations Audit', order: 4 },
  { id: 'obj-smd-05', pos: 'SMD', code: 'KEY_HEALTHCARE_POLICY_ENGAGEMENT', ar: 'متابعة السياسات والتشريعات الدوائية المؤثرة', en: 'Healthcare Policy & Sector Governance Review', order: 5 },
  { id: 'obj-smd-06', pos: 'SMD', code: 'SHAREHOLDER_VALUE_EXPANSION', ar: 'استكشاف فرص التوسع الاستراتيجي الكبرى', en: 'Strategic Enterprise Growth & Expansion Review', order: 6 },
];

// 5. Gather Areas from manifests
const territorySet = new Set();

employees.forEach(e => {
  if (e.territory && e.territory.trim().length > 0) {
    territorySet.add(e.territory.trim());
  }
});
hierarchy.forEach(h => {
  if (h.territory && h.territory.trim().length > 0) {
    territorySet.add(h.territory.trim());
  }
});

// If trailing MRs have unassigned territory, ensure 'Unassigned' is present
territorySet.add('Unassigned');

const sortedTerritories = Array.from(territorySet).sort();
console.log('Total unique areas to insert:', sortedTerritories.length);

const areaMap = new Map(); // territory name -> area id
const areaInserts = sortedTerritories.map((t, idx) => {
  const id = `area-${String(idx + 1).padStart(3, '0')}`;
  areaMap.set(t, id);
  return `INSERT OR REPLACE INTO \`areas\` (\`id\`, \`name\`, \`is_active\`) VALUES (${escapeSql(id)}, ${escapeSql(t)}, 1);`;
});

// 6. Active Employees & User Accounts (63 accounts)
const activeEmployees = employees.filter(e => e.account_status === 'ACTIVE');
console.log('Active employees to provision:', activeEmployees.length);

const activeEmpByName = new Map();
activeEmployees.forEach(e => {
  activeEmpByName.set(e.employee_name.trim().toLowerCase(), e);
});

// 7. MRs to Representatives (36 MRs)
const activeMRs = activeEmployees.filter(e => e.normalized_position === 'MR');
console.log('Active MRs to provision:', activeMRs.length);

const repMap = new Map(); // username -> rep id
const repInserts = activeMRs.map(mr => {
  const repId = `rep-${mr.proposed_username.toLowerCase()}`;
  repMap.set(mr.proposed_username, repId);

  let terr = mr.territory ? mr.territory.trim() : '';
  if (!terr) {
    // Map trailing MRs to their supervising DM territory or Unassigned
    if (mr.employee_name === 'Fady Kamal') terr = 'Shobra /Shobra el Khema';
    else if (mr.employee_name === 'Ahmed El Kot') terr = 'Behira/Kafr el shiekh';
    else terr = 'Unassigned';
  }

  return `INSERT OR REPLACE INTO \`representatives\` (\`id\`, \`name\`, \`area\`, \`is_active\`) VALUES (${escapeSql(repId)}, ${escapeSql(mr.employee_name)}, ${escapeSql(terr)}, 1);`;
});

// 8. User Accounts & Temporary Passwords (63 accounts)
const devCredentials = [];
const userMap = new Map(); // username -> user id

const userInserts = activeEmployees.map(emp => {
  const username = emp.proposed_username;
  const userId = `u-${username.toLowerCase()}`;
  userMap.set(username, userId);

  // Extract number from username (e.g. 'MR1' -> 1, 'DM14' -> 14)
  const numMatch = username.match(/\d+/);
  const usernameNumber = numMatch ? parseInt(numMatch[0], 10) : 1;

  const pos = emp.normalized_position;
  const isMR = pos === 'MR';
  const role = isMR ? 'REPRESENTATIVE' : 'MANAGER';
  const systemRole = pos === 'SMD' ? 'ADMIN' : isMR ? 'USER' : 'MANAGER';
  const repId = isMR ? repMap.get(username) : null;

  // Generate secure temporary password for DEV
  const tempPassword = `RepTrack2026!${username}`;
  const passwordHash = hashSync(tempPassword, 10);

  devCredentials.push({
    username,
    name: emp.employee_name,
    position: pos,
    username_number: usernameNumber,
    system_role: systemRole,
    temp_password: tempPassword,
    must_change_password: true,
  });

  return `INSERT OR REPLACE INTO \`users\` (
    \`id\`, \`username\`, \`username_number\`, \`name\`, \`password_hash\`,
    \`position_code\`, \`system_role\`, \`role\`, \`rep_id\`, \`is_active\`,
    \`must_change_password\`, \`legacy_title_raw\`
  ) VALUES (
    ${escapeSql(userId)}, ${escapeSql(username)}, ${usernameNumber}, ${escapeSql(emp.employee_name)}, ${escapeSql(passwordHash)},
    ${escapeSql(pos)}, ${escapeSql(systemRole)}, ${escapeSql(role)}, ${repId ? escapeSql(repId) : 'NULL'}, 1,
    1, ${emp.legacy_title_raw ? escapeSql(emp.legacy_title_raw) : 'NULL'}
  );`;
});

// 9. Manager Scopes (manager_rep_scopes & manager_area_scopes)
const repScopesSet = new Set();
const areaScopesSet = new Set();
const repScopeInserts = [];
const areaScopeInserts = [];

let repScopeCounter = 0;
let areaScopeCounter = 0;

hierarchy.forEach(h => {
  const empName = h.employee_name.trim().toLowerCase();
  const emp = activeEmpByName.get(empName);
  const isMR = emp && emp.normalized_position === 'MR';

  const dmList = h.dm ? h.dm.split(',').map(s => s.trim()).filter(Boolean) : [];
  const amList = h.am ? h.am.split(',').map(s => s.trim()).filter(Boolean) : [];
  const omList = h.om ? h.om.split(',').map(s => s.trim()).filter(Boolean) : [];
  const bumList = h.bum ? h.bum.split(',').map(s => s.trim()).filter(Boolean) : [];

  let terr = h.territory ? h.territory.trim() : '';
  if (!terr && isMR) {
    if (emp.employee_name === 'Fady Kamal') terr = 'Shobra /Shobra el Khema';
    else if (emp.employee_name === 'Ahmed El Kot') terr = 'Behira/Kafr el shiekh';
  }

  const allSupervisors = [...dmList, ...amList, ...omList, ...bumList];

  allSupervisors.forEach(mgrName => {
    if (mgrName.toLowerCase() === 'none') return;
    const mgr = activeEmpByName.get(mgrName.toLowerCase());
    if (!mgr) return;

    const mgrUserId = userMap.get(mgr.proposed_username);

    // Link manager to representative
    if (isMR) {
      const repId = repMap.get(emp.proposed_username);
      const repKey = `${mgrUserId}:${repId}`;
      if (!repScopesSet.has(repKey)) {
        repScopesSet.add(repKey);
        repScopeCounter++;
        const scopeId = `mrs-${String(repScopeCounter).padStart(3, '0')}`;
        repScopeInserts.push(`INSERT OR REPLACE INTO \`manager_rep_scopes\` (\`id\`, \`manager_user_id\`, \`rep_id\`) VALUES (${escapeSql(scopeId)}, ${escapeSql(mgrUserId)}, ${escapeSql(repId)});`);
      }

      // Link manager to area
      if (terr && areaMap.has(terr)) {
        const areaId = areaMap.get(terr);
        const areaKey = `${mgrUserId}:${areaId}`;
        if (!areaScopesSet.has(areaKey)) {
          areaScopesSet.add(areaKey);
          areaScopeCounter++;
          const scopeId = `mas-${String(areaScopeCounter).padStart(3, '0')}`;
          areaScopeInserts.push(`INSERT OR REPLACE INTO \`manager_area_scopes\` (\`id\`, \`manager_user_id\`, \`area_id\`) VALUES (${escapeSql(scopeId)}, ${escapeSql(mgrUserId)}, ${escapeSql(areaId)});`);
        }
      }
    } else if (terr && areaMap.has(terr)) {
      // Manager row territory
      const areaId = areaMap.get(terr);
      const areaKey = `${mgrUserId}:${areaId}`;
      if (!areaScopesSet.has(areaKey)) {
        areaScopesSet.add(areaKey);
        areaScopeCounter++;
        const scopeId = `mas-${String(areaScopeCounter).padStart(3, '0')}`;
        areaScopeInserts.push(`INSERT OR REPLACE INTO \`manager_area_scopes\` (\`id\`, \`manager_user_id\`, \`area_id\`) VALUES (${escapeSql(scopeId)}, ${escapeSql(mgrUserId)}, ${escapeSql(areaId)});`);
      }
    }
  });

  // If the employee is themselves a manager with a territory, add their territory scope
  if (emp && ['DM', 'AM', 'OM', 'BUM'].includes(emp.normalized_position) && terr && areaMap.has(terr)) {
    const mgrUserId = userMap.get(emp.proposed_username);
    const areaId = areaMap.get(terr);
    const areaKey = `${mgrUserId}:${areaId}`;
    if (!areaScopesSet.has(areaKey)) {
      areaScopesSet.add(areaKey);
      areaScopeCounter++;
      const scopeId = `mas-${String(areaScopeCounter).padStart(3, '0')}`;
      areaScopeInserts.push(`INSERT OR REPLACE INTO \`manager_area_scopes\` (\`id\`, \`manager_user_id\`, \`area_id\`) VALUES (${escapeSql(scopeId)}, ${escapeSql(mgrUserId)}, ${escapeSql(areaId)});`);
    }
  }
});

console.log('manager_rep_scopes generated:', repScopeInserts.length);
console.log('manager_area_scopes generated:', areaScopeInserts.length);

// 10. Assemble full SQL Script
const sqlLines = [
  '-- ====================================================',
  '-- REP TRACK: Initial Organization Provisioning (STEP 11)',
  '-- Database: rep-track-dev',
  '-- ====================================================',
  '',
  '-- 1. Positions',
  ...approvedPositions.map(p => `INSERT OR REPLACE INTO \`positions\` (\`code\`, \`title_en\`, \`title_ar\`, \`hierarchy_level\`) VALUES (${escapeSql(p.code)}, ${escapeSql(p.title_en)}, ${escapeSql(p.title_ar)}, ${p.level});`),
  '',
  '-- 2. Visit Objectives',
  ...visitObjectives.map(o => `INSERT OR REPLACE INTO \`visit_objectives\` (\`id\`, \`position_code\`, \`objective_code\`, \`name_ar\`, \`name_en\`, \`display_order\`, \`is_active\`) VALUES (${escapeSql(o.id)}, ${escapeSql(o.pos)}, ${escapeSql(o.code)}, ${escapeSql(o.ar)}, ${escapeSql(o.en)}, ${o.order}, 1);`),
  '',
  '-- 3. Areas',
  ...areaInserts,
  '',
  '-- 4. Representatives',
  ...repInserts,
  '',
  '-- 5. Users',
  ...userInserts,
  '',
  '-- 6. Manager Rep Scopes',
  ...repScopeInserts,
  '',
  '-- 7. Manager Area Scopes',
  ...areaScopeInserts,
  '',
];

const sqlContent = sqlLines.join('\n');
const sqlFilePath = path.join(__dirname, 'provision_dev_organization.sql');
fs.writeFileSync(sqlFilePath, sqlContent, 'utf8');
console.log('Wrote SQL file to', sqlFilePath, '(', sqlLines.length, 'lines)');

// 11. Write dev-credentials.json (gitignored)
const credsPath = path.join(__dirname, '../.dev-credentials.json');
fs.writeFileSync(credsPath, JSON.stringify(devCredentials, null, 2), 'utf8');
console.log('Wrote secure DEV credentials to', credsPath, '(', devCredentials.length, 'accounts)');
