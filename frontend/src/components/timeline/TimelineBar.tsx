import type { PositionedNode, HoverMode } from "./types";
import { TimelineNode } from "./TimelineNode";

interface Props {
  nodes: PositionedNode[];
  hoverMode: HoverMode;
}

export function TimelineBar({ nodes, hoverMode }: Props) {
  const maxStack = nodes.reduce((max, n) => Math.max(max, n.stackIndex), 0);
  const barHeight = (maxStack + 1) * 64 + 16; // STACK_H * stacks + padding

  return (
    <div className="relative" style={{ height: barHeight }}>
      {/* The horizontal bar line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-border rounded" />

      {/* Nodes grow upward from the bar */}
      {nodes.map((node) => (
        <TimelineNode
          key={node.book.id}
          book={node.book}
          x={node.x}
          stackIndex={node.stackIndex}
          hoverMode={hoverMode}
        />
      ))}
    </div>
  );
}
