import React from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { APP_VERSION } from '../../lib/appVersion';
import { FontSizeSection } from './FontSizeSection';
import { LanguageSection } from './LanguageSection';
import { GoogleDriveSection } from './GoogleDriveSection';
import { DesktopSection } from './DesktopSection';
import { ExportSection } from './ExportSection';
import { useModalBackHandler } from '../../hooks/useModalBackHandler';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose
}) => {
  const { t } = useTranslation();
  const { handleManualClose } = useModalBackHandler(true, onClose);

  return (
    <div
      onClick={handleManualClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-bg-surface border border-border-brand rounded-2xl shadow-2xl flex flex-col max-h-[90vh] cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-brand">
          <h2 className="text-xl font-bold tracking-tight text-text-primary m-0">{t("settings.title")}</h2>
          <button onClick={handleManualClose} className="p-1.5 rounded-lg hover:bg-bg-app transition-colors text-text-secondary">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-6">
          {/* Font Size setting */}
          <FontSizeSection />

          <hr className="border-border-brand" />

          {/* Language setting */}
          <LanguageSection />

          <hr className="border-border-brand" />

          {/* Google Drive Configuration */}
          <GoogleDriveSection />


          <hr className="border-border-brand" />

          {/* Desktop App Guidance Section */}
          <DesktopSection />

          <hr className="border-border-brand" />

          {/* Export data section */}
          <ExportSection />

          {/* Privacy & Terms & Version Links */}
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
            <span className="text-border-brand">•</span>
            <span className="font-mono opacity-80">v{APP_VERSION}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

