import React, { createContext, useContext, useState, useMemo } from 'react';
import type { ReactNode } from 'react';
import { dictionaries } from '../lib/dictionaries';

type Language = 'en' | 'de' | 'es' | 'fr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  locale: string;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');

  const localeMap: Record<Language, string> = {
    en: 'en-US',
    de: 'de-DE',
    es: 'es-ES',
    fr: 'fr-FR',
  };

  const t = useMemo(() => {
    return (key: string) => {
      const dict = dictionaries[language] as any;
      if (dict[key] !== undefined && typeof dict[key] === 'string') return dict[key];
      const keys = key.split('.');
      let current = dict;
      for (const k of keys) {
        if (current === undefined || current === null) break;
        current = current[k];
      }
      return typeof current === 'string' ? current : key;
    };
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, locale: localeMap[language], t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
