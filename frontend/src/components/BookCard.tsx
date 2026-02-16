import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { CanonStatus, ReadingStatus } from "@/lib/types";

interface BookCardData {
  id: number;
  title: string;
  canon_or_legends: CanonStatus;
  timeline_year: number | null;
  author_name?: string | null;
  reading_status?: ReadingStatus;
  owned?: boolean;
  appearance_tag?: string | null;
  matched_characters?: string[];
}

interface Props {
  book: BookCardData;
  showAppearanceTag?: boolean;
  showMatchedCharacters?: boolean;
}

function formatYear(year: number | null) {
  if (year === null) return null;
  return year > 0 ? `${year} ABY` : `${Math.abs(year)} BBY`;
}

export function BookCard({ book, showAppearanceTag, showMatchedCharacters }: Props) {
  return (
    <Link to={`/books/${book.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardContent className="p-4 space-y-2">
          <h3 className="font-semibold leading-tight">{book.title}</h3>
          {book.author_name && (
            <p className="text-sm text-muted-foreground">{book.author_name}</p>
          )}
          <div className="flex flex-wrap gap-1.5">
            <Badge variant={book.canon_or_legends === "canon" ? "default" : "secondary"}>
              {book.canon_or_legends}
            </Badge>
            {book.timeline_year !== null && (
              <Badge variant="outline">{formatYear(book.timeline_year)}</Badge>
            )}
            {book.owned && <Badge variant="outline">Owned</Badge>}
            {showAppearanceTag && book.appearance_tag && (
              <Badge variant="outline" className="bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30 text-xs">
                {book.appearance_tag}
              </Badge>
            )}
          </div>
          {showMatchedCharacters && book.matched_characters && book.matched_characters.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {book.matched_characters.slice(0, 5).map((name) => (
                <Badge key={name} variant="outline" className="bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30 text-xs">
                  {name}
                </Badge>
              ))}
              {book.matched_characters.length > 5 && (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  +{book.matched_characters.length - 5} more
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
