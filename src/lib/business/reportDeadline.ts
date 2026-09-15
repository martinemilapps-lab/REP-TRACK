import { AppError } from '@/lib/errors';

export const BUSINESS_TIME_ZONE = process.env.BUSINESS_TIME_ZONE || 'Africa/Cairo';

type Clock = () => Date;

function cairoParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(date);
  return Object.fromEntries(parts.map(({ type, value }) => [type, value]));
}

export function submissionWindowOpen(reportDate: string, now: Date = new Date()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(reportDate)) return false;
  const p = cairoParts(now);
  const today = `${p.year}-${p.month}-${p.day}`;
  if (reportDate > today) return false;
  if (reportDate === today) return true;
  const report = new Date(`${reportDate}T12:00:00Z`);
  report.setUTCDate(report.getUTCDate() + 1);
  const nextDay = report.toISOString().slice(0, 10);
  if (today !== nextDay) return false;
  return `${p.hour}:${p.minute}:${p.second}` < '09:00:00';
}

export function assertReportSubmissionOpen(reportDate: string, clock: Clock = () => new Date()) {
  if (!submissionWindowOpen(reportDate, clock())) {
    throw new AppError('Submission window closed. Reports are accepted until 9:00 AM Africa/Cairo on the following calendar day. | انتهت مهلة التقديم الساعة 9:00 صباحاً بتوقيت القاهرة في اليوم التالي.', 409);
  }
}
