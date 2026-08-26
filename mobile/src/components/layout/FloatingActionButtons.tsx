import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Heart } from 'lucide-react';
import { useDraggableButton } from '../../hooks/useDraggableButton';
import { DEFAULT_HEART_SIZE } from '../../constants/heart';

interface FloatingActionButtonsProps {
  onAddClick: () => void;
  onDonateOpen: () => void;
  onStartHeartRain?: (durationMs?: number) => void;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

export const FloatingActionButtons: React.FC<FloatingActionButtonsProps> = ({
  onAddClick,
  onDonateOpen,
  onStartHeartRain,
  containerRef,
}) => {
  const { t } = useTranslation();

  // Heart Customization State
  const [showDonateHeart, setShowDonateHeart] = useState<boolean>(() => {
    return localStorage.getItem('campfire_mobile_show_donate_heart') !== 'false';
  });
  const [heartClickFalls, setHeartClickFalls] = useState<boolean>(() => {
    return localStorage.getItem('campfire_mobile_heart_click_falls') === 'true';
  });
  const [heartSize, setHeartSize] = useState<number>(() => {
    return parseInt(localStorage.getItem('campfire_mobile_heart_size') || String(DEFAULT_HEART_SIZE), 10);
  });
  const [heartRainDuration, setHeartRainDuration] = useState<number>(() => {
    return parseInt(localStorage.getItem('campfire_mobile_heart_rain_duration') || '5', 10);
  });
  const [customImage, setCustomImage] = useState<string | null>(() => {
    return localStorage.getItem('campfire_mobile_heart_custom_image');
  });

  // Listen for config changes and resets
  useEffect(() => {
    const updateHeartConfig = () => {
      setShowDonateHeart(localStorage.getItem('campfire_mobile_show_donate_heart') !== 'false');
      setHeartClickFalls(localStorage.getItem('campfire_mobile_heart_click_falls') === 'true');
      setHeartSize(parseInt(localStorage.getItem('campfire_mobile_heart_size') || String(DEFAULT_HEART_SIZE), 10));
      setHeartRainDuration(parseInt(localStorage.getItem('campfire_mobile_heart_rain_duration') || '5', 10));
      setCustomImage(localStorage.getItem('campfire_mobile_heart_custom_image'));
    };

    window.addEventListener('heart-config-changed', updateHeartConfig);
    return () => window.removeEventListener('heart-config-changed', updateHeartConfig);
  }, []);

  const donateBtn = useDraggableButton({
    storageKey: 'campfire_mobile_donate_pos',
    defaultCorner: 'bottom-left',
    buttonWidth: heartSize,
    buttonHeight: heartSize,
    buffer: 20,
  });

  const addBtn = useDraggableButton({
    storageKey: 'campfire_mobile_add_pos',
    defaultCorner: 'bottom-right',
    buttonWidth: 56,
    buttonHeight: 56,
    buffer: 20,
  });

  // Connect containerRef if provided
  useEffect(() => {
    if (containerRef?.current) {
      donateBtn.containerRef.current = containerRef.current;
      addBtn.containerRef.current = containerRef.current;
    }
  }, [containerRef, donateBtn, addBtn]);

  // Listen for position reset event
  useEffect(() => {
    const handleReset = () => {
      donateBtn.resetPosition();
    };
    window.addEventListener('heart-reset', handleReset);
    return () => window.removeEventListener('heart-reset', handleReset);
  }, [donateBtn]);

  const handleHeartClick = () => {
    if (heartClickFalls) {
      onStartHeartRain?.(heartRainDuration * 1000);
    } else {
      onDonateOpen();
    }
  };

  return (
    <>
      {/* Floating Donate Heart Button */}
      {showDonateHeart && (
        <button
          {...donateBtn.bind}
          onClick={donateBtn.handleTap(handleHeartClick)}
          style={{
            left: donateBtn.position ? `${donateBtn.position.x}px` : undefined,
            top: donateBtn.position ? `${donateBtn.position.y}px` : undefined,
            width: `${heartSize}px`,
            height: `${heartSize}px`,
            touchAction: 'none',
            opacity: donateBtn.position ? 1 : 0,
          }}
          className={`absolute z-30 flex items-center justify-center cursor-grab active:cursor-grabbing select-none ${
            customImage
              ? ''
              : 'text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.65)] hover:drop-shadow-[0_0_18px_rgba(239,68,68,0.85)]'
          } ${
            donateBtn.isDragging || donateBtn.isInertia
              ? 'transition-none scale-110'
              : 'transition-all duration-300 ease-out hover:scale-110 active:scale-95'
          }`}
          title={t('header.donateTooltip', 'Support me :D')}
          aria-label={t('header.donateTooltip', 'Support me :D')}
        >
          {customImage ? (
            <img
              src={customImage}
              alt=""
              draggable={false}
              className="w-full h-full object-contain pointer-events-none"
            />
          ) : (
            <Heart
              style={{ width: heartSize, height: heartSize }}
              className="fill-red-500 text-red-500 pointer-events-none animate-heartbeat"
            />
          )}
        </button>
      )}

      {/* Floating Action Button (Add / Action) */}
      <button
        {...addBtn.bind}
        onClick={addBtn.handleTap(onAddClick)}
        style={{
          left: addBtn.position ? `${addBtn.position.x}px` : undefined,
          top: addBtn.position ? `${addBtn.position.y}px` : undefined,
          width: '56px',
          height: '56px',
          touchAction: 'none',
          opacity: addBtn.position ? 1 : 0,
        }}
        className={`absolute z-30 w-[56px] h-[56px] rounded-full bg-accent-brand text-bg-app shadow-[0_0_16px] shadow-accent-brand/45 hover:shadow-[0_0_22px] hover:shadow-accent-brand/65 hover:bg-accent-brand-hover flex items-center justify-center cursor-grab active:cursor-grabbing select-none ${
          addBtn.isDragging || addBtn.isInertia
            ? 'transition-none scale-110'
            : 'transition-all duration-300 ease-out hover:scale-105 active:scale-95'
        }`}
        title={t('common.create', 'Add')}
        aria-label={t('common.create', 'Add')}
      >
        <Plus size={26} className="pointer-events-none" />
      </button>
    </>
  );
};
