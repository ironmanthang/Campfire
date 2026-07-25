import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

export function ReflectionHelpTab() {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 animate-fade-in">
      <h3 className="text-base font-bold text-accent-brand flex items-center gap-2 border-b border-border-brand/20 pb-2">
        <Sparkles className="h-4.5 w-4.5" />
        {t("help.reflection.title")}
      </h3>
      <p className="text-text-secondary text-xs leading-relaxed">
        {t("help.reflection.subtitle")}
      </p>
      <div className="space-y-3">
        <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
          <span className="font-bold text-xs text-text-primary block mb-1">
            {t("help.reflection.structureTitle")}
          </span>
          <span className="text-xs text-text-secondary leading-relaxed">
            {t("help.reflection.structureDesc")}
            <ul className="list-disc pl-4.5 mt-1.5 space-y-1">
              <li>{t("help.reflection.themeRecurring")}</li>
              <li>{t("help.reflection.themeEmotional")}</li>
              <li>{t("help.reflection.themeProgress")}</li>
              <li>{t("help.reflection.themeChallenges")}</li>
              <li>{t("help.reflection.themeRecommendations")}</li>
            </ul>
          </span>
        </div>
        <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
          <span className="font-bold text-xs text-text-primary block mb-1">
            {t("help.reflection.dateRangeTitle")}
          </span>
          <span className="text-xs text-text-secondary leading-relaxed">
            {t("help.reflection.dateRangeDesc")}
          </span>
        </div>
        <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
          <span className="font-bold text-xs text-text-primary block mb-1">
            {t("help.reflection.persistenceTitle")}
          </span>
          <span className="text-xs text-text-secondary leading-relaxed">
            {t("help.reflection.persistenceDesc")}
          </span>
        </div>
        <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
          <span className="font-bold text-xs text-text-primary block mb-1">
            {t("help.reflection.privacyTitle")}
          </span>
          <span className="text-xs text-text-secondary leading-relaxed">
            {t("help.reflection.privacyDesc")}
          </span>
        </div>
      </div>
      <p className="text-text-secondary text-xs leading-relaxed pt-2 italic">
        {t("help.reflection.quote")}
      </p>
    </div>
  );
}
