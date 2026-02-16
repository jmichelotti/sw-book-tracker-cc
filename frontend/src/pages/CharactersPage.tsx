import { useCallback, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { searchCharacters } from "@/lib/api";
import type { CharacterSearchFilters } from "@/lib/types";
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
import { SortControls } from "@/components/filters/SortControls";
import { Pagination } from "@/components/filters/Pagination";

const CHARACTER_SORT_OPTIONS = [
  { value: "name", label: "Name" },
  { value: "book_count", label: "Book count" },
];

export function CharactersPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: CharacterSearchFilters = useMemo(
    () => ({
      name: searchParams.get("name") || undefined,
      min_book_count: searchParams.get("min_book_count")
        ? Number(searchParams.get("min_book_count"))
        : undefined,
      page: Number(searchParams.get("page") || 1),
      page_size: 24,
      order_by: searchParams.get("order_by") || "name",
      order_dir: searchParams.get("order_dir") || "asc",
    }),
    [searchParams]
  );

  const { data, isLoading } = useQuery({
    queryKey: ["characters", filters],
    queryFn: () => searchCharacters(filters),
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
      <h1 className="text-2xl font-bold">Characters</h1>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search by name..."
          className="w-[250px]"
          defaultValue={filters.name || ""}
          onChange={(e) => {
            const val = e.target.value;
            if (val.length === 0 || val.length >= 2) setFilter("name", val || undefined);
          }}
        />

        {/* Min book count */}
        <Select
          value={filters.min_book_count?.toString() || "any"}
          onValueChange={(v) => setFilter("min_book_count", v === "any" ? undefined : v)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Book appearances" />
          </SelectTrigger>
          <SelectContent position="popper" sideOffset={4}>
            <SelectItem value="any">Any appearances</SelectItem>
            <SelectItem value="2">2+ books</SelectItem>
            <SelectItem value="5">5+ books</SelectItem>
            <SelectItem value="10">10+ books</SelectItem>
            <SelectItem value="20">20+ books</SelectItem>
          </SelectContent>
        </Select>

        <SortControls
          orderBy={filters.order_by!}
          orderDir={filters.order_dir!}
          onOrderByChange={(v) => setFilter("order_by", v)}
          onOrderDirChange={(v) => setFilter("order_dir", v)}
          sortOptions={CHARACTER_SORT_OPTIONS}
        />
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : data && data.items.length > 0 ? (
        <>
          <p className="text-sm text-muted-foreground">{data.total} characters</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data.items.map((character) => (
              <Link key={character.id} to={`/characters/${character.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-4 space-y-2">
                    <h3 className="font-semibold leading-tight">{character.name}</h3>
                    {character.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {character.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="outline">
                        {character.book_count} {character.book_count === 1 ? "book" : "books"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <Pagination page={data.page} totalPages={totalPages} onPageChange={setPage} />
        </>
      ) : (
        <p className="text-muted-foreground text-center py-12">
          No characters found. Try adjusting your filters.
        </p>
      )}
    </div>
  );
}
