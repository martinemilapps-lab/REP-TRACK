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

export function I18nProvider({ children }: { children: ReactNode }) {
  // Default to Arabic
  const [language, setLanguageState] = useState<Language>('ar');

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
      const item = translations[key];
      if (!item) {
        return fallback || key;
      }
      return item[language] || item['ar'] || fallback || key;
    },
    [language]
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
