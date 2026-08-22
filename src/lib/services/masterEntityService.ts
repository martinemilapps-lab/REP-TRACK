import { db, hospitals, pharmacies, doctors, distributionBranches, products } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { AppError } from '@/lib/errors';

export function normalizeText(text?: string | null): string {
  if (!text) return '';
  return text.trim().replace(/\s+/g, ' ');
}

// ----------------------------------------------------
// 1. HOSPITALS MASTER SERVICE
// ----------------------------------------------------
export async function findOrCreateHospital(data: {
  name: string;
  area?: string;
  type?: string;
  dept?: string;
  contact?: string;
  phone?: string;
}) {
  const cleanName = normalizeText(data.name);
  const cleanArea = normalizeText(data.area);

  if (!cleanName) {
    throw new AppError('اسم المستشفى مطلوب', 400);
  }

  let hospital = await db
    .select()
    .from(hospitals)
    .where(and(eq(hospitals.name, cleanName), eq(hospitals.area, cleanArea)))
    .get();

  if (!hospital) {
    const inserted = await db
      .insert(hospitals)
      .values({
        name: cleanName,
        area: cleanArea,
        type: data.type || 'Private',
        dept: data.dept || null,
        contact: data.contact || null,
        phone: data.phone || null,
        isActive: true,
      })
      .returning();
    hospital = inserted[0];
  } else {
    // Update contact / details if provided
    await db
      .update(hospitals)
      .set({
        type: data.type || hospital.type,
        dept: data.dept || hospital.dept,
        contact: data.contact || hospital.contact,
        phone: data.phone || hospital.phone,
        updatedAt: new Date(),
      })
      .where(eq(hospitals.id, hospital.id));
  }

  return hospital;
}

// ----------------------------------------------------
// 2. PHARMACIES MASTER SERVICE
// ----------------------------------------------------
export async function findOrCreatePharmacy(data: {
  name: string;
  area?: string;
  address?: string;
  pharmacist?: string;
  mobile?: string;
  classification?: string;
}) {
  const cleanName = normalizeText(data.name);
  const cleanArea = normalizeText(data.area);

  if (!cleanName) {
    throw new AppError('اسم الصيدلية مطلوب', 400);
  }

  let pharmacy = await db
    .select()
    .from(pharmacies)
    .where(and(eq(pharmacies.name, cleanName), eq(pharmacies.area, cleanArea)))
    .get();

  if (!pharmacy) {
    const inserted = await db
      .insert(pharmacies)
      .values({
        name: cleanName,
        area: cleanArea,
        address: data.address || null,
        pharmacist: data.pharmacist || null,
        mobile: data.mobile || null,
        classification: data.classification || 'A',
        isActive: true,
      })
      .returning();
    pharmacy = inserted[0];
  } else {
    await db
      .update(pharmacies)
      .set({
        address: data.address || pharmacy.address,
        pharmacist: data.pharmacist || pharmacy.pharmacist,
        mobile: data.mobile || pharmacy.mobile,
        classification: data.classification || pharmacy.classification,
        updatedAt: new Date(),
      })
      .where(eq(pharmacies.id, pharmacy.id));
  }

  return pharmacy;
}

// ----------------------------------------------------
// 3. DOCTORS MASTER SERVICE
// ----------------------------------------------------
export async function findOrCreateDoctor(data: {
  name: string;
  area?: string;
  code?: string;
  specialty?: string;
  workplace?: string;
  mobile?: string;
  classification?: string;
}) {
  const cleanName = normalizeText(data.name);
  const cleanArea = normalizeText(data.area);

  if (!cleanName) {
    throw new AppError('اسم الدكتور مطلوب', 400);
  }

  let doctor = await db
    .select()
    .from(doctors)
    .where(and(eq(doctors.name, cleanName), eq(doctors.area, cleanArea)))
    .get();

  if (!doctor) {
    const inserted = await db
      .insert(doctors)
      .values({
        name: cleanName,
        area: cleanArea,
        code: data.code || null,
        specialty: data.specialty || null,
        workplace: data.workplace || null,
        mobile: data.mobile || null,
        classification: data.classification || 'A',
        isActive: true,
      })
      .returning();
    doctor = inserted[0];
  } else {
    await db
      .update(doctors)
      .set({
        code: data.code || doctor.code,
        specialty: data.specialty || doctor.specialty,
        workplace: data.workplace || doctor.workplace,
        mobile: data.mobile || doctor.mobile,
        classification: data.classification || doctor.classification,
        updatedAt: new Date(),
      })
      .where(eq(doctors.id, doctor.id));
  }

  return doctor;
}

// ----------------------------------------------------
// 4. DISTRIBUTION BRANCHES MASTER SERVICE
// ----------------------------------------------------
export async function findOrCreateBranch(data: {
  name: string;
  coverageArea?: string;
  contact?: string;
  phone?: string;
  distributedProducts?: string;
}) {
  const cleanName = normalizeText(data.name);
  const cleanArea = normalizeText(data.coverageArea);

  if (!cleanName) {
    throw new AppError('اسم الفرع مطلوب', 400);
  }

  let branch = await db
    .select()
    .from(distributionBranches)
    .where(
      and(
        eq(distributionBranches.name, cleanName),
        eq(distributionBranches.coverageArea, cleanArea)
      )
    )
    .get();

  if (!branch) {
    const inserted = await db
      .insert(distributionBranches)
      .values({
        name: cleanName,
        coverageArea: cleanArea,
        contact: data.contact || null,
        phone: data.phone || null,
        distributedProducts: data.distributedProducts || null,
        isActive: true,
      })
      .returning();
    branch = inserted[0];
  } else {
    await db
      .update(distributionBranches)
      .set({
        contact: data.contact || branch.contact,
        phone: data.phone || branch.phone,
        distributedProducts: data.distributedProducts || branch.distributedProducts,
        updatedAt: new Date(),
      })
      .where(eq(distributionBranches.id, branch.id));
  }

  return branch;
}

// ----------------------------------------------------
// 5. PRODUCTS MASTER SERVICE
// ----------------------------------------------------
export async function findOrCreateProduct(name: string) {
  const cleanName = normalizeText(name);
  if (!cleanName) {
    throw new AppError('اسم المنتج مطلوب', 400);
  }

  let product = await db
    .select()
    .from(products)
    .where(eq(products.name, cleanName))
    .get();

  if (!product) {
    const inserted = await db
      .insert(products)
      .values({
        name: cleanName,
        isActive: true,
      })
      .returning();
    product = inserted[0];
  }

  return product;
}
