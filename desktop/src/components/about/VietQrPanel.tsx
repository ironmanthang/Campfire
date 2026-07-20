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
        <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider">
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
        <div className="flex justify-between items-start text-[10px] text-text-secondary/60 leading-normal gap-4">
          <span>
            {t("aboutModal.supportNotifyTip")}
          </span>
          <span className="shrink-0 font-mono text-[9px] bg-bg-app/30 border border-border-brand/20 px-1.5 py-0.5 rounded">
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

      {/* VND Tiers table */}
      <div className="mt-4 border-t border-border-brand/20 pt-4">
        <h5 className="text-xs font-bold text-text-primary mb-2">
          {t("aboutModal.presetTiersTitle")}
        </h5>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border-brand/25 text-text-secondary">
                <th className="py-1.5 pr-2 font-bold">{t("aboutModal.tierTableMetaphor")}</th>
                <th className="py-1.5 px-2 font-bold">{t("aboutModal.tierTableAmount")}</th>
                <th className="py-1.5 pl-2 font-bold">{t("aboutModal.tierTableDescription")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-brand/10 text-text-secondary">
              <tr>
                <td className="py-2 pr-2 font-semibold text-text-primary">{t("aboutModal.vndTier1Name")}</td>
                <td className="py-2 px-2 font-mono whitespace-nowrap">{t("aboutModal.vndTier1Amount")}</td>
                <td className="py-2 pl-2 leading-relaxed">{t("aboutModal.vndTier1Desc")}</td>
              </tr>
              <tr>
                <td className="py-2 pr-2 font-semibold text-text-primary">{t("aboutModal.vndTier2Name")}</td>
                <td className="py-2 px-2 font-mono whitespace-nowrap">{t("aboutModal.vndTier2Amount")}</td>
                <td className="py-2 pl-2 leading-relaxed">{t("aboutModal.vndTier2Desc")}</td>
              </tr>
              <tr>
                <td className="py-2 pr-2 font-semibold text-text-primary">{t("aboutModal.vndTier3Name")}</td>
                <td className="py-2 px-2 font-mono whitespace-nowrap">{t("aboutModal.vndTier3Amount")}</td>
                <td className="py-2 pl-2 leading-relaxed">{t("aboutModal.vndTier3Desc")}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
