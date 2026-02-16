import type { CanonStatus } from "@/lib/types";

interface Props {
  value: CanonStatus | undefined;
  onChange: (value: CanonStatus | undefined) => void;
}

export function CanonLegendToggle({ value, onChange }: Props) {
  return (
    <div className="flex rounded-md border overflow-hidden">
      <button
        className={`px-3 py-1.5 text-sm font-medium transition-colors ${
          value === "canon"
            ? "bg-blue-600 text-white shadow-inner"
            : "bg-background text-muted-foreground hover:bg-muted"
        }`}
        onClick={() => onChange(value === "canon" ? undefined : "canon")}
      >
        Canon
      </button>
      <button
        className={`px-3 py-1.5 text-sm font-medium border-l transition-colors ${
          value === "legends"
            ? "bg-blue-600 text-white shadow-inner"
            : "bg-background text-muted-foreground hover:bg-muted"
        }`}
        onClick={() => onChange(value === "legends" ? undefined : "legends")}
      >
        Legends
      </button>
    </div>
  );
}
