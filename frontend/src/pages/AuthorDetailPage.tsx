import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { getAuthor } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function AuthorDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: author, isLoading } = useQuery({
    queryKey: ["author", id],
    queryFn: () => getAuthor(Number(id)),
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

  if (!author) return <p>Author not found.</p>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-2">
        <Link to="/authors">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </Link>
      </div>

      <h1 className="text-3xl font-bold">{author.name}</h1>
      {author.bio && <p className="text-muted-foreground">{author.bio}</p>}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Books</h2>
        {author.books.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {author.books.map((book) => (
              <Link key={book.id} to={`/books/${book.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-3 space-y-1">
                    <h3 className="font-medium">{book.title}</h3>
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
          <p className="text-muted-foreground">No books by this author.</p>
        )}
      </div>
    </div>
  );
}
