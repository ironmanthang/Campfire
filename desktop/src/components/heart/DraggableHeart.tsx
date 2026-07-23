import { useEffect, useRef, useState, useCallback } from "react";
import { Heart } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";

interface DraggableHeartProps {
  onClick: () => void;
}

// Duration (ms) of the "click → rain" burst. Mirrors the keyboard-shortcut
// behavior in App.tsx: each click restarts a 5-second rain of falling hearts
// at randomized 300–500 ms intervals, so the screen fills with hearts
// instead of dropping a single one.
const CLICK_RAIN_DURATION_MS = 5000;

const DRAG_THRESHOLD_PX = 5;
const HEART_ICON_INSET = 6; // px slack so heart stays clickable near edges
const SIDEBAR_WIDTH_PX = 256; // matches <aside className="w-64"> in Sidebar.tsx
const SIDEBAR_FOOTER_BOTTOM_INSET_PX = 16; // matches `p-4` on the footer

function getDefaultPosition(size: number): { x: number; y: number } {
  // Anchor: right side of the sidebar footer row (next to the
  // Sun / Bug / Info / Help icons), bottom-aligned with that row.
  if (typeof window === "undefined") return { x: 0, y: 0 };
  return {
    x: SIDEBAR_WIDTH_PX - SIDEBAR_FOOTER_BOTTOM_INSET_PX - size,
    y: window.innerHeight - SIDEBAR_FOOTER_BOTTOM_INSET_PX - size,
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

  // Re-anchor the heart on viewport changes (window resize + Ctrl/zoom).
  // When the heart is at its default position (no persisted override), we
  // recompute the default so it stays glued to the right of the Feature
  // Guide button in the sidebar footer. When the user has dragged it
  // somewhere specific, we scale that position by the viewport ratio so
  // it follows zoom in/out proportionally instead of jumping.
  useEffect(() => {
    let lastW = window.innerWidth;
    let lastH = window.innerHeight;

    const handleResize = () => {
      setPosition((p) => {
        const persisted = config.heart_position;
        if (persisted === null) {
          // At default: re-anchor (e.g. window resize, zoom).
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

    window.addEventListener("resize", handleResize);
    // Ctrl+zoom in WebView2 fires `visualViewport.resize` but not always
    // `window.resize`, so listen to both.
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize);
    }
    return () => {
      window.removeEventListener("resize", handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleResize);
      }
    };
  }, [size, config.heart_position]);

  // Re-clamp when size changes (heart may grow off-screen)
  useEffect(() => {
    setPosition((p) => clampPosition(p, size));
  }, [size]);

  // React to external changes of `config.heart_position` (notably: the user
  // clicked "Reset heart position and size" in Settings). When the persisted
  // value transitions to `null`, snap back to the default anchor next to the
  // Feature Guide button. Without this effect, the in-memory `position` state
  // would stay stale at the last-dragged coordinates — so the reset would
  // clear the config but the heart would not visually move.
  useEffect(() => {
    if (config.heart_position === null) {
      setPosition(clampPosition(getDefaultPosition(size), size));
    } else {
      setPosition(clampPosition(config.heart_position, size));
    }
    // We intentionally depend only on `config.heart_position` and `size` —
    // not on `getDefaultPosition` (stable) or the helper functions above.
  }, [config.heart_position, size]);

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
          // Start a 5-second rain of falling hearts (one spawn every
          // 300–500 ms). Each subsequent click within the window extends
          // the rain for another full 5 s, so the user can keep it going
          // by tapping the heart repeatedly. Matches the keyboard-shortcut
          // behavior in App.tsx.
          startHeartRain(CLICK_RAIN_DURATION_MS);
        } else {
          onClick();
        }
      }
    },
    [clickFalls, fireHearts, onClick, startHeartRain, updateConfigField]
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
