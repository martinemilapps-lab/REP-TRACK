import type { MasterListsPayload } from '@/types';

const LIST_KEYS = ['hospitals', 'pharmacies', 'doctors', 'branches'] as const;

/** Reject malformed API responses instead of letting a category click crash React. */
export function normalizeMasterListsPayload(value: unknown): MasterListsPayload {
  if (!value || typeof value !== 'object') throw new Error('Invalid My Lists response');
  const record = value as Record<string, unknown>;
  for (const key of LIST_KEYS) {
    if (!Array.isArray(record[key])) throw new Error(`Invalid My Lists response: ${key}`);
  }
  return {
    hospitals: record.hospitals as MasterListsPayload['hospitals'],
    pharmacies: record.pharmacies as MasterListsPayload['pharmacies'],
    doctors: record.doctors as MasterListsPayload['doctors'],
    branches: record.branches as MasterListsPayload['branches'],
  };
}
