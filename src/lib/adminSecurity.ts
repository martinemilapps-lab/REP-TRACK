import type { NextRequest } from 'next/server';
import { AppError } from '@/lib/errors';

const attempts = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_MUTATIONS = 12;

export function assertSameOrigin(request: Pick<NextRequest, 'headers' | 'nextUrl'>) {
  const origin = request.headers.get('origin');
  const fetchSite = request.headers.get('sec-fetch-site');
  if (origin && origin !== request.nextUrl.origin) throw new AppError('Cross-origin mutation rejected', 403);
  if (!origin && fetchSite && !['same-origin', 'same-site', 'none'].includes(fetchSite)) throw new AppError('Cross-origin mutation rejected', 403);
}

export function assertAdminMutationRate(key: string, now = Date.now()) {
  const recent = (attempts.get(key) ?? []).filter((time) => now - time < WINDOW_MS);
  if (recent.length >= MAX_MUTATIONS) throw new AppError('Too many security operations. Try again shortly.', 429);
  recent.push(now);
  attempts.set(key, recent);
}

export function assertAdminMutationRequest(request: NextRequest, adminId: string, operation: string) {
  assertSameOrigin(request);
  assertAdminMutationRate(`${adminId}:${operation}`);
}

export function noStoreHeaders() {
  return { 'Cache-Control': 'no-store, max-age=0', Pragma: 'no-cache' };
}
