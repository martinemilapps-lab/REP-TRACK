import assert from 'node:assert/strict';
import { StructuredPlanCellSchema, WeeklyPlanSchema } from '../src/lib/validation';
import { cleanPlanCellText } from '../src/lib/excel';

export function runWeeklyPlanEnhancementTests() {
  console.log('\n🧪 Running Weekly Plan Enhancements Test Suite...');
  let passed = 0;
  let failed = 0;

  function t(name: string, fn: () => void) {
    try {
      fn();
      passed++;
      console.log(`  ✓ ${name}`);
    } catch (e) {
      failed++;
      console.error(`  ✗ FAIL: ${name}`, e);
    }
  }

  t('Default visitType is Single with empty companion', () => {
    const singleDefault = StructuredPlanCellSchema.parse({});
    assert.equal(singleDefault.visitType, 'Single');
    assert.equal(singleDefault.companion, '');
  });

  t('Double visit without companion is rejected', () => {
    assert.throws(() => {
      StructuredPlanCellSchema.parse({ visitType: 'Double', companion: '' });
    }, /Companion name is required for a Double visit/);
  });

  t('Double visit with companion is accepted', () => {
    const validDouble = StructuredPlanCellSchema.parse({
      visitType: 'Double',
      companion: 'Dr. Tarek (Area Manager)',
    });
    assert.equal(validDouble.visitType, 'Double');
    assert.equal(validDouble.companion, 'Dr. Tarek (Area Manager)');
  });

  t('Meeting activity without meetingDescription is rejected', () => {
    assert.throws(() => {
      StructuredPlanCellSchema.parse({ activities: ['MEETING'], meetingDescription: '' });
    }, /Meeting description is required/);
  });

  t('Meeting activity with meetingDescription is accepted', () => {
    const valid = StructuredPlanCellSchema.parse({
      activities: ['MEETING'],
      meetingDescription: 'Q4 Strategy alignment',
    });
    assert.equal(valid.meetingDescription, 'Q4 Strategy alignment');
  });

  t('Training activity without trainingDescription is rejected', () => {
    assert.throws(() => {
      StructuredPlanCellSchema.parse({ activities: ['TRAINING'], trainingDescription: '' });
    }, /Training description is required/);
  });

  t('Training activity with trainingDescription is accepted', () => {
    const valid = StructuredPlanCellSchema.parse({
      activities: ['TRAINING'],
      trainingDescription: 'Product knowledge workshop on new releases',
    });
    assert.equal(valid.trainingDescription, 'Product knowledge workshop on new releases');
  });

  t('Event activity without eventDescription is rejected', () => {
    assert.throws(() => {
      StructuredPlanCellSchema.parse({ activities: ['EVENT'], eventDescription: '' });
    }, /Event description is required/);
  });

  t('Event activity with eventDescription is accepted', () => {
    const valid = StructuredPlanCellSchema.parse({
      activities: ['EVENT'],
      eventDescription: 'Annual Cardiology Congress 2026',
    });
    assert.equal(valid.eventDescription, 'Annual Cardiology Congress 2026');
  });

  t('Full weekly plan with AM and PM visit types & activity descriptions parses cleanly', () => {
    const fullPlan = WeeklyPlanSchema.parse({
      startDate: '2026-09-26',
      endDate: '2026-10-02',
      structuredPlan: {
        saturday: {
          am: {
            visitType: 'Double',
            companion: 'Fawzy Nasser',
            hospitalIds: ['h1'],
            activities: ['MEETING'],
            meetingDescription: 'Line 1 Meeting',
          },
          pm: {
            visitType: 'Single',
            doctorIds: ['d1'],
            activities: ['TRAINING'],
            trainingDescription: 'Selling Skills',
          },
        },
      },
    });
    assert.ok(fullPlan.structuredPlan);
    assert.equal(fullPlan.structuredPlan.saturday.am.visitType, 'Double');
    assert.equal(fullPlan.structuredPlan.saturday.am.companion, 'Fawzy Nasser');
    assert.equal(fullPlan.structuredPlan.saturday.am.meetingDescription, 'Line 1 Meeting');
    assert.equal(fullPlan.structuredPlan.saturday.pm.visitType, 'Single');
    assert.equal(fullPlan.structuredPlan.saturday.pm.trainingDescription, 'Selling Skills');
  });

  t('Excel cleanPlanCellText formats visitType and meeting/training/event descriptions', () => {
    const json = JSON.stringify({
      visitType: 'Double',
      companion: 'Sara Adel',
      activities: ['MEETING', 'EVENT'],
      meetingDescription: 'Weekly Sync',
      eventDescription: 'Symposium',
    });
    const formatted = cleanPlanCellText(json);
    assert.match(formatted, /Visit: Double \(With: Sara Adel\)/);
    assert.match(formatted, /Meeting: Weekly Sync/);
    assert.match(formatted, /Event: Symposium/);
  });

  return { passed, failed };
}

if (process.argv[1]?.endsWith('weeklyPlanEnhancement.test.ts')) {
  const { passed, failed } = runWeeklyPlanEnhancementTests();
  if (failed > 0) process.exit(1);
}
