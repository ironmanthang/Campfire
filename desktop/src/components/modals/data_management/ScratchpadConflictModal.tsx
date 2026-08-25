import { AlertTriangle, HardDrive, Cloud, Layers, X } from "lucide-react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

interface ScratchpadConflictModalProps {
  onResolve: (choice: "local" | "remote" | "both") => void;
}

export function ScratchpadConflictModal({ onResolve }: ScratchpadConflictModalProps) {
  const { t } = useTranslation();
  const modalRef = useRef<HTMLDivElement | null>(null);
  const pointerStartedInsideRef = useRef(false);
  const pointerMovedRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  const handleClose = () => onResolve("both");

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
        handleClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in"
    >
      <div ref={modalRef} className="bg-bg-surface border border-border-brand rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-amber-500">
            <AlertTriangle className="h-6 w-6 shrink-0" />
            <h3 className="text-lg font-bold text-text-primary">{t("scratchpadConflict.title", "Scratchpad Sync Conflict")}</h3>
          </div>
          <button 
            onClick={handleClose} 
            className="p-1.5 rounded-lg hover:bg-bg-app transition-colors text-text-secondary cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-text-secondary leading-relaxed">
          {t(
            "scratchpadConflict.description",
            "Your scratchpad was modified on both this computer and Google Drive at the exact same time. Choose which version you want to keep:"
          )}
        </p>

        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={() => onResolve("local")}
            className="w-full flex items-center justify-between p-3 bg-bg-app hover:bg-bg-surface border border-border-brand/60 hover:border-accent-brand rounded-xl text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <HardDrive size={18} className="text-accent-brand shrink-0" />
              <div>
                <div className="text-xs font-bold text-text-primary">
                  {t("scratchpadConflict.keepLocal", "Keep Local Version")}
                </div>
                <div className="text-[11px] text-text-secondary">
                  {t("scratchpadConflict.keepLocalDesc", "Overwrite cloud with this computer")}
                </div>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onResolve("remote")}
            className="w-full flex items-center justify-between p-3 bg-bg-app hover:bg-bg-surface border border-border-brand/60 hover:border-accent-brand rounded-xl text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <Cloud size={18} className="text-accent-brand shrink-0" />
              <div>
                <div className="text-xs font-bold text-text-primary">
                  {t("scratchpadConflict.keepRemote", "Keep Cloud Version")}
                </div>
                <div className="text-[11px] text-text-secondary">
                  {t("scratchpadConflict.keepRemoteDesc", "Overwrite this computer with cloud")}
                </div>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onResolve("both")}
            className="w-full flex items-center justify-between p-3 bg-accent-brand/10 hover:bg-accent-brand/20 border border-accent-brand/40 rounded-xl text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <Layers size={18} className="text-accent-brand shrink-0" />
              <div>
                <div className="text-xs font-bold text-text-primary">
                  {t("scratchpadConflict.keepBoth", "Keep Both (Recommended)")}
                </div>
                <div className="text-[11px] text-text-secondary">
                  {t("scratchpadConflict.keepBothDesc", "Combine notes from both versions")}
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
