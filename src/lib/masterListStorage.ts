import { MasterListsPayload, MasterHospital, MasterPharmacy, MasterDoctor, MasterBranch } from '@/types';

const STORAGE_KEY_PREFIX = 'rep_track_browser_lists_';

export function getBrowserListsKey(repName?: string): string {
  return `${STORAGE_KEY_PREFIX}${repName?.trim() || 'guest'}`;
}

export function loadBrowserLists(repName?: string): MasterListsPayload {
  if (typeof window === 'undefined') {
    return { hospitals: [], pharmacies: [], doctors: [], branches: [] };
  }
  try {
    const raw = localStorage.getItem(getBrowserListsKey(repName));
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        hospitals: Array.isArray(parsed.hospitals) ? parsed.hospitals : [],
        pharmacies: Array.isArray(parsed.pharmacies) ? parsed.pharmacies : [],
        doctors: Array.isArray(parsed.doctors) ? parsed.doctors : [],
        branches: Array.isArray(parsed.branches) ? parsed.branches : [],
      };
    }
  } catch (e) {
    console.error('Failed to read from browser localStorage:', e);
  }
  return { hospitals: [], pharmacies: [], doctors: [], branches: [] };
}

export function saveBrowserLists(repName: string, data: MasterListsPayload): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getBrowserListsKey(repName), JSON.stringify(data));
  } catch (e) {
    console.error('Failed to write to browser localStorage:', e);
  }
}

export function addOrUpdateBrowserItem(
  repName: string,
  category: 'hospitals' | 'pharmacies' | 'doctors' | 'branches',
  item: any
): MasterListsPayload {
  const current = loadBrowserLists(repName);
  const list = [...current[category]] as any[];
  const id = item.id || `local-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  const itemWithId = { ...item, id };

  const existingIndex = list.findIndex(
    (x) => x.id === id || (x.name?.trim().toLowerCase() === item.name?.trim().toLowerCase() && x.area === item.area)
  );

  if (existingIndex >= 0) {
    list[existingIndex] = { ...list[existingIndex], ...itemWithId };
  } else {
    list.unshift(itemWithId);
  }

  const updated: MasterListsPayload = {
    ...current,
    [category]: list,
  };

  saveBrowserLists(repName, updated);
  return updated;
}

export function deleteBrowserItem(
  repName: string,
  category: 'hospitals' | 'pharmacies' | 'doctors' | 'branches',
  id: string
): MasterListsPayload {
  const current = loadBrowserLists(repName);
  const updated: MasterListsPayload = {
    ...current,
    [category]: (current[category] as any[]).filter((x) => x.id !== id),
  };
  saveBrowserLists(repName, updated);
  return updated;
}

export function getSampleDemoLists(repName?: string): MasterListsPayload {
  const area = repName ? 'الدقي والمهندسين' : 'القاهرة الكبرى';
  return {
    hospitals: [
      {
        id: `demo-hosp-1`,
        name: 'مستشفى دار الفؤاد',
        area: 'مدينة نصر - القاهرة',
        type: 'Private',
        dept: 'الرعاية المركزة والجراحة',
        contact: 'د. خالد إبراهيم (رئيس الصيدلية)',
        phone: '01012345678',
        doctorNames: 'د. طارق سامي، د. أحمد عبد العزيز، د. يحيى خليل',
        defaultCycle: 7,
        targetProducts: 'Nitrong, Sugammadex, Norepinephrine',
      },
      {
        id: `demo-hosp-2`,
        name: 'مستشفى السلام الدولي',
        area: 'المعادي - القاهرة',
        type: 'Private',
        dept: 'القلب والأوعية الدموية',
        contact: 'د. منى عبد الفتاح (مدير المشتريات)',
        phone: '01123456789',
        doctorNames: 'د. سمير كمال، د. عصام بدوي',
        defaultCycle: 14,
        targetProducts: 'Nitrong, Danasetron, Ephedrine',
      },
      {
        id: `demo-hosp-3`,
        name: 'مستشفى الشفا التخصصي',
        area: 'التجمع الخامس - القاهرة الجديدة',
        type: 'Private',
        dept: 'الباطنة والتخدير',
        contact: 'د. مروان شريف',
        phone: '01234567891',
        doctorNames: 'د. هاني شاكر، د. رمزي فوزي',
        defaultCycle: 7,
        targetProducts: 'Sugammadex, Nitrong',
      },
    ],
    pharmacies: [
      {
        id: `demo-pharm-1`,
        name: 'صيدلية العزبي - فرع مصدق',
        area: 'الدقي - الجيزة',
        address: '18 شارع مصدق أمام بنك مصر',
        pharmacist: 'د. نهى فوزي',
        mobile: '01099887766',
        classification: 'A',
        defaultCycle: 7,
        targetProducts: 'Nitrong, Danasetron',
      },
      {
        id: `demo-pharm-2`,
        name: 'صيدلية سيف - فرع النصر',
        area: 'المعادي - القاهرة',
        address: 'شارع النصر بجوار كارفور',
        pharmacist: 'د. وائل سلامة',
        mobile: '01155443322',
        classification: 'A',
        defaultCycle: 10,
        targetProducts: 'Nitrong, Sugammadex',
      },
      {
        id: `demo-pharm-3`,
        name: 'صيدلية رشدي - فرع عباس العقاد',
        area: 'مدينة نصر - القاهرة',
        address: '32 شارع عباس العقاد الرئيسي',
        pharmacist: 'د. إيمان عبد الله',
        mobile: '01288776655',
        classification: 'B',
        defaultCycle: 14,
        targetProducts: 'Danasetron',
      },
    ],
    doctors: [
      {
        id: `demo-doc-1`,
        code: 'DOC-101',
        name: 'د. حسام فوزي',
        specialty: 'استشاري أمراض القلب والقسطرة',
        workplace: 'عيادة الدقي التخصصية',
        area: 'الدقي - الجيزة',
        mobile: '01001122334',
        classification: 'A',
        bestTime: 'السبت والأربعاء من 6 إلى 9 مساءً',
        defaultCycle: 7,
        targetProducts: 'Nitrong, Norepinephrine',
      },
      {
        id: `demo-doc-2`,
        code: 'DOC-102',
        name: 'د. هاني بدر الدين',
        specialty: 'استشاري جراحة الأورام والمناظير',
        workplace: 'مركز الحياة للأورام',
        area: 'المهندسين - الجيزة',
        mobile: '01112233445',
        classification: 'A',
        bestTime: 'الأحد والثلاثاء من 7 إلى 10 مساءً',
        defaultCycle: 14,
        targetProducts: 'Danasetron, Sugammadex',
      },
      {
        id: `demo-doc-3`,
        code: 'DOC-103',
        name: 'د. سارة عثمان',
        specialty: 'استشاري التخدير والعناية المركزة',
        workplace: 'مستشفى دار الفؤاد',
        area: 'مدينة نصر - القاهرة',
        mobile: '01223344556',
        classification: 'B',
        bestTime: 'الخميس صباحاً من 10 إلى 1 ظهراً',
        defaultCycle: 14,
        targetProducts: 'Sugammadex, Ephedrine',
      },
    ],
    branches: [
      {
        id: `demo-branch-1`,
        name: 'الشركة المتحدة للتوزيع - فرع الجيزة',
        coverageArea: 'محافظة الجيزة وضواحيها',
        contact: 'أ. محمود عبد الرحمن (مدير الفرع)',
        phone: '01555667788',
        distributedProducts: 'كافة منتجات مجموعة صني الطبية',
        defaultCycle: 30,
      },
      {
        id: `demo-branch-2`,
        name: 'مخازن ابن سينا فارما - فرع القاهرة المركزية',
        coverageArea: 'القاهرة ومدينة نصر والمعادي',
        contact: 'أ. هاني سليم (مسؤول التوريد)',
        phone: '01566778899',
        distributedProducts: 'Nitrong, Sugammadex, Danasetron',
        defaultCycle: 14,
      },
    ],
  };
}
