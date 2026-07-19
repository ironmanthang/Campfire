import { useState, useEffect, useRef } from "react";
import { ViewType } from "../types";

export function useViewNavigation(initialView: ViewType = "journal") {
  const [view, setView] = useState<ViewType>(initialView);
  const [history, setHistory] = useState<ViewType[]>([initialView]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const historyRef = useRef<ViewType[]>([initialView]);
  const historyIndexRef = useRef<number>(0);

  // Sync refs to prevent stale closures in event listeners
  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    historyIndexRef.current = historyIndex;
  }, [historyIndex]);

  const navigateToView = (nextView: ViewType) => {
    if (nextView === view) return;
    setView(nextView);
    setHistory((prev) => {
      const nextHistory = prev.slice(0, historyIndexRef.current + 1);
      nextHistory.push(nextView);
      return nextHistory;
    });
    setHistoryIndex((prev) => prev + 1);
  };

  const forceViewAndResetHistory = (nextView: ViewType) => {
    setView(nextView);
    setHistory([nextView]);
    setHistoryIndex(0);
  };

  // Add global mouseup/mousedown listener for M4/M5 (browser back/forward) buttons
  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 3 || e.button === 4) {
        e.preventDefault();
        if (e.button === 3) {
          // Go back
          const prevIndex = historyIndexRef.current - 1;
          if (prevIndex >= 0) {
            setHistoryIndex(prevIndex);
            setView(historyRef.current[prevIndex]);
          }
        } else if (e.button === 4) {
          // Go forward
          const nextIndex = historyIndexRef.current + 1;
          if (nextIndex < historyRef.current.length) {
            setHistoryIndex(nextIndex);
            setView(historyRef.current[nextIndex]);
          }
        }
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 3 || e.button === 4) {
        e.preventDefault();
      }
    };

    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mousedown", handleMouseDown);
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mousedown", handleMouseDown);
    };
  }, []);

  return {
    view,
    navigateToView,
    forceViewAndResetHistory,
  };
}
