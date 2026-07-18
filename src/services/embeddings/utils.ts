import { OLLAMA_BASE_URL } from "../../lib/constants";

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
export async function getDocumentPrefix(model: string): Promise<string> {
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

export async function getQueryPrefix(model: string): Promise<string> {
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
 * Simple concurrency pool helper to process items in parallel
 */
export async function runWithConcurrency<T>(
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
