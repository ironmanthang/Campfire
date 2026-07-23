import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useOllamaStore } from "../../../store/useOllamaStore";
import { isEmbeddingModel } from "../../../services/embeddings";

export function OllamaModelList() {
  const { t } = useTranslation();
  const [settingsSearchQuery, setSettingsSearchQuery] = useState("");

  const {
    modelsList,
    checkingOllama
  } = useOllamaStore();

  const filteredModelsList = modelsList.filter((m) =>
    m.name.toLowerCase().includes(settingsSearchQuery.toLowerCase())
  );

  return (
    <div className="pt-3 border-t border-border-brand/40 space-y-2.5">
      <label className="block text-xs font-semibold text-text-secondary">{t("settingsView.manageModels")}</label>
      
      {/* Search bar */}
      <div className="flex items-center gap-2 bg-bg-input border border-border-brand rounded-lg px-2.5 py-1.5">
        <Search className="h-3.5 w-3.5 text-text-secondary shrink-0" />
        <input
          type="text"
          placeholder={t("settingsView.searchModelsPlaceholder")}
          value={settingsSearchQuery}
          onChange={(e) => setSettingsSearchQuery(e.target.value)}
          className="w-full bg-transparent border-none text-text-primary text-xs focus:outline-none"
        />
      </div>

      <div className="max-h-[160px] overflow-y-auto rounded-lg border border-border-brand bg-bg-app p-2 space-y-1 scrollbar-thin">
        {checkingOllama ? (
          <div className="flex items-center justify-center gap-2 py-4 text-xs text-text-secondary italic">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-accent-brand" />
            {t("settingsView.fetchingLocalModels")}
          </div>
        ) : filteredModelsList.length > 0 ? (
          filteredModelsList.map((m) => {
            const isEmbedding = isEmbeddingModel(m.name, m.capabilities);
            return (
              <div key={m.name} className="flex items-center justify-between p-2 rounded-md hover:bg-bg-surface/50 border border-transparent hover:border-border-brand/30 transition-all text-xs">
                <div className="flex flex-col gap-0.5 truncate">
                  <span className="font-semibold text-text-primary truncate">{m.name}</span>
                  <span className="text-xs text-text-secondary font-mono">
                    {isEmbedding ? t("settingsView.embeddingModel") : t("settingsView.chatPersonaModel")}{t("settingsView.modelSizeFormat", { size: (m.size / (1024 * 1024 * 1024)).toFixed(2) })}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-4 text-xs text-text-secondary italic">
            {modelsList.length === 0 ? t("settingsView.noLocalModels") : t("settingsView.noMatchingModels")}
          </div>
        )}
      </div>
    </div>
  );
}
