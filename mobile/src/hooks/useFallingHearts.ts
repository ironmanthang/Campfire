import { useState, useCallback } from 'react';
import { DEFAULT_HEART_SIZE } from '../constants/heart';


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

  const fireHearts = useCallback((count: number = 1) => {
    const speedSetting = parseInt(localStorage.getItem('campfire_mobile_heart_fall_speed') || '5', 10);
    const sizeSetting = parseInt(localStorage.getItem('campfire_mobile_heart_size') || String(DEFAULT_HEART_SIZE), 10);
    
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
      return [...prev, ...newHearts];
    });
  }, []);

  const removeHeart = useCallback((id: number) => {
    setHearts((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const startHeartRain = useCallback((durationMs: number = 5000) => {
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
