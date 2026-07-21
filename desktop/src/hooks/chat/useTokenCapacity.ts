import { useState, useEffect, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { OllamaModelInfo } from "../../services/ollama";
import { calculateHeuristicTokens, fetchExactTokenCount } from "../../services/ollama";

export function useTokenCapacity(activeModel: string, modelsList: OllamaModelInfo[]) {
  const [tokenInfo, setTokenInfo] = useState<{ count: number; limit: number; status: "safe" | "warning" | "blocked" }>({
    count: 0,
    limit: 128000,
    status: "safe"
  });

  const [ollamaConfiguredContextLength, setOllamaConfiguredContextLength] = useState<number | null>(null);

  // Load configured context length from local Ollama db.sqlite
  useEffect(() => {
    async function loadOllamaContextLength() {
      try {
        const len = await invoke<number>("get_ollama_context_length");
        if (len > 0) {
          setOllamaConfiguredContextLength(len);
        }
      } catch (err) {
        console.log("Could not read dynamic Ollama context length settings:", err);
      }
    }
    loadOllamaContextLength();
  }, []);

  const capacityLimit = useMemo(() => {
    const currentModelInfo = modelsList.find((m) => m.name === activeModel);
    const isCloudModel = currentModelInfo ? currentModelInfo.size === 0 : activeModel.includes("cloud");
    return currentModelInfo?.contextLength || ollamaConfiguredContextLength || (isCloudModel ? 128000 : 8192);
  }, [modelsList, activeModel, ollamaConfiguredContextLength]);

  // Calculate Token volumes in selected ranges
  const checkTokenCapacity = async (context: string) => {
    const heuristicCount = calculateHeuristicTokens(context);
    let count = heuristicCount;
    if (heuristicCount > capacityLimit * 0.8) {
      count = await fetchExactTokenCount(activeModel, context);
    }

    let status: "safe" | "warning" | "blocked" = "safe";
    if (count > capacityLimit) {
      status = "blocked";
    } else if (count > capacityLimit * 0.8) {
      status = "warning";
    }

    setTokenInfo({ count, limit: capacityLimit, status });
    return status !== "blocked";
  };

  return { tokenInfo, checkTokenCapacity };
}
