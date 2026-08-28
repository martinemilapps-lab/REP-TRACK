'use client';

import React from 'react';
import { CustomSelect, SelectOption } from '@/components/ui/CustomSelect';
import { useTranslation } from '@/lib/i18nContext';
import { MasterHospital, MasterPharmacy, MasterDoctor, MasterBranch } from '@/types';

type MasterCustomer = MasterHospital | MasterPharmacy | MasterDoctor | MasterBranch;

interface MasterCustomerPickerProps {
  category: 'hospitals' | 'pharmacies' | 'doctors' | 'branches';
  items: MasterCustomer[];
  selectedId: string;
  onSelect: (item: any) => void;
  onClear: () => void;
  selectedRep: string;
}

export function MasterCustomerPicker({
  category,
  items,
  selectedId,
  onSelect,
  onClear,
  selectedRep,
}: MasterCustomerPickerProps) {
  const { t, language } = useTranslation();

  const getCategoryIcon = () => {
    switch (category) {
      case 'hospitals':
        return '🏥';
      case 'pharmacies':
        return '💊';
      case 'doctors':
        return '🩺';
      case 'branches':
        return '🏢';
    }
  };

  const getPlaceholder = () => {
    switch (category) {
      case 'hospitals':
        return t('lists.chooseHospital');
      case 'pharmacies':
        return t('lists.choosePharmacy');
      case 'doctors':
        return t('lists.chooseDoctor');
      case 'branches':
        return t('lists.chooseBranch');
    }
  };

  const options: SelectOption[] = React.useMemo(() => {
    const list: SelectOption[] = [
      {
        value: '__manual__',
        label: t('lists.manualCustomerOption'),
      },
    ];

    for (const item of items) {
      let badge: string | undefined;
      let sublabelParts: (string | undefined)[] = [];

      if (category === 'hospitals') {
        const h = item as MasterHospital;
        badge = h.type ? (h.type === 'Private' ? (language === 'ar' ? 'خاص' : 'Private') : h.type) : undefined;
        sublabelParts = [
          h.area,
          h.dept,
          h.contact ? `المسؤول: ${h.contact}` : undefined,
          h.defaultCycle ? `دورة: ${h.defaultCycle} يوم` : undefined,
        ];
      } else if (category === 'pharmacies') {
        const p = item as MasterPharmacy;
        badge = p.classification ? `Class ${p.classification}` : undefined;
        sublabelParts = [
          p.area,
          p.pharmacist ? `الصيدلي: ${p.pharmacist}` : undefined,
          p.defaultCycle ? `دورة: ${p.defaultCycle} يوم` : undefined,
        ];
      } else if (category === 'doctors') {
        const d = item as MasterDoctor;
        badge = d.classification ? `Class ${d.classification}` : undefined;
        sublabelParts = [
          d.specialty,
          d.area || d.workplace,
          d.defaultCycle ? `دورة: ${d.defaultCycle} يوم` : undefined,
        ];
      } else if (category === 'branches') {
        const b = item as MasterBranch;
        badge = b.defaultCycle ? `دورة: ${b.defaultCycle} يوم` : undefined;
        sublabelParts = [
          b.coverageArea,
          b.contact ? `المسؤول: ${b.contact}` : undefined,
        ];
      }

      const sublabel = sublabelParts.filter(Boolean).join(' • ');

      list.push({
        value: item.id,
        label: item.name,
        badge,
        sublabel: sublabel || undefined,
      });
    }

    return list;
  }, [items, category, language, t]);

  const selectedItem = React.useMemo(() => {
    return items.find((x) => x.id === selectedId);
  }, [items, selectedId]);

  const handleChange = (val: string) => {
    if (val === '__manual__' || !val) {
      onClear();
      return;
    }
    const found = items.find((x) => x.id === val);
    if (found) {
      onSelect(found);
    }
  };

  return (
    <div className="bg-gradient-to-r from-amber-50/90 via-amber-50/50 to-orange-50/80 border-2 border-amber-300/80 rounded-2xl p-4 md:p-5 mb-5 shadow-sm space-y-3 animate-fade-in">
      {/* Header with Title & Badge Count */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xl">{getCategoryIcon()}</span>
          <div>
            <h3 className="text-xs md:text-sm font-black text-amber-950 flex items-center gap-1.5">
              <span>{t('lists.pickerTitle')}</span>
            </h3>
            <p className="text-[11px] text-amber-900/80 leading-relaxed">
              {t('lists.pickerSubtitle')}
            </p>
          </div>
        </div>

        {items.length > 0 && (
          <span className="text-[11px] font-extrabold px-2.5 py-1 bg-amber-200/80 text-amber-900 border border-amber-400/60 rounded-full flex items-center gap-1 shadow-2xs">
            <span>📋</span>
            <span>{items.length} {t('lists.registeredCustomersCount')}</span>
          </span>
        )}
      </div>

      {/* Selector Control */}
      {items.length > 0 ? (
        <div className="space-y-2.5">
          <div className="max-w-xl">
            <CustomSelect
              options={options}
              value={selectedId || '__manual__'}
              onChange={handleChange}
              placeholder={getPlaceholder()}
              searchable={true}
              className="shadow-xs"
            />
          </div>

          {/* Auto-filled Success Confirmation Card */}
          {selectedItem && (
            <div className="p-3 bg-white/95 border border-emerald-300 rounded-xl flex items-center justify-between gap-3 shadow-2xs animate-fade-in flex-wrap">
              <div className="flex items-center gap-2 text-xs text-emerald-900 font-bold">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xs shrink-0">
                  ✓
                </span>
                <div>
                  <span className="font-extrabold text-emerald-950">
                    {selectedItem.name}
                  </span>
                  <span className="text-[11px] text-emerald-700 font-medium ms-1">
                    — {t('lists.autoFilledNotice')}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClear}
                className="text-[11px] font-bold text-gray-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
              >
                ✕ {t('lists.changeCustomer')}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="p-3 bg-white/80 border border-amber-200 rounded-xl text-xs text-amber-900/90 leading-relaxed flex items-center gap-2">
          <span>💡</span>
          <span>{t('lists.noSavedCustomersHint')}</span>
        </div>
      )}
    </div>
  );
}
