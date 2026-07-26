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
  
  // Track pointer start and drag distance to differentiate tap vs drag
  const dragInfo = useRef({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    totalDistance: 0,
    activePointerId: null as number | null,
  });

  const containerRef = useRef<HTMLDivElement | null>(null);

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
    const y = Math.max(buffer, containerHeight - buttonHeight - 32);
    if (defaultCorner === 'bottom-left') {
      return { x: buffer, y };
    } else {
      return { x: Math.max(buffer, containerWidth - buttonWidth - buffer), y };
    }
  }, [defaultCorner, buttonWidth, buttonHeight, buffer]);

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

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!position) return;
    
    // Capture pointer for continuous tracking even outside button bounds
    e.currentTarget.setPointerCapture(e.pointerId);

    dragInfo.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
      totalDistance: 0,
      activePointerId: e.pointerId,
    };

    setIsDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDragging || dragInfo.current.activePointerId !== e.pointerId) return;

    const deltaX = e.clientX - dragInfo.current.startX;
    const deltaY = e.clientY - dragInfo.current.startY;

    dragInfo.current.totalDistance = Math.hypot(deltaX, deltaY);

    const newX = dragInfo.current.initialX + deltaX;
    const newY = dragInfo.current.initialY + deltaY;

    setPosition({ x: newX, y: newY });
  };

  const onPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDragging || dragInfo.current.activePointerId !== e.pointerId) return;

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    dragInfo.current.activePointerId = null;
    setIsDragging(false);

    // Apply buffer clamping on release (pushback to safe area with buffer padding)
    const width = containerRef.current?.clientWidth || window.innerWidth;
    const height = containerRef.current?.clientHeight || window.innerHeight;

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
  };

  // Helper to wrap click handlers to ignore clicks that were actually drags (> 6px movement)
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

  return {
    position,
    isDragging,
    containerRef,
    bind: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    },
    handleTap,
  };
}
