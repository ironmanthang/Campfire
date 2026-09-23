import { Trash2 } from "lucide-react";
import { useRef } from "react";
import { formatToDDMMYY } from "../../../lib/dateUtils";
import { useTranslation } from "react-i18next";

export interface DeleteConfirmModalProps {
  dates?: string[];
  title?: string;
  message?: React.ReactNode;
  itemPreview?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmModal({
  dates,
  title,
  message,
  itemPreview,
  confirmLabel,
  cancelLabel,
  onCancel,
  onConfirm,
}: DeleteConfirmModalProps) {
  const { t } = useTranslation();
  const modalRef = useRef<HTMLDivElement | null>(null);
  const pointerStartedInsideRef = useRef(false);
  const pointerMovedRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  const modalTitle = title || t("deleteConfirmModal.title");
  const modalCancel = cancelLabel || t("deleteConfirmModal.cancelButton");
  const modalConfirm = confirmLabel || t("deleteConfirmModal.deleteButton");

  let modalMessage: React.ReactNode = message;
  if (!modalMessage && dates) {
    modalMessage = t("deleteConfirmModal.confirmMessage", {
      count: dates.length,
      dates: dates.map(formatToDDMMYY).join(", "),
    });
  }

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
        onCancel();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in"
    >
      <div
        ref={modalRef}
        className="bg-bg-surface border border-border-brand rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 text-text-primary shrink-0">
          <Trash2 className="h-5 w-5 shrink-0 text-accent-brand" />
          <h3 className="text-base font-bold text-text-primary">
            {modalTitle}
          </h3>
        </div>

        {/* Warning message / instruction */}
        {modalMessage && (
          <p className="text-xs text-text-secondary leading-relaxed shrink-0">
            {modalMessage}
          </p>
        )}

        {/* Framed card content area */}
        {itemPreview ? (
          <div className="flex-1 overflow-y-auto pr-1 border border-border-brand/40 bg-bg-app/40 rounded-xl p-2.5 min-h-0 max-h-56">
            <div className="p-2 bg-bg-surface border border-border-brand/40 rounded-lg">
              <p className="text-xs text-text-primary leading-relaxed break-words font-medium">
                {itemPreview}
              </p>
            </div>
          </div>
        ) : dates && dates.length > 0 ? (
          <div className="flex-1 overflow-y-auto pr-1 border border-border-brand/40 bg-bg-app/40 rounded-xl p-2.5 min-h-0 max-h-48">
            <div className="flex flex-wrap gap-1.5">
              {dates.map((d) => (
                <span
                  key={d}
                  className="px-2 py-1 text-xs font-semibold rounded-lg bg-bg-surface border border-border-brand/40 text-text-primary"
                >
                  {formatToDDMMYY(d)}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {/* Actions Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-2 shrink-0 border-t border-border-brand/30">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-border-brand hover:border-accent-brand text-xs font-semibold text-text-primary hover:bg-bg-surface/50 transition-all cursor-pointer"
          >
            {modalCancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-xs font-semibold text-white shadow-sm transition-all cursor-pointer"
          >
            {modalConfirm}
          </button>
        </div>
      </div>
    </div>
  );
}
