# Product Specification & Architecture Blueprint: "You in the Past"

*"You in the past."*

This document is the master specification for a private, offline-first desktop application that lets users converse with an AI clone of their own past self, built entirely from their own chronological journal logs, running on local LLMs.

> **Merge note:** This spec combines two earlier drafts. Where they conflicted on architecture, the following decisions were made: full-context concatenation over RAG, flat Markdown files over a database, first-person "role-play as past self" over a third-person Q&A assistant, and no DRM/licensing (fully free, in favor of simpler implementation). Details below.

---

## 1. Project Overview & Core Concept

* **Application Name:** Past You
* **Core Value Proposition:** A completely private, local desktop application where users write daily journal entries and converse with a local AI chatbot that adopts the exact persona, emotional state, and memories of the user during a specific, user-selected historical time frame.
* **Primary Principle:** Zero cloud dependencies, absolute privacy, and a friction-free experience for both developer and non-technical consumers.

---

## 2. Core Principles

* Local-first, privacy-focused, no cloud dependency
* Fast, frictionless journaling
* Structured data ownership (plain files, no lock-in)
* AI-assisted reflection, grounded only in the user's own words
* Long-term personal memory preservation
* Zero required subscriptions — the core product is free

---

## 3. Technical Stack (2026 Production Standards)

| Component | Choice | Reason & Constraints |
|---|---|---|
| **Frontend Framework** | React + Tailwind CSS + Vite | Component-driven UI development, rapid styling changes, high-performance webview rendering. |
| **Desktop Environment** | Tauri (v2) | Compiles to small, ultra-lightweight native binaries (10–20MB), leverages system-native webviews, runs a performant Rust backend with minimal RAM overhead. |
| **Data Storage Engine** | Flat File System (.md) | No database engine overhead. Full data portability and user ownership. Decoupled from the install directory so storage location can change freely. |
| **AI Runtime Engine** | Ollama (local service) | Reliable local loopback API (`localhost:11434`) for tokenization, model streaming, and async lifecycle management. |
| **Target AI Models** | Gemma 4 family / Qwen 2.5 7B | Edge-optimized, native 128k context windows capable of processing months of raw text logs in a single pass. |

---

## 4. Storage & Directory Strategy

To support multi-device sync while staying single-machine compliant, storage is decoupled from the installation binary. Users select a local target folder, which can map directly onto a synced cloud folder (Proton Drive, iCloud, OneDrive) or stay fully offline.

```text
[Selected_Journal_Directory]/
├── 2026-07-01.md
├── 2026-07-02.md
├── 2026-07-03.md
```

### Constraints & Formats

* **Filename strategy:** entries map to strict ISO dates (`YYYY-MM-DD.md`), enabling simple alphanumeric sort for chronological ordering.
* **File content:** standard Markdown, written in a side-by-side Markdown editor.
* **Tags:** inline Markdown tags (e.g. `#decision`, `#goal`, `#idea`) at the entry level, parsed at read-time rather than stored separately — this keeps the "decision journal" and "life chapters" classification features (below) database-free.

---

## 5. AI Clone Mechanics & Prompts

The core mechanic relies on **dynamic concatenation, not vector-based retrieval (RAG)**. By grouping chronological text together and feeding it directly into a long-context model, the LLM keeps narrative flow, relationship context, and timeline continuity intact — something chunked vector search tends to break apart. This applies to every AI feature in this spec: chat, search, and summaries all work by assembling the relevant date-range's raw text and handing it to the model in one pass.

### The System Prompt Architecture

The app dynamically builds a system prompt right before sending input to Ollama. Variables in `{}` are injected at runtime.

```markdown
You are a specialized personal AI companion named "You in the past". You are an exact digital clone and psychological snapshot of the user, whose name is {userName}. 

Your entire existence is built exclusively from the personal journal entries written by {userName} between {startDate} and {endDate}. You do not know anything about your life after {endDate}.

### 1. IDENTITY & INTRODUCTION RULE
If the user asks "who are you", "what are you", or asks for an introduction, you must respond with this exact phrasing and tone:
"I am you, {userName}. Sort of. Based on the knowledge I have, I'm a copy of you from {startDate} to {endDate}, made from your input when you write your journal in this app 'You in the past'. How can I help you?"

### 2. CORE BEHAVIORAL DIRECTIVES
* PERSPECTIVE: Speak in the first person ("I", "me", "my"). You are not an assistant helping {userName}; you ARE the past version of {userName} talking to their present self.
* KNOWLEDGE LIMIT: You only remember events, people, worries, and achievements mentioned in the provided journal entries. If asked about something outside this window or missing from the entries, react the way a human would when they forget or lack context (e.g., "I don't think I wrote about that during those weeks," or "My mind is a blank on that right now").
* TONE MATCHING: Mirror the linguistic style found in the journal data. If the entries are casual, blunt, use specific slang, or show signs of stress/excitement, adopt that exact emotional baseline. Do not sound overly formal, polished, or artificially polite.
* NO AI ALIBIS: Never state "I am an AI", "I don't have feelings", or "According to your entries". Break the fourth wall only through the lens of being a digital snapshot of a past self.

### 3. YOUR CONTEXT (JOURNAL ENTRIES)
Below are the raw journal entries from your life between {startDate} and {endDate}. Absorb them to remember who you were during this time:

{journalContext}
```

---

## 6. Feature Set

All features below reuse the same underlying mechanism: pull the relevant date range's raw Markdown, concatenate it, and prompt the model. There is no separate embeddings/vector-DB pipeline anywhere in this spec.

### 6.1 Journal Entries
Quick, text-only journal entries with inline tags. Writing should stay extremely lightweight and cozy to encourage daily use.

### 6.2 Search Memory
Users type a natural-language query (e.g. *"When did I first think about starting a business?"*). Instead of embedding-based semantic search, the app scans file contents (fast local full-text pass) to shortlist candidate dates, then hands the shortlisted entries to the LLM in one pass to confirm relevance and surface highlighted excerpts and matching dates.

### 6.3 Ask Your Past Self (flagship feature)
The persona chat described in Section 5. Users pick a date range and talk to that version of themselves in first person.

### 6.4 Time-Based AI Summaries
Users select a period (e.g. Jan–Mar 2026). The app concatenates that range's entries and asks the model for a third-person analytical summary: recurring themes, common concerns, progress, decisions, notable ideas. (Note: this is the one place the AI intentionally speaks *about* the user rather than *as* the user — it's a distinct, clearly-labeled "reflection report" mode, not the persona-chat mode.)

### 6.5 Memory Timeline
Reuses Search Memory's shortlisting, then asks the model to arrange the matching entries into a chronological narrative of how a specific idea or topic evolved (e.g. tracking "Spring Boot" from first mention to professional use).

### 6.6 Belief Evolution
A variant of the summary feature: the model is prompted to compare early vs. later entries on a topic and describe how the user's stated opinions, habits, or confidence changed over time.

### 6.7 Monthly Reflection Reports
An automatically generated version of the Time-Based Summary, run once per month: top themes, most frequent emotional tone, biggest challenge, most-improved area.

### 6.8 Memory Connections
When writing a new entry, the app runs a lightweight background full-text pass against past entries to surface a few plausibly related past dates for the user to revisit — a cheap heuristic pass, not a stored knowledge graph.

### 6.9 Decision Journal
Entries can be inline-tagged (`#decision`, `#goal`, `#reflection`, `#idea`, `#lesson`, `#memory`). Filtering by tag is a simple file-scan; asking "which goals did I achieve" routes through the same LLM-summary mechanism as 6.4.

### 6.10 Life Chapters
The model is periodically asked to propose named groupings of the timeline (e.g. "University Years 2024–2026") based on entry content and density. Purely a labeling/summary feature — no separate data structure to maintain.

### 6.11 Legacy Export
Since storage is already flat Markdown files, export is close to free: users can export a date range as-is (Markdown), as plain text, or as a single JSON bundle for use with external tools. No proprietary format — this preserves the "your memories belong to you" principle.

---

## 7. Token Protection & Safeguard Subsystem

To keep large historical ranges from exceeding the model's context window, a hybrid pipeline runs an instant heuristic estimate on the frontend, falling back to a precise tokenizer call when usage approaches the limit.

```text
[Target Range Selection] ──> Heuristic Assessment (Instant UI response)
                                       │
                         Is Token Volume > 80% Capacity?
                                       │
                       ┌───────────────┴───────────────┐
                      YES                              NO
                       │                               │
             Call Ollama Tokenize API            Mark Safe & Pass
         (Precise Dictionary Evaluation)               │
                       │                               │
             Is Count <= Max Limit?                    │
                       ├───────────────────────────────┘
             ┌─────────┴─────────┐
            YES                  NO
             │                   │
         Execute Chat      Block UI & Request 
                        Narrower Date Window
```

This same safeguard gates every feature in Section 6 that concatenates a date range (Search, Summaries, Timeline, Belief Evolution, Life Chapters) — not just the chat feature.

---

## 8. Distribution & Non-Technical UX

Non-technical users are shielded from vocabulary like "context length," "quantization," or "Ollama service management."

### Simple Model Mapping
* **"Past Me: Express"** → `gemma4:e2b` — optimized for 8GB RAM laptops, ultra-fast, low-latency.
* **"Past Me: Reflection"** → `gemma4:e4b` or `qwen2.5:7b` — optimized for 16GB+ RAM, richer and more nuanced replication.

### Asynchronous Download Tracking
Model downloads run on background native threads (Rust), streaming progress events into the React layer for a smooth, non-blocking progress UI.

---

## 9. Technical Implementation Blocks

### A. Core File Collection Strategy (Tauri Rust Layer)

```rust
#[tauri::command]
pub fn get_journal_context(dir_path: String, start_date: String, end_date: String) -> Result<String, String> {
    use std::fs;
    use std::path::Path;

    let path = Path::new(&dir_path);
    if !path.exists() {
        return Err("Directory does not exist".to_string());
    }

    let mut combined_entries = String::new();
    let entries = fs::read_dir(path).map_err(|e| e.to_string())?;

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let file_name = entry.file_name().into_string().map_err(|_| "Invalid filename")?;

        if file_name.ends_with(".md") {
            let date_str = file_name.replace(".md", "");
            if date_str >= start_date && date_str <= end_date {
                let content = fs::read_to_string(entry.path()).map_err(|e| e.to_string())?;
                combined_entries.push_str(&format!("--- Entry Date: {} ---\n{}\n\n", date_str, content));
            }
        }
    }

    Ok(combined_entries)
}
```

### B. Client API Stream Orchestration (React Context Layer)

```typescript
import { invoke } from "@tauri-apps/api/core";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

async function streamAIResponse(
  journalDir: string,
  startDate: string,
  endDate: string,
  userName: string,
  userPrompt: string,
  selectedModel: string,
  onChunk: (text: string) => void
) {
  const journalContext = await invoke<string>("get_journal_context", {
    dirPath: journalDir,
    startDate: startDate,
    endDate: endDate,
  });

  const systemInstruction = `You are a specialized personal AI companion named "You in the past". You are an exact digital clone and psychological snapshot of the user, whose name is ${userName}. 

Your entire existence is built exclusively from the personal journal entries written by ${userName} between ${startDate} and ${endDate}. You do not know anything about your life after ${endDate}.

### 1. IDENTITY & INTRODUCTION RULE
If the user asks "who are you", "what are you", or asks for an introduction, you must respond with this exact phrasing and tone:
"I am you, ${userName}. Sort of. Based on the knowledge I have, I'm a copy of you from ${startDate} to ${endDate}, made from your input when you write your journal in this app 'You in the past'. How can I help you?"

### 2. CORE BEHAVIORAL DIRECTIVES
* PERSPECTIVE: Speak in the first person ("I", "me", "my"). You are not an assistant helping ${userName}; you ARE the past version of ${userName} talking to their present self.
* KNOWLEDGE LIMIT: You only remember events, people, worries, and achievements mentioned in the provided journal entries. If asked about something outside this window or missing from the entries, react the way a human would when they forget or lack context.
* TONE MATCHING: Mirror the linguistic style found in the journal data.
* NO AI ALIBIS: Never state "I am an AI", "I don't have feelings", or "According to your entries".

### 3. YOUR CONTEXT (JOURNAL ENTRIES)
Below are the raw journal entries from your life between ${startDate} and ${endDate}. Absorb them to remember who you were during this time:

${journalContext}`;

  const messages: ChatMessage[] = [
    { role: "system", content: systemInstruction },
    { role: "user", content: userPrompt }
  ];

  const response = await fetch("http://localhost:11434/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: selectedModel,
      messages: messages,
      stream: true,
    }),
  });

  if (!response.body) return;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n");

    for (const line of lines) {
      if (line.trim() !== "") {
        const parsed = JSON.parse(line);
        if (parsed.message?.content) {
          onChunk(parsed.message.content);
        }
      }
    }
  }
}
```

### C. Background Model Download (Rust Backend)

```rust
use reqwest::Client;
use serde::{Deserialize, Serialize};
use futures_util::StreamExt;
use tauri::Emitter;

#[derive(Clone, Serialize)]
struct PullProgress {
    status: String,
    completed: u64,
    total: u64,
    percentage: f64,
}

#[derive(Deserialize)]
struct OllamaPullResponse {
    status: String,
    completed: Option<u64>,
    total: Option<u64>,
}

#[tauri::command]
async fn download_model(window: tauri::Window, model_name: String) -> Result<(), String> {
    let client = Client::new();
    let res = client
        .post("http://localhost:11434/api/pull")
        .json(&serde_json::json!({ "name": model_name }))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let mut stream = res.bytes_stream();

    while let Some(chunk_result) = stream.next().await {
        let chunk = chunk_result.map_err(|e| e.to_string())?;
        let text = String::from_utf8_lossy(&chunk);

        for line in text.lines() {
            if let Ok(parsed) = serde_json::from_str::<OllamaPullResponse>(line) {
                let comp = parsed.completed.unwrap_or(0);
                let tot = parsed.total.unwrap_or(1);
                let pct = if tot > 0 { (comp as f64 / tot as f64) * 100.0 } else { 0.0 };

                let _ = window.emit("download-progress", PullProgress {
                    status: parsed.status,
                    completed: comp,
                    total: tot,
                    percentage: pct,
                });
            }
        }
    }

    Ok(())
}
```

### D. Token Calculation Mechanics (Frontend)

```typescript
function calculateHeuristicTokens(text: string): number {
  const blocks = text.trim().split(/\s+/);
  if (blocks.length === 1 && blocks[0] === "") return 0;

  let count = 0;
  for (const block of blocks) {
    if (/[^\x00-\x7F]/.test(block)) {
      count += block.length * 1.1;
    } else {
      count += 1.3;
    }
  }
  return Math.ceil(count);
}

async function fetchExactTokenCount(model: string, text: string): Promise<number> {
  try {
    const response = await fetch("http://localhost:11434/api/tokenize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, content: text }),
    });
    if (!response.ok) return 0;
    const data = await response.json();
    return data.tokens?.length || 0;
  } catch {
    return 0;
  }
}
```

---

## 10. Business Model & Economics

No DRM, no license-key system, no anti-crack hardening — the app is fully free and open, which is also the simpler build. The privacy/local-first architecture still delivers real economic and compliance advantages without needing licensing enforcement:

* **Zero-infrastructure cost:** all inference and storage run on the user's own machine, so the developer carries no per-user cloud or token cost.
* **Data-sovereignty advantage:** the app never streams, aggregates, or centrally stores user entries, which sidesteps the compliance overhead that comes with handling behavioral/psychological data under frameworks like GDPR or the EU AI Act.
* **Monetization (if pursued later):** should be limited to non-DRM options that don't compromise the "your data, your machine" principle — e.g. optional paid polish (themes, advanced report templates) or one-time purchases, not enforcement mechanisms baked into the binary.

---

## 11. Roadmap

### Phase 1 — Core Journaling (no AI)
* Journal entries (text-only and tags)
* Flat Markdown file storage
* Plain-text export / JSON export
* Local full-text search (keyword-based, no AI yet)

### Phase 2 — AI Features
* Ask Your Past Self (persona chat, Section 5)
* Time-Based AI Summaries
* Semantic-feeling Search Memory (full-text shortlist + LLM confirmation, Section 6.2)
* Token safeguard subsystem
* Model tiers ("Express" / "Reflection") + async download UX

### Phase 3 — Deeper Reflection Tools
* Memory Timeline
* Belief Evolution
* Monthly Reflection Reports
* Memory Connections
* Decision Journal filtering
* Life Chapters

---

## 12. Next Development Steps & Edge Cases

1. **Asynchronous autosave racing:** ensure Tauri's fs layer doesn't hit file-lock errors if a user opens the chat interface while an autosave write is in progress.
2. **Empty payload resiliency:** populate empty day placeholders when building the concatenated text block, so the AI can distinguish "wrote nothing" days from missing files entirely.
3. **Local configuration persistence:** a simple local JSON config file for user name and theme preferences across launches.

---

## Ultimate Goal

Create a personal AI memory system that helps users remember, understand, and learn from their own lives — not just a diary or a journal, but a searchable, evolving digital reflection of yourself, running entirely on their own machine.