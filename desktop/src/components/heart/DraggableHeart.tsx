import { useEffect, useRef, useState, useCallback } from "react";
import { Heart } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";

interface DraggableHeartProps {
  onClick: () => void;
}


const DRAG_THRESHOLD_PX = 5;
const HEART_ICON_INSET = 6; // px slack so heart stays clickable near edges
const SIDEBAR_WIDTH_PX = 256; // matches <aside className="w-64"> in Sidebar.tsx
const SIDEBAR_FOOTER_BOTTOM_INSET_PX = 16; // matches `p-4` on the footer

function getAnchorPosition(size: number): { x: number; y: number } | null {
  if (typeof window === "undefined") return null;
  const anchor = document.querySelector("[data-heart-anchor]");
  if (!anchor) return null;
  const rect = anchor.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return null;
  return {
    x: rect.left + (rect.width - size) / 2,
    y: rect.top + (rect.height - size) / 2,
  };
}

function getDefaultPosition(size: number): { x: number; y: number } {
  const anchorPos = getAnchorPosition(size);
  if (anchorPos) return anchorPos;

  if (typeof window === "undefined") return { x: 0, y: 0 };
  const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const zoomScale = rootFontSize / 16;
  return {
    x: SIDEBAR_WIDTH_PX * zoomScale - SIDEBAR_FOOTER_BOTTOM_INSET_PX * zoomScale - size,
    y: window.innerHeight - SIDEBAR_FOOTER_BOTTOM_INSET_PX * zoomScale - size,
  };
}

function clampPosition(pos: { x: number; y: number }, size: number): { x: number; y: number } {
  if (typeof window === "undefined") return pos;
  const minX = HEART_ICON_INSET;
  const minY = HEART_ICON_INSET;
  const maxX = Math.max(minX, window.innerWidth - size - HEART_ICON_INSET);
  const maxY = Math.max(minY, window.innerHeight - size - HEART_ICON_INSET);
  return {
    x: Math.min(Math.max(pos.x, minX), maxX),
    y: Math.min(Math.max(pos.y, minY), maxY),
  };
}

export function DraggableHeart({ onClick }: DraggableHeartProps) {
  const { config, updateConfigField, fireHearts, startHeartRain } = useAppStore();

  const size = config.heart_size;
  const isVisible = config.show_donate_heart;
  const clickFalls = config.heart_click_falls;
  const customImage = config.heart_custom_image;
  const useCustomImage = !!customImage;

  const initialPos = config.heart_position ?? getDefaultPosition(size);
  const [position, setPosition] = useState(() => clampPosition(initialPos, size));
  const [isDragging, setIsDragging] = useState(false);

  // Refs for drag tracking (avoid re-renders during pointer move)
  const dragStateRef = useRef<{
    pointerId: number | null;
    startX: number;
    startY: number;
    baseX: number;
    baseY: number;
    moved: boolean;
  }>({
    pointerId: null,
    startX: 0,
    startY: 0,
    baseX: 0,
    baseY: 0,
    moved: false,
  });

  // Re-anchor the heart on viewport/layout changes (window resize, Ctrl/zoom, sidebar expansion).
  useEffect(() => {
    let lastW = window.innerWidth;
    let lastH = window.innerHeight;

    const updatePos = () => {
      setPosition((p) => {
        const persisted = config.heart_position;
        if (persisted === null) {
          // At default: re-anchor dynamically using DOM element if available
          return clampPosition(getDefaultPosition(size), size);
        }
        // Persisted (user-dragged) position: scale by the viewport delta
        // so zoom-in/out keeps the heart in the same relative spot.
        const newW = window.innerWidth;
        const newH = window.innerHeight;
        if (lastW <= 0 || lastH <= 0 || newW <= 0 || newH <= 0) {
          lastW = newW;
          lastH = newH;
          return clampPosition(p, size);
        }
        const scaled = {
          x: (p.x / lastW) * newW,
          y: (p.y / lastH) * newH,
        };
        lastW = newW;
        lastH = newH;
        return clampPosition(scaled, size);
      });
    };

    updatePos();
    // Schedule a double update after initial layout & DOM render settles
    const rafId = requestAnimationFrame(updatePos);
    const timerId = setTimeout(updatePos, 100);

    window.addEventListener("resize", updatePos);
    window.addEventListener("text-zoom-change", updatePos);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", updatePos);
    }

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => {
        updatePos();
      });
      const anchor = document.querySelector("[data-heart-anchor]") || document.body;
      observer.observe(anchor);
    }

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timerId);
      window.removeEventListener("resize", updatePos);
      window.removeEventListener("text-zoom-change", updatePos);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", updatePos);
      }
      if (observer) {
        observer.disconnect();
      }
    };
  }, [size, config.heart_position]);

  // Re-clamp when size changes (heart may grow off-screen)
  useEffect(() => {
    setPosition((p) => clampPosition(p, size));
  }, [size]);

  // React to external changes of `config.heart_position`. When it transitions
  // to a specific value (drag-persisted), apply it. When null, snap to anchor.
  // Note: this effect does NOT fire when position was already null and reset is
  // clicked — that case is handled by the 'heart-reset' event below.
  useEffect(() => {
    if (config.heart_position === null) {
      setPosition(clampPosition(getDefaultPosition(size), size));
    } else {
      setPosition(clampPosition(config.heart_position, size));
    }
  }, [config.heart_position, size]);

  // Force-snap to the anchor whenever the Reset button is pressed, even when
  // heart_position was already null (no state change → no useEffect re-run).
  useEffect(() => {
    const handleHeartReset = () => {
      setPosition(clampPosition(getDefaultPosition(size), size));
    };
    window.addEventListener("heart-reset", handleHeartReset);
    return () => window.removeEventListener("heart-reset", handleHeartReset);
  }, [size]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      // Only respond to primary button (left click / touch / pen)
      if (e.button !== 0) return;
      e.preventDefault();
      dragStateRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        baseX: position.x,
        baseY: position.y,
        moved: false,
      };
      (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
    },
    [position.x, position.y]
  );

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    const ds = dragStateRef.current;
    if (ds.pointerId !== e.pointerId) return;
    const dx = e.clientX - ds.startX;
    const dy = e.clientY - ds.startY;
    if (!ds.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
    ds.moved = true;
    setIsDragging(true);
    setPosition(clampPosition({ x: ds.baseX + dx, y: ds.baseY + dy }, size));
  }, [size]);

  const handlePointerUp = useCallback(
    async (e: React.PointerEvent<HTMLButtonElement>) => {
      const ds = dragStateRef.current;
      if (ds.pointerId !== e.pointerId) return;
      const wasDragging = ds.moved;
      ds.pointerId = null;
      ds.moved = false;
      setIsDragging(false);
      try {
        (e.currentTarget as HTMLButtonElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      if (wasDragging) {
        // Persist final position
        setPosition((current) => {
          updateConfigField("heart_position", current);
          return current;
        });
      } else {
        // It was a click, not a drag
        if (clickFalls) {
          const durationMs = (config.heart_rain_duration ?? 5) * 1000;
          startHeartRain(durationMs);
        } else {
          onClick();
        }
      }
    },
    [clickFalls, config.heart_rain_duration, fireHearts, onClick, startHeartRain, updateConfigField]
  );

  // Suppress the synthetic onClick that React fires after pointerup when
  // the pointer didn't move enough to trip our drag threshold. The pointer
  // handlers above already invoke `onClick()` / `fireHearts()` for genuine
  // clicks; without this guard every non-drag click would fire twice.
  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (dragStateRef.current.moved) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  if (!isVisible) return null;

  return (
    <button
      type="button"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={handleClick}
      style={{
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size}px`,
        height: `${size}px`,
        zIndex: 60, // above modals (z-50)
        background: "transparent",
        border: "none",
        padding: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        // Disable the native touch callout / text selection on long-press
        WebkitTapHighlightColor: "transparent",
      }}
      className={useCustomImage ? "draggable-heart draggable-heart--image" : "draggable-heart"}
      aria-label="Donation heart"
      title="Drag to move • Click to support"
    >
      {useCustomImage ? (
        <img
          src={customImage}
          alt=""
          draggable={false}
          style={{
            width: size,
            height: size,
            objectFit: "contain",
            display: "block",
            pointerEvents: "none",
          }}
        />
      ) : (
        <Heart
          className="donate-heart animate-heartbeat"
          style={{ width: size, height: size }}
          fill="#ef4444"
        />
      )}
      {isDragging && null}
    </button>
  );
}
