import { describe, it, expect } from "vitest";
import {
  buildJson,
  buildMarkdown,
  wordCount,
  defaultExportFilename,
  type ExportableEntry,
} from "./exportJournal";

const sample: ExportableEntry[] = [
  {
    date: "2026-07-19",
    content: "Hôm nay trời đẹp #nhật_ký và tôi đã đi dạo.\nVui lắm!",
  },
  {
    date: "2026-07-18",
    content: "Yesterday was busy.\nThree lines here.",
  },
  {
    date: "2026-07-20",
    content: "#work planning\n```\ncode block should be ignored #notatag\n```\nend",
  },
];

describe("wordCount", () => {
  it("returns 0 for empty strings", () => {
    expect(wordCount("")).toBe(0);
  });
  it("matches Rust split_whitespace semantics", () => {
    expect(wordCount("a b c")).toBe(3);
    expect(wordCount("  a   b  ")).toBe(2);
    expect(wordCount("a\nb\nc")).toBe(3);
  });
  it("handles Vietnamese diacritics correctly", () => {
    expect(wordCount("Hôm nay trời đẹp")).toBe(4);
  });
});

describe("buildJson", () => {
  it("sorts entries chronologically ascending", () => {
    const out = buildJson(sample);
    expect(out.map((e) => e.date)).toEqual([
      "2026-07-18",
      "2026-07-19",
      "2026-07-20",
    ]);
  });

  it("includes word_count and tags fields per entry", () => {
    const out = buildJson(sample);
    for (const e of out) {
      expect(e).toHaveProperty("date");
      expect(e).toHaveProperty("content");
      expect(e).toHaveProperty("word_count");
      expect(e).toHaveProperty("tags");
      expect(typeof e.word_count).toBe("number");
      expect(Array.isArray(e.tags)).toBe(true);
    }
  });

  it("extracts Vietnamese hashtags into tags", () => {
    const out = buildJson(sample);
    const july19 = out.find((e) => e.date === "2026-07-19")!;
    expect(july19.tags).toContain("nhật_ký");
  });

  it("ignores hashtags inside fenced code blocks", () => {
    const out = buildJson(sample);
    const july20 = out.find((e) => e.date === "2026-07-20")!;
    expect(july20.tags).toEqual(["work"]);
    expect(july20.tags).not.toContain("notatag");
  });

  it("computes correct word_count for entries", () => {
    const out = buildJson(sample);
    const july18 = out.find((e) => e.date === "2026-07-18")!;
    // "Yesterday was busy." (3) + "Three lines here." (3) = 6
    expect(july18.word_count).toBe(6);
  });
});

describe("buildMarkdown", () => {
  it("sorts entries chronologically ascending", async () => {
    const md = buildMarkdown(sample);
    const dates = [...md.matchAll(/DATE: (\d{4}-\d{2}-\d{2})/g)].map((m) => m[1]);
    expect(dates).toEqual(["2026-07-18", "2026-07-19", "2026-07-20"]);
  });

  it("uses the exact separator the desktop importer expects", () => {
    const md = buildMarkdown(sample);
    expect(md).toContain("========================================");
    expect(md).toContain("DATE: 2026-07-19");
    expect(md).toContain("DATE: 2026-07-20");
  });

  it("preserves Vietnamese characters in the output", () => {
    const md = buildMarkdown(sample);
    expect(md).toContain("Hôm nay trời đẹp");
    expect(md).toContain("nhật_ký");
  });

  it("is round-trippable by the desktop Rust parser (parse_md_import)", () => {
    // The desktop parser splits on the 40-char "=" marker, then reads pairs
    // of (date chunk, content chunk) and `.trim()`s the content.
    const md = buildMarkdown(sample);
    const sep = "========================================";
    const chunks = md
      .split(sep)
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const parsed: { date: string; content: string }[] = [];
    let i = 0;
    while (i < chunks.length) {
      const dateLine = chunks[i].split("\n")[0].trim();
      const date = dateLine.replace(/^DATE:\s*/, "");
      const content = (chunks[i + 1] ?? "").trim();
      parsed.push({ date, content });
      i += 2;
    }

    expect(parsed).toHaveLength(3);
    expect(parsed[0]).toEqual({
      date: "2026-07-18",
      content: "Yesterday was busy.\nThree lines here.",
    });
    expect(parsed[1].date).toBe("2026-07-19");
    expect(parsed[1].content).toContain("Hôm nay trời đẹp");
    expect(parsed[2].date).toBe("2026-07-20");
  });
});

describe("defaultExportFilename", () => {
  it("returns journal_export_<localdate>.json for json", () => {
    const name = defaultExportFilename("json");
    expect(name).toMatch(/^journal_export_\d{4}-\d{2}-\d{2}\.json$/);
  });
  it("returns journal_export_<localdate>.md for markdown", () => {
    const name = defaultExportFilename("md");
    expect(name).toMatch(/^journal_export_\d{4}-\d{2}-\d{2}\.md$/);
  });
});
