import { db, users } from '@/lib/db';
import { inArray } from 'drizzle-orm';
import { hierarchyService } from '@/lib/services/hierarchyService';

async function main() {
  const usernames = ['MR36', 'DM6', 'BUM2'];
  const foundUsers = await db.select().from(users).where(inArray(users.username, usernames));

  for (const u of foundUsers) {
    if (u.role !== 'MANAGER') continue;
    const session = {
      id: u.id,
      username: u.username,
      role: u.role as 'MANAGER',
      positionCode: u.positionCode,
      systemRole: u.systemRole,
      repId: u.repId,
      name: u.name,
      businessLine: u.businessLine,
      mustChangePassword: false,
    };
    const scopedReps = await hierarchyService.getScopedRepresentatives(session);
    console.log(`\nManager ${u.username} (${u.positionCode}):`);
    console.log(`  Can see ${scopedReps.length} representatives:`, scopedReps.map(r => `${r.name} (${r.id})`));
  }
}

main().catch(console.error);
