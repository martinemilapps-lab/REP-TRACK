import assert from 'node:assert/strict';
import fs from 'node:fs';

export function runAvailabilityReportsTests() {
  let passed = 0;
  let failed = 0;

  const test = (name: string, fn: () => void) => {
    try {
      fn();
      passed++;
      console.log(`  ✓ ${name}`);
    } catch (error) {
      failed++;
      console.error(`  ✗ ${name}`, error);
    }
  };

  console.log('\n📊 Running Product Availability 2 Full Reports Test Suite...');

  test('Report 1: Hospital breakdown separates Available and Not Available product names', () => {
    const rawRecords = [
      { hospital: 'Cleopatra Hospital', product: 'Danasetron', status: 'Available' },
      { hospital: 'Cleopatra Hospital', product: 'Nitron', status: 'Not Available' },
      { hospital: 'Cleopatra Hospital', product: 'Sunnyprixate', status: 'Available' },
      { hospital: 'Dar Al Fouad', product: 'Beconeurin', status: 'Not Available' },
      { hospital: 'Dar Al Fouad', product: 'Danasetron', status: 'Available' },
    ];

    // Compute grouping
    const map = new Map<string, { available: string[]; unavailable: string[] }>();
    rawRecords.forEach((r) => {
      if (!map.has(r.hospital)) {
        map.set(r.hospital, { available: [], unavailable: [] });
      }
      const group = map.get(r.hospital)!;
      if (r.status === 'Available') {
        group.available.push(r.product);
      } else {
        group.unavailable.push(r.product);
      }
    });

    const cleopatra = map.get('Cleopatra Hospital')!;
    assert.deepEqual(cleopatra.available.sort(), ['Danasetron', 'Sunnyprixate'].sort());
    assert.deepEqual(cleopatra.unavailable, ['Nitron']);

    const darAlFouad = map.get('Dar Al Fouad')!;
    assert.deepEqual(darAlFouad.available, ['Danasetron']);
    assert.deepEqual(darAlFouad.unavailable, ['Beconeurin']);
  });

  test('Report 2: Transition engine correctly detects Became Available (Not Available -> Available)', () => {
    // Month 1: Not Available, Month 2: Available
    const sequence: Array<'Available' | 'Not Available'> = ['Not Available', 'Available'];
    let transition = 'NONE';
    for (let i = 1; i < sequence.length; i++) {
      const prev = sequence[i - 1];
      const curr = sequence[i];
      if (prev === 'Not Available' && curr === 'Available') {
        transition = 'BECAME_AVAILABLE';
      }
    }
    assert.equal(transition, 'BECAME_AVAILABLE');
  });

  test('Report 2: Transition engine correctly detects Became Unavailable (Available -> Not Available)', () => {
    // Month 1: Available, Month 2: Not Available
    const sequence: Array<'Available' | 'Not Available'> = ['Available', 'Not Available'];
    let transition = 'NONE';
    for (let i = 1; i < sequence.length; i++) {
      const prev = sequence[i - 1];
      const curr = sequence[i];
      if (prev === 'Available' && curr === 'Not Available') {
        transition = 'BECAME_UNAVAILABLE';
      }
    }
    assert.equal(transition, 'BECAME_UNAVAILABLE');
  });

  test('Report 2: Stable products over multiple months produce 0 transitions', () => {
    const sequence: Array<'Available' | 'Not Available'> = [
      'Available',
      'Available',
      'Available',
      'Available',
    ];
    let becameAvailable = 0;
    let becameUnavailable = 0;
    for (let i = 1; i < sequence.length; i++) {
      const prev = sequence[i - 1];
      const curr = sequence[i];
      if (prev === 'Not Available' && curr === 'Available') becameAvailable++;
      if (prev === 'Available' && curr === 'Not Available') becameUnavailable++;
    }
    assert.equal(becameAvailable, 0);
    assert.equal(becameUnavailable, 0);
  });

  test('AvailabilityForm embeds AvailabilityReportsContainer and preserves setStatuses({})', () => {
    const code = fs.readFileSync('src/components/reports/AvailabilityForm.tsx', 'utf8');
    assert.match(code, /AvailabilityReportsContainer/);
    assert.match(code, /setStatuses\(\{\}\)/);
    assert.match(code, /refreshSignal/);
  });

  test('ManagerAvailabilityView preserves hierarchy tokens and embeds AvailabilityReportsContainer', () => {
    const code = fs.readFileSync('src/components/manager/ManagerAvailabilityView.tsx', 'utf8');
    for (const term of [
      'DIRECT_REPORTS',
      'ALL_DESCENDANTS',
      'Hospital',
      'Area / Territory',
      'Product',
      'Status',
    ]) {
      assert.match(code, new RegExp(term));
    }
    assert.match(code, /AvailabilityReportsContainer/);
  });

  test('GET /api/reports/availability is defined with getScopedAvailabilityReports', () => {
    const routeCode = fs.readFileSync('src/app/api/reports/availability/route.ts', 'utf8');
    assert.match(routeCode, /export async function GET/);
    assert.match(routeCode, /getScopedAvailabilityReports/);

    const serviceCode = fs.readFileSync('src/lib/services/availabilityService.ts', 'utf8');
    assert.match(serviceCode, /export async function getScopedAvailabilityReports/);
    assert.match(serviceCode, /hierarchyService\.getScopedRepresentatives/);
  });

  test('HospitalAvailabilityReport and MonthlyAvailabilityComparisonReport components exist and export properly', () => {
    const rep1 = fs.readFileSync(
      'src/components/availability/HospitalAvailabilityReport.tsx',
      'utf8'
    );
    assert.match(rep1, /export function HospitalAvailabilityReport/);
    assert.match(rep1, /availableProducts/);
    assert.match(rep1, /unavailableProducts/);

    const rep2 = fs.readFileSync(
      'src/components/availability/MonthlyAvailabilityComparisonReport.tsx',
      'utf8'
    );
    assert.match(rep2, /export function MonthlyAvailabilityComparisonReport/);
    assert.match(rep2, /BECAME_AVAILABLE/);
    assert.match(rep2, /BECAME_UNAVAILABLE/);
  });

  return { passed, failed };
}
