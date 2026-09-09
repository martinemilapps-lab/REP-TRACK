export type CredentialCsvRow = { name:string; username:string; position:string; temporaryPassword:string; status:string };
export const neutralizeSpreadsheetCell = (value:string) => /^[\s]*[=+\-@\t\r\n]/.test(value) ? `'${value}` : value;
const escapeCsv = (value: string) => `"${neutralizeSpreadsheetCell(value).replaceAll('"', '""')}"`;
export function createCredentialCsv(rows: CredentialCsvRow[]) {
  return ['Name,Username,Position,Temporary Password,Status', ...rows.map((row) => [row.name, row.username, row.position, row.temporaryPassword, row.status].map(escapeCsv).join(','))].join('\r\n');
}
