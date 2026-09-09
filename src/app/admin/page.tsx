import { AdminOverview } from '@/components/admin/AdminOverview'; import { requireAdminPage } from '@/lib/adminPageAuth';
export default async function AdminPage() { await requireAdminPage(); return <AdminOverview/>; }
