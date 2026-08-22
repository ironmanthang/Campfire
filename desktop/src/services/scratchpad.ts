import { invoke } from "@tauri-apps/api/core";
import { type ScratchpadDocument, fromDocument, toDocument } from "@campfire/core";

export async function readScratchpadDoc(journalDir: string): Promise<ScratchpadDocument> {
  const raw = await invoke<string>("read_entry", {
    dirPath: journalDir,
    date: "scratchpad",
  });

  if (!raw || !raw.trim()) {
    return toDocument([]);
  }

  let isLegacy = false;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.items)) {
      return parsed as ScratchpadDocument;
    }
    isLegacy = true;
  } catch {
    isLegacy = true;
  }

  const items = fromDocument(raw);
  const doc = toDocument(items);

  if (isLegacy && items.length > 0) {
    writeScratchpadDoc(journalDir, doc).catch((err) => {
      console.error("Failed to auto-migrate desktop scratchpad to JSON:", err);
    });
  }

  return doc;
}

export async function writeScratchpadDoc(journalDir: string, doc: ScratchpadDocument): Promise<void> {
  await invoke("write_entry", {
    dirPath: journalDir,
    date: "scratchpad",
    content: JSON.stringify(doc, null, 2),
  });
}
