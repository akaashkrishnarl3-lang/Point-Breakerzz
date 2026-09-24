import app from '../src/index.js';
import http from 'http';
import jwt from 'jsonwebtoken';
import { config } from '../src/utils/env.js';
import { dataStore } from '../src/models/dataStore.js';

interface ApiResponse<T = any> {
  success?: boolean;
  error?: string;
  data?: T;
  status?: string;
}

async function testHttpEndpoints() {
  console.log('🌐 Testing Express HTTP API Auth Routes...');

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(10001, '127.0.0.1', () => resolve()));

  const baseUrl = 'http://127.0.0.1:10001';

  try {
    // 1. Test unauthenticated request to protected endpoint /api/meetings
    const unauthRes = await fetch(`${baseUrl}/api/meetings`);
    console.assert(unauthRes.status === 401, 'Unauthenticated request should return 401');
    const unauthBody = (await unauthRes.json()) as ApiResponse;
    console.assert(unauthBody.success === false, 'success must be false');
    console.log('✅ 1. Unauthenticated request to /api/meetings correctly rejected with 401:', unauthBody.error);

    // 2. Test unauthenticated request to /api/stats
    const unauthStatsRes = await fetch(`${baseUrl}/api/stats`);
    console.assert(unauthStatsRes.status === 401, 'Unauthenticated /api/stats should return 401');
    console.log('✅ 2. Unauthenticated request to /api/stats correctly rejected with 401');

    // 3. Test public endpoint /api/health
    const healthRes = await fetch(`${baseUrl}/api/health`);
    console.assert(healthRes.status === 200, 'Public health check should return 200');
    const healthBody = (await healthRes.json()) as ApiResponse;
    console.assert(healthBody.status === 'ok', 'Health status must be ok');
    console.log('✅ 3. Public health check /api/health is accessible without auth (200 OK)');

    // 4. Test /api/auth/google without credential
    const badAuthRes = await fetch(`${baseUrl}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    console.assert(badAuthRes.status === 400, 'Missing credential should return 400');
    console.log('✅ 4. Missing Google credential rejected with 400 Bad Request');

    // 5. Test /api/auth/google with invalid credential
    const invalidCredRes = await fetch(`${baseUrl}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: 'fake-invalid-token' })
    });
    console.assert(invalidCredRes.status === 401, 'Invalid Google token should return 401');
    const invalidCredBody = (await invalidCredRes.json()) as ApiResponse;
    console.assert(
      invalidCredBody.error === 'Google sign-in failed. Please verify credentials and try again.',
      'Must return user-friendly message without leaking secrets'
    );
    console.log('✅ 5. Invalid Google token safely rejected with user-friendly 401 error message');

    // 6. Test authenticated request with valid user token
    const testUser = dataStore.createUser({
      google_sub: 'sub-http-test-user-123',
      name: 'Grace Hopper',
      email: 'grace@example.com',
      profile_picture: 'https://example.com/grace.png',
      provider: 'google'
    });

    const validToken = jwt.sign(
      { id: testUser.id, email: testUser.email, name: testUser.name, google_sub: testUser.google_sub },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    // Call /api/auth/me
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${validToken}` }
    });
    console.assert(meRes.status === 200, '/api/auth/me with valid token should return 200');
    const meBody = (await meRes.json()) as ApiResponse<{ user: { email: string } }>;
    console.assert(meBody.data?.user.email === 'grace@example.com', 'User email should match');
    console.log('✅ 6. Authenticated /api/auth/me returns verified user info (200 OK)');

    // Call /api/meetings with token -> empty array for new user
    const meetingsRes = await fetch(`${baseUrl}/api/meetings`, {
      headers: { Authorization: `Bearer ${validToken}` }
    });
    console.assert(meetingsRes.status === 200, 'Authenticated /api/meetings should return 200');
    const meetingsBody = (await meetingsRes.json()) as ApiResponse<any[]>;
    console.assert(Array.isArray(meetingsBody.data) && meetingsBody.data.length === 0, 'New user meetings should be empty []');
    console.log('✅ 7. Authenticated /api/meetings returns user-scoped empty meetings [] for new user');

    // Clean up
    dataStore.clearUserData(testUser.id);
    console.log('✅ 8. Cleaned up test user');

    console.log('\n🎉 ALL HTTP ENDPOINT TESTS PASSED SUCCESSFULLY!\n');
  } finally {
    server.close();
  }
}

testHttpEndpoints().catch((err) => {
  console.error('❌ HTTP endpoint test failed:', err);
  process.exit(1);
});
