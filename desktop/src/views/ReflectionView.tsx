import { useState, useRef, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import ReactMarkdown from "react-markdown";
import {
  Sparkles,
  Loader2,
  Zap,
  RefreshCw
} from "lucide-react";
import { OllamaMessage, streamAIResponse } from "../services/ollama";
import { getLocalYYYYMMDD } from "../lib/dateUtils";
import { ModelSelector } from "../components/ai/ModelSelector";
import { useResizer } from "../hooks/useResizer";
import { useTranslation } from "react-i18next";
import { SidebarToggleButton } from "../components/layout/SidebarToggleButton";
import { usePersistedState } from "../hooks/usePersistedState";
import { useEarliestEntryDate } from "../hooks/useEarliestEntryDate";
import { DateRangePicker } from "../components/common/DateRangePicker";
import { DragHandles } from "../components/common/DragHandles";
import { useAppStore } from "../store/useAppStore";
import { useOllamaStore } from "../store/useOllamaStore";

export function ReflectionView() {
  const { t } = useTranslation();
  const earliestDate = useEarliestEntryDate();
  const [refStartDate, setRefStartDate] = usePersistedState("reflection_filter_start", earliestDate);

  useEffect(() => {
    if (refStartDate === "2010-01-01") {
      setRefStartDate(earliestDate);
    }
  }, [earliestDate, refStartDate, setRefStartDate]);

  const [refEndDate, setRefEndDate] = usePersistedState("reflection_filter_end", getLocalYYYYMMDD);
  const [reflectionReport, setReflectionReport] = usePersistedState("reflection_report_text", "");
  const [generatingReflection, setGeneratingReflection] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const { config, showNotification, sidebarCollapsed, toggleSidebar } = useAppStore();
  const { activeModel, handleModelChange, chatModels, pinnedModels, togglePinModel } = useOllamaStore();

  const [reflectionWidth, startDrag] = useResizer({
    key: "reflection_width",
    defaultVal: 768,
    mode: "px",
  });

  const handleResetReflection = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setReflectionReport("");
  };

  // Compile Reflection Report
  const handleGenerateReflection = async () => {
    if (generatingReflection || !config.journal_dir) return;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setGeneratingReflection(true);
    setReflectionReport("");

    try {
      const context = await invoke<string>("get_journal_context", {
        dirPath: config.journal_dir,
        startDate: refStartDate,
        endDate: refEndDate
      });

      if (controller.signal.aborted) return;

      if (!context.trim()) {
        setReflectionReport(t("reflectionView.noEntriesReport"));
        setGeneratingReflection(false);
        return;
      }

      const reportPrompt = t("reflectionView.promptCoachInstruction")
        .replace("{startDate}", refStartDate)
        .replace("{endDate}", refEndDate)
        .replace("{context}", context);

      const messages: OllamaMessage[] = [
        { role: "user", content: reportPrompt }
      ];

      if (controller.signal.aborted) return;

      let fullReport = "";
      await streamAIResponse(
        activeModel,
        messages,
        (chunk) => {
          if (chunk) {
            fullReport += chunk;
            setReflectionReport(fullReport);
          }
        },
        undefined,
        controller.signal
      );
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Reflection report generation aborted by user.");
      } else {
        console.error(err);
        showNotification(err.message || t("reflectionView.errorFailedReport"), "error");
      }
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      setGeneratingReflection(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-bg-app">
      <header className="relative z-20 p-6 border-b border-border-brand shrink-0 space-y-4">
        <div className="flex items-start gap-4">
          <SidebarToggleButton
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={toggleSidebar}
            className="mt-1"
          />
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{t("reflectionView.title")}</h2>
            <p className="text-sm text-text-secondary mt-1">
              {t("reflectionView.subtitle")}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-text-secondary bg-bg-surface/40 p-4 rounded-xl border border-border-brand/40">
          <DateRangePicker
            startDate={refStartDate}
            endDate={refEndDate}
            onStartChange={setRefStartDate}
            onEndChange={setRefEndDate}
            labelPrefix={t("reflectionView.analyzePeriod")}
            earliestDate={earliestDate}
          />

          {/* Model Dropdown Selector */}
          <div className="flex items-center gap-1.5 ml-2">
            <span>{t("reflectionView.modelLabel")}</span>
            <ModelSelector
              selectedModel={activeModel}
              onSelectModel={handleModelChange}
              models={chatModels}
              pinnedModels={pinnedModels}
              onTogglePin={togglePinModel}
            />
          </div>

          {/* Reset Report Button */}
          <button
            onClick={handleResetReflection}
            disabled={!reflectionReport && !generatingReflection}
            className="ml-2 px-2.5 py-1 border border-border-brand rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-app/40 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-text-secondary transition-all flex items-center gap-1.5 font-semibold text-xs cursor-pointer disabled:cursor-not-allowed"
            title={t("reflectionView.resetTooltip")}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {t("reflectionView.resetButton")}
          </button>

          <button
            onClick={handleGenerateReflection}
            disabled={generatingReflection}
            className="ml-auto px-4 py-1.5 bg-accent-brand text-bg-app rounded-lg text-xs font-bold hover:bg-accent-brand-hover disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            {generatingReflection ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {t("reflectionView.statusAnalyzing")}
              </>
            ) : (
              <>
                <Zap className="h-3.5 w-3.5" />
                {t("reflectionView.generateButton")}
              </>
            )}
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div
          className="relative mx-auto w-full px-6 py-6 min-h-full flex flex-col"
          style={{ maxWidth: `${reflectionWidth}px` }}
        >
          <DragHandles startDrag={startDrag} />

          {generatingReflection && !reflectionReport ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-accent-brand" />
              <p className="text-sm text-text-secondary italic">{t("reflectionView.loadingReflection")}</p>
            </div>
          ) : reflectionReport ? (
            <div className="w-full p-6 rounded-2xl border border-border-brand bg-bg-surface shadow-sm prose markdown-preview animate-fade-in leading-relaxed">
              <ReactMarkdown>{reflectionReport}</ReactMarkdown>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-text-secondary select-none">
              <Sparkles className="h-10 w-10 text-border-brand mb-2 animate-pulse" />
              <p className="text-sm font-semibold">{t("reflectionView.welcomeTitle")}</p>
              <p className="text-xs max-w-xs mt-1 leading-relaxed">
                {t("reflectionView.welcomeDesc")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
