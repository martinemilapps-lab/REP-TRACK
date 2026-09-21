export const BUSINESS_TIME_ZONE = process.env.BUSINESS_TIME_ZONE || 'Africa/Cairo';

export interface CairoTimeParts {
  year: string;
  month: string;
  day: string;
  hour: number;
  minute: number;
  second: number;
  dateStr: string; // YYYY-MM-DD
  timeStr: string; // HH:MM:SS
}

export interface ReportingWindowStatus {
  cairo: CairoTimeParts;
  isMorningGracePeriod: boolean; // 12:00 AM to 8:59:59 AM
  todayDate: string; // YYYY-MM-DD
  yesterdayDate: string; // YYYY-MM-DD
  allowedDates: string[]; // [yesterday, today] if before 9am, else [today]
  minAllowedDate: string;
  maxAllowedDate: string;
  activeDeadlineLabel: {
    ar: string;
    en: string;
  };
  policyNotice: {
    ar: string;
    en: string;
  };
  secondsRemaining: number;
  formattedCountdown: string; // HH:MM:SS
  urgency: 'normal' | 'warning' | 'urgent'; // normal (green), warning (amber), urgent (red pulse)
  yesterdayReportingOpen: boolean;
  todayReportingOpen: boolean;
}

export function getCairoParts(now: Date = new Date()): CairoTimeParts {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  const parts = formatter.formatToParts(now);
  const map: Record<string, string> = {};
  for (const part of parts) {
    map[part.type] = part.value;
  }

  const hour = parseInt(map.hour || '0', 10);
  const minute = parseInt(map.minute || '0', 10);
  const second = parseInt(map.second || '0', 10);
  const dateStr = `${map.year}-${map.month}-${map.day}`;
  const timeStr = `${map.hour}:${map.minute}:${map.second}`;

  return {
    year: map.year || '1970',
    month: map.month || '01',
    day: map.day || '01',
    hour,
    minute,
    second,
    dateStr,
    timeStr,
  };
}

export function getYesterdayDateString(todayDateStr: string): string {
  const d = new Date(`${todayDateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function formatCountdown(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const seconds = clamped % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export const formatTimeRemaining = formatCountdown;


export function isDateSubmissionOpen(reportDate: string, now: Date = new Date()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(reportDate)) return false;
  const cairo = getCairoParts(now);
  const today = cairo.dateStr;

  // Future dates are never allowed
  if (reportDate > today) return false;

  // Today is always open for reporting
  if (reportDate === today) return true;

  // Yesterday is only open if current Cairo time is strictly before 09:00:00 AM
  const yesterday = getYesterdayDateString(today);
  if (reportDate === yesterday) {
    return cairo.hour < 9;
  }

  // Any date older than yesterday is permanently closed
  return false;
}

export function getReportingWindowStatus(now: Date = new Date()): ReportingWindowStatus {
  const cairo = getCairoParts(now);
  const todayDate = cairo.dateStr;
  const yesterdayDate = getYesterdayDateString(todayDate);
  const isMorningGracePeriod = cairo.hour < 9;

  let secondsRemaining = 0;
  let urgency: 'normal' | 'warning' | 'urgent' = 'normal';
  let activeDeadlineLabel = {
    ar: '',
    en: '',
  };

  if (isMorningGracePeriod) {
    // Grace period for yesterday's reports (from 12:00 AM to 9:00 AM)
    // Target is today at 09:00:00 AM Cairo time
    secondsRemaining = (8 - cairo.hour) * 3600 + (59 - cairo.minute) * 60 + (60 - cairo.second);
    if (cairo.hour === 8) {
      urgency = 'urgent'; // Final hour before 9:00 AM
    } else {
      urgency = 'warning'; // 12:00 AM - 7:59 AM
    }

    activeDeadlineLabel = {
      ar: 'مهلة تقارير الأمس تنتهي 9:00 ص',
      en: "Yesterday's Reports Cutoff: 9:00 AM",
    };
  } else {
    // Normal daytime / evening window (9:00 AM to 11:59:59 PM)
    // Target is tomorrow at 09:00:00 AM Cairo time
    // Hours left today: (23 - hour), plus 9 hours tomorrow = 32 - hour
    secondsRemaining = (31 - cairo.hour) * 3600 + (59 - cairo.minute) * 60 + (60 - cairo.second);
    urgency = 'normal';

    activeDeadlineLabel = {
      ar: 'مهلة تقارير اليوم حتى غداً 9:00 ص',
      en: "Today's Reports Cutoff: Tomorrow 9:00 AM",
    };
  }

  const allowedDates = isMorningGracePeriod ? [yesterdayDate, todayDate] : [todayDate];
  const minAllowedDate = isMorningGracePeriod ? yesterdayDate : todayDate;
  const maxAllowedDate = todayDate;

  const policyNotice = {
    ar: 'يجب تسجيل جميع تقارير الزيارات والأنشطة بحد أقصى اليوم التالي الساعة 9:00 صباحاً (فترة السماح من 12:00 ص إلى 9:00 ص). بعد هذا الوقت لا يقبل النظام تسجيل أي تقارير.',
    en: 'All visit and activity reporting must be submitted at the latest by 9:00 AM the next day (12:00 AM to 9:00 AM grace period). After this time, the system will not accept reporting.',
  };

  return {
    cairo,
    isMorningGracePeriod,
    todayDate,
    yesterdayDate,
    allowedDates,
    minAllowedDate,
    maxAllowedDate,
    activeDeadlineLabel,
    policyNotice,
    secondsRemaining,
    formattedCountdown: formatCountdown(secondsRemaining),
    urgency,
    yesterdayReportingOpen: isMorningGracePeriod,
    todayReportingOpen: true,
  };
}
