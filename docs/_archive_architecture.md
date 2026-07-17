# System Architecture Overview

This document describes the design decisions, schemas, backend API commands, and directory layouts implemented in Phase 1 & Phase 2 of the "Past You" offline-first journaling application.

---

## 1. Directory & File Storage Layout
The app store is fully offline and decoupled from the installation binary. The user selects a target directory to contain flat files:

```text
[Selected_Journal_Directory]/
├── 2026-07-01.md
├── 2026-07-02.md
├── 2026-07-03.md
```

### File Conventions
* **Filename**: Must match strict `YYYY-MM-DD.md` (exactly 13 characters, where dashes are at indexes 4 and 7). Non-conforming filenames are skipped during directory listings.
* **Content**: Written in standard plain Markdown text.
* **Tagging**: Injected as `#tagname` within entries. The tag extractor scans text lines outside of markdown code blocks (ignored dynamically) and filters tokens starting with `#` for unique alphanumeric keywords.

---

## 2. Local Configuration Storage
User settings are persistent. Config is stored as `config.json` in the operating system's standard App Config folder (e.g. `%APPDATA%/tauri-app/config.json` on Windows):

```json
{
  "user_name": "Alex",
  "journal_dir": "D:\\MyJournal",
  "theme": "dark",
  "autosave_interval": 1,
  "language": "en"
}
```

---

## 3. Backend Command API (Rust/Tauri)
Exposed in [commands.rs](file:///d:/program/past%20you/src-tauri/src/commands.rs) and registered in [lib.rs](file:///d:/program/past%20you/src-tauri/src/lib.rs):

| Command Name | Arguments | Return Type | Description |
| :--- | :--- | :--- | :--- |
| `load_config` | None | `Result<AppConfig, String>` | Reads and parses `config.json` from standard AppData folder. Defaults to empty fields if missing. |
| `save_config` | `config: AppConfig` | `Result<(), String>` | Saves updated configuration to disk. |
| `list_entries` | `dirPath: String` | `Result<Vec<JournalEntryMetadata>, String>` | Scans folder, parses tags and word count, pulls the first 120 chars for snippet preview, and returns sorted dates (latest first). |
| `read_entry` | `dirPath: String`, `date: String` | `Result<String, String>` | Reads `[date].md` file contents. Returns empty string if file doesn't exist yet. |
| `write_entry` | `dirPath: String`, `date: String`, `content: String` | `Result<(), String>` | Saves journal markdown content to `[date].md`. |
| `search_entries` | `dirPath: String`, `query: String` | `Result<Vec<SearchResult>, String>` | Scans date files case-insensitively, returning matches (date, line number, snippet). |
| `export_journal` | `dirPath: String`, `exportType: String`, `savePath: String` | `Result<(), String>` | Concatenates files chronologically. Generates text files or a JSON compilation array. |
| `get_journal_context` | `dirPath: String`, `startDate: String`, `endDate: String` | `Result<String, String>` | Concatenates entries chronologically between selected dates into a single text block for LLM prompts. |

---

## 4. Frontend State & UI Architecture
The frontend is decoupled into a modular, single-responsibility file structure to keep `App.tsx` clean and ensure code maintainability:

### Core Layout (`src/App.tsx`)
`App.tsx` serves as a thin routing and shell manager. It coordinates:
* Active view navigation (`view` state).
* Cross-view active date navigation (`currentDate` state).
* Handoff operations (e.g. `handleExport`).

### Custom Hooks (`src/hooks/`)
Cross-cutting state machines and operations are extracted into hooks:
* **`useConfig`**: Handles Tauri config loads, field updates, directory selectors, and DOM/Tauri theme syncing.
* **`useOllamaModels`**: Connects to the local service, queries downloads, fallback hooks active models, and manages pinning.
* **`useNotification`**: Controls timing and state for temporary visual banner popups.

### Independent Views (`src/views/`)
Each panel contains its local UI states, effects, and triggers:
* **`JournalEditorView`**: Raw text-area editing state, tags parsing, local save overrides on view change, and debounced autosaves.
* **`TimelineView`**: Month groups visual grouping state, multi-select indices, and drag-to-resize timeline panel logic.
* **`SearchView`**: Query states, result lists, and semantic embedding cache synchronization.
* **`ChatView`**: Chat history arrays, streaming, reasoning collapse visibility state, scroll snap refs, and tokens capacity status.
* **`ReflectionView`**: Custom period selectors and coach reflection report stream state.
* **`SettingsView`**: Download wizard states and general onboarding controls.

---

## 5. Aesthetic Styling System
Maintained in [index.css](file:///d:/program/past%20you/src/index.css) using Tailwind CSS v4 directives:
* **Typography**: Outfitted with Google Fonts' **Outfit** superfamily.
* **Warm Cream Theme (Light)**: Low contrast warm cream (`#FAF8F5`) and oatmeal surfaces (`#F0ECE3`) with rich espresso-charcoal text (`#201D1A`).
* **Warm Charcoal Theme (Dark)**: Cozy warm charcoal backgrounds (`#141210`) and dark slate surfaces (`#1C1917`) with soft cream text (`#E6E1DC`).
* **Scrollbars & Markdown Previews**: Native, beautiful HTML container styles styled directly in CSS variables to keep dependencies low.
* **Date Input Fix**: Uses standard `color-scheme` to align WebView2 widgets dynamically, and hides native WebKit date calendar indicators to prevent visual artifacts, replacing them with a custom React picker click trigger.

---

## 6. AI Integration & Local LLM (Ollama)
Direct connection logic to local models via **Ollama** (`http://localhost:11434`).

### Client Services & APIs
Exposed in [ollama.ts](file:///d:/program/past%20you/src/services/ollama.ts):
* **Status Checks**: Health ping checks and tag queries (`/api/tags`) returning `OllamaModelInfo` arrays containing model names and sizes.
* **Model Downloader**: Connects to `/api/pull` and streams progress updates.
* **SSE Chat Streaming & Thinking**: Streams both `content` (response) and `thinking` (reasoning trace) tokens from `/api/chat`. Rendered dynamically in the UI inside a collapsible "Thought Process" block.

### Token Capacity & Safeguards
* **Dynamic Capacity Limits**: Queries the `/api/show` endpoint for model details. It first attempts to parse a customized `num_ctx` parameter set in the model's Modelfile/parameters using regex. If no custom limit is defined, it checks `model_info` for the architecture's native context length (e.g. `gemma4.context_length`), falling back to a baseline of `128k` (for `gemma4` or cloud models) or `32k` (for others) if both are missing. This value is displayed in the UI capacity meter and passed as `num_ctx` inside the `/api/chat` option payload to respect the model as the single source of truth.
* **Estimator Check**: Fast JS-based heuristic tokenizer estimates tokens first.
* **Precise API tokenize**: Queries `/api/tokenize` if estimated count exceeds 80% threshold.
* **UX Warn/Block**: Warns user if size is >80% and blocks the send button if it exceeds 100%, advising a narrower date range. The chat input box remains active during streaming to allow writing the next response in advance.

### Persona Chat Prompts & Query Handling
The system prompt places the model in the persona of the user's past self during the selected date range. To prevent rejections on technical/coding queries (e.g. asking to write Python code), the guidelines instruct the clone to use general intelligence/skills while staying in character, rather than strictly rejecting queries outside the journal memory scope.

---

## 7. Date Format & UI Conventions
* **Storage Schema**: Files on disk are strictly stored in standard ISO format (`YYYY-MM-DD.md`) for alphanumeric chronological sorting.
* **Display Schema**: All visual dates in the UI (Timeline cards, Search results, header ranges) display in `dd/mm/yy` format.
* **DatePicker Overlay**: Native `<input type="date">` elements are layered transparently on top of formatted visual text spans to preserve full picker functionality while ensuring exactly `dd/mm/yy` is presented.

---

## 8. Internationalization (i18n) System
Exposed in [index.ts](file:///d:/program/past%20you/src/i18n/index.ts) and [languages.ts](file:///d:/program/past%20you/src/i18n/languages.ts):
* **Library**: Built using `i18next` and `react-i18next`.
* **Type-Safety**: Configured custom resources declaration block in TypeScript, forcing strict type-checking of translation keys against `en.json` at compile-time.
* **Storage Synchronization**: The active language is saved inside `AppConfig` and persists across user sessions. When config loads on app start, the language is loaded and set on i18next dynamically.

