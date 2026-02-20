/**
 * Kodbank API integration tests
 * Run: npm run test
 * Requires: server running (npm run server) and DB configured
 */
const BASE = process.env.API_BASE || 'http://localhost:4000';

async function request(method, path, body = null) {
  const opts = { method, credentials: 'include' };
  if (body) {
    opts.headers = { 'Content-Type': 'application/json' };
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data };
}

async function runTests() {
  const uid = `test-${Date.now()}`;
  const uname = `user${Date.now()}`;
  const password = 'testpass123';
  const email = `${uid}@test.kodbank.local`;
  const phone = '9999999999';

  let passed = 0;
  let failed = 0;

  const assert = (name, ok, msg) => {
    if (ok) {
      passed++;
      console.log(`  ✓ ${name}`);
    } else {
      failed++;
      console.error(`  ✗ ${name}: ${msg}`);
    }
  };

  console.log('\n--- Kodbank API Tests ---\n');

  // Health
  const health = await request('GET', '/api/health');
  assert('GET /api/health', health.ok, health.data?.message || health.status);

  // Register
  const reg = await request('POST', '/api/register', {
    uid,
    uname,
    password,
    email,
    phone,
    role: 'customer'
  });
  assert('POST /api/register', reg.ok || reg.status === 201, reg.data?.message || reg.status);

  // Duplicate register should fail
  const regDup = await request('POST', '/api/register', { uid, uname, password, email, phone, role: 'customer' });
  assert('POST /api/register (duplicate)', !regDup.ok, 'expected 409');

  // Login
  const login = await request('POST', '/api/login', { uname, password });
  assert('POST /api/login', login.ok, login.data?.message || login.status);

  // Balance (with cookie)
  const bal = await request('GET', '/api/balance');
  assert('GET /api/balance', bal.ok, bal.data?.message || bal.status);
  if (bal.ok && bal.data?.balance !== undefined) {
    assert('balance equals 100000', bal.data.balance === 100000, `got ${bal.data.balance}`);
  }

  // Balance without token
  const balNoToken = await fetch(`${BASE}/api/balance`);
  assert('GET /api/balance (no cookie)', !balNoToken.ok, 'expected 401');

  console.log(`\n--- Results: ${passed} passed, ${failed} failed ---\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
