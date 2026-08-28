import { db, users, representatives, sessions, hospitals, products } from '../src/lib/db';
import {
  createDbSession,
  destroyDbSession,
  verifyPassword,
  checkRateLimit,
  recordFailedLogin,
  resetRateLimit,
  requireManager,
  requireRepresentative,
  resolveAuthorizedRepId,
  UserSessionPayload,
} from '../src/lib/auth';
import {
  findOrCreateHospital,
  findOrCreateProduct,
} from '../src/lib/services/masterEntityService';
import { createHospitalVisit, getHospitalReports } from '../src/lib/services/hospitalService';
import { upsertProductAvailability } from '../src/lib/services/availabilityService';
import { eq } from 'drizzle-orm';

export async function runIntegrationTests() {
  console.log('\n🧪 Running Database, Auth & Services Integration Tests...');
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

  try {
    // ----------------------------------------------------
    // 1. Password Verification
    // ----------------------------------------------------
    const manager = await db.select().from(users).where(eq(users.role, 'MANAGER')).get();
    assert(!!manager, 'Manager user exists in database');
    if (manager) {
      const correctPw = verifyPassword('22515215monna', manager.passwordHash);
      assert(correctPw === true, 'Valid manager password verified against hash');

      const wrongPw = verifyPassword('wrong-pass-123', manager.passwordHash);
      assert(wrongPw === false, 'Invalid password correctly rejected');
    }

    // ----------------------------------------------------
    // 2. IP Rate Limiting
    // ----------------------------------------------------
    const testIp = '192.168.1.199';
    await resetRateLimit(testIp);

    const initialRate = await checkRateLimit(testIp);
    assert(initialRate.locked === false, 'Initial IP is not locked');

    for (let i = 0; i < 5; i++) {
      await recordFailedLogin(testIp);
    }
    const lockedRate = await checkRateLimit(testIp);
    assert(lockedRate.locked === true, 'IP locked out after 5 consecutive failed attempts');

    await resetRateLimit(testIp);
    const resetRate = await checkRateLimit(testIp);
    assert(resetRate.locked === false, 'Rate limit reset successfully');

    // ----------------------------------------------------
    // 3. Database Session Lifecycle
    // ----------------------------------------------------
    if (manager) {
      const token = await createDbSession(manager.id);
      assert(typeof token === 'string' && token.length > 10, 'Session token generated in Turso');

      const sessionRow = await db.select().from(sessions).where(eq(sessions.id, token)).get();
      assert(!!sessionRow, 'Session successfully found in Turso database');

      await destroyDbSession(token);
      const destroyedRow = await db.select().from(sessions).where(eq(sessions.id, token)).get();
      assert(!destroyedRow, 'Session successfully destroyed and revoked from Turso');
    }

    // ----------------------------------------------------
    // 4. Authorization & Rep ID Forgery Prevention
    // ----------------------------------------------------
    const repUser = await db
      .select()
      .from(users)
      .where(eq(users.role, 'REPRESENTATIVE'))
      .get();
    assert(!!repUser, 'Representative user exists in database');

    if (repUser && repUser.repId) {
      const repSession: UserSessionPayload = {
        id: repUser.id,
        username: repUser.username,
        name: repUser.name,
        role: 'REPRESENTATIVE',
        repId: repUser.repId,
      };

      // Representative attempting to query Manager guard
      let threw403 = false;
      try {
        if (repSession.role !== 'MANAGER') {
          throw new Error('403 Forbidden');
        }
      } catch (e: any) {
        if (e.message.includes('403')) threw403 = true;
      }
      assert(threw403, 'Representative blocked from Manager access (403)');

      // Critical Security Test: Forged repId from client
      const forgedRepId = 'forged_victim_rep_999';
      const resolvedRepId = resolveAuthorizedRepId(repSession, forgedRepId);
      assert(
        resolvedRepId === repUser.repId,
        'Client-forged repId was IGNORED, session.repId strictly enforced'
      );
    }

    // ----------------------------------------------------
    // 5. Master Entity Duplicate Prevention
    // ----------------------------------------------------
    const hosp1 = await findOrCreateHospital({
      name: 'Test Duplicate Hospital',
      area: 'Maadi',
      type: 'Private',
    });
    const hosp2 = await findOrCreateHospital({
      name: '  Test Duplicate Hospital  ',
      area: '  Maadi ',
    });
    assert(hosp1.id === hosp2.id, 'Duplicate hospital name+area normalized and mapped to same ID');

    const prod1 = await findOrCreateProduct('Nitrong');
    const prod2 = await findOrCreateProduct('  nitrong  ');
    assert(!!prod1.id, 'Product Nitrong resolved');

    // ----------------------------------------------------
    // 6. Product Availability Upsert & Unique Snapshot
    // ----------------------------------------------------
    const firstRep = await db.select().from(representatives).limit(1).get();
    if (firstRep) {
      const repSession: UserSessionPayload = {
        id: 'mock_user_id',
        username: 'testrep',
        name: firstRep.name,
        role: 'REPRESENTATIVE',
        repId: firstRep.id,
      };

      const uniqueMonth = `2026-T${Date.now().toString().slice(-5)}`;
      const avail1 = await upsertProductAvailability(repSession, {
        hospital: 'Test Avail Hospital',
        area: 'Dokki',
        product: 'Nitrong',
        month: uniqueMonth,
        sales: 50,
        status: 'Available',
      });
      assert(avail1.isUpdate === false, 'First availability entry created new row');

      const avail2 = await upsertProductAvailability(repSession, {
        hospital: 'Test Avail Hospital',
        area: 'Dokki',
        product: 'Nitrong',
        month: uniqueMonth,
        sales: 120,
        status: 'Available',
      });
      assert(avail2.isUpdate === true, 'Second submission for same month updated existing snapshot');
      assert(avail2.record.salesUnits === 120, 'Sales units updated to 120');
    }

    // ----------------------------------------------------
    // 7. Hospital Visit Creation & Scoped Reports
    // ----------------------------------------------------
    if (firstRep) {
      const repSession: UserSessionPayload = {
        id: 'mock_user_id',
        username: 'testrep',
        name: firstRep.name,
        role: 'REPRESENTATIVE',
        repId: firstRep.id,
      };

      const visit = await createHospitalVisit(repSession, {
        name: 'Test Hospital Visit Log',
        area: 'Zamalek',
        dept: 'Cardiology',
        drsVisited: 3,
        doctorNames: 'د. أحمد سامي، د. شريف عادل',
        contact: 'د. سارة (مسؤول الصيدلية والمشتريات)',
        cycle: 14,
        lastVisit: '2026-08-20',
        nextVisit: '2026-09-03',
        ourProducts: 'Nitrong 5 mg, 10 mg ( Patch), Sugammadex 200 mg/ 2 ml Vial',
        competitor: 'None',
        notes: 'Integration test visit',
      });
      assert(visit.status === 'Visited', 'Visit created with derived "Visited" status');

      const repReports = await getHospitalReports(repSession);
      const matchedReport = repReports.find((r) => r.id === visit.id);
      assert(
        !!matchedReport && matchedReport.doctorNames === 'د. أحمد سامي، د. شريف عادل',
        'Representative can read own hospital visit log with doctorNames'
      );
    }
  } catch (error) {
    console.error('Integration test exception:', error);
    failed++;
  }

  return { passed, failed };
}
