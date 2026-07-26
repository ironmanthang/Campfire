import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ZoomIn, ZoomOut, Check, RotateCw } from 'lucide-react';
import { useModalBackHandler } from '../../hooks/useModalBackHandler';

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onConfirm: (croppedBase64: string) => void;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onConfirm
}) => {
  const { t } = useTranslation();
  const { handleManualClose } = useModalBackHandler(isOpen, onClose);

  const [zoom, setZoom] = useState(1);
  const [baseScale, setBaseScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Calculate base scale so image fits in crop box when loaded
  const updateBaseScale = (img: HTMLImageElement) => {
    if (img.naturalWidth && img.naturalHeight) {
      const cropBoxSize = 200;
      // Use Math.max so the entire image fits within the 200px crop box by default
      const fitScale = cropBoxSize / Math.max(img.naturalWidth, img.naturalHeight);
      setBaseScale(fitScale);
    }
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    updateBaseScale(e.currentTarget);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  // Reset transform state & compute base scale immediately for cached base64 images
  useEffect(() => {
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });

    if (imageRef.current && imageRef.current.complete && imageRef.current.naturalWidth) {
      updateBaseScale(imageRef.current);
    } else {
      setBaseScale(1);
    }
  }, [imageSrc]);

  if (!isOpen) return null;

  const effectiveScale = baseScale * zoom;


  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX - offset.x,
        y: e.touches[0].clientY - offset.y
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setOffset({
      x: e.touches[0].clientX - dragStartRef.current.x,
      y: e.touches[0].clientY - dragStartRef.current.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleCrop = () => {
    const img = imageRef.current;
    if (!img) return;

    const outputSize = 256; // 256x256 high res logo crop
    const canvas = document.createElement('canvas');
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Crop box size in preview UI is 200px
    const cropBoxSize = 200;

    // Fill background transparently/white if needed
    ctx.clearRect(0, 0, outputSize, outputSize);

    ctx.save();
    // Center canvas context
    ctx.translate(outputSize / 2, outputSize / 2);
    ctx.rotate((rotation * Math.PI) / 180);

    const scaleFactor = outputSize / cropBoxSize;
    ctx.scale(effectiveScale * scaleFactor, effectiveScale * scaleFactor);

    // Draw image centered according to pan offset
    const drawX = (offset.x / effectiveScale) - (img.naturalWidth / 2);
    const drawY = (offset.y / effectiveScale) - (img.naturalHeight / 2);

    ctx.drawImage(img, drawX, drawY);
    ctx.restore();

    const croppedBase64 = canvas.toDataURL('image/png');
    onConfirm(croppedBase64);
    handleManualClose();
  };

  return (
    <div
      onClick={handleManualClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-bg-surface border border-border-brand rounded-2xl p-5 shadow-2xl flex flex-col items-center gap-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between w-full border-b border-border-brand/40 pb-3">
          <h3 className="text-base font-bold text-text-primary">
            {t("settings.cropTitle", { defaultValue: "Crop Logo" })}
          </h3>
          <button
            onClick={handleManualClose}
            className="p-1.5 rounded-xl hover:bg-bg-app transition-colors text-text-secondary cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Interactive Crop Viewport */}
        <div
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative w-[220px] h-[220px] rounded-2xl bg-black/40 overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing border border-border-brand/50 touch-none"
        >
          <img
            ref={imageRef}
            src={imageSrc}
            onLoad={handleImageLoad}
            alt="Crop source"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${effectiveScale}) rotate(${rotation}deg)`,
              maxHeight: 'none',
              maxWidth: 'none',
              userSelect: 'none',
              pointerEvents: 'none'
            }}
            className="transition-transform duration-75"
          />

          {/* Square/Rounded Crop Overlay Guide */}
          <div className="absolute w-[200px] h-[200px] rounded-2xl border-2 border-accent-brand border-dashed shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] pointer-events-none" />
        </div>

        {/* Controls */}
        <div className="w-full space-y-3 pt-1">
          {/* Zoom Slider */}
          <div className="flex items-center gap-3">
            <ZoomOut size={16} className="text-text-secondary shrink-0" />
            <input
              type="range"
              min="0.2"
              max="4"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 accent-accent-brand cursor-pointer h-1.5 bg-bg-app rounded-lg"
            />

            <ZoomIn size={16} className="text-text-secondary shrink-0" />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between gap-2 pt-2">
            <button
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="p-2 px-3 rounded-xl border border-border-brand/40 hover:bg-bg-app text-text-secondary hover:text-text-primary text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RotateCw size={14} />
              <span>{t("settings.cropRotate", { defaultValue: "Rotate" })}</span>
            </button>

            <div className="flex gap-2">
              <button
                onClick={handleManualClose}
                className="px-3.5 py-2 rounded-xl bg-bg-app border border-border-brand hover:border-text-secondary text-xs font-semibold text-text-primary transition-all cursor-pointer"
              >
                {t("common.cancel", { defaultValue: "Cancel" })}
              </button>

              <button
                onClick={handleCrop}
                className="px-4 py-2 rounded-xl bg-accent-brand hover:bg-accent-brand-hover text-xs font-bold text-bg-app shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check size={16} />
                <span>{t("common.confirm", { defaultValue: "Confirm" })}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
