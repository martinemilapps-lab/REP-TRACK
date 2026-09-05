import { buildOrganizationDataset } from './provision_organization_foundation';
import { aggregateSalesForManager, validateHierarchyAcyclicity } from '../src/lib/services/organizationService';

export function runVerification(): { passed: number; failed: number; checks: string[] } {
  const checks: string[] = [];
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, name: string) {
    if (condition) {
      checks.push(`✓ PASS: ${name}`);
      passed++;
    } else {
      checks.push(`✗ FAIL: ${name}`);
      failed++;
    }
  }

  const dataset = buildOrganizationDataset();

  // ----------------------------------------------------
  // A. MR → DM → AM → BUM → SMD (Awad Tmsah standard path)
  // ----------------------------------------------------
  const awadUser = dataset.users.find(u => u.username === 'MR1')!;
  const awadPaths = dataset.hierarchyPaths.filter(p => p.source_user_id === awadUser.id);
  const awadAncestors = awadPaths.map(p => p.ancestor_position);

  assert(
    awadAncestors.includes('DM') &&
      awadAncestors.includes('AM') &&
      awadAncestors.includes('BUM') &&
      awadAncestors.includes('SMD'),
    'Test A: MR Awad Tmsah has complete path MR -> DM -> AM -> BUM -> SMD'
  );

  // ----------------------------------------------------
  // B. Direct MR → AM (Christena Roshdy, Peter Emad)
  // ----------------------------------------------------
  const christenaUser = dataset.users.find(u => u.username === 'MR2')!;
  const christenaDirectRels = dataset.relationships.filter(r => r.subordinate_user_id === christenaUser.id);
  const christenaPaths = dataset.hierarchyPaths.filter(p => p.source_user_id === christenaUser.id);

  assert(
    christenaDirectRels.some(r => r.manager_position === 'AM') &&
      !christenaDirectRels.some(r => r.manager_position === 'DM'),
    'Test B: MR Christena Roshdy reports directly to AM without intermediate DM'
  );
  assert(
    christenaPaths.some(p => p.ancestor_position === 'BUM') &&
      christenaPaths.some(p => p.ancestor_position === 'SMD'),
    'Test B: MR Christena Roshdy reaches BUM and SMD through AM'
  );

  // ----------------------------------------------------
  // C. Direct MR → OM (Kirollos Girgis, Yasser Yosry, John Amin)
  // ----------------------------------------------------
  const yasserUser = dataset.users.find(u => u.username === 'MR6')!;
  const yasserDirectRels = dataset.relationships.filter(r => r.subordinate_user_id === yasserUser.id);
  const yasserPaths = dataset.hierarchyPaths.filter(p => p.source_user_id === yasserUser.id);

  assert(
    yasserDirectRels.some(r => r.manager_position === 'OM') &&
      !yasserDirectRels.some(r => r.manager_position === 'DM'),
    'Test C: MR Yasser Yosry reports directly to OM without intermediate DM'
  );
  assert(
    yasserPaths.some(p => p.ancestor_position === 'BUM') &&
      yasserPaths.some(p => p.ancestor_position === 'SMD'),
    'Test C: MR Yasser Yosry reaches BUM and SMD through OM'
  );

  // ----------------------------------------------------
  // D. Direct MR → BUM (Philip Nayer, Fawzy Nasser, Engy Hosny)
  // ----------------------------------------------------
  const philipUser = dataset.users.find(u => u.username === 'MR10')!;
  const philipDirectRels = dataset.relationships.filter(r => r.subordinate_user_id === philipUser.id);
  const philipPaths = dataset.hierarchyPaths.filter(p => p.source_user_id === philipUser.id);

  assert(
    philipDirectRels.some(r => r.manager_position === 'BUM') &&
      !philipDirectRels.some(r => r.manager_position === 'DM') &&
      !philipDirectRels.some(r => r.manager_position === 'AM') &&
      !philipDirectRels.some(r => r.manager_position === 'OM'),
    'Test D: MR Philip Nayer reports directly to BUM without DM, AM, or OM'
  );
  assert(
    philipPaths.some(p => p.ancestor_position === 'SMD'),
    'Test D: MR Philip Nayer reaches SMD directly from BUM'
  );

  // ----------------------------------------------------
  // E. Multi-BUM (John Amin in Assuit, Randa Magdy in Qena/Red Sea)
  // ----------------------------------------------------
  const johnUser = dataset.users.find(u => u.username === 'MR31')!; // John Amin
  const johnPaths = dataset.hierarchyPaths.filter(p => p.source_user_id === johnUser.id);
  const johnBumAncestors = johnPaths.filter(p => p.ancestor_position === 'BUM');

  // Should reach all 3 BUMs: Fady Nassif, Osama Bert, Noha samir
  const bumUserIds = dataset.users.filter(u => u.position_code === 'BUM').map(u => u.id);
  const reachedAllBums = bumUserIds.every(id => johnBumAncestors.some(p => p.ancestor_user_id === id));

  assert(
    reachedAllBums && johnBumAncestors.length >= 3,
    'Test E: Multi-BUM assignment for John Amin simultaneously routes to all 3 BUMs'
  );

  // ----------------------------------------------------
  // F. PM → MM → SMD (Mario Nader -> Magdy Nassif -> Maged Raouf)
  // ----------------------------------------------------
  const marioUser = dataset.users.find(u => u.username === 'PM1')!;
  const marioDirectRels = dataset.relationships.filter(r => r.subordinate_user_id === marioUser.id);
  const marioPaths = dataset.hierarchyPaths.filter(p => p.source_user_id === marioUser.id);

  assert(
    marioDirectRels.some(r => r.manager_position === 'MM'),
    'Test F: PM Mario Nader reports directly to Marketing Manager (MM)'
  );
  assert(
    marioPaths.some(p => p.ancestor_position === 'SMD'),
    'Test F: PM Mario Nader reaches Senior Managing Director (SMD)'
  );

  // ----------------------------------------------------
  // G. Azza Dual-Role Example Acceptance Rule
  // ----------------------------------------------------
  const azzaUsers = dataset.users.filter(u => u.name.toLowerCase().includes('azza karim'));
  assert(
    azzaUsers.length === 1 && azzaUsers[0].position_code === 'DM' && azzaUsers[0].username === 'DM1',
    'Test G.1: Azza Karim receives exactly 1 user account (DM1) with primary position DM'
  );

  const azzaAssignments = dataset.salesAssignments.filter(a => a.user_id === azzaUsers[0].id);
  assert(
    azzaAssignments.length === 1 &&
      azzaAssignments[0].assignment_type === 'PERSONAL_MR' &&
      azzaAssignments[0].title_raw === 'MR1' &&
      azzaAssignments[0].business_line === 1 &&
      azzaAssignments[0].territory_name === 'Masr El gedida',
    'Test G.2: Azza Karim has a PERSONAL_MR sales assignment for MR1 Line 1 in Masr El gedida'
  );

  // Azza DM sales aggregation test:
  // Awad Tmsah MR1 sales (100) + Azza Karim Personal MR1 sales (50) = 150
  const awadAssign = dataset.salesAssignments.find(a => a.user_id === awadUser.id)!;
  const salesMap = new Map<string, number>([
    [awadAssign.id, 100],
    [azzaAssignments[0].id, 50],
  ]);

  const aggregation = aggregateSalesForManager(
    azzaUsers[0].id,
    azzaAssignments as any,
    [awadAssign] as any,
    salesMap
  );

  assert(
    aggregation.totalSales === 150 &&
      aggregation.subordinateSales === 100 &&
      aggregation.personalSales === 50,
    'Test G.3: Azza Karim DM sales equals Awad Tmsah sales (100) + Azza personal sales (50) = 150'
  );

  // ----------------------------------------------------
  // H. No Duplicate User Accounts
  // ----------------------------------------------------
  const usernames = new Set<string>();
  let hasDuplicateUsernames = false;
  for (const u of dataset.users) {
    if (usernames.has(u.username)) {
      hasDuplicateUsernames = true;
      break;
    }
    usernames.add(u.username);
  }

  assert(
    !hasDuplicateUsernames && dataset.users.length === 63,
    'Test H: Strictly 63 unique employee user accounts with zero duplicate usernames'
  );

  // ----------------------------------------------------
  // I. Vacant Records Create Zero User Accounts
  // ----------------------------------------------------
  const vacantUsers = dataset.users.filter(u => u.name.toLowerCase().includes('vacant'));
  assert(
    vacantUsers.length === 0,
    'Test I: All 13 vacant territory rows create 0 user login accounts'
  );

  // ----------------------------------------------------
  // J. No Hierarchy Cycles (DAG Constraint)
  // ----------------------------------------------------
  const cycleCheck = validateHierarchyAcyclicity(
    dataset.relationships.map(r => ({
      subordinateUserId: r.subordinate_user_id,
      managerUserId: r.manager_user_id,
    }))
  );

  assert(
    cycleCheck.isValid,
    'Test J: Organization relationship graph is strictly acyclic (DAG validated)'
  );

  return { passed, failed, checks };
}

if (require.main === module) {
  console.log('🔍 Running STEP 15B Verification Suite...\n');
  const results = runVerification();
  results.checks.forEach(c => console.log(`  ${c}`));
  console.log(`\n📊 Summary: ${results.passed} Passed, ${results.failed} Failed\n`);
  if (results.failed > 0) {
    process.exit(1);
  }
}
