import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { useResizer } from "../../../hooks/useResizer";
import { AboutAppTab } from "../../about/AboutAppTab";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const { t } = useTranslation();

  const [modalWidth, startResize, resetModalWidth] = useResizer({
    key: "about-modal-width",
    defaultVal: 512,
    mode: "px",
    min: 480,
    max: 1400,
    multiplier: 1,
  });

  const modalRef = useRef<HTMLDivElement | null>(null);
  const pointerStartedInsideRef = useRef(false);
  const pointerMovedRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onPointerDown={(e) => {
        const target = e.target as Node;
        pointerStartedInsideRef.current = modalRef.current?.contains(target) ?? false;
        pointerMovedRef.current = false;
        activePointerIdRef.current = e.pointerId;
        startPosRef.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerMove={(e) => {
        if (activePointerIdRef.current !== e.pointerId) return;
        const start = startPosRef.current;
        if (!start) return;
        if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 6) pointerMovedRef.current = true;
      }}
      onPointerUp={(e) => {
        if (activePointerIdRef.current !== e.pointerId) return;
        if (pointerStartedInsideRef.current) {
          pointerStartedInsideRef.current = false;
          activePointerIdRef.current = null;
          startPosRef.current = null;
          return;
        }
        if (pointerMovedRef.current) {
          pointerMovedRef.current = false;
          activePointerIdRef.current = null;
          startPosRef.current = null;
          return;
        }
        activePointerIdRef.current = null;
        startPosRef.current = null;
        onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        style={{ width: modalWidth }}
        className="relative bg-bg-surface border border-border-brand rounded-2xl max-w-[95vw] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex border-b border-border-brand/30 bg-bg-app/10 items-center justify-between relative pr-12">
          <div className="flex flex-1 items-center px-4 py-3">
            <h2 className="text-sm font-semibold text-accent-brand">
              {t("aboutModal.tabAboutApp")}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="absolute right-3.5 p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-app/40 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body / Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin select-text">
          <AboutAppTab />
        </div>

        {/* Right-edge resize handle (double-click resets to default) */}
        <div
          onMouseDown={startResize}
          onDoubleClick={resetModalWidth}
          className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-accent-brand/5 z-30 group flex items-center justify-center select-none"
          title={t("common.dragToResize")}
        >
          <div className="w-[2px] h-12 bg-border-brand/20 group-hover:bg-accent-brand/80 rounded transition-colors duration-150" />
        </div>
      </div>
    </div>
  );
}

