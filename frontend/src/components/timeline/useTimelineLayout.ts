import { useMemo } from "react";
import type { TimelineBook, PositionedNode, YearMark } from "./types";

const NODE_W = 40;
const NODE_GAP = 8;
const PADDING = 60;

function pickInterval(range: number): number {
  if (range <= 20) return 1;
  if (range <= 100) return 5;
  if (range <= 500) return 25;
  return 50;
}

function formatYear(year: number): string {
  if (year === 0) return "0 BBY/ABY";
  return year > 0 ? `${year} ABY` : `${Math.abs(year)} BBY`;
}

export function useTimelineLayout(books: TimelineBook[], containerWidth: number) {
  return useMemo(() => {
    if (books.length === 0) {
      return { nodes: [], yearMarks: [], zeroX: 0, contentWidth: containerWidth };
    }

    const sorted = [...books].sort((a, b) => a.timeline_year - b.timeline_year);
    const minYear = sorted[0].timeline_year;
    const maxYear = sorted[sorted.length - 1].timeline_year;
    const yearRange = maxYear - minYear;

    // Minimum content width — at least containerWidth or enough for all nodes
    const minWidth = Math.max(containerWidth, books.length * (NODE_W + NODE_GAP) + PADDING * 2);
    const contentWidth = Math.max(minWidth, 800);

    const usableWidth = contentWidth - PADDING * 2;

    function yearToX(year: number): number {
      if (yearRange === 0) return contentWidth / 2;
      return PADDING + ((year - minYear) / yearRange) * usableWidth;
    }

    // Greedy shelf stacking: assign each node to the lowest shelf where it doesn't overlap
    const nodes: PositionedNode[] = [];
    const shelves: number[] = []; // each shelf tracks the rightmost occupied x

    for (const book of sorted) {
      const x = yearToX(book.timeline_year);
      const rightEdge = x + NODE_W + NODE_GAP;

      let placed = false;
      for (let i = 0; i < shelves.length; i++) {
        if (shelves[i] <= x) {
          shelves[i] = rightEdge;
          nodes.push({ book, x, stackIndex: i });
          placed = true;
          break;
        }
      }
      if (!placed) {
        shelves.push(rightEdge);
        nodes.push({ book, x, stackIndex: shelves.length - 1 });
      }
    }

    // Year marks
    const interval = pickInterval(yearRange);
    const yearMarks: YearMark[] = [];
    const startTick = Math.ceil(minYear / interval) * interval;
    const endTick = Math.floor(maxYear / interval) * interval;

    for (let y = startTick; y <= endTick; y += interval) {
      yearMarks.push({ year: y, x: yearToX(y), label: formatYear(y) });
    }

    // Always include year 0 if in range
    if (minYear <= 0 && maxYear >= 0 && !yearMarks.some((m) => m.year === 0)) {
      yearMarks.push({ year: 0, x: yearToX(0), label: "0 BBY/ABY" });
      yearMarks.sort((a, b) => a.year - b.year);
    }

    const zeroX = minYear <= 0 && maxYear >= 0 ? yearToX(0) : -1;

    return { nodes, yearMarks, zeroX, contentWidth };
  }, [books, containerWidth]);
}
