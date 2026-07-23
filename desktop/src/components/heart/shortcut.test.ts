import { describe, expect, it } from "vitest";
import { normalizeShortcutFromEvent } from "./shortcut";

describe("normalizeShortcutFromEvent", () => {
  it("allows a plain key press as a shortcut", () => {
    const event = {
      key: "a",
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: false,
    } as KeyboardEvent;

    expect(normalizeShortcutFromEvent(event)).toBe("a");
  });

  it("still rejects bare modifier presses", () => {
    const event = {
      key: "shift",
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: false,
    } as KeyboardEvent;

    expect(normalizeShortcutFromEvent(event)).toBeNull();
  });
});
