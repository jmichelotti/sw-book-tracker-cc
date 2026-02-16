import { useCallback, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { searchBooks } from "@/lib/api";
import type { BookSearchFilters, CanonStatus, ReadingStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CanonLegendToggle } from "@/components/filters/CanonLegendToggle";
import { ReadingStatusToggle } from "@/components/filters/ReadingStatusToggle";
import { SortControls } from "@/components/filters/SortControls";
import { YearRangeFilter } from "@/components/filters/YearRangeFilter";
import { Pagination } from "@/components/filters/Pagination";
import { BookCard } from "@/components/BookCard";

const BOOK_SORT_OPTIONS = [
  { value: "title", label: "Title" },
  { value: "timeline_year", label: "Timeline" },
  { value: "publication_date", label: "Published" },
];

export function BookSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: BookSearchFilters = useMemo(
    () => ({
      q: searchParams.get("q") || undefined,
      canon_status: (searchParams.get("canon_status") as CanonStatus) || undefined,
      reading_status: (searchParams.get("reading_status") as ReadingStatus) || undefined,
      author_name: searchParams.get("author_name") || undefined,
      character_name: searchParams.get("character_name") || undefined,
      series_name: searchParams.get("series_name") || undefined,
      timeline_year_min: searchParams.get("timeline_year_min")
        ? Number(searchParams.get("timeline_year_min"))
        : undefined,
      timeline_year_max: searchParams.get("timeline_year_max")
        ? Number(searchParams.get("timeline_year_max"))
        : undefined,
      page: Number(searchParams.get("page") || 1),
      page_size: 20,
      order_by: searchParams.get("order_by") || "title",
      order_dir: searchParams.get("order_dir") || "asc",
    }),
    [searchParams]
  );

  const { data, isLoading } = useQuery({
    queryKey: ["books", filters],
    queryFn: () => searchBooks(filters),
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

  const totalPages = data ? Math.ceil(data.total / data.page_size) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Books</h1>
        <Link to="/books/new">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" /> Add Book
          </Button>
        </Link>
      </div>

      {/* Text filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Input
          placeholder="Search title or description..."
          defaultValue={filters.q || ""}
          onChange={(e) => {
            const val = e.target.value;
            if (val.length === 0 || val.length >= 2) setFilter("q", val || undefined);
          }}
        />
        <Input
          placeholder="Author name..."
          defaultValue={filters.author_name || ""}
          onChange={(e) => setFilter("author_name", e.target.value || undefined)}
        />
        <Input
          placeholder="Character name..."
          defaultValue={filters.character_name || ""}
          onChange={(e) => setFilter("character_name", e.target.value || undefined)}
        />
      </div>

      {/* Toggle + sort filters */}
      <div className="flex flex-wrap items-center gap-3">
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

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : data && data.items.length > 0 ? (
        <>
          <p className="text-sm text-muted-foreground">{data.total} results</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.items.map((book) => (
              <BookCard key={book.id} book={book} showMatchedCharacters />
            ))}
          </div>
          <Pagination page={data.page} totalPages={totalPages} onPageChange={setPage} />
        </>
      ) : (
        <p className="text-muted-foreground text-center py-12">
          No books found. Try adjusting your filters or add some books.
        </p>
      )}
    </div>
  );
}
