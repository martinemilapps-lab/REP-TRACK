'use client';

import React, { useState } from 'react';
import { Activity, Boxes, BriefcaseBusiness, Building2, Database, Eye, KeyRound, Languages, LayoutDashboard, ListTree, MapPinned, Pencil, ShieldAlert, Target, Type, UserRoundCog, Users, Zap } from 'lucide-react';
import { useTranslation } from '@/lib/i18nContext';
import { AdminAssignments } from './AdminAssignments';
import { AdminAudit } from './AdminAudit';
import { AdminCatalog } from './AdminCatalog';
import { AdminOrganization } from './AdminOrganization';
import { AdminOverview } from './AdminOverview';
import { AdminReferenceData } from './AdminReferenceData';
import { AdminSecurity } from './AdminSecurity';
import { AdminUsers } from './AdminUsers';
import { AdminCreateUser } from './AdminCreateUser';
import { AdminVisitRates } from './AdminVisitRates';
import { AdminDatabaseControl } from './AdminDatabaseControl';
import { AdminFieldManager } from './AdminFieldManager';
import { AdminTextEditor } from './AdminTextEditor';
import { AdminUIRemover } from './AdminUIRemover';
import { AdminFunctionBuilder } from './AdminFunctionBuilder';

type AdminView =
  | 'overview' | 'users' | 'organization' | 'assignments' | 'representatives'
  | 'visit-rates' | 'areas' | 'products' | 'objectives' | 'reference' | 'security' | 'audit'
  | 'database' | 'fields' | 'text-editor' | 'ui-remover' | 'functions';

const positions = ['MR', 'DM', 'AM', 'OM', 'BUM', 'PM', 'MM', 'SMD'];
const catalog = {
  representatives: { endpoint:'/api/admin/representatives', titleEn:'Representatives', titleAr:'المندوبون', descriptionEn:'Profiles and vacant territories; no fake accounts', descriptionAr:'ملفات ومناطق شاغرة بدون حسابات وهمية', fields:[{key:'name',en:'Name',ar:'الاسم',required:true},{key:'area',en:'Area',ar:'المنطقة',required:true},{key:'assignedHospitals',en:'Hospitals',ar:'المستشفيات',type:'number' as const},{key:'assignedPharmacies',en:'Pharmacies',ar:'الصيدليات',type:'number' as const},{key:'assignedDrs',en:'Doctors',ar:'الأطباء',type:'number' as const}] },
  areas: { endpoint:'/api/admin/areas', titleEn:'Areas', titleAr:'المناطق', descriptionEn:'Territories used by assignments', descriptionAr:'المناطق المستخدمة في التعيينات', impactKey:'linkedAssignments', fields:[{key:'name',en:'Name',ar:'الاسم',required:true},{key:'region',en:'Region',ar:'الإقليم'}] },
  products: { endpoint:'/api/admin/products', titleEn:'Products', titleAr:'المنتجات', descriptionEn:'Product catalog with usage-aware deactivation', descriptionAr:'دليل المنتجات مع تعطيل آمن', impactKey:'usageCount', fields:[{key:'name',en:'Name',ar:'الاسم',required:true},{key:'code',en:'Code',ar:'الرمز'},{key:'category',en:'Category',ar:'الفئة'}] },
  objectives: { endpoint:'/api/admin/visit-objectives', titleEn:'Visit objectives', titleAr:'أهداف الزيارة', descriptionEn:'Position-specific objective catalog', descriptionAr:'دليل الأهداف حسب المنصب', rowKey:'nameEn', fields:[{key:'positionCode',en:'Position',ar:'المنصب',type:'select' as const,options:positions,required:true,protectedOnEdit:true},{key:'objectiveCode',en:'Objective code',ar:'رمز الهدف',required:true,protectedOnEdit:true},{key:'nameEn',en:'English name',ar:'الاسم الإنجليزي',required:true},{key:'nameAr',en:'Arabic name',ar:'الاسم العربي',required:true},{key:'displayOrder',en:'Order',ar:'الترتيب',type:'number' as const}] },
};

export function AdminWorkspace() {
  const { language } = useTranslation();
  const ar = language === 'ar';
  const [view, setView] = useState<AdminView>('users');
  const [usersVersion, setUsersVersion] = useState(0);

  // Group items into categories for better UX
  const coreItems = [
    { id: 'overview' as const, en: 'Overview', ar: 'نظرة عامة', icon: LayoutDashboard },
    { id: 'users' as const, en: 'Users', ar: 'المستخدمون', icon: Users },
    { id: 'organization' as const, en: 'Organization', ar: 'المؤسسة', icon: Building2 },
    { id: 'assignments' as const, en: 'Assignments', ar: 'التعيينات', icon: BriefcaseBusiness },
  ];

  const dataItems = [
    { id: 'representatives' as const, en: 'Representatives', ar: 'المندوبون', icon: UserRoundCog },
    { id: 'visit-rates' as const, en: 'Visit Rates', ar: 'معدلات الزيارة', icon: Target },
    { id: 'areas' as const, en: 'Areas', ar: 'المناطق', icon: MapPinned },
    { id: 'products' as const, en: 'Products', ar: 'المنتجات', icon: Boxes },
    { id: 'objectives' as const, en: 'Visit Objectives', ar: 'أهداف الزيارة', icon: Target },
    { id: 'reference' as const, en: 'Reference Data', ar: 'البيانات المرجعية', icon: ListTree },
  ];

  const powerItems = [
    { id: 'fields' as const, en: 'Field Manager', ar: 'مدير الحقول', icon: Type },
    { id: 'functions' as const, en: 'Function Builder', ar: 'منشئ الوظائف', icon: Zap },
    { id: 'text-editor' as const, en: 'Text Editor', ar: 'محرر النصوص', icon: Languages },
    { id: 'ui-remover' as const, en: 'UI Remover', ar: 'إزالة العناصر', icon: Eye },
    { id: 'database' as const, en: 'Database Control', ar: 'تحكم قاعدة البيانات', icon: Database },
  ];

  const securityItems = [
    { id: 'security' as const, en: 'Demo Passwords', ar: 'كلمات مرور العرض', icon: KeyRound },
    { id: 'audit' as const, en: 'Audit Log', ar: 'سجل التدقيق', icon: Activity },
  ];

  const renderNavGroup = (label: string, items: { id: string; en: string; ar: string; icon: React.ComponentType<{ className?: string }> }[]) => (
    <div className="space-y-1.5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--ink-soft)] opacity-60">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map(({ id, en, ar: arLabel, icon: Icon }) => (
          <button key={id} type="button" onClick={() => setView(id as AdminView)}
            className={`app-nav-item ${view === id ? 'app-nav-item-active' : ''}`}
            aria-current={view === id ? 'page' : undefined}>
            <Icon className="size-4" /><span>{ar ? arLabel : en}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <section className="animate-fade-in space-y-5" aria-label={ar ? 'إدارة النظام' : 'System administration'}>
      <header>
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert className="size-5 text-[var(--gold-dark)]" />
          <span className="text-xs font-bold uppercase tracking-widest text-[var(--gold-dark)]">PM1 ADMIN</span>
        </div>
        <h1 className="text-2xl font-black">{ar ? 'لوحة تحكم النظام الكاملة' : 'Full System Control Panel'}</h1>
        <p className="text-sm text-[var(--ink-soft)]">{ar ? 'صلاحيات تحكم كاملة في النظام: إضافة، تعديل، حذف، إدارة قاعدة البيانات' : 'Complete system control: add, edit, remove fields, functions, text, elements, and manage all database operations'}</p>
      </header>

      <nav className="space-y-3" aria-label={ar ? 'أقسام الإدارة' : 'Admin sections'}>
        {renderNavGroup(ar ? 'الأساسي' : 'CORE', coreItems)}
        {renderNavGroup(ar ? 'البيانات' : 'DATA', dataItems)}
        {renderNavGroup(ar ? 'أدوات التحكم المتقدمة' : 'POWER TOOLS', powerItems)}
        {renderNavGroup(ar ? 'الأمان' : 'SECURITY', securityItems)}
      </nav>

      {/* ─── View Router ─── */}
      {view === 'overview' && <AdminOverview />}
      {view === 'users' && <div className="space-y-5"><AdminCreateUser onCreated={async () => setUsersVersion(version => version + 1)}/><AdminUsers key={usersVersion}/></div>}
      {view === 'organization' && <AdminOrganization />}
      {view === 'assignments' && <AdminAssignments />}
      {view === 'representatives' && <AdminCatalog config={catalog.representatives} />}
      {view === 'visit-rates' && <AdminVisitRates />}
      {view === 'areas' && <AdminCatalog config={catalog.areas} />}
      {view === 'products' && <AdminCatalog config={catalog.products} />}
      {view === 'objectives' && <AdminCatalog config={catalog.objectives} />}
      {view === 'reference' && <AdminReferenceData />}
      {view === 'fields' && <AdminFieldManager />}
      {view === 'functions' && <AdminFunctionBuilder />}
      {view === 'text-editor' && <AdminTextEditor />}
      {view === 'ui-remover' && <AdminUIRemover />}
      {view === 'database' && <AdminDatabaseControl />}
      {view === 'security' && <AdminSecurity />}
      {view === 'audit' && <AdminAudit />}
    </section>
  );
}
