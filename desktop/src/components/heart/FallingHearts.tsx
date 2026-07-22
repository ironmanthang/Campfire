import { Heart } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";

export function FallingHearts() {
  const hearts = useAppStore((s) => s.hearts);
  const removeHeart = useAppStore((s) => s.removeHeart);

  if (hearts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 55, // above main UI, below draggable heart
        pointerEvents: "none",
        overflow: "hidden",
      }}
      aria-hidden="true"
    >
      {hearts.map((h) => (
        <span
          key={h.id}
          className="falling-heart"
          style={{
            left: `${h.x}px`,
            width: `${h.size}px`,
            height: `${h.size}px`,
            // CSS custom properties consumed by @keyframes falling-heart
            ["--fall-drift" as any]: `${h.driftX}px`,
            ["--fall-rotation" as any]: `${h.rotation}deg`,
            animationDuration: `${h.durationMs}ms`,
          } as React.CSSProperties}
          onAnimationEnd={() => removeHeart(h.id)}
        >
          <Heart
            style={{ width: h.size, height: h.size }}
            fill="currentColor"
          />
        </span>
      ))}
    </div>
  );
}
