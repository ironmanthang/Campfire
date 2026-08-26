import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Monitor, Copy, Check, ExternalLink, HardDrive, RefreshCw } from 'lucide-react';

interface DesktopSectionProps {
  storeUrl?: string;
}

export const DesktopSection: React.FC<DesktopSectionProps> = ({
  storeUrl = 'https://apps.microsoft.com/detail/9P40G2GTC6GG'
}) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-semibold text-text-primary text-sm flex items-center gap-2">
          <Monitor size={16} className="text-accent-brand" />
          <span>{t("settings.desktopTitle")}</span>
        </h3>
        <p className="text-xs text-text-secondary mt-0.5">
          {t("settings.desktopDesc")}
        </p>
      </div>

      <div className="p-3.5 bg-bg-app border border-border-brand rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <HardDrive size={14} className="text-accent-brand shrink-0" />
          <span>{t("settings.desktopFeature1")}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <RefreshCw size={14} className="text-accent-brand shrink-0" />
          <span>{t("settings.desktopFeature2")}</span>
        </div>

        <div className="flex flex-col xs:flex-row gap-2 pt-1">
          <a
            href={storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-semibold bg-accent-brand hover:bg-accent-brand-hover text-bg-app rounded-xl transition-all cursor-pointer no-underline text-center active:scale-95 min-h-[44px]"
          >
            <ExternalLink size={15} className="shrink-0" />
            <span className="leading-tight">{t("settings.desktopStoreButton")}</span>
          </a>
          <button
            onClick={handleCopyLink}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-semibold bg-bg-surface border border-border-brand hover:border-accent-brand text-text-primary rounded-xl transition-all cursor-pointer active:scale-95 min-h-[44px]"
            title={t("settings.desktopCopyLink")}
          >
            {copied ? (
              <>
                <Check size={15} className="text-accent-brand shrink-0" />
                <span className="text-accent-brand leading-tight">{t("settings.desktopCopied")}</span>
              </>
            ) : (
              <>
                <Copy size={15} className="text-text-secondary shrink-0" />
                <span className="leading-tight">{t("settings.desktopCopyLink")}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
