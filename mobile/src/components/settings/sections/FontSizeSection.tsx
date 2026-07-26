import React from 'react';
import { useTranslation } from 'react-i18next';
import { Type } from 'lucide-react';
import { useFontSize, type FontSizeOption } from '../../../hooks/useFontSize';

export const FontSizeSection: React.FC = () => {
  const { t } = useTranslation();
  const { fontSize, setFontSize } = useFontSize();

  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-semibold text-text-primary flex items-center gap-1.5">
          <Type size={16} className="text-accent-brand" />
          <span>{t("settings.fontSizeTitle")}</span>
        </h3>
        <p className="text-xs text-text-secondary">{t("settings.fontSizeDesc")}</p>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[
          { value: 'small', label: t("settings.fontSizeSmall") },
          { value: 'medium', label: t("settings.fontSizeMedium") },
          { value: 'large', label: t("settings.fontSizeLarge") },
          { value: 'xlarge', label: t("settings.fontSizeXLarge") }
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFontSize(opt.value as FontSizeOption)}
            className={`py-2.5 px-1 flex flex-col items-center justify-center rounded-xl border text-center transition-all cursor-pointer active:scale-95 ${
              fontSize === opt.value
                ? 'bg-accent-brand text-bg-app border-accent-brand font-bold'
                : 'bg-bg-app text-text-secondary border-border-brand hover:text-text-primary'
            }`}
          >
            <span className="text-xs font-semibold">{opt.label}</span>
          </button>
        ))}
      </div>
      {/* Live Text Preview Box */}
      <div className="p-3 rounded-xl bg-bg-app border border-border-brand">
        <span className="text-[10px] uppercase font-bold text-text-secondary block mb-1">
          {t("settings.fontSizePreviewLabel", { defaultValue: "Preview" })}
        </span>
        <p 
          className="text-text-primary leading-relaxed font-sans m-0 transition-all"
          style={{ fontSize: 'var(--editor-font-size)' }}
        >
          {t("settings.fontSizePreviewText", { defaultValue: "The quick brown fox jumps over the lazy dog." })}
        </p>
      </div>
    </div>
  );
};
