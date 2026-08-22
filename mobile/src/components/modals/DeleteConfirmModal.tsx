import { AlertCircle } from 'lucide-react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

export interface DeleteConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmModal({
  title,
  message,
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

  const modalCancel = cancelLabel ?? t('deleteConfirmModal.cancelButton', 'Cancel');
  const modalConfirm = confirmLabel ?? t('deleteConfirmModal.deleteButton', 'Delete Permanent');

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
      <div ref={modalRef} className="bg-bg-surface border border-border-brand rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
        <div className="flex items-center gap-3 text-red-500">
          <AlertCircle className="h-6 w-6 shrink-0" />
          <h3 className="text-lg font-bold text-text-primary">{title}</h3>
        </div>

        <p className="text-sm text-text-secondary leading-relaxed">
          {message}
        </p>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-border-brand hover:border-accent-brand text-xs font-semibold text-text-primary active:bg-bg-surface/50 transition-all cursor-pointer"
          >
            {modalCancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-600 active:bg-red-700 text-xs font-semibold text-white shadow-sm transition-all cursor-pointer"
          >
            {modalConfirm}
          </button>
        </div>
      </div>
    </div>
  );
}
