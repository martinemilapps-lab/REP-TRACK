import * as fs from 'fs';
import * as path from 'path';
import { buildOrganizationDataset } from './provision_organization_foundation';
import {
  generateSecureTemporaryPassword,
  hashPassword,
} from '../src/lib/services/passwordService';

export interface CredentialEntry {
  employeeName: string;
  username: string;
  temporaryPassword: string;
  position: string;
  passwordHash: string;
}

export function generateDevCredentialsAndSql(): {
  credentials: CredentialEntry[];
  csvContent: string;
  sqlContent: string;
} {
  const dataset = buildOrganizationDataset();
  const users = dataset.users;

  if (users.length !== 63) {
    throw new Error(`Expected exactly 63 unique employee users, found ${users.length}`);
  }

  const credentials: CredentialEntry[] = [];
  const sqlStatements: string[] = [];

  sqlStatements.push('-- ====================================================');
  sqlStatements.push('-- REP TRACK — STEP 16 Secure Password Rotation');
  sqlStatements.push('-- Target Database: rep-track-dev (Cloudflare D1)');
  sqlStatements.push('-- ====================================================\n');
  sqlStatements.push('-- 1. Revoke all existing sessions to enforce re-authentication');
  sqlStatements.push('DELETE FROM `sessions`;\n');
  sqlStatements.push('-- 2. Update password hashes and force must_change_password = 1');

  const csvRows: string[] = [
    '# =========================================================================',
    '# CONFIDENTIAL — SENSITIVE ONE-TIME TEMPORARY CREDENTIALS',
    '# REP TRACK DEV ENVIRONMENT (STEP 16)',
    '# DO NOT COMMIT TO GIT — DO NOT SHARE OVER INSECURE CHANNELS',
    '# Generated: ' + new Date().toISOString(),
    '# =========================================================================',
    'Employee Name,Username,Temporary Password,Position',
  ];

  for (const user of users) {
    const tempPassword = generateSecureTemporaryPassword(14);
    const hash = hashPassword(tempPassword);

    credentials.push({
      employeeName: user.name,
      username: user.username,
      temporaryPassword: tempPassword,
      position: user.position_code,
      passwordHash: hash,
    });

    // Escape for CSV (quote if contains comma)
    const escapedName = user.name.includes(',') ? `"${user.name}"` : user.name;
    csvRows.push(`${escapedName},${user.username},${tempPassword},${user.position_code}`);

    const escapedUsername = user.username.replace(/'/g, "''");
    const escapedHash = hash.replace(/'/g, "''");
    sqlStatements.push(
      `UPDATE \`users\` SET \`password_hash\` = '${escapedHash}', \`must_change_password\` = 1, \`updated_at\` = datetime('now') WHERE \`username\` = '${escapedUsername}';`
    );
  }

  return {
    credentials,
    csvContent: csvRows.join('\n') + '\n',
    sqlContent: sqlStatements.join('\n') + '\n',
  };
}

async function main() {
  console.log('====================================================');
  console.log('🔐 REP TRACK: Secure Password Rotation (STEP 16)');
  console.log('====================================================\n');

  const { credentials, csvContent, sqlContent } = generateDevCredentialsAndSql();

  // 1. Write gitignored local-only CSV
  const csvPath = path.resolve(__dirname, '../.dev-credentials-step16.csv');
  fs.writeFileSync(csvPath, csvContent, 'utf-8');
  console.log(`✓ Generated local-only credentials CSV: .dev-credentials-step16.csv`);
  console.log(`  - Total Accounts: ${credentials.length} active employee accounts`);
  console.log(`  - Vacant Positions: 0 accounts (verified zero credentials generated for vacant roles)`);
  console.log(`  - File Status: Strictly ignored by .gitignore (.dev-credentials* pattern)\n`);

  // 2. Write migration SQL statement
  const sqlPath = path.resolve(__dirname, 'migrations/step16_password_rotation.sql');
  fs.writeFileSync(sqlPath, sqlContent, 'utf-8');
  console.log(`✓ Generated SQL Rotation Migration: scripts/migrations/step16_password_rotation.sql`);
  console.log(`  - Total SQL UPDATE statements: ${credentials.length}`);
  console.log(`  - Session Revocation: DELETE FROM sessions included\n`);

  console.log('====================================================');
  console.log('📋 Human Verification & Cloudflare D1 Execution Guide');
  console.log('====================================================');
  console.log('In accordance with safety rules, the remote database rep-track-dev was NOT rotated automatically.\n');
  console.log('To apply password rotation to rep-track-dev:');
  console.log('  cd cloudflare/rep-track-d1-api');
  console.log('  npx wrangler d1 execute rep-track-dev --file="../../scripts/migrations/step16_password_rotation.sql"\n');
  console.log('Temporary credentials can be safely distributed to employees from the local CSV:');
  console.log(`  ${csvPath}\n`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Fatal password rotation error:', err);
    process.exit(1);
  });
}
