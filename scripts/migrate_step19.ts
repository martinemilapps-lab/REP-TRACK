import * as dotenv from 'dotenv';
import { client } from '../src/lib/db';
import { applyStep19Migration, assertExplicitMigrationTarget } from '../src/lib/db/step19Migration';

dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true });

async function main() {
  assertExplicitMigrationTarget(process.env.REP_TRACK_DATA_API_URL, process.argv.includes('--apply-step19'));
  await applyStep19Migration(client);
  console.log('STEP 19 D1 migration completed successfully.');
}

main().catch(() => {
  console.error('STEP 19 migration failed or was not authorized. See docs/step19-migration.md. No success is claimed.');
  process.exitCode = 1;
});
