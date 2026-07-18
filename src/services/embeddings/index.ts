// Public re-exports for the embeddings service.
// Consumers import from `services/embeddings` — this barrel keeps that
// path stable while internals live in `./utils`, `./cache`, and `./search`.

export {
  isEmbeddingModel,
  dotProduct,
  fetchEmbeddings,
  runWithConcurrency
} from "./utils";

export {
  createEmptyCache,
  loadEmbeddingsCache,
  saveEmbeddingsCache
} from "./cache";

export {
  buildEmbeddingIndex,
  performSemanticSearch
} from "./search";
