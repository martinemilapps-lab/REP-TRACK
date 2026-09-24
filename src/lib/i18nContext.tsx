'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Language, Direction, translations } from './i18n';

interface I18nContextType {
  language: Language;
  direction: Direction;
  t: (key: string, fallback?: string) => string;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'rep_track_lang';
const OVERRIDES_STORAGE_KEY = 'reptrack_text_overrides';

interface TextOverrideItem {
  key: string;
  originalEn?: string;
  originalAr?: string;
  overrideEn: string;
  overrideAr: string;
  isActive: boolean;
}

function getStoredOverrides(): TextOverrideItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(OVERRIDES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [overrideVersion, setOverrideVersion] = useState(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language | null;
      if (saved === 'ar' || saved === 'en') {
        setLanguageState(saved);
      }
    } catch {
      // Ignore localStorage unavailable
    }
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      setOverrideVersion((v) => v + 1);
    };
    window.addEventListener('reptrack_admin_update', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('reptrack_admin_update', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const direction: Direction = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = direction;
      document.documentElement.lang = language;
    }
  }, [direction, language]);

  const setLanguage = useCallback((newLang: Language) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
    } catch {
      // ignore
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  }, [language, setLanguage]);

  const t = useCallback(
    (key: string, fallback?: string): string => {
      const overrides = getStoredOverrides();
      const match = overrides.find((o) => o.isActive && (o.key === key || o.originalEn === key || o.originalAr === key));
      if (match) {
        const val = language === 'ar' ? match.overrideAr : match.overrideEn;
        if (val && val.trim()) return val;
      }

      const item = translations[key];
      if (!item) {
        return fallback || key;
      }
      return item[language] || fallback || key;
    },
    [language, overrideVersion] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <I18nContext.Provider value={{ language, direction, t, setLanguage, toggleLanguage }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}

