import { ReactNode } from "react";

interface SidebarNavItemProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title?: string;
}

export function SidebarNavItem({
  icon,
  label,
  onClick,
  active = false,
  disabled = false,
  title,
}: SidebarNavItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        active
          ? "bg-accent-brand text-bg-app"
          : "text-text-secondary hover:text-text-primary hover:bg-bg-app/40"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {icon}
      {label}
    </button>
  );
}
