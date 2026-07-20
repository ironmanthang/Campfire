import { useTranslation } from "react-i18next";
import { Shield, Cpu, FileText } from "lucide-react";

export function AboutAppTab() {
  const { t } = useTranslation();

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-black tracking-tight text-accent-brand flex items-center justify-center gap-2">
          {t("aboutModal.appTitle")}
          <span className="text-xs font-mono text-text-secondary bg-bg-app/50 border border-border-brand/40 px-2 py-0.5 rounded-full font-normal select-text">
            {t("sidebar.version")}
          </span>
        </h3>
        <p className="text-sm font-medium text-text-secondary leading-relaxed px-4">
          {t("aboutModal.appTagline")}
        </p>
      </div>

      <blockquote className="border-l-4 border-accent-brand bg-bg-app/20 p-4 rounded-r-xl text-sm italic text-text-secondary leading-relaxed">
        "{t("aboutModal.appDesc")}"
      </blockquote>

      <div className="space-y-4 pt-2">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-xl bg-accent-brand/10 text-accent-brand shrink-0">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-text-primary">
              {t("aboutModal.featureLocalTitle")}
            </h4>
            <p className="text-xs text-text-secondary mt-1">
              {t("aboutModal.featureLocalDesc")}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="p-2 rounded-xl bg-accent-brand/10 text-accent-brand shrink-0">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-text-primary">
              {t("aboutModal.featureAiTitle")}
            </h4>
            <p className="text-xs text-text-secondary mt-1">
              {t("aboutModal.featureAiDesc")}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="p-2 rounded-xl bg-accent-brand/10 text-accent-brand shrink-0">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-text-primary">
              {t("aboutModal.featureMarkdownTitle")}
            </h4>
            <p className="text-xs text-text-secondary mt-1">
              {t("aboutModal.featureMarkdownDesc")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
