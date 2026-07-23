import { useState } from "react";
import { AlertCircle, Info, Download } from "lucide-react";
import { useTranslation } from "react-i18next";
import { openUrl } from "@tauri-apps/plugin-opener";
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
      {/* Intro card: explains what Ollama is, for users who've never heard of it */}
      <div className="p-4 rounded-xl bg-bg-surface/30 border border-border-brand/40 space-y-2.5">
        <div className="flex items-start gap-2.5">
          <Info className="h-4.5 w-4.5 text-accent-brand shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <h4 className="text-sm font-semibold text-text-primary">
              {t("settingsView.ollamaIntroTitle", {
                defaultValue: "Ollama runs the AI on your computer",
              })}
            </h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              {t("settingsView.ollamaIntroDesc", {
                defaultValue:
                  "Ollama is a free, small app that lets this journal use local AI. Without it installed and running, the AI features (chat, summaries, etc.) will not work. Everything runs privately on your machine — nothing is sent to a server unless you pick a Cloud model.",
              })}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => openUrl("https://ollama.com/download")}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-accent-brand text-bg-app hover:bg-accent-brand-hover rounded-lg text-xs font-semibold transition-colors cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" />
          {t("settingsView.ollamaIntroDownload", {
            defaultValue: "Download Ollama (free)",
          })}
        </button>
      </div>

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
              {t("settingsView.ollamaNotDetectedDesc")}
              <a href="https://ollama.com/download" target="_blank" rel="noopener noreferrer" className="underline font-medium hover:text-white">
                {t("settingsView.ollamaIntroDownload", {
                  defaultValue: "Download Ollama (free)",
                })}
              </a>.
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
