import { beforeEach, describe, expect, it, vi } from "vitest";
import { save } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { createConfigSlice } from "./configSlice";

vi.mock("@tauri-apps/plugin-dialog", () => ({
  save: vi.fn(),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

describe("createConfigSlice handleExport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses a markdown file extension for text exports", async () => {
    const showNotification = vi.fn();
    const state = {
      config: { journal_dir: "/tmp/journal" },
      showNotification,
    } as any;

    const slice = createConfigSlice(
      (partial) => {
        Object.assign(state, partial);
      },
      () => state,
      {} as any,
    );

    vi.mocked(save).mockResolvedValue("/tmp/journal_export.md" as any);
    vi.mocked(invoke).mockResolvedValue(undefined);

    await slice.handleExport("text", ["2026-07-18"]);

    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: [{ name: "Markdown Document", extensions: ["md"] }],
        defaultPath: "journal_export_2026-07-18.md",
      }),
    );
  });
});
