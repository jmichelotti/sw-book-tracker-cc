import type { YearMark } from "./types";

interface Props {
  yearMarks: YearMark[];
  zeroX: number;
  height: number;
}

export function TimelineAxis({ yearMarks, zeroX, height }: Props) {
  return (
    <>
      {/* Year 0 vertical dashed line */}
      {zeroX >= 0 && (
        <div
          className="absolute border-l-2 border-dashed border-muted-foreground/40"
          style={{ left: zeroX, top: 0, height }}
        />
      )}

      {/* Year labels along the bottom */}
      {yearMarks.map((mark) => (
        <div
          key={mark.year}
          className="absolute text-xs text-muted-foreground select-none"
          style={{ left: mark.x, bottom: -20, transform: "translateX(-50%)" }}
        >
          {mark.label}
        </div>
      ))}
    </>
  );
}
