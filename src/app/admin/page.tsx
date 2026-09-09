import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth';

export default async function AdminCompatibilityPage() {
  const session = await getServerSession();
  redirect(session?.systemRole === 'ADMIN' && !session.mustChangePassword ? '/?view=admin' : '/');
}
