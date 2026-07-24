import { Sparkles, X, Check, Copy, Terminal, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useRef, useState } from "react";
import { useResizer } from "../../hooks/useResizer";
import { openUrl } from "@tauri-apps/plugin-opener";

interface SearchHelpModalProps {
  onClose: () => void;
  embeddingModel: string;
}

export function SearchHelpModal({ onClose, embeddingModel }: SearchHelpModalProps) {
  const { t } = useTranslation();
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const pointerStartedInsideRef = useRef(false);
  const pointerMovedRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  const handleCopy = (command: string) => {
    navigator.clipboard.writeText(command);
    setCopiedCommand(command);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  const [modalWidth, startResize, resetModalWidth] = useResizer({
    key: "search-help-modal-width",
    defaultVal: 672,
    mode: "px",
    min: 560,
    max: 1400,
    multiplier: 1,
  });

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        style={{ width: modalWidth }}
        className="relative w-full max-w-[95vw] bg-bg-surface border border-border-brand rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-border-brand/60 flex items-center justify-between bg-bg-surface">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-accent-brand/10 text-accent-brand">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-text-primary text-lg">{t("searchView.helpModal.title")}</h3>
              <p className="text-xs text-text-secondary">
                {embeddingModel
                  ? t("searchView.helpModal.subtitle", { model: embeddingModel })
                  : t("searchView.helpModal.subtitleFallback", { defaultValue: "Optimizing your writing for semantic vector search" })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-app/80 transition-colors cursor-pointer"
            title={t("searchView.helpModal.closeTooltip")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-text-primary">
          <div className="bg-accent-brand/5 border border-accent-brand/20 p-4 rounded-xl space-y-1">
            <span className="text-xs font-bold text-accent-brand uppercase tracking-wider">{t("searchView.helpModal.howSearchWorksTitle")}</span>
            <p className="text-xs text-text-secondary leading-relaxed">
              {t("searchView.helpModal.howSearchWorksDesc", { model: embeddingModel || "embedding" })}
            </p>
          </div>

          {/* Pull Embedding Models Guide */}
          <div className="bg-bg-app/50 border border-border-brand/60 p-4 rounded-xl space-y-3">
            <div className="flex items-center gap-2 font-bold text-xs text-text-primary">
              <Terminal className="h-4 w-4 text-accent-brand" />
              <span>{t("searchView.helpModal.pullGuideTitle", { defaultValue: "How to Download Embedding Models" })}</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              {t("searchView.helpModal.pullGuideDesc", {
                defaultValue: "Semantic search requires an embedding model in Ollama. Open your Terminal (CMD or Terminal) and run a command to download one, or browse the Ollama Library:"
              })}
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
              <div className="flex-1 flex items-center justify-between gap-2 rounded-lg border border-border-brand/40 bg-bg-surface px-3 py-2">
                <code className="font-mono text-xs text-accent-brand select-all">
                  ollama pull qwen3-embedding:0.6b
                </code>
                <button
                  type="button"
                  onClick={() => handleCopy("ollama pull qwen3-embedding:0.6b")}
                  className="hover:text-accent-brand transition-colors p-1 text-text-secondary cursor-pointer flex items-center gap-1 shrink-0"
                  title={t("searchView.helpModal.copyCommand", { defaultValue: "Copy command" })}
                >
                  {copiedCommand === "ollama pull qwen3-embedding:0.6b" ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={() => openUrl("https://ollama.com/search?c=embedding")}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-accent-brand text-bg-app rounded-lg font-semibold text-xs hover:opacity-90 transition-opacity shrink-0 cursor-pointer"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>{t("settingsView.browseOllamaLibrary")}</span>
              </button>
            </div>
          </div>

          {/* Guidelines List */}
          <div className="space-y-4">
            <h4 className="font-bold text-text-primary border-b border-border-brand/40 pb-1.5">{t("searchView.helpModal.bestPracticesTitle")}</h4>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="bg-bg-app/40 p-4 rounded-xl border border-border-brand/40 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-xs text-text-primary">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-brand/10 text-xs text-accent-brand">1</span>
                  {t("searchView.helpModal.rule1Title")}
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {t("searchView.helpModal.rule1Desc")}
                </p>
              </div>

              <div className="bg-bg-app/40 p-4 rounded-xl border border-border-brand/40 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-xs text-text-primary">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-brand/10 text-xs text-accent-brand">2</span>
                  {t("searchView.helpModal.rule2Title")}
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {t("searchView.helpModal.rule2Desc")}
                </p>
              </div>

              <div className="bg-bg-app/40 p-4 rounded-xl border border-border-brand/40 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-xs text-text-primary">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-brand/10 text-xs text-accent-brand">3</span>
                  {t("searchView.helpModal.rule3Title")}
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {t("searchView.helpModal.rule3Desc")}
                </p>
              </div>

              <div className="bg-bg-app/40 p-4 rounded-xl border border-border-brand/40 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-xs text-text-primary">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-brand/10 text-xs text-accent-brand">4</span>
                  {t("searchView.helpModal.rule4Title")}
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {t("searchView.helpModal.rule4Desc")}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Examples */}
          <div className="space-y-3">
            <h4 className="font-bold text-text-primary border-b border-border-brand/40 pb-1.5">{t("searchView.helpModal.comparisonTitle")}</h4>
            <div className="space-y-2.5">
              <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/5 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-red-500 font-semibold">
                  <span>⚠️ {t("searchView.helpModal.comparisonLessEffective")}</span>
                </div>
                <p className="text-xs text-text-secondary font-mono leading-relaxed pl-5 whitespace-pre-line">
                  {t("searchView.helpModal.comparisonLessEffectiveDesc")}
                </p>
              </div>

              <div className="p-3 rounded-lg border border-green-500/20 bg-green-500/5 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-green-500 font-semibold">
                  <span>✅ {t("searchView.helpModal.comparisonMoreEffective")}</span>
                </div>
                <p className="text-xs text-text-secondary font-mono leading-relaxed pl-5">
                  {t("searchView.helpModal.comparisonMoreEffectiveDesc")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-bg-app border-t border-border-brand/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-accent-brand text-bg-app rounded-lg text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
          >
            {t("searchView.helpModal.gotItButton")}
          </button>
        </div>

        {/* Right-edge resize handle (double-click resets to default) */}
        <div
          onMouseDown={startResize}
          onDoubleClick={resetModalWidth}
          className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-accent-brand/5 z-30 group flex items-center justify-center select-none"
          title="Drag to resize · double-click to reset"
        >
          <div className="w-[2px] h-12 bg-border-brand/20 group-hover:bg-accent-brand/80 rounded transition-colors duration-150" />
        </div>
      </div>
    </div>
  );
}
