import { AdminAudit } from '@/components/admin/AdminAudit'; import { requireAdminPage } from '@/lib/adminPageAuth';
export default async function AuditPage() { await requireAdminPage(); return <AdminAudit/>; }
