import { LayoutGrid, GanttChart } from "lucide-react";

type ViewMode = "card" | "timeline";

interface Props {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}

export function ViewModeToggle({ value, onChange }: Props) {
  return (
    <div className="flex rounded-md border overflow-hidden">
      <button
        className={`px-3 py-1.5 text-sm font-medium transition-colors inline-flex items-center gap-1.5 ${
          value === "card"
            ? "bg-blue-600 text-white shadow-inner"
            : "bg-background text-muted-foreground hover:bg-muted"
        }`}
        onClick={() => onChange("card")}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        Cards
      </button>
      <button
        className={`px-3 py-1.5 text-sm font-medium border-l transition-colors inline-flex items-center gap-1.5 ${
          value === "timeline"
            ? "bg-blue-600 text-white shadow-inner"
            : "bg-background text-muted-foreground hover:bg-muted"
        }`}
        onClick={() => onChange("timeline")}
      >
        <GanttChart className="h-3.5 w-3.5" />
        Timeline
      </button>
    </div>
  );
}
