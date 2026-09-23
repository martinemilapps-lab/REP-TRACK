import { getLocalFallbackClient } from '../src/lib/db/localFallbackDb';
import { verifyPassword } from '../src/lib/services/passwordService';
import { getScopedRepresentativeIdsForManager } from '../src/lib/services/organizationService';

async function runEndToEndTests() {
  console.log('========================================================');
  console.log('🧪 RUNNING COMPREHENSIVE END-TO-END SYSTEM TESTS');
  console.log('========================================================\n');

  const client = await getLocalFallbackClient();

  // Test 1: Authentication & Credentials for all 4 Accounts
  console.log('--- 1. Testing Credentials & Login Authentications ---');
  const credentials = [
    { username: 'MR36', password: '12345@54321As', expectedRole: 'REPRESENTATIVE', expectedPos: 'MR', expectedSystemRole: 'USER' },
    { username: 'DM6', password: '12345@54321As', expectedRole: 'MANAGER', expectedPos: 'DM', expectedSystemRole: 'MANAGER' },
    { username: 'BUM2', password: '12345@54321As', expectedRole: 'MANAGER', expectedPos: 'BUM', expectedSystemRole: 'MANAGER' },
    { username: 'PM1', password: '22515215@Monna', expectedRole: 'MANAGER', expectedPos: 'PM', expectedSystemRole: 'ADMIN' },
  ];

  for (const cred of credentials) {
    const res = await client.execute({
      sql: `SELECT id, username, password_hash, name, role, rep_id, position_code, system_role, is_active, must_change_password FROM users WHERE username = ?`,
      args: [cred.username],
    });

    if (res.rows.length === 0) {
      throw new Error(`User ${cred.username} not found in database!`);
    }

    const u = res.rows[0];
    const passOk = verifyPassword(cred.password, String(u.password_hash));
    if (!passOk) {
      throw new Error(`Password verification failed for ${cred.username}!`);
    }

    if (u.role !== cred.expectedRole) {
      throw new Error(`Role mismatch for ${cred.username}: got ${u.role}, expected ${cred.expectedRole}`);
    }

    if (u.position_code !== cred.expectedPos) {
      throw new Error(`Position mismatch for ${cred.username}: got ${u.position_code}, expected ${cred.expectedPos}`);
    }

    if (u.system_role !== cred.expectedSystemRole) {
      throw new Error(`System role mismatch for ${cred.username}: got ${u.system_role}, expected ${cred.expectedSystemRole}`);
    }

    console.log(`  ✓ Account {${cred.username}}: "${u.name}" authenticated successfully.`);
    console.log(`    Role: ${u.role}, Position: ${u.position_code}, SystemRole: ${u.system_role}, MustChangePassword: ${u.must_change_password}`);
  }

  // Test 2: Hierarchy Linking System
  console.log('\n--- 2. Testing Hierarchy Linking & Transitive Scopes ---');

  // Verify DM6 scoped reps (must include MR36)
  const dm6Scopes = await client.execute(`SELECT rep_id FROM manager_rep_scopes WHERE manager_user_id = 'u-dm6'`);
  const dm6RepIds = dm6Scopes.rows.map(r => r.rep_id);
  console.log(`  ✓ DM6 (Ashraf Shawky) has ${dm6RepIds.length} scoped reps:`, dm6RepIds);
  if (!dm6RepIds.includes('rep-mr36')) {
    throw new Error('DM6 does not have MR36 in scoped representatives!');
  }
  console.log('  ✓ Verified: MR36 is properly scoped under DM6.');

  // Verify BUM2 scoped reps (must include both MR36 and MR11)
  const bum2Scopes = await client.execute(`SELECT rep_id FROM manager_rep_scopes WHERE manager_user_id = 'u-bum2'`);
  const bum2RepIds = bum2Scopes.rows.map(r => r.rep_id);
  console.log(`  ✓ BUM2 (Osama Bert) has ${bum2RepIds.length} scoped reps.`);
  if (!bum2RepIds.includes('rep-mr36')) {
    throw new Error('BUM2 does not have MR36 in scoped representatives!');
  }
  if (!bum2RepIds.includes('rep-mr11')) {
    throw new Error('BUM2 does not have MR11 (Fawzy Nasser) in scoped representatives!');
  }
  console.log('  ✓ Verified: Both MR36 and MR11 (Fawzy Nasser) are properly scoped under BUM2.');

  // Verify PM1 Admin Hierarchy Access
  console.log('\n--- 3. Testing Admin (PM1) Organization Overview ---');
  const orgCounts = await client.execute(`
    SELECT 
      (SELECT count(*) FROM users) as users_count,
      (SELECT count(*) FROM representatives) as reps_count,
      (SELECT count(*) FROM positions) as positions_count,
      (SELECT count(*) FROM areas) as areas_count,
      (SELECT count(*) FROM sales_assignments) as assignments_count,
      (SELECT count(*) FROM organization_relationships) as relationships_count,
      (SELECT count(*) FROM hierarchy_paths) as paths_count
  `);
  console.log('  Admin Organization Statistics:');
  console.table(orgCounts.rows[0]);

  if (Number(orgCounts.rows[0].users_count) !== 63) throw new Error('Expected 63 users');
  if (Number(orgCounts.rows[0].reps_count) !== 36) throw new Error('Expected 36 representatives');
  if (Number(orgCounts.rows[0].positions_count) !== 8) throw new Error('Expected 8 positions');
  if (Number(orgCounts.rows[0].assignments_count) !== 42) throw new Error('Expected 42 sales assignments');

  // Test 4: Verify MR36 Read & Write Operations (Buttons/Processes)
  console.log('\n--- 4. Testing MR36 Operational Functions (Create -> Verify -> Clean) ---');
  const testDocId = `test-doc-${Date.now()}`;
  const testVisitId = `test-visit-${Date.now()}`;

  // Insert a test doctor for MR36
  await client.execute({
    sql: `INSERT INTO doctors (id, name, area, specialty, classification, rep_id, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)`,
    args: [testDocId, 'Dr. Automated Verification', 'Behira/Kafr el shiekh', 'Cardio', 'A', 'rep-mr36'],
  });
  console.log('  ✓ Created test customer (Doctor) for MR36.');

  // Verify doctor exists for MR36
  const docVerify = await client.execute({
    sql: `SELECT id, name FROM doctors WHERE id = ? AND rep_id = 'rep-mr36'`,
    args: [testDocId],
  });
  if (docVerify.rows.length === 0) throw new Error('Failed to retrieve newly created doctor for MR36');
  console.log('  ✓ Verified test customer retrieved successfully.');

  // Insert a test visit for MR36
  await client.execute({
    sql: `INSERT INTO doctor_visits (id, rep_id, doctor_id, visit_date, visit_type) VALUES (?, ?, ?, ?, ?)`,
    args: [testVisitId, 'rep-mr36', testDocId, '2026-09-23', 'Single'],
  });
  console.log('  ✓ Submitted test visit for MR36.');

  // Verify visit exists
  const visitVerify = await client.execute({
    sql: `SELECT id FROM doctor_visits WHERE id = ? AND rep_id = 'rep-mr36'`,
    args: [testVisitId],
  });
  if (visitVerify.rows.length === 0) throw new Error('Failed to retrieve newly submitted visit for MR36');
  console.log('  ✓ Verified test visit retrieved successfully.');

  // Clean up test data immediately
  await client.execute({ sql: `DELETE FROM doctor_visits WHERE id = ?`, args: [testVisitId] });
  await client.execute({ sql: `DELETE FROM doctors WHERE id = ?`, args: [testDocId] });
  console.log('  ✓ Cleaned up all test data for MR36.');

  // Test 5: Verify Fawzy Nasser Data Integrity (Untouched & Intact)
  console.log('\n--- 5. Verifying Fawzy Nasser ({MR11}) Final Data Integrity ---');
  const fawzyChecks = [
    { name: 'Doctors', sql: `SELECT count(*) as count FROM doctors WHERE rep_id = 'rep-mr11'`, expected: 80 },
    { name: 'Pharmacies', sql: `SELECT count(*) as count FROM pharmacies WHERE rep_id = 'rep-mr11'`, expected: 19 },
    { name: 'Hospitals', sql: `SELECT count(*) as count FROM hospitals WHERE rep_id = 'rep-mr11'`, expected: 43 },
    { name: 'Branches', sql: `SELECT count(*) as count FROM distribution_branches WHERE rep_id = 'rep-mr11'`, expected: 3 },
    { name: 'Doctor Visits', sql: `SELECT count(*) as count FROM doctor_visits WHERE rep_id = 'rep-mr11'`, expected: 25 },
    { name: 'Pharmacy Visits', sql: `SELECT count(*) as count FROM pharmacy_visits WHERE rep_id = 'rep-mr11'`, expected: 15 },
    { name: 'Hospital Visits', sql: `SELECT count(*) as count FROM hospital_visits WHERE rep_id = 'rep-mr11'`, expected: 22 },
    { name: 'Weekly Plans', sql: `SELECT count(*) as count FROM weekly_plans WHERE rep_id = 'rep-mr11'`, expected: 3 },
    { name: 'Daily Reports', sql: `SELECT count(*) as count FROM daily_reports WHERE rep_id = 'rep-mr11'`, expected: 22 },
  ];

  for (const fc of fawzyChecks) {
    const res = await client.execute(fc.sql);
    const count = Number(res.rows[0].count);
    if (count !== fc.expected) {
      throw new Error(`Data corruption for Fawzy Nasser: ${fc.name} count is ${count}, expected ${fc.expected}`);
    }
    console.log(`  ✓ Fawzy Nasser ${fc.name}: ${count}/${fc.expected} (100% PRESERVED)`);
  }

  // Check that NO non-Fawzy visits exist
  const otherVisits = await client.execute(`SELECT count(*) as count FROM doctor_visits WHERE rep_id != 'rep-mr11'`);
  if (Number(otherVisits.rows[0].count) !== 0) throw new Error('Found non-Fawzy doctor visits!');
  console.log('  ✓ Confirmed: Zero non-Fawzy customer visits in the database.');

  console.log('\n========================================================');
  console.log('🎉 ALL END-TO-END TESTS PASSED WITH 100% SUCCESS!');
  console.log('========================================================\n');
}

runEndToEndTests().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
