import React from 'react';
import { useTranslation } from 'react-i18next';
import { Volume2, VolumeX, Flame, CloudRain, Wind } from 'lucide-react';
import { useSoundSettings } from '../../../hooks/useSoundSettings';
import { type AmbientType } from '../../../services/audioService';

export const SoundSection: React.FC = () => {
  const { t } = useTranslation();
  const { config, updateConfig } = useSoundSettings();

  const ambientOptions: Array<{
    id: AmbientType;
    label: string;
    desc: string;
    icon: typeof Flame;
  }> = [
    {
      id: 'campfire',
      label: t('soundSection.trackCampfire', { defaultValue: 'Campfire' }),
      desc: t('soundSection.trackCampfireDesc', { defaultValue: 'Crackling fire' }),
      icon: Flame,
    },
    {
      id: 'rain',
      label: t('soundSection.trackRain', { defaultValue: 'Light Rain' }),
      desc: t('soundSection.trackRainDesc', { defaultValue: 'Gentle rain' }),
      icon: CloudRain,
    },
    {
      id: 'night-forest',
      label: t('soundSection.trackNightForest', { defaultValue: 'Night Breeze' }),
      desc: t('soundSection.trackNightForestDesc', { defaultValue: 'Tall grass wind' }),
      icon: Wind,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Sound Effects Section */}
      <div className="space-y-2.5">
        <div>
          <h3 className="font-semibold text-text-primary text-sm">
            <span>{t('soundSection.sfxTitle', { defaultValue: 'Sound Effects' })}</span>
          </h3>
          <p className="text-xs text-text-secondary">
            {t('soundSection.enableSfxDesc', {
              defaultValue: 'Play a pencil-tick when completing tasks and a sparkle when clicking the heart.',
            })}
          </p>
        </div>

        {/* SFX Toggle */}
        <div className="flex items-center justify-between p-3 bg-bg-surface/40 border border-border-brand/40 rounded-xl">
          <label className="text-xs font-semibold text-text-primary pr-3">
            {t('soundSection.enableSfxLabel', { defaultValue: 'Enable Sound Effects' })}
          </label>
          <input
            type="checkbox"
            checked={config.sfxEnabled}
            onChange={(e) => updateConfig({ sfxEnabled: e.target.checked })}
            className="w-4 h-4 rounded border-border-brand bg-bg-app text-accent-brand focus:ring-accent-brand cursor-pointer shrink-0"
          />
        </div>

        {/* SFX Volume Sliders */}
        {config.sfxEnabled && (
          <div className="space-y-2.5 p-3 bg-bg-surface/40 border border-border-brand/40 rounded-xl animate-fade-in">
            {/* Scratchpad Volume Slider */}
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-text-primary shrink-0 w-24">
                {t('soundSection.scratchpadVolumeLabel', { defaultValue: 'Scratchpad' })}: {config.sfxScratchpadVolume}%
              </label>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={config.sfxScratchpadVolume}
                onChange={(e) => updateConfig({ sfxScratchpadVolume: parseInt(e.target.value, 10) })}
                className="flex-1 accent-accent-brand cursor-pointer"
              />
            </div>

            {/* Heart Volume Slider */}
            <div className="flex items-center gap-3 pt-2 border-t border-border-brand/20">
              <label className="text-xs font-semibold text-text-primary shrink-0 w-24">
                {t('soundSection.heartVolumeLabel', { defaultValue: 'Heart' })}: {config.sfxHeartVolume}%
              </label>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={config.sfxHeartVolume}
                onChange={(e) => updateConfig({ sfxHeartVolume: parseInt(e.target.value, 10) })}
                className="flex-1 accent-accent-brand cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      <hr className="border-border-brand/40" />

      {/* Ambient Soundscapes Section */}
      <div className="space-y-2.5">
        <div>
          <h3 className="font-semibold text-text-primary text-sm">
            <span>{t('soundSection.ambientTitle', { defaultValue: 'Ambient Soundscape' })}</span>
          </h3>
          <p className="text-xs text-text-secondary">
            {t('soundSection.enableAmbientDesc', {
              defaultValue: 'Loop a relaxing atmosphere in the background while you focus and write.',
            })}
          </p>
        </div>

        {/* Ambient Toggle */}
        <div className="flex items-center justify-between p-3 bg-bg-surface/40 border border-border-brand/40 rounded-xl">
          <label className="text-xs font-semibold text-text-primary pr-3">
            {t('soundSection.enableAmbientLabel', { defaultValue: 'Enable Ambiance' })}
          </label>
          <input
            type="checkbox"
            checked={config.ambientEnabled}
            onChange={(e) => updateConfig({ ambientEnabled: e.target.checked })}
            className="w-4 h-4 rounded border-border-brand bg-bg-app text-accent-brand focus:ring-accent-brand cursor-pointer shrink-0"
          />
        </div>

        {/* Ambient Options & Volume */}
        {config.ambientEnabled && (
          <div className="space-y-2.5">
            <div className="grid grid-cols-3 gap-2">
              {ambientOptions.map((opt) => {
                const isSelected = config.ambientType === opt.id;
                const IconComponent = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateConfig({ ambientType: opt.id })}
                    className={`py-2.5 px-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between active:scale-95 ${
                      isSelected
                        ? 'bg-accent-brand/10 border-accent-brand text-text-primary'
                        : 'bg-bg-app text-text-secondary border-border-brand hover:text-text-primary'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <IconComponent
                        size={16}
                        className={isSelected ? 'text-accent-brand' : 'text-text-secondary'}
                      />
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-brand animate-pulse" />
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-semibold block">{opt.label}</span>
                      <span className="text-[10px] text-text-secondary line-clamp-1">
                        {opt.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Ambient Volume Slider */}
            <div className="flex items-center gap-3 p-3 bg-bg-surface/40 border border-border-brand/40 rounded-xl">
              <div className="flex items-center gap-1.5 shrink-0 w-24">
                {config.ambientVolume === 0 ? (
                  <VolumeX size={14} className="text-text-secondary" />
                ) : (
                  <Volume2 size={14} className="text-accent-brand" />
                )}
                <label className="text-xs font-semibold text-text-primary">
                  {config.ambientVolume}%
                </label>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={config.ambientVolume}
                onChange={(e) => updateConfig({ ambientVolume: parseInt(e.target.value, 10) })}
                className="flex-1 accent-accent-brand cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
