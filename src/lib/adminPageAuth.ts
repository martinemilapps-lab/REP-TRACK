import { forbidden, unauthorized } from 'next/navigation';
import { getServerSession } from '@/lib/auth';

export async function requireAdminPage() {
  const session = await getServerSession();
  if (!session) unauthorized();
  if (session.mustChangePassword || session.systemRole !== 'ADMIN') forbidden();
  return session;
}
