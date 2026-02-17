import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { HoverMode } from "./types";

const HOVER_MODE_OPTIONS: { value: HoverMode; label: string }[] = [
  { value: "title_year", label: "Title + Year" },
  { value: "title_author", label: "Title + Author" },
  { value: "image_hover", label: "Image on Hover" },
  { value: "image_always", label: "Always Show Image" },
];

interface Props {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  hoverMode: HoverMode;
  onHoverModeChange: (mode: HoverMode) => void;
}

export function TimelineControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  hoverMode,
  onHoverModeChange,
}: Props) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" onClick={onZoomOut} title="Zoom out">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground w-12 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <Button variant="outline" size="icon" onClick={onZoomIn} title="Zoom in">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={onZoomReset} title="Reset zoom">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      <Select value={hoverMode} onValueChange={(v) => onHoverModeChange(v as HoverMode)}>
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {HOVER_MODE_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
