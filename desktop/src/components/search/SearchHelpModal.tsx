import { Sparkles, X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface SearchHelpModalProps {
  onClose: () => void;
  embeddingModel: string;
}

export function SearchHelpModal({ onClose, embeddingModel }: SearchHelpModalProps) {
  const { t } = useTranslation();

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-bg-surface border border-border-brand rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-border-brand/60 flex items-center justify-between bg-bg-surface">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-accent-brand/10 text-accent-brand">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-text-primary text-lg">{t("searchView.helpModal.title")}</h3>
              <p className="text-xs text-text-secondary">{t("searchView.helpModal.subtitle", { model: embeddingModel })}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-app/80 transition-colors cursor-pointer"
            title={t("searchView.helpModal.closeTooltip")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-text-primary">
          <div className="bg-accent-brand/5 border border-accent-brand/20 p-4 rounded-xl space-y-1">
            <span className="text-xs font-bold text-accent-brand uppercase tracking-wider">{t("searchView.helpModal.howSearchWorksTitle")}</span>
            <p className="text-xs text-text-secondary leading-relaxed">
              {t("searchView.helpModal.howSearchWorksDesc", { model: embeddingModel })}
            </p>
          </div>

          {/* Guidelines List */}
          <div className="space-y-4">
            <h4 className="font-bold text-text-primary border-b border-border-brand/40 pb-1.5">{t("searchView.helpModal.bestPracticesTitle")}</h4>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="bg-bg-app/40 p-4 rounded-xl border border-border-brand/40 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-xs text-text-primary">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-brand/10 text-[10px] text-accent-brand">1</span>
                  {t("searchView.helpModal.rule1Title")}
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {t("searchView.helpModal.rule1Desc")}
                </p>
              </div>

              <div className="bg-bg-app/40 p-4 rounded-xl border border-border-brand/40 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-xs text-text-primary">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-brand/10 text-[10px] text-accent-brand">2</span>
                  {t("searchView.helpModal.rule2Title")}
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {t("searchView.helpModal.rule2Desc")}
                </p>
              </div>

              <div className="bg-bg-app/40 p-4 rounded-xl border border-border-brand/40 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-xs text-text-primary">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-brand/10 text-[10px] text-accent-brand">3</span>
                  {t("searchView.helpModal.rule3Title")}
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {t("searchView.helpModal.rule3Desc")}
                </p>
              </div>

              <div className="bg-bg-app/40 p-4 rounded-xl border border-border-brand/40 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-xs text-text-primary">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-brand/10 text-[10px] text-accent-brand">4</span>
                  {t("searchView.helpModal.rule4Title")}
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {t("searchView.helpModal.rule4Desc")}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Examples */}
          <div className="space-y-3">
            <h4 className="font-bold text-text-primary border-b border-border-brand/40 pb-1.5">{t("searchView.helpModal.comparisonTitle")}</h4>
            <div className="space-y-2.5">
              <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/5 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-red-500 font-semibold">
                  <span>⚠️ {t("searchView.helpModal.comparisonLessEffective")}</span>
                </div>
                <p className="text-xs text-text-secondary font-mono leading-relaxed pl-5 whitespace-pre-line">
                  {t("searchView.helpModal.comparisonLessEffectiveDesc")}
                </p>
              </div>

              <div className="p-3 rounded-lg border border-green-500/20 bg-green-500/5 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-green-500 font-semibold">
                  <span>✅ {t("searchView.helpModal.comparisonMoreEffective")}</span>
                </div>
                <p className="text-xs text-text-secondary font-mono leading-relaxed pl-5">
                  {t("searchView.helpModal.comparisonMoreEffectiveDesc")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-bg-app border-t border-border-brand/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-accent-brand text-bg-app rounded-lg text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
          >
            {t("searchView.helpModal.gotItButton")}
          </button>
        </div>
      </div>
    </div>
  );
}
