import { getDatePresets, DatePreset } from "../../lib/dateUtils";
import { useTranslation } from "react-i18next";

interface DateRangePresetsProps {
  currentStart: string;
  currentEnd: string;
  onSelect: (start: string, end: string) => void;
  activePresetLabel?: string;
  onPresetLabelChange?: (label: string) => void;
}

export function DateRangePresets({
  currentStart,
  currentEnd,
  onSelect,
  activePresetLabel,
  onPresetLabelChange,
}: DateRangePresetsProps) {
  const { t } = useTranslation();
  const presets = getDatePresets();

  const handlePresetClick = (preset: DatePreset) => {
    onSelect(preset.start, preset.end);
    if (onPresetLabelChange) {
      onPresetLabelChange(preset.label);
    }
  };

  return (
    <div className="flex items-center gap-1.5 select-none">
      {presets.map((preset) => {
        const isPresetActive = activePresetLabel
          ? activePresetLabel === preset.label
          : currentStart === preset.start && currentEnd === preset.end;

        const translationKey = `timeline.presets.${preset.label.toLowerCase().replace(" ", "")}`;

        return (
          <button
            key={preset.label}
            onClick={() => handlePresetClick(preset)}
            onMouseDown={(e) => e.preventDefault()}
            className={`px-2 py-1 rounded-md text-[10px] font-bold border transition-all duration-150 cursor-pointer ${
              isPresetActive
                ? "bg-accent-brand border-accent-brand text-bg-app font-extrabold shadow-sm"
                : "bg-bg-input border-border-brand/60 text-text-secondary hover:text-text-primary hover:border-border-brand"
            }`}
          >
            {t(translationKey as any)}
          </button>
        );
      })}
    </div>
  );
}
