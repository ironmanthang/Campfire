export interface AppConfig {
  version: number;
  user_name: string;
  journal_dir: string;
  theme: 'light' | 'dark';
  autosave_interval: number; // in seconds
  config_section_order: string[];
  language: string;
  web_search_enabled: boolean;
  web_search_provider: 'brave_free' | 'tavily' | 'google';
  web_search_api_key: string;
  web_search_google_cx: string;
  google_drive_client_id: string;
  google_drive_client_secret: string;
  google_drive_auto_sync: boolean;
  custom_logo: string;
  custom_title: string;
  custom_subtitle: string;
  system_instruction_mode: 'default' | 'append' | 'override';
  custom_system_instruction: string;
  pwa_url: string;
}

export interface JournalEntryMetadata {
  date: string;
  tags: string[];
  preview: string;
  word_count: number;
}

export interface SearchResult {
  date: string;
  line_number: number;
  snippet: string;
  similarity?: number; // Optional similarity score for semantic search
}

import { OllamaMessage } from "./services/ollama";

export interface ChatSession {
  version: number;
  start_date: string;
  end_date: string;
  model: string;
  messages: OllamaMessage[];
}

export interface EmbeddingChunk {
  text: string;
  line_number: number;
  vector: number[];
}

export interface CacheEntry {
  hash: string;
  chunks: EmbeddingChunk[];
}

export interface EmbeddingCacheData {
  version: number;
  model: string;
  entries: { [date: string]: CacheEntry };
}

export interface SystemResources {
  gpu_raw: string;
  ollama_ps_raw: string;
  cpu_raw: string;
  ram_raw: string;
}

export type ViewType = "journal" | "timeline" | "search" | "chat" | "reflection" | "settings";

export interface DraftAttachment {
  id: string;
  name: string;
  size: number;
  type: 'image' | 'text';
  content: string;
  previewUrl?: string;
}
