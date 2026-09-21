import { AppError } from '@/lib/errors';
import { isDateSubmissionOpen, BUSINESS_TIME_ZONE } from './reportingWindow';

export { BUSINESS_TIME_ZONE };

type Clock = () => Date;

export function submissionWindowOpen(reportDate: string, now: Date = new Date()): boolean {
  return isDateSubmissionOpen(reportDate, now);
}

export function assertReportSubmissionOpen(reportDate: string, clock: Clock = () => new Date()) {
  if (!submissionWindowOpen(reportDate, clock())) {
    throw new AppError(
      'Submission window closed. Reports are accepted maximum the next day at 9:00 AM Africa/Cairo (from 12:00 AM to 9:00 AM). The system cannot accept reporting after this time. | انتهت مهلة التقديم. يتم قبول التقارير بحد أقصى اليوم التالي الساعة 9:00 صباحاً بتوقيت القاهرة (من 12:00 ص إلى 9:00 ص). لا يقبل النظام أي تقارير بعد هذا الوقت.',
      409
    );
  }
}
