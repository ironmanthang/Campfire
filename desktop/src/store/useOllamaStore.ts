import { create } from "zustand";
import { 
  OllamaModelInfo, 
  OllamaActiveModelInfo, 
  checkOllamaStatus, 
  getDownloadedModels, 
  getActiveModels 
} from "../services/ollama";
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
  activeModel: localStorage.getItem("active_model") || "gemma4:e2b-it-qat",
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

        // Set default active model if currently selected is invalid/missing
        if (chat.length > 0) {
          const chatModelNames = chat.map((m) => m.name);
          const savedActiveModel = localStorage.getItem("active_model");
          const currentActive = get().activeModel;

          if (savedActiveModel && chatModelNames.includes(savedActiveModel)) {
            set({ activeModel: savedActiveModel });
          } else if (chatModelNames.includes("gemma4:e2b-it-qat") && !chatModelNames.includes(currentActive)) {
            set({ activeModel: "gemma4:e2b-it-qat" });
          } else if (!chatModelNames.includes(currentActive)) {
            set({ activeModel: chatModelNames[0] });
          }
        }
      } else {
        set({ activeModelsList: [] });
      }
    } catch (err) {
      console.error("Failed to verify Ollama connection:", err);
      set({ activeModelsList: [] });
    } finally {
      set({ checkingOllama: false });
    }
  }
}));
