import { useEffect, RefObject } from "react";

export function useAutoFocus(
  ref: RefObject<HTMLInputElement | HTMLTextAreaElement | null>,
  visible: boolean = true,
  dependencies: any[] = []
) {
  // Focus on mount and when dependencies change
  useEffect(() => {
    if (visible) {
      ref.current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, ...dependencies]);

  // Keep focus on "do-nothing" clicks if no text is selected
  useEffect(() => {
    if (!visible) return;

    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Do not refocus if clicking on interactive elements
      if (target.closest("input, select, textarea, button, [role='button']")) return;

      // Do not refocus if user is selecting text
      const selection = window.getSelection()?.toString();
      if (selection && selection.trim().length > 0) return;

      ref.current?.focus();
    };

    document.addEventListener("click", handleGlobalClick);
    return () => document.removeEventListener("click", handleGlobalClick);
  }, [visible, ref]);
}
