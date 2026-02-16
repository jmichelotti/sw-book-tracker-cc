import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { getSeries } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function SeriesDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: series, isLoading } = useQuery({
    queryKey: ["series", id],
    queryFn: () => getSeries(Number(id)),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!series) return <p>Series not found.</p>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-2">
        <Link to="/series">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </Link>
      </div>

      <h1 className="text-3xl font-bold">{series.name}</h1>
      {series.description && <p className="text-muted-foreground">{series.description}</p>}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Books in this series</h2>
        {series.books.length > 0 ? (
          <div className="space-y-2">
            {series.books.map((book, i) => (
              <Link key={book.id} to={`/books/${book.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground text-sm w-6">#{i + 1}</span>
                      <span className="font-medium">{book.title}</span>
                    </div>
                    <div className="flex gap-1.5">
                      <Badge variant={book.canon_or_legends === "canon" ? "default" : "secondary"}>
                        {book.canon_or_legends}
                      </Badge>
                      <Badge variant="outline">{book.reading_status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No books in this series yet.</p>
        )}
      </div>
    </div>
  );
}
