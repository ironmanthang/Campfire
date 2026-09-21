import { useEffect } from "react";

export function useTextZoom() {
  useEffect(() => {
    // Load initial zoom level from localStorage
    const savedZoom = localStorage.getItem("text-zoom-level");
    let currentZoom = savedZoom ? parseInt(savedZoom, 10) : 100;
    
    // Apply initial zoom
    document.documentElement.style.fontSize = `${currentZoom}%`;

    const applyZoom = (zoom: number) => {
      document.documentElement.style.fontSize = `${zoom}%`;
      localStorage.setItem("text-zoom-level", zoom.toString());
      window.dispatchEvent(new Event("text-zoom-change"));
    };

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        // Prevent default browser/webview zoom behavior
        e.preventDefault();

        // Determine zoom direction
        const delta = e.deltaY;
        if (delta < 0) {
          // Zoom in
          currentZoom = Math.min(200, currentZoom + 5);
        } else if (delta > 0) {
          // Zoom out
          currentZoom = Math.max(70, currentZoom - 5);
        }

        // Apply and persist zoom level
        applyZoom(currentZoom);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey) {
        if (e.key === "=" || e.key === "+") {
          e.preventDefault();
          currentZoom = Math.min(200, currentZoom + 5);
          applyZoom(currentZoom);
        } else if (e.key === "-") {
          e.preventDefault();
          currentZoom = Math.max(70, currentZoom - 5);
          applyZoom(currentZoom);
        } else if (e.key === "0") {
          e.preventDefault();
          currentZoom = 100;
          applyZoom(currentZoom);
        }
      }
    };

    // Note: { passive: false } is critical to allow preventing the default scroll/zoom event
    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
}
