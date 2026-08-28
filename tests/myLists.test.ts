import assert from 'assert';
import { db, representatives } from '../src/lib/db';
import {
  getMasterListsForRep,
  saveMasterHospital,
  saveMasterPharmacy,
  saveMasterDoctor,
  saveMasterBranch,
  deleteMasterItem,
} from '../src/lib/services/masterListService';
import { eq } from 'drizzle-orm';

export async function runMyListsTests() {
  console.log('\n🧪 Running My Lists Master Customer Management Tests...');
  let passed = 0;
  let failed = 0;

  try {
    // 1. Get or create test rep
    let testRep = await db.select().from(representatives).where(eq(representatives.name, 'Test Master Rep')).get();
    if (!testRep) {
      const repId = 'rep-master-lists-test';
      await db.insert(representatives).values({
        id: repId,
        name: 'Test Master Rep',
        area: 'Giza & Dokki',
        assignedHospitals: 5,
        assignedPharmacies: 10,
        assignedDrs: 15,
      }).run();
      testRep = await db.select().from(representatives).where(eq(representatives.id, repId)).get();
    }
    assert.ok(testRep, 'Test representative must exist');

    const suffix = Date.now().toString().slice(-5);
    const hospName = `Special Care Hospital ${suffix}`;
    const pharmName = `Alpha Care Pharmacy ${suffix}`;
    const docName = `Dr. Specialist Clinic ${suffix}`;
    const branchName = `Delta Logistics Branch ${suffix}`;

    // 2. Save master hospital for rep
    const savedHospital = await saveMasterHospital({
      name: hospName,
      area: 'Dokki Central',
      type: 'Private',
      dept: 'ICU / Cardiology',
      contact: 'Dr. Tarek Pharmacist',
      phone: '01001122334',
      doctorNames: 'Dr. Tarek, Dr. Adel',
      defaultCycle: 14,
      targetProducts: 'Nitrong, Sugammadex',
      rep: 'Test Master Rep',
    });
    assert.ok(savedHospital && savedHospital.id, 'Master hospital must be saved with id');
    assert.strictEqual(savedHospital.name, hospName);
    console.log('  ✓ Master hospital saved successfully with rep assignment');
    passed++;

    // 3. Save master pharmacy for rep
    const savedPharmacy = await saveMasterPharmacy({
      name: pharmName,
      area: 'Dokki Central',
      address: '15 Mossadak St',
      pharmacist: 'Dr. Mona',
      mobile: '01122334455',
      classification: 'A',
      defaultCycle: 10,
      targetProducts: 'Danasetron',
      rep: 'Test Master Rep',
    });
    assert.ok(savedPharmacy && savedPharmacy.id, 'Master pharmacy must be saved with id');
    assert.strictEqual(savedPharmacy.defaultCycle, 10);
    console.log('  ✓ Master pharmacy saved successfully with defaultCycle');
    passed++;

    // 4. Save master doctor for rep
    const savedDoctor = await saveMasterDoctor({
      code: `DOC-${suffix}`,
      name: docName,
      specialty: 'Cardiology',
      workplace: 'Heart Care Center',
      area: 'Dokki Central',
      mobile: '01234567890',
      classification: 'A',
      bestTime: 'Sunday 6-9 PM',
      defaultCycle: 21,
      targetProducts: 'Nitrong, Norepinephrine',
      rep: 'Test Master Rep',
    });
    assert.ok(savedDoctor && savedDoctor.id, 'Master doctor must be saved with id');
    assert.strictEqual(savedDoctor.bestTime, 'Sunday 6-9 PM');
    console.log('  ✓ Master doctor saved successfully with bestTime & targetProducts');
    passed++;

    // 5. Save master branch for rep
    const savedBranch = await saveMasterBranch({
      name: branchName,
      coverageArea: 'Giza Central',
      contact: 'Mr. Mahmoud Sales Mgr',
      phone: '01555667788',
      distributedProducts: 'All Sunny Catalog',
      defaultCycle: 30,
      rep: 'Test Master Rep',
    });
    assert.ok(savedBranch && savedBranch.id, 'Master branch must be saved with id');
    console.log('  ✓ Master distribution branch saved successfully');
    passed++;

    // 6. Query master list for rep
    const repLists = await getMasterListsForRep('Test Master Rep');
    assert.ok(repLists.hospitals.some(h => h.id === savedHospital.id), 'Hospital found in rep master list');
    assert.ok(repLists.pharmacies.some(p => p.id === savedPharmacy.id), 'Pharmacy found in rep master list');
    assert.ok(repLists.doctors.some(d => d.id === savedDoctor.id), 'Doctor found in rep master list');
    assert.ok(repLists.branches.some(b => b.id === savedBranch.id), 'Branch found in rep master list');
    console.log('  ✓ getMasterListsForRep accurately returns all rep master entries');
    passed++;

    // 7. Update master hospital
    const updatedHospital = await saveMasterHospital({
      id: savedHospital.id,
      name: hospName,
      area: 'Dokki Central',
      type: 'Private',
      dept: 'Oncology & ICU',
      contact: 'Dr. Tarek Chief Pharmacist',
      defaultCycle: 7,
      rep: 'Test Master Rep',
    });
    assert.strictEqual(updatedHospital.dept, 'Oncology & ICU');
    console.log('  ✓ Master customer record updated in place');
    passed++;

    // 8. Delete test entries
    await deleteMasterItem('hospitals', savedHospital.id);
    await deleteMasterItem('pharmacies', savedPharmacy.id);
    await deleteMasterItem('doctors', savedDoctor.id);
    await deleteMasterItem('branches', savedBranch.id);

    const cleanLists = await getMasterListsForRep('Test Master Rep');
    assert.ok(!cleanLists.hospitals.some(h => h.id === savedHospital.id), 'Hospital removed');
    assert.ok(!cleanLists.pharmacies.some(p => p.id === savedPharmacy.id), 'Pharmacy removed');
    console.log('  ✓ Master customer deletion cleans up records');
    passed++;
  } catch (e: any) {
    console.error('  ❌ Test assertion failed:', e.message, e.cause || e);
    failed++;
  }

  return { passed, failed };
}
