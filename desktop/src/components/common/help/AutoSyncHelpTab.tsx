import { Cloud } from "lucide-react";
import { useTranslation } from "react-i18next";

interface AutoSyncHelpTabProps {
  subTab?: string;
}

export function AutoSyncHelpTab({ subTab }: AutoSyncHelpTabProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 animate-fade-in">
      <h3 className="text-base font-bold text-accent-brand flex items-center gap-2 border-b border-border-brand/20 pb-2">
        <Cloud className="h-4.5 w-4.5" />
        {t("help.autoSync.title")}
      </h3>
      <div className="space-y-3">
        {(!subTab || subTab === "sync-trigger" || subTab === "auto-sync") && (
          <>
            <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
              <span className="font-bold text-xs text-text-primary block mb-1">
                {t("help.autoSync.offByDefaultTitle")}
              </span>
              <span className="text-xs text-text-secondary leading-relaxed">
                {t("help.autoSync.offByDefaultDesc")}
              </span>
            </div>
            <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
              <span className="font-bold text-xs text-text-primary block mb-1">
                {t("help.autoSync.oneWriterRuleTitle")}
              </span>
              <span className="text-xs text-text-secondary leading-relaxed">
                {t("help.autoSync.oneWriterRuleDesc")}
              </span>
            </div>
            <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
              <span className="font-bold text-xs text-text-primary block mb-1">
                {t("help.autoSync.desktopTriggersTitle")}
              </span>
              <span className="text-xs text-text-secondary leading-relaxed">
                {t("help.autoSync.desktopTriggersDesc")}
              </span>
            </div>
            <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
              <span className="font-bold text-xs text-text-primary block mb-1">
                {t("help.autoSync.mobileTriggersTitle")}
              </span>
              <span className="text-xs text-text-secondary leading-relaxed">
                {t("help.autoSync.mobileTriggersDesc")}
              </span>
            </div>
          </>
        )}
        {(!subTab || subTab === "sync-merge" || subTab === "auto-sync") && (
          <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
            <span className="font-bold text-xs text-text-primary block mb-1">
              {t("help.autoSync.mergeEngineTitle")}
            </span>
            <span className="text-xs text-text-secondary leading-relaxed">
              {t("help.autoSync.mergeEngineDesc")}
              <ul className="list-disc pl-4.5 mt-1.5 space-y-1">
                <li>{t("help.autoSync.mergeNothing")}</li>
                <li>{t("help.autoSync.mergeLocalOnly")}</li>
                <li>{t("help.autoSync.mergeCloudOnly")}</li>
                <li>{t("help.autoSync.mergeBoth")}</li>
              </ul>
              <p className="mt-2 text-xs text-text-secondary">
                {t("help.autoSync.mergeTrick")}
              </p>
            </span>
          </div>
        )}
        {(!subTab || subTab === "sync-conflict" || subTab === "auto-sync") && (
          <>
            <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
              <span className="font-bold text-xs text-text-primary block mb-1">
                {t("help.autoSync.conflictBothKeptTitle")}
              </span>
              <span className="text-xs text-text-secondary leading-relaxed">
                {t("help.autoSync.conflictBothKeptDesc")}
              </span>
            </div>
            <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
              <span className="font-bold text-xs text-text-primary block mb-1">
                {t("help.autoSync.conflictFrozenTitle")}
              </span>
              <span className="text-xs text-text-secondary leading-relaxed">
                {t("help.autoSync.conflictFrozenDesc")}
              </span>
            </div>
            <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
              <span className="font-bold text-xs text-text-primary block mb-1">
                {t("help.autoSync.conflictResolveTitle")}
              </span>
              <span className="text-xs text-text-secondary leading-relaxed">
                {t("help.autoSync.conflictResolveDesc")}
              </span>
            </div>
          </>
        )}
        {(!subTab || subTab === "sync-backup" || subTab === "auto-sync") && (
          <>
            <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
              <span className="font-bold text-xs text-text-primary block mb-1">
                {t("help.autoSync.desktopBackupsTitle")}
              </span>
              <span className="text-xs text-text-secondary leading-relaxed">
                {t("help.autoSync.desktopBackupsDesc")}
              </span>
            </div>
            <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
              <span className="font-bold text-xs text-text-primary block mb-1">
                {t("help.autoSync.backupLimitTitle")}
              </span>
              <span className="text-xs text-text-secondary leading-relaxed">
                {t("help.autoSync.backupLimitDesc")}
              </span>
            </div>
            <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
              <span className="font-bold text-xs text-text-primary block mb-1">
                {t("help.autoSync.backupRollbackTitle")}
              </span>
              <span className="text-xs text-text-secondary leading-relaxed">
                {t("help.autoSync.backupRollbackDesc")}
              </span>
            </div>
            <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
              <span className="font-bold text-xs text-text-primary block mb-1">
                {t("help.autoSync.backupOnDemandTitle")}
              </span>
              <span className="text-xs text-text-secondary leading-relaxed">
                {t("help.autoSync.backupOnDemandDesc")}
              </span>
            </div>
            <p className="text-text-secondary text-xs leading-relaxed pt-2 italic">
              {t("help.autoSync.mobileNoteDesc")}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
