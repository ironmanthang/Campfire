// Shared journal import helpers. Aligned with Desktop Rust import parser
// in src-tauri/src/commands/journal/crud.rs for full compatibility.

export interface ImportSkippedEntry {
  date: string;
  reason: string;
}

export interface ImportError {
  date?: string;
  message: string;
}

export interface ImportReport {
  source_format: 'json' | 'md';
  new_entries: string[];
  appended_entries: string[];
  skipped: ImportSkippedEntry[];
  errors: ImportError[];
}

export function parseJsonImport(raw: string): { date: string; content: string }[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error('Invalid JSON format');
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Invalid JSON import: expected array of entries');
  }

  const entries: { date: string; content: string }[] = [];
  for (let i = 0; i < parsed.length; i++) {
    const item = parsed[i];
    if (!item || typeof item !== 'object') continue;
    const date = typeof item.date === 'string' ? item.date.trim() : '';
    const content = typeof item.content === 'string' ? item.content : '';
    if (date) {
      entries.push({ date, content });
    }
  }

  return entries;
}

export function parseMdImport(raw: string): { date: string; content: string }[] {
  const entries: { date: string; content: string }[] = [];
  const marker = "========================================";

  const chunks = raw
    .split(marker)
    .map((c) => c.trim())
    .filter((c) => c.length > 0);

  let index = 0;
  while (index < chunks.length) {
    const dateChunk = chunks[index];
    const firstLine = dateChunk.split('\n')[0]?.trim() || '';
    if (!firstLine.startsWith('DATE: ')) {
      throw new Error('Invalid markdown export: missing DATE header');
    }
    const date = firstLine.substring('DATE: '.length).trim();
    const contentChunk = chunks[index + 1] || '';
    entries.push({ date, content: contentChunk.trim() });
    index += 2;
  }

  return entries;
}

export function parseImportContent(raw: string): { format: 'json' | 'md'; entries: { date: string; content: string }[] } {
  const trimmed = raw.trimStart();
  if (trimmed.startsWith('[')) {
    return { format: 'json', entries: parseJsonImport(raw) };
  } else {
    return { format: 'md', entries: parseMdImport(raw) };
  }
}

export function appendImportedContent(original: string, imported: string, sourceName: string): string {
  let combined = original.trimEnd();
  combined += "\n\n---\n";
  combined += `*Imported from ${sourceName}*\n\n`;
  combined += imported.trimStart();
  return combined;
}
