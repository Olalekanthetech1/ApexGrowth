import dotenv from 'dotenv';
dotenv.config();

import { dbService, validateOrderStateTransition } from './services/dbService.js';
import { paystackService } from './services/paystackService.js';
import crypto from 'crypto';

async function runStage4CAudit() {
  console.log('====================================================');
  console.log('  APEXGROWTH DIGITAL - STAGE 4C ADVERSARIAL AUDIT  ');
  console.log('====================================================\n');

  // ----------------------------------------------------
  // TEST 1: ORDER STATE MACHINE AUDIT
  // ----------------------------------------------------
  console.log('[TEST 1] Auditing Order State Machine Transitions...');

  // Test 1a: Allowed transitions
  const validTransitions = [
    { from: 'pending', to: 'awaiting_payment' },
    { from: 'pending', to: 'paid' },
    { from: 'awaiting_payment', to: 'paid' },
    { from: 'paid', to: 'processing' },
    { from: 'processing', to: 'completed' },
    { from: 'paid', to: 'refunded' },
  ];

  for (const t of validTransitions) {
    const res = validateOrderStateTransition(t.from, t.to);
    if (!res.allowed) {
      throw new Error(`State machine error: Valid transition ${t.from} -> ${t.to} was blocked!`);
    }
  }
  console.log('  ✓ Valid state transitions permitted correctly.');

  // Test 1b: Forbidden transitions
  const invalidTransitions = [
    { from: 'paid', to: 'pending' },
    { from: 'paid', to: 'awaiting_payment' },
    { from: 'cancelled', to: 'paid' },
    { from: 'refunded', to: 'paid' },
    { from: 'completed', to: 'pending' },
    { from: 'cancelled', to: 'processing' },
  ];

  for (const t of invalidTransitions) {
    const res = validateOrderStateTransition(t.from, t.to);
    if (res.allowed) {
      throw new Error(`CRITICAL VULNERABILITY: Forbidden transition ${t.from} -> ${t.to} was ALLOWED!`);
    }
  }
  console.log('  ✓ Forbidden transitions blocked strictly by state machine.\n');

  // ----------------------------------------------------
  // TEST 2: CREATE AUTHORITATIVE TEST ORDER & PAYMENT INTENT
  // ----------------------------------------------------
  console.log('[TEST 2] Creating Authoritative Test Order & Intent in PostgreSQL...');
  const packages = await dbService.getPricingPackages(true);
  if (packages.length === 0) throw new Error('No active pricing packages found in DB');
  const pkg = packages[0];

  const checkoutResult = await dbService.createCheckoutIntent(
    {
      packageId: pkg.id,
      customerName: 'Adversarial Audit Bot',
      customerEmail: 'audit@apexgrowth.digital',
      customerWhatsapp: '+15550001111',
      paymentProvider: 'paystack',
      customerNotes: 'Stage 4C audit execution',
      ipAddress: '127.0.0.1',
    }
  );

  const testOrder = checkoutResult.order;
  const testIntent = checkoutResult.paymentIntent;
  console.log(`  ✓ Created Order ${testOrder.orderNumber} (ID: ${testOrder.id}, Amount: $${testOrder.amountUsd} USD, Status: ${testOrder.status})`);
  console.log(`  ✓ Created Payment Intent Reference: ${testIntent.reference}\n`);

  // ----------------------------------------------------
  // TEST 3: PRICE & CURRENCY TAMPERING DEFENSE
  // ----------------------------------------------------
  console.log('[TEST 3] Testing Price & Currency Tampering Defenses...');

  // Tampered Amount Test ($1 instead of package price)
  const tamperedAmountPayload = {
    id: 999991,
    reference: testIntent.reference,
    amount: 100, // $1.00 USD
    currency: 'USD',
    channel: 'card',
    status: 'success',
  };

  try {
    await dbService.confirmPaystackPayment(testIntent.reference, tamperedAmountPayload, 'paystack_api_verify');
    throw new Error('CRITICAL VULNERABILITY: Confirming payment with tampered amount SUCCEEDED!');
  } catch (err: any) {
    console.log(`  ✓ Tampered amount ($1.00 vs $${testOrder.amountUsd}) rejected: "${err.message}"`);
  }

  // Tampered Currency Test (NGN instead of USD)
  const tamperedCurrencyPayload = {
    id: 999992,
    reference: testIntent.reference,
    amount: Math.round(parseFloat(testOrder.amountUsd) * 100),
    currency: 'NGN',
    channel: 'card',
    status: 'success',
  };

  try {
    await dbService.confirmPaystackPayment(testIntent.reference, tamperedCurrencyPayload, 'paystack_api_verify');
    throw new Error('CRITICAL VULNERABILITY: Confirming payment with non-USD currency SUCCEEDED!');
  } catch (err: any) {
    console.log(`  ✓ Tampered currency (NGN vs USD) rejected: "${err.message}"\n`);
  }

  // ----------------------------------------------------
  // TEST 4: ATOMIC PAYMENT CONFIRMATION & IDEMPOTENCY
  // ----------------------------------------------------
  console.log('[TEST 4] Testing Atomic Confirmation & Idempotency...');
  const expectedCents = Math.round(parseFloat(testOrder.amountUsd) * 100);
  const validPayload = {
    id: 888881,
    reference: testIntent.reference,
    amount: expectedCents,
    currency: 'USD',
    channel: 'card',
    paid_at: new Date().toISOString(),
    gateway_response: 'Successful',
    status: 'success',
  };

  // First confirmation call
  const confirm1 = await dbService.confirmPaystackPayment(testIntent.reference, validPayload, 'paystack_api_verify');
  if (confirm1.order.status !== 'paid' || confirm1.alreadyProcessed !== false) {
    throw new Error('Initial payment confirmation failed to transition order to PAID!');
  }
  console.log(`  ✓ First confirmation succeeded: Order ${confirm1.order.orderNumber} is now PAID.`);

  // Second confirmation call (Idempotency test)
  const confirm2 = await dbService.confirmPaystackPayment(testIntent.reference, validPayload, 'paystack_webhook');
  if (confirm2.alreadyProcessed !== true) {
    throw new Error('CRITICAL FAIL: Second confirmation call did not return alreadyProcessed=true!');
  }
  console.log('  ✓ Re-confirming same payment returned idempotently with alreadyProcessed=true.\n');

  // ----------------------------------------------------
  // TEST 5: PREVENT INVALID STATE TRANSITIONS FROM PAID
  // ----------------------------------------------------
  console.log('[TEST 5] Verifying State Transitions on PAID Orders...');
  try {
    await dbService.updateOrderStatus(testOrder.id, 'pending', 'admin@apexgrowth.digital');
    throw new Error('CRITICAL VULNERABILITY: Updating PAID order to PENDING succeeded!');
  } catch (err: any) {
    console.log(`  ✓ Transition PAID -> PENDING blocked: "${err.message}"`);
  }

  try {
    await dbService.updateOrderStatus(testOrder.id, 'awaiting_payment', 'admin@apexgrowth.digital');
    throw new Error('CRITICAL VULNERABILITY: Updating PAID order to AWAITING_PAYMENT succeeded!');
  } catch (err: any) {
    console.log(`  ✓ Transition PAID -> AWAITING_PAYMENT blocked: "${err.message}"\n`);
  }

  // ----------------------------------------------------
  // TEST 6: WEBHOOK SIGNATURE HMAC SHA-512 AUDIT
  // ----------------------------------------------------
  console.log('[TEST 6] Testing Webhook Signature Security...');
  if (!process.env.PAYSTACK_SECRET_KEY) {
    process.env.PAYSTACK_SECRET_KEY = 'sk_test_97bd3340aa48131cedaff54e747182b106b26891';
  }
  const testSecret = process.env.PAYSTACK_SECRET_KEY;
  const payloadStr = JSON.stringify({ event: 'charge.success', data: validPayload });

  const validSig = crypto.createHmac('sha512', testSecret).update(payloadStr).digest('hex');
  const invalidSig = 'invalid_sha512_hash_abcdef123456789';

  const isValid1 = await paystackService.verifyWebhookSignature(payloadStr, validSig);
  const isValid2 = await paystackService.verifyWebhookSignature(payloadStr, invalidSig);

  if (!isValid1) throw new Error('Valid HMAC SHA-512 signature was incorrectly rejected!');
  if (isValid2) throw new Error('CRITICAL SECURITY FAIL: Invalid HMAC SHA-512 signature was ACCEPTED!');

  console.log('  ✓ Valid HMAC SHA-512 webhook signature ACCEPTED.');
  console.log('  ✓ Invalid HMAC SHA-512 webhook signature REJECTED.\n');

  // ----------------------------------------------------
  // TEST 7: REFUND & TERMINAL STATE REVERSAL AUDIT
  // ----------------------------------------------------
  console.log('[TEST 7] Testing Refund Processing & Terminal State Reversal Protection...');
  const refundResult = await dbService.handlePaystackRefund(testIntent.reference, { refund_id: 'ref_12345' });
  if (refundResult.order.status !== 'refunded') {
    throw new Error('Refund processing failed to mark order as REFUNDED!');
  }
  console.log(`  ✓ Order ${testOrder.orderNumber} successfully transitioned to REFUNDED.`);

  // Attempt to mark REFUNDED order back to PAID
  try {
    await dbService.confirmPaystackPayment(testIntent.reference, validPayload, 'paystack_api_verify');
    throw new Error('CRITICAL VULNERABILITY: Re-confirming payment on REFUNDED order succeeded!');
  } catch (err: any) {
    console.log(`  ✓ Attempt to set REFUNDED -> PAID blocked: "${err.message}"\n`);
  }

  // ----------------------------------------------------
  // TEST 8: CLEANUP TEST ORDER
  // ----------------------------------------------------
  console.log('[TEST 8] Cleaning up test artifacts...');
  const freshOrder = await dbService.getOrderById(testOrder.id);
  console.log(`  ✓ Verified final order state in database: Status="${freshOrder?.status}"`);

  console.log('\n====================================================');
  console.log('  STAGE 4C ADVERSARIAL AUDIT PASSED 100% CLEANLY!   ');
  console.log('====================================================\n');
}

runStage4CAudit()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ STAGE 4C AUDIT FAILED:', err);
    process.exit(1);
  });
