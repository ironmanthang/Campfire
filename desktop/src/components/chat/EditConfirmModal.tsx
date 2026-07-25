import { AlertTriangle } from "lucide-react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

interface EditConfirmModalProps {
  onCancel: () => void;
  onConfirm: () => void;
}

export function EditConfirmModal({ onCancel, onConfirm }: EditConfirmModalProps) {
  const { t } = useTranslation();
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
        onCancel();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in"
    >
      <div ref={modalRef} className="bg-bg-surface border border-border-brand rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
        <div className="flex items-center gap-3 text-yellow-500">
          <AlertTriangle className="h-6 w-6 shrink-0" />
          <h3 className="text-lg font-bold text-text-primary">{t("editConfirmModal.title")}</h3>
        </div>

        <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
          {t("editConfirmModal.message")}
        </p>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-border-brand hover:border-accent-brand text-xs font-semibold text-text-primary hover:bg-bg-surface/50 transition-all cursor-pointer"
          >
            {t("editConfirmModal.cancel")}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-accent-brand hover:bg-accent-brand-hover text-xs font-semibold text-bg-app shadow-sm transition-all cursor-pointer"
          >
            {t("editConfirmModal.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
