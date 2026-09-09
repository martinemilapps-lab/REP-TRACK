export type CredentialCsvRow = { name:string; username:string; position:string; temporaryPassword:string; status:string };
const escapeCsv = (value: string) => `"${value.replaceAll('"', '""')}"`;
export function createCredentialCsv(rows: CredentialCsvRow[]) {
  return ['Name,Username,Position,Temporary Password,Status', ...rows.map((row) => [row.name, row.username, row.position, row.temporaryPassword, row.status].map(escapeCsv).join(','))].join('\r\n');
}
