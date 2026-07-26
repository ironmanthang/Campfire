import { useState, useCallback } from 'react';


export interface FallingHeart {
  id: number;
  x: number;
  size: number;
  speed: number;
  durationMs: number;
  driftX: number;
  rotation: number;
}

let heartRainTimeout: ReturnType<typeof setTimeout> | null = null;
let heartRainStopTimeout: ReturnType<typeof setTimeout> | null = null;
let heartIdCounter = 0;

const _dbgToast = (msg: string) => {
  const el = document.createElement('div');
  el.textContent = `[useFallingHearts] ${msg}`;
  Object.assign(el.style, {
    position: 'fixed', top: '130px', left: '8px', right: '8px',
    padding: '6px 10px', background: 'rgba(0,0,0,0.88)', color: '#ff0',
    fontSize: '11px', fontFamily: 'monospace', borderRadius: '8px',
    zIndex: '99999', pointerEvents: 'none', whiteSpace: 'pre-wrap',
  });
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
};

export function useFallingHearts() {
  const [hearts, setHearts] = useState<FallingHeart[]>([]);

  const removeHeart = useCallback((id: number) => {
    setHearts((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const fireHearts = useCallback((count: number = 1) => {
    const speedSetting = parseInt(localStorage.getItem('campfire_mobile_heart_fall_speed') || '5', 10);
    const sizeSetting = parseInt(localStorage.getItem('campfire_mobile_heart_size') || '48', 10);
    
    setHearts((prev) => {
      const max = 50;
      const room = Math.max(0, max - prev.length);
      const toAdd = Math.min(count, room);
      if (toAdd <= 0) return prev;

      const newHearts: FallingHeart[] = [];
      const durationMs = Math.round(6000 - (speedSetting - 1) * (4800 / 9));
      const vw = typeof window !== 'undefined' ? window.innerWidth : 375;

      for (let i = 0; i < toAdd; i++) {
        heartIdCounter += 1;
        const newId = Date.now() + heartIdCounter;
        newHearts.push({
          id: newId,
          x: Math.random() * Math.max(0, vw - sizeSetting),
          size: sizeSetting,
          speed: speedSetting,
          durationMs,
          driftX: (Math.random() - 0.5) * 80,
          rotation: (Math.random() - 0.5) * 120,
        });

        // Safety fallback timer to clean up heart after duration + 1s if onAnimationEnd fails
        setTimeout(() => {
          setHearts((current) => current.filter((h) => h.id !== newId));
        }, durationMs + 1000);
      }

      const updated = [...prev, ...newHearts];
      _dbgToast(`fireHearts count=${count} added=${toAdd} total=${updated.length}`);
      return updated;
    });
  }, []);

  const startHeartRain = useCallback((durationMs: number = 5000) => {
    if (durationMs <= 0) return;

    _dbgToast(`startHeartRain(${durationMs}ms)`);

    if (heartRainTimeout) {
      clearTimeout(heartRainTimeout);
      heartRainTimeout = null;
    }
    if (heartRainStopTimeout) {
      clearTimeout(heartRainStopTimeout);
      heartRainStopTimeout = null;
    }

    fireHearts(1);

    const scheduleNext = () => {
      const delay = 300 + Math.floor(Math.random() * 201);
      heartRainTimeout = setTimeout(() => {
        heartRainTimeout = null;
        fireHearts(1);
        scheduleNext();
      }, delay);
    };
    scheduleNext();

    heartRainStopTimeout = setTimeout(() => {
      if (heartRainTimeout) {
        clearTimeout(heartRainTimeout);
        heartRainTimeout = null;
      }
      heartRainStopTimeout = null;
    }, durationMs);
  }, [fireHearts]);

  return {
    hearts,
    fireHearts,
    removeHeart,
    startHeartRain,
  };
}
