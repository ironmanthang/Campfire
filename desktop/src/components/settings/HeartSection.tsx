import { useTranslation } from "react-i18next";
import { RotateCcw, Heart } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";

function SliderRow({
  label,
  description,
  min,
  max,
  step = 1,
  value,
  formatValue,
  onChange,
}: {
  label: string;
  description: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  formatValue: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold">{label}</label>
        <span className="text-xs text-text-secondary font-mono">{formatValue(value)}</span>
      </div>
      <p className="text-xs text-text-secondary">{description}</p>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-full accent-accent-brand cursor-pointer"
      />
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-3.5 bg-bg-surface/30 border border-border-brand/40 rounded-xl">
      <div className="space-y-0.5 pr-3">
        <label className="block text-xs font-semibold text-text-primary">{label}</label>
        <p className="text-[10px] text-text-secondary">{description}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-border-brand bg-bg-input text-accent-brand focus:ring-accent-brand cursor-pointer shrink-0"
      />
    </div>
  );
}

export function HeartSection() {
  const { t } = useTranslation();
  const { config, updateConfigField, setHeartGateOpen, fireHearts } = useAppStore();

  const handleClickFallsChange = (next: boolean) => {
    if (next) {
      // Turning ON. If the user has already dismissed the gate, apply directly.
      // Otherwise open the gate modal — the modal will commit the change on confirm.
      if (config.heart_gate_dismissed) {
        updateConfigField("heart_click_falls", true);
      } else {
        setHeartGateOpen(true);
      }
    } else {
      // Turning OFF is always allowed.
      updateConfigField("heart_click_falls", false);
    }
  };

  const handleResetPosition = () => {
    updateConfigField("heart_position", null);
  };

  return (
    <div className="space-y-6">
      {/* Section description */}
      <div className="flex items-start gap-3 p-3.5 bg-red-500/5 border border-red-500/20 rounded-xl">
        <Heart className="h-5 w-5 text-red-500 shrink-0 mt-0.5" fill="currentColor" />
        <p className="text-xs text-text-secondary leading-relaxed">
          {t("settingsView.heartDesc", {
            defaultValue:
              "Customize the floating donation heart: show or hide it, decide what happens when you click it, fine-tune the falling-hearts effect, and drag it anywhere on the screen.",
          })}
        </p>
      </div>

      {/* Visibility toggle */}
      <ToggleRow
        label={t("settingsView.heartShowLabel", { defaultValue: "Show donation heart" })}
        description={t("settingsView.heartShowDesc", {
          defaultValue: "Display the floating heart icon on the screen.",
        })}
        checked={config.show_donate_heart}
        onChange={(v) => updateConfigField("show_donate_heart", v)}
      />

      {/* Click behavior toggle (gated) */}
      <ToggleRow
        label={t("settingsView.heartClickFallsLabel", {
          defaultValue: "Make hearts fall on click",
        })}
        description={t("settingsView.heartClickFallsDesc", {
          defaultValue:
            "When ON, clicking the heart spawns falling hearts instead of opening the donate modal.",
        })}
        checked={config.heart_click_falls}
        onChange={handleClickFallsChange}
      />

      {/* Speed slider */}
      <SliderRow
        label={t("settingsView.heartSpeedLabel", { defaultValue: "Falling heart speed" })}
        description={t("settingsView.heartSpeedDesc", {
          defaultValue: "How fast the hearts fall from the top of the screen.",
        })}
        min={1}
        max={10}
        value={config.heart_fall_speed}
        formatValue={(v) =>
          t("settingsView.heartSpeedValue", { value: v, defaultValue: `${v} / 10` })
        }
        onChange={(v) => updateConfigField("heart_fall_speed", v)}
      />

      {/* Size slider */}
      <SliderRow
        label={t("settingsView.heartSizeLabel", { defaultValue: "Heart size" })}
        description={t("settingsView.heartSizeDesc", {
          defaultValue: "Width and height of the floating heart icon, in pixels.",
        })}
        min={16}
        max={64}
        value={config.heart_size}
        formatValue={(v) =>
          t("settingsView.heartSizeValue", { value: v, defaultValue: `${v} px` })
        }
        onChange={(v) => updateConfigField("heart_size", v)}
      />

      {/* Test fire button */}
      <div className="flex items-center justify-between p-3.5 bg-bg-surface/30 border border-border-brand/40 rounded-xl">
        <div className="space-y-0.5 pr-3">
          <label className="block text-xs font-semibold text-text-primary">
            {t("settingsView.heartTestLabel", { defaultValue: "Test the effect" })}
          </label>
          <p className="text-[10px] text-text-secondary">
            {t("settingsView.heartTestDesc", {
              defaultValue: "Spawn a few falling hearts right now to preview your speed and size.",
            })}
          </p>
        </div>
        <button
          type="button"
          onClick={() => fireHearts(8)}
          className="px-3.5 py-1.5 rounded-lg bg-accent-brand text-bg-app hover:bg-accent-brand-hover text-xs font-semibold transition-colors cursor-pointer shrink-0"
        >
          {t("settingsView.heartTestButton", { defaultValue: "Fire 8 hearts" })}
        </button>
      </div>

      {/* Reset position */}
      <div className="flex items-center justify-between p-3.5 bg-bg-surface/30 border border-border-brand/40 rounded-xl">
        <div className="space-y-0.5 pr-3">
          <label className="block text-xs font-semibold text-text-primary">
            {t("settingsView.heartResetPositionLabel", {
              defaultValue: "Reset heart position",
            })}
          </label>
          <p className="text-[10px] text-text-secondary">
            {t("settingsView.heartResetPositionDesc", {
              defaultValue:
                "Move the floating heart back to its default location (right side of the sidebar footer row).",
            })}
          </p>
          {config.heart_position && (
            <p className="text-[10px] text-text-secondary font-mono pt-1">
              {t("settingsView.heartPositionFormat", {
                x: Math.round(config.heart_position.x),
                y: Math.round(config.heart_position.y),
                defaultValue: `Current: x=${Math.round(config.heart_position.x)}, y=${Math.round(config.heart_position.y)}`,
              })}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handleResetPosition}
          disabled={config.heart_position === null}
          className="px-3.5 py-1.5 rounded-lg border border-border-brand bg-bg-surface/30 hover:bg-bg-app text-text-primary text-xs font-semibold transition-colors cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {t("settingsView.heartResetPositionButton", { defaultValue: "Reset" })}
        </button>
      </div>
    </div>
  );
}
