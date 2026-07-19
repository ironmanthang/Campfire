import { invoke } from "@tauri-apps/api/core";
import { EmbeddingCacheData } from "../../types";

/**
 * Creates a fresh empty cache for a given model
 */
export function createEmptyCache(model: string): EmbeddingCacheData {
  return { version: 1, model, entries: {} };
}

/**
 * Loads the embeddings cache from the journal directory.
 * If the cached model doesn't match the requested model, returns a fresh cache
 * (automatic invalidation on model switch).
 */
export async function loadEmbeddingsCache(dirPath: string, model: string): Promise<EmbeddingCacheData> {
  try {
    const cacheJson = await invoke<string>("load_embeddings_cache", { dirPath });
    const parsed = JSON.parse(cacheJson);

    // Handle legacy cache format (no model field) or model mismatch
    if (!parsed.model || parsed.model !== model) {
      console.log(`Cache model mismatch (cached: ${parsed.model || "unknown"}, requested: ${model}). Rebuilding.`);
      return createEmptyCache(model);
    }

    // Default to version 1 if version is not present
    if (!parsed.version) {
      parsed.version = 1;
    }

    return parsed as EmbeddingCacheData;
  } catch (err) {
    console.error("Failed to load embeddings cache, returning empty cache:", err);
    return createEmptyCache(model);
  }
}

/**
 * Saves the embeddings cache to the journal directory
 */
export async function saveEmbeddingsCache(dirPath: string, cache: EmbeddingCacheData): Promise<void> {
  try {
    await invoke("save_embeddings_cache", {
      dirPath,
      cacheJson: JSON.stringify(cache)
    });
  } catch (err) {
    console.error("Failed to save embeddings cache:", err);
  }
}
