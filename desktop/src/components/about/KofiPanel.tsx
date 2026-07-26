import { useTranslation } from "react-i18next";
import { Heart, ExternalLink } from "lucide-react";

interface KofiPanelProps {
  onDonateClick: () => void;
}

export function KofiPanel({ onDonateClick }: KofiPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <Heart className="h-5 w-5 text-red-500 fill-red-500 shrink-0" />
        <h4 className="text-sm font-bold text-text-primary">
          {t("aboutModal.supportTitle")}
        </h4>
      </div>

      <p className="text-xs text-text-secondary leading-relaxed">
        {t("aboutModal.supportDesc")}
      </p>

      {/* Ko-fi hosts its own message field on the donation page */}
      <p className="text-xs text-text-secondary/70 leading-relaxed border-t border-border-brand/20 pt-3">
        {t("aboutModal.supportNotifyTipKofi")}
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
    </div>
  );
}
