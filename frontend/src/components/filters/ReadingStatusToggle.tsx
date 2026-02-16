import type { ReadingStatus } from "@/lib/types";

interface Props {
  value: ReadingStatus | undefined;
  onChange: (value: ReadingStatus | undefined) => void;
}

export function ReadingStatusToggle({ value, onChange }: Props) {
  return (
    <div className="flex rounded-md border overflow-hidden">
      {(["unread", "reading", "read"] as const).map((status, i) => (
        <button
          key={status}
          className={`px-3 py-1.5 text-sm font-medium capitalize transition-colors ${i > 0 ? "border-l" : ""} ${
            value === status
              ? "bg-blue-600 text-white shadow-inner"
              : "bg-background text-muted-foreground hover:bg-muted"
          }`}
          onClick={() => onChange(value === status ? undefined : status)}
        >
          {status}
        </button>
      ))}
    </div>
  );
}
