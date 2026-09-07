# STEP 19 D1 migration — prepared, not applied

The authoritative runtime is Next.js → Worker data gateway → Cloudflare D1.
`npm run db:migrate` uses Drizzle Kit and `file:local.db`; it does **not** migrate D1.

## Exact migration awaiting human approval

`scripts/migrations/step19_manager_personal.sql` creates the two manager tables
and their indexes if absent, then creates the unique index
`idx_mgr_weekly_plans_user_week` on `manager_weekly_plans(user_id, start_date)`.
It does not change MR tables or add hierarchy routing. Existing rows are preserved.

Before approval, the operator must confirm the Worker URL, its bound D1 database,
the environment, and a recoverable backup. Existing `users` and STEP 18 tables
are prerequisites. Review the SQL and check any existing manager table schema
against `src/lib/db/schema.ts`. `IF NOT EXISTS` does not repair a divergent table.

If `manager_weekly_plans` already exists, an approved read-only preflight is:

```sql
SELECT user_id, start_date, COUNT(*) AS plan_count
FROM manager_weekly_plans
GROUP BY user_id, start_date
HAVING COUNT(*) > 1;
```

Duplicates require a separate human decision about which data to retain. This
migration intentionally fails rather than deleting or merging those records.
Existing invalid statuses/dates should also be reviewed; this migration does not
silently rewrite them. Personal-plan saves now permit only `Submitted` and no
administrative notes. There is no personal approval workflow in STEP 19.

Only after explicit approval for the chosen target, configure the existing
server-only `REP_TRACK_DATA_API_URL` and `REP_TRACK_DATA_API_SECRET` without
printing their values, then run from the repository root:

```text
npm run db:migrate:d1:step19 -- --apply-step19
```

This command executes the reviewed SQL through the existing authenticated Worker
gateway. It requires an explicit URL, with no development-target fallback.
It is not invoked by build, tests, or application startup. Do not run it against
production or preview without separate authorization.

Statements execute sequentially. Any failure stops execution and exits nonzero;
earlier successful DDL may remain. After resolving the cause, rerunning is
idempotent. Verify both tables and the unique index on the approved target before
releasing this application version. The atomic personal-plan upsert requires that
index. Do not drop the tables as a rollback: restore the previous application and
preserve collected records while reviewing a rollback plan.

The older `src/lib/db/migrate.ts` is a broader legacy migration path. It now fails
on unexpected errors and requires `--apply-existing-d1-migrations` plus an explicit
target. It is **not** the STEP 19-only command above.

Local tests run this exact SQL against in-memory SQLite and exercise services via
the Drizzle proxy with network access blocked. They do not prove remote application.
