import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '../../../i18n/languages';
import { LANGUAGE_STORAGE_KEY } from '../../../i18n';
import i18n from '../../../i18n';

export const LanguageSection: React.FC = () => {
  const { t } = useTranslation();
  const [language, setLanguage] = useState<string>(
    localStorage.getItem(LANGUAGE_STORAGE_KEY) || i18n.language || 'en'
  );

  const handleLanguageChange = (val: string) => {
    setLanguage(val);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, val);
    i18n.changeLanguage(val);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold">{t("settings.languageLabel")}</label>
      <p className="text-xs text-text-secondary">{t("settings.languageDesc")}</p>
      <select
        value={language}
        onChange={(e) => handleLanguageChange(e.target.value)}
        className="w-full px-3.5 py-2 rounded-xl border border-border-brand bg-bg-app text-text-primary text-sm focus:outline-none focus:border-accent-brand transition-colors"
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
};
