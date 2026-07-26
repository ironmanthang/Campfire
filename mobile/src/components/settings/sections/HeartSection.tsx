import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { RotateCcw, Image as ImageIcon, Upload, Trash2 } from 'lucide-react';
import { HeartGateModal } from '../../modals/HeartGateModal';
import { DEFAULT_HEART_SIZE } from '../../../constants/heart';

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
    <div className="flex items-center gap-4 p-3 bg-bg-surface/40 border border-border-brand/40 rounded-xl">
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
    <div className="flex items-center justify-between p-3 bg-bg-surface/40 border border-border-brand/40 rounded-xl">
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

export const HeartSection: React.FC = () => {
  const { t } = useTranslation();

  const [showDonateHeart, setShowDonateHeart] = useState<boolean>(() => {
    return localStorage.getItem('campfire_mobile_show_donate_heart') !== 'false';
  });

  const [heartClickFalls, setHeartClickFalls] = useState<boolean>(() => {
    return localStorage.getItem('campfire_mobile_heart_click_falls') === 'true';
  });

  const [fallSpeed, setFallSpeed] = useState<number>(() => {
    return parseInt(localStorage.getItem('campfire_mobile_heart_fall_speed') || '5', 10);
  });

  const [rainDuration, setRainDuration] = useState<number>(() => {
    return parseInt(localStorage.getItem('campfire_mobile_heart_rain_duration') || '5', 10);
  });

  const [heartSize, setHeartSize] = useState<number>(() => {
    return parseInt(localStorage.getItem('campfire_mobile_heart_size') || String(DEFAULT_HEART_SIZE), 10);
  });

  const [customImage, setCustomImage] = useState<string | null>(() => {
    return localStorage.getItem('campfire_mobile_heart_custom_image');
  });

  const [isGateOpen, setIsGateOpen] = useState(false);

  const handleShowDonateHeartChange = (val: boolean) => {
    setShowDonateHeart(val);
    localStorage.setItem('campfire_mobile_show_donate_heart', val ? 'true' : 'false');
    window.dispatchEvent(new Event('heart-config-changed'));
  };

  const handleHeartClickFallsChange = (next: boolean) => {
    if (next) {
      const dismissed = localStorage.getItem('campfire_mobile_heart_gate_dismissed') === 'true';
      if (dismissed) {
        setHeartClickFalls(true);
        localStorage.setItem('campfire_mobile_heart_click_falls', 'true');
        window.dispatchEvent(new Event('heart-config-changed'));
      } else {
        setIsGateOpen(true);
      }
    } else {
      setHeartClickFalls(false);
      localStorage.setItem('campfire_mobile_heart_click_falls', 'false');
      window.dispatchEvent(new Event('heart-config-changed'));
    }
  };

  const handleGateConfirm = () => {
    localStorage.setItem('campfire_mobile_heart_gate_dismissed', 'true');
    localStorage.setItem('campfire_mobile_heart_click_falls', 'true');
    setHeartClickFalls(true);
    setIsGateOpen(false);
    window.dispatchEvent(new Event('heart-config-changed'));
    // Consume the history entry that HeartGateModal pushed via useModalBackHandler.
    // Without this, the entry is orphaned and the next history.back() call
    // (e.g. closing SettingsModal) pops the wrong entry, breaking tap detection.
    window.history.back();
  };

  const handleGateCancel = () => {
    setIsGateOpen(false);
  };

  const handleSpeedChange = (val: number) => {
    setFallSpeed(val);
    localStorage.setItem('campfire_mobile_heart_fall_speed', val.toString());
    window.dispatchEvent(new Event('heart-config-changed'));
  };

  const handleRainDurationChange = (val: number) => {
    setRainDuration(val);
    localStorage.setItem('campfire_mobile_heart_rain_duration', val.toString());
    window.dispatchEvent(new Event('heart-config-changed'));
  };

  const handleSizeChange = (val: number) => {
    setHeartSize(val);
    localStorage.setItem('campfire_mobile_heart_size', val.toString());
    window.dispatchEvent(new Event('heart-config-changed'));
  };

  // Image Upload & Canvas Compression handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const imgSrc = evt.target?.result as string;
      if (!imgSrc) return;

      const img = new Image();
      img.onload = () => {
        const maxDim = 256;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/png');
          
          // Delete old image explicitly from storage first
          localStorage.removeItem('campfire_mobile_heart_custom_image');
          localStorage.setItem('campfire_mobile_heart_custom_image', compressedBase64);
          setCustomImage(compressedBase64);
          window.dispatchEvent(new Event('heart-config-changed'));
        }
      };
      img.src = imgSrc;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveImage = useCallback(() => {
    localStorage.removeItem('campfire_mobile_heart_custom_image');
    setCustomImage(null);
    window.dispatchEvent(new Event('heart-config-changed'));
  }, []);

  const handleResetPosition = () => {
    localStorage.removeItem('campfire_mobile_donate_pos');
    localStorage.setItem('campfire_mobile_heart_size', String(DEFAULT_HEART_SIZE));
    setHeartSize(DEFAULT_HEART_SIZE);
    window.dispatchEvent(new Event('heart-reset'));
    window.dispatchEvent(new Event('heart-config-changed'));
  };

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
          {t("settings.heartTitle", { defaultValue: "Heart Customization" })}
        </span>
      </div>

      {/* Visibility Toggle */}
      <ToggleRow
        label={t("settingsView.heartShowLabel", { defaultValue: "Show donation heart" })}
        checked={showDonateHeart}
        onChange={handleShowDonateHeartChange}
      />

      {/* Click behavior toggle (gated) */}
      <ToggleRow
        label={t("settingsView.heartClickFallsLabel", {
          defaultValue: "Make hearts fall on click instead of donate window",
        })}
        checked={heartClickFalls}
        onChange={handleHeartClickFallsChange}
      />

      {/* Speed slider */}
      <SliderRow
        label={t("settingsView.heartSpeedLabel", { defaultValue: "Falling heart speed" })}
        min={1}
        max={10}
        value={fallSpeed}
        onChange={handleSpeedChange}
      />

      {/* Rain duration slider */}
      <SliderRow
        label={t("settings.heartRainDurationLabel", { defaultValue: "Heart rain duration (seconds)" })}
        min={1}
        max={30}
        value={rainDuration}
        onChange={handleRainDurationChange}
      />

      {/* Size slider */}
      <SliderRow
        label={t("settingsView.heartSizeLabel", { defaultValue: "Heart size" })}
        min={16}
        max={100}
        value={heartSize}
        onChange={handleSizeChange}
      />

      {/* Custom heart image row */}
      <div className="flex items-center justify-between gap-3 p-3 bg-bg-surface/40 border border-border-brand/40 rounded-xl">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <ImageIcon className="h-3.5 w-3.5 shrink-0 text-text-primary" />
          <span className="text-xs font-semibold text-text-primary shrink-0">
            {t("settingsView.heartCustomImageLabel", { defaultValue: "Custom heart image" })}
          </span>
          {customImage ? (
            <div className="flex items-center gap-1.5 min-w-0">
              <img
                src={customImage}
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
          <label className="px-2.5 py-1.5 rounded-lg bg-accent-brand text-bg-app hover:bg-accent-brand-hover text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 active:scale-95">
            <Upload className="h-3 w-3" />
            <span>{customImage ? t("common.change", "Change") : t("common.upload", "Upload")}</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>

          {customImage && (
            <button
              type="button"
              onClick={handleRemoveImage}
              className="px-2 py-1.5 rounded-lg border border-border-brand/60 bg-bg-surface hover:bg-bg-app text-red-500 text-xs font-semibold transition-all cursor-pointer active:scale-95"
              title={t("common.remove", "Remove")}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Reset position & size */}
      <div className="flex items-center justify-between p-3 bg-bg-surface/40 border border-border-brand/40 rounded-xl">
        <span className="text-xs font-semibold text-text-primary pr-3">
          {t("settingsView.heartResetPositionLabel", {
            defaultValue: "Reset heart position and size",
          })}
        </span>
        <button
          type="button"
          onClick={handleResetPosition}
          className="px-3 py-1.5 rounded-lg border border-border-brand bg-bg-surface hover:bg-bg-app text-text-primary text-xs font-semibold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 active:scale-95"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {t("settingsView.heartResetPositionButton", { defaultValue: "Reset" })}
        </button>
      </div>

      {/* Heart Gate Modal */}
      <HeartGateModal
        isOpen={isGateOpen}
        onConfirm={handleGateConfirm}
        onCancel={handleGateCancel}
      />
    </div>
  );
};
