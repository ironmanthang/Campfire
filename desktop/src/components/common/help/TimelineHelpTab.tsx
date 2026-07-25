import { History } from "lucide-react";
import { useTranslation } from "react-i18next";

export function TimelineHelpTab() {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 animate-fade-in">
      <h3 className="text-base font-bold text-accent-brand flex items-center gap-2 border-b border-border-brand/20 pb-2">
        <History className="h-4.5 w-4.5" />
        {t("help.timeline.title")}
      </h3>
      <p className="text-text-secondary text-xs leading-relaxed">
        {t("help.timeline.subtitle")}
      </p>
      <div className="space-y-3">
        <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
          <span className="font-bold text-xs text-text-primary block mb-1">
            {t("help.timeline.cardsTitle")}
          </span>
          <span className="text-xs text-text-secondary leading-relaxed">
            {t("help.timeline.cardsDesc")}
          </span>
        </div>
        <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
          <span className="font-bold text-xs text-text-primary block mb-1">
            {t("help.timeline.tagsTitle")}
          </span>
          <span className="text-xs text-text-secondary leading-relaxed">
            {t("help.timeline.tagsDesc1")}
            <span className="text-accent-brand font-mono">#gym</span>
            {t("help.timeline.tagsDesc2")}
          </span>
        </div>
        <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
          <span className="font-bold text-xs text-text-primary block mb-1">
            {t("help.timeline.clickModesTitle")}
          </span>
          <span className="text-xs text-text-secondary leading-relaxed">
            {t("help.timeline.clickModesDesc")}
            <ul className="list-disc pl-4.5 mt-1.5 space-y-1">
              <li>{t("help.timeline.clickOpen")}</li>
              <li>{t("help.timeline.clickSelect")}</li>
            </ul>
          </span>
        </div>
        <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
          <span className="font-bold text-xs text-text-primary block mb-1">
            {t("help.timeline.datePickerTitle")}
          </span>
          <span className="text-xs text-text-secondary leading-relaxed">
            {t("help.timeline.datePickerDesc")}
          </span>
        </div>
        <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
          <span className="font-bold text-xs text-text-primary block mb-1">
            {t("help.timeline.paginationTitle")}
          </span>
          <span className="text-xs text-text-secondary leading-relaxed">
            {t("help.timeline.paginationDesc")}
          </span>
        </div>
      </div>
      <p className="text-text-secondary text-xs leading-relaxed pt-2 italic">
        {t("help.timeline.quote")}
      </p>
    </div>
  );
}
