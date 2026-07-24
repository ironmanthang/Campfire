import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { RefreshCw, Loader2, Square } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SystemResources } from "../../../types";
import { useOllamaStore } from "../../../store/useOllamaStore";
import { parseCpuPercentage, parseRamInfo, parseGpuInfo } from "../../../lib/systemResources";

function formatExpiry(expiresAt: string, t: any) {
  try {
    const timeDiff = new Date(expiresAt).getTime() - Date.now();
    if (timeDiff <= 0) return t("settingsView.expired");
    const minutes = Math.ceil(timeDiff / 60000);
    if (minutes < 60) {
      return t("settingsView.expiryMinutes", { minutes });
    }
    const hours = Math.floor(minutes / 60);
    const remMins = minutes % 60;
    return t("settingsView.expiryHoursMinutes", { hours, minutes: remMins });
  } catch (e) {
    return t("settingsView.unknown");
  }
}

export function OllamaDiagnostics() {
  const { t } = useTranslation();
  const [resources, setResources] = useState<SystemResources | null>(null);
  const [activeDiagnosticsTab, setActiveDiagnosticsTab] = useState<"summary" | "nvidia" | "ollama" | "ps">("summary");
  const [stoppingModels, setStoppingModels] = useState<Record<string, boolean>>({});
  const [loadingActiveModels, setLoadingActiveModels] = useState(false);

  const {
    ollamaConnected,
    activeModelsList,
    checkingOllama,
    verifyOllamaConnection
  } = useOllamaStore();

  const fetchSystemResources = async () => {
    try {
      const res = await invoke<SystemResources>("get_system_resources");
      setResources(res);
    } catch (err) {
      console.error("Failed to load system resources:", err);
    }
  };

  const handleRefreshActiveModels = async () => {
    setLoadingActiveModels(true);
    await Promise.all([
      verifyOllamaConnection(),
      fetchSystemResources()
    ]);
    setLoadingActiveModels(false);
  };

  const handleStopModel = async (modelName: string) => {
    setStoppingModels(prev => ({ ...prev, [modelName]: true }));
    try {
      await invoke("stop_ollama_model", { model: modelName });
      await verifyOllamaConnection();
      await fetchSystemResources();
    } catch (err) {
      console.error("Failed to stop model:", err);
    } finally {
      setStoppingModels(prev => ({ ...prev, [modelName]: false }));
    }
  };

  useEffect(() => {
    if (ollamaConnected) {
      fetchSystemResources();
    }
  }, [ollamaConnected]);

  return (
    <div className="pt-4 border-t border-border-brand/40 space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-text-secondary">{t("settingsView.diagnosticsTitle")}</label>
        <button
          onClick={handleRefreshActiveModels}
          disabled={loadingActiveModels}
          className="text-xs text-accent-brand hover:underline flex items-center gap-1 cursor-pointer font-bold"
        >
          <RefreshCw className={`h-2.5 w-2.5 ${loadingActiveModels ? "animate-spin" : ""}`} />
          {t("settingsView.refreshDiagnostics")}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-border-brand/20 pb-2">
        {(["summary", "nvidia", "ollama", "ps"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveDiagnosticsTab(tab)}
            className={`px-2.5 py-1 rounded-md text-xs font-bold border transition-all duration-150 cursor-pointer ${
              activeDiagnosticsTab === tab
                ? "bg-accent-brand border-accent-brand text-bg-app font-extrabold shadow-sm"
                : "bg-bg-input border-border-brand/60 text-text-secondary hover:text-text-primary hover:border-border-brand"
            }`}
          >
            {tab === "summary" 
              ? t("settingsView.tabSummary") 
              : tab === "nvidia" 
                ? t("settingsView.tabNvidia") 
                : tab === "ollama" 
                  ? t("settingsView.tabOllama") 
                  : t("settingsView.tabOsQuery")
            }
          </button>
        ))}
      </div>

      {activeDiagnosticsTab === "summary" && (
        <div className="space-y-4 pt-1">
          {/* Loaded Models Sub-section */}
          <div className="space-y-2">
            <span className="block text-xs font-bold text-text-secondary uppercase tracking-wider">{t("settingsView.loadedModels")}</span>
            {(checkingOllama || loadingActiveModels) && activeModelsList.length === 0 ? (
              <div className="p-3 rounded-lg border border-border-brand bg-bg-app flex items-center justify-center gap-2 text-xs text-text-secondary italic min-h-[42px]">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-accent-brand" />
                {t("settingsView.fetchingActiveModels")}
              </div>
            ) : activeModelsList.length > 0 ? (
              <div className={`space-y-2 transition-opacity duration-150 ${loadingActiveModels ? "opacity-70" : ""}`}>
                {activeModelsList.map((am) => (
                  <div key={am.name} className="p-2.5 rounded-lg border border-border-brand bg-bg-app text-xs flex justify-between items-center gap-3">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <span className="font-semibold text-text-primary block truncate">{am.name}</span>
                      <span className="text-xs text-text-secondary block font-mono">
                        {t("settingsView.vramUsedFormat", { used: (am.size_vram / (1024 * 1024 * 1024)).toFixed(2), weight: (am.size / (1024 * 1024 * 1024)).toFixed(2) })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right text-xs text-text-secondary font-mono">
                        {t("settingsView.expiresFormat", { expires: formatExpiry(am.expires_at, t) })}
                      </div>
                      <button
                        onClick={() => handleStopModel(am.name)}
                        disabled={stoppingModels[am.name]}
                        className="px-2 py-1 rounded bg-bg-input hover:bg-red-500/15 border border-border-brand/60 hover:border-red-500/30 text-red-400 hover:text-red-300 transition-all duration-150 flex items-center gap-1 cursor-pointer font-bold text-xs disabled:opacity-50"
                        title={t("settingsView.stopModelTooltip")}
                      >
                        {stoppingModels[am.name] ? (
                          <Loader2 className="h-2.5 w-2.5 animate-spin text-red-400" />
                        ) : (
                          <Square className="h-2.5 w-2.5 fill-red-400/20" />
                        )}
                        {t("settingsView.stopButton")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-lg border border-border-brand bg-bg-app text-center text-xs text-text-secondary italic min-h-[42px] flex items-center justify-center">
                {t("settingsView.noModelsLoaded")}
              </div>
            )}
          </div>

          {/* System Load Sub-section */}
          <div className="space-y-3 border-t border-border-brand/20 pt-3">
            <span className="block text-xs font-bold text-text-secondary uppercase tracking-wider">{t("settingsView.hardwareStats")}</span>
            {!resources ? (
              <div className="p-4 rounded-lg border border-border-brand bg-bg-app/40 flex items-center justify-center gap-2 min-h-[110px] text-xs text-text-secondary italic">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-accent-brand" />
                {t("settingsView.fetchingStats")}
              </div>
            ) : (
              <div className={`space-y-3 transition-opacity duration-150 ${loadingActiveModels ? "opacity-70" : ""}`}>
                {/* CPU progress bar */}
                {(() => {
                  const cpuPercent = parseCpuPercentage(resources.cpu_raw);
                  if (cpuPercent === null) return null;
                  return (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm font-semibold text-text-secondary">
                        <span>{t("settingsView.cpuUtilization")}</span>
                        <span>{cpuPercent}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-bg-app rounded-full overflow-hidden border border-border-brand/40">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            cpuPercent < 50 ? "bg-emerald-500" : cpuPercent < 80 ? "bg-amber-500" : "bg-red-500"
                          }`}
                          style={{ width: `${cpuPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}

                {/* RAM progress bar */}
                {(() => {
                  const ramInfo = parseRamInfo(resources.ram_raw);
                  if (!ramInfo) return null;
                  return (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm font-semibold text-text-secondary">
                        <span>{t("settingsView.ramUsage")}</span>
                        <span>{t("settingsView.ramUsageFormat", { used: ramInfo.used.toFixed(2), total: ramInfo.total.toFixed(2), percent: ramInfo.usedPercent.toFixed(0) })}</span>
                      </div>
                      <div className="h-1.5 w-full bg-bg-app rounded-full overflow-hidden border border-border-brand/40">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            ramInfo.usedPercent < 60 ? "bg-emerald-500" : ramInfo.usedPercent < 85 ? "bg-amber-500" : "bg-red-500"
                          }`}
                          style={{ width: `${ramInfo.usedPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}

                {/* GPU / VRAM progress bar */}
                {(() => {
                  const gpuInfo = parseGpuInfo(resources.gpu_raw);
                  if (!gpuInfo) {
                    return (
                      <div className="text-xs text-text-secondary italic mt-1">
                        {t("settingsView.noNvidiaGpu")}
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-1.5 p-2.5 rounded-lg border border-border-brand bg-bg-app/40">
                      <div className="flex justify-between text-sm font-semibold text-text-secondary">
                        <span className="truncate">{gpuInfo.name}</span>
                        <span className="shrink-0">{t("settingsView.gpuStatusFormat", { temp: gpuInfo.temp, load: gpuInfo.util })}</span>
                      </div>
                      <div className="flex justify-between text-xs font-mono text-text-secondary">
                        <span>{t("settingsView.vramUsage")}</span>
                        <span>{t("settingsView.vramUsageFormat", { used: gpuInfo.usedVram.toFixed(2), total: gpuInfo.totalVram.toFixed(2), percent: gpuInfo.usedPercent.toFixed(0) })}</span>
                      </div>
                      <div className="h-1.5 w-full bg-bg-app rounded-full overflow-hidden border border-border-brand/40">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            gpuInfo.usedPercent < 70 ? "bg-emerald-500" : gpuInfo.usedPercent < 90 ? "bg-amber-500" : "bg-red-500"
                          }`}
                          style={{ width: `${gpuInfo.usedPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {activeDiagnosticsTab === "nvidia" && (
        <div className="pt-1">
          <span className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">{t("settingsView.rawNvidiaOutput")}</span>
          <pre className="bg-bg-app border border-border-brand/60 p-3 rounded-lg text-xs font-mono whitespace-pre overflow-x-auto text-text-primary max-h-[300px] scrollbar-thin">
            {resources?.gpu_raw || (loadingActiveModels ? t("settingsView.queryingGpu") : t("settingsView.noGpuLoaded"))}
          </pre>
        </div>
      )}

      {activeDiagnosticsTab === "ollama" && (
        <div className="pt-1">
          <span className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">{t("settingsView.rawOllamaOutput")}</span>
          <pre className="bg-bg-app border border-border-brand/60 p-3 rounded-lg text-xs font-mono whitespace-pre overflow-x-auto text-text-primary max-h-[300px] scrollbar-thin">
            {resources?.ollama_ps_raw || (loadingActiveModels ? t("settingsView.queryingOllama") : t("settingsView.noOllamaLoaded"))}
          </pre>
        </div>
      )}

      {activeDiagnosticsTab === "ps" && (
        <div className="pt-1">
          <span className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">{t("settingsView.rawOsOutput")}</span>
          <pre className="bg-bg-app border border-border-brand/60 p-3 rounded-lg text-xs font-mono whitespace-pre overflow-x-auto text-text-primary max-h-[300px] scrollbar-thin">
            {resources 
              ? `[CPU Load Percentage Query]\n${resources.cpu_raw}\n\n[RAM Free/Total Query]\n${resources.ram_raw}` 
              : loadingActiveModels ? t("settingsView.queryingOs") : t("settingsView.noOsLoaded")}
          </pre>
        </div>
      )}
    </div>
  );
}
