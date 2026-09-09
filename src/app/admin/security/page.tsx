import { AdminSecurity } from '@/components/admin/AdminSecurity'; import { requireAdminPage } from '@/lib/adminPageAuth';
export default async function SecurityPage() { await requireAdminPage(); return <AdminSecurity/>; }
