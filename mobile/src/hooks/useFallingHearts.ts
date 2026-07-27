import { useState, useCallback } from 'react';

// ========== DEBUG TOAST (reuse from useDraggableButton) ==========
function debugToast(msg: string) {
  let tc = document.querySelector('[style*="z-index: 99999"]') as HTMLDivElement | null;
  if (!tc) {
    tc = document.createElement('div');
    Object.assign(tc.style, {
      position: 'fixed', top: '8px', left: '8px', right: '8px',
      zIndex: '99999', display: 'flex', flexDirection: 'column', gap: '4px',
      pointerEvents: 'none',
    });
    document.body.appendChild(tc);
  }
  const el = document.createElement('div');
  Object.assign(el.style, {
    background: 'rgba(0,0,0,0.85)', color: '#0ff', padding: '6px 10px',
    borderRadius: '6px', fontSize: '11px', fontFamily: 'monospace',
    wordBreak: 'break-all', pointerEvents: 'none',
  });
  el.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  tc.appendChild(el);
  setTimeout(() => { el.remove(); }, 8000);
}
// ==========================================================

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

export function useFallingHearts() {
  const [hearts, setHearts] = useState<FallingHeart[]>([]);

  // DEBUG: log hearts count on every render
  debugToast(`[useFallingHearts RENDER] hearts.length=${hearts.length}`);

  const fireHearts = useCallback((count: number = 1) => {
    const speedSetting = parseInt(localStorage.getItem('campfire_mobile_heart_fall_speed') || '5', 10);
    const sizeSetting = parseInt(localStorage.getItem('campfire_mobile_heart_size') || '48', 10);
    
    debugToast(`fireHearts(${count}) speed=${speedSetting} size=${sizeSetting}`);
    
    setHearts((prev) => {
      const max = 50;
      const room = Math.max(0, max - prev.length);
      const toAdd = Math.min(count, room);
      debugToast(`fireHearts updater: prev=${prev.length} room=${room} toAdd=${toAdd}`);
      if (toAdd <= 0) return prev;

      const newHearts: FallingHeart[] = [];
      const durationMs = Math.round(6000 - (speedSetting - 1) * (4800 / 9));
      const vw = typeof window !== 'undefined' ? window.innerWidth : 375;

      for (let i = 0; i < toAdd; i++) {
        heartIdCounter += 1;
        newHearts.push({
          id: Date.now() + heartIdCounter,
          x: Math.random() * Math.max(0, vw - sizeSetting),
          size: sizeSetting,
          speed: speedSetting,
          durationMs,
          driftX: (Math.random() - 0.5) * 80,
          rotation: (Math.random() - 0.5) * 120,
        });
      }
      debugToast(`fireHearts: adding ${newHearts.length} hearts, new total=${prev.length + newHearts.length}, dur=${durationMs}ms`);
      return [...prev, ...newHearts];
    });
  }, []);

  const removeHeart = useCallback((id: number) => {
    setHearts((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const startHeartRain = useCallback((durationMs: number = 5000) => {
    debugToast(`startHeartRain(${durationMs})`);
    if (durationMs <= 0) return;

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

