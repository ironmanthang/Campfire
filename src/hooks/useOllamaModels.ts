import { useState, useEffect, useMemo, useCallback } from "react";
import { OllamaModelInfo, OllamaActiveModelInfo, checkOllamaStatus, getDownloadedModels, getActiveModels } from "../services/ollama";
import { isEmbeddingModel } from "../services/embeddings";

export function useOllamaModels() {
  const [ollamaConnected, setOllamaConnected] = useState(false);
  const [modelsList, setModelsList] = useState<OllamaModelInfo[]>([]);
  const [activeModelsList, setActiveModelsList] = useState<OllamaActiveModelInfo[]>([]);
  const [activeModel, setActiveModel] = useState(() => {
    return localStorage.getItem("active_model") || "gemma4:e2b-it-qat";
  });
  const [checkingOllama, setCheckingOllama] = useState(false);

  const [pinnedModels, setPinnedModels] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("pinned_models");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const handleModelChange = useCallback((modelName: string) => {
    setActiveModel(modelName);
    localStorage.setItem("active_model", modelName);
  }, []);

  const togglePinModel = useCallback((modelName: string) => {
    setPinnedModels((prev) => {
      const next = prev.includes(modelName)
        ? prev.filter((m) => m !== modelName)
        : [...prev, modelName];
      localStorage.setItem("pinned_models", JSON.stringify(next));
      return next;
    });
  }, []);

  const verifyOllamaConnection = useCallback(async () => {
    setCheckingOllama(true);
    const ok = await checkOllamaStatus();
    setOllamaConnected(ok);
    if (ok) {
      const models = await getDownloadedModels();
      setModelsList(models);

      const active = await getActiveModels();
      setActiveModelsList(active);

      const isEmbed = (m: any) => isEmbeddingModel(m.name, m.capabilities);
      
      const chatOnly = models.filter((m) => !isEmbed(m));
      if (chatOnly.length > 0) {
        const chatModelNames = chatOnly.map((m) => m.name);
        const savedActiveModel = localStorage.getItem("active_model");
        if (savedActiveModel && chatModelNames.includes(savedActiveModel)) {
          setActiveModel(savedActiveModel);
        } else if (chatModelNames.includes("gemma4:e2b-it-qat") && !chatModelNames.includes(activeModel)) {
          setActiveModel("gemma4:e2b-it-qat");
        } else if (!chatModelNames.includes(activeModel)) {
          setActiveModel(chatModelNames[0]);
        }
      }
    } else {
      setActiveModelsList([]);
    }
    setCheckingOllama(false);
  }, [activeModel]);

  // Initial fetch on hook mount
  useEffect(() => {
    verifyOllamaConnection();
  }, []);

  const chatModels = useMemo(() => {
    return modelsList.filter((m) => !isEmbeddingModel(m.name, m.capabilities));
  }, [modelsList]);

  const embeddingModels = useMemo(() => {
    return modelsList.filter((m) => isEmbeddingModel(m.name, m.capabilities));
  }, [modelsList]);

  return {
    ollamaConnected,
    modelsList,
    activeModelsList,
    activeModel,
    checkingOllama,
    pinnedModels,
    handleModelChange,
    togglePinModel,
    verifyOllamaConnection,
    chatModels,
    embeddingModels,
  };
}
