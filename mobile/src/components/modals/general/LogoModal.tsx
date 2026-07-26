import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Upload, RotateCcw } from 'lucide-react';
import { ImageCropModal } from './ImageCropModal';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';

interface LogoModalProps {
  isOpen: boolean;
  onClose: () => void;
  customLogo: string | null;
  onLogoChange: (logo: string | null) => void;
}

export const LogoModal: React.FC<LogoModalProps> = ({
  isOpen,
  onClose,
  customLogo,
  onLogoChange
}) => {
  const { t } = useTranslation();
  const { handleManualClose } = useModalBackHandler(isOpen, onClose);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

  if (!isOpen) return null;

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
    onClose();
  };

  const handleResetLogo = () => {
    localStorage.removeItem('past_you_custom_logo');
    onLogoChange(null);
    onClose();
  };

  return (
    <>
      <div
        onClick={handleManualClose}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 cursor-pointer"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm bg-bg-surface border border-border-brand rounded-2xl shadow-2xl flex flex-col cursor-default overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border-brand">
            <h3 className="text-lg font-bold text-text-primary m-0">
              {t("settings.logoTitle", "App Logo")}
            </h3>
            <button
              onClick={handleManualClose}
              className="p-1.5 rounded-lg hover:bg-bg-app transition-colors text-text-secondary cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 flex flex-col items-center gap-4 text-center">
            <p className="text-xs text-text-secondary m-0">
              {t("settings.logoDesc", "Customize the in-app header logo. Supports standard image formats.")}
            </p>

            {/* Logo Preview */}
            <div className="relative group my-2">
              <img
                src={customLogo || "/logo.png"}
                alt={t("settings.logoPreviewAlt", "Logo preview")}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-border-brand bg-bg-app/40 shadow-inner"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2.5 w-full pt-2">
              <label className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold bg-accent-brand hover:bg-accent-brand-hover text-bg-app rounded-xl transition-all cursor-pointer select-none active:scale-95 shadow-sm">
                <Upload size={16} />
                <span>{t("settings.logoUpload", "Upload Image")}</span>
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
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold bg-bg-app border border-border-brand hover:border-red-500 hover:text-red-500 text-text-primary rounded-xl transition-all cursor-pointer select-none active:scale-95"
                >
                  <RotateCcw size={16} />
                  <span>{t("settings.logoReset", "Reset")}</span>
                </button>
              )}
            </div>
          </div>
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
    </>
  );
};
