import { useState, useEffect, useRef, useCallback } from 'react';

interface Position {
  x: number;
  y: number;
}

interface UseDraggableButtonOptions {
  storageKey: string;
  defaultCorner: 'bottom-left' | 'bottom-right';
  buttonWidth?: number;
  buttonHeight?: number;
  buffer?: number; // Distance in px from edge after bounce back
}

export function useDraggableButton({
  storageKey,
  defaultCorner,
  buttonWidth = 56,
  buttonHeight = 56,
  buffer = 16,
}: UseDraggableButtonOptions) {
  const [position, setPosition] = useState<Position | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isInertia, setIsInertia] = useState(false);
  
  // Track pointer start, drag distance, velocity & animation state
  const dragInfo = useRef({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    totalDistance: 0,
    activePointerId: null as number | null,
    lastClientX: 0,
    lastClientY: 0,
    lastTime: 0,
    vx: 0,
    vy: 0,
  });

  const animFrameRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const tapCallbackRef = useRef<(() => void) | undefined>(undefined);

  const stopInertia = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setIsInertia(false);
  }, []);

  // Helper to clamp position inside container/viewport bounds with buffer
  const clampPosition = useCallback((pos: Position, containerWidth: number, containerHeight: number): Position => {
    const minX = buffer;
    const maxX = Math.max(buffer, containerWidth - buttonWidth - buffer);
    const minY = buffer;
    const maxY = Math.max(buffer, containerHeight - buttonHeight - buffer);

    return {
      x: Math.min(Math.max(pos.x, minX), maxX),
      y: Math.min(Math.max(pos.y, minY), maxY),
    };
  }, [buffer, buttonWidth, buttonHeight]);

  // Compute default position based on container size and default corner preference
  const getDefaultPosition = useCallback((containerWidth: number, containerHeight: number): Position => {
    const y = Math.max(buffer, containerHeight - buttonHeight - buffer);
    if (defaultCorner === 'bottom-left') {
      return { x: buffer, y };
    } else {
      return { x: Math.max(buffer, containerWidth - buttonWidth - buffer), y };
    }
  }, [defaultCorner, buttonWidth, buttonHeight, buffer]);

  // Cleanup inertia animation on unmount
  useEffect(() => {
    return () => {
      stopInertia();
    };
  }, [stopInertia]);

  // Initialize position from localStorage or default position on mount
  useEffect(() => {
    const updateInitialPosition = () => {
      const width = containerRef.current?.clientWidth || window.innerWidth;
      const height = containerRef.current?.clientHeight || window.innerHeight;

      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
            setPosition(clampPosition(parsed, width, height));
            return;
          }
        } catch {
          // Fall through to default if parse fails
        }
      }

      setPosition(getDefaultPosition(width, height));
    };

    updateInitialPosition();
  }, [storageKey, clampPosition, getDefaultPosition]);

  // Adjust position when container / window resizes
  useEffect(() => {
    const handleResize = () => {
      if (!position) return;
      const width = containerRef.current?.clientWidth || window.innerWidth;
      const height = containerRef.current?.clientHeight || window.innerHeight;
      setPosition((prev) => (prev ? clampPosition(prev, width, height) : null));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [position, clampPosition]);

  const wasPointerEventRef = useRef(false);
  const tapFiredRef = useRef(false);
  const wasDraggedRef = useRef(false);

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!position) return;
    
    // Stop any ongoing inertia motion on touch/press
    stopInertia();

    // Capture pointer for continuous tracking even outside button bounds
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    wasPointerEventRef.current = true;
    tapFiredRef.current = false;
    wasDraggedRef.current = false;

    const now = performance.now();
    dragInfo.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
      totalDistance: 0,
      activePointerId: e.pointerId,
      lastClientX: e.clientX,
      lastClientY: e.clientY,
      lastTime: now,
      vx: 0,
      vy: 0,
    };

    setIsDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (dragInfo.current.activePointerId !== e.pointerId) return;

    const now = performance.now();
    const dt = now - dragInfo.current.lastTime;

    const deltaX = e.clientX - dragInfo.current.startX;
    const deltaY = e.clientY - dragInfo.current.startY;

    dragInfo.current.totalDistance = Math.hypot(deltaX, deltaY);
    if (dragInfo.current.totalDistance > 14) {
      wasDraggedRef.current = true;
    }

    if (dt > 0 && dt < 100) {
      const instVx = (e.clientX - dragInfo.current.lastClientX) / dt;
      const instVy = (e.clientY - dragInfo.current.lastClientY) / dt;
      // Exponential moving average for smooth velocity estimation
      dragInfo.current.vx = dragInfo.current.vx * 0.3 + instVx * 0.7;
      dragInfo.current.vy = dragInfo.current.vy * 0.3 + instVy * 0.7;
    } else if (dt >= 100) {
      // Stopped moving before release
      dragInfo.current.vx = 0;
      dragInfo.current.vy = 0;
    }

    dragInfo.current.lastClientX = e.clientX;
    dragInfo.current.lastClientY = e.clientY;
    dragInfo.current.lastTime = now;

    const newX = dragInfo.current.initialX + deltaX;
    const newY = dragInfo.current.initialY + deltaY;

    setPosition({ x: newX, y: newY });
  };

  const onPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (dragInfo.current.activePointerId !== e.pointerId) return;

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // ignore
    }

    dragInfo.current.activePointerId = null;
    setIsDragging(false);

    // Detect tap (not drag) — fire here instead of onClick because
    // mobile browsers suppress click after setPointerCapture + touch-action:none
    if (dragInfo.current.totalDistance <= 14) {
      tapFiredRef.current = true;
      tapCallbackRef.current?.();
    }

    const width = containerRef.current?.clientWidth || window.innerWidth;
    const height = containerRef.current?.clientHeight || window.innerHeight;

    const minX = buffer;
    const maxX = Math.max(buffer, width - buttonWidth - buffer);
    const minY = buffer;
    const maxY = Math.max(buffer, height - buttonHeight - buffer);

    const now = performance.now();
    const timeSinceLastMove = now - dragInfo.current.lastTime;

    // Reset velocity if user held the pointer still before releasing
    let vx = timeSinceLastMove > 60 ? 0 : dragInfo.current.vx;
    let vy = timeSinceLastMove > 60 ? 0 : dragInfo.current.vy;

    const speed = Math.hypot(vx, vy);

    // If speed is above threshold (0.15 px/ms), start inertial scrolling loop
    if (speed > 0.15 && position) {
      setIsInertia(true);

      let currentX = position.x;
      let currentY = position.y;
      let lastFrameTime = performance.now();

      const runInertia = (frameTime: number) => {
        const frameDt = Math.min(frameTime - lastFrameTime, 32);
        lastFrameTime = frameTime;

        // Apply position delta
        currentX += vx * frameDt;
        currentY += vy * frameDt;

        // Apply friction decay (0.92 per 16.6ms)
        const frictionFactor = Math.pow(0.92, frameDt / 16.6);
        vx *= frictionFactor;
        vy *= frictionFactor;

        // Soft bounce off boundaries
        if (currentX < minX) {
          currentX = minX;
          vx = -vx * 0.35;
        } else if (currentX > maxX) {
          currentX = maxX;
          vx = -vx * 0.35;
        }

        if (currentY < minY) {
          currentY = minY;
          vy = -vy * 0.35;
        } else if (currentY > maxY) {
          currentY = maxY;
          vy = -vy * 0.35;
        }

        const currentSpeed = Math.hypot(vx, vy);
        const clamped = { x: currentX, y: currentY };
        setPosition(clamped);

        if (currentSpeed > 0.02) {
          animFrameRef.current = requestAnimationFrame(runInertia);
        } else {
          // Inertia complete - clamp & save final position
          setIsInertia(false);
          animFrameRef.current = null;
          const finalClamped = clampPosition(clamped, width, height);
          setPosition(finalClamped);
          try {
            localStorage.setItem(storageKey, JSON.stringify(finalClamped));
          } catch {
            // Ignore storage errors
          }
        }
      };

      animFrameRef.current = requestAnimationFrame(runInertia);
    } else {
      // Immediate release without flick momentum
      setPosition((currentPos) => {
        if (!currentPos) return null;
        const clamped = clampPosition(currentPos, width, height);
        try {
          localStorage.setItem(storageKey, JSON.stringify(clamped));
        } catch {
          // Ignore localStorage write errors
        }
        return clamped;
      });
    }
  };

  // Register a tap callback — the actual tap is detected in onPointerUp.
  // The returned onClick handler handles keyboard click fallback and prevents
  // double-firing if a pointer tap already handled it.
  const handleTap = (callback?: () => void) => {
    tapCallbackRef.current = callback;
    return (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!tapFiredRef.current && !wasDraggedRef.current) {
        tapFiredRef.current = true;
        tapCallbackRef.current?.();
      }
      tapFiredRef.current = false;
      wasPointerEventRef.current = false;
      wasDraggedRef.current = false;
    };
  };

  const resetPosition = useCallback(() => {
    stopInertia();
    localStorage.removeItem(storageKey);
    const width = containerRef.current?.clientWidth || window.innerWidth;
    const height = containerRef.current?.clientHeight || window.innerHeight;
    setPosition(getDefaultPosition(width, height));
  }, [storageKey, getDefaultPosition, stopInertia]);

  return {
    position,
    isDragging,
    isInertia,
    containerRef,
    resetPosition,
    bind: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    },
    handleTap,
  };
}
