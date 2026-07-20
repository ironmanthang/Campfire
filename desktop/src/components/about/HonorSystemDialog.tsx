import { useTranslation } from "react-i18next";
import { Heart } from "lucide-react";

interface HonorSystemDialogProps {
  isOpen: boolean;
  onYes: () => void;
  onNo: () => void;
}

export function HonorSystemDialog({ isOpen, onYes, onNo }: HonorSystemDialogProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-bg-surface border border-border-brand rounded-2xl w-full max-w-sm p-6 shadow-2xl flex flex-col items-center text-center space-y-4">
        <div className="p-3 rounded-full bg-accent-brand/10 text-accent-brand">
          <Heart className="h-8 w-8 animate-pulse text-red-500 fill-red-500/20" />
        </div>
        <h3 className="text-lg font-bold text-text-primary">
          {t("aboutModal.honorModalTitle")}
        </h3>
        <p className="text-xs text-text-secondary leading-relaxed">
          {t("aboutModal.honorModalBody")}
        </p>
        <div className="w-full flex flex-col gap-2 pt-2">
          <button
            onClick={onYes}
            className="w-full py-2.5 rounded-xl bg-accent-brand hover:bg-accent-brand/90 text-bg-app font-bold text-sm shadow-md transition-all cursor-pointer"
          >
            {t("aboutModal.honorModalYes")}
          </button>
          <button
            onClick={onNo}
            className="w-full py-2.5 rounded-xl bg-bg-surface border border-border-brand hover:border-accent-brand text-text-primary text-xs font-bold transition-all cursor-pointer"
          >
            {t("aboutModal.honorModalNo")}
          </button>
        </div>
      </div>
    </div>
  );
}
