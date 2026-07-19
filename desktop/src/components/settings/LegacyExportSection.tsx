import { Download, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAppStore } from "../../store/useAppStore";

export function LegacyExportSection() {
  const { t } = useTranslation();
  const { config, handleExport, handleImport } = useAppStore();

  if (!config.journal_dir) return null;

  return (
    <div className="space-y-6">
      <p className="text-xs text-text-secondary leading-relaxed">
        {t("settingsView.legacyManagementDesc")}
      </p>
      <div className="flex flex-wrap gap-3 pt-2">
        <button
          onClick={() => handleExport("json")}
          className="px-3.5 py-2 border border-border-brand rounded-lg text-xs font-semibold hover:bg-bg-app transition-colors flex items-center gap-2 cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" />
          {t("settingsView.exportJsonButton")}
        </button>
        <button
          onClick={() => handleExport("text")}
          className="px-3.5 py-2 border border-border-brand rounded-lg text-xs font-semibold hover:bg-bg-app transition-colors flex items-center gap-2 cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" />
          {t("settingsView.exportTextButton")}
        </button>
        <button
          onClick={() => handleImport()}
          className="px-3.5 py-2 border border-border-brand rounded-lg text-xs font-semibold hover:bg-bg-app transition-colors flex items-center gap-2 cursor-pointer"
        >
          <Upload className="h-3.5 w-3.5" />
          {t("settingsView.importButton")}
        </button>
      </div>
    </div>
  );
}
