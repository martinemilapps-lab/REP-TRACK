import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { db, representatives, users, products } from './index';
import { hashSync } from 'bcrypt-ts';
import { INITIAL_REPRESENTATIVES, PRODUCTS_LIST } from '../constants';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('🌱 Starting database seed...');

  // 1. Seed Manager Account
  const managerUsername = 'manager';
  const managerPassword = process.env.MANAGER_DEFAULT_PASSWORD || '22515215monna';
  const managerHash = hashSync(managerPassword, 10);

  const existingManager = await db
    .select()
    .from(users)
    .where(eq(users.username, managerUsername))
    .get();

  if (!existingManager) {
    await db.insert(users).values({
      username: managerUsername,
      passwordHash: managerHash,
      name: 'مدير المبيعات (Sales Manager)',
      role: 'MANAGER',
    });
    console.log('✅ Created Manager account');
  } else {
    console.log('ℹ️ Manager account already exists');
  }

  // 2. Seed Representatives & Rep User Accounts
  for (const rep of INITIAL_REPRESENTATIVES) {
    const existingRep = await db
      .select()
      .from(representatives)
      .where(eq(representatives.name, rep.name))
      .get();

    let repDbId = rep.id;

    if (!existingRep) {
      const inserted = await db
        .insert(representatives)
        .values({
          id: rep.id,
          name: rep.name,
          area: rep.area,
          assignedHospitals: rep.assignedHospitals,
          assignedPharmacies: rep.assignedPharmacies,
          assignedDrs: rep.assignedDrs,
          isActive: true,
        })
        .returning();
      repDbId = inserted[0]?.id || rep.id;
      console.log(`✅ Seeded Representative: ${rep.name}`);
    } else {
      repDbId = existingRep.id;
    }

    // Create user login for rep (username: sanitized lowercase rep name without spaces, default pass: 'rep123456')
    const username = rep.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .get();

    if (!existingUser) {
      await db.insert(users).values({
        username,
        passwordHash: hashSync('rep123456', 10),
        name: rep.name,
        role: 'REPRESENTATIVE',
        repId: repDbId,
      });
      console.log(`✅ Created Rep Login User: ${username}`);
    }
  }

  // 3. Seed Products List
  for (const prodName of PRODUCTS_LIST) {
    const existingProd = await db
      .select()
      .from(products)
      .where(eq(products.name, prodName))
      .get();

    if (!existingProd) {
      await db.insert(products).values({
        name: prodName,
        isActive: true,
      });
      console.log(`✅ Seeded Product: ${prodName}`);
    }
  }

  console.log('🎉 Seeding completed successfully!');
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
