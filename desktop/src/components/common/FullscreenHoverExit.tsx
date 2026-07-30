import { useEffect, useState, useRef } from "react";
import { X } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";

export function FullscreenHoverExit() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isNearTop, setIsNearTop] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerToast = () => {
    setShowToast(true);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setShowToast(false);
    }, 2500);
  };

  // Sync fullscreen status with Tauri window
  const updateFullscreenStatus = async () => {
    try {
      const appWin = getCurrentWindow();
      const fs = await appWin.isFullscreen();
      setIsFullscreen((prev) => {
        if (!prev && fs) triggerToast();
        return fs;
      });
    } catch {
      const fs = Boolean(document.fullscreenElement);
      setIsFullscreen((prev) => {
        if (!prev && fs) triggerToast();
        return fs;
      });
    }
  };

  const toggleFullscreen = async () => {
    try {
      const appWin = getCurrentWindow();
      const fs = await appWin.isFullscreen();
      const nextFs = !fs;
      await appWin.setFullscreen(nextFs);
      setIsFullscreen(nextFs);
      if (nextFs) triggerToast();
    } catch {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {});
        setIsFullscreen(true);
        triggerToast();
      } else {
        document.exitFullscreen?.().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  const exitFullscreen = async () => {
    try {
      const appWin = getCurrentWindow();
      await appWin.setFullscreen(false);
      setIsFullscreen(false);
    } catch {
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    updateFullscreenStatus();

    let unlisten: (() => void) | undefined;
    try {
      const appWin = getCurrentWindow();
      appWin.onResized(() => {
        updateFullscreenStatus();
      }).then((fn) => {
        unlisten = fn;
      });
    } catch {
      const handleFsChange = () => {
        const fs = Boolean(document.fullscreenElement);
        setIsFullscreen((prev) => {
          if (!prev && fs) triggerToast();
          return fs;
        });
      };
      document.addEventListener("fullscreenchange", handleFsChange);
      return () => document.removeEventListener("fullscreenchange", handleFsChange);
    }

    return () => {
      if (unlisten) unlisten();
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  // Global mousemove listener across whole screen to reveal X button anywhere near top (<= 50px)
  useEffect(() => {
    if (!isFullscreen) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientY <= 50) {
        setIsNearTop(true);
      } else {
        setIsNearTop(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isFullscreen]);

  // Global keydown handler for F11 and Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F11") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === "Escape" && isFullscreen) {
        e.preventDefault();
        exitFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  if (!isFullscreen) return null;

  return (
    <>
      {/* Entrance Toast Notification */}
      <div
        className={`fixed top-5 left-1/2 -translate-x-1/2 z-[99998] pointer-events-none transition-all duration-500 transform ${
          showToast && !isNearTop
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 -translate-y-4 scale-95"
        }`}
      >
        <div className="px-4 py-2 rounded-full bg-neutral-950/90 border border-white/15 text-white/90 text-xs font-semibold shadow-2xl backdrop-blur-md flex items-center gap-1.5">
          Press <kbd className="px-1.5 py-0.5 rounded bg-white/20 text-white font-mono text-[11px]">F11</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-white/20 text-white font-mono text-[11px]">Esc</kbd> to exit fullscreen
        </div>
      </div>

      {/* Broad Top Edge Circular Exit Button */}
      <div className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none flex justify-center items-start">
        <button
          onClick={exitFullscreen}
          className={`mt-2 w-11 h-11 rounded-full bg-neutral-900/90 hover:bg-neutral-800 border border-white/15 text-white shadow-2xl backdrop-blur-md flex items-center justify-center cursor-pointer transition-all duration-300 transform ${
            isNearTop
              ? "opacity-100 translate-y-1 scale-100 pointer-events-auto"
              : "opacity-0 -translate-y-4 scale-90 pointer-events-none"
          }`}
          title="Exit Fullscreen (F11 or Esc)"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>
    </>
  );
}
