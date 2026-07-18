import i18n from "../i18n";

// Hard-coded English fallback so the chip is never empty
// (e.g. if a translator deletes the i18n array).
const FALLBACK_SERIOUS: string[] = [
  "What is your comment about me lately?",
  "What should I do now?",
  "What do you know about me?",
];

const FALLBACK_HUMOR: string[] = [
  "How do I fly to space?",
  "Rate my life on a scale of 1 to potato.",
];

function asStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const filtered = value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
  return filtered.length > 0 ? filtered : null;
}

function getLocalizedLists(): { serious: string[]; humor: string[] } {
  const serious = asStringArray(i18n.t("chatView.suggestedPrompts.serious", { returnObjects: true }))
    ?? FALLBACK_SERIOUS;
  const humor = asStringArray(i18n.t("chatView.suggestedPrompts.humor", { returnObjects: true }))
    ?? FALLBACK_HUMOR;
  return { serious, humor };
}

function pickWeightedIndex(): "serious" | "humor" {
  // 70% serious, 30% humor
  return Math.random() < 0.7 ? "serious" : "humor";
}

function pickRandomFrom(arr: string[], exclude?: string): string {
  if (arr.length === 0) return "";
  if (arr.length === 1) return arr[0];

  // Try up to 5 times to avoid the excluded value, then fall back.
  for (let i = 0; i < 5; i++) {
    const idx = Math.floor(Math.random() * arr.length);
    const candidate = arr[idx];
    if (candidate !== exclude) return candidate;
  }
  // Fallback: pick any non-excluded
  const filtered = arr.filter((s) => s !== exclude);
  const pool = filtered.length > 0 ? filtered : arr;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Pick a single suggested prompt. 70% chance of a serious one, 30% chance of humor.
 * If `currentText` is provided, the result will (with high probability) be different from it.
 */
export function pickWeightedSeriousOrHumor(currentText?: string): string {
  const { serious, humor } = getLocalizedLists();
  const bucket = pickWeightedIndex();
  const list = bucket === "serious" ? serious : humor;
  return pickRandomFrom(list, currentText);
}
