import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', quiet: true });
import { client } from '../src/lib/db';

async function main() {
  const users = await client.execute('SELECT id, name, username, position_code, role, system_role, rep_id, is_active FROM users ORDER BY name') as any[];
  const assigns = await client.execute('SELECT sa.id, sa.user_id, u.name as user_name, sa.assignment_type, sa.territory_name, sa.rep_id, r.name as rep_name, r.area, sa.is_active FROM sales_assignments sa JOIN users u ON u.id = sa.user_id LEFT JOIN representatives r ON r.id = sa.rep_id WHERE sa.is_active = 1 ORDER BY u.name') as any[];
  const reps = await client.execute('SELECT id, name, area, is_active FROM representatives ORDER BY name') as any[];

  console.log(`TOTAL ACTIVE SALES ASSIGNMENTS: ${assigns.length}`);
  for (const a of assigns) {
    console.log(`${a.user_name.padEnd(22)} | type: ${a.assignment_type.padEnd(14)} | terr: ${(a.territory_name || '-').padEnd(25)} | repArea: ${a.area || '-'}`);
  }

  console.log('\n--- USERS WITHOUT PRIMARY SALES ASSIGNMENT ---');
  for (const u of users) {
    const userAssigns = assigns.filter(a => a.user_id === u.id);
    const prim = userAssigns.find(a => a.assignment_type === 'PRIMARY_REP');
    const rep = reps.find(r => r.id === u.rep_id);
    if (!prim && u.role === 'REPRESENTATIVE') {
      console.log(`MR MISSING PRIMARY ASSIGNMENT: ${u.name} (rep_id: ${u.rep_id}, rep area: ${rep?.area || 'NONE'})`);
    }
  }
}

main().catch(console.error);
