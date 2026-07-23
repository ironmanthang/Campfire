import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { RotateCcw, Keyboard, Image as ImageIcon, X, Upload } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { useAppStore } from "../../store/useAppStore";
import {
  formatShortcutForDisplay,
  normalizeShortcutFromEvent,
} from "../heart/shortcut";

function SliderRow({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-4 p-3.5 bg-bg-surface/30 border border-border-brand/40 rounded-xl">
      <label className="text-xs font-semibold text-text-primary shrink-0 w-32">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="flex-1 accent-accent-brand cursor-pointer"
      />
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-3.5 bg-bg-surface/30 border border-border-brand/40 rounded-xl">
      <label className="text-xs font-semibold text-text-primary pr-3">{label}</label>
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
  const { config, updateConfigField, setHeartGateOpen, showNotification } = useAppStore();

  // ---- Keyboard shortcut recording state ----
  // Plain keys (e.g. "a") and combos (e.g. "shift+a", "f5") are both
  // accepted. Bare modifier presses are ignored; Escape cancels.
  const [recording, setRecording] = useState(false);

  const handleStartRecord = useCallback(() => {
    setRecording(true);
  }, []);

  const handleCancelRecord = useCallback(() => {
    setRecording(false);
  }, []);

  const handleClearShortcut = useCallback(() => {
    updateConfigField("heart_shortcut", "");
  }, [updateConfigField]);

  useEffect(() => {
    if (!recording) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setRecording(false);
        return;
      }
      const normalized = normalizeShortcutFromEvent(e);
      if (normalized === null || normalized === "__escape__") return;
      e.preventDefault();
      updateConfigField("heart_shortcut", normalized);
      setRecording(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [recording, updateConfigField]);

  // ---- Custom image picker state ----
  // Briefly flash a status message on success/failure.
  const [imageBusy, setImageBusy] = useState(false);

  const handlePickImage = useCallback(async () => {
    if (imageBusy) return;
    setImageBusy(true);
    try {
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: "Images",
            extensions: ["png", "jpg", "jpeg", "webp", "gif", "svg"],
          },
        ],
        title:
          t("settingsView.heartCustomImageUpload", { defaultValue: "Upload image" }),
      });
      if (selected && typeof selected === "string") {
        // Use the same Tauri command as custom_logo: reads the file from
        // disk and returns a base64 data URL. We keep it as a data: URL so
        // it survives being stored in config.json (no need for any extra
        // asset copying / persistence).
        const dataUrl = await invoke<string>("read_image_as_base64", { path: selected });
        updateConfigField("heart_custom_image", dataUrl);
      }
    } catch (err) {
      console.error("Failed to load custom heart image:", err);
      showNotification(
        t("settingsView.heartCustomImageEmpty", {
          defaultValue: "Using default red heart",
        }),
        "error"
      );
    } finally {
      setImageBusy(false);
    }
  }, [imageBusy, t, updateConfigField, showNotification]);

  const handleRemoveImage = useCallback(() => {
    updateConfigField("heart_custom_image", "");
  }, [updateConfigField]);

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
    <div className="space-y-3">

      {/* Visibility toggle */}
      <ToggleRow
        label={t("settingsView.heartShowLabel", { defaultValue: "Show donation heart" })}
        checked={config.show_donate_heart}
        onChange={(v) => updateConfigField("show_donate_heart", v)}
      />

      {/* Click behavior toggle (gated) */}
      <ToggleRow
        label={t("settingsView.heartClickFallsLabel", {
          defaultValue: "Make hearts fall on click instead of donate window",
        })}
        checked={config.heart_click_falls}
        onChange={handleClickFallsChange}
      />

      {/* Speed slider */}
      <SliderRow
        label={t("settingsView.heartSpeedLabel", { defaultValue: "Falling heart speed" })}
        min={1}
        max={10}
        value={config.heart_fall_speed}
        onChange={(v) => updateConfigField("heart_fall_speed", v)}
      />

      {/* Size slider */}
      <SliderRow
        label={t("settingsView.heartSizeLabel", { defaultValue: "Heart size" })}
        min={16}
        max={200}
        value={config.heart_size}
        onChange={(v) => updateConfigField("heart_size", v)}
      />

      {/* Keyboard shortcut row */}
      <div className="flex items-center justify-between gap-3 p-3.5 bg-bg-surface/30 border border-border-brand/40 rounded-xl">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Keyboard className="h-3.5 w-3.5 shrink-0 text-text-primary" />
          <span className="text-xs font-semibold text-text-primary shrink-0">
            {t("settingsView.heartShortcutLabel", { defaultValue: "Keyboard shortcut" })}
          </span>
          <span className="text-[0.625rem] text-text-secondary font-mono truncate">
            {recording
              ? t("settingsView.heartShortcutRecording", {
                  defaultValue: "Press a key… (Esc to cancel)",
                })
              : config.heart_shortcut
              ? formatShortcutForDisplay(config.heart_shortcut)
              : t("settingsView.heartShortcutEmpty", { defaultValue: "Not set" })}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {recording ? (
            <button
              type="button"
              onClick={handleCancelRecord}
              className="px-2.5 py-1.5 rounded-lg border border-border-brand bg-bg-surface/30 hover:bg-bg-app text-text-primary text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              {t("settingsView.heartShortcutCancel", { defaultValue: "Cancel" })}
            </button>
          ) : config.heart_shortcut ? (
            <>
              <button
                type="button"
                onClick={handleStartRecord}
                className="px-2.5 py-1.5 rounded-lg border border-border-brand bg-bg-surface/30 hover:bg-bg-app text-text-primary text-xs font-semibold transition-colors cursor-pointer"
              >
                {t("settingsView.heartShortcutRecord", { defaultValue: "Record" })}
              </button>
              <button
                type="button"
                onClick={handleClearShortcut}
                className="px-2.5 py-1.5 rounded-lg border border-border-brand bg-bg-surface/30 hover:bg-bg-app text-text-primary text-xs font-semibold transition-colors cursor-pointer"
              >
                {t("settingsView.heartShortcutClear", { defaultValue: "Clear" })}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleStartRecord}
              className="px-2.5 py-1.5 rounded-lg bg-accent-brand text-bg-app hover:bg-accent-brand-hover text-xs font-semibold transition-colors cursor-pointer"
            >
              {t("settingsView.heartShortcutRecord", { defaultValue: "Record" })}
            </button>
          )}
        </div>
      </div>

      {/* Custom heart image row */}
      <div className="flex items-center justify-between gap-3 p-3.5 bg-bg-surface/30 border border-border-brand/40 rounded-xl">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <ImageIcon className="h-3.5 w-3.5 shrink-0 text-text-primary" />
          <span className="text-xs font-semibold text-text-primary shrink-0">
            {t("settingsView.heartCustomImageLabel", { defaultValue: "Custom heart image" })}
          </span>
          {config.heart_custom_image ? (
            <div className="flex items-center gap-1.5 min-w-0">
              <img
                src={config.heart_custom_image}
                alt=""
                className="h-5 w-5 object-contain rounded border border-border-brand/40 bg-bg-app/40 shrink-0"
              />
              <span className="text-[0.625rem] text-text-secondary truncate">
                {t("settingsView.heartCustomImageSet", { defaultValue: "Custom image set" })}
              </span>
            </div>
          ) : (
            <span className="text-[0.625rem] text-text-secondary italic truncate">
              {t("settingsView.heartCustomImageEmpty", { defaultValue: "Using default red heart" })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {config.heart_custom_image ? (
            <>
              <button
                type="button"
                onClick={handlePickImage}
                disabled={imageBusy}
                className="px-2.5 py-1.5 rounded-lg border border-border-brand bg-bg-surface/30 hover:bg-bg-app text-text-primary text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <Upload className="h-3 w-3" />
                {t("settingsView.heartCustomImageChange", { defaultValue: "Change" })}
              </button>
              <button
                type="button"
                onClick={handleRemoveImage}
                className="px-2.5 py-1.5 rounded-lg border border-border-brand bg-bg-surface/30 hover:bg-bg-app text-text-primary text-xs font-semibold transition-colors cursor-pointer"
              >
                {t("settingsView.heartCustomImageRemove", { defaultValue: "Remove" })}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handlePickImage}
              disabled={imageBusy}
              className="px-2.5 py-1.5 rounded-lg bg-accent-brand text-bg-app hover:bg-accent-brand-hover text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <Upload className="h-3 w-3" />
              {t("settingsView.heartCustomImageUpload", { defaultValue: "Upload" })}
            </button>
          )}
        </div>
      </div>

      {/* Reset position */}
      <div className="flex items-center justify-between p-3.5 bg-bg-surface/30 border border-border-brand/40 rounded-xl">
        <span className="text-xs font-semibold text-text-primary pr-3">
          {t("settingsView.heartResetPositionLabel", {
            defaultValue: "Reset heart position and size",
          })}
        </span>
        <button
          type="button"
          onClick={handleResetPosition}
          className="px-3.5 py-1.5 rounded-lg border border-border-brand bg-bg-surface/30 hover:bg-bg-app text-text-primary text-xs font-semibold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {t("settingsView.heartResetPositionButton", { defaultValue: "Reset" })}
        </button>
      </div>
    </div>
  );
}
