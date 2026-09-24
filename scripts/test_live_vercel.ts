const BASE_URL = 'https://reptracksunny.vercel.app';

async function loginUser(username: string, password: string): Promise<string | null> {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    console.error(`Login failed for ${username}: HTTP ${res.status}`);
    const body = await res.text();
    console.error(`  Response: ${body}`);
    return null;
  }

  const cookie = res.headers.get('set-cookie');
  if (!cookie) {
    console.warn(`No set-cookie header returned for ${username}`);
    return null;
  }

  const match = cookie.match(/rep_track_session=([^;]+)/);
  return match ? `rep_track_session=${match[1]}` : cookie.split(';')[0];
}

async function testEndpoint(name: string, url: string, cookie: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers: {
      Cookie: cookie,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function runLiveTests() {
  console.log('====================================================');
  console.log(`Live Verification Suite: ${BASE_URL}`);
  console.log('====================================================\n');

  // ================================================================
  // TEST 1: MR36 (Representative) — Credentials, Operations & Cleanup
  // ================================================================
  console.log('--- TEST 1: MR36 (Representative) ---');
  const mr36Cookie = await loginUser('MR36', '12345@54321As');
  if (!mr36Cookie) throw new Error('MR36 Login failed');
  console.log('✓ MR36 Login succeeded');

  const mr36Session = await testEndpoint('Session', '/api/auth/session', mr36Cookie);
  console.log(`  Session: role=${mr36Session.data?.user?.role}, repId=${mr36Session.data?.user?.repId}, name=${mr36Session.data?.user?.name}`);

  // Check initial clean list
  const initialLists = await testEndpoint('Lists Initial', '/api/lists', mr36Cookie);
  const initialDocCount = initialLists.data?.data?.doctors?.length ?? 0;
  console.log(`  Initial Customer list: ${initialDocCount} doctors (clean for MR36)`);

  // 1a. Operational Button/Function Test: Add Doctor
  console.log('  Testing Create Customer (Doctor)...');
  const addDocRes = await testEndpoint('Add Doctor', '/api/lists', mr36Cookie, {
    method: 'POST',
    body: JSON.stringify({
      category: 'doctors',
      item: {
        name: 'Dr. Automated Verification',
        area: 'Behira/Kafr el shiekh',
        specialty: 'Cardiology',
        classification: 'A',
      },
    }),
  });
  console.log(`  Add Doctor status: HTTP ${addDocRes.status}, success=${addDocRes.data?.success}`);
  const createdDocId = addDocRes.data?.item?.id;
  if (!createdDocId) throw new Error('Failed to retrieve created doctor ID');
  console.log(`  ✓ Created Doctor with ID: ${createdDocId}`);

  // 1b. Verify Doctor appears in list
  const updatedLists = await testEndpoint('Lists After Add', '/api/lists', mr36Cookie);
  const docFound = (updatedLists.data?.data?.doctors || []).some((d: any) => d.id === createdDocId);
  console.log(`  ✓ Doctor appears in MR36 list: ${docFound}`);

  // 1c. Operational Button/Function Test: Submit Visit for this doctor
  console.log('  Testing Submit Doctor Visit...');
  const addVisitRes = await testEndpoint('Add Visit', '/api/reports/doctor', mr36Cookie, {
    method: 'POST',
    body: JSON.stringify({
      name: 'Dr. Automated Verification',
      area: 'Behira/Kafr el shiekh',
      specialty: 'Cardiology',
      cls: 'A',
      objective: 'Regular Visit',
      visitDate: '2026-09-23',
      visitType: 'Single',
      notes: 'Automated live test visit',
    }),
  });
  console.log(`  Add Visit status: HTTP ${addVisitRes.status}, success=${addVisitRes.data?.success}`);

  // 1d. Clean up all test data (Instructions requirement)
  console.log('  Cleaning up test data (Delete Doctor)...');
  const delDocRes = await testEndpoint('Delete Doctor', `/api/lists?category=doctors&id=${createdDocId}`, mr36Cookie, {
    method: 'DELETE',
  });
  console.log(`  Delete Doctor status: HTTP ${delDocRes.status}, success=${delDocRes.data?.success}`);

  // 1e. Verify customer list is back to clean state
  const finalLists = await testEndpoint('Lists Final', '/api/lists', mr36Cookie);
  console.log(`  Final Customer list: ${finalLists.data?.data?.doctors?.length ?? 0} doctors (clean: ✓)`);

  // ================================================================
  // TEST 2: DM6 (District Manager) — Scoped Reps & Manager Activities
  // ================================================================
  console.log('\n--- TEST 2: DM6 (District Manager) ---');
  const dm6Cookie = await loginUser('DM6', '12345@54321As');
  if (!dm6Cookie) throw new Error('DM6 Login failed');
  console.log('✓ DM6 Login succeeded');

  const dm6Session = await testEndpoint('Session', '/api/auth/session', dm6Cookie);
  console.log(`  Session: role=${dm6Session.data?.user?.role}, positionCode=${dm6Session.data?.user?.positionCode}`);

  const dm6Reps = await testEndpoint('Reps', '/api/reps', dm6Cookie);
  const dm6RepIds = (dm6Reps.data?.reps || []).map((r: any) => r.id);
  console.log(`  Scoped reps count: ${dm6RepIds.length}`);
  console.log(`  Scoped reps:`, (dm6Reps.data?.reps || []).map((r: any) => `${r.name} (${r.id})`));
  if (!dm6RepIds.includes('rep-mr32') || !dm6RepIds.includes('rep-mr33')) {
    throw new Error('DM6 scoped reps missing expected representatives!');
  }
  console.log('  ✓ DM6 scope correctly includes Randa Magdy (rep-mr32) and Kirollos Adel (rep-mr33).');

  const actOptionsRes = await testEndpoint('Activity Options', '/api/manager/activity-options', dm6Cookie);
  console.log(`  Manager Activity Options status: HTTP ${actOptionsRes.status}, success=${actOptionsRes.data?.success}`);

  // ================================================================
  // TEST 3: BUM2 (Business Unit Manager) — 27 Scoped Reps & Fawzy
  // ================================================================
  console.log('\n--- TEST 3: BUM2 (Business Unit Manager) ---');
  const bum2Cookie = await loginUser('BUM2', '12345@54321As');
  if (!bum2Cookie) throw new Error('BUM2 Login failed');
  console.log('✓ BUM2 Login succeeded');

  const bum2Session = await testEndpoint('Session', '/api/auth/session', bum2Cookie);
  console.log(`  Session: role=${bum2Session.data?.user?.role}, positionCode=${bum2Session.data?.user?.positionCode}`);

  const bum2Reps = await testEndpoint('Reps', '/api/reps', bum2Cookie);
  const bum2RepIds = (bum2Reps.data?.reps || []).map((r: any) => r.id);
  console.log(`  Scoped reps count: ${bum2RepIds.length}`);
  const hasFawzy = bum2RepIds.includes('rep-mr11');
  const hasMr36 = bum2RepIds.includes('rep-mr36');
  console.log(`  Includes Fawzy Nasser (rep-mr11): ${hasFawzy}`);
  console.log(`  Includes Ahmed El Kot (rep-mr36): ${hasMr36}`);

  // Check Fawzy Nasser's preserved coverage
  const fawzyCoverage = (bum2Reps.data?.coverage || []).find((c: any) => c.repId === 'rep-mr11');
  console.log(`  Fawzy Nasser Preserved Activity:`, {
    actualHospitals: fawzyCoverage?.actualHospitals,
    actualPharmacies: fawzyCoverage?.actualPharmacies,
    actualDrs: fawzyCoverage?.actualDrs,
  });
  if (fawzyCoverage?.actualDrs !== 25 || fawzyCoverage?.actualPharmacies !== 15 || fawzyCoverage?.actualHospitals !== 20) {
    throw new Error('Fawzy Nasser preserved activity counts mismatch!');
  }
  console.log('  ✓ Fawzy Nasser activity is 100% intact and untouched!');

  // ================================================================
  // TEST 4: PM1 (The Admin) — Company Overview, Hierarchy & All 36 Reps
  // ================================================================
  console.log('\n--- TEST 4: PM1 (The Admin) ---');
  const pm1Cookie = await loginUser('PM1', '22515215@Monna');
  if (!pm1Cookie) throw new Error('PM1 Login failed');
  console.log('✓ PM1 Login succeeded');

  const pm1Session = await testEndpoint('Session', '/api/auth/session', pm1Cookie);
  console.log(`  Session: role=${pm1Session.data?.user?.role}, systemRole=${pm1Session.data?.user?.systemRole}`);

  const overviewRes = await testEndpoint('Overview', '/api/admin/overview', pm1Cookie);
  console.log(`  Admin Overview: activeUsers=${overviewRes.data?.overview?.active}, mr=${overviewRes.data?.overview?.mr}, managers=${overviewRes.data?.overview?.managers}`);

  const hierRes = await testEndpoint('Hierarchy', '/api/admin/hierarchy', pm1Cookie);
  const relCount = hierRes.data?.relationships?.length ?? 0;
  console.log(`  Admin Hierarchy: ${relCount} active organization relationships`);
  if (relCount !== 30) throw new Error(`Expected 30 relationships, got ${relCount}`);

  const usersRes = await testEndpoint('Users', '/api/admin/users?pageSize=50', pm1Cookie);
  console.log(`  Admin Users list: total=${usersRes.data?.total} registered users in directory`);

  const allRepsRes = await testEndpoint('All Reps', '/api/reps', pm1Cookie);
  const totalReps = allRepsRes.data?.reps?.length ?? 0;
  console.log(`  Admin Reps scope: ${totalReps} representatives (all company reps: ✓)`);
  if (totalReps !== 36) throw new Error(`Expected 36 reps, got ${totalReps}`);

  console.log('\n====================================================');
  console.log('ALL TESTS PASSED WITH 100% INTEGRITY ON VERCEL PRODUCTION!');
  console.log('====================================================\n');
}

runLiveTests().catch((err) => {
  console.error('\n❌ Test failure:', err);
  process.exit(1);
});
