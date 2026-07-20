import { useTranslation } from "react-i18next";
import { ExternalLink } from "lucide-react";

interface KofiPanelProps {
  onDonateClick: () => void;
}

export function KofiPanel({ onDonateClick }: KofiPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 animate-fade-in">
      <p className="text-xs text-text-secondary leading-relaxed">
        {t("aboutModal.kofiDescription")}
      </p>

      <div className="pt-2">
        <button
          onClick={onDonateClick}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-accent-brand hover:bg-accent-brand/90 text-bg-app font-bold text-sm shadow-md transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
        >
          <span>{t("aboutModal.kofiButton")}</span>
          <ExternalLink className="h-4 w-4" />
        </button>
      </div>

      {/* Trust Badges */}
      <div className="flex flex-col items-center justify-center gap-1.5 py-1 border-b border-border-brand/10 pb-3">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg select-none">
          <img src="/assets/apple-pay.svg" alt="Apple Pay" className="h-4 object-contain opacity-75 hover:opacity-100 transition-opacity" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <img src="/assets/google-pay.svg" alt="Google Pay" className="h-4 object-contain opacity-75 hover:opacity-100 transition-opacity" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <img src="/assets/visa.svg" alt="Visa" className="h-3 object-contain opacity-75 hover:opacity-100 transition-opacity" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <img src="/assets/mastercard.svg" alt="Mastercard" className="h-4 object-contain opacity-75 hover:opacity-100 transition-opacity" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <img src="/assets/paypal.svg" alt="PayPal" className="h-3.5 object-contain opacity-75 hover:opacity-100 transition-opacity" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        </div>
        <span className="text-[9px] text-text-secondary/60 tracking-wide font-medium">
          {t("aboutModal.trustBadgesText")}
        </span>
      </div>

      {/* USD Tiers table */}
      <div className="mt-2">
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
                <td className="py-2 pr-2 font-semibold text-text-primary">{t("aboutModal.usdTier1Name")}</td>
                <td className="py-2 px-2 font-mono whitespace-nowrap">{t("aboutModal.usdTier1Amount")}</td>
                <td className="py-2 pl-2 leading-relaxed">{t("aboutModal.usdTier1Desc")}</td>
              </tr>
              <tr>
                <td className="py-2 pr-2 font-semibold text-text-primary">{t("aboutModal.usdTier2Name")}</td>
                <td className="py-2 px-2 font-mono whitespace-nowrap">{t("aboutModal.usdTier2Amount")}</td>
                <td className="py-2 pl-2 leading-relaxed">{t("aboutModal.usdTier2Desc")}</td>
              </tr>
              <tr>
                <td className="py-2 pr-2 font-semibold text-text-primary">{t("aboutModal.usdTier3Name")}</td>
                <td className="py-2 px-2 font-mono whitespace-nowrap">{t("aboutModal.usdTier3Amount")}</td>
                <td className="py-2 pl-2 leading-relaxed">{t("aboutModal.usdTier3Desc")}</td>
              </tr>
              <tr>
                <td className="py-2 pr-2 font-semibold text-text-primary">{t("aboutModal.usdTierCustomName")}</td>
                <td className="py-2 px-2 font-mono whitespace-nowrap">{t("aboutModal.usdTierCustomAmount")}</td>
                <td className="py-2 pl-2 leading-relaxed">{t("aboutModal.usdTierCustomDesc")}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
