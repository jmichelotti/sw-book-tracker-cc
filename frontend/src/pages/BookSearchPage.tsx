import { useCallback, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, BookOpen, BookCheck, BookX, ChevronLeft, ChevronRight } from "lucide-react";
import { searchBooks } from "@/lib/api";
import type { BookSearchFilters, CanonStatus, ReadingStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_ICONS = {
  unread: BookX,
  reading: BookOpen,
  read: BookCheck,
};

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

      {/* Filters */}
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

      <div className="flex flex-wrap items-center gap-3">
        {/* Canon / Legends filter */}
        <div className="flex rounded-md border overflow-hidden">
          <button
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              filters.canon_status === "canon"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-muted"
            }`}
            onClick={() => setFilter("canon_status", filters.canon_status === "canon" ? undefined : "canon")}
          >
            Canon
          </button>
          <button
            className={`px-3 py-1.5 text-sm font-medium border-l transition-colors ${
              filters.canon_status === "legends"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-muted"
            }`}
            onClick={() => setFilter("canon_status", filters.canon_status === "legends" ? undefined : "legends")}
          >
            Legends
          </button>
        </div>

        {/* Reading status filter */}
        <div className="flex rounded-md border overflow-hidden">
          {(["unread", "reading", "read"] as const).map((status, i) => (
            <button
              key={status}
              className={`px-3 py-1.5 text-sm font-medium capitalize transition-colors ${i > 0 ? "border-l" : ""} ${
                filters.reading_status === status
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted"
              }`}
              onClick={() => setFilter("reading_status", filters.reading_status === status ? undefined : status)}
            >
              {status}
            </button>
          ))}
        </div>

        <Select
          value={filters.order_by}
          onValueChange={(v) => setFilter("order_by", v)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="title">Title</SelectItem>
            <SelectItem value="timeline_year">Timeline</SelectItem>
            <SelectItem value="publication_date">Published</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.order_dir}
          onValueChange={(v) => setFilter("order_dir", v)}
        >
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Asc</SelectItem>
            <SelectItem value="desc">Desc</SelectItem>
          </SelectContent>
        </Select>

        {/* Timeline year filter with BBY/ABY selectors */}
        <div className="flex items-center gap-2">
          <div className="flex">
            <Input
              type="number"
              min={0}
              placeholder="From"
              className="w-[80px] rounded-r-none"
              defaultValue={
                filters.timeline_year_min !== undefined
                  ? Math.abs(filters.timeline_year_min)
                  : ""
              }
              onChange={(e) => {
                const raw = e.target.value;
                if (!raw) {
                  setFilter("timeline_year_min", undefined);
                  return;
                }
                const num = Number(raw);
                const era = searchParams.get("era_min") || "BBY";
                setFilter("timeline_year_min", String(era === "BBY" ? -num : num));
              }}
            />
            <Select
              value={searchParams.get("era_min") || "BBY"}
              onValueChange={(era) => {
                const raw = searchParams.get("timeline_year_min");
                if (raw) {
                  const num = Math.abs(Number(raw));
                  setFilter("timeline_year_min", String(era === "BBY" ? -num : num));
                }
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev);
                  next.set("era_min", era);
                  return next;
                });
              }}
            >
              <SelectTrigger className="w-[80px] rounded-l-none border-l-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BBY">BBY</SelectItem>
                <SelectItem value="ABY">ABY</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <span className="text-muted-foreground">to</span>
          <div className="flex">
            <Input
              type="number"
              min={0}
              placeholder="To"
              className="w-[80px] rounded-r-none"
              defaultValue={
                filters.timeline_year_max !== undefined
                  ? Math.abs(filters.timeline_year_max)
                  : ""
              }
              onChange={(e) => {
                const raw = e.target.value;
                if (!raw) {
                  setFilter("timeline_year_max", undefined);
                  return;
                }
                const num = Number(raw);
                const era = searchParams.get("era_max") || "ABY";
                setFilter("timeline_year_max", String(era === "BBY" ? -num : num));
              }}
            />
            <Select
              value={searchParams.get("era_max") || "ABY"}
              onValueChange={(era) => {
                const raw = searchParams.get("timeline_year_max");
                if (raw) {
                  const num = Math.abs(Number(raw));
                  setFilter("timeline_year_max", String(era === "BBY" ? -num : num));
                }
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev);
                  next.set("era_max", era);
                  return next;
                });
              }}
            >
              <SelectTrigger className="w-[80px] rounded-l-none border-l-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BBY">BBY</SelectItem>
                <SelectItem value="ABY">ABY</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
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
            {data.items.map((book) => {
              const StatusIcon = STATUS_ICONS[book.reading_status];
              return (
                <Link key={book.id} to={`/books/${book.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold leading-tight">{book.title}</h3>
                        <StatusIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </div>
                      {book.author_name && (
                        <p className="text-sm text-muted-foreground">{book.author_name}</p>
                      )}
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant={book.canon_or_legends === "canon" ? "default" : "secondary"}>
                          {book.canon_or_legends}
                        </Badge>
                        {book.timeline_year !== null && (
                          <Badge variant="outline">
                            {book.timeline_year > 0
                              ? `${book.timeline_year} ABY`
                              : `${Math.abs(book.timeline_year)} BBY`}
                          </Badge>
                        )}
                        {book.owned && <Badge variant="outline">Owned</Badge>}
                      </div>
                      {book.matched_characters.length > 0 && (
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
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={data.page <= 1}
                onClick={() => setPage(data.page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {data.page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={data.page >= totalPages}
                onClick={() => setPage(data.page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      ) : (
        <p className="text-muted-foreground text-center py-12">
          No books found. Try adjusting your filters or add some books.
        </p>
      )}
    </div>
  );
}
