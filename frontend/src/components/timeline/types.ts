import type { BookAppearance } from "@/lib/types";

/** A book that has a non-null timeline_year — required for timeline placement. */
export type TimelineBook = BookAppearance & { timeline_year: number };

export type HoverMode = "title_year" | "title_author" | "image_hover" | "image_always";

export interface PositionedNode {
  book: TimelineBook;
  x: number;
  stackIndex: number;
}

export interface YearMark {
  year: number;
  x: number;
  label: string;
}
