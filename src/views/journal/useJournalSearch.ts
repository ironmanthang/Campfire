import { useState, useEffect, useCallback, RefObject } from "react";

export function useJournalSearch({
  entryContent,
  view,
  textareaRef,
  overlayRef,
}: {
  entryContent: string;
  view: string;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  overlayRef: RefObject<HTMLDivElement | null>;
}) {
  const [showFindBar, setShowFindBar] = useState(false);
  const [findQuery, setFindQuery] = useState("");
  const [findMatches, setFindMatches] = useState<{ start: number; end: number }[]>([]);
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);

  const handleFindNext = useCallback(() => {
    if (findMatches.length === 0) return;
    setActiveMatchIndex((prev) => (prev + 1) % findMatches.length);
  }, [findMatches]);

  const handleFindPrev = useCallback(() => {
    if (findMatches.length === 0) return;
    setActiveMatchIndex((prev) => (prev - 1 + findMatches.length) % findMatches.length);
  }, [findMatches]);

  const handleCloseFind = useCallback(() => {
    setShowFindBar(false);
    setFindQuery("");
    setFindMatches([]);
    setActiveMatchIndex(0);
    textareaRef.current?.focus();
  }, [textareaRef]);

  // Update matches list reactively when query or content changes (without focusing)
  useEffect(() => {
    if (!showFindBar || !findQuery) {
      setFindMatches([]);
      setActiveMatchIndex(0);
      return;
    }

    const text = entryContent.toLowerCase();
    const query = findQuery.toLowerCase();
    const matches: { start: number; end: number }[] = [];
    let idx = text.indexOf(query);
    while (idx !== -1) {
      matches.push({ start: idx, end: idx + query.length });
      idx = text.indexOf(query, idx + query.length);
    }
    setFindMatches(matches);
    setActiveMatchIndex((prev) => {
      if (matches.length === 0) return 0;
      if (prev >= matches.length) return matches.length - 1;
      return prev;
    });
  }, [findQuery, entryContent, showFindBar]);

  // Scroll active match in the overlay into view and sync textarea scroll
  useEffect(() => {
    if (showFindBar && findMatches.length > 0) {
      const t = setTimeout(() => {
        const activeElement = document.getElementById("active-find-match");
        if (activeElement && overlayRef.current && textareaRef.current) {
          const container = overlayRef.current;
          const textarea = textareaRef.current;

          const elementTop = activeElement.offsetTop;
          const elementHeight = activeElement.offsetHeight;
          const containerHeight = container.clientHeight;

          const targetScrollTop = elementTop - (containerHeight / 2) + (elementHeight / 2);

          container.scrollTop = targetScrollTop;
          textarea.scrollTop = targetScrollTop;
        }
      }, 30);
      return () => clearTimeout(t);
    }
  }, [activeMatchIndex, findMatches, showFindBar, overlayRef, textareaRef]);

  // Intercept Ctrl+F / Cmd+F to toggle search bar
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (view !== "journal") return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setShowFindBar((prev) => {
          if (prev) {
            setFindQuery("");
            setFindMatches([]);
            setActiveMatchIndex(0);
            textareaRef.current?.focus();
            return false;
          } else {
            setTimeout(() => {
              const input = document.getElementById("editor-find-input") as HTMLInputElement;
              if (input) {
                input.focus();
                input.select();
              }
            }, 50);
            return true;
          }
        });
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [view, textareaRef]);

  const getHighlightedText = () => {
    const escaped = escapeHtml(entryContent);
    if (!showFindBar || !findQuery) return escaped;

    const queryEscaped = escapeHtml(findQuery).toLowerCase();
    if (!queryEscaped) return escaped;

    const escapedForRegex = queryEscaped.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regex = new RegExp(escapedForRegex, "gi");

    let matchIndex = 0;
    return escaped.replace(regex, (match) => {
      const isCurrent = matchIndex === activeMatchIndex;
      const id = isCurrent ? ' id="active-find-match"' : "";
      matchIndex++;
      return `<mark${id} class="${
        isCurrent
          ? "bg-orange-500/50 dark:bg-orange-500/70 shadow-[0_0_0_1px_rgba(249,115,22,0.4)]"
          : "bg-yellow-500/25 dark:bg-yellow-500/40"
      } text-transparent rounded-sm px-[1.5px] -mx-[1.5px]">${match}</mark>`;
    });
  };

  const highlightedText = getHighlightedText();

  return {
    showFindBar,
    setShowFindBar,
    findQuery,
    setFindQuery,
    findMatches,
    activeMatchIndex,
    handleFindNext,
    handleFindPrev,
    handleCloseFind,
    highlightedText,
  };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
