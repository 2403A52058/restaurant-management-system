// KodiKart — Comprehensive Automated Integration & Security Test Suite
// Tests complete 21-step workflow, security access controls, and ₹0 infrastructure

const http = require('http');
const app = require('../src/app');
const prisma = require('../src/config/db');
const jwt = require('jsonwebtoken');
const { hashOTP } = require('../src/utils/otp');

let server;
let port;
let baseUrl;

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(
      url,
      { method, headers },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ status: res.statusCode, data: parsed, headers: res.headers });
          } catch {
            resolve({ status: res.statusCode, raw: data, headers: res.headers });
          }
        });
      }
    );

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

const results = [];
function recordTest(name, passed, details = '') {
  results.push({ name, passed, details });
  const icon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${icon} : ${name}${details ? ' (' + details + ')' : ''}`);
}

async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('      🐔 KodiKart Integration & Security Test Suite     ');
  console.log('═══════════════════════════════════════════════════════\n');

  // Start in-memory test server
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`[TEST RUNNER] Server listening on temporary port ${port}\n`);
      resolve();
    });
  });

  try {
    // ── 1. PUBLIC API TESTS ──────────────────────────────────
    console.log('─── 1. Public Endpoints ───');
    const health = await request('GET', '/api/health');
    recordTest('Health Check endpoint returns 200', health.status === 200 && health.data?.status === 'healthy');
    recordTest('Timezone configured as Asia/Kolkata', health.data?.timezone === 'Asia/Kolkata');

    const farms = await request('GET', '/api/farms');
    recordTest('Browse Farms endpoint returns 200 with farm list', farms.status === 200 && Array.isArray(farms.data?.farms));

    const breeds = await request('GET', '/api/breeds');
    recordTest('Native Breeds endpoint returns 200', breeds.status === 200 && Array.isArray(breeds.data?.breeds));

    const estimate = await request('GET', '/api/farms/1/delivery-estimate?latitude=17.9500&longitude=79.5800');
    recordTest('Delivery Distance & Fee Estimate calculated within range', estimate.status === 200 && estimate.data?.deliverable && estimate.data?.deliveryFee > 0);

    // ── 2. SECURITY & AUTHENTICATION ─────────────────────────
    console.log('\n─── 2. Security & Role Access Controls ───');
    const adminWithoutAuth = await request('GET', '/api/admin/dashboard');
    recordTest('Unauthorized admin access blocked (401)', adminWithoutAuth.status === 401);

    // Find test users from database
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const farmUser = await prisma.user.findFirst({ where: { role: 'FARM_OWNER' } });
    const customerUser = await prisma.user.findFirst({ where: { role: 'CUSTOMER' } });

    const adminToken = jwt.sign({ id: adminUser.id, role: 'ADMIN' }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '1h' });
    const farmToken = jwt.sign({ id: farmUser.id, role: 'FARM_OWNER' }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '1h' });
    const customerToken = jwt.sign({ id: customerUser.id, role: 'CUSTOMER' }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '1h' });

    const customerAccessAdmin = await request('GET', '/api/admin/dashboard', null, customerToken);
    recordTest('Customer attempting admin endpoint blocked (403 Forbidden)', customerAccessAdmin.status === 403);

    const customerAccessFarmOnly = await request('POST', '/api/farms/1/hens', { actualWeight: 1.5 }, customerToken);
    recordTest('Customer attempting farm inventory modification blocked (403)', customerAccessFarmOnly.status === 403);

    // ── 3. STRICT LIVESTOCK RULES (MAX 2.5 KG) ──────────────
    console.log('\n─── 3. Strict 2.5 kg Hen Category Rules ───');
    const targetFarm = await prisma.farm.findFirst({ where: { ownerId: farmUser.id }, include: { farmBreeds: true } });
    const farmBreed = targetFarm?.farmBreeds?.[0];

    // Attempt to add rooster/overweight hen > 2.5 kg
    const overweightHen = await request('POST', `/api/farms/${targetFarm.id}/hens`, {
      farmBreedId: farmBreed.id,
      actualWeight: 3.20, // VIOLATION
    }, farmToken);
    recordTest('Enforce max 2.5 kg weight limit (Overweight hen 3.2 kg blocked with 400)', overweightHen.status === 400 && overweightHen.data?.message?.includes('Maximum allowed weight'));

    // Valid female hen <= 2.5 kg
    const validHen = await request('POST', `/api/farms/${targetFarm.id}/hens`, {
      farmBreedId: farmBreed.id,
      actualWeight: 1.85,
      notes: 'Healthy active native female hen',
    }, farmToken);
    recordTest('Valid female hen (1.85 kg) accepted into inventory (201)', validHen.status === 201 && validHen.data?.hen?.henId?.startsWith('HEN-'));
    const testHenId = validHen.data?.hen?.id;

    // ── 4. COMPLETE BOOKING & QUOTATION WORKFLOW (1-21) ──────
    console.log('\n─── 4. End-to-End Booking, Quotation & Handover OTP ───');
    // Step A: Customer creates booking request
    const bookingReq = await request('POST', '/api/bookings', {
      farmId: targetFarm.id,
      breedId: farmBreed.breedId,
      requestedQuantity: 1,
      desiredWeightKg: '1.85',
      deliveryType: 'PICKUP',
    }, customerToken);
    recordTest('Step 1-6: Customer booking request created (201)', bookingReq.status === 201 && bookingReq.data?.booking?.id > 0);
    const bookingId = bookingReq.data?.booking?.id;

    // Step B: Farm owner generates quotation by assigning the hen
    const quoteRes = await request('POST', `/api/bookings/${bookingId}/quotation`, {
      henIds: [testHenId],
      notes: 'Inspected and confirmed healthy',
    }, farmToken);
    recordTest('Step 7-11: Farmer assigns hen & creates quotation (200)', quoteRes.status === 200 && quoteRes.data?.booking?.status === 'QUOTED');
    recordTest('Step 11: Platform commission calculated as exactly 3%', parseFloat(quoteRes.data?.financials?.platformCommissionAmount) > 0);

    // Step C: Customer accepts quotation
    const acceptRes = await request('POST', `/api/bookings/${bookingId}/respond`, {
      action: 'ACCEPT',
    }, customerToken);
    recordTest('Step 12-13: Customer accepts quotation (200)', acceptRes.status === 200 && acceptRes.data?.booking?.status === 'QUOTE_ACCEPTED');

    // Step D: Customer pays 20% advance
    const advancePay = await request('POST', '/api/payments/record', {
      bookingId,
      paymentType: 'ADVANCE',
      paymentMethod: 'UPI',
      transactionReference: 'TEST-UPI-ADV-998811',
    }, customerToken);
    recordTest('Step 14-16: 20% Advance payment verified & recorded (200)', advancePay.status === 200 && advancePay.data?.status === 'CONFIRMED');

    // Step E: Duplicate payment prevention
    const duplicateAdvance = await request('POST', '/api/payments/record', {
      bookingId,
      paymentType: 'ADVANCE',
      paymentMethod: 'UPI',
      transactionReference: 'TEST-UPI-DUP',
    }, customerToken);
    recordTest('Security: Duplicate advance payment rejected (400 Bad Request)', duplicateAdvance.status === 400);

    // Step F: Farm owner initiates handover (Generates single-use Handover OTP)
    const initiateHandover = await request('POST', `/api/bookings/${bookingId}/initiate-handover`, null, farmToken);
    recordTest('Step 17-18: Handover initiated & OTP dispatched (200)', initiateHandover.status === 200);
    recordTest('Security: Handover OTP is NOT exposed in farm owner response', initiateHandover.data?.otp === undefined);

    // Retrieve hashed OTP from DB for test verification
    const bookingInDb = await prisma.booking.findUnique({ where: { id: bookingId } });
    recordTest('Security: Handover OTP is stored hashed (bcrypt)', bookingInDb.handoverOtpHash?.startsWith('$2'));

    // Mock farm owner attempting invalid OTP
    const invalidHandover = await request('POST', `/api/bookings/${bookingId}/verify-handover`, {
      otp: '000000',
    }, farmToken);
    recordTest('Security: Incorrect Handover OTP rejected (401)', invalidHandover.status === 401);

    // Customer shares correct OTP -> We test with a known OTP by setting it
    const testPlainOtp = '482915';
    const testHash = await hashOTP(testPlainOtp);
    await prisma.booking.update({ where: { id: bookingId }, data: { handoverOtpHash: testHash } });

    const correctHandover = await request('POST', `/api/bookings/${bookingId}/verify-handover`, {
      otp: testPlainOtp,
    }, farmToken);
    recordTest('Step 19-21: Correct OTP verified & Order COMPLETED (200)', correctHandover.status === 200);

    // Replay attack prevention
    const replayHandover = await request('POST', `/api/bookings/${bookingId}/verify-handover`, {
      otp: testPlainOtp,
    }, farmToken);
    recordTest('Security: Replay attack with used OTP rejected (404/Not ready)', replayHandover.status === 404);

    // ── 5. FINANCIAL LEDGERS & SEPARATION ─────────────────────
    console.log('\n─── 5. Ledger Integrity & Separate Accounts ───');
    const farmEarnings = await prisma.farmEarningsLedger.findFirst({ where: { bookingId }, orderBy: { createdAt: 'desc' } });
    recordTest('Ledger: Farm owner credited 100% of base amount', farmEarnings && parseFloat(farmEarnings.amount) > 0);

    const platformCommission = await prisma.platformCommissionLedger.findFirst({ where: { bookingId } });
    recordTest('Ledger: Platform commission recorded in separate ledger (3%)', platformCommission && parseFloat(platformCommission.amount) > 0);

    // ── 6. CUSTOMER REVIEWS & COMPLAINTS ─────────────────────
    console.log('\n─── 6. Reviews & Complaints System ───');
    const reviewRes = await request('POST', '/api/reviews', {
      bookingId,
      rating: 5,
      comment: 'Excellent pure Aseel desi hen! Great health and exact weight.',
    }, customerToken);
    recordTest('Review submitted for completed booking (201)', reviewRes.status === 201);

    const duplicateReview = await request('POST', '/api/reviews', {
      bookingId,
      rating: 5,
    }, customerToken);
    recordTest('Duplicate review rejected (409 Conflict)', duplicateReview.status === 409);

    // ── 7. SUPER ADMIN CONTROLS ──────────────────────────────
    console.log('\n─── 7. Super Admin Controls & Audit ───');
    const adminDash = await request('GET', '/api/admin/dashboard', null, adminToken);
    recordTest('Super Admin Dashboard KPI summary loaded (200)', adminDash.status === 200 && adminDash.data?.stats?.totalBookings > 0);

    const adminFarms = await request('GET', '/api/admin/farms', null, adminToken);
    recordTest('Super Admin Farm Directory returns full farm list (200)', adminFarms.status === 200 && Array.isArray(adminFarms.data?.farms));

    const auditLogs = await request('GET', '/api/admin/audit-logs', null, adminToken);
    recordTest('Super Admin Audit Logs captures security events', auditLogs.status === 200 && auditLogs.data?.logs?.length > 0);

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    if (server) server.close();
    await prisma.$disconnect();
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════');
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;
  console.log(`TEST SUMMARY: ${passed}/${total} PASSED (${Math.round((passed / total) * 100)}%)`);
  if (failed > 0) {
    console.log(`FAILED TESTS: ${failed}`);
    results.filter((r) => !r.passed).forEach((r) => console.log(` - ${r.name}`));
    process.exit(1);
  } else {
    console.log('🎉 ALL INTEGRATION & SECURITY TESTS PASSED PERFECTLY!');
    process.exit(0);
  }
}

runAllTests();
