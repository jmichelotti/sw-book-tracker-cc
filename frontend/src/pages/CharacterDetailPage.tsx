import { useCallback, useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { getCharacter } from "@/lib/api";
import type { CanonStatus, CharacterBookFilters, ReadingStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CanonLegendToggle } from "@/components/filters/CanonLegendToggle";
import { ReadingStatusToggle } from "@/components/filters/ReadingStatusToggle";
import { SortControls } from "@/components/filters/SortControls";
import { YearRangeFilter } from "@/components/filters/YearRangeFilter";
import { Pagination } from "@/components/filters/Pagination";
import { BookCard } from "@/components/BookCard";

const BOOK_SORT_OPTIONS = [
  { value: "timeline_year", label: "Timeline" },
  { value: "title", label: "Title" },
  { value: "publication_date", label: "Published" },
];

export function CharacterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: CharacterBookFilters = useMemo(
    () => ({
      canon_status: (searchParams.get("canon_status") as CanonStatus) || undefined,
      reading_status: (searchParams.get("reading_status") as ReadingStatus) || undefined,
      timeline_year_min: searchParams.get("timeline_year_min")
        ? Number(searchParams.get("timeline_year_min"))
        : undefined,
      timeline_year_max: searchParams.get("timeline_year_max")
        ? Number(searchParams.get("timeline_year_max"))
        : undefined,
      order_by: searchParams.get("order_by") || "timeline_year",
      order_dir: searchParams.get("order_dir") || "asc",
      page: Number(searchParams.get("page") || 1),
      page_size: 20,
    }),
    [searchParams]
  );

  const { data: character, isLoading } = useQuery({
    queryKey: ["character", id, filters],
    queryFn: () => getCharacter(Number(id), filters),
    enabled: !!id,
  });

  const setFilter = useCallback(
    (key: string, value: string | undefined) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value) {
          next.set(key, value);
        } else {
          next.delete(key);
        }
        next.set("page", "1");
        return next;
      });
    },
    [setSearchParams]
  );

  const setPage = useCallback(
    (page: number) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("page", String(page));
        return next;
      });
    },
    [setSearchParams]
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!character) {
    return <p className="text-muted-foreground text-center py-12">Character not found.</p>;
  }

  function formatYear(year: number | null) {
    if (year === null) return null;
    return year > 0 ? `${year} ABY` : `${Math.abs(year)} BBY`;
  }

  const totalPages = Math.ceil(character.books_total / character.books_page_size);

  return (
    <div className="space-y-6">
      <Link to="/characters" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to characters
      </Link>

      {/* Header — stable regardless of filters */}
      <div>
        <h1 className="text-2xl font-bold">{character.name}</h1>
        {character.description && (
          <p className="mt-2 text-muted-foreground">{character.description}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Badge variant="outline">
          {character.book_count} {character.book_count === 1 ? "book appearance" : "book appearances"}
        </Badge>
        {character.first_appearance && (
          <Badge variant="secondary">
            First appearance: {character.first_appearance.title}
            {character.first_appearance.timeline_year !== null && (
              <> ({formatYear(character.first_appearance.timeline_year)})</>
            )}
          </Badge>
        )}
      </div>

      {/* Book filters */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Books</h2>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <CanonLegendToggle
            value={filters.canon_status}
            onChange={(v) => setFilter("canon_status", v)}
          />
          <ReadingStatusToggle
            value={filters.reading_status}
            onChange={(v) => setFilter("reading_status", v)}
          />
          <SortControls
            orderBy={filters.order_by!}
            orderDir={filters.order_dir!}
            onOrderByChange={(v) => setFilter("order_by", v)}
            onOrderDirChange={(v) => setFilter("order_dir", v)}
            sortOptions={BOOK_SORT_OPTIONS}
          />
          <YearRangeFilter
            yearMin={filters.timeline_year_min}
            yearMax={filters.timeline_year_max}
            eraMin={searchParams.get("era_min") || "BBY"}
            eraMax={searchParams.get("era_max") || "ABY"}
            onYearMinChange={(v) => setFilter("timeline_year_min", v !== undefined ? String(v) : undefined)}
            onYearMaxChange={(v) => setFilter("timeline_year_max", v !== undefined ? String(v) : undefined)}
            onEraMinChange={(era) => {
              setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                next.set("era_min", era);
                const raw = prev.get("timeline_year_min");
                if (raw) {
                  const num = Math.abs(Number(raw));
                  next.set("timeline_year_min", String(era === "BBY" ? -num : num));
                  next.set("page", "1");
                }
                return next;
              });
            }}
            onEraMaxChange={(era) => {
              setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                next.set("era_max", era);
                const raw = prev.get("timeline_year_max");
                if (raw) {
                  const num = Math.abs(Number(raw));
                  next.set("timeline_year_max", String(era === "BBY" ? -num : num));
                  next.set("page", "1");
                }
                return next;
              });
            }}
          />
        </div>

        {character.books_total > 0 && character.books_total !== character.book_count && (
          <p className="text-sm text-muted-foreground mb-4">
            Showing {character.books_total} of {character.book_count} books
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {character.books.map((book) => (
            <BookCard key={book.id} book={book} showAppearanceTag />
          ))}
        </div>

        {character.books.length === 0 && (
          <p className="text-muted-foreground text-center py-8">
            No books match the current filters.
          </p>
        )}

        <Pagination page={character.books_page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}
