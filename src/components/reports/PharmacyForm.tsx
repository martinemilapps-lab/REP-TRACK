'use client';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { BUSINESS_PRODUCT_OPTIONS } from '@/lib/constants';
import { useTranslation } from '@/lib/i18nContext';
import { SavedCustomerDetails, VisitMode } from './SavedCustomerDetails';
import { getReportingWindowStatus, isDateSubmissionOpen } from '@/lib/business/reportingWindow';
import { CustomFieldsRenderer } from '@/components/ui/CustomFieldsRenderer';

type Item = { id:string; name:string; area?:string; address?:string; distributors?:string[]; distributorOther?:string; defaultCycle?:number };
export function PharmacyForm({onSuccess,onError}:{selectedRep:string;onSuccess:(message:string)=>void;onError:(message:string)=>void}) {
  const {language}=useTranslation(); const ar=language==='ar'; const l=(e:string,a:string)=>ar?a:e;
  const windowStatus=getReportingWindowStatus();
  const [visitDate,setVisitDate]=useState(windowStatus.todayDate);
  const isClosed=!isDateSubmissionOpen(visitDate);
  const [pharmacies,setPharmacies]=useState<Item[]>([]),[catalog,setCatalog]=useState<Item[]>([]),[pharmacyId,setPharmacyId]=useState(''),[productIds,setProductIds]=useState<string[]>([]),[notes,setNotes]=useState(''),[visitType,setVisitType]=useState<VisitMode>('Single'),[companion,setCompanion]=useState(''),[saving,setSaving]=useState(false),[error,setError]=useState(''),[customFieldValues,setCustomFieldValues]=useState<Record<string,any>>({});
  useEffect(()=>{Promise.all([fetch('/api/lists').then(r=>r.json()),fetch('/api/products').then(r=>r.json())]).then(([a,b])=>{setPharmacies(a.data?.pharmacies||[]);setCatalog(b.products||[])})},[]);
  const products=useMemo(()=>BUSINESS_PRODUCT_OPTIONS.map(x=>({...x,product:catalog.find(p=>p.name.toLowerCase()===x.canonicalName.toLowerCase())})).filter(x=>x.product),[catalog]);
  async function submit(e:React.FormEvent){
    e.preventDefault();
    if(isClosed){setError(l('Submission window closed for this date. Reports must be submitted by maximum 9:00 AM the next day. The system cannot accept reporting after this time.','انتهت مهلة التقديم لهذا اليوم (الحد الأقصى 9:00 صباحاً في اليوم التالي). لا يقبل النظام تقارير بعد هذا الوقت.'));return;}
    if(!pharmacyId||!productIds.length||visitType==='Double'&&!companion.trim()){setError(l('Select a pharmacy and product, and enter a companion for a Double visit.','اختر الصيدلية والمنتج وأدخل المرافق للزيارة المشتركة.'));return}
    setSaving(true);
    try{
      const r=await fetch('/api/reports/pharmacy',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pharmacyId,productIds,notes,visitType,companion,visitDate,customFieldValues})});
      const x=await r.json();
      if(!r.ok||!x.success)throw new Error(x.message);
      onSuccess(l('Pharmacy visit saved.','تم حفظ زيارة الصيدلية.'));
      setPharmacyId('');setProductIds([]);setNotes('');setVisitType('Single');setCompanion('');setCustomFieldValues({});setError('')
    }catch(reason){const message=reason instanceof Error?reason.message:'Unable to save';setError(message);onError(message)}finally{setSaving(false)}
  }
  return (
    <form onSubmit={submit} className="space-y-5">
      <h2 className="text-2xl font-black">{l('Pharmacy Submit Visit','تسجيل زيارة صيدلية')}</h2>
      {error&&<InlineAlert tone="error">{error}</InlineAlert>}
      <label className="block text-sm font-semibold">
        {l('Visit Date','تاريخ الزيارة')} *
        <input required type="date" className="input mt-1 w-full" value={visitDate} min={windowStatus.minAllowedDate} max={windowStatus.maxAllowedDate} onChange={e=>setVisitDate(e.target.value)}/>
      </label>
      {isClosed&&<InlineAlert tone="error">{l('Submission window closed for this date. Reports are accepted maximum the next day at 9:00 AM. System cannot accept reporting after this time.','انتهت مهلة التقديم لهذا التاريخ (الحد الأقصى 9:00 صباحاً في اليوم التالي). لا يقبل النظام تقارير بعد هذا الوقت.')}</InlineAlert>}
      <label className="block text-sm font-semibold">
        {l('Pharmacy','الصيدلية')} *
        <select required className="input mt-1 w-full" value={pharmacyId} onChange={e=>setPharmacyId(e.target.value)}>
          <option value="">{l('Select saved pharmacy…','اختر صيدلية محفوظة…')}</option>
          {pharmacies.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
      </label>
      <SavedCustomerDetails category="pharmacy" customer={pharmacies.find(x=>x.id===pharmacyId)} visitMode={visitType} companion={companion} onVisitModeChange={value=>{setVisitType(value);if(value==='Single')setCompanion('')}} onCompanionChange={setCompanion}/>
      <CustomFieldsRenderer section="pharmacy_visit" values={customFieldValues} onChange={setCustomFieldValues}/>
      <fieldset>
        <legend className="font-bold">{l('Products Discussed','المنتجات التي تمت مناقشتها')}</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {products.map(({label,product})=><label key={product!.id} className="flex gap-2"><input type="checkbox" checked={productIds.includes(product!.id)} onChange={e=>setProductIds(ids=>e.target.checked?[...ids,product!.id]:ids.filter(id=>id!==product!.id))}/>{label}</label>)}
        </div>
      </fieldset>
      <FormField multiline label={l('Notes','ملاحظات')} value={notes} onChange={setNotes}/>
      <Button type="submit" isLoading={saving} disabled={isClosed}>
        {isClosed?l('Closed (Past 9:00 AM)','مغلق (بعد 9:00 ص)'):l('Submit','إرسال')}
      </Button>
    </form>
  );
}

