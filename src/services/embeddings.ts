import { invoke } from "@tauri-apps/api/core";
import { EmbeddingCacheData, EmbeddingChunk, SearchResult } from "../types";
import { OLLAMA_BASE_URL } from "../lib/constants";

const EMBEDDING_MODEL_PATTERNS = [
  "embed",    // embeddinggemma, nomic-embed-text, snowflake-arctic-embed, etc.
  "bge",      // bge-m3, bge-large, etc.
  "minilm",   // all-minilm
  "gte",      // Alibaba GTE models
];

/**
 * Checks if a model name looks like an embedding model (string-based fallback)
 */
export function isEmbeddingModel(modelName: string, capabilities?: string[]): boolean {
  if (capabilities && capabilities.includes("embedding")) {
    return true;
  }
  const lower = modelName.toLowerCase();
  return (
    EMBEDDING_MODEL_PATTERNS.some(pattern => lower.includes(pattern)) ||
    lower.includes("embedding") ||
    /\be5-/.test(lower)
  );
}

interface ModelMetadata {
  family?: string;
  parentModel?: string;
}

const modelMetadataCache: Record<string, ModelMetadata> = {};

async function getModelMetadata(modelName: string): Promise<ModelMetadata> {
  if (modelMetadataCache[modelName]) {
    return modelMetadataCache[modelName];
  }
  
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/show`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: modelName })
    });
    if (response.ok) {
      const data = await response.json();
      const meta = {
        family: data.details?.family,
        parentModel: data.details?.parent_model
      };
      modelMetadataCache[modelName] = meta;
      return meta;
    }
  } catch (err) {
    console.error(`Failed to fetch metadata for prefix matching: ${modelName}`, err);
  }
  
  return {};
}

// Prefix mappings based on model family details and parent models (dynamic and flexible)
async function getDocumentPrefix(model: string): Promise<string> {
  const meta = await getModelMetadata(model);
  const family = (meta.family || "").toLowerCase();
  const parent = (meta.parentModel || "").toLowerCase();
  const name = model.toLowerCase();

  if (family.includes("nomic") || parent.includes("nomic") || name.includes("nomic")) {
    return "search_document: ";
  }
  if (family.includes("gemma") || parent.includes("gemma") || name.includes("gemma")) {
    return "title: none | text: ";
  }
  return "";
}

async function getQueryPrefix(model: string): Promise<string> {
  const meta = await getModelMetadata(model);
  const family = (meta.family || "").toLowerCase();
  const parent = (meta.parentModel || "").toLowerCase();
  const name = model.toLowerCase();

  if (family.includes("nomic") || parent.includes("nomic") || name.includes("nomic")) {
    return "search_query: ";
  }
  if (family.includes("qwen") || parent.includes("qwen") || name.includes("qwen")) {
    return "Instruct: Given a query, retrieve the most relevant passage.\nQuery: ";
  }
  if (family.includes("gemma") || parent.includes("gemma") || name.includes("gemma")) {
    return "task: search result | query: ";
  }
  return "";
}

/**
 * Generate embeddings for an array of texts using Ollama's embed endpoint.
 * Automatically applies the correct prefix based on model type.
 */
export async function fetchEmbeddings(
  texts: string[],
  model: string,
  prefix: string = ""
): Promise<number[][]> {
  if (texts.length === 0) return [];

  const prefixedTexts = prefix ? texts.map(t => prefix + t) : texts;

  const response = await fetch(`${OLLAMA_BASE_URL}/api/embed`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      input: prefixedTexts
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || `Failed to fetch embeddings from Ollama using model ${model}`);
  }

  const data = await response.json();
  if (!data.embeddings || !Array.isArray(data.embeddings)) {
    throw new Error("Invalid response format from Ollama embed endpoint");
  }

  return data.embeddings;
}

/**
 * Computes dot product of two L2-normalized vectors (equivalent to Cosine Similarity)
 */
export function dotProduct(a: number[], b: number[]): number {
  let sum = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

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

interface EntryHash {
  date: string;
  hash: string;
}

/**
 * Checks, updates, and persists the embedding index for all journal entries.
 * Applies the correct prefix based on the model being used.
 */
export async function buildEmbeddingIndex(
  dirPath: string,
  cache: EmbeddingCacheData,
  model: string,
  onProgress?: (current: number, total: number) => void
): Promise<EmbeddingCacheData> {
  // If model changed, start fresh
  const updatedCache: EmbeddingCacheData = cache.model === model
    ? { version: cache.version || 1, model, entries: { ...cache.entries } }
    : createEmptyCache(model);

  const docPrefix = await getDocumentPrefix(model);
  
  // 1. Get hashes of all local files
  const localHashes = await invoke<EntryHash[]>("get_entry_hashes", { dirPath });
  const localDates = new Set(localHashes.map(h => h.date));

  // 2. Remove cache entries for deleted files
  let cacheModified = false;
  for (const date of Object.keys(updatedCache.entries)) {
    if (!localDates.has(date)) {
      delete updatedCache.entries[date];
      cacheModified = true;
    }
  }

  // 3. Find files that are new or changed
  const staleEntries = localHashes.filter(h => {
    const cached = updatedCache.entries[h.date];
    return !cached || cached.hash !== h.hash;
  });

  if (staleEntries.length === 0) {
    if (cacheModified) {
      await saveEmbeddingsCache(dirPath, updatedCache);
    }
    return updatedCache;
  }

  onProgress?.(0, staleEntries.length);

  // 4. Update embedding vectors for stale entries in parallel (concurrency of 4)
  let completedCount = 0;
  await runWithConcurrency(staleEntries, 4, async (entry) => {
    try {
      const content = await invoke<string>("read_entry", { dirPath, date: entry.date });
      
      // Parse content into lines
      const lines = content.split(/\r?\n/);
      const linesToEmbed: { text: string; line_number: number }[] = [];
      
      for (let i = 0; i < lines.length; i++) {
        const text = lines[i].trim();
        // Skip empty lines and very short lines (< 4 words) — they produce
        // generic embeddings that match everything with high similarity
        const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
        if (text.length > 0 && wordCount >= 4) {
          linesToEmbed.push({ text, line_number: i + 1 });
        }
      }

      if (linesToEmbed.length === 0) {
        updatedCache.entries[entry.date] = {
          hash: entry.hash,
          chunks: []
        };
      } else {
        // Fetch embeddings in batch with appropriate prefix
        const texts = linesToEmbed.map(l => l.text);
        const vectors = await fetchEmbeddings(texts, model, docPrefix);
        
        const chunks: EmbeddingChunk[] = linesToEmbed.map((item, idx) => ({
          text: item.text,
          line_number: item.line_number,
          vector: vectors[idx]
        }));

        updatedCache.entries[entry.date] = {
          hash: entry.hash,
          chunks
        };
      }

      cacheModified = true;
    } catch (err) {
      console.error(`Failed to generate embeddings for ${entry.date}:`, err);
    } finally {
      completedCount++;
      onProgress?.(completedCount, staleEntries.length);
    }
  });

  // 5. Save the updated cache
  if (cacheModified) {
    await saveEmbeddingsCache(dirPath, updatedCache);
  }

  return updatedCache;
}

/**
 * Searches the embedding index for semantically similar lines.
 * Applies the correct query prefix based on the model.
 */
export async function performSemanticSearch(
  query: string,
  cache: EmbeddingCacheData,
  model: string,
  similarityThreshold: number = 0.3,
  maxResults: number = 20
): Promise<SearchResult[]> {
  const queryTrimmed = query.trim();
  if (!queryTrimmed) return [];

  const queryPrefix = await getQueryPrefix(model);

  // 1. Get query embedding with appropriate prefix
  const queryVectors = await fetchEmbeddings([queryTrimmed], model, queryPrefix);
  if (queryVectors.length === 0) return [];
  const queryVector = queryVectors[0];

  // 2. Score all cached chunks
  const results: SearchResult[] = [];
  
  for (const [date, entry] of Object.entries(cache.entries)) {
    for (const chunk of entry.chunks) {
      const similarity = dotProduct(queryVector, chunk.vector);
      if (similarity >= similarityThreshold) {
        results.push({
          date,
          line_number: chunk.line_number,
          snippet: chunk.text,
          similarity
        });
      }
    }
  }

  // 3. Sort by similarity descending, take top maxResults
  results.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
  return results.slice(0, maxResults);
}

/**
 * Simple concurrency pool helper to process items in parallel
 */
async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>
): Promise<void> {
  const promises: Promise<void>[] = [];
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex++;
      if (currentIndex >= items.length) break;
      const item = items[currentIndex];
      await fn(item);
    }
  }

  for (let i = 0; i < Math.min(concurrency, items.length); i++) {
    promises.push(worker());
  }

  await Promise.all(promises);
}
