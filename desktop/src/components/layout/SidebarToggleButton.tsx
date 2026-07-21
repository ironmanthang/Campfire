import { Menu } from "lucide-react";
import { useTranslation } from "react-i18next";

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

  if (!sidebarCollapsed) return null;

  return (
    <button
      onClick={onToggleSidebar}
      className={`p-2 border border-border-brand rounded-lg hover:bg-bg-surface transition-colors flex items-center justify-center bg-bg-surface text-text-primary shrink-0 cursor-pointer ${className}`}
      title={t("sidebar.expandSidebar")}
    >
      <Menu className="h-4 w-4" />
    </button>
  );
}
