import { useState } from "react";
import { AlertCircle, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useOllamaStore } from "../../store/useOllamaStore";
import { OllamaGuide } from "./ollama/OllamaGuide";
import { OllamaDiagnostics } from "./ollama/OllamaDiagnostics";
import { OllamaModelList } from "./ollama/OllamaModelList";

export function OllamaSection() {
  const { t } = useTranslation();
  const [showOllamaGuide, setShowOllamaGuide] = useState(false);
  const { ollamaConnected } = useOllamaStore();

  return (
    <div className="space-y-6">
      {/* Guide & Controls Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border-brand/40">
        <h4 className="font-semibold text-sm text-text-primary">{t("settingsView.ollamaPullGuide")}</h4>
        <button
          onClick={() => setShowOllamaGuide(!showOllamaGuide)}
          className="text-text-secondary hover:text-text-primary p-0.5 rounded transition-colors cursor-pointer"
          title={t("settingsView.ollamaGuideTooltip")}
        >
          <Info className="h-4.5 w-4.5" />
        </button>
      </div>

      {showOllamaGuide && <OllamaGuide />}

      {!ollamaConnected ? (
        <div className="p-4 rounded-lg bg-red-950/10 border border-red-500/20 text-xs text-red-200 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">{t("settingsView.ollamaNotDetected")}</p>
            <p className="mt-1 leading-relaxed opacity-80">
              {t("settingsView.ollamaNotDetectedDesc")}<a href="https://ollama.com" target="_blank" className="underline font-medium hover:text-white">ollama.com</a>.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <OllamaDiagnostics />
          <OllamaModelList />
        </div>
      )}
    </div>
  );
}
