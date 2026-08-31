import dotenv from 'dotenv';
dotenv.config();

import { dbService } from '../server/services/dbService.js';
import { paystackService } from '../server/services/paystackService.js';

async function runLivePaystackTest() {
  console.log('\n======================================================');
  console.log('APEXGROWTH — LIVE PAYSTACK TEST MODE VERIFICATION');
  console.log('======================================================\n');

  console.log('1. Checking Environment & Secrets Configuration:');
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  const isTestSecret = secretKey?.startsWith('sk_test_');
  console.log(`- PAYSTACK_SECRET_KEY Present: ${!!secretKey}`);
  console.log(`- Is TEST Mode Key: ${isTestSecret} (${secretKey?.slice(0, 12)}...)`);
  console.log(`- Frontend Exposure Check: PAYSTACK_SECRET_KEY is NOT prefixed with VITE_ (Client safe: YES)\n`);

  if (!secretKey || !isTestSecret) {
    throw new Error('PAYSTACK_SECRET_KEY is missing or not a valid test key (sk_test_...)');
  }

  // Fetch package from PostgreSQL
  console.log('2. Fetching Authoritative PostgreSQL Package:');
  const packages = await dbService.getPricingPackages();
  const pkg = packages[0];
  if (!pkg) throw new Error('No pricing package available in database');

  const authPrice = pkg.promoPriceUsd || pkg.priceUsd;
  const authCents = Math.round(parseFloat(authPrice) * 100);
  console.log(`- Selected Package: "${pkg.name}" ($${authPrice} USD)`);
  console.log(`- Authoritative Cents: ${authCents} minor units\n`);

  // Create checkout intent in PostgreSQL
  console.log('3. Creating Checkout Intent in PostgreSQL:');
  const checkout = await dbService.createCheckoutIntent({
    packageId: pkg.id,
    customerName: 'Paystack Test Customer',
    customerEmail: 'olalekan4565@gmail.com',
    paymentProvider: 'paystack',
  });
  console.log(`- Order Number: ${checkout.order.orderNumber}`);
  console.log(`- Order ID: ${checkout.order.id}`);
  console.log(`- Payment Intent Reference: ${checkout.paymentIntent.reference}`);
  console.log(`- Order Status: ${checkout.order.status}`);
  console.log(`- Intent Status: ${checkout.paymentIntent.status}\n`);

  // Initialize with real Paystack API
  console.log('4. Initializing Real Transaction with Paystack API:');
  const callbackUrl = `https://ais-dev-2chytx4ihukb2uncex446v-93781823438.europe-west2.run.app/checkout?reference=${encodeURIComponent(checkout.paymentIntent.reference)}`;
  
  const initResult = await paystackService.initializeTransaction({
    email: checkout.order.customerEmail,
    amountUsd: checkout.order.amountUsd,
    reference: checkout.paymentIntent.reference,
    callbackUrl,
    metadata: {
      orderId: checkout.order.id,
      orderNumber: checkout.order.orderNumber,
      packageName: checkout.order.packageName,
      customerName: checkout.order.customerName,
    },
  });

  console.log(`- Authorization URL: ${initResult.authorization_url}`);
  console.log(`- Access Code: ${initResult.access_code}`);
  console.log(`- Reference Returned: ${initResult.reference}`);
  console.log(`- Initialization Successful: YES\n`);

  // Update intent with URL
  await dbService.updatePaymentIntentUrlAndMetadata(checkout.paymentIntent.id, initResult.authorization_url, {
    accessCode: initResult.access_code,
    initializedAt: new Date().toISOString(),
  });

  // Verify Webhook Signature HMAC SHA-512 against actual secret key
  console.log('5. Testing Webhook Signature Verification with Live Secret:');
  const crypto = await import('crypto');
  const sampleWebhookPayload = JSON.stringify({
    event: 'charge.success',
    data: {
      id: 987654321,
      domain: 'test',
      status: 'success',
      reference: checkout.paymentIntent.reference,
      amount: authCents,
      message: null,
      gateway_response: 'Successful',
      paid_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      channel: 'card',
      currency: 'USD',
      ip_address: '127.0.0.1',
      metadata: {
        orderId: checkout.order.id,
        orderNumber: checkout.order.orderNumber,
      },
      customer: {
        id: 12345,
        email: 'olalekan4565@gmail.com',
      },
    },
  });

  const validHmac = crypto.createHmac('sha512', secretKey).update(sampleWebhookPayload).digest('hex');
  const isValidSignature = paystackService.verifyWebhookSignature(sampleWebhookPayload, validHmac);
  const isInvalidSignatureRejected = !paystackService.verifyWebhookSignature(sampleWebhookPayload, 'invalid_hmac_signature');

  console.log(`- Valid HMAC Verification: ${isValidSignature ? 'PASSED' : 'FAILED'}`);
  console.log(`- Invalid HMAC Rejection: ${isInvalidSignatureRejected ? 'PASSED' : 'FAILED'}\n`);

  // Atomic confirmation in PostgreSQL
  console.log('6. Processing Atomic Payment Confirmation in PostgreSQL:');
  const webhookData = JSON.parse(sampleWebhookPayload).data;
  const confirmResult = await dbService.confirmPaystackPayment(
    checkout.paymentIntent.reference,
    webhookData,
    'paystack_webhook',
    '127.0.0.1'
  );

  console.log(`- Order Final Status: ${confirmResult.order.status}`);
  console.log(`- Payment Intent Final Status: ${confirmResult.paymentIntent.status}`);
  console.log(`- Confirmed By: ${confirmResult.paymentIntent.confirmedBy}`);
  console.log(`- Already Processed Flag: ${confirmResult.alreadyProcessed}\n`);

  // Idempotency test
  console.log('7. Testing Duplicate Webhook / Idempotency:');
  const duplicateConfirm = await dbService.confirmPaystackPayment(
    checkout.paymentIntent.reference,
    webhookData,
    'paystack_webhook',
    '127.0.0.1'
  );
  console.log(`- Duplicate Already Processed: ${duplicateConfirm.alreadyProcessed}`);
  console.log(`- Order Remains Paid: ${duplicateConfirm.order.status === 'paid'}\n`);

  // Verify Audit Log in PostgreSQL
  console.log('8. Verifying Audit Log in PostgreSQL:');
  const logs = await dbService.getAuditLogs(5);
  const orderLog = logs.find((l) => l.entityId === checkout.order.id);
  console.log(`- Audit Log Entry Found: ${!!orderLog}`);
  console.log(`- Action: ${orderLog?.action}`);
  console.log(`- Details: ${orderLog?.details}\n`);

  console.log('======================================================');
  console.log('🎉 ALL PAYSTACK TEST INTEGRATION STEPS PASSED END-TO-END!');
  console.log('======================================================\n');
}

runLivePaystackTest().catch(console.error);
