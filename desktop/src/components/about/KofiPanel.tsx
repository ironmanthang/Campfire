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

    </div>
  );
}
