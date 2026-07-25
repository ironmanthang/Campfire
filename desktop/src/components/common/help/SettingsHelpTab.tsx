import { Settings } from "lucide-react";
import { useTranslation } from "react-i18next";

export function SettingsHelpTab() {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 animate-fade-in">
      <h3 className="text-base font-bold text-accent-brand flex items-center gap-2 border-b border-border-brand/20 pb-2">
        <Settings className="h-4.5 w-4.5" />
        {t("help.config.title")}
      </h3>
      <p className="text-text-secondary text-xs leading-relaxed">
        {t("help.config.subtitle")}
      </p>
      <div className="space-y-3">
        <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
          <span className="font-bold text-xs text-text-primary block mb-1">
            {t("help.config.identityTitle")}
          </span>
          <span className="text-xs text-text-secondary leading-relaxed">
            {t("help.config.identityDesc")}
            <ul className="list-disc pl-4.5 mt-1.5 space-y-1">
              <li>{t("help.config.identityName")}</li>
              <li>{t("help.config.identityFolder")}</li>
              <li>{t("help.config.identityAutosave")}</li>
              <li>{t("help.config.identityLanguage")}</li>
            </ul>
          </span>
        </div>
        <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
          <span className="font-bold text-xs text-text-primary block mb-1">
            {t("help.config.heartTitle")}
          </span>
          <span className="text-xs text-text-secondary leading-relaxed">
            {t("help.config.heartDesc")}
          </span>
        </div>
        <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
          <span className="font-bold text-xs text-text-primary block mb-1">
            {t("help.config.ollamaTitle")}
          </span>
          <span className="text-xs text-text-secondary leading-relaxed">
            {t("help.config.ollamaDesc")}
          </span>
        </div>
        <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
          <span className="font-bold text-xs text-text-primary block mb-1">
            {t("help.config.syncTitle")}
          </span>
          <span className="text-xs text-text-secondary leading-relaxed">
            {t("help.config.syncDesc")}
          </span>
        </div>
        <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
          <span className="font-bold text-xs text-text-primary block mb-1">
            {t("help.config.mobileTitle")}
          </span>
          <span className="text-xs text-text-secondary leading-relaxed">
            {t("help.config.mobileDesc")}
          </span>
        </div>
        <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
          <span className="font-bold text-xs text-text-primary block mb-1">
            {t("help.config.exportTitle")}
          </span>
          <span className="text-xs text-text-secondary leading-relaxed">
            {t("help.config.exportDesc")}
          </span>
        </div>
      </div>
      <p className="text-text-secondary text-xs leading-relaxed pt-2 italic">
        {t("help.config.quote")}
      </p>
    </div>
  );
}
