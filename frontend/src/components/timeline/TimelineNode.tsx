import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import type { TimelineBook, HoverMode } from "./types";

const NODE_W = 40;
const NODE_H = 56;
const STACK_H = 64; // NODE_H + gap between stacked nodes

function formatYear(year: number): string {
  return year > 0 ? `${year} ABY` : `${Math.abs(year)} BBY`;
}

interface Props {
  book: TimelineBook;
  x: number;
  stackIndex: number;
  hoverMode: HoverMode;
}

export function TimelineNode({ book, x, stackIndex, hoverMode }: Props) {
  const [hovered, setHovered] = useState(false);

  const isCanon = book.canon_or_legends === "canon";
  const borderColor = isCanon ? "border-blue-500" : "border-amber-500";
  const isRead = book.reading_status === "read";
  const isReading = book.reading_status === "reading";
  const borderStyle = isReading ? "border-dashed" : "border-solid";
  const opacity = !isRead && !isReading ? "opacity-50" : "";

  const showImageInNode = hoverMode !== "image_hover";

  const popupContent = (() => {
    switch (hoverMode) {
      case "title_year":
        return (
          <>
            <div className="font-medium text-sm leading-tight">{book.title}</div>
            <div className="text-xs text-muted-foreground">{formatYear(book.timeline_year)}</div>
          </>
        );
      case "title_author":
        return (
          <>
            <div className="font-medium text-sm leading-tight">{book.title}</div>
            {book.author_name && (
              <div className="text-xs text-muted-foreground">{book.author_name}</div>
            )}
          </>
        );
      case "image_hover":
        return (
          <>
            {book.cover_url ? (
              <img src={book.cover_url} alt={book.title} className="w-20 h-28 object-cover rounded mb-1" />
            ) : (
              <div className="w-20 h-28 bg-muted rounded flex items-center justify-center mb-1">
                <BookOpen className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="font-medium text-xs leading-tight">{book.title}</div>
          </>
        );
      case "image_always":
        return (
          <>
            <div className="font-medium text-sm leading-tight">{book.title}</div>
            <div className="text-xs text-muted-foreground">{formatYear(book.timeline_year)}</div>
          </>
        );
    }
  })();

  return (
    <div
      className="absolute"
      style={{
        left: x,
        bottom: 8 + stackIndex * STACK_H,
        width: NODE_W,
        height: NODE_H,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link to={`/books/${book.id}`}>
        <div
          className={`w-full h-full rounded border-2 ${borderColor} ${borderStyle} ${opacity} overflow-hidden bg-muted transition-opacity`}
        >
          {showImageInNode && book.cover_url ? (
            <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
          ) : showImageInNode ? (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </div>
          ) : (
            <div className={`w-full h-full rounded-full ${isCanon ? "bg-blue-500" : "bg-amber-500"} ${opacity}`} />
          )}
        </div>
      </Link>

      {hovered && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
          <div className="bg-popover text-popover-foreground border rounded-md shadow-md p-2 whitespace-nowrap max-w-56">
            {popupContent}
          </div>
        </div>
      )}
    </div>
  );
}
