import { useState, useEffect, useRef, useCallback } from 'react';

interface Position {
  x: number;
  y: number;
}

interface SavedPosition {
  x: number;
  offsetFromBottom: number;
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

  const isDraggingRef = useRef(false);
  
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

  // Helper to persist position to localStorage using bottom offset
  const savePosition = useCallback((pos: Position, containerHeight: number) => {
    const offsetFromBottom = Math.max(buffer, containerHeight - pos.y - buttonHeight);
    const dataToSave: SavedPosition = {
      x: pos.x,
      offsetFromBottom,
    };
    try {
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    } catch {
      // Ignore storage errors
    }
  }, [buffer, buttonHeight, storageKey]);

  // Helper to calculate target position from localStorage or default
  const getPositionFromSavedOrDefault = useCallback((width: number, height: number): Position => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (typeof parsed.offsetFromBottom === 'number' && typeof parsed.x === 'number') {
          const calculatedY = height - buttonHeight - parsed.offsetFromBottom;
          return clampPosition({ x: parsed.x, y: calculatedY }, width, height);
        }
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          const legacyOffset = Math.max(buffer, height - parsed.y - buttonHeight);
          const calculatedY = height - buttonHeight - legacyOffset;
          return clampPosition({ x: parsed.x, y: calculatedY }, width, height);
        }
      } catch {
        // Fall through to default
      }
    }
    return getDefaultPosition(width, height);
  }, [storageKey, buttonHeight, buffer, clampPosition, getDefaultPosition]);

  // Cleanup inertia animation on unmount
  useEffect(() => {
    return () => {
      stopInertia();
    };
  }, [stopInertia]);

  // Dynamically update & clamp position when container resizes or mounts
  useEffect(() => {
    const updatePosition = () => {
      if (isDraggingRef.current) return;
      const el = containerRef.current;
      const width = el?.clientWidth || window.innerWidth;
      const height = el?.clientHeight || window.innerHeight;
      if (width > 0 && height > 0) {
        setPosition(getPositionFromSavedOrDefault(width, height));
      }
    };

    updatePosition();

    const el = containerRef.current;
    let observer: ResizeObserver | null = null;
    if (el && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        updatePosition();
      });
      observer.observe(el);
    }

    window.addEventListener('resize', updatePosition);
    return () => {
      if (observer && el) {
        observer.unobserve(el);
      }
      window.removeEventListener('resize', updatePosition);
    };
  }, [getPositionFromSavedOrDefault]);

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

    isDraggingRef.current = true;
    setIsDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (dragInfo.current.activePointerId !== e.pointerId) return;

    const now = performance.now();
    const dt = now - dragInfo.current.lastTime;

    const deltaX = e.clientX - dragInfo.current.startX;
    const deltaY = e.clientY - dragInfo.current.startY;

    dragInfo.current.totalDistance = Math.hypot(deltaX, deltaY);

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
    isDraggingRef.current = false;
    setIsDragging(false);

    // Detect tap (not drag) — reset micro drag delta back to initial position before pointer down
    const isTap = dragInfo.current.totalDistance <= 6;
    if (isTap) {
      if (position) {
        setPosition({
          x: dragInfo.current.initialX,
          y: dragInfo.current.initialY,
        });
      }
      return;
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
          savePosition(finalClamped, height);
        }
      };

      animFrameRef.current = requestAnimationFrame(runInertia);
    } else {
      // Immediate release without flick momentum — save dragged position
      setPosition((currentPos) => {
        if (!currentPos) return null;
        const clamped = clampPosition(currentPos, width, height);
        savePosition(clamped, height);
        return clamped;
      });
    }
  };

  // Register a tap callback — fired inside native onClick so mobile browsers
  // treat input.focus() and UI activation as a trusted user gesture.
  const handleTap = (callback?: () => void) => {
    return (e: React.MouseEvent) => {
      if (dragInfo.current.totalDistance > 6) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      callback?.();
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

