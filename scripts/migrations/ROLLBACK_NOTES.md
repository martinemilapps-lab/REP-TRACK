# REP TRACK — STEP 15B Migration & Rollback Guide

## Target Database: `rep-track-dev` (Cloudflare D1)

### 1. Manual Application Command (Cloudflare D1)
In accordance with STEP 15B safety rules, migrations are **NOT** executed automatically against the remote database.
When ready to apply manually from terminal:

```bash
# Step 1: Navigate to the Worker directory
cd cloudflare/rep-track-d1-api

# Step 2: Execute Schema Migration
npx wrangler d1 execute rep-track-dev --file="../../scripts/migrations/step15b_organization_foundation.sql"

# Step 3: Execute Organization & Sales Foundation Data Migration
npx wrangler d1 execute rep-track-dev --file="../../scripts/migrations/step15b_organization_data.sql"
```

---

### 2. Safety & Non-Destructive Invariants
- **Existing Visit & Fact Records**: Untouched. `hospital_visits`, `pharmacy_visits`, `doctor_visits`, `branch_visits`, `product_availabilities`, `weekly_plans`, `events`, `trainings`, and `special_tasks` are completely preserved.
- **Master Customer Records**: `hospitals`, `pharmacies`, `doctors`, and `distribution_branches` remain fully intact.
- **Backward Compatibility**: `manager_rep_scopes` and `manager_area_scopes` are maintained and regenerated with complete coverage.

---

### 3. Rollback & Recovery Procedures
If rollback of STEP 15B schema additions is required on `rep-track-dev`:

#### Option A: Drop STEP 15B Additions Only (Targeted Rollback)
```sql
-- Drop Step 15B new tables
DROP TABLE IF EXISTS `hierarchy_paths`;
DROP TABLE IF EXISTS `organization_relationships`;
DROP TABLE IF EXISTS `sales_assignments`;

-- Existing users, representatives, hospitals, and visits remain completely intact.
```

#### Option B: Cloudflare D1 Point-in-Time Recovery / Backup
Cloudflare D1 provides automated daily backups and point-in-time recovery via:
```bash
# List available D1 database backups
npx wrangler d1 backups list rep-track-dev

# Restore from a previous backup if needed
npx wrangler d1 backups restore rep-track-dev <BACKUP_ID>
```
