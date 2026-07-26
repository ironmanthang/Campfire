import React from 'react';
import { Heart } from 'lucide-react';
import { type FallingHeart } from '../../hooks/useFallingHearts';

interface FallingHeartsProps {
  hearts: FallingHeart[];
  onRemoveHeart: (id: number) => void;
  customImage: string | null;
}

const _dbgToast = (msg: string, color = '#0f0') => {
  const el = document.createElement('div');
  el.textContent = `[FallingHearts] ${msg}`;
  Object.assign(el.style, {
    position: 'fixed', top: '90px', left: '8px', right: '8px',
    padding: '6px 10px', background: 'rgba(0,0,0,0.88)', color,
    fontSize: '11px', fontFamily: 'monospace', borderRadius: '8px',
    zIndex: '99999', pointerEvents: 'none', whiteSpace: 'pre-wrap',
  });
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
};

export const FallingHearts: React.FC<FallingHeartsProps> = ({
  hearts,
  onRemoveHeart,
  customImage,
}) => {
  if (hearts.length === 0) return null;

  _dbgToast(`Rendering ${hearts.length} active hearts`, '#0ff');

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
            ['--fall-rotation' as any]: `${h.rotation * 6}deg`,
            animationDuration: `${h.durationMs}ms`,
          } as React.CSSProperties}
          onAnimationStart={() => {
            _dbgToast(`animStart id=${h.id} dur=${h.durationMs}ms x=${h.x.toFixed(0)}`);
          }}
          onAnimationEnd={(e) => {
            const elapsed = e.nativeEvent.elapsedTime;
            _dbgToast(`animEnd id=${h.id} elapsed=${elapsed.toFixed(2)}s expected=${(h.durationMs/1000).toFixed(1)}s`, elapsed < 0.5 ? '#f00' : '#0f0');
            // If animationend fired prematurely (< 0.5s), don't kill heart instantly
            if (elapsed >= 0.5 || !e.nativeEvent.elapsedTime) {
              onRemoveHeart(h.id);
            }
          }}
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
              className="text-red-500 fill-red-500 stroke-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.65)]"
            />
          )}
        </span>
      ))}
    </div>
  );
};
