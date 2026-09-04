import { db, hospitals, pharmacies, doctors, distributionBranches, representatives } from '@/lib/db';
import { eq, or, isNull, and, desc } from 'drizzle-orm';
import {
  MasterHospital,
  MasterPharmacy,
  MasterDoctor,
  MasterBranch,
  MasterListsPayload,
} from '@/types';

/**
 * Resolves repId from rep name or ID
 */
export async function resolveRepId(repIdOrName?: string): Promise<string | null> {
  if (!repIdOrName) return null;
  const rep = await db
    .select()
    .from(representatives)
    .where(or(eq(representatives.id, repIdOrName), eq(representatives.name, repIdOrName)))
    .get();
  return rep?.id || null;
}

/**
 * Retrieves all 4 master customer lists for a representative (plus global items)
 */
export async function getMasterListsForRep(repIdOrName?: string): Promise<MasterListsPayload> {
  const repId = await resolveRepId(repIdOrName);

  const [hList, pList, dList, bList] = await Promise.all([
    repId
      ? db
          .select()
          .from(hospitals)
          .where(or(eq(hospitals.repId, repId), isNull(hospitals.repId)))
          .orderBy(desc(hospitals.createdAt))
          .all()
      : db.select().from(hospitals).orderBy(desc(hospitals.createdAt)).all(),

    repId
      ? db
          .select()
          .from(pharmacies)
          .where(or(eq(pharmacies.repId, repId), isNull(pharmacies.repId)))
          .orderBy(desc(pharmacies.createdAt))
          .all()
      : db.select().from(pharmacies).orderBy(desc(pharmacies.createdAt)).all(),

    repId
      ? db
          .select()
          .from(doctors)
          .where(or(eq(doctors.repId, repId), isNull(doctors.repId)))
          .orderBy(desc(doctors.createdAt))
          .all()
      : db.select().from(doctors).orderBy(desc(doctors.createdAt)).all(),

    repId
      ? db
          .select()
          .from(distributionBranches)
          .where(or(eq(distributionBranches.repId, repId), isNull(distributionBranches.repId)))
          .orderBy(desc(distributionBranches.createdAt))
          .all()
      : db.select().from(distributionBranches).orderBy(desc(distributionBranches.createdAt)).all(),
  ]);

  return {
    hospitals: hList.map((h) => ({
      id: h.id,
      repId: h.repId || undefined,
      name: h.name,
      area: h.area,
      type: h.type,
      dept: h.dept || undefined,
      contact: h.contact || undefined,
      phone: h.phone || undefined,
      doctorNames: h.doctorNames || undefined,
      defaultCycle: h.defaultCycle ?? 7,
      targetProducts: h.targetProducts || undefined,
      createdAt: h.createdAt ? new Date(h.createdAt).toISOString() : undefined,
    })),
    pharmacies: pList.map((p) => ({
      id: p.id,
      repId: p.repId || undefined,
      name: p.name,
      area: p.area,
      address: p.address || undefined,
      pharmacist: p.pharmacist || undefined,
      mobile: p.mobile || undefined,
      classification: p.classification,
      defaultCycle: p.defaultCycle ?? 7,
      targetProducts: p.targetProducts || undefined,
      createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : undefined,
    })),
    doctors: dList.map((d) => ({
      id: d.id,
      repId: d.repId || undefined,
      code: d.code || undefined,
      name: d.name,
      specialty: d.specialty || undefined,
      workplace: d.workplace || undefined,
      area: d.area,
      address: d.address || undefined,
      mobile: d.mobile || undefined,
      classification: d.classification,
      bestTime: d.bestTime || undefined,
      defaultCycle: d.defaultCycle ?? 7,
      targetProducts: d.targetProducts || undefined,
      createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : undefined,
    })),
    branches: bList.map((b) => ({
      id: b.id,
      repId: b.repId || undefined,
      name: b.name,
      coverageArea: b.coverageArea,
      address: b.address || undefined,
      contact: b.contact || undefined,
      phone: b.phone || undefined,
      distributedProducts: b.distributedProducts || undefined,
      defaultCycle: b.defaultCycle ?? 7,
      createdAt: b.createdAt ? new Date(b.createdAt).toISOString() : undefined,
    })),
  };
}

/**
 * Hospital Operations
 */
export async function saveMasterHospital(data: Partial<MasterHospital> & { name: string; rep?: string }) {
  const repId = await resolveRepId(data.rep || data.repId);
  const cleanName = data.name.trim();
  const cleanArea = (data.area || '').trim();

  let targetId = data.id;
  if (!targetId) {
    const existing = await db
      .select()
      .from(hospitals)
      .where(and(eq(hospitals.name, cleanName), eq(hospitals.area, cleanArea)))
      .get();
    if (existing) {
      targetId = existing.id;
    }
  }

  if (targetId) {
    const [updated] = await db
      .update(hospitals)
      .set({
        name: cleanName,
        area: cleanArea,
        type: data.type || 'Private',
        dept: data.dept || null,
        contact: data.contact || null,
        phone: data.phone || null,
        doctorNames: data.doctorNames || null,
        defaultCycle: data.defaultCycle ?? 7,
        targetProducts: data.targetProducts || null,
        repId: repId || null,
        updatedAt: new Date(),
      })
      .where(eq(hospitals.id, targetId))
      .returning();
    return updated;
  }

  const [inserted] = await db
    .insert(hospitals)
    .values({
      name: cleanName,
      area: cleanArea,
      type: data.type || 'Private',
      dept: data.dept || null,
      contact: data.contact || null,
      phone: data.phone || null,
      doctorNames: data.doctorNames || null,
      defaultCycle: data.defaultCycle ?? 7,
      targetProducts: data.targetProducts || null,
      repId: repId || null,
    })
    .returning();
  return inserted;
}

/**
 * Pharmacy Operations
 */
export async function saveMasterPharmacy(data: Partial<MasterPharmacy> & { name: string; rep?: string }) {
  const repId = await resolveRepId(data.rep || data.repId);
  const cleanName = data.name.trim();
  const cleanArea = (data.area || '').trim();

  let targetId = data.id;
  if (!targetId) {
    const existing = await db
      .select()
      .from(pharmacies)
      .where(and(eq(pharmacies.name, cleanName), eq(pharmacies.area, cleanArea)))
      .get();
    if (existing) {
      targetId = existing.id;
    }
  }

  if (targetId) {
    const [updated] = await db
      .update(pharmacies)
      .set({
        name: cleanName,
        area: cleanArea,
        address: data.address || null,
        pharmacist: data.pharmacist || null,
        mobile: data.mobile || null,
        classification: data.classification || 'A',
        defaultCycle: data.defaultCycle ?? 7,
        targetProducts: data.targetProducts || null,
        repId: repId || null,
        updatedAt: new Date(),
      })
      .where(eq(pharmacies.id, targetId))
      .returning();
    return updated;
  }

  const [inserted] = await db
    .insert(pharmacies)
    .values({
      name: cleanName,
      area: cleanArea,
      address: data.address || null,
      pharmacist: data.pharmacist || null,
      mobile: data.mobile || null,
      classification: data.classification || 'A',
      defaultCycle: data.defaultCycle ?? 7,
      targetProducts: data.targetProducts || null,
      repId: repId || null,
    })
    .returning();
  return inserted;
}

/**
 * Doctor Operations
 */
export async function saveMasterDoctor(data: Partial<MasterDoctor> & { name: string; rep?: string }) {
  const repId = await resolveRepId(data.rep || data.repId);
  const cleanName = data.name.trim();
  const cleanArea = (data.area || '').trim();

  let targetId = data.id;
  if (!targetId) {
    const existing = await db
      .select()
      .from(doctors)
      .where(and(eq(doctors.name, cleanName), eq(doctors.area, cleanArea)))
      .get();
    if (existing) {
      targetId = existing.id;
    }
  }

  if (targetId) {
    const [updated] = await db
      .update(doctors)
      .set({
        code: data.code || null,
        name: cleanName,
        specialty: data.specialty || null,
        workplace: data.workplace || null,
        area: cleanArea,
        address: data.address || null,
        mobile: data.mobile || null,
        classification: data.classification || 'A',
        bestTime: data.bestTime || null,
        defaultCycle: data.defaultCycle ?? 7,
        targetProducts: data.targetProducts || null,
        repId: repId || null,
        updatedAt: new Date(),
      })
      .where(eq(doctors.id, targetId))
      .returning();
    return updated;
  }

  const [inserted] = await db
    .insert(doctors)
    .values({
      code: data.code || null,
      name: cleanName,
      specialty: data.specialty || null,
      workplace: data.workplace || null,
      area: cleanArea,
      address: data.address || null,
      mobile: data.mobile || null,
      classification: data.classification || 'A',
      bestTime: data.bestTime || null,
      defaultCycle: data.defaultCycle ?? 7,
      targetProducts: data.targetProducts || null,
      repId: repId || null,
    })
    .returning();
  return inserted;
}

/**
 * Distribution Branch Operations
 */
export async function saveMasterBranch(data: Partial<MasterBranch> & { name: string; rep?: string }) {
  const repId = await resolveRepId(data.rep || data.repId);
  const cleanName = data.name.trim();
  const cleanCoverage = (data.coverageArea || '').trim();

  let targetId = data.id;
  if (!targetId) {
    const existing = await db
      .select()
      .from(distributionBranches)
      .where(and(eq(distributionBranches.name, cleanName), eq(distributionBranches.coverageArea, cleanCoverage)))
      .get();
    if (existing) {
      targetId = existing.id;
    }
  }

  if (targetId) {
    const [updated] = await db
      .update(distributionBranches)
      .set({
        name: cleanName,
        coverageArea: cleanCoverage,
        address: data.address || null,
        contact: data.contact || null,
        phone: data.phone || null,
        distributedProducts: data.distributedProducts || null,
        defaultCycle: data.defaultCycle ?? 7,
        repId: repId || null,
        updatedAt: new Date(),
      })
      .where(eq(distributionBranches.id, targetId))
      .returning();
    return updated;
  }

  const [inserted] = await db
    .insert(distributionBranches)
    .values({
      name: cleanName,
      coverageArea: cleanCoverage,
      address: data.address || null,
      contact: data.contact || null,
      phone: data.phone || null,
      distributedProducts: data.distributedProducts || null,
      defaultCycle: data.defaultCycle ?? 7,
      repId: repId || null,
    })
    .returning();
  return inserted;
}

/**
 * Delete Master Item
 */
export async function deleteMasterItem(category: 'hospitals' | 'pharmacies' | 'doctors' | 'branches', id: string) {
  if (category === 'hospitals') {
    await db.delete(hospitals).where(eq(hospitals.id, id));
  } else if (category === 'pharmacies') {
    await db.delete(pharmacies).where(eq(pharmacies.id, id));
  } else if (category === 'doctors') {
    await db.delete(doctors).where(eq(doctors.id, id));
  } else if (category === 'branches') {
    await db.delete(distributionBranches).where(eq(distributionBranches.id, id));
  }
  return { success: true };
}
