import { describe, it, expect } from "vitest";
import {
  parseJsonImport,
  parseMdImport,
  parseImportContent,
  isIdenticalContent,
  appendImportedContent,
} from "../src/importJournal";
import { buildMarkdown } from "../src/exportJournal";

describe("isIdenticalContent", () => {
  it("returns true when contents are identical after trimming", () => {
    expect(isIdenticalContent("  Hello World  \n", "Hello World")).toBe(true);
    expect(isIdenticalContent("Line 1\nLine 2", "Line 1\nLine 2")).toBe(true);
  });

  it("returns false when contents are different", () => {
    expect(isIdenticalContent("Hello", "Hello World")).toBe(false);
    expect(isIdenticalContent("Line 1", "Line 2")).toBe(false);
  });
});

describe("parseImportContent", () => {
  it("parses JSON import format correctly", () => {
    const raw = JSON.stringify([
      { date: "2026-08-01", content: "First entry" },
      { date: "2026-08-02", content: "Second entry" },
    ]);
    const result = parseImportContent(raw);
    expect(result.format).toBe("json");
    expect(result.entries).toEqual([
      { date: "2026-08-01", content: "First entry" },
      { date: "2026-08-02", content: "Second entry" },
    ]);
  });

  it("parses Markdown import format correctly", () => {
    const raw = buildMarkdown([
      { date: "2026-08-01", content: "First entry content" },
      { date: "2026-08-02", content: "Second entry content" },
    ]);

    const result = parseImportContent(raw);
    expect(result.format).toBe("md");
    expect(result.entries).toEqual([
      { date: "2026-08-01", content: "First entry content" },
      { date: "2026-08-02", content: "Second entry content" },
    ]);
  });
});

describe("appendImportedContent", () => {
  it("appends content with marker", () => {
    const merged = appendImportedContent("Original content", "Imported content", "backup.json");
    expect(merged).toContain("Original content");
    expect(merged).toContain("---");
    expect(merged).toContain("*Imported from backup.json*");
    expect(merged).toContain("Imported content");
  });
});
