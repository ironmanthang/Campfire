import { Menu } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAppStore } from "../../store/useAppStore";

interface SidebarToggleButtonProps {
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  className?: string;
}

export function SidebarToggleButton({
  sidebarCollapsed,
  onToggleSidebar,
  className = ""
}: SidebarToggleButtonProps) {
  const { t } = useTranslation();
  const { syncProgress } = useAppStore();
  const isSyncing = syncProgress.status === "syncing" || syncProgress.status === "connecting";

  if (!sidebarCollapsed) return null;

  return (
    <button
      onClick={onToggleSidebar}
      className={`relative p-2 border border-border-brand rounded-lg hover:bg-bg-surface transition-colors flex items-center justify-center bg-bg-surface text-text-primary shrink-0 cursor-pointer ${className}`}
      title={isSyncing ? `${t("sidebar.expandSidebar")} (${t("journalEditor.statusSyncing")}...)` : t("sidebar.expandSidebar")}
    >
      <Menu className="h-4 w-4" />
      {isSyncing && (
        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-brand opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-brand"></span>
        </span>
      )}
    </button>
  );
}
