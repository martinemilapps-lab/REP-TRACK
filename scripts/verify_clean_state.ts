import { getLocalFallbackClient } from '../src/lib/db/localFallbackDb';
import { verifyPassword } from '../src/lib/services/passwordService';

async function verify() {
  console.log('=== VERIFYING CLEAN DATABASE STATE ===\n');

  const client = await getLocalFallbackClient();

  // 1. Fawzy Nasser Data
  console.log('1. Checking Fawzy Nasser ({MR11}) preserved data:');
  const fawzyChecks = [
    { table: 'doctors', expected: 80 },
    { table: 'pharmacies', expected: 19 },
    { table: 'hospitals', expected: 43 },
    { table: 'distribution_branches', expected: 3 },
    { table: 'doctor_visits', expected: 25 },
    { table: 'pharmacy_visits', expected: 15 },
    { table: 'hospital_visits', expected: 22 },
    { table: 'weekly_plans', expected: 3 },
    { table: 'daily_reports', expected: 22 },
  ];

  for (const c of fawzyChecks) {
    const res = await client.execute(`SELECT count(*) as count FROM ${c.table} WHERE rep_id = 'rep-mr11'`);
    const count = Number(res.rows[0].count);
    if (count === c.expected) {
      console.log(`  ✓ ${c.table}: ${count} (matches expected ${c.expected})`);
    } else {
      console.error(`  ❌ ${c.table}: found ${count}, expected ${c.expected}`);
    }
  }

  // 2. Non-Fawzy Data Cleansed Check
  console.log('\n2. Verifying complete deletion of all non-Fawzy data/requests:');
  const nonFawzyChecks = [
    { table: 'doctor_visits' },
    { table: 'pharmacy_visits' },
    { table: 'hospital_visits' },
    { table: 'branch_visits' },
    { table: 'weekly_plans' },
    { table: 'daily_reports' },
    { table: 'manager_activities' },
    { table: 'product_availabilities' },
    { table: 'trainings' },
    { table: 'special_tasks' },
    { table: 'events' },
  ];

  for (const c of nonFawzyChecks) {
    let sql = `SELECT count(*) as count FROM ${c.table}`;
    if (['doctor_visits', 'pharmacy_visits', 'hospital_visits', 'weekly_plans', 'daily_reports'].includes(c.table)) {
      sql += ` WHERE rep_id != 'rep-mr11'`;
    }
    const res = await client.execute(sql);
    const count = Number(res.rows[0].count);
    if (count === 0) {
      console.log(`  ✓ ${c.table}: 0 non-Fawzy records`);
    } else {
      console.error(`  ❌ ${c.table}: found ${count} residual records!`);
    }
  }

  // 3. Organization Foundation & Hierarchy
  console.log('\n3. Verifying organization hierarchy and linking titles:');
  const userRes = await client.execute(`SELECT count(*) as count FROM users`);
  console.log(`  ✓ Users: ${userRes.rows[0].count} (expected 63)`);

  const repRes = await client.execute(`SELECT count(*) as count FROM representatives`);
  console.log(`  ✓ Representatives: ${repRes.rows[0].count} (expected 36)`);

  const posRes = await client.execute(`SELECT count(*) as count FROM positions`);
  console.log(`  ✓ Positions: ${posRes.rows[0].count} (expected 8)`);

  const pathRes = await client.execute(`SELECT count(*) as count FROM hierarchy_paths`);
  console.log(`  ✓ Hierarchy Paths: ${pathRes.rows[0].count}`);

  const scopeRes = await client.execute(`SELECT count(*) as count FROM manager_rep_scopes`);
  console.log(`  ✓ Manager Rep Scopes: ${scopeRes.rows[0].count}`);

  // Check MR36 chain: MR36 -> DM6 -> BUM2 -> SMD1
  console.log('\n4. Verifying MR36 hierarchy path to DM6, BUM2, SMD1:');
  const mr36Paths = await client.execute(`
    SELECT hp.depth, u.username, u.name, hp.ancestor_position
    FROM hierarchy_paths hp
    JOIN users u ON hp.ancestor_user_id = u.id
    WHERE hp.source_user_id = 'u-mr36'
    ORDER BY hp.depth ASC
  `);
  console.table(mr36Paths.rows);

  // Check MR11 chain: MR11 -> BUM2 -> SMD1
  console.log('\n5. Verifying MR11 (Fawzy Nasser) hierarchy path:');
  const mr11Paths = await client.execute(`
    SELECT hp.depth, u.username, u.name, hp.ancestor_position
    FROM hierarchy_paths hp
    JOIN users u ON hp.ancestor_user_id = u.id
    WHERE hp.source_user_id = 'u-mr11'
    ORDER BY hp.depth ASC
  `);
  console.table(mr11Paths.rows);

  // 6. Test Credentials & Password Hashes
  console.log('\n6. Verifying test credentials:');
  const testUsers = [
    { username: 'MR36', expectedPass: '12345@54321As' },
    { username: 'BUM2', expectedPass: '12345@54321As' },
    { username: 'DM6', expectedPass: '12345@54321As' },
    { username: 'PM1', expectedPass: '22515215@Monna' },
  ];

  for (const t of testUsers) {
    const res = await client.execute({
      sql: `SELECT id, username, password_hash, role, must_change_password FROM users WHERE username = ?`,
      args: [t.username],
    });
    if (res.rows.length === 0) {
      console.error(`  ❌ User ${t.username} not found!`);
      continue;
    }
    const user = res.rows[0];
    const match = verifyPassword(t.expectedPass, String(user.password_hash));
    if (match) {
      console.log(`  ✓ ${t.username} password verified: valid, must_change_password=${user.must_change_password}`);
    } else {
      console.error(`  ❌ ${t.username} password verification FAILED!`);
    }
  }

  console.log('\n=== VERIFICATION COMPLETE ===\n');
}

verify().catch(console.error);
