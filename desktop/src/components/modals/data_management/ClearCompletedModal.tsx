import { useState, useRef, useEffect } from "react";
import { CheckSquare, Square, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { type CompletedItemSummary } from "@campfire/core";

export interface ClearCompletedModalProps {
  completedItems: CompletedItemSummary[];
  onCancel: () => void;
  onConfirm: (idsToDelete: Set<string>, idsToUncheck: Set<string>) => void;
}

export function ClearCompletedModal({
  completedItems,
  onCancel,
  onConfirm,
}: ClearCompletedModalProps) {
  const { t } = useTranslation();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    return new Set(completedItems.map((item) => item.id));
  });

  const modalRef = useRef<HTMLDivElement | null>(null);
  const pointerStartedInsideRef = useRef(false);
  const pointerMovedRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  const toggleItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const isAllSelected = completedItems.length > 0 && selectedIds.size === completedItems.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(completedItems.map((item) => item.id)));
    }
  };

  const handleConfirm = () => {
    const idsToDelete = new Set(selectedIds);
    const idsToUncheck = new Set(
      completedItems.filter((item) => !selectedIds.has(item.id)).map((item) => item.id)
    );
    onConfirm(idsToDelete, idsToUncheck);
  };


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
        if (pointerStartedInsideRef.current || pointerMovedRef.current) {
          pointerStartedInsideRef.current = false;
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
        <div className="flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 text-text-primary">
            <Trash2 className="h-5 w-5 shrink-0 text-accent-brand" />
            <h3 className="text-base font-bold text-text-primary">
              {t("scratchpad.clearCompletedConfirmTitle", "Clear Completed Tasks")}
            </h3>
          </div>

          {completedItems.length > 1 && (
            <button
              type="button"
              onClick={toggleSelectAll}
              className="text-xs font-semibold text-accent-brand hover:underline cursor-pointer select-none"
            >
              {isAllSelected
                ? t("scratchpad.deselectAll", "Deselect all")
                : t("scratchpad.selectAll", "Select all")}
            </button>
          )}
        </div>

        {/* Subtitle / Instructions */}
        <p className="text-xs text-text-secondary leading-relaxed shrink-0">
          {t(
            "scratchpad.clearCompletedReviewSubtitle",
            "Review completed tasks below. Checked tasks will be permanently removed; unchecked tasks will be rescued back to active todo items."
          )}
        </p>

        {/* Interactive Checklist Scroll Area */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 border border-border-brand/40 bg-bg-app/40 rounded-xl p-2.5 max-h-60">
          {completedItems.map((item) => {
            const isSelected = selectedIds.has(item.id);
            return (
              <div
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-colors select-none ${
                  isSelected
                    ? "bg-bg-surface border border-border-brand hover:border-accent-brand/50"
                    : "bg-bg-surface/50 border border-border-brand/30 hover:border-border-brand"
                }`}
              >
                <div className="mt-0.5 shrink-0 text-accent-brand">
                  {isSelected ? (
                    <CheckSquare className="h-4.5 w-4.5 opacity-90" />
                  ) : (
                    <Square className="h-4.5 w-4.5 text-text-secondary" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {item.parentPath && (
                    <p className="text-[11px] text-text-secondary/60 truncate mb-0.5 font-medium">
                      {item.parentPath}
                    </p>
                  )}
                  <p
                    className={`text-xs break-words leading-relaxed ${
                      isSelected ? "line-through text-text-secondary/70" : "text-text-primary font-medium"
                    }`}
                  >
                    {item.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>


        {/* Actions Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-2 shrink-0 border-t border-border-brand/30">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-border-brand hover:border-accent-brand text-xs font-semibold text-text-primary hover:bg-bg-surface/50 transition-all cursor-pointer"
          >
            {t("common.cancel", "Cancel")}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none ${
              selectedIds.size > 0
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-accent-brand hover:bg-accent-brand/90 text-bg-surface"
            }`}
          >
            {selectedIds.size > 0
              ? t("scratchpad.clearCountTasks", {
                  count: selectedIds.size,
                  defaultValue: "Clear ({{count}}) Completed",
                })
              : t("scratchpad.rescueAll", "Keep All & Close")}
          </button>
        </div>
      </div>
    </div>
  );
}
