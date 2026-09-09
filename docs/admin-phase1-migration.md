# Admin Phase 1 D1 migration

This migration creates the immutable `admin_audit_events` table, lookup indexes, and database triggers that reject updates or deletes. It does not change or delete existing business data.

## Read-only preflight

Confirm the target contains both `users` and `sessions`. The migration runner performs this read-only query before applying SQL:

Run the independent read-only mode with:

```text
npm run db:migrate:d1:admin-phase1 -- --preflight-admin-phase1
```

This mode requires `REP_TRACK_DATA_API_URL`, prints the detected required tables and a PASS/FAIL result, and exits without running the migration or verification statements.

```sql
SELECT name FROM sqlite_master
WHERE type = 'table' AND name IN ('users', 'sessions')
ORDER BY name;
```

## Human-approved execution

No remote migration is run automatically. After reviewing the exact target and SQL:

```text
npm run db:migrate:d1:admin-phase1 -- --apply-admin-phase1
```

The command requires both an explicit `REP_TRACK_DATA_API_URL` and the apply approval flag. The preflight and apply flags are mutually exclusive; missing, conflicting, and unknown flags fail closed.

## Verification

```sql
SELECT name FROM sqlite_master
WHERE type IN ('table', 'index', 'trigger')
  AND (name = 'admin_audit_events' OR name LIKE 'idx_admin_audit_%' OR name LIKE 'trg_admin_audit_%')
ORDER BY type, name;
```
