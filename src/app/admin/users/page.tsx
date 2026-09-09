import { AdminUsers } from '@/components/admin/AdminUsers'; import { requireAdminPage } from '@/lib/adminPageAuth';
export default async function UsersPage() { await requireAdminPage(); return <AdminUsers/>; }
