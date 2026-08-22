export type VisitStatusType = 'Visited' | 'Overdue' | 'Not visited yet';

/**
 * Returns today's date formatted as YYYY-MM-DD in Africa/Cairo timezone.
 */
export function getCairoTodayString(): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Cairo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

/**
 * Calculates the number of calendar days between two YYYY-MM-DD strings using UTC math.
 */
export function calculateDaysBetween(fromDateStr: string, toDateStr: string): number {
  const [y1, m1, d1] = fromDateStr.split('-').map(Number);
  const [y2, m2, d2] = toDateStr.split('-').map(Number);

  if (!y1 || !m1 || !d1 || !y2 || !m2 || !d2) return 0;

  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);

  return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
}

/**
 * Deterministically derives visit compliance status at read/query time.
 * Single Authoritative Source of Truth.
 */
export function deriveVisitStatus(params: {
  lastVisitDate?: string | null; // YYYY-MM-DD
  nextVisitDate?: string | null; // YYYY-MM-DD
  cycleDays?: number | null;
  referenceDate?: string;        // YYYY-MM-DD
}): VisitStatusType {
  const today = params.referenceDate || getCairoTodayString();

  // 1. Check scheduled next visit date
  if (params.nextVisitDate && params.nextVisitDate.trim().length === 10) {
    const nextClean = params.nextVisitDate.trim();
    if (nextClean < today) {
      return 'Overdue';
    }
  }

  // 2. Check cycle elapsed from last visit
  if (params.lastVisitDate && params.lastVisitDate.trim().length === 10) {
    const lastClean = params.lastVisitDate.trim();
    if (params.cycleDays && params.cycleDays > 0) {
      const daysElapsed = calculateDaysBetween(lastClean, today);
      if (daysElapsed > params.cycleDays) {
        return 'Overdue';
      }
    }
    return 'Visited';
  }

  return 'Not visited yet';
}

export function statusToBucket(status?: string | null): 'visited' | 'overdue' | 'notvisited' {
  const s = (status || '').toLowerCase();
  if (s.includes('overdue')) return 'overdue';
  if (s.includes('not')) return 'notvisited';
  if (s.includes('visited')) return 'visited';
  return 'notvisited';
}
