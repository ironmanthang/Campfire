import { invoke } from "@tauri-apps/api/core";
import { EmbeddingCacheData, EmbeddingChunk, SearchResult } from "../../types";
import { createEmptyCache, saveEmbeddingsCache } from "./cache";
import { dotProduct, fetchEmbeddings, getDocumentPrefix, getQueryPrefix, runWithConcurrency } from "./utils";

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
