import { useState } from "react";
import { AlertCircle, Info, Server, Cpu, Key, Globe, Check, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useOllamaStore } from "../../store/useOllamaStore";
import { useAppStore } from "../../store/useAppStore";
import { OllamaGuide } from "./ollama/OllamaGuide";
import { OllamaDiagnostics } from "./ollama/OllamaDiagnostics";
import { OllamaModelList } from "./ollama/OllamaModelList";
import { getOpenAIModels } from "../../services/openai/openaiClient";

export function OllamaSection() {
  const { t } = useTranslation();
  const [showOllamaGuide, setShowOllamaGuide] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [fetchedModels, setFetchedModels] = useState<string[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const { ollamaConnected, verifyOllamaConnection } = useOllamaStore();
  const { config, updateConfigField, showNotification } = useAppStore();

  const handleSelectPreset = (preset: {
    baseUrl: string;
    modelName: string;
    name: string;
  }) => {
    updateConfigField("openai_base_url", preset.baseUrl);
    updateConfigField("openai_model_name", preset.modelName);
    showNotification(t("settingsView.presetApplied", { name: preset.name }), "success");
  };

  const handleFetchModels = async () => {
    if (!config.openai_base_url) {
      showNotification(t("settingsView.specifyBaseUrlFirst"), "error");
      return;
    }
    setIsFetchingModels(true);
    try {
      const models = await getOpenAIModels(config.openai_base_url, config.openai_api_key);
      setFetchedModels(models);
      if (models.length > 0) {
        showNotification(t("settingsView.fetchModelsSuccess", { count: models.length }), "success");
      } else {
        showNotification(t("settingsView.fetchModelsEmpty"), "error");
      }
    } catch (err: any) {
      const msg = typeof err === "string" ? err : err?.message || "Failed to fetch models";
      showNotification(msg, "error");
    } finally {
      setIsFetchingModels(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Provider Selector Header */}
      <div className="p-4 rounded-xl bg-bg-surface/30 border border-border-brand/40 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-accent-brand" />
            <h4 className="font-semibold text-sm text-text-primary">{t("settingsView.providerModeTitle")}</h4>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ollamaConnected ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
            {ollamaConnected ? t("settingsView.ollamaStatusConnected") : t("settingsView.ollamaStatusDisconnected")}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={async () => {
              await updateConfigField("llm_provider", "ollama");
              await verifyOllamaConnection();
            }}
            className={`p-3 rounded-lg border text-left flex items-center gap-3 transition-all cursor-pointer ${
              config.llm_provider !== "openai_compatible"
                ? "bg-accent-brand/10 border-accent-brand text-text-primary"
                : "bg-bg-app/50 border-border-brand/30 text-text-secondary hover:border-border-brand"
            }`}
          >
            <Cpu className="h-5 w-5 shrink-0 text-accent-brand" />
            <div>
              <p className="text-xs font-semibold">{t("settingsView.providerOllamaApp")}</p>
              <p className="text-[11px] text-text-secondary">{t("settingsView.providerOllamaDesc")}</p>
            </div>
          </button>

          <button
            onClick={async () => {
              await updateConfigField("llm_provider", "openai_compatible");
              await verifyOllamaConnection();
            }}
            className={`p-3 rounded-lg border text-left flex items-center gap-3 transition-all cursor-pointer ${
              config.llm_provider === "openai_compatible"
                ? "bg-accent-brand/10 border-accent-brand text-text-primary"
                : "bg-bg-app/50 border-border-brand/30 text-text-secondary hover:border-border-brand"
            }`}
          >
            <Globe className="h-5 w-5 shrink-0 text-accent-brand" />
            <div>
              <p className="text-xs font-semibold">{t("settingsView.providerOpenAiCompatible")}</p>
              <p className="text-[11px] text-text-secondary">{t("settingsView.providerOpenAiDesc")}</p>
            </div>
          </button>
        </div>
      </div>

      {config.llm_provider === "openai_compatible" ? (
        <div className="space-y-5 p-4 rounded-xl bg-bg-surface/20 border border-border-brand/40">
          <div className="space-y-1.5">
            <h4 className="text-sm font-semibold text-text-primary">{t("settingsView.openaiConfigTitle")}</h4>
            <p className="text-xs text-text-secondary">
              {t("settingsView.openaiConfigDesc")}
            </p>
          </div>

          {/* Presets */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-text-secondary">{t("settingsView.quickPresetsLabel")}</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  handleSelectPreset({
                    name: "Google Gemini",
                    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/",
                    modelName: "gemini-2.0-flash",
                  })
                }
                className="px-2.5 py-1.5 rounded-md bg-bg-surface text-xs border border-border-brand/40 hover:border-accent-brand text-text-primary transition-colors cursor-pointer"
              >
                Google Gemini
              </button>
              <button
                type="button"
                onClick={() =>
                  handleSelectPreset({
                    name: "OpenAI",
                    baseUrl: "https://api.openai.com/v1",
                    modelName: "gpt-4o-mini",
                  })
                }
                className="px-2.5 py-1.5 rounded-md bg-bg-surface text-xs border border-border-brand/40 hover:border-accent-brand text-text-primary transition-colors cursor-pointer"
              >
                OpenAI
              </button>
              <button
                type="button"
                onClick={() =>
                  handleSelectPreset({
                    name: "DeepSeek",
                    baseUrl: "https://api.deepseek.com",
                    modelName: "deepseek-chat",
                  })
                }
                className="px-2.5 py-1.5 rounded-md bg-bg-surface text-xs border border-border-brand/40 hover:border-accent-brand text-text-primary transition-colors cursor-pointer"
              >
                DeepSeek
              </button>
              <button
                type="button"
                onClick={() =>
                  handleSelectPreset({
                    name: "OpenRouter",
                    baseUrl: "https://openrouter.ai/api/v1",
                    modelName: "anthropic/claude-3.5-sonnet",
                  })
                }
                className="px-2.5 py-1.5 rounded-md bg-bg-surface text-xs border border-border-brand/40 hover:border-accent-brand text-text-primary transition-colors cursor-pointer"
              >
                OpenRouter
              </button>
              <button
                type="button"
                onClick={() =>
                  handleSelectPreset({
                    name: "Anthropic Claude",
                    baseUrl: "https://api.anthropic.com/v1/",
                    modelName: "claude-3-5-sonnet-20241022",
                  })
                }
                className="px-2.5 py-1.5 rounded-md bg-bg-surface text-xs border border-border-brand/40 hover:border-accent-brand text-text-primary transition-colors cursor-pointer"
              >
                Anthropic Claude
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Base URL */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-accent-brand" />
                {t("settingsView.baseUrlLabel")}
              </label>
              <input
                type="text"
                value={config.openai_base_url || ""}
                onChange={(e) => updateConfigField("openai_base_url", e.target.value)}
                placeholder="https://generativelanguage.googleapis.com/v1beta/openai/"
                className="w-full px-3 py-2 text-xs rounded-lg bg-bg-app border border-border-brand/40 text-text-primary focus:outline-none focus:border-accent-brand"
              />
            </div>

            {/* Model Name */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5 text-accent-brand" />
                  {t("settingsView.modelNameLabel")}
                </label>
                <button
                  type="button"
                  onClick={handleFetchModels}
                  disabled={isFetchingModels}
                  className="text-[11px] text-accent-brand hover:underline cursor-pointer flex items-center gap-1 disabled:opacity-50"
                >
                  <RefreshCw className={`h-3 w-3 ${isFetchingModels ? "animate-spin" : ""}`} />
                  {isFetchingModels ? t("settingsView.fetchingModels") : t("settingsView.fetchModelsButton")}
                </button>
              </div>
              <input
                type="text"
                list="openai-models-list"
                value={config.openai_model_name || ""}
                onChange={(e) => updateConfigField("openai_model_name", e.target.value)}
                placeholder="gemini-2.0-flash, gpt-4o-mini, deepseek-chat..."
                className="w-full px-3 py-2 text-xs rounded-lg bg-bg-app border border-border-brand/40 text-text-primary focus:outline-none focus:border-accent-brand"
              />
              <datalist id="openai-models-list">
                {fetchedModels.length > 0
                  ? fetchedModels.map((m) => <option key={m} value={m} />)
                  : [
                      "gemini-2.0-flash",
                      "gemini-1.5-flash",
                      "gemini-1.5-pro",
                      "gpt-4o-mini",
                      "gpt-4o",
                      "deepseek-chat",
                      "deepseek-reasoner",
                      "anthropic/claude-3.5-sonnet",
                      "claude-3-5-sonnet-20241022",
                      "claude-3-5-haiku-20241022",
                      "llama3.2",
                    ].map((m) => <option key={m} value={m} />)}
              </datalist>
            </div>

            {/* API Key */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-text-secondary flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-accent-brand" />
                  {t("settingsView.apiKeyLabel")}
                </span>
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="text-[11px] text-accent-brand hover:underline cursor-pointer"
                >
                  {showApiKey ? t("settingsView.apiKeyHide") : t("settingsView.apiKeyShow")}
                </button>
              </label>
              <input
                type={showApiKey ? "text" : "password"}
                value={config.openai_api_key || ""}
                onChange={(e) => updateConfigField("openai_api_key", e.target.value)}
                placeholder="sk-..."
                className="w-full px-3 py-2 text-xs rounded-lg bg-bg-app border border-border-brand/40 text-text-primary focus:outline-none focus:border-accent-brand font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={async () => {
                await verifyOllamaConnection();
                if (useOllamaStore.getState().ollamaConnected) {
                  showNotification(t("settingsView.connectOpenAiSuccess"), "success");
                } else {
                  showNotification(t("settingsView.connectOpenAiFailed"), "error");
                }
              }}
              className="px-4 py-2 rounded-lg bg-accent-brand text-text-brand text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="h-3.5 w-3.5" />
              {t("settingsView.testConnectionButton")}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Intro card */}
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
                      "Ollama is a free local AI service that lets this journal use AI features. Everything runs privately on your machine (http://localhost:11434) — nothing is sent to a server unless you pick a Cloud model.",
                  })}
                </p>
              </div>
            </div>
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
                  {t("settingsView.ollamaNotDetectedDesc", {
                    defaultValue:
                      "Please start the local Ollama service on your machine (default: http://localhost:11434).",
                  })}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <OllamaDiagnostics />
              <OllamaModelList />
            </div>
          )}
        </>
      )}
    </div>
  );
}

