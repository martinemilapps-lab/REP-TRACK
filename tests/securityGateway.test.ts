import worker, { Env } from '../cloudflare/rep-track-d1-api/src/index';

export async function runSecurityGatewayTests() {
  console.log('\n🔒 Running Data Gateway Security & Fail-Closed Tests...');
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

  const TEST_SECRET = 'secure-rand-test-key-abc123xyz987456';
  const WRONG_SECRET = 'incorrect-attacker-guess-secret';

  // Mock D1 database for worker testing
  const mockD1: any = {
    prepare: (sql: string) => ({
      bind: (...params: any[]) => ({
        all: async () => ({ results: [{ test: 1 }], meta: {} }),
        raw: async () => [[1]],
        run: async () => ({ success: true, meta: {} }),
      }),
      all: async () => ({ results: [{ test: 1 }], meta: {} }),
      raw: async () => [[1]],
      run: async () => ({ success: true, meta: {} }),
    }),
    batch: async () => [{ results: [{ test: 1 }] }],
  };

  try {
    // ----------------------------------------------------
    // 1. /health endpoint works without any secret
    // ----------------------------------------------------
    const healthReq = new Request('https://worker.local/health', { method: 'GET' });
    const healthEnv: Env = {
      DB: mockD1,
      REP_TRACK_INTERNAL_API_SECRET: TEST_SECRET,
    };
    const healthRes = await worker.fetch(healthReq, healthEnv);
    assert(healthRes.status === 200, '/health returns HTTP 200 without Authorization header');

    const healthBody = (await healthRes.json()) as any;
    assert(healthBody.service === 'running', '/health confirms service is running');
    assert(healthBody.d1_binding === 'available', '/health confirms D1 binding is available');
    assert(JSON.stringify(healthBody).indexOf(TEST_SECRET) === -1, 'Secret never appears in /health response');

    // ----------------------------------------------------
    // 2. Worker Fails Closed: No secret configured in Worker environment
    // ----------------------------------------------------
    const unconfiguredEnv: Env = {
      DB: mockD1,
      // REP_TRACK_INTERNAL_API_SECRET is undefined
    };
    const reqWithToken = new Request('https://worker.local/api/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TEST_SECRET}`,
      },
      body: JSON.stringify({ sql: 'SELECT 1' }),
    });

    const unconfiguredRes = await worker.fetch(reqWithToken, unconfiguredEnv);
    assert(
      unconfiguredRes.status === 401,
      'Worker rejects requests when REP_TRACK_INTERNAL_API_SECRET is missing (Fail Closed)'
    );

    // Empty string secret in environment also fails closed
    const emptySecretEnv: Env = {
      DB: mockD1,
      REP_TRACK_INTERNAL_API_SECRET: '   ',
    };
    const emptySecretRes = await worker.fetch(reqWithToken, emptySecretEnv);
    assert(
      emptySecretRes.status === 401,
      'Worker rejects requests when REP_TRACK_INTERNAL_API_SECRET is blank string'
    );

    // ----------------------------------------------------
    // 3. Worker Rejects Missing or Malformed Authorization Header
    // ----------------------------------------------------
    const configuredEnv: Env = {
      DB: mockD1,
      REP_TRACK_INTERNAL_API_SECRET: TEST_SECRET,
    };

    const noAuthReq = new Request('https://worker.local/api/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql: 'SELECT 1' }),
    });
    const noAuthRes = await worker.fetch(noAuthReq, configuredEnv);
    assert(noAuthRes.status === 401, 'Worker returns 401 when Authorization header is absent');

    const malformedAuthReq = new Request('https://worker.local/api/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${TEST_SECRET}`, // Not Bearer
      },
      body: JSON.stringify({ sql: 'SELECT 1' }),
    });
    const malformedAuthRes = await worker.fetch(malformedAuthReq, configuredEnv);
    assert(malformedAuthRes.status === 401, 'Worker returns 401 when Authorization format is not Bearer');

    // ----------------------------------------------------
    // 4. Worker Rejects Wrong Secret (401)
    // ----------------------------------------------------
    const wrongAuthReq = new Request('https://worker.local/api/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${WRONG_SECRET}`,
      },
      body: JSON.stringify({ sql: 'SELECT 1' }),
    });
    const wrongAuthRes = await worker.fetch(wrongAuthReq, configuredEnv);
    assert(wrongAuthRes.status === 401, 'Worker returns 401 when token does not match secret');

    const wrongBody = (await wrongAuthRes.json()) as any;
    assert(wrongBody.success === false, 'Error response specifies success: false');
    assert(
      JSON.stringify(wrongBody).indexOf(TEST_SECRET) === -1,
      'Secret never appears in 401 error response body'
    );

    // ----------------------------------------------------
    // 5. Worker Accepts Correct Secret (Success)
    // ----------------------------------------------------
    const correctAuthReq = new Request('https://worker.local/api/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TEST_SECRET}`,
      },
      body: JSON.stringify({ sql: 'SELECT 1' }),
    });
    const correctAuthRes = await worker.fetch(correctAuthReq, configuredEnv);
    assert(correctAuthRes.status === 200, 'Worker returns 200 when correct Bearer secret is provided');

    const correctBody = (await correctAuthRes.json()) as any;
    assert(correctBody.success === true, 'Successful response specifies success: true');
    assert(
      JSON.stringify(correctBody).indexOf(TEST_SECRET) === -1,
      'Secret never appears in successful query response body'
    );

    // ----------------------------------------------------
    // 6. Next.js dataGatewayClient Fails Closed without Secret
    // ----------------------------------------------------
    const originalSecret = process.env.REP_TRACK_DATA_API_SECRET;
    delete process.env.REP_TRACK_DATA_API_SECRET;

    // Dynamically import dataGatewayClient to verify fail-closed
    const { dataGatewayClient } = await import('../src/lib/dataGatewayClient');

    let clientThrew = false;
    try {
      await dataGatewayClient.query('SELECT 1');
    } catch (err: any) {
      clientThrew = true;
      assert(
        err.message.includes('REP_TRACK_DATA_API_SECRET is required'),
        'dataGatewayClient throws configuration error when REP_TRACK_DATA_API_SECRET is missing'
      );
      assert(
        !err.message.includes(TEST_SECRET),
        'Configuration error message does not expose any secret values'
      );
    }
    assert(clientThrew, 'dataGatewayClient rejects query when secret is missing');

    // Restore original secret
    if (originalSecret) {
      process.env.REP_TRACK_DATA_API_SECRET = originalSecret;
    }

    // ----------------------------------------------------
    // 7. CORS Protection: Protected Routes Disallow Cross-Origin Preflight
    // ----------------------------------------------------
    const optionsProtectedReq = new Request('https://worker.local/api/query', {
      method: 'OPTIONS',
      headers: { Origin: 'https://malicious-site.com' },
    });
    const optionsProtectedRes = await worker.fetch(optionsProtectedReq, configuredEnv);
    assert(
      optionsProtectedRes.status === 403,
      'CORS preflight on protected server-to-server endpoints is forbidden (403)'
    );

    const optionsHealthReq = new Request('https://worker.local/health', {
      method: 'OPTIONS',
      headers: { Origin: 'https://any-site.com' },
    });
    const optionsHealthRes = await worker.fetch(optionsHealthReq, configuredEnv);
    assert(
      optionsHealthRes.status === 204,
      'CORS preflight on public /health endpoint is allowed (204)'
    );
  } catch (e) {
    console.error('Unexpected error in security tests:', e);
    failed++;
  }

  console.log(`  📊 Security Test Summary: ${passed} Passed, ${failed} Failed\n`);
  return { passed, failed };
}
