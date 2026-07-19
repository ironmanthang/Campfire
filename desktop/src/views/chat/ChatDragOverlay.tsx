import { Paperclip } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useChatContext } from "./ChatContext";

export function ChatDragOverlay() {
  const { t } = useTranslation();
  const { isDragging, handleDragLeave, handleDrop } = useChatContext();

  if (!isDragging) return null;

  return (
    <div
      className="absolute inset-0 z-50 bg-bg-app/75 backdrop-blur-md flex flex-col items-center justify-center border-4 border-dashed border-accent-brand m-4 rounded-2xl animate-fade-in text-center p-6 select-none"
      onDragLeave={handleDragLeave}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <div className="p-4 rounded-2xl bg-accent-brand/10 text-accent-brand mb-4 scale-110">
        <Paperclip className="h-10 w-10 animate-bounce" />
      </div>
      <h3 className="text-lg font-bold text-text-primary mb-1">
        {t("chatView.dragOverText")}
      </h3>
      <p className="text-xs text-text-secondary max-w-sm leading-relaxed">
        Supports images and any text/source code files. Binary formats are excluded.
      </p>
    </div>
  );
}
