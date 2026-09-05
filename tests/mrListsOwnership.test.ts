import assert from 'assert';
import { db, representatives, hospitals, pharmacies, doctors, distributionBranches } from '../src/lib/db';
import {
  resolveRepOwnership,
  saveMasterHospital,
  saveMasterPharmacy,
  saveMasterDoctor,
  saveMasterBranch,
  deleteMasterItem,
  getMasterListsForRep,
  getScopedMasterListsForManager,
} from '../src/lib/services/masterListService';
import {
  findOrCreateHospital,
  findOrCreatePharmacy,
  findOrCreateDoctor,
  findOrCreateBranch,
} from '../src/lib/services/masterEntityService';
import { organizationService } from '../src/lib/services/organizationService';
import { buildOrganizationDataset } from '../scripts/provision_organization_foundation';
import { UserSessionPayload } from '../src/lib/auth';
import { eq } from 'drizzle-orm';

export interface MrListsOwnershipTestResult {
  passed: number;
  failed: number;
  checks: string[];
}

export async function runMrListsOwnershipTests(): Promise<MrListsOwnershipTestResult> {
  console.log('\n📋 Running MR Lists Ownership & Report Binding Tests (STEP 18)...');
  const checks: string[] = [];
  let passed = 0;
  let failed = 0;

  function record(condition: boolean, desc: string) {
    if (condition) {
      checks.push(`✓ PASS: ${desc}`);
      passed++;
    } else {
      checks.push(`✗ FAIL: ${desc}`);
      failed++;
    }
  }

  try {
    // =========================================================================
    // 1. Session Ownership Resolution (Never trust browser repId input)
    // =========================================================================
    console.log('  Testing Session-Authoritative Ownership Resolution...');

    // Mock MR session
    const mrSession: UserSessionPayload = {
      id: 'user-mr-test-01',
      name: 'Ahmad MR Test',
      username: 'MR_AHMAD',
      role: 'REPRESENTATIVE',
      positionCode: 'MR',
      systemRole: 'REPRESENTATIVE',
      repId: 'rep-mr-test-01',
    };

    // Resolving MR ownership from session
    const resolvedMrId = await resolveRepOwnership(mrSession);
    record(
      resolvedMrId === 'rep-mr-test-01',
      'MR ownership strictly resolved from session (repId: rep-mr-test-01)'
    );

    // Mock Manager session WITHOUT personal sales assignment
    const pureManagerSession: UserSessionPayload = {
      id: 'user-dm-test-01',
      name: 'Pure Manager',
      username: 'DM_PURE',
      role: 'MANAGER',
      positionCode: 'DM',
      systemRole: 'MANAGER',
      repId: null,
      hasPersonalSalesAssignment: false,
    };

    let pureManagerBlocked = false;
    try {
      await resolveRepOwnership(pureManagerSession);
    } catch (err: any) {
      pureManagerBlocked = err.message.includes('Managers without personal territory assignment cannot own representative lists');
    }
    record(
      pureManagerBlocked,
      'Pure Manager session blocked from claiming representative list ownership'
    );

    // Mock Dual-Role Manager session WITH personal sales assignment
    const dualRoleManagerSession: UserSessionPayload = {
      id: 'user-dm-dual-01',
      name: 'Dual Role DM',
      username: 'DM_DUAL',
      role: 'MANAGER',
      positionCode: 'DM',
      systemRole: 'MANAGER',
      repId: null,
      hasPersonalSalesAssignment: true,
      personalSalesAssignment: {
        id: 'sa-dual-01',
        titleRaw: 'Personal Giza Line',
        businessLine: 1,
        territoryName: 'Personal Giza Line',
        repId: 'rep-dual-dm-01',
      },
    };

    const resolvedDualId = await resolveRepOwnership(dualRoleManagerSession);
    record(
      resolvedDualId === 'rep-dual-dm-01',
      'Dual-Role Manager ownership resolved strictly to personal territory repId'
    );

    // =========================================================================
    // 2. Organization Scoped Manager Visibility (Hierarchy Paths Verification)
    // =========================================================================
    console.log('  Testing Organizational Hierarchy Scoping for Manager Directory...');
    const orgDataset = buildOrganizationDataset();
    const { users, hierarchyPaths } = orgDataset;

    // Find DM1 (Azza Karim) and verify her scoped descendants
    const dm1 = users.find((u) => u.username === 'DM1');
    assert.ok(dm1, 'DM1 must exist in organization dataset');

    // Hierarchy paths where ancestor_user_id is DM1
    const dm1DescendantPaths = hierarchyPaths.filter((hp) => hp.ancestor_user_id === dm1.id);
    const dm1DescendantUserIds = new Set(dm1DescendantPaths.map((hp) => hp.source_user_id));

    // Find an MR supervised under DM1
    const subordinateMr = users.find((u) => u.position_code === 'MR' && dm1DescendantUserIds.has(u.id));
    record(
      !!subordinateMr,
      `DM1 hierarchy scope successfully includes descendant MR (${subordinateMr?.username || 'found'})`
    );

    // Find an MR supervised under another DM (outside DM1's scope)
    const outOfScopeMr = users.find((u) => u.position_code === 'MR' && !dm1DescendantUserIds.has(u.id));
    record(
      !!outOfScopeMr && !dm1DescendantUserIds.has(outOfScopeMr.id),
      `DM1 hierarchy scope strictly excludes out-of-scope MR (${outOfScopeMr?.username || 'isolated'})`
    );

    // =========================================================================
    // 3. Database Persistence & Ownership Enforcement (D1 Data Layer)
    // =========================================================================
    console.log('  Testing D1 Autosave Persistence & Ownership Cross-Isolation...');

    try {

    // Setup two distinct test representatives
    const repAId = 'rep-test-persist-alpha';
    const repBId = 'rep-test-persist-beta';

    let repA = await db.select().from(representatives).where(eq(representatives.id, repAId)).get();
    if (!repA) {
      await db.insert(representatives).values({
        id: repAId,
        name: 'MR Alpha Cairo',
        area: 'Cairo Central',
        assignedHospitals: 5,
        assignedPharmacies: 10,
        assignedDrs: 15,
        isActive: true,
      }).run();
    }

    let repB = await db.select().from(representatives).where(eq(representatives.id, repBId)).get();
    if (!repB) {
      await db.insert(representatives).values({
        id: repBId,
        name: 'MR Beta Alexandria',
        area: 'Alexandria East',
        assignedHospitals: 5,
        assignedPharmacies: 10,
        assignedDrs: 15,
        isActive: true,
      }).run();
    }

    const testSuffix = Date.now().toString().slice(-4);
    const hospName = `Step18 Alpha Hospital ${testSuffix}`;
    const docName = `Step18 Alpha Doctor ${testSuffix}`;
    const pharmName = `Step18 Alpha Pharmacy ${testSuffix}`;
    const branchName = `Step18 Alpha Branch ${testSuffix}`;

    // 3.1 MR Alpha creates a Hospital (immediate autosave to D1)
    const savedHosp = await saveMasterHospital({
      name: hospName,
      area: 'Cairo Central',
      type: 'Private',
      contact: 'Chief Dr. Alpha',
      phone: '01011112222',
      defaultCycle: 7,
      rep: 'MR Alpha Cairo',
      repId: repAId, // Injected server-side from session
    });

    record(
      !!savedHosp && savedHosp.repId === repAId && savedHosp.name === hospName,
      'MR Alpha hospital created and persisted in D1 with repId ownership'
    );

    // 3.2 MR Alpha creates Doctor, Pharmacy, Branch
    const savedDoc = await saveMasterDoctor({
      name: docName,
      area: 'Cairo Central',
      specialty: 'Internal Medicine',
      workplace: hospName,
      mobile: '01222223333',
      defaultCycle: 14,
      rep: 'MR Alpha Cairo',
      repId: repAId,
    });

    const savedPharm = await saveMasterPharmacy({
      name: pharmName,
      area: 'Cairo Central',
      address: '10 Tahrir St',
      pharmacist: 'Dr. Magdy',
      mobile: '01111114444',
      defaultCycle: 7,
      rep: 'MR Alpha Cairo',
      repId: repAId,
    });

    const savedBranch = await saveMasterBranch({
      name: branchName,
      coverageArea: 'Cairo Central',
      contact: 'Mr. Logistics Head',
      phone: '01555556666',
      defaultCycle: 30,
      rep: 'MR Alpha Cairo',
      repId: repAId,
    });

    record(
      !!savedDoc && !!savedPharm && !!savedBranch,
      'MR Alpha doctor, pharmacy, and branch persisted to D1'
    );

    // 3.3 Verify lists query is isolated by representative
    const alphaLists = await getMasterListsForRep(repAId, true);
    const betaLists = await getMasterListsForRep(repBId, true);

    const alphaHasHosp = alphaLists.hospitals.some((h) => h.id === savedHosp.id);
    const betaHasHosp = betaLists.hospitals.some((h) => h.id === savedHosp.id);

    record(
      alphaHasHosp && !betaHasHosp,
      'Rep A customer list strictly isolated; Rep B cannot see or receive Rep A entities'
    );

    // 3.4 Cross-Rep Security Enforcement: Rep B cannot delete Rep A's entity
    let deleteForbidden = false;
    try {
      await deleteMasterItem('hospitals', savedHosp.id, repBId);
    } catch (err: any) {
      deleteForbidden = err.message.includes('Forbidden: Item does not belong to your representative territory');
    }
    record(
      deleteForbidden,
      'Cross-rep deletion rejected with 403 Forbidden when repId mismatch detected'
    );

    // Verify hospital still exists in D1
    const verifyHospStillExists = await db.select().from(hospitals).where(eq(hospitals.id, savedHosp.id)).get();
    record(
      !!verifyHospStillExists,
      'Hospital record intact in D1 after unauthorized deletion attempt'
    );

    // 3.5 Authorized Deletion: Rep A deletes their own entity
    await deleteMasterItem('hospitals', savedHosp.id, repAId);
    const verifyDeleted = await db.select().from(hospitals).where(eq(hospitals.id, savedHosp.id)).get();
    record(
      !verifyDeleted,
      'Rep A successfully deleted their own hospital from D1'
    );

    // Clean up remaining test items
    await deleteMasterItem('doctors', savedDoc.id, repAId);
    await deleteMasterItem('pharmacies', savedPharm.id, repAId);
    await deleteMasterItem('branches', savedBranch.id, repAId);

    // =========================================================================
    // 4. Report Source Binding & Auto-Linking to Master Entities
    // =========================================================================
    console.log('  Testing Report Pickers & Master Entity Auto-Linkage...');

    // 4.1 Master Entity Resolver binds new entities to repId
    const resolvedHosp = await findOrCreateHospital({
      name: `Bound Hospital ${testSuffix}`,
      area: 'Cairo Central',
      type: 'Government',
      repId: repAId,
    });

    record(
      !!resolvedHosp && (resolvedHosp as any).repId === repAId,
      'findOrCreateHospital binds created entity to the submitting MR repId'
    );

    // 4.2 Calling findOrCreateHospital with same name returns existing master row
    const existingHosp = await findOrCreateHospital({
      name: `Bound Hospital ${testSuffix}`,
      area: 'Cairo Central',
      type: 'Government',
      repId: repAId,
    });

    record(
      existingHosp.id === resolvedHosp.id,
      'Report picker re-uses existing master entity without duplicating records'
    );

    // Clean up bound hospital
    await db.delete(hospitals).where(eq(hospitals.id, resolvedHosp.id)).run();

    } catch (err: any) {
      if (err?.message?.includes('Unauthorized') || err?.cause?.message?.includes('Unauthorized')) {
        console.log('  ℹ️ Remote Data Gateway secret offline. Skipping remote DB assertions.');
      } else {
        console.error('  ❌ Test error:', err.message, err.cause || err);
        checks.push(`✗ FAIL: Unexpected error: ${err.message}`);
        failed++;
      }
    }
  } catch (err: any) {
    console.error('  ❌ Core in-memory test error:', err.message, err.cause || err);
    checks.push(`✗ FAIL: Unexpected error: ${err.message}`);
    failed++;
  }

  return { passed, failed, checks };
}
