import { BookOpen } from "lucide-react";
import { useTranslation } from "react-i18next";

export function JournalHelpTab() {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 animate-fade-in">
      <h3 className="text-base font-bold text-accent-brand flex items-center gap-2 border-b border-border-brand/20 pb-2">
        <BookOpen className="h-4.5 w-4.5" />
        {t("help.journal.title")}
      </h3>
      <p className="text-text-secondary text-xs leading-relaxed">
        {t("help.journal.subtitle")}
      </p>
      <div className="space-y-3">
        <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
          <span className="font-bold text-xs text-text-primary block mb-1">
            {t("help.journal.startWritingTitle")}
          </span>
          <span className="text-xs text-text-secondary leading-relaxed">
            {t("help.journal.startWritingDesc")}
          </span>
        </div>
        <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
          <span className="font-bold text-xs text-text-primary block mb-1">
            {t("help.journal.textZoomTitle")}
          </span>
          <span className="text-xs text-text-secondary leading-relaxed">
            {t("help.journal.textZoomDesc")}
            <ul className="list-disc pl-4.5 mt-1.5 space-y-1">
              <li>{t("help.journal.zoomIn")}</li>
              <li>{t("help.journal.zoomOut")}</li>
              <li>{t("help.journal.zoomReset")}</li>
            </ul>
          </span>
        </div>
        <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
          <span className="font-bold text-xs text-text-primary block mb-1">
            {t("help.journal.dateNavTitle")}
          </span>
          <span className="text-xs text-text-secondary leading-relaxed">
            {t("help.journal.dateNavDesc1")}
            <code className="bg-bg-surface px-1.5 py-0.5 rounded font-mono text-xs border border-border-brand/50">Shift</code>
            {t("help.journal.dateNavDesc2")}
          </span>
        </div>
        <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
          <span className="font-bold text-xs text-text-primary block mb-1">
            {t("help.journal.autosaveTitle")}
          </span>
          <span className="text-xs text-text-secondary leading-relaxed">
            {t("help.journal.autosaveDesc")}
          </span>
        </div>
      </div>
      <p className="text-text-secondary text-xs leading-relaxed pt-2 italic">
        {t("help.journal.quote")}
      </p>
    </div>
  );
}
