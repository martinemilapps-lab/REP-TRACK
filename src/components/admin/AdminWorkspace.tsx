'use client';

import { useState } from 'react';
import { Activity, Boxes, BriefcaseBusiness, Building2, KeyRound, LayoutDashboard, ListTree, MapPinned, Target, UserRoundCog, Users } from 'lucide-react';
import { useTranslation } from '@/lib/i18nContext';
import { AdminAssignments } from './AdminAssignments';
import { AdminAudit } from './AdminAudit';
import { AdminCatalog } from './AdminCatalog';
import { AdminOrganization } from './AdminOrganization';
import { AdminOverview } from './AdminOverview';
import { AdminReferenceData } from './AdminReferenceData';
import { AdminSecurity } from './AdminSecurity';
import { AdminUsers } from './AdminUsers';
import { AdminVisitRates } from './AdminVisitRates';

type AdminView = 'overview' | 'users' | 'organization' | 'assignments' | 'representatives' | 'visit-rates' | 'areas' | 'products' | 'objectives' | 'reference' | 'security' | 'audit';

const positions = ['MR', 'DM', 'AM', 'OM', 'BUM', 'PM', 'MM', 'SMD'];
const catalog = {
  representatives: { endpoint:'/api/admin/representatives', titleEn:'Representatives', titleAr:'المندوبون', descriptionEn:'Profiles and vacant territories; no fake accounts', descriptionAr:'ملفات ومناطق شاغرة بدون حسابات وهمية', fields:[{key:'name',en:'Name',ar:'الاسم',required:true},{key:'area',en:'Area',ar:'المنطقة',required:true},{key:'assignedHospitals',en:'Hospitals',ar:'المستشفيات',type:'number' as const},{key:'assignedPharmacies',en:'Pharmacies',ar:'الصيدليات',type:'number' as const},{key:'assignedDrs',en:'Doctors',ar:'الأطباء',type:'number' as const}] },
  areas: { endpoint:'/api/admin/areas', titleEn:'Areas', titleAr:'المناطق', descriptionEn:'Territories used by assignments', descriptionAr:'المناطق المستخدمة في التعيينات', impactKey:'linkedAssignments', fields:[{key:'name',en:'Name',ar:'الاسم',required:true},{key:'region',en:'Region',ar:'الإقليم'}] },
  products: { endpoint:'/api/admin/products', titleEn:'Products', titleAr:'المنتجات', descriptionEn:'Product catalog with usage-aware deactivation', descriptionAr:'دليل المنتجات مع تعطيل آمن', impactKey:'usageCount', fields:[{key:'name',en:'Name',ar:'الاسم',required:true},{key:'code',en:'Code',ar:'الرمز'},{key:'category',en:'Category',ar:'الفئة'}] },
  objectives: { endpoint:'/api/admin/visit-objectives', titleEn:'Visit objectives', titleAr:'أهداف الزيارة', descriptionEn:'Position-specific objective catalog', descriptionAr:'دليل الأهداف حسب المنصب', rowKey:'nameEn', fields:[{key:'positionCode',en:'Position',ar:'المنصب',type:'select' as const,options:positions,required:true,protectedOnEdit:true},{key:'objectiveCode',en:'Objective code',ar:'رمز الهدف',required:true,protectedOnEdit:true},{key:'nameEn',en:'English name',ar:'الاسم الإنجليزي',required:true},{key:'nameAr',en:'Arabic name',ar:'الاسم العربي',required:true},{key:'displayOrder',en:'Order',ar:'الترتيب',type:'number' as const}] },
};

export function AdminWorkspace() {
  const { language } = useTranslation();
  const [view, setView] = useState<AdminView>('users');
  const items = [
    { id: 'overview' as const, en: 'Overview', ar: 'نظرة عامة', icon: LayoutDashboard },
    { id: 'users' as const, en: 'Users', ar: 'المستخدمون', icon: Users },
    { id: 'organization' as const, en: 'Organization', ar: 'المؤسسة', icon: Building2 },
    { id: 'assignments' as const, en: 'Assignments', ar: 'التعيينات', icon: BriefcaseBusiness },
    { id: 'representatives' as const, en: 'Representatives', ar: 'المندوبون', icon: UserRoundCog },
    { id: 'visit-rates' as const, en: 'Visit Rates', ar: 'معدلات الزيارة', icon: Target },
    { id: 'areas' as const, en: 'Areas', ar: 'المناطق', icon: MapPinned },
    { id: 'products' as const, en: 'Products', ar: 'المنتجات', icon: Boxes },
    { id: 'objectives' as const, en: 'Visit Objectives', ar: 'أهداف الزيارة', icon: Target },
    { id: 'reference' as const, en: 'Reference Data', ar: 'البيانات المرجعية', icon: ListTree },
    { id: 'security' as const, en: 'Demo Passwords', ar: 'كلمات مرور العرض', icon: KeyRound },
    { id: 'audit' as const, en: 'Audit Log', ar: 'سجل التدقيق', icon: Activity },
  ];

  return <section className="animate-fade-in space-y-5" aria-label={language === 'ar' ? 'إدارة النظام' : 'System administration'}>
    <header>
      <h1 className="text-2xl font-black">{language === 'ar' ? 'إدارة النظام' : 'Admin module'}</h1>
      <p className="text-sm text-[var(--ink-soft)]">{language === 'ar' ? 'صلاحيات إدارية إضافية داخل مساحة عمل المدير' : 'Additional administrative capabilities inside the Manager workspace'}</p>
    </header>
    <nav className="flex flex-wrap gap-2" aria-label={language === 'ar' ? 'أقسام الإدارة' : 'Admin sections'}>
      {items.map(({ id, en, ar, icon: Icon }) => <button key={id} type="button" onClick={() => setView(id)} className={`app-nav-item ${view === id ? 'app-nav-item-active' : ''}`} aria-current={view === id ? 'page' : undefined}><Icon className="size-4"/><span>{language === 'ar' ? ar : en}</span></button>)}
    </nav>
    {view === 'overview' && <AdminOverview />}
    {view === 'users' && <AdminUsers />}
    {view === 'organization' && <AdminOrganization />}
    {view === 'assignments' && <AdminAssignments />}
    {view === 'representatives' && <AdminCatalog config={catalog.representatives} />}
    {view === 'visit-rates' && <AdminVisitRates />}
    {view === 'areas' && <AdminCatalog config={catalog.areas} />}
    {view === 'products' && <AdminCatalog config={catalog.products} />}
    {view === 'objectives' && <AdminCatalog config={catalog.objectives} />}
    {view === 'reference' && <AdminReferenceData />}
    {view === 'security' && <AdminSecurity />}
    {view === 'audit' && <AdminAudit />}
  </section>;
}
