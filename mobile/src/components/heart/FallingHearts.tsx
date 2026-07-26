import React from 'react';
import { Heart } from 'lucide-react';
import { type FallingHeart } from '../../hooks/useFallingHearts';

interface FallingHeartsProps {
  hearts: FallingHeart[];
  onRemoveHeart: (id: number) => void;
  customImage: string | null;
}

export const FallingHearts: React.FC<FallingHeartsProps> = ({
  hearts,
  onRemoveHeart,
  customImage,
}) => {
  if (hearts.length === 0) return null;

  const useImage = !!customImage;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 55,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
      aria-hidden="true"
    >
      {hearts.map((h) => (
        <span
          key={h.id}
          className={useImage ? 'falling-heart falling-heart--image' : 'falling-heart'}
          style={{
            left: `${h.x}px`,
            width: `${h.size}px`,
            height: `${h.size}px`,
            ['--fall-drift' as any]: `${h.driftX}px`,
            ['--fall-rotation' as any]: `${h.rotation}deg`,
            animationDuration: `${h.durationMs}ms`,
          } as React.CSSProperties}
          onAnimationEnd={() => onRemoveHeart(h.id)}
        >
          {useImage ? (
            <img
              src={customImage}
              alt=""
              draggable={false}
              style={{
                width: h.size,
                height: h.size,
                objectFit: 'contain',
                display: 'block',
                pointerEvents: 'none',
              }}
            />
          ) : (
            <Heart
              style={{ width: h.size, height: h.size }}
              fill="currentColor"
            />
          )}
        </span>
      ))}
    </div>
  );
};
