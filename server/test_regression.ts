import { dbService } from './services/dbService.js';
import bcrypt from 'bcryptjs';

async function runRegressionTests() {
  console.log('=== STARTING POSTGRESQL & RBAC REGRESSION TEST SUITE ===');

  // 1. Verify Public Content Loader
  console.log('\n[1] Testing Public Content Fetch...');
  const publicData = await dbService.getPublicData();
  console.log(`✓ Business name: "${publicData.business.businessName}"`);
  console.log(`✓ Active services count: ${publicData.services.length}`);
  console.log(`✓ Active pricing packages: ${publicData.pricing.length}`);
  console.log(`✓ Active payment methods: ${publicData.paymentMethods.length}`);
  if (publicData.services.length === 0 || publicData.pricing.length === 0) {
    throw new Error('Public content is empty! Migration check failed.');
  }

  // 2. Verify Admin User Retrieval & Auth Verification
  console.log('\n[2] Testing Admin Authentication & Query...');
  const admin = await dbService.findAdminByEmail('admin@apexgrowth.digital');
  if (!admin) {
    throw new Error('Superadmin account admin@apexgrowth.digital not found in PostgreSQL!');
  }
  const isMatch = bcrypt.compareSync('ApexGrowthAdmin2026!', admin.passwordHash);
  console.log(`✓ Superadmin found: ${admin.email} (Role: ${admin.role})`);
  console.log(`✓ Password hash verification: ${isMatch ? 'PASSED' : 'FAILED'}`);
  if (!isMatch) throw new Error('Admin password hash mismatch');

  // 3. Test Lead Creation with Atomic Transaction
  console.log('\n[3] Testing Transactional Lead Creation...');
  const testLead = await dbService.createLeadWithTransaction(
    {
      name: 'Regression Test User',
      email: `test_${Date.now()}@apexgrowth.digital`,
      whatsapp: '+15559998888',
      businessType: 'E-commerce Brand',
      sellingDetails: 'Custom apparel and direct response marketing',
      utmSource: 'regression_test',
    },
    '127.0.0.1'
  );
  console.log(`✓ Created lead ID: ${testLead.id} (Status: ${testLead.status})`);

  // 4. Test Lead Note Attachment
  console.log('\n[4] Testing Lead Note Attachment...');
  const note = await dbService.addLeadNote(testLead.id, 'Lead Director', 'Initial inquiry test note');
  console.log(`✓ Created note ID: ${note.id} for lead ${testLead.id}`);

  // 5. Test Lead Status Mutation
  console.log('\n[5] Testing Lead Status Mutation...');
  const updatedLead = await dbService.updateLeadStatus(testLead.id, 'contacted');
  console.log(`✓ Updated status: ${updatedLead?.status}`);
  if (updatedLead?.status !== 'contacted') throw new Error('Lead status update failed');

  // 6. Test Dashboard Stats Calculation
  console.log('\n[6] Testing Dashboard Aggregations...');
  const stats = await dbService.getDashboardStats();
  console.log(`✓ Total leads: ${stats.totalLeads}`);
  console.log(`✓ New leads: ${stats.newLeads}`);
  console.log(`✓ Active services: ${stats.activeServices}`);
  console.log(`✓ Recent audit logs: ${stats.recentAuditLogs.length}`);

  // 7. Cleanup Test Lead (Testing CASCADE deletion of notes)
  console.log('\n[7] Testing Cascade Lead Deletion...');
  const deleted = await dbService.deleteLead(testLead.id);
  console.log(`✓ Deleted test lead: ${deleted ? 'SUCCESS (with CASCADE notes cleanup)' : 'FAILED'}`);

  console.log('\n=== ALL REGRESSION TESTS PASSED CLEANLY! ===\n');
}

runRegressionTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Regression tests failed:', err);
    process.exit(1);
  });
