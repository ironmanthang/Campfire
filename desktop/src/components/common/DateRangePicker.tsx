import React from "react";
import { useTranslation } from "react-i18next";
import { formatToDDMMYY } from "../../lib/dateUtils";
import { DateRangePresets } from "./DateRangePresets";

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartChange: (val: string) => void;
  onEndChange: (val: string) => void;
  disabled?: boolean;
  disabledTooltip?: string;
  labelPrefix?: React.ReactNode;
  
  // Presets related props
  activePresetLabel?: string;
  onPresetLabelChange?: (label: string) => void;
  earliestDate?: string;
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  disabled = false,
  disabledTooltip,
  labelPrefix,
  activePresetLabel,
  onPresetLabelChange,
  earliestDate,
}: DateRangePickerProps) {
  const { t } = useTranslation();

  const handleStartClick = (e: React.MouseEvent<HTMLInputElement>) => {
    if (disabled) return;
    try {
      e.currentTarget.showPicker();
    } catch (err) {
      // ignore
    }
  };

  const handleEndClick = (e: React.MouseEvent<HTMLInputElement>) => {
    if (disabled) return;
    try {
      e.currentTarget.showPicker();
    } catch (err) {
      // ignore
    }
  };

  return (
    <div
      className={`flex flex-wrap items-center gap-4 text-xs font-semibold text-text-secondary select-none ${
        disabled ? "opacity-40 cursor-not-allowed" : ""
      }`}
      title={disabled ? disabledTooltip : undefined}
    >
      <div className={`flex items-center gap-1.5 ${disabled ? "pointer-events-none" : ""}`}>
        {labelPrefix && <span>{labelPrefix}</span>}
        
        {/* Start Date */}
        <div className="relative inline-block">
          <span className="bg-bg-input border border-border-brand/60 px-2.5 py-1 rounded text-text-primary text-xs font-semibold block min-w-[70px] text-center">
            {startDate ? formatToDDMMYY(startDate) : t("timeline.startDate")}
          </span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartChange(e.target.value)}
            disabled={disabled}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full disabled:cursor-not-allowed"
            onClick={handleStartClick}
          />
        </div>

        {/* Separator / 'to' */}
        <span>{t("timeline.to")}</span>

        {/* End Date */}
        <div className="relative inline-block">
          <span className="bg-bg-input border border-border-brand/60 px-2.5 py-1 rounded text-text-primary text-xs font-semibold block min-w-[70px] text-center">
            {endDate ? formatToDDMMYY(endDate) : t("timeline.endDate")}
          </span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndChange(e.target.value)}
            disabled={disabled}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full disabled:cursor-not-allowed"
            onClick={handleEndClick}
          />
        </div>
      </div>

      {/* Date Range Presets */}
      <div className={disabled ? "pointer-events-none" : ""}>
        <DateRangePresets
          currentStart={startDate}
          currentEnd={endDate}
          onSelect={(start, end) => {
            onStartChange(start);
            onEndChange(end);
          }}
          activePresetLabel={activePresetLabel}
          onPresetLabelChange={onPresetLabelChange}
          earliestDate={earliestDate}
        />
      </div>
    </div>
  );
}
