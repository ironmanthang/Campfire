import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Moon } from 'lucide-react';

interface ThemeSectionProps {
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
}

export const ThemeSection: React.FC<ThemeSectionProps> = ({ theme, onThemeToggle }) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="font-semibold text-text-primary">{t("settings.themeTitle")}</h3>
        <p className="text-xs text-text-secondary">{t("settings.themeDesc")}</p>
      </div>
      <button
        onClick={onThemeToggle}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-app border border-border-brand hover:border-accent-brand text-text-primary transition-all duration-200"
      >
        {theme === 'dark' ? (
          <>
            <Moon size={16} className="text-accent-brand" />
            <span>{t("settings.themeDark")}</span>
          </>
        ) : (
          <>
            <Sun size={16} className="text-accent-brand" />
            <span>{t("settings.themeLight")}</span>
          </>
        )}
      </button>
    </div>
  );
};
