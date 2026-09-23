import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const rootDir = path.resolve(__dirname, '..');
  const backupPath = path.join(rootDir, 'd1_backup.sql');
  const resetSqlPath = path.join(rootDir, 'scripts/system_reset.sql');

  const backupContent = fs.readFileSync(backupPath, 'utf8');
  const resetSqlContent = fs.readFileSync(resetSqlPath, 'utf8');

  // 1. Extract all CREATE TABLE statements from d1_backup.sql
  const ddlStatements: string[] = [];
  const backupLines = backupContent.split(/\r?\n/);
  let currentCreateTable = '';
  let inCreateTable = false;

  for (const line of backupLines) {
    if (line.startsWith('CREATE TABLE ')) {
      inCreateTable = true;
      currentCreateTable = line.replace('CREATE TABLE ', 'CREATE TABLE IF NOT EXISTS ') + '\n';
      if (line.trim().endsWith(');')) {
        ddlStatements.push(currentCreateTable.trim());
        currentCreateTable = '';
        inCreateTable = false;
      }
    } else if (inCreateTable) {
      currentCreateTable += line + '\n';
      if (line.trim().endsWith(');')) {
        ddlStatements.push(currentCreateTable.trim());
        currentCreateTable = '';
        inCreateTable = false;
      }
    }
  }

  // Ensure `users` DDL includes business_line and must_change_password
  for (let i = 0; i < ddlStatements.length; i++) {
    if (ddlStatements[i].includes('CREATE TABLE IF NOT EXISTS `users`') || ddlStatements[i].includes('CREATE TABLE IF NOT EXISTS "users"')) {
      if (!ddlStatements[i].includes('business_line')) {
        ddlStatements[i] = ddlStatements[i].replace(
          /\bposition_code TEXT,/i,
          'position_code TEXT, business_line INTEGER,'
        );
      }
    }
  }

  console.log(`Extracted ${ddlStatements.length} CREATE TABLE statements from backup.`);

  // 2. Extract only INSERT statements from system_reset.sql
  const insertStatements: string[] = [];
  const resetLines = resetSqlContent.split(/\r?\n/);

  for (const line of resetLines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('INSERT INTO ')) {
      insertStatements.push(trimmed);
    }
  }

  console.log(`Extracted ${insertStatements.length} clean INSERT statements from system_reset.sql.`);

  // 3. Assemble complete FALLBACK_SQL
  const allSqlParts = [
    'PRAGMA defer_foreign_keys=TRUE;',
    ...ddlStatements,
    ...insertStatements,
  ];

  const combinedSql = allSqlParts.join('\n');

  // 4. Write to src/lib/db/fallbackData.ts
  const tsContent = `/**
 * Embedded Fallback SQL Schema & Snapshot for REP TRACK
 * Authoritative Hierarchy, Synchronized Linking Titles, Pure Fawzy Nasser ({MR11}) Data.
 * Used when Cloudflare D1 reaches daily row read limits or is temporarily unreachable.
 */
export const FALLBACK_SQL = ${JSON.stringify(combinedSql)};
`;

  const fallbackDataPath = path.join(rootDir, 'src/lib/db/fallbackData.ts');
  fs.writeFileSync(fallbackDataPath, tsContent, 'utf8');
  console.log(`\n✓ Successfully updated ${fallbackDataPath} (${tsContent.length} bytes).`);
}

main().catch(console.error);
