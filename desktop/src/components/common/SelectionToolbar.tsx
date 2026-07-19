import { SidebarToggleButton } from "../SidebarToggleButton";

interface SelectionToolbarProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  selectedCountLabel: string;
  isAllSelected: boolean;
  selectAllLabel: string;
  deselectAllLabel: string;
  onSelectAllToggle: () => void;
  onExport: (format: "json" | "text") => void;
  isExportDisabled: boolean;
  onDelete: () => void;
  isDeleteDisabled: boolean;
  onCancel: () => void;
  exportJsonLabel: string;
  exportTextLabel: string;
  deleteSelectedLabel: string;
  cancelLabel: string;
}

export function SelectionToolbar({
  sidebarCollapsed,
  onToggleSidebar,
  selectedCountLabel,
  isAllSelected,
  selectAllLabel,
  deselectAllLabel,
  onSelectAllToggle,
  onExport,
  isExportDisabled,
  onDelete,
  isDeleteDisabled,
  onCancel,
  exportJsonLabel,
  exportTextLabel,
  deleteSelectedLabel,
  cancelLabel,
}: SelectionToolbarProps) {
  return (
    <div className="flex justify-between items-center flex-wrap gap-4 w-full">
      <div className="flex items-center gap-3">
        <SidebarToggleButton
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={onToggleSidebar}
          className="p-1.5"
        />
        <span className="text-sm font-medium text-text-primary font-mono bg-accent-brand/10 border border-accent-brand/20 px-2.5 py-1 rounded">
          {selectedCountLabel}
        </span>
        <button
          onClick={onSelectAllToggle}
          className="text-xs text-accent-brand hover:underline font-semibold px-2 py-1 cursor-pointer"
        >
          {isAllSelected ? deselectAllLabel : selectAllLabel}
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onExport("json")}
          disabled={isExportDisabled}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-brand bg-bg-surface hover:border-accent-brand disabled:opacity-30 disabled:pointer-events-none text-xs font-semibold text-text-primary transition-all cursor-pointer shadow-sm"
        >
          {exportJsonLabel}
        </button>
        <button
          onClick={() => onExport("text")}
          disabled={isExportDisabled}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-brand bg-bg-surface hover:border-accent-brand disabled:opacity-30 disabled:pointer-events-none text-xs font-semibold text-text-primary transition-all cursor-pointer shadow-sm"
        >
          {exportTextLabel}
        </button>
        <button
          onClick={onDelete}
          disabled={isDeleteDisabled}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-30 disabled:pointer-events-none text-xs font-semibold text-white transition-all shadow-sm cursor-pointer"
        >
          {deleteSelectedLabel}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-1.5 rounded-lg border border-border-brand hover:border-accent-brand text-text-primary hover:bg-bg-surface/50 text-sm font-medium transition-all duration-200 cursor-pointer ml-2"
        >
          {cancelLabel}
        </button>
      </div>
    </div>
  );
}
