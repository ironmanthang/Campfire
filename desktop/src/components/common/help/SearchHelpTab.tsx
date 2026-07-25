import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";

export function SearchHelpTab() {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 animate-fade-in">
      <h3 className="text-base font-bold text-accent-brand flex items-center gap-2 border-b border-border-brand/20 pb-2">
        <Search className="h-4.5 w-4.5" />
        {t("help.search.title")}
      </h3>
      <p className="text-text-secondary text-xs leading-relaxed">
        {t("help.search.subtitle")}
      </p>
      <div className="space-y-3">
        <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
          <span className="font-bold text-xs text-text-primary block mb-1">
            {t("help.search.modesTitle")}
          </span>
          <span className="text-xs text-text-secondary leading-relaxed">
            {t("help.search.modesDesc")}
            <ul className="list-disc pl-4.5 mt-1.5 space-y-1">
              <li>{t("help.search.modeKeyword")}</li>
              <li>{t("help.search.modeSemantic")}</li>
            </ul>
          </span>
        </div>
        <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
          <span className="font-bold text-xs text-text-primary block mb-1">
            {t("help.search.tagsTitle")}
          </span>
          <span className="text-xs text-text-secondary leading-relaxed">
            {t("help.search.tagsDesc")}
          </span>
        </div>
        <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
          <span className="font-bold text-xs text-text-primary block mb-1">
            {t("help.search.readingResultsTitle")}
          </span>
          <span className="text-xs text-text-secondary leading-relaxed">
            {t("help.search.readingResultsDesc")}
          </span>
        </div>
        <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
          <span className="font-bold text-xs text-text-primary block mb-1">
            {t("help.search.editorTransitionTitle")}
          </span>
          <span className="text-xs text-text-secondary leading-relaxed">
            {t("help.search.editorTransitionDesc")}
          </span>
        </div>
        <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
          <span className="font-bold text-xs text-text-primary block mb-1">
            {t("help.search.timeWindowTitle")}
          </span>
          <span className="text-xs text-text-secondary leading-relaxed">
            {t("help.search.timeWindowDesc")}
          </span>
        </div>
        <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
          <span className="font-bold text-xs text-text-primary block mb-1">
            {t("help.search.tagCloudTitle")}
          </span>
          <span className="text-xs text-text-secondary leading-relaxed">
            {t("help.search.tagCloudDesc")}
          </span>
        </div>
      </div>
      <p className="text-text-secondary text-xs leading-relaxed pt-2 italic">
        {t("help.search.quote")}
      </p>
    </div>
  );
}
