import { useTranslation } from "react-i18next";
import { Heart, ExternalLink } from "lucide-react";

interface VietQrPanelProps {
  customMessage: string;
  setCustomMessage: (val: string) => void;
  onDonateClick: () => void;
  characterLimit: number;
}

export function VietQrPanel({
  customMessage,
  setCustomMessage,
  onDonateClick,
  characterLimit,
}: VietQrPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <Heart className="h-5 w-5 text-red-500 fill-red-500/20 shrink-0" />
        <h4 className="text-sm font-bold text-text-primary">
          {t("aboutModal.supportTitle")}
        </h4>
      </div>

      <p className="text-xs text-text-secondary leading-relaxed">
        {t("aboutModal.supportDesc")}
      </p>

      {/* Custom Support Message */}
      <div className="space-y-2 border-t border-border-brand/20 pt-4">
        <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider">
          {t("aboutModal.supportMessageLabel")}
        </label>
        <input
          type="text"
          maxLength={characterLimit}
          value={customMessage}
          onChange={(e) => setCustomMessage(e.target.value)}
          placeholder={t("aboutModal.supportMessagePlaceholder")}
          className="w-full px-3 py-2 rounded-xl border border-border-brand/40 bg-bg-input text-text-primary text-xs font-semibold placeholder:text-text-secondary/40 focus:border-accent-brand focus:ring-1 focus:ring-accent-brand/35 outline-none transition-colors"
        />
        <div className="flex justify-between items-start text-xs text-text-secondary/60 leading-normal gap-4">
          <span>
            {t("aboutModal.supportNotifyTipVietQR")}
          </span>
          <span className="shrink-0 font-mono text-xs bg-bg-app/30 border border-border-brand/20 px-1.5 py-0.5 rounded">
            {customMessage.length}/{characterLimit}
          </span>
        </div>
      </div>

      <div className="pt-2">
        <button
          onClick={onDonateClick}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-accent-brand hover:bg-accent-brand/90 text-bg-app font-bold text-sm shadow-md transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
        >
          <span>{t("aboutModal.donateButton")}</span>
          <ExternalLink className="h-4 w-4" />
        </button>
      </div>

    </div>
  );
}
