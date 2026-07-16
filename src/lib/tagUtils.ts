// NOTE: If you modify this tag extraction logic, also update extract_tags in backend src-tauri/src/commands/journal.rs

export function extractTags(text: string): string[] {
  const tags: string[] = [];
  let inCodeBlock = false;
  text.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      return;
    }
    if (inCodeBlock) return;
    trimmed.split(/\s+/).forEach((word) => {
      if (word.startsWith("#") && word.length > 1) {
        const clean = word.replace(/^#+/, "").replace(/[^a-zA-Z0-9_-].*$/, "");
        if (clean && !tags.includes(clean)) {
          tags.push(clean);
        }
      }
    });
  });
  return tags;
}
