import assert from 'node:assert/strict';
import {
  getReportingWindowStatus,
  isDateSubmissionOpen,
  formatTimeRemaining,
  BUSINESS_TIME_ZONE,
} from '../src/lib/business/reportingWindow';
import { assertReportSubmissionOpen } from '../src/lib/business/reportDeadline';

export function runReportingTimerTests() {
  let passed = 0;
  let failed = 0;

  const test = (name: string, fn: () => void) => {
    try {
      fn();
      passed++;
      console.log('  ✓ ' + name);
    } catch (e) {
      failed++;
      console.error('  ✗ ' + name, e);
    }
  };

  console.log('\nREPORTING TIMER & CUTOFF TESTS');

  test('Format time remaining correctly produces HH:MM:SS', () => {
    assert.equal(formatTimeRemaining(0), '00:00:00');
    assert.equal(formatTimeRemaining(59), '00:00:59');
    assert.equal(formatTimeRemaining(60), '00:01:00');
    assert.equal(formatTimeRemaining(3661), '01:01:01');
    assert.equal(formatTimeRemaining(36000), '10:00:00');
  });

  test('Before 9:00 AM Cairo (e.g. 05:00 UTC = 08:00 Cairo in summer): allows yesterday and today', () => {
    // 2026-09-15 05:00:00 UTC = 08:00:00 Cairo
    const simulatedDate = new Date('2026-09-15T05:00:00Z');
    const status = getReportingWindowStatus(simulatedDate);

    assert.equal(BUSINESS_TIME_ZONE, 'Africa/Cairo');
    assert.equal(status.todayDate, '2026-09-15');
    assert.equal(status.yesterdayDate, '2026-09-14');
    assert.deepEqual(status.allowedDates, ['2026-09-14', '2026-09-15']);
    assert.equal(status.isMorningGracePeriod, true);
    assert.equal(status.urgency, 'urgent'); // 8:00 AM is final hour before 9:00 AM

    // Date submission open check
    assert.equal(isDateSubmissionOpen('2026-09-14', simulatedDate), true, 'yesterday is open');
    assert.equal(isDateSubmissionOpen('2026-09-15', simulatedDate), true, 'today is open');
    assert.equal(isDateSubmissionOpen('2026-09-13', simulatedDate), false, '2 days ago is closed');
    assert.equal(isDateSubmissionOpen('2026-09-16', simulatedDate), false, 'tomorrow is closed');

    // Assertion check
    assert.doesNotThrow(() => assertReportSubmissionOpen('2026-09-14', () => simulatedDate));
    assert.doesNotThrow(() => assertReportSubmissionOpen('2026-09-15', () => simulatedDate));
    assert.throws(() => assertReportSubmissionOpen('2026-09-13', () => simulatedDate), (err: any) => err.statusCode === 409);
  });

  test('At or after 9:00 AM Cairo (e.g. 06:05 UTC = 09:05 Cairo in summer): locks yesterday permanently', () => {
    // 2026-09-15 06:05:00 UTC = 09:05:00 Cairo
    const simulatedDate = new Date('2026-09-15T06:05:00Z');
    const status = getReportingWindowStatus(simulatedDate);

    assert.equal(status.todayDate, '2026-09-15');
    assert.deepEqual(status.allowedDates, ['2026-09-15']);
    assert.equal(status.isMorningGracePeriod, false);
    assert.equal(status.urgency, 'normal');

    // Yesterday is now closed
    assert.equal(isDateSubmissionOpen('2026-09-14', simulatedDate), false, 'yesterday is locked after 9:00 AM');
    assert.equal(isDateSubmissionOpen('2026-09-15', simulatedDate), true, 'today is open');
    assert.equal(isDateSubmissionOpen('2026-09-13', simulatedDate), false, 'older dates locked');

    // Assertion check throws 409 for yesterday
    assert.throws(
      () => assertReportSubmissionOpen('2026-09-14', () => simulatedDate),
      (err: any) => err.statusCode === 409 && err.message.includes('Submission window closed')
    );
  });

  return { passed, failed };
}

if (process.argv[1]?.endsWith('reportingTimer.test.ts')) {
  const result = runReportingTimerTests();
  if (result.failed > 0) {
    process.exit(1);
  }
}
