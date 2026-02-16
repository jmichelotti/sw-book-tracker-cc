import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listSeries } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function SeriesListPage() {
  const { data: series, isLoading } = useQuery({
    queryKey: ["series"],
    queryFn: listSeries,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Series</h1>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : series && series.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {series.map((s) => (
            <Link key={s.id} to={`/series/${s.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-4">
                  <h3 className="font-semibold">{s.name}</h3>
                  {s.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {s.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-12">No series found.</p>
      )}
    </div>
  );
}
