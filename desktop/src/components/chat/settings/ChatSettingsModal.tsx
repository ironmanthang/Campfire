import { useEffect, useRef } from "react";
import { Settings, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ChatInterfaceSection } from "./ChatInterfaceSection";
import { ChatToolsSection } from "./ChatToolsSection";
import { ChatSystemSection } from "./ChatSystemSection";

interface ChatSettingsModalProps {
  onClose: () => void;
}

export function ChatSettingsModal({ onClose }: ChatSettingsModalProps) {
  const { t } = useTranslation();
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl bg-bg-surface border border-border-brand rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-up"
      >
        {/* Header */}
        <div className="p-5 border-b border-border-brand/60 flex items-center justify-between bg-bg-surface">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-accent-brand/10 text-accent-brand">
              <Settings className="h-5 w-5 animate-spin-slow" />
            </div>
            <div>
              <h3 className="font-bold text-text-primary text-lg">
                {t("chatView.settingsTitle", "Chat Settings & Customization")}
              </h3>
              <p className="text-xs text-text-secondary">
                Configure interface behavior, visual thinking details, and active tools.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-app/80 transition-colors cursor-pointer"
            title={t("chatView.helpModal.closeTooltip", "Close settings")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-text-primary scrollbar-thin">
          <ChatInterfaceSection />
          <ChatToolsSection />
          <ChatSystemSection />
        </div>
      </div>
    </div>
  );
}
