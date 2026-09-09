import * as dotenv from 'dotenv';
import { client } from '../src/lib/db';
import { parseAdminMigrationCommand, runAdminMigrationMode } from '../src/lib/db/adminPhase1Migration';

dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true });

async function main() {
  const command = parseAdminMigrationCommand(process.argv.slice(2), process.env.REP_TRACK_DATA_API_URL);
  const result = await runAdminMigrationMode(command.mode, client);
  console.log(`Detected required tables: ${result.preflight.detectedTables.join(', ')}`);
  console.log('Admin Phase 1 preflight: PASS');
  if (result.mode === 'preflight') {
    console.log('Read-only preflight completed. No migration statements were executed.');
    return;
  }
  console.log('Admin Phase 1 D1 migration completed and verified.', result.verification);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown migration error.';
  console.error(`Admin Phase 1 preflight/migration: FAIL. ${message}`);
  console.error('No success is claimed.');
  process.exitCode = 1;
});
