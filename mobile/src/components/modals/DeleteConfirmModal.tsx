import { Trash2 } from 'lucide-react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

export interface DeleteConfirmModalProps {
  title: string;
  message: string;
  itemPreview?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmModal({
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
      <div
        ref={modalRef}
        className="bg-bg-surface border border-border-brand rounded-2xl p-6 max-w-sm w-full max-h-[85vh] flex flex-col shadow-2xl space-y-4"
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 text-text-primary shrink-0">
          <Trash2 className="h-5 w-5 shrink-0 text-accent-brand" />
          <h3 className="text-base font-bold text-text-primary">
            {title}
          </h3>
        </div>

        {/* Warning message / instruction */}
        {message && (
          <p className="text-xs text-text-secondary leading-relaxed shrink-0">
            {message}
          </p>
        )}

        {/* Framed card content area */}
        {itemPreview && (
          <div className="flex-1 overflow-y-auto pr-1 border border-border-brand/40 bg-bg-app/40 rounded-xl p-2.5 min-h-0 max-h-56">
            <div className="p-2 bg-bg-surface border border-border-brand/40 rounded-lg">
              <p className="text-xs text-text-primary leading-relaxed break-words font-medium">
                {itemPreview}
              </p>
            </div>
          </div>
        )}

        {/* Actions Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-2 shrink-0 border-t border-border-brand/30">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-border-brand hover:border-accent-brand text-xs font-semibold text-text-primary active:bg-bg-surface/50 transition-all cursor-pointer"
          >
            {modalCancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-red-600 active:bg-red-700 text-xs font-semibold text-white shadow-sm transition-all cursor-pointer"
          >
            {modalConfirm}
          </button>
        </div>
      </div>
    </div>
  );
}
