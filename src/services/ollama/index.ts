// Barrel re-export for services/ollama — all public API in one place.
// AI agents: the sub-files are named after what they do:
//   types.ts       — shared interfaces (OllamaMessage, OllamaTool, OllamaModelInfo, …)
//   modelClient.ts — REST calls to Ollama: list models, check status, download
//   chatStream.ts  — Streaming /api/chat response reader
//   tokenUtils.ts  — Heuristic + exact token counting
//   messageParser.ts — Parse DraftAttachments and clean text out of OllamaMessage

export * from "./types";
export * from "./modelClient";
export * from "./chatStream";
export * from "./tokenUtils";
export * from "./messageParser";
