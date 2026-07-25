import React from 'react';
import { useTranslation } from 'react-i18next';

interface BrandingSectionProps {
  customLogo: string | null;
  onLogoChange: (logo: string | null) => void;
}

export const BrandingSection: React.FC<BrandingSectionProps> = ({ customLogo, onLogoChange }) => {
  const { t } = useTranslation();

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      localStorage.setItem('past_you_custom_logo', base64String);
      onLogoChange(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogo = () => {
    localStorage.removeItem('past_you_custom_logo');
    onLogoChange(null);
  };

  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-semibold text-text-primary">{t("settings.logoTitle")}</h3>
        <p className="text-xs text-text-secondary">{t("settings.logoDesc")}</p>
      </div>
      <div className="flex items-center gap-4">
        <img
          src={customLogo || "/logo.png"}
          alt={t("settings.logoPreviewAlt")}
          className="w-12 h-12 rounded-xl object-cover border border-border-brand bg-bg-app/40 shrink-0"
        />
        <div className="flex gap-2 flex-1">
          <label className="flex-1 flex items-center justify-center py-2 px-3 text-xs font-semibold bg-accent-brand hover:bg-accent-brand-hover text-bg-app rounded-xl transition-all cursor-pointer text-center select-none active:scale-95">
            <span>{t("settings.logoUpload")}</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
          </label>
          {customLogo && (
            <button
              onClick={handleResetLogo}
              className="py-2 px-3 text-xs font-semibold bg-bg-app border border-border-brand hover:border-red-500 hover:text-red-500 text-text-primary rounded-xl transition-all cursor-pointer select-none active:scale-95"
            >
              {t("settings.logoReset")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
