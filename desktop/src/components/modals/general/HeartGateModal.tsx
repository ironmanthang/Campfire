import { Heart } from "lucide-react";
import { useTranslation } from "react-i18next";

interface HeartGateModalProps {
  isOpen: boolean;
  onConfirm: () => void; // "Yes, enable & don't ask again"
  onCancel: () => void; // "Wait, let me donate first"
}

export function HeartGateModal({ isOpen, onConfirm, onCancel }: HeartGateModalProps) {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in"
      onClick={(e) => {
        // Click on backdrop cancels
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="bg-bg-surface border border-border-brand rounded-2xl w-full max-w-sm p-6 shadow-2xl flex flex-col items-center text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
          <Heart className="h-6 w-6 text-red-500" fill="currentColor" />
        </div>
        <h3 className="text-md font-bold text-text-primary">
          {t("heart.gateTitle", { defaultValue: "A small note before unlocking" })}
        </h3>
        <p className="text-xs text-text-secondary leading-relaxed">
          {t("heart.gateBody", {
            defaultValue:
              "This feature is meant for users who supported the app. If you've already donated - or plan to - feel free to turn it on!",
          })}
        </p>
        <div className="w-full flex flex-col gap-2 pt-2">
          <button
            onClick={onConfirm}
            className="w-full py-2.5 rounded-xl bg-accent-brand hover:bg-accent-brand/90 text-bg-app font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            {t("heart.gateConfirm", { defaultValue: "Yes, enable & don't ask again" })}
          </button>
          <button
            onClick={onCancel}
            className="w-full py-2.5 rounded-xl bg-bg-surface border border-border-brand hover:border-accent-brand text-text-primary text-xs font-bold transition-all cursor-pointer"
          >
            {t("heart.gateCancel", { defaultValue: "Wait, let me donate first" })}
          </button>
        </div>
      </div>
    </div>
  );
}
