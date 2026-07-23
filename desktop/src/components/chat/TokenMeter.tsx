import { Loader2, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface TokenMeterProps {
  loadingChatContext: boolean;
  tokenInfo: {
    count: number;
    limit: number;
    status: "safe" | "warning" | "blocked";
  };
}

export function TokenMeter({ loadingChatContext, tokenInfo }: TokenMeterProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-3 text-xs shrink-0">
      {loadingChatContext ? (
        <div className="flex items-center gap-1.5 text-text-secondary">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-accent-brand" />
          <span>{t("chatView.estimatingVolume")}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary font-mono">
            {t("chatView.contextSize", {
              count: tokenInfo.count.toLocaleString(),
              limit: tokenInfo.limit.toLocaleString(),
            })}
          </span>
          {tokenInfo.status === "blocked" ? (
            <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-500/20 text-xs flex items-center gap-1 animate-pulse font-semibold">
              <AlertCircle className="h-3 w-3 text-red-500 dark:text-red-400" />
              {t("chatView.statusOverLimit")}
            </span>
          ) : tokenInfo.status === "warning" ? (
            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 dark:bg-yellow-950/20 dark:text-yellow-400 dark:border-yellow-500/20 text-xs flex items-center gap-1 font-semibold">
              <AlertCircle className="h-3 w-3 text-amber-600 dark:text-yellow-400" />
              {t("chatView.statusWarning")}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-500/20 text-xs font-semibold">
              {t("chatView.statusSafe")}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
