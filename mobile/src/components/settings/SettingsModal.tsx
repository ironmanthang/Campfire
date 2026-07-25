import React from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { APP_VERSION } from '../../lib/appVersion';
import { ThemeSection } from './ThemeSection';
import { FontSizeSection } from './FontSizeSection';
import { LanguageSection } from './LanguageSection';
import { BrandingSection } from './BrandingSection';
import { GoogleDriveSection } from './GoogleDriveSection';
import { DesktopSection } from './DesktopSection';
import { ExportSection } from './ExportSection';
import { DebugLogsSection } from './DebugLogsSection';

interface SettingsModalProps {
  onClose: () => void;
  onThemeToggle: () => void;
  theme: 'light' | 'dark';
  customLogo: string | null;
  onLogoChange: (logo: string | null) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  onThemeToggle,
  theme,
  customLogo,
  onLogoChange
}) => {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-bg-surface border border-border-brand rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-brand">
          <h2 className="text-xl font-bold tracking-tight text-text-primary m-0">{t("settings.title")}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg-app transition-colors text-text-secondary">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-6">
          {/* Theme setting */}
          <ThemeSection theme={theme} onThemeToggle={onThemeToggle} />

          <hr className="border-border-brand" />

          {/* Font Size setting */}
          <FontSizeSection />

          <hr className="border-border-brand" />

          {/* Language setting */}
          <LanguageSection />

          <hr className="border-border-brand" />

          {/* Version badge */}
          <div className="flex items-center justify-between text-[11px] text-text-secondary">
            <span>{t('settings.versionLabel', { defaultValue: 'App version' })}</span>
            <span className="font-mono">v{APP_VERSION}</span>
          </div>

          <hr className="border-border-brand" />

          {/* Custom Logo setting */}
          <BrandingSection customLogo={customLogo} onLogoChange={onLogoChange} />

          <hr className="border-border-brand" />

          {/* Google Drive Configuration */}
          <GoogleDriveSection />

          <hr className="border-border-brand" />

          {/* Desktop App Guidance Section */}
          <DesktopSection />

          <hr className="border-border-brand" />

          {/* Export data section */}
          <ExportSection />

          {/* Debug logs section */}
          <DebugLogsSection />

          {/* Privacy & Terms Links */}
          <div className="flex justify-center items-center gap-3 pt-6 border-t border-border-brand/40 text-[11px] text-text-secondary">
            <a
              href="/privacy/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent-brand hover:underline transition-colors"
            >
              {t("settings.privacyLink")}
            </a>
            <span className="text-border-brand">•</span>
            <a
              href="/terms/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent-brand hover:underline transition-colors"
            >
              {t("settings.termsLink")}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
