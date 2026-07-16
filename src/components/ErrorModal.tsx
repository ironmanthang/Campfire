import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ErrorModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
}

export function ErrorModal({ isOpen, message, onClose }: ErrorModalProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in"
    >
      <div className="bg-bg-surface border border-border-brand rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-scale-in">
        <div className="flex items-center gap-3 text-red-500">
          <AlertCircle className="h-6 w-6 shrink-0 font-bold" />
          <h3 className="text-lg font-bold text-text-primary">
            {t("notification.errorTitle")}
          </h3>
        </div>

        <div className="text-sm text-text-secondary leading-relaxed break-words max-h-[60vh] overflow-y-auto pr-1">
          {message}
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-accent-brand text-bg-app hover:bg-accent-brand-hover text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            {t("notification.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
