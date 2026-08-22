import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import {
  db,
  representatives,
  hospitals,
  pharmacies,
  doctors,
  distributionBranches,
  products,
  hospitalVisits,
  pharmacyVisits,
  doctorVisits,
  branchVisits,
  productAvailabilities,
} from '@/lib/db';
import { generateExcelWorkbook } from '@/lib/excel';
import { eq, desc } from 'drizzle-orm';
import { deriveVisitStatus } from '@/lib/business/status';

export async function GET() {
  try {
    // 1. Authorization Guard: Only MANAGER can export company data
    const session = await getServerSession();
    if (!session || session.role !== 'MANAGER') {
      return NextResponse.json(
        { success: false, message: 'غير مصرح لك بتحميل تقارير الشركة كاملة' },
        { status: 403 }
      );
    }

    // 2. Fetch all datasets from Turso
    const allReps = await db.select().from(representatives).all();

    const [allHospVisits, allPharmVisits, allDrVisits, allBranchVisits, allAvails] =
      await Promise.all([
        db
          .select({
            id: hospitalVisits.id,
            repId: hospitalVisits.repId,
            rep: representatives.name,
            name: hospitals.name,
            area: hospitals.area,
            type: hospitals.type,
            dept: hospitalVisits.dept,
            drsVisited: hospitalVisits.drsVisited,
            contact: hospitals.contact,
            phone: hospitals.phone,
            cycle: hospitalVisits.cycleDays,
            lastVisit: hospitalVisits.lastVisitDate,
            nextVisit: hospitalVisits.nextVisitDate,
            ourProducts: hospitalVisits.ourProducts,
            competitor: hospitalVisits.competitor,
            notes: hospitalVisits.notes,
            submittedAt: hospitalVisits.submittedAt,
          })
          .from(hospitalVisits)
          .innerJoin(hospitals, eq(hospitalVisits.hospitalId, hospitals.id))
          .innerJoin(representatives, eq(hospitalVisits.repId, representatives.id))
          .orderBy(desc(hospitalVisits.submittedAt))
          .all(),

        db
          .select({
            id: pharmacyVisits.id,
            repId: pharmacyVisits.repId,
            rep: representatives.name,
            name: pharmacies.name,
            area: pharmacies.area,
            address: pharmacies.address,
            pharmacist: pharmacies.pharmacist,
            mobile: pharmacies.mobile,
            cls: pharmacies.classification,
            cycle: pharmacyVisits.cycleDays,
            lastVisit: pharmacyVisits.lastVisitDate,
            nextVisit: pharmacyVisits.nextVisitDate,
            ourProducts: pharmacyVisits.ourProducts,
            competitor: pharmacyVisits.competitor,
            notes: pharmacyVisits.notes,
            submittedAt: pharmacyVisits.submittedAt,
          })
          .from(pharmacyVisits)
          .innerJoin(pharmacies, eq(pharmacyVisits.pharmacyId, pharmacies.id))
          .innerJoin(representatives, eq(pharmacyVisits.repId, representatives.id))
          .orderBy(desc(pharmacyVisits.submittedAt))
          .all(),

        db
          .select({
            id: doctorVisits.id,
            repId: doctorVisits.repId,
            rep: representatives.name,
            code: doctors.code,
            name: doctors.name,
            specialty: doctors.specialty,
            workplace: doctors.workplace,
            area: doctors.area,
            mobile: doctors.mobile,
            cls: doctors.classification,
            visitDate: doctorVisits.visitDate,
            cycle: doctorVisits.cycleDays,
            nextVisit: doctorVisits.nextVisitDate,
            f1: doctorVisits.product1,
            f2: doctorVisits.product2,
            f3: doctorVisits.product3,
            reminder: doctorVisits.reminderProduct,
            notes: doctorVisits.notes,
            submittedAt: doctorVisits.submittedAt,
          })
          .from(doctorVisits)
          .innerJoin(doctors, eq(doctorVisits.doctorId, doctors.id))
          .innerJoin(representatives, eq(doctorVisits.repId, representatives.id))
          .orderBy(desc(doctorVisits.submittedAt))
          .all(),

        db
          .select({
            id: branchVisits.id,
            repId: branchVisits.repId,
            rep: representatives.name,
            name: distributionBranches.name,
            area: distributionBranches.coverageArea,
            contact: distributionBranches.contact,
            phone: distributionBranches.phone,
            products: distributionBranches.distributedProducts,
            lastVisit: branchVisits.lastVisitDate,
            notes: branchVisits.notes,
            submittedAt: branchVisits.submittedAt,
          })
          .from(branchVisits)
          .innerJoin(distributionBranches, eq(branchVisits.branchId, distributionBranches.id))
          .innerJoin(representatives, eq(branchVisits.repId, representatives.id))
          .orderBy(desc(branchVisits.submittedAt))
          .all(),

        db
          .select({
            id: productAvailabilities.id,
            repId: productAvailabilities.repId,
            rep: representatives.name,
            hospital: hospitals.name,
            area: hospitals.area,
            product: products.name,
            month: productAvailabilities.month,
            sales: productAvailabilities.salesUnits,
            isAvailable: productAvailabilities.isAvailable,
            notes: productAvailabilities.notes,
            submittedAt: productAvailabilities.submittedAt,
          })
          .from(productAvailabilities)
          .innerJoin(hospitals, eq(productAvailabilities.hospitalId, hospitals.id))
          .innerJoin(products, eq(productAvailabilities.productId, products.id))
          .innerJoin(representatives, eq(productAvailabilities.repId, representatives.id))
          .orderBy(desc(productAvailabilities.submittedAt))
          .all(),
      ]);

    const buffer = generateExcelWorkbook({
      reps: allReps,
      hospitals: allHospVisits.map((h) => ({
        ...h,
        status: deriveVisitStatus({ lastVisitDate: h.lastVisit, nextVisitDate: h.nextVisit, cycleDays: h.cycle }),
        dept: h.dept ?? undefined,
        drsVisited: h.drsVisited ?? undefined,
        contact: h.contact ?? undefined,
        phone: h.phone ?? undefined,
        cycle: h.cycle ?? undefined,
        lastVisit: h.lastVisit ?? undefined,
        nextVisit: h.nextVisit ?? undefined,
        ourProducts: h.ourProducts ?? undefined,
        competitor: h.competitor ?? undefined,
        notes: h.notes ?? undefined,
        submittedAt: h.submittedAt ? new Date(h.submittedAt).toISOString() : undefined,
      })),
      pharmacies: allPharmVisits.map((p) => ({
        ...p,
        status: deriveVisitStatus({ lastVisitDate: p.lastVisit, nextVisitDate: p.nextVisit, cycleDays: p.cycle }),
        address: p.address ?? undefined,
        pharmacist: p.pharmacist ?? undefined,
        mobile: p.mobile ?? undefined,
        cycle: p.cycle ?? undefined,
        lastVisit: p.lastVisit ?? undefined,
        nextVisit: p.nextVisit ?? undefined,
        ourProducts: p.ourProducts ?? undefined,
        competitor: p.competitor ?? undefined,
        notes: p.notes ?? undefined,
        submittedAt: p.submittedAt ? new Date(p.submittedAt).toISOString() : undefined,
      })),
      doctors: allDrVisits.map((d) => ({
        ...d,
        status: deriveVisitStatus({ lastVisitDate: d.visitDate, nextVisitDate: d.nextVisit, cycleDays: d.cycle }),
        code: d.code ?? undefined,
        specialty: d.specialty ?? undefined,
        workplace: d.workplace ?? undefined,
        mobile: d.mobile ?? undefined,
        visitDate: d.visitDate ?? undefined,
        cycle: d.cycle ?? undefined,
        nextVisit: d.nextVisit ?? undefined,
        f1: d.f1 ?? undefined,
        f2: d.f2 ?? undefined,
        f3: d.f3 ?? undefined,
        reminder: d.reminder ?? undefined,
        notes: d.notes ?? undefined,
        submittedAt: d.submittedAt ? new Date(d.submittedAt).toISOString() : undefined,
      })),
      branches: allBranchVisits.map((b) => ({
        ...b,
        status: 'Visited',
        contact: b.contact ?? undefined,
        phone: b.phone ?? undefined,
        products: b.products ?? undefined,
        lastVisit: b.lastVisit ?? undefined,
        notes: b.notes ?? undefined,
        submittedAt: b.submittedAt ? new Date(b.submittedAt).toISOString() : undefined,
      })),
      availabilities: allAvails.map((a) => ({
        ...a,
        status: a.isAvailable ? 'Available' : 'Not Available',
        sales: a.sales ?? undefined,
        notes: a.notes ?? undefined,
        submittedAt: a.submittedAt ? new Date(a.submittedAt).toISOString() : undefined,
      })),
    });

    const now = new Date().toISOString().slice(0, 10);
    const filename = `Rep_Tracking_Combined_${now}.xlsx`;

    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error generating Excel file:', error);
    return NextResponse.json(
      { success: false, message: 'فشل في إنشاء ملف الإكسل' },
      { status: 500 }
    );
  }
}
