import React from "react";

interface DragHandlesProps {
  startDrag: (e: React.MouseEvent, side: "left" | "right") => void;
}

export function DragHandles({ startDrag }: DragHandlesProps) {
  return (
    <>
      {/* Left Drag Handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-4 cursor-ew-resize hover:bg-accent-brand/5 z-30 group flex items-center justify-center select-none"
        onMouseDown={(e) => startDrag(e, "left")}
      >
        <div className="w-[2px] h-12 bg-border-brand/20 group-hover:bg-accent-brand/80 rounded transition-colors duration-150 sticky top-1/2 -translate-y-1/2" />
      </div>

      {/* Right Drag Handle */}
      <div
        className="absolute right-0 top-0 bottom-0 w-4 cursor-ew-resize hover:bg-accent-brand/5 z-30 group flex items-center justify-center select-none"
        onMouseDown={(e) => startDrag(e, "right")}
      >
        <div className="w-[2px] h-12 bg-border-brand/20 group-hover:bg-accent-brand/80 rounded transition-colors duration-150 sticky top-1/2 -translate-y-1/2" />
      </div>
    </>
  );
}
