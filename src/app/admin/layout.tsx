import type { ReactNode } from 'react'; import { AdminShell } from '@/components/admin/AdminShell'; import { requireAdminPage } from '@/lib/adminPageAuth';
export const dynamic = 'force-dynamic';
export default async function AdminLayout({ children }: { children: ReactNode }) { const admin = await requireAdminPage(); return <AdminShell user={{ name: admin.name, username: admin.username }}>{children}</AdminShell>; }
