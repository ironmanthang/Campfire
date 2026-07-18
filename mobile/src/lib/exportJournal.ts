// Shared export helpers for the mobile journal.
// Output formats mirror the desktop Rust exporter in
// src-tauri/src/commands/journal/crud.rs (`export_journal`) so that files
// produced on mobile can be re-imported on desktop unchanged.

import { getLocalYYYYMMDD } from "./dateUtils";

export interface ExportableEntry {
  date: string; // YYYY-MM-DD
  content: string;
}

export interface ExportedJsonEntry {
  date: string;
  content: string;
  word_count: number;
  tags: string[];
}

// Matches Rust `content.split_whitespace().count()` semantics.
export function wordCount(content: string): number {
  if (!content) return 0;
  return content.split(/\s+/).filter((w) => w.length > 0).length;
}

// Unicode-aware tag extraction. Mirrors the Rust `extract_tags` in
// src-tauri/src/commands/journal/helpers.rs (which uses `is_alphanumeric`),
// so non-ASCII hashtags like `#nhật_ký` survive a mobile → desktop
// round-trip. We intentionally do NOT reuse `src/lib/tagUtils.ts`'s regex
// because it strips at the first non-`[a-zA-Z0-9_-]` char and mangles
// non-ASCII tags. Keep both implementations aligned with the Rust version.
export function extractTagsMobile(text: string): string[] {
  const tags: string[] = [];
  let inCodeBlock = false;
  const isTagChar = (c: string) => {
    // Letters (including Vietnamese diacritics, CJK, etc.) + digits + _ -
    return /\p{L}|\p{N}|_|-/u.test(c);
  };

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    for (const word of trimmed.split(/\s+/)) {
      if (!word.startsWith("#") || word.length <= 1) continue;
      const candidate = word.slice(1);
      let cleaned = "";
      for (const ch of candidate) {
        if (isTagChar(ch)) cleaned += ch;
        else break;
      }
      if (cleaned.length > 0 && !tags.includes(cleaned)) {
        tags.push(cleaned);
      }
    }
  }
  return tags;
}

function sortAsc(entries: ExportableEntry[]): ExportableEntry[] {
  return [...entries].sort((a, b) => a.date.localeCompare(b.date));
}

// Desktop exporter writes:
//   ========================================
//   DATE: YYYY-MM-DD
//   ========================================
//
//   <content>
//
//
// The desktop markdown parser (`parse_md_import`) splits on the
// "========================================" marker and reads pairs of
// (date header, content chunk). The content is `.trim()`-ed, so trailing
// newlines are safe to add.
function buildMarkdown(entries: ExportableEntry[]): string {
  const sep = "========================================";
  let out = "";
  for (const e of sortAsc(entries)) {
    out += `${sep}\n`;
    out += `DATE: ${e.date}\n`;
    out += `${sep}\n\n`;
    out += `${e.content}\n\n\n`;
  }
  return out;
}

// Exported for testing.
export { buildMarkdown };

function buildJson(entries: ExportableEntry[]): ExportedJsonEntry[] {
  return sortAsc(entries).map((e) => ({
    date: e.date,
    content: e.content,
    word_count: wordCount(e.content),
    tags: extractTagsMobile(e.content),
  }));
}

// Exported for testing.
export { buildJson };

export function exportAsMarkdown(entries: ExportableEntry[]): Blob {
  return new Blob([buildMarkdown(entries)], {
    type: "text/markdown;charset=utf-8",
  });
}

export function exportAsJson(entries: ExportableEntry[]): Blob {
  const payload = JSON.stringify(buildJson(entries), null, 2);
  return new Blob([payload], { type: "application/json;charset=utf-8" });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function defaultExportFilename(extension: "json" | "md"): string {
  return `journal_export_${getLocalYYYYMMDD()}.${extension}`;
}
