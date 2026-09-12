import { db, hospitals, pharmacies, doctors, distributionBranches, representatives, doctorWorkingHospitals, doctorNearbyPharmacies } from '@/lib/db';
import { eq, or, isNull, desc } from 'drizzle-orm';
import {
  MasterHospital,
  MasterPharmacy,
  MasterDoctor,
  MasterBranch,
  MasterListsPayload,
} from '@/types';
import { UserSessionPayload } from '@/lib/auth';
import { organizationService } from '@/lib/services/organizationService';
import { AppError } from '@/lib/errors';

/**
 * Resolves repId from representative name or ID
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
 * Resolves representative ownership strictly from the authenticated server session.
 * Never trusts or relies on browser input.
 */
export async function resolveRepOwnership(session: UserSessionPayload): Promise<string> {
  // If user is a manager without personal sales assignment, they cannot own representative lists
  if ((session.role === 'MANAGER' || session.systemRole === 'MANAGER') && !session.hasPersonalSalesAssignment) {
    throw new AppError('Forbidden: Managers without personal territory assignment cannot own representative lists', 403);
  }

  if (session.hasPersonalSalesAssignment && session.personalSalesAssignment?.repId) {
    return session.personalSalesAssignment.repId;
  }

  if (session.repId) {
    try {
      const existing = await db
        .select()
        .from(representatives)
        .where(eq(representatives.id, session.repId))
        .get();
      if (existing) return existing.id;
    } catch {
      return session.repId;
    }
  }

  const byName = await db
    .select()
    .from(representatives)
    .where(eq(representatives.name, session.name))
    .get();
  if (byName) return byName.id;

  // If representative row does not exist yet (e.g. test accounts), provision it securely
  const newRepId = session.repId || `rep-${session.username.toLowerCase()}`;
  const inserted = await db
    .insert(representatives)
    .values({
      id: newRepId,
      name: session.name,
      area: session.primarySalesAssignment?.territoryName || 'Unassigned',
      isActive: true,
    })
    .onConflictDoUpdate({
      target: representatives.id,
      set: { name: session.name, isActive: true },
    })
    .returning();

  return inserted[0]?.id || newRepId;
}

/**
 * Retrieves all 4 master customer lists for a representative
 */
export async function getMasterListsForRep(
  repIdOrName?: string,
  strictOwnership = false
): Promise<MasterListsPayload> {
  const repId = await resolveRepId(repIdOrName);

  const [hList, pList, dList, bList, doctorHospitalLinks, doctorPharmacyLinks] = await Promise.all([
    repId
      ? db
          .select()
          .from(hospitals)
          .where(strictOwnership ? eq(hospitals.repId, repId) : or(eq(hospitals.repId, repId), isNull(hospitals.repId)))
          .orderBy(desc(hospitals.createdAt))
          .all()
      : db.select().from(hospitals).orderBy(desc(hospitals.createdAt)).all(),

    repId
      ? db
          .select()
          .from(pharmacies)
          .where(strictOwnership ? eq(pharmacies.repId, repId) : or(eq(pharmacies.repId, repId), isNull(pharmacies.repId)))
          .orderBy(desc(pharmacies.createdAt))
          .all()
      : db.select().from(pharmacies).orderBy(desc(pharmacies.createdAt)).all(),

    repId
      ? db
          .select()
          .from(doctors)
          .where(strictOwnership ? eq(doctors.repId, repId) : or(eq(doctors.repId, repId), isNull(doctors.repId)))
          .orderBy(desc(doctors.createdAt))
          .all()
      : db.select().from(doctors).orderBy(desc(doctors.createdAt)).all(),

    repId
      ? db
          .select()
          .from(distributionBranches)
          .where(strictOwnership ? eq(distributionBranches.repId, repId) : or(eq(distributionBranches.repId, repId), isNull(distributionBranches.repId)))
          .orderBy(desc(distributionBranches.createdAt))
          .all()
      : db.select().from(distributionBranches).orderBy(desc(distributionBranches.createdAt)).all(),
    db.select().from(doctorWorkingHospitals).all(),
    db.select().from(doctorNearbyPharmacies).all(),
  ]);

  return {
    hospitals: hList.map((h) => ({
      id: h.id,
      repId: h.repId || undefined,
      name: h.name,
      area: h.area,
      type: h.type,
      hospitalTypes: parseStringArray(h.hospitalTypes, h.type ? [h.type] : []),
      address: h.address || undefined,
      keyPersonName: h.keyPersonName || undefined,
      keyPersonPhone: h.keyPersonPhone || undefined,
      purchasingContactName: h.purchasingContactName || undefined,
      purchasingContactPhone: h.purchasingContactPhone || undefined,
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
      name: d.name,
      specialty: d.specialty || undefined,
      workplace: d.workplace || undefined,
      clinicAddress: d.clinicAddress || undefined,
      workingHospitalIds: doctorHospitalLinks.filter((x) => x.doctorId === d.id).map((x) => x.hospitalId),
      nearbyPharmacyIds: doctorPharmacyLinks.filter((x) => x.doctorId === d.id).map((x) => x.pharmacyId),
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

function parseStringArray(value: string | null | undefined, fallback: string[] = []) {
  try { const parsed = JSON.parse(value || '[]'); return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : fallback; }
  catch { return fallback; }
}

/**
 * Retrieves master customer lists for a manager within their authorized hierarchy scope.
 * Rejects with 403 if target rep is outside manager scope.
 */
export async function getScopedMasterListsForManager(
  managerSession: UserSessionPayload,
  targetRepIdOrName?: string
): Promise<{ lists: MasterListsPayload; targetRep?: { id: string; name: string; area: string } | null; readOnly: boolean }> {
  // If target rep specified, verify scope
  if (targetRepIdOrName) {
    const isAllowed = await organizationService.isRepInScope(
      managerSession.id,
      targetRepIdOrName,
      managerSession.systemRole,
      managerSession.positionCode
    );

    if (!isAllowed) {
      throw new AppError('غير مصرح لك بالوصول لقوائم هذا المندوب خارج نطاقك الإشرافي', 403);
    }

    const lists = await getMasterListsForRep(targetRepIdOrName);
    const rep = await db
      .select()
      .from(representatives)
      .where(or(eq(representatives.id, targetRepIdOrName), eq(representatives.name, targetRepIdOrName)))
      .get();

    return {
      lists,
      targetRep: rep ? { id: rep.id, name: rep.name, area: rep.area } : null,
      readOnly: true,
    };
  }

  // An explicit selection is required. Never infer identity from list order.
  return {
    lists: { hospitals: [], pharmacies: [], doctors: [], branches: [] },
    targetRep: null,
    readOnly: true,
  };
}

/**
 * Hospital Operations with server-authoritative ownership check
 */
export async function saveMasterHospital(
  data: Partial<MasterHospital> & { name: string; rep?: string },
  enforcedRepId?: string
) {
  const cleanName = data.name.trim();
  const cleanArea = (data.area || '').trim();
  const repId = enforcedRepId || (await resolveRepId(data.rep || data.repId));

  const targetId = data.id;

  if (targetId) {
    // Validate existing record ownership
    const existing = await db
      .select()
      .from(hospitals)
      .where(eq(hospitals.id, targetId))
      .get();

    if (existing && enforcedRepId && existing.repId && existing.repId !== enforcedRepId) {
      throw new AppError('غير مصرح لك بتعديل بيانات مستشفى تابعة لمندوب آخر', 403);
    }

    const [updated] = await db
      .update(hospitals)
      .set({
        name: cleanName,
        area: cleanArea,
        type: data.type || 'Private',
        hospitalTypes: JSON.stringify(data.hospitalTypes?.length ? data.hospitalTypes : [data.type || 'Private']),
        address: data.address || null,
        keyPersonName: data.keyPersonName || null,
        keyPersonPhone: data.keyPersonPhone || null,
        purchasingContactName: data.purchasingContactName || null,
        purchasingContactPhone: data.purchasingContactPhone || null,
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
      hospitalTypes: JSON.stringify(data.hospitalTypes?.length ? data.hospitalTypes : [data.type || 'Private']),
      address: data.address || null,
      keyPersonName: data.keyPersonName || null,
      keyPersonPhone: data.keyPersonPhone || null,
      purchasingContactName: data.purchasingContactName || null,
      purchasingContactPhone: data.purchasingContactPhone || null,
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
 * Pharmacy Operations with server-authoritative ownership check
 */
export async function saveMasterPharmacy(
  data: Partial<MasterPharmacy> & { name: string; rep?: string },
  enforcedRepId?: string
) {
  const cleanName = data.name.trim();
  const cleanArea = (data.area || '').trim();
  const repId = enforcedRepId || (await resolveRepId(data.rep || data.repId));

  const targetId = data.id;

  if (targetId) {
    const existing = await db
      .select()
      .from(pharmacies)
      .where(eq(pharmacies.id, targetId))
      .get();

    if (existing && enforcedRepId && existing.repId && existing.repId !== enforcedRepId) {
      throw new AppError('غير مصرح لك بتعديل بيانات صيدلية تابعة لمندوب آخر', 403);
    }

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
      repId: repId || null,
    })
    .returning();
  return inserted;
}

/**
 * Doctor Operations with server-authoritative ownership check
 */
export async function saveMasterDoctor(
  data: Partial<MasterDoctor> & { name: string; rep?: string },
  enforcedRepId?: string
) {
  const cleanName = data.name.trim();
  const cleanArea = (data.area || '').trim();
  const repId = enforcedRepId || (await resolveRepId(data.rep || data.repId));

  const targetId = data.id;

  if (targetId) {
    const existing = await db
      .select()
      .from(doctors)
      .where(eq(doctors.id, targetId))
      .get();

    if (existing && enforcedRepId && existing.repId && existing.repId !== enforcedRepId) {
      throw new AppError('غير مصرح لك بتعديل بيانات طبيب تابع لمندوب آخر', 403);
    }

    const [updated] = await db
      .update(doctors)
      .set({
        name: cleanName,
        specialty: data.specialty || null,
        workplace: data.workplace || null,
        clinicAddress: data.clinicAddress || null,
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
    await replaceDoctorLinks(targetId, repId, data.workingHospitalIds || [], data.nearbyPharmacyIds || []);
    return updated;
  }

  const [inserted] = await db
    .insert(doctors)
    .values({
      name: cleanName,
      specialty: data.specialty || null,
      workplace: data.workplace || null,
      clinicAddress: data.clinicAddress || null,
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
  await replaceDoctorLinks(inserted.id, repId, data.workingHospitalIds || [], data.nearbyPharmacyIds || []);
  return inserted;
}

async function replaceDoctorLinks(doctorId: string, repId: string | null, hospitalIds: string[], pharmacyIds: string[]) {
  if (!repId) throw new AppError('Doctor ownership is required', 400);
  const [ownedHospitals, ownedPharmacies] = await Promise.all([
    Promise.all(hospitalIds.map((id) => db.select({ id: hospitals.id }).from(hospitals).where(eq(hospitals.id, id)).get())),
    Promise.all(pharmacyIds.map((id) => db.select({ id: pharmacies.id }).from(pharmacies).where(eq(pharmacies.id, id)).get())),
  ]);
  if (ownedHospitals.some((row, i) => !row || !hospitalIds[i]) || ownedPharmacies.some((row, i) => !row || !pharmacyIds[i])) {
    throw new AppError('Invalid linked customer', 400);
  }
  const hospitalOwners = await Promise.all(hospitalIds.map((id) => db.select({ repId: hospitals.repId }).from(hospitals).where(eq(hospitals.id, id)).get()));
  const pharmacyOwners = await Promise.all(pharmacyIds.map((id) => db.select({ repId: pharmacies.repId }).from(pharmacies).where(eq(pharmacies.id, id)).get()));
  if (hospitalOwners.some((row) => row?.repId !== repId) || pharmacyOwners.some((row) => row?.repId !== repId)) throw new AppError('Linked customer is outside your list', 403);
  await db.batch([
    db.delete(doctorWorkingHospitals).where(eq(doctorWorkingHospitals.doctorId, doctorId)),
    db.delete(doctorNearbyPharmacies).where(eq(doctorNearbyPharmacies.doctorId, doctorId)),
    ...hospitalIds.map((hospitalId) => db.insert(doctorWorkingHospitals).values({ doctorId, hospitalId }).onConflictDoNothing()),
    ...pharmacyIds.map((pharmacyId) => db.insert(doctorNearbyPharmacies).values({ doctorId, pharmacyId }).onConflictDoNothing()),
  ]);
}

/**
 * Distribution Branch Operations with server-authoritative ownership check
 */
export async function saveMasterBranch(
  data: Partial<MasterBranch> & { name: string; rep?: string },
  enforcedRepId?: string
) {
  const cleanName = data.name.trim();
  const cleanCoverage = (data.coverageArea || '').trim();
  const repId = enforcedRepId || (await resolveRepId(data.rep || data.repId));

  const targetId = data.id;

  if (targetId) {
    const existing = await db
      .select()
      .from(distributionBranches)
      .where(eq(distributionBranches.id, targetId))
      .get();

    if (existing && enforcedRepId && existing.repId && existing.repId !== enforcedRepId) {
      throw new AppError('غير مصرح لك بتعديل بيانات فرع موزع تابع لمندوب آخر', 403);
    }

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
 * Delete Master Item with server-authoritative ownership verification
 */
export async function deleteMasterItem(
  category: 'hospitals' | 'pharmacies' | 'doctors' | 'branches',
  id: string,
  enforcedRepId?: string
) {
  if (category === 'hospitals') {
    const existing = await db.select().from(hospitals).where(eq(hospitals.id, id)).get();
    if (!existing) return { success: true };
    if (enforcedRepId && existing.repId && existing.repId !== enforcedRepId) {
      throw new AppError('غير مصرح لك بحذف هذا العميل التابع لمندوب آخر', 403);
    }
    await db.delete(hospitals).where(eq(hospitals.id, id));
  } else if (category === 'pharmacies') {
    const existing = await db.select().from(pharmacies).where(eq(pharmacies.id, id)).get();
    if (!existing) return { success: true };
    if (enforcedRepId && existing.repId && existing.repId !== enforcedRepId) {
      throw new AppError('غير مصرح لك بحذف هذه الصيدلية التابعة لمندوب آخر', 403);
    }
    await db.delete(pharmacies).where(eq(pharmacies.id, id));
  } else if (category === 'doctors') {
    const existing = await db.select().from(doctors).where(eq(doctors.id, id)).get();
    if (!existing) return { success: true };
    if (enforcedRepId && existing.repId && existing.repId !== enforcedRepId) {
      throw new AppError('غير مصرح لك بحذف هذا الطبيب التابع لمندوب آخر', 403);
    }
    await db.delete(doctors).where(eq(doctors.id, id));
  } else if (category === 'branches') {
    const existing = await db.select().from(distributionBranches).where(eq(distributionBranches.id, id)).get();
    if (!existing) return { success: true };
    if (enforcedRepId && existing.repId && existing.repId !== enforcedRepId) {
      throw new AppError('غير مصرح لك بحذف هذا الفرع التابع لمندوب آخر', 403);
    }
    await db.delete(distributionBranches).where(eq(distributionBranches.id, id));
  }
  return { success: true };
}
