import { Heart } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";

export function FallingHearts() {
  const hearts = useAppStore((s) => s.hearts);
  const removeHeart = useAppStore((s) => s.removeHeart);
  const customImage = useAppStore((s) => s.config.heart_custom_image);

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
      {hearts.map((h) => {
        // When a custom image is configured, render the image and apply the
        // `.falling-heart--image` class so the warm-red aura in `index.css`
        // is stripped (the user's image should render as-is, not tinted red).
        // When no custom image is set, fall back to the default red heart
        // icon with the aura applied.
        const useImage = !!customImage;
        return (
          <span
            key={h.id}
            className={useImage ? "falling-heart falling-heart--image" : "falling-heart"}
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
            {useImage ? (
              <img
                src={customImage}
                alt=""
                draggable={false}
                style={{
                  width: h.size,
                  height: h.size,
                  objectFit: "contain",
                  display: "block",
                  pointerEvents: "none",
                }}
              />
            ) : (
              <Heart
                style={{ width: h.size, height: h.size }}
                fill="currentColor"
              />
            )}
          </span>
        );
      })}
    </div>
  );
}
