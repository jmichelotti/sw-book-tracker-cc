import { useRef, useMemo } from "react";
import type { BookAppearance } from "@/lib/types";
import type { TimelineBook, HoverMode } from "./types";
import { useTimelineLayout } from "./useTimelineLayout";
import { useTimelineZoom } from "./useTimelineZoom";
import { TimelineBar } from "./TimelineBar";
import { TimelineAxis } from "./TimelineAxis";
import { TimelineControls } from "./TimelineControls";

interface Props {
  books: BookAppearance[];
  hoverMode: HoverMode;
  onHoverModeChange: (mode: HoverMode) => void;
}

export function TimelineView({ books, hoverMode, onHoverModeChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { zoom, zoomIn, zoomOut, zoomReset } = useTimelineZoom(containerRef);

  const timelineBooks = useMemo(
    () => books.filter((b): b is TimelineBook => b.timeline_year !== null),
    [books]
  );
  const skippedCount = books.length - timelineBooks.length;

  // Use a base width for layout calculation; zoom scales the result
  const baseWidth = 1200;
  const { nodes, yearMarks, zeroX, contentWidth } = useTimelineLayout(timelineBooks, baseWidth);

  const maxStack = nodes.reduce((max, n) => Math.max(max, n.stackIndex), 0);
  const barHeight = (maxStack + 1) * 64 + 16;
  const totalHeight = barHeight + 32; // bar + axis labels

  if (books.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        No books match the current filters.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <TimelineControls
          zoom={zoom}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onZoomReset={zoomReset}
          hoverMode={hoverMode}
          onHoverModeChange={onHoverModeChange}
        />
        {skippedCount > 0 && (
          <p className="text-sm text-muted-foreground">
            {skippedCount} {skippedCount === 1 ? "book" : "books"} with unknown year not shown
          </p>
        )}
      </div>

      <div ref={containerRef} className="overflow-x-auto border rounded-lg p-4 pb-8 bg-background">
        <div className="relative" style={{ width: contentWidth * zoom, height: totalHeight }}>
          <TimelineAxis yearMarks={yearMarks.map((m) => ({ ...m, x: m.x * zoom }))} zeroX={zeroX >= 0 ? zeroX * zoom : -1} height={barHeight} />
          <TimelineBar
            nodes={nodes.map((n) => ({ ...n, x: n.x * zoom }))}
            hoverMode={hoverMode}
          />
        </div>
      </div>
    </div>
  );
}
