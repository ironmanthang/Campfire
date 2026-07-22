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
  const { config, updateConfigField, fireHearts } = useAppStore();

  const size = config.heart_size;
  const isVisible = config.show_donate_heart;
  const clickFalls = config.heart_click_falls;

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

  // Re-clamp position on window resize so heart can't get stranded
  useEffect(() => {
    const handleResize = () => {
      setPosition((p) => clampPosition(p, size));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [size]);

  // Re-clamp when size changes (heart may grow off-screen)
  useEffect(() => {
    setPosition((p) => clampPosition(p, size));
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
          fireHearts(1);
        } else {
          onClick();
        }
      }
    },
    [clickFalls, fireHearts, onClick, updateConfigField]
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
      className="draggable-heart"
      aria-label="Donation heart"
      title="Drag to move • Click to support"
    >
      <Heart
        className="donate-heart animate-heartbeat"
        style={{ width: size, height: size }}
        fill="#ef4444"
      />
      {isDragging && null}
    </button>
  );
}
