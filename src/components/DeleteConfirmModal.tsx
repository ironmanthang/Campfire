import { AlertCircle } from "lucide-react";
import { formatToDDMMYY } from "../lib/dateUtils";
import { useTranslation } from "react-i18next";

interface DeleteConfirmModalProps {
  dates: string[];
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmModal({ dates, onCancel, onConfirm }: DeleteConfirmModalProps) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-bg-surface border border-border-brand rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
        <div className="flex items-center gap-3 text-red-500">
          <AlertCircle className="h-6 w-6 shrink-0 font-bold" />
          <h3 className="text-lg font-bold text-text-primary">{t("deleteConfirmModal.title")}</h3>
        </div>

        <p className="text-sm text-text-secondary leading-relaxed">
          {t("deleteConfirmModal.confirmMessage", { count: dates.length, dates: dates.map(formatToDDMMYY).join(", ") })}
        </p>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-border-brand hover:border-accent-brand text-xs font-semibold text-text-primary hover:bg-bg-surface/50 transition-all cursor-pointer"
          >
            {t("deleteConfirmModal.cancelButton")}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-semibold text-white shadow-sm transition-all cursor-pointer"
          >
            {t("deleteConfirmModal.deleteButton")}
          </button>
        </div>
      </div>
    </div>
  );
}
