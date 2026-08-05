import { create } from "zustand";
import { 
  OllamaModelInfo, 
  OllamaActiveModelInfo, 
  checkOllamaStatus, 
  getDownloadedModels, 
  getActiveModels 
} from "../services/ollama";
import { checkOpenAIStatus, getOpenAIModels } from "../services/openai";
import { useAppStore } from "./useAppStore";
import { isEmbeddingModel } from "../services/embeddings";

interface OllamaState {
  ollamaConnected: boolean;
  modelsList: OllamaModelInfo[];
  activeModelsList: OllamaActiveModelInfo[];
  activeModel: string;
  checkingOllama: boolean;
  pinnedModels: string[];
  chatModels: OllamaModelInfo[];
  embeddingModels: OllamaModelInfo[];

  handleModelChange: (modelName: string) => void;
  togglePinModel: (modelName: string) => void;
  verifyOllamaConnection: () => Promise<void>;
}

export const useOllamaStore = create<OllamaState>((set, get) => ({
  ollamaConnected: false,
  modelsList: [],
  activeModelsList: [],
  activeModel: localStorage.getItem("active_model") || "",
  checkingOllama: false,
  pinnedModels: (() => {
    try {
      const saved = localStorage.getItem("pinned_models");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  })(),
  chatModels: [],
  embeddingModels: [],

  handleModelChange: (modelName) => {
    localStorage.setItem("active_model", modelName);
    set({ activeModel: modelName });
  },

  togglePinModel: (modelName) => {
    const { pinnedModels } = get();
    const next = pinnedModels.includes(modelName)
      ? pinnedModels.filter((m) => m !== modelName)
      : [...pinnedModels, modelName];
    localStorage.setItem("pinned_models", JSON.stringify(next));
    set({ pinnedModels: next });
  },

  verifyOllamaConnection: async () => {
    set({ checkingOllama: true });
    try {
      const { config } = useAppStore.getState();

      if (config.llm_provider === "openai_compatible") {
        const baseUrl = config.openai_base_url || "http://127.0.0.1:8080/v1";
        const apiKey = config.openai_api_key;
        const ok = await checkOpenAIStatus(baseUrl, apiKey);
        set({ ollamaConnected: ok });

        if (ok) {
          const fetchedModelIds = await getOpenAIModels(baseUrl, apiKey).catch(() => []);
          const configuredModelName = config.openai_model_name?.trim() || "gpt-4o-mini";
          const modelNames = fetchedModelIds.length > 0 ? fetchedModelIds : [configuredModelName];

          const openAiModels: OllamaModelInfo[] = modelNames.map((name) => ({
            name,
            size: 0,
          }));

          set({
            modelsList: openAiModels,
            activeModelsList: [],
            chatModels: openAiModels,
            embeddingModels: [],
            activeModel: configuredModelName,
          });
        } else {
          set({
            modelsList: [],
            activeModelsList: [],
            chatModels: [],
            embeddingModels: [],
          });
        }
        return;
      }

      const ok = await checkOllamaStatus();
      set({ ollamaConnected: ok });
      if (ok) {
        const models = await getDownloadedModels();
        const active = await getActiveModels();

        const chat = models.filter((m) => !isEmbeddingModel(m.name, m.capabilities));
        const embed = models.filter((m) => isEmbeddingModel(m.name, m.capabilities));

        set({
          modelsList: models,
          activeModelsList: active,
          chatModels: chat,
          embeddingModels: embed
        });

        // Set active model from actually downloaded chat models
        if (chat.length > 0) {
          const chatModelNames = chat.map((m) => m.name);
          const savedActiveModel = localStorage.getItem("active_model");
          const currentActive = get().activeModel;

          if (savedActiveModel && chatModelNames.includes(savedActiveModel)) {
            set({ activeModel: savedActiveModel });
          } else if (!chatModelNames.includes(currentActive)) {
            set({ activeModel: chatModelNames[0] });
          }
        }
      } else {
        set({
          modelsList: [],
          activeModelsList: [],
          chatModels: [],
          embeddingModels: [],
        });
      }
    } catch (err) {
      console.error("Failed to verify LLM connection:", err);
      set({
        ollamaConnected: false,
        modelsList: [],
        activeModelsList: [],
        chatModels: [],
        embeddingModels: [],
      });
    } finally {
      set({ checkingOllama: false });
    }
  }
}));

