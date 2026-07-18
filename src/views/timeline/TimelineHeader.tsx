import { BookOpen } from "lucide-react";
import { SidebarToggleButton } from "../../components/SidebarToggleButton";
import { DateRangePicker } from "../../components/common/DateRangePicker";
import { SelectionToolbar } from "../../components/common/SelectionToolbar";

export interface TimelineHeaderProps {
  // Selection-mode toolbar
  isSelecting: boolean;
  selectedCount: number;
  filteredTotal: number;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onSelectAllToggle: () => void;
  onExport: (format: "json" | "text") => void;
  isExportDisabled: boolean;
  onDelete: () => void;
  isDeleteDisabled: boolean;
  onCancelSelection: () => void;

  // Browse-mode header
  filterStartDate: string;
  filterEndDate: string;
  onFilterStartChange: (val: string) => void;
  onFilterEndChange: (val: string) => void;
  activePresetLabel: string;
  onPresetLabelChange: (label: string) => void;
  clickMode: "open" | "select";
  onClickModeToggle: () => void;

  // i18n
  selectedCountLabel: string;
  selectAllLabel: string;
  deselectAllLabel: string;
  exportJsonLabel: string;
  exportTextLabel: string;
  deleteSelectedLabel: string;
  cancelLabel: string;
  titleLabel: string;
  subtitleLabel: string;
  clickToOpenTooltip: string;
  clickToOpenLabel: string;
  clickToSelectTooltip: string;
  clickToSelectLabel: string;
}

export const TimelineHeader: React.FC<TimelineHeaderProps> = ({
  isSelecting,
  selectedCount,
  filteredTotal,
  sidebarCollapsed,
  onToggleSidebar,
  onSelectAllToggle,
  onExport,
  isExportDisabled,
  onDelete,
  isDeleteDisabled,
  onCancelSelection,
  filterStartDate,
  filterEndDate,
  onFilterStartChange,
  onFilterEndChange,
  activePresetLabel,
  onPresetLabelChange,
  clickMode,
  onClickModeToggle,
  selectedCountLabel,
  selectAllLabel,
  deselectAllLabel,
  exportJsonLabel,
  exportTextLabel,
  deleteSelectedLabel,
  cancelLabel,
  titleLabel,
  subtitleLabel,
  clickToOpenTooltip,
  clickToOpenLabel,
  clickToSelectTooltip,
  clickToSelectLabel,
}) => {

  if (isSelecting) {
    return (
      <header className="relative z-20 p-6 border-b border-border-brand shrink-0 select-none min-h-[96px] bg-bg-surface/10 backdrop-blur-md flex items-center">
        <SelectionToolbar
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={onToggleSidebar}
          selectedCountLabel={selectedCountLabel}
          isAllSelected={selectedCount === filteredTotal}
          selectAllLabel={selectAllLabel}
          deselectAllLabel={deselectAllLabel}
          onSelectAllToggle={onSelectAllToggle}
          onExport={onExport}
          isExportDisabled={isExportDisabled}
          onDelete={onDelete}
          isDeleteDisabled={isDeleteDisabled}
          onCancel={onCancelSelection}
          exportJsonLabel={exportJsonLabel}
          exportTextLabel={exportTextLabel}
          deleteSelectedLabel={deleteSelectedLabel}
          cancelLabel={cancelLabel}
        />
      </header>
    );
  }

  return (
    <header className="min-h-[96px] py-4 px-6 border-b border-border-brand shrink-0 flex flex-wrap justify-between items-center bg-bg-surface/10 backdrop-blur-md select-none gap-4">
      <div className="flex items-start gap-4">
        <SidebarToggleButton
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={onToggleSidebar}
          className="mt-1"
        />
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{titleLabel}</h2>
          <p className="text-sm text-text-secondary mt-1">{subtitleLabel}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-text-secondary bg-bg-surface/40 p-3 rounded-xl border border-border-brand/40">
        <DateRangePicker
          startDate={filterStartDate}
          endDate={filterEndDate}
          onStartChange={onFilterStartChange}
          onEndChange={onFilterEndChange}
          activePresetLabel={activePresetLabel}
          onPresetLabelChange={onPresetLabelChange}
        />

        <button
          onClick={onClickModeToggle}
          className="px-4 py-1.5 rounded-lg border border-border-brand hover:border-accent-brand text-text-primary hover:bg-bg-surface/50 text-sm font-medium transition-all duration-200 cursor-pointer ml-2 flex items-center gap-1.5 select-none"
          title={clickMode === "open" ? clickToOpenTooltip : clickToSelectTooltip}
        >
          {clickMode === "open" ? (
            <>
              <BookOpen className="h-4 w-4 text-accent-brand shrink-0" />
              <span>{clickToOpenLabel}</span>
            </>
          ) : (
            <>
              <input
                type="checkbox"
                checked
                disabled
                className="h-3.5 w-3.5 rounded border border-border-brand text-accent-brand bg-bg-input shrink-0 cursor-not-allowed pointer-events-none"
              />
              <span>{clickToSelectLabel}</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
