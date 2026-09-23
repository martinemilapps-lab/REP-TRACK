const BASE_URL = 'https://reptracksunny.vercel.app';

interface CookieJar {
  cookieHeader: string;
}

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

  // Extract session token
  const match = cookie.match(/rep_track_session=([^;]+)/);
  return match ? `rep_track_session=${match[1]}` : cookie.split(';')[0];
}

async function testEndpoint(name: string, url: string, cookie: string) {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: { Cookie: cookie },
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function runLiveTests() {
  console.log('====================================================');
  console.log(`Testing Live Deployment at: ${BASE_URL}`);
  console.log('====================================================\n');

  // Test 1: MR36
  console.log('--- TEST 1: MR36 (Representative) ---');
  const mr36Cookie = await loginUser('MR36', '12345@54321As');
  if (mr36Cookie) {
    console.log('✓ MR36 Login succeeded');
    const sessionRes = await testEndpoint('Session', '/api/auth/session', mr36Cookie);
    console.log(`  Session: role=${sessionRes.data?.user?.role}, repId=${sessionRes.data?.user?.repId}, name=${sessionRes.data?.user?.name}`);

    const listsRes = await testEndpoint('Lists', '/api/lists', mr36Cookie);
    console.log(`  Customer lists: ${listsRes.data?.doctors?.length ?? 0} doctors, ${listsRes.data?.pharmacies?.length ?? 0} pharmacies (clean for MR36)`);

    const repsRes = await testEndpoint('Reps', '/api/reps', mr36Cookie);
    console.log(`  Reps endpoint: ${repsRes.data?.reps?.length ?? 0} reps returned`);
  } else {
    console.error('❌ MR36 Login failed');
  }

  // Test 2: DM6
  console.log('\n--- TEST 2: DM6 (District Manager) ---');
  const dm6Cookie = await loginUser('DM6', '12345@54321As');
  if (dm6Cookie) {
    console.log('✓ DM6 Login succeeded');
    const sessionRes = await testEndpoint('Session', '/api/auth/session', dm6Cookie);
    console.log(`  Session: role=${sessionRes.data?.user?.role}, positionCode=${sessionRes.data?.user?.positionCode}`);

    const repsRes = await testEndpoint('Reps', '/api/reps', dm6Cookie);
    console.log(`  Reps endpoint status: HTTP ${repsRes.status}, data:`, JSON.stringify(repsRes.data));
    const repIds = (repsRes.data?.reps || []).map((r: any) => r.id);
    console.log(`  Scoped reps count: ${repIds.length}`);
    console.log(`  Scoped rep IDs:`, repIds);
  } else {
    console.error('❌ DM6 Login failed');
  }

  // Test 3: BUM2
  console.log('\n--- TEST 3: BUM2 (Business Unit Manager) ---');
  const bum2Cookie = await loginUser('BUM2', '12345@54321As');
  if (bum2Cookie) {
    console.log('✓ BUM2 Login succeeded');
    const sessionRes = await testEndpoint('Session', '/api/auth/session', bum2Cookie);
    console.log(`  Session: role=${sessionRes.data?.user?.role}, positionCode=${sessionRes.data?.user?.positionCode}`);

    const repsRes = await testEndpoint('Reps', '/api/reps', bum2Cookie);
    console.log(`  Reps endpoint status: HTTP ${repsRes.status}, data:`, JSON.stringify(repsRes.data));
    const repIds = (repsRes.data?.reps || []).map((r: any) => r.id);
    console.log(`  Scoped reps count: ${repIds.length}`);
    if (repIds.includes('rep-mr11') && repIds.includes('rep-mr36')) {
      console.log('  ✓ Both Fawzy Nasser (MR11) and Ahmed El Kot (MR36) correctly visible in BUM2 scope!');
    } else {
      console.log('  Reps found:', repIds.slice(0, 10));
    }
  } else {
    console.error('❌ BUM2 Login failed');
  }

  // Test 4: PM1 (The Admin)
  console.log('\n--- TEST 4: PM1 (The Admin) ---');
  const pm1Cookie = await loginUser('PM1', '22515215@Monna');
  if (pm1Cookie) {
    console.log('✓ PM1 Login succeeded');
    const sessionRes = await testEndpoint('Session', '/api/auth/session', pm1Cookie);
    console.log(`  Session: role=${sessionRes.data?.user?.role}, systemRole=${sessionRes.data?.user?.systemRole}`);

    const overviewRes = await testEndpoint('Overview', '/api/admin/overview', pm1Cookie);
    console.log(`  Admin Overview: users=${overviewRes.data?.overview?.activeUsers}, reps=${overviewRes.data?.overview?.activeReps}`);

    const hierRes = await testEndpoint('Hierarchy', '/api/admin/hierarchy', pm1Cookie);
    console.log(`  Admin Hierarchy: ${hierRes.data?.relationships?.length ?? 0} relationships active`);

    const repsRes = await testEndpoint('Reps', '/api/reps', pm1Cookie);
    console.log(`  All Reps via /api/reps: ${repsRes.data?.reps?.length ?? 0} reps returned`);
  } else {
    console.error('❌ PM1 Login failed');
  }

  console.log('\n====================================================');
  console.log('LIVE VERIFICATION COMPLETE');
  console.log('====================================================\n');
}

runLiveTests().catch(console.error);
