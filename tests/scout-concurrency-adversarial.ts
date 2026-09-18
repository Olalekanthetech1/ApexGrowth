import dotenv from 'dotenv';
dotenv.config();

// Ensure test mode sets USE_IN_MEMORY_DB or uses local PG safely
process.env.NODE_ENV = 'test';
process.env.USE_IN_MEMORY_DB = 'true'; // use memory fallback for clean isolation under automated test

import { dbService } from '../server/services/dbService.js';
import { emailOutreachDispatcher } from '../server/services/scout/emailOutreachDispatcher.js';
import { intelligenceEngine } from '../server/services/scout/intelligenceEngine.js';

async function runTests() {
  console.log('\n======================================================');
  console.log('APEXGROWTH SCOUT — CONCURRENCY & ADVERSARIAL TEST SUITE');
  console.log('======================================================\n');

  // Trigger setup
  await dbService.getOpportunities();

  await testSameSourceConcurrency();
  await testSameEntityConcurrency();
  await testSameOpportunityDispatchConcurrency();
  await testDbFailureFailClosed();
  await testDispatchCrashRecoveryIdempotency();

  console.log('\n======================================================');
  console.log('🎉 ALL ADVERSARIAL & CONCURRENCY TESTS PASSED PERFECTLY!');
  console.log('======================================================\n');
}

/**
 * 1. Test: Same Source x 2 workers
 * Concurrently ingesting duplicate signals must guarantee strict source deduplication.
 */
async function testSameSourceConcurrency() {
  const testId = `src_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  console.log(`▶️ [Test 1] Concurrently Ingesting Identical Source Signal x 2 (ID: ${testId})...`);

  const candidate = {
    title: 'Test Opportunity',
    prospectName: `Elon Founder ${testId}`,
    businessName: `Tesla Direct ${testId}`,
    websiteUrl: `https://tesla.com/${testId}`,
    niche: 'Electric Vehicles',
    sourcePlatform: 'reddit',
    sourceUrl: `https://reddit.com/r/tesla/${testId}`,
    sourcePostExcerpt: 'Struggling with "low conversion" on our accessory store site.',
    detectedPainPoints: ['low conversion'],
    publicFoundContacts: [{ type: 'email', value: `elon_${testId}@tesla.com`, confidence: 'HIGH' }],
    timestamp: new Date().toISOString(),
  };

  const oppFingerprint = intelligenceEngine.calculateOpportunityFingerprint(candidate.sourcePlatform, candidate.sourceUrl);
  const entFingerprint = intelligenceEngine.calculateEntityFingerprint(candidate.prospectName, candidate.businessName, candidate.websiteUrl);

  const opportunity = await intelligenceEngine.analyzeAndVerify(candidate as any);

  // Trigger 2 concurrent saves
  const promise1 = dbService.saveOpportunityAndSignalAtomically(opportunity, candidate as any, oppFingerprint, entFingerprint);
  const promise2 = dbService.saveOpportunityAndSignalAtomically(opportunity, candidate as any, oppFingerprint, entFingerprint);

  try {
    const [res1, res2] = await Promise.all([promise1, promise2]);
    console.log(`- Worker 1 merged: ${res1.merged}, Saved ID: ${res1.saved.id}`);
    console.log(`- Worker 2 merged: ${res2.merged}, Saved ID: ${res2.saved.id}`);
    if (res1.saved.id !== res2.saved.id) {
      throw new Error('FAILED: Concurrent saves produced different opportunity IDs for same signal!');
    }
    console.log('✅ Passed Same Source Concurrency (Deduplicated cleanly).');
  } catch (err: any) {
    if (err.message === 'DUPLICATE_SIGNAL') {
      console.log('✅ Passed Same Source Concurrency (Successfully threw DUPLICATE_SIGNAL exception).');
    } else {
      throw err;
    }
  }
}

/**
 * 2. Test: Same Entity x 2 workers
 * Concurrently ingesting different signals for the same entity (merchant) must resolve and merge.
 */
async function testSameEntityConcurrency() {
  const testId = `ent_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  console.log(`\n▶️ [Test 2] Concurrently Ingesting Different Signals for Same Entity (ID: ${testId})...`);

  const candidate1 = {
    title: 'Test Entity Signal 1',
    prospectName: `Steve Cook ${testId}`,
    businessName: `Apple Store ${testId}`,
    websiteUrl: `https://apple.com/${testId}`,
    niche: 'Electronics',
    sourcePlatform: 'reddit',
    sourceUrl: `https://reddit.com/r/apple/${testId}/sig1`,
    sourcePostExcerpt: 'Need to "improve conversion" on custom straps.',
    detectedPainPoints: ['improve conversion'],
    publicFoundContacts: [{ type: 'email', value: `steve_${testId}@apple.com`, confidence: 'HIGH' }],
    timestamp: new Date().toISOString(),
  };

  const candidate2 = {
    title: 'Test Entity Signal 2',
    prospectName: `Steve Cook ${testId}`,
    businessName: `Apple Store ${testId}`,
    websiteUrl: `https://apple.com/${testId}`,
    niche: 'Electronics',
    sourcePlatform: 'twitter',
    sourceUrl: `https://twitter.com/steve/${testId}/sig2`,
    sourcePostExcerpt: 'Struggling with "low conversion" on our custom strap product page.',
    detectedPainPoints: ['low conversion'],
    publicFoundContacts: [{ type: 'email', value: `steve_${testId}@apple.com`, confidence: 'HIGH' }],
    timestamp: new Date().toISOString(),
  };

  const entFingerprint = intelligenceEngine.calculateEntityFingerprint(`Steve Cook ${testId}`, `Apple Store ${testId}`, `https://apple.com/${testId}`);
  const oppFingerprint1 = intelligenceEngine.calculateOpportunityFingerprint(candidate1.sourcePlatform, candidate1.sourceUrl);
  const oppFingerprint2 = intelligenceEngine.calculateOpportunityFingerprint(candidate2.sourcePlatform, candidate2.sourceUrl);

  const opp1 = await intelligenceEngine.analyzeAndVerify(candidate1 as any);
  const opp2 = await intelligenceEngine.analyzeAndVerify(candidate2 as any);

  // Run saves concurrently
  const [res1, res2] = await Promise.all([
    dbService.saveOpportunityAndSignalAtomically(opp1, candidate1 as any, oppFingerprint1, entFingerprint),
    dbService.saveOpportunityAndSignalAtomically(opp2, candidate2 as any, oppFingerprint2, entFingerprint),
  ]);

  console.log(`- Saved 1 Opportunity ID: ${res1.saved.id}, Merged: ${res1.merged}`);
  console.log(`- Saved 2 Opportunity ID: ${res2.saved.id}, Merged: ${res2.merged}`);

  if (res1.saved.id !== res2.saved.id) {
    throw new Error(`FAILED: Different opportunities created for the same merchant entity! ID1: ${res1.saved.id}, ID2: ${res2.saved.id}`);
  }

  console.log('✅ Passed Same Entity Concurrency (Merged into same record successfully).');
}

/**
 * 3. Test: Same Opportunity x 2 dispatch requests
 * Concurrently claiming an approved opportunity for dispatching must prevent double-sending.
 */
async function testSameOpportunityDispatchConcurrency() {
  const testId = `disp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  console.log(`\n▶️ [Test 3] Concurrently Triggering Dispatch on Same Approved Opportunity (ID: ${testId})...`);

  const candidate = {
    title: 'Test Dispatch Co',
    prospectName: `Bill Gates ${testId}`,
    businessName: `Microsoft Store ${testId}`,
    websiteUrl: `https://microsoft.com/${testId}`,
    niche: 'Software',
    sourcePlatform: 'reddit',
    sourceUrl: `https://reddit.com/r/ms/${testId}/disp`,
    sourcePostExcerpt: 'Experiencing severe "dropoff" at checkout.',
    detectedPainPoints: ['dropoff'],
    publicFoundContacts: [{ type: 'email', value: `bill_${testId}@microsoft.com`, confidence: 'HIGH' }],
    timestamp: new Date().toISOString(),
  };

  const entFingerprint = intelligenceEngine.calculateEntityFingerprint(candidate.prospectName, candidate.businessName, candidate.websiteUrl);
  const oppFingerprint = intelligenceEngine.calculateOpportunityFingerprint(candidate.sourcePlatform, candidate.sourceUrl);

  const opp = await intelligenceEngine.analyzeAndVerify(candidate as any);
  
  // Bypassing verification metrics & mock draft to test state-machine & locking
  opp.isVerifiedOpportunity = true;
  opp.outreachDraft = 'Mock outreach draft for state-machine and lock checking';
  opp.verificationStatus = {
    identityResolved: true,
    companyVerified: true,
    contactAvailable: true,
    problemExplicit: true,
    auditPerformed: true,
    isDeduplicated: true,
  };

  const saveRes = await dbService.saveOpportunityAndSignalAtomically(opp, candidate as any, oppFingerprint, entFingerprint);

  // Mark as approved first
  await dbService.markOpportunityApproved(saveRes.saved.id);

  // Set provider config to mock SMTP (or Resend) to allow instant success returning from provider
  const backupGetProvider = (emailOutreachDispatcher as any).getProviderConfig;
  (emailOutreachDispatcher as any).getProviderConfig = async () => ({
    activeProvider: 'resend',
    resend: { configured: true, apiKey: 're_test123', fromEmail: 'scout@apexgrowth.co' },
    gmail: { configured: false },
  });

  // Inject fetch mock to allow fetch success
  const backupFetch = global.fetch;
  global.fetch = (async (url: string, options: any) => {
    return {
      ok: true,
      json: async () => ({ id: 're_sent_success_mock' }),
    } as any;
  }) as any;

  try {
    // Try concurrent dispatching, catching expected concurrency lock failures cleanly
    const p1 = emailOutreachDispatcher.dispatchOutreach(saveRes.saved.id).catch((err) => ({ success: false, error: err.message }));
    const p2 = emailOutreachDispatcher.dispatchOutreach(saveRes.saved.id).catch((err) => ({ success: false, error: err.message }));

    const [d1, d2] = await Promise.all([p1, p2]);

    console.log(`- Dispatch 1 result: success=${d1.success}, error="${d1.error || ''}"`);
    console.log(`- Dispatch 2 result: success=${d2.success}, error="${d2.error || ''}"`);

    const hasOneSuccess = d1.success || d2.success;
    const hasOneConflict = (d1.error && d1.error.includes('CONCURRENCY CONFLICT')) || 
                           (d2.error && d2.error.includes('CONCURRENCY CONFLICT'));

    if (!hasOneSuccess || !hasOneConflict) {
      throw new Error('FAILED: Double dispatch allowed or exclusive lock not verified!');
    }

    console.log('✅ Passed Same Opportunity Dispatch Concurrency (Exclusively locked).');
  } finally {
    global.fetch = backupFetch;
    (emailOutreachDispatcher as any).getProviderConfig = backupGetProvider;
  }
}

/**
 * 4. Test: Setup failure must fail-closed
 */
async function testDbFailureFailClosed() {
  console.log('\n▶️ [Test 4] Verifying Migration Failure Fails Closed (Throws in Production)...');

  // Temporarily backup and reset NODE_ENV and USE_IN_MEMORY_DB to enforce strict fail-closed code paths
  const backupEnv = process.env.NODE_ENV;
  const backupDbMode = process.env.USE_IN_MEMORY_DB;
  
  process.env.NODE_ENV = 'production';
  process.env.USE_IN_MEMORY_DB = 'false';

  // Force recalculation inside service
  (dbService as any).scoutTablesChecked = false;

  try {
    // Inject a fake failing tables setup or mock error
    const backupFn = dbService.ensureScoutTablesExist;
    dbService.ensureScoutTablesExist = async () => {
      throw new Error('Simulated migration socket error');
    };

    try {
      await dbService.getOpportunityById('any_id');
      throw new Error('FAILED: getOpportunityById did not throw on setup failure!');
    } catch (e: any) {
      const errMsg = e?.message || '';
      if (errMsg.includes('CRITICAL DB SETUP FAILURE') || errMsg.includes('Simulated migration socket error')) {
        console.log(`- Correctly caught error: "${errMsg}"`);
        console.log('✅ Passed Migration Fail-Closed Isolation.');
      } else {
        throw e;
      }
    } finally {
      dbService.ensureScoutTablesExist = backupFn;
      (dbService as any).scoutTablesChecked = true; // reset
    }
  } finally {
    process.env.NODE_ENV = backupEnv;
    process.env.USE_IN_MEMORY_DB = backupDbMode;
  }
}

/**
 * 5. Test: Crash-safe provider idempotency and recovery
 */
async function testDispatchCrashRecoveryIdempotency() {
  const testId = `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  console.log(`\n▶️ [Test 5] Verifying Safe Idempotent Recovery from Ambiguous DISPATCHING state (ID: ${testId})...`);

  const candidate = {
    title: 'Idempotency Recovery Co',
    prospectName: `Reed Hastings ${testId}`,
    businessName: `Netflix Direct ${testId}`,
    websiteUrl: `https://netflix.com/${testId}`,
    niche: 'Streaming',
    sourcePlatform: 'reddit',
    sourceUrl: `https://reddit.com/r/netflix/${testId}/idemp`,
    sourcePostExcerpt: 'Struggling to "improve conversion" rates.',
    detectedPainPoints: ['improve conversion'],
    publicFoundContacts: [{ type: 'email', value: `reed_${testId}@netflix.com`, confidence: 'HIGH' }],
    timestamp: new Date().toISOString(),
  };

  const entFingerprint = intelligenceEngine.calculateEntityFingerprint(candidate.prospectName, candidate.businessName, candidate.websiteUrl);
  const oppFingerprint = intelligenceEngine.calculateOpportunityFingerprint(candidate.sourcePlatform, candidate.sourceUrl);

  const opp = await intelligenceEngine.analyzeAndVerify(candidate as any);
  
  // Bypassing verification metrics & mock draft to test state-machine & locking
  opp.isVerifiedOpportunity = true;
  opp.outreachDraft = 'Mock outreach draft for state-machine and lock checking';
  opp.verificationStatus = {
    identityResolved: true,
    companyVerified: true,
    contactAvailable: true,
    problemExplicit: true,
    auditPerformed: true,
    isDeduplicated: true,
  };

  const saveRes = await dbService.saveOpportunityAndSignalAtomically(opp, candidate as any, oppFingerprint, entFingerprint);

  // Mark opportunity as APPROVED first, so that we can transition to dispatching
  await dbService.markOpportunityApproved(saveRes.saved.id);

  // Simulate crashed dispatch: Set status to DISPATCHING with stale timestamp
  const staleAttemptId = `disp_stale_${testId}`;
  const staleTime = new Date(Date.now() - 40000).toISOString(); // 40 seconds ago (expired lock)

  await dbService.setOpportunityStaleForTest(saveRes.saved.id, staleAttemptId, staleTime, `reed_${testId}@netflix.com`);

  // Set provider config to Resend (supports recovery retry)
  const backupGetProvider = (emailOutreachDispatcher as any).getProviderConfig;
  (emailOutreachDispatcher as any).getProviderConfig = async () => ({
    activeProvider: 'resend',
    resend: { configured: true, apiKey: 're_test123', fromEmail: 'scout@apexgrowth.co' },
    gmail: { configured: false },
  });

  // Inject a mock fetch to intercept resend HTTP request
  const backupFetch = global.fetch;
  let resendHeaders: Record<string, string> = {};
  global.fetch = (async (url: string, options: any) => {
    if (url.includes('api.resend.com/emails')) {
      resendHeaders = options.headers || {};
      return {
        ok: true,
        json: async () => ({ id: 're_sent_9999' }),
      } as any;
    }
    return { ok: false } as any;
  }) as any;

  try {
    const recoveryRes = await emailOutreachDispatcher.dispatchOutreach(saveRes.saved.id);
    console.log(`- Idempotent recovery success: ${recoveryRes.success}, messageId: ${recoveryRes.messageId || ''}`);
    console.log(`- Intercepted X-Idempotency-Key: "${resendHeaders['X-Idempotency-Key'] || ''}"`);

    if (!recoveryRes.success) {
      throw new Error('FAILED: Recovery retry failed to dispatch!');
    }
    if (resendHeaders['X-Idempotency-Key'] !== staleAttemptId) {
      throw new Error(`FAILED: Resend call did not use original idempotency key! Got: ${resendHeaders['X-Idempotency-Key']}`);
    }

    console.log('✅ Passed Resend Safe Idempotency Recovery.');
  } finally {
    global.fetch = backupFetch;
    (emailOutreachDispatcher as any).getProviderConfig = backupGetProvider;
  }
}

runTests().catch((err) => {
  console.error('\n❌ TEST RUNNER FAILED WITH ERROR:', err);
  process.exit(1);
});
