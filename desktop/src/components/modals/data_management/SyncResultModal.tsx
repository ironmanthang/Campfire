import { X, CheckCircle, BookOpen } from "lucide-react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { formatToDDMMYY } from "../../../lib/dateUtils";
import { useAppStore } from "../../../store/useAppStore";

interface SyncResultModalProps {
  updatedDates: string[];
  onClose: () => void;
}

export function SyncResultModal({ updatedDates, onClose }: SyncResultModalProps) {
  const { t } = useTranslation();
  const { setCurrentDate, navigateToView } = useAppStore();
  const modalRef = useRef<HTMLDivElement | null>(null);
  const pointerStartedInsideRef = useRef(false);
  const pointerMovedRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in"
    >
      <div ref={modalRef} className="bg-bg-surface border border-border-brand rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-accent-brand">
            <CheckCircle className="h-6 w-6 shrink-0" />
            <h3 className="text-lg font-bold text-text-primary">{t("syncResultModal.title")}</h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg hover:bg-bg-app transition-colors text-text-secondary cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-text-secondary leading-relaxed">
            {t("syncResultModal.subtitle")}
          </p>
          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
            {updatedDates.map((date) => {
              const isScratchpad = date === 'scratchpad';
              return (
                <div 
                  key={date} 
                  className="flex items-center justify-between text-xs font-semibold pl-3 pr-2 py-1.5 bg-bg-app border border-border-brand/40 rounded-lg text-text-primary"
                >
                  <span>{isScratchpad ? t("scratchpad.title", "Scratchpad & Notes") : `${formatToDDMMYY(date)} (${date})`}</span>
                  <button
                    onClick={() => {
                      if (isScratchpad) {
                        navigateToView("scratchpad");
                      } else {
                        setCurrentDate(date);
                        navigateToView("journal");
                      }
                      onClose();
                    }}
                    className="p-1 rounded-md hover:bg-bg-surface border border-transparent hover:border-border-brand/40 text-text-secondary hover:text-accent-brand transition-all duration-150 cursor-pointer shrink-0"
                    title={isScratchpad ? t("scratchpad.title", "Scratchpad & Notes") : t("syncResultModal.openEntryTooltip")}
                  >
                    <BookOpen className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-accent-brand hover:bg-accent-brand-hover text-xs font-semibold text-bg-app shadow-sm transition-all cursor-pointer"
          >
            {t("syncResultModal.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
