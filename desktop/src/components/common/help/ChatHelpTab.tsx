import { MessageSquare } from "lucide-react";
import { useTranslation } from "react-i18next";

export function ChatHelpTab() {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 animate-fade-in">
      <h3 className="text-base font-bold text-accent-brand flex items-center gap-2 border-b border-border-brand/20 pb-2">
        <MessageSquare className="h-4.5 w-4.5" />
        {t("help.chat.title")}
      </h3>
      <p className="text-text-secondary text-xs leading-relaxed">
        {t("help.chat.subtitle")}
      </p>
      <div className="space-y-3">
        <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
          <span className="font-bold text-xs text-text-primary block mb-1">
            {t("help.chat.companionTitle")}
          </span>
          <span className="text-xs text-text-secondary leading-relaxed">
            {t("help.chat.companionDesc")}
          </span>
        </div>
        <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
          <span className="font-bold text-xs text-text-primary block mb-1">
            {t("help.chat.strengthsTitle")}
          </span>
          <span className="text-xs text-text-secondary leading-relaxed">
            {t("help.chat.strengthsDesc")}
            <ul className="list-disc pl-4.5 mt-1.5 space-y-1">
              <li>
                <strong>{t("help.chat.strengthPatternTitle")}</strong> {t("help.chat.strengthPatternDesc")}
              </li>
              <li>
                <strong>{t("help.chat.strengthMissingTitle")}</strong> {t("help.chat.strengthMissingDesc")}
              </li>
              <li>
                <strong>{t("help.chat.strengthGapTitle")}</strong> {t("help.chat.strengthGapDesc")}
              </li>
            </ul>
          </span>
        </div>
        <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
          <span className="font-bold text-xs text-text-primary block mb-1">
            {t("help.chat.promptsTitle")}
          </span>
          <span className="text-xs text-text-secondary leading-relaxed">
            {t("help.chat.promptsDesc")}
            <ul className="list-disc pl-4.5 mt-1.5 space-y-1 italic">
              <li>{t("help.chat.prompt1")}</li>
              <li>{t("help.chat.prompt2")}</li>
              <li>{t("help.chat.prompt3")}</li>
              <li>{t("help.chat.prompt4")}</li>
            </ul>
            <p className="mt-2 text-xs text-text-secondary">
              {t("help.chat.sparkleNote")}
            </p>
          </span>
        </div>
        <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
          <span className="font-bold text-xs text-text-primary block mb-1">
            {t("help.chat.controlsTitle")}
          </span>
          <span className="text-xs text-text-secondary leading-relaxed">
            {t("help.chat.controlsDesc")}
          </span>
        </div>
        <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
          <span className="font-bold text-xs text-text-primary block mb-1">
            {t("help.chat.attachmentsTitle")}
          </span>
          <span className="text-xs text-text-secondary leading-relaxed">
            {t("help.chat.attachmentsDesc")}
          </span>
        </div>
        <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
          <span className="font-bold text-xs text-text-primary block mb-1">
            {t("help.chat.privacyTitle")}
          </span>
          <span className="text-xs text-text-secondary leading-relaxed">
            {t("help.chat.privacyDesc")}
          </span>
        </div>
      </div>
      <p className="text-text-secondary text-xs leading-relaxed pt-2 italic">
        {t("help.chat.quote")}
      </p>
    </div>
  );
}
