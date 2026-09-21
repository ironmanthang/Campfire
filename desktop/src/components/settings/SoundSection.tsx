import { useTranslation } from "react-i18next";
import { Volume2, VolumeX, Flame, CloudRain, Wind, Sparkles } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { playSfx, type AmbientType } from "../../services/audioService";

export function SoundSection() {
  const { t } = useTranslation();
  const { config, updateConfigField } = useAppStore();

  const sfxEnabled = config.sound_sfx_enabled ?? false;
  const sfxVolume = config.sound_sfx_volume ?? 70;
  const ambientEnabled = config.sound_ambient_enabled ?? false;
  const ambientType = (config.sound_ambient_type as AmbientType) ?? "campfire";
  const ambientVolume = config.sound_ambient_volume ?? 50;

  const ambientOptions: Array<{
    id: AmbientType;
    label: string;
    desc: string;
    icon: typeof Flame;
  }> = [
    {
      id: "campfire",
      label: t("soundSection.trackCampfire", { defaultValue: "Campfire" }),
      desc: t("soundSection.trackCampfireDesc", { defaultValue: "Cozy crackling fireplace" }),
      icon: Flame,
    },
    {
      id: "rain",
      label: t("soundSection.trackRain", { defaultValue: "Light Rain" }),
      desc: t("soundSection.trackRainDesc", { defaultValue: "Gentle soothing rain" }),
      icon: CloudRain,
    },
    {
      id: "night-forest",
      label: t("soundSection.trackNightForest", { defaultValue: "Night Breeze" }),
      desc: t("soundSection.trackNightForestDesc", { defaultValue: "Wind rustling through tall grass" }),
      icon: Wind,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Sound Effects Group */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-accent-brand flex items-center gap-1.5">
          <Volume2 className="h-3.5 w-3.5" />
          <span>{t("soundSection.sfxTitle", { defaultValue: "Sound Effects" })}</span>
        </h4>

        {/* SFX Toggle */}
        <div className="flex items-center justify-between p-3.5 bg-bg-surface/30 border border-border-brand/40 rounded-xl">
          <div className="pr-3">
            <label className="text-xs font-semibold text-text-primary block">
              {t("soundSection.enableSfxLabel", { defaultValue: "Scratchpad & Heart Sounds" })}
            </label>
            <p className="text-[11px] text-text-secondary mt-0.5">
              {t("soundSection.enableSfxDesc", {
                defaultValue: "Play a pencil-tick when completing tasks and a sparkle when clicking the heart.",
              })}
            </p>
          </div>
          <input
            type="checkbox"
            checked={sfxEnabled}
            onChange={(e) => updateConfigField("sound_sfx_enabled", e.target.checked)}
            className="w-4 h-4 rounded border-border-brand bg-bg-input text-accent-brand focus:ring-accent-brand cursor-pointer shrink-0"
          />
        </div>

        {/* SFX Volume Slider & Test Button */}
        {sfxEnabled && (
          <div className="flex items-center gap-4 p-3.5 bg-bg-surface/30 border border-border-brand/40 rounded-xl animate-fade-in">
            <label className="text-xs font-semibold text-text-primary shrink-0 w-24">
              {t("soundSection.volumeLabel", { defaultValue: "Volume" })}: {sfxVolume}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={sfxVolume}
              onChange={(e) => updateConfigField("sound_sfx_volume", parseInt(e.target.value, 10))}
              className="flex-1 accent-accent-brand cursor-pointer"
            />
            <button
              type="button"
              onClick={() => playSfx("pencil-tick")}
              className="px-2.5 py-1 text-xs font-medium rounded-lg border border-border-brand/60 hover:bg-bg-app hover:border-accent-brand/50 text-text-secondary hover:text-text-primary transition-all cursor-pointer shrink-0 flex items-center gap-1"
              title={t("soundSection.testSfxTooltip", { defaultValue: "Preview pencil tick sound" })}
            >
              <Sparkles className="h-3 w-3 text-accent-brand" />
              <span>{t("soundSection.testButton", { defaultValue: "Preview" })}</span>
            </button>
          </div>
        )}
      </div>

      {/* Ambient Soundscapes Group */}
      <div className="space-y-3 pt-2 border-t border-border-brand/20">
        <h4 className="text-xs font-bold uppercase tracking-wider text-accent-brand flex items-center gap-1.5">
          <Flame className="h-3.5 w-3.5" />
          <span>{t("soundSection.ambientTitle", { defaultValue: "Ambient Background Sound" })}</span>
        </h4>

        {/* Ambient Toggle */}
        <div className="flex items-center justify-between p-3.5 bg-bg-surface/30 border border-border-brand/40 rounded-xl">
          <div className="pr-3">
            <label className="text-xs font-semibold text-text-primary block">
              {t("soundSection.enableAmbientLabel", { defaultValue: "Enable Ambiance" })}
            </label>
            <p className="text-[11px] text-text-secondary mt-0.5">
              {t("soundSection.enableAmbientDesc", {
                defaultValue: "Loop a relaxing atmosphere in the background while you focus and write.",
              })}
            </p>
          </div>
          <input
            type="checkbox"
            checked={ambientEnabled}
            onChange={(e) => updateConfigField("sound_ambient_enabled", e.target.checked)}
            className="w-4 h-4 rounded border-border-brand bg-bg-input text-accent-brand focus:ring-accent-brand cursor-pointer shrink-0"
          />
        </div>

        {/* Track Selection Cards */}
        {ambientEnabled && (
          <div className="space-y-3 animate-fade-in">
            <div className="grid grid-cols-3 gap-2.5">
              {ambientOptions.map((opt) => {
                const isSelected = ambientType === opt.id;
                const IconComponent = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateConfigField("sound_ambient_type", opt.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "bg-accent-brand/10 border-accent-brand shadow-sm shadow-accent-brand/10 text-text-primary"
                        : "bg-bg-surface/30 border-border-brand/40 hover:border-border-brand text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <IconComponent
                        className={`h-4 w-4 ${isSelected ? "text-accent-brand" : "text-text-secondary"}`}
                      />
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-accent-brand animate-pulse" />
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-semibold block">{opt.label}</span>
                      <span className="text-[10px] text-text-secondary line-clamp-1 mt-0.5">
                        {opt.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Ambient Volume Slider */}
            <div className="flex items-center gap-4 p-3.5 bg-bg-surface/30 border border-border-brand/40 rounded-xl">
              <div className="flex items-center gap-1.5 shrink-0 w-28">
                {ambientVolume === 0 ? (
                  <VolumeX className="h-3.5 w-3.5 text-text-secondary" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5 text-accent-brand" />
                )}
                <label className="text-xs font-semibold text-text-primary">
                  {t("soundSection.ambientVolumeLabel", { defaultValue: "Ambiance" })}: {ambientVolume}%
                </label>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={ambientVolume}
                onChange={(e) => updateConfigField("sound_ambient_volume", parseInt(e.target.value, 10))}
                className="flex-1 accent-accent-brand cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
