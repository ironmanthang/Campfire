import { useState, useRef, useEffect } from "react";

interface ResizerOptions {
  key: string;
  defaultVal: number;
  mode: "px" | "percent";
  min?: number;
  max?: number;
  snapThreshold?: number;
  /**
   * How much the tracked value changes per pixel of cursor movement in px mode.
   * Defaults to 2 to preserve the original side-pane behavior (the divider sits
   * in the middle of the screen, so the cursor moving `dx` changes the pane's
   * width by `2 * dx`).
   * Pass 1 when the resize handle is on the outer edge of the element being
   * resized (e.g. a modal's right edge) — cursor moves `dx`, width changes by
   * `dx`.
   */
  multiplier?: number;
}

export function useResizer({ key, defaultVal, mode, min, max, snapThreshold, multiplier }: ResizerOptions) {
  const computedMin = min !== undefined ? min : (mode === "px" ? 480 : 20);
  const computedMax = max !== undefined ? max : (mode === "px" ? 1800 : 80);
  const computedMultiplier = multiplier ?? 2;

  const [value, setValue] = useState(() => {
    const saved = localStorage.getItem(key);
    return saved ? parseFloat(saved) : defaultVal;
  });

  const dragInfo = useRef<{ 
    active: boolean; 
    side: "left" | "right"; 
    startX: number; 
    startVal: number;
    parentWidth: number;
  }>({
    active: false,
    side: "right",
    startX: 0,
    startVal: defaultVal,
    parentWidth: 0,
  });

  const startDrag = (e: React.MouseEvent, side: "left" | "right" = "right") => {
    e.preventDefault();
    const handleElement = e.currentTarget as HTMLElement;
    const parentElement = handleElement.parentElement;
    const parentWidth = parentElement ? parentElement.getBoundingClientRect().width : window.innerWidth;

    dragInfo.current = {
      active: true,
      side,
      startX: e.clientX,
      startVal: value,
      parentWidth,
    };
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragInfo.current.active) return;
      const { side, startX, startVal, parentWidth } = dragInfo.current;
      const dx = e.clientX - startX;

      let newVal = startVal;
      if (mode === "px") {
        if (side === "right") {
          newVal = startVal + dx * computedMultiplier;
        } else {
          newVal = startVal - dx * computedMultiplier;
        }
        const clamped = Math.max(computedMin, Math.min(newVal, window.innerWidth - 80));
        setValue(clamped);
        localStorage.setItem(key, String(clamped));
      } else {
        // Percent mode
        const totalWidth = parentWidth > 0 ? parentWidth : window.innerWidth;
        if (totalWidth > 0) {
          const dPercent = (dx / totalWidth) * 100;
          let newVal = startVal + dPercent;
          
          if (snapThreshold !== undefined) {
            if (newVal < computedMin + snapThreshold) {
              newVal = computedMin;
            } else if (newVal > computedMax - snapThreshold) {
              newVal = computedMax;
            } else {
              newVal = Math.max(computedMin, Math.min(newVal, computedMax));
            }
          } else {
            newVal = Math.max(computedMin, Math.min(newVal, computedMax));
          }
          
          setValue(newVal);
          localStorage.setItem(key, String(newVal));
        }
      }
    };

    const handleMouseUp = () => {
      if (dragInfo.current.active) {
        dragInfo.current.active = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [value, mode, key, computedMin, computedMax, computedMultiplier]);

  const reset = () => {
    setValue(defaultVal);
    localStorage.setItem(key, String(defaultVal));
  };

  return [value, startDrag, reset] as const;
}
