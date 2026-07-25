import { Save } from "lucide-react";
import { useTranslation } from "react-i18next";

interface AutoSaveHelpTabProps {
  subTab?: string;
}

export function AutoSaveHelpTab({ subTab }: AutoSaveHelpTabProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 animate-fade-in">
      <h3 className="text-base font-bold text-accent-brand flex items-center gap-2 border-b border-border-brand/20 pb-2">
        <Save className="h-4.5 w-4.5" />
        {t("help.autoSave.title")}
      </h3>
      <div className="space-y-3">
        {(!subTab || subTab === "save-desktop" || subTab === "auto-save") && (
          <>
            <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
              <span className="font-bold text-xs text-text-primary block mb-1">
                {t("help.autoSave.desktopIntervalTitle")}
              </span>
              <span className="text-xs text-text-secondary leading-relaxed">
                {t("help.autoSave.desktopIntervalDesc")}
              </span>
            </div>
            <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
              <span className="font-bold text-xs text-text-primary block mb-1">
                {t("help.autoSave.desktopLocationTitle")}
              </span>
              <span className="text-xs text-text-secondary leading-relaxed">
                {t("help.autoSave.desktopLocationDesc")}
              </span>
            </div>
            <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
              <span className="font-bold text-xs text-text-primary block mb-1">
                {t("help.autoSave.desktopManualTitle")}
              </span>
              <span className="text-xs text-text-secondary leading-relaxed">
                {t("help.autoSave.desktopManualDesc")}
              </span>
            </div>
          </>
        )}
        {(!subTab || subTab === "save-mobile" || subTab === "auto-save") && (
          <>
            <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
              <span className="font-bold text-xs text-text-primary block mb-1">
                {t("help.autoSave.mobileFastTitle")}
              </span>
              <span className="text-xs text-text-secondary leading-relaxed">
                {t("help.autoSave.mobileFastDesc")}
              </span>
            </div>
            <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
              <span className="font-bold text-xs text-text-primary block mb-1">
                {t("help.autoSave.mobileIndexedDbTitle")}
              </span>
              <span className="text-xs text-text-secondary leading-relaxed">
                {t("help.autoSave.mobileIndexedDbDesc")}
              </span>
            </div>
          </>
        )}
        {(!subTab || subTab === "save-flush" || subTab === "auto-save") && (
          <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
            <span className="font-bold text-xs text-text-primary block mb-1">
              {t("help.autoSave.flushProtectionTitle")}
            </span>
            <span className="text-xs text-text-secondary leading-relaxed">
              {t("help.autoSave.flushProtectionDesc")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
