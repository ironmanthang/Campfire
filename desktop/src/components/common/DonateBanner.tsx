import { useTranslation } from "react-i18next";

interface DonateBannerProps {
  show: boolean;
  reason: "count" | "streak" | null;
  onSupport: () => void;
  onMaybeLater: () => void;
  onNeverAsk: () => void;
}

export function DonateBanner({
  show,
  reason,
  onSupport,
  onMaybeLater,
  onNeverAsk,
}: DonateBannerProps) {
  const { t } = useTranslation();

  if (!show) return null;

  return (
    <div className="bg-accent-brand/10 border-b border-border-brand/40 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-lg">🎉</span>
        <p className="text-xs font-semibold leading-relaxed text-text-primary">
          {reason === "count"
            ? t("donateBanner.countMessage", { count: 10 })
            : t("donateBanner.streakMessage", { streak: 30 })}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto flex-wrap">
        <button
          onClick={onSupport}
          className="px-3.5 py-1.5 rounded-lg bg-accent-brand text-bg-app font-bold text-xs shadow hover:bg-accent-brand/90 transition-all cursor-pointer"
        >
          {t("donateBanner.supportBtn")}
        </button>
        <button
          onClick={onMaybeLater}
          className="px-3 py-1.5 rounded-lg bg-bg-surface border border-border-brand hover:border-accent-brand text-xs font-bold text-text-primary transition-all cursor-pointer"
        >
          {t("donateBanner.maybeLaterBtn")}
        </button>
        <button
          onClick={onNeverAsk}
          className="px-3 py-1.5 rounded-lg bg-bg-surface border border-border-brand hover:border-accent-brand text-xs font-bold text-text-primary transition-all cursor-pointer"
        >
          {t("donateBanner.dontAskBtn", { defaultValue: "Don't Ask Again" })}
        </button>
      </div>
    </div>
  );
}
