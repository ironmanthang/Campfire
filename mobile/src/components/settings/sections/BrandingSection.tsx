import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ImageCropModal } from '../../modals';

interface BrandingSectionProps {
  customLogo: string | null;
  onLogoChange: (logo: string | null) => void;
}

export const BrandingSection: React.FC<BrandingSectionProps> = ({ customLogo, onLogoChange }) => {
  const { t } = useTranslation();
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setCropImageSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropConfirm = (croppedBase64: string) => {
    localStorage.setItem('past_you_custom_logo', croppedBase64);
    onLogoChange(croppedBase64);
    setCropImageSrc(null);
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
              onChange={handleFileSelect}
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

      {cropImageSrc && (
        <ImageCropModal
          isOpen={!!cropImageSrc}
          imageSrc={cropImageSrc}
          onClose={() => setCropImageSrc(null)}
          onConfirm={handleCropConfirm}
        />
      )}
    </div>
  );
};
