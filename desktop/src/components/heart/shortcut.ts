// Shared helpers for the heart keyboard shortcut. The shortcut is stored as a
// normalized lowercase canonical string like "ctrl+shift+l", with modifiers
// always ordered: ctrl, alt, shift, meta. An empty string means "no shortcut".

const MODIFIER_ORDER = ["ctrl", "alt", "shift", "meta"] as const;
type Modifier = (typeof MODIFIER_ORDER)[number];

const MODIFIER_LABELS: Record<Modifier, string> = {
  ctrl: "Ctrl",
  alt: "Alt",
  shift: "Shift",
  meta: "Meta",
};

/**
 * Detect the OS "primary modifier" so we can show `Cmd` on Mac and `Ctrl`
 * elsewhere in the *display* string, even though the stored canonical form
 * always uses "ctrl" (since the underlying JS event is `e.ctrlKey` on
 * non-Mac, and on Mac Tauri's WebView still reports `e.metaKey` for Cmd —
 * we map Cmd → Meta in the stored form on Mac).
 */
function isMac(): boolean {
  if (typeof navigator === "undefined") return false;
  // navigator.platform is deprecated but still the most reliable cross-WebView signal.
  const platform = (navigator as any).platform || "";
  const userAgent = navigator.userAgent || "";
  return /Mac|iPhone|iPad|iPod/i.test(platform) || /Mac OS X/i.test(userAgent);
}

/**
 * Normalize a KeyboardEvent into our canonical shortcut string. Returns
 * `null` if the event has no usable non-modifier key (e.g. pressing Shift
 * alone), or if the only key is a bare modifier.
 */
export function normalizeShortcutFromEvent(e: KeyboardEvent): string | null {
  const key = (e.key || "").toLowerCase();
  // Reject bare modifier presses.
  if (key === "control" || key === "shift" || key === "alt" || key === "meta") {
    return null;
  }
  // Escape is the "cancel recording" sentinel, never a real shortcut.
  if (key === "escape") return "__escape__";

  const modifiers: Modifier[] = [];
  if (e.ctrlKey) modifiers.push("ctrl");
  if (e.altKey) modifiers.push("alt");
  if (e.shiftKey) modifiers.push("shift");
  // On Mac, `Ctrl` is reported as `e.metaKey` (the Cmd key). Map it so the
  // stored form matches what the user actually pressed.
  if (e.metaKey && !modifiers.includes("ctrl")) {
    modifiers.push(isMac() ? "meta" : "ctrl");
  }

  // Allow a plain key press as a shortcut as long as it's not a bare modifier,
  // an Escape-like cancel key, or a single modifier-only combo. We still keep
  // the existing guard for bare modifier presses so the recorder doesn't accept
  // accidental presses like Shift or Ctrl by themselves.
  const isFnKey = /^f\d{1,2}$/.test(key);
  const isSpecial = [
    "enter",
    "tab",
    "backspace",
    "delete",
    "home",
    "end",
    "pageup",
    "pagedown",
    "arrowup",
    "arrowdown",
    "arrowleft",
    "arrowright",
    " ",
  ].includes(key);

  if (modifiers.length === 0 && !isFnKey && !isSpecial) {
    return key;
  }

  return [...MODIFIER_ORDER.filter((m) => modifiers.includes(m)), key].join("+");
}

/**
 * Convert a stored canonical shortcut ("ctrl+shift+l") into a human-readable
 * display string ("Ctrl + Shift + L"). On Mac, `ctrl` is shown as `Cmd`.
 */
export function formatShortcutForDisplay(canonical: string): string {
  if (!canonical) return "";
  const parts = canonical.toLowerCase().split("+").filter(Boolean);
  const mac = isMac();
  return parts
    .map((p) => {
      if (p === "ctrl") return mac ? "Cmd" : "Ctrl";
      if (p === "meta") return mac ? "Cmd" : "Win";
      if (p in MODIFIER_LABELS) return MODIFIER_LABELS[p as Modifier];
      // Capitalize single-character keys; otherwise title-case the key name.
      if (p.length === 1) return p.toUpperCase();
      if (p === "arrowup") return "↑";
      if (p === "arrowdown") return "↓";
      if (p === "arrowleft") return "←";
      if (p === "arrowright") return "→";
      return p.charAt(0).toUpperCase() + p.slice(1);
    })
    .join(" + ");
}

/**
 * Test whether a KeyboardEvent matches a stored canonical shortcut.
 */
export function matchesShortcut(e: KeyboardEvent, canonical: string): boolean {
  if (!canonical) return false;
  const parsed = normalizeShortcutFromEvent(e);
  if (!parsed || parsed.startsWith("__")) return false;
  return parsed === canonical;
}
