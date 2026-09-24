/**
 * Admin Database Control Service
 * Provides PM1 (admin) with full database manipulation capabilities:
 * - List all tables with row counts
 * - Browse/query any table
 * - Delete data for a specific user
 * - Delete all data EXCEPT one user
 * - Nuclear reset (danger zone) with password verification
 */
import { sql } from 'drizzle-orm';
import { db, client, users, sessions } from '@/lib/db';
import { eq, ne } from 'drizzle-orm';
import { AppError } from '@/lib/errors';
import type { UserSessionPayload } from '@/lib/auth';
import { assertAdminActor, recordAdminAudit } from './adminService';
import { verifyPassword } from '@/lib/services/passwordService';

// Tables that contain user-scoped data (keyed by repId or userId)
const USER_DATA_TABLES = [
  { table: 'hospital_visits', userCol: 'rep_id' },
  { table: 'pharmacy_visits', userCol: 'rep_id' },
  { table: 'doctor_visits', userCol: 'rep_id' },
  { table: 'branch_visits', userCol: 'rep_id' },
  { table: 'product_availabilities', userCol: 'rep_id' },
  { table: 'events', userCol: 'rep_id' },
  { table: 'trainings', userCol: 'rep_id' },
  { table: 'special_tasks', userCol: 'rep_id' },
  { table: 'weekly_plans', userCol: 'rep_id' },
  { table: 'daily_reports', userCol: 'rep_id' },
  { table: 'manager_activities', userCol: 'user_id' },
  { table: 'manager_weekly_plans', userCol: 'user_id' },
];

// Tables safe for nuclear reset (preserves structure)
const ALL_DATA_TABLES = [
  'hospital_visit_department_doctors',
  'hospital_visit_departments',
  'hospital_visit_doctors',
  'doctor_visit_products',
  'branch_visit_products',
  'manager_activity_products',
  'manager_activity_entry_doctors',
  'manager_activity_extended_entries',
  'manager_activity_entries',
  'hospital_visits',
  'pharmacy_visits',
  'doctor_visits',
  'branch_visits',
  'product_availabilities',
  'events',
  'trainings',
  'special_tasks',
  'weekly_plans',
  'daily_reports',
  'manager_activities',
  'manager_weekly_plans',
  'admin_audit_events',
  'sessions',
  'login_attempts',
  'hierarchy_paths',
  'organization_relationships',
  'manager_rep_scopes',
  'manager_area_scopes',
  'sales_assignments',
  'representative_visit_rates',
  'doctor_working_hospitals',
  'doctor_nearby_pharmacies',
  'doctors',
  'pharmacies',
  'hospitals',
  'distribution_branches',
  'products',
  'visit_objectives',
  'areas',
  'representatives',
  'users',
  'positions',
];

export interface TableInfo {
  name: string;
  rowCount: number;
}

export interface TableRowsResult {
  rows: Record<string, unknown>[];
  total: number;
  columns: string[];
}

/**
 * List all tables with row counts
 */
export async function listAllTables(admin: UserSessionPayload): Promise<TableInfo[]> {
  assertAdminActor(admin);
  const tables: TableInfo[] = [];
  for (const tableName of ALL_DATA_TABLES) {
    try {
      const result = await client.execute(`SELECT count(*) as cnt FROM "${tableName}"`, []);
      const cnt = Array.isArray(result) && result[0] ? Number((result[0] as Record<string, unknown>).cnt ?? 0) : 0;
      tables.push({ name: tableName, rowCount: cnt });
    } catch {
      tables.push({ name: tableName, rowCount: -1 });
    }
  }
  return tables;
}

/**
 * Browse rows in any table with pagination
 */
export async function browseTable(admin: UserSessionPayload, tableName: string, page = 1, pageSize = 25): Promise<TableRowsResult> {
  assertAdminActor(admin);
  if (!ALL_DATA_TABLES.includes(tableName)) throw new AppError('Invalid table name', 400);
  const safeName = tableName.replace(/[^a-z_]/g, '');
  const offset = (Math.max(1, page) - 1) * Math.min(50, pageSize);
  const limit = Math.min(50, pageSize);
  const [rows, countResult] = await Promise.all([
    client.execute(`SELECT * FROM "${safeName}" LIMIT ? OFFSET ?`, [limit, offset]),
    client.execute(`SELECT count(*) as cnt FROM "${safeName}"`, []),
  ]);
  const total = Array.isArray(countResult) && countResult[0] ? Number((countResult[0] as Record<string, unknown>).cnt ?? 0) : 0;
  const dataRows = (Array.isArray(rows) ? rows : []) as Record<string, unknown>[];
  const columns = dataRows.length > 0 ? Object.keys(dataRows[0]) : [];
  return { rows: dataRows, total, columns };
}

/**
 * Delete specific rows by IDs from a table
 */
export async function deleteTableRows(admin: UserSessionPayload, tableName: string, rowIds: string[]): Promise<{ deleted: number }> {
  assertAdminActor(admin);
  if (!ALL_DATA_TABLES.includes(tableName)) throw new AppError('Invalid table name', 400);
  if (!rowIds.length) throw new AppError('No rows specified', 400);
  const safeName = tableName.replace(/[^a-z_]/g, '');
  const placeholders = rowIds.map(() => '?').join(',');
  await client.execute(`DELETE FROM "${safeName}" WHERE id IN (${placeholders})`, rowIds);
  await recordAdminAudit(admin.id, 'DB_ROWS_DELETED', 'TABLE', safeName, { count: rowIds.length });
  return { deleted: rowIds.length };
}

/**
 * Delete ALL data for a specific user (by user ID — resolves rep_id automatically)
 */
export async function deleteUserData(admin: UserSessionPayload, targetUserId: string): Promise<{ tablesAffected: number; totalDeleted: number }> {
  assertAdminActor(admin);
  const user = await db.select().from(users).where(eq(users.id, targetUserId)).get();
  if (!user) throw new AppError('User not found', 404);
  const repId = user.repId;
  let tablesAffected = 0;
  let totalDeleted = 0;
  for (const { table, userCol } of USER_DATA_TABLES) {
    const safeTable = table.replace(/[^a-z_]/g, '');
    const idValue = userCol === 'rep_id' ? repId : targetUserId;
    if (!idValue) continue;
    try {
      const countResult = await client.execute(`SELECT count(*) as cnt FROM "${safeTable}" WHERE "${userCol}" = ?`, [idValue]);
      const cnt = Array.isArray(countResult) && countResult[0] ? Number((countResult[0] as Record<string, unknown>).cnt ?? 0) : 0;
      if (cnt > 0) {
        await client.execute(`DELETE FROM "${safeTable}" WHERE "${userCol}" = ?`, [idValue]);
        tablesAffected++;
        totalDeleted += cnt;
      }
    } catch (e) {
      console.warn(`Failed to clean ${safeTable}:`, e);
    }
  }
  await recordAdminAudit(admin.id, 'USER_DATA_PURGED', 'USER', targetUserId, { tablesAffected, totalDeleted, username: user.username });
  return { tablesAffected, totalDeleted };
}

/**
 * Delete ALL data EXCEPT data belonging to one specific user
 */
export async function deleteAllExceptUser(admin: UserSessionPayload, keepUserId: string): Promise<{ tablesAffected: number; totalDeleted: number }> {
  assertAdminActor(admin);
  const user = await db.select().from(users).where(eq(users.id, keepUserId)).get();
  if (!user) throw new AppError('User to keep not found', 404);
  const keepRepId = user.repId;
  let tablesAffected = 0;
  let totalDeleted = 0;
  for (const { table, userCol } of USER_DATA_TABLES) {
    const safeTable = table.replace(/[^a-z_]/g, '');
    const keepValue = userCol === 'rep_id' ? keepRepId : keepUserId;
    try {
      let countResult;
      let deleteQuery;
      if (keepValue) {
        countResult = await client.execute(`SELECT count(*) as cnt FROM "${safeTable}" WHERE "${userCol}" != ?`, [keepValue]);
        deleteQuery = `DELETE FROM "${safeTable}" WHERE "${userCol}" != ?`;
      } else {
        countResult = await client.execute(`SELECT count(*) as cnt FROM "${safeTable}"`, []);
        deleteQuery = `DELETE FROM "${safeTable}"`;
      }
      const cnt = Array.isArray(countResult) && countResult[0] ? Number((countResult[0] as Record<string, unknown>).cnt ?? 0) : 0;
      if (cnt > 0) {
        if (keepValue) {
          await client.execute(deleteQuery, [keepValue]);
        } else {
          await client.execute(deleteQuery, []);
        }
        tablesAffected++;
        totalDeleted += cnt;
      }
    } catch (e) {
      console.warn(`Failed to clean ${safeTable}:`, e);
    }
  }
  await recordAdminAudit(admin.id, 'DATA_PURGED_EXCEPT_USER', 'USER', keepUserId, { tablesAffected, totalDeleted, keptUsername: user.username });
  return { tablesAffected, totalDeleted };
}

/**
 * NUCLEAR RESET — Delete ALL data from ALL tables.
 * Requires admin password verification. Extremely dangerous.
 */
export async function nuclearReset(admin: UserSessionPayload, password: string): Promise<{ tablesCleared: number; totalRowsDeleted: number }> {
  assertAdminActor(admin);
  // Verify the admin's password
  const adminUser = await db.select().from(users).where(eq(users.id, admin.id)).get();
  if (!adminUser) throw new AppError('Admin user not found', 404);
  const valid = verifyPassword(password, adminUser.passwordHash);
  if (!valid) throw new AppError('Invalid password. Nuclear reset aborted.', 403);

  let tablesCleared = 0;
  let totalRowsDeleted = 0;
  for (const tableName of ALL_DATA_TABLES) {
    // Never delete the admin's own user record
    if (tableName === 'users') {
      try {
        const countResult = await client.execute(`SELECT count(*) as cnt FROM users WHERE id != ?`, [admin.id]);
        const cnt = Array.isArray(countResult) && countResult[0] ? Number((countResult[0] as Record<string, unknown>).cnt ?? 0) : 0;
        if (cnt > 0) {
          await client.execute(`DELETE FROM users WHERE id != ?`, [admin.id]);
          tablesCleared++;
          totalRowsDeleted += cnt;
        }
      } catch (e) {
        console.warn('Failed to clear users:', e);
      }
      continue;
    }
    if (tableName === 'positions') continue; // Preserve system positions
    const safeName = tableName.replace(/[^a-z_]/g, '');
    try {
      const countResult = await client.execute(`SELECT count(*) as cnt FROM "${safeName}"`, []);
      const cnt = Array.isArray(countResult) && countResult[0] ? Number((countResult[0] as Record<string, unknown>).cnt ?? 0) : 0;
      if (cnt > 0) {
        await client.execute(`DELETE FROM "${safeName}"`, []);
        tablesCleared++;
        totalRowsDeleted += cnt;
      }
    } catch (e) {
      console.warn(`Failed to clear ${safeName}:`, e);
    }
  }
  await recordAdminAudit(admin.id, 'NUCLEAR_RESET', 'SYSTEM', 'ALL', { tablesCleared, totalRowsDeleted });
  return { tablesCleared, totalRowsDeleted };
}
