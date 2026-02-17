import { useState, useCallback, useEffect, type RefObject } from "react";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 5.0;
const ZOOM_FACTOR = 1.3;

export function useTimelineZoom(containerRef: RefObject<HTMLDivElement | null>) {
  const [zoom, setZoom] = useState(1.0);

  const zoomIn = useCallback(() => {
    setZoom((z) => Math.min(z * ZOOM_FACTOR, MAX_ZOOM));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((z) => Math.max(z / ZOOM_FACTOR, MIN_ZOOM));
  }, []);

  const zoomReset = useCallback(() => {
    setZoom(1.0);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function handleWheel(e: WheelEvent) {
      if (!e.ctrlKey) return;
      e.preventDefault();
      setZoom((z) => {
        const delta = e.deltaY > 0 ? 1 / ZOOM_FACTOR : ZOOM_FACTOR;
        return Math.min(Math.max(z * delta, MIN_ZOOM), MAX_ZOOM);
      });
    }

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [containerRef]);

  return { zoom, zoomIn, zoomOut, zoomReset };
}
