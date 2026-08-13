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
  google_drive_auto_sync: boolean;
  custom_logo: string;
  custom_title: string;
  custom_subtitle: string;
  system_instruction_mode: 'default' | 'append' | 'override';
  custom_system_instruction: string;
  pwa_url: string;

  // Donation heart settings
  show_donate_heart: boolean;
  heart_click_falls: boolean;
  heart_fall_speed: number; // 1-10
  heart_size: number; // px
  heart_rain_duration: number; // seconds, 1-30
  heart_position: { x: number; y: number } | null;
  heart_gate_dismissed: boolean;
  /**
   * Global keyboard shortcut that triggers the floating heart. Stored as a
   * normalized lowercase string like "ctrl+shift+l", or "" for "no shortcut".
   * Modifiers are always sorted as ctrl, alt, shift, meta, in that order.
   */
  heart_shortcut: string;
  /**
   * Optional `data:` URL (e.g. `data:image/png;base64,...`) for a custom
   * image used in place of the default red heart icon. Empty string means
   * "use the default red heart". The image is rendered at the same size
   * as the heart, with all the same settings (size, speed, etc.) applying
   * to it.
   */
  heart_custom_image: string;
  locked_entries?: Record<string, boolean>;
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
