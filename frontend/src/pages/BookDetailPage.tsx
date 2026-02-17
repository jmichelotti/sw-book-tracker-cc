import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, Edit, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { getBook, updateBookOwned, updateBookStatus } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: book, isLoading } = useQuery({
    queryKey: ["book", id],
    queryFn: () => getBook(Number(id)),
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => updateBookStatus(Number(id), status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["book", id] });
      toast.success("Reading status updated");
    },
  });

  const ownedMutation = useMutation({
    mutationFn: (owned: boolean) => updateBookOwned(Number(id), owned),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["book", id] });
      toast.success("Owned status updated");
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!book) {
    return <p>Book not found.</p>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-2">
        <Link to="/books">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </Link>
      </div>

      <div className="flex items-start gap-6">
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt={book.title}
            className="w-[200px] rounded-lg shadow-md flex-shrink-0 object-cover"
          />
        ) : (
          <div className="w-[200px] h-[300px] bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
            <BookOpen className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold">{book.title}</h1>
              {book.author_name && (
                <p className="text-lg text-muted-foreground mt-1">
                  by{" "}
                  {book.author_id ? (
                    <Link to={`/authors/${book.author_id}`} className="underline">
                      {book.author_name}
                    </Link>
                  ) : (
                    book.author_name
                  )}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Link to={`/books/${id}/edit`}>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-1" /> Edit
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
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
        {book.tags.map((t) => (
          <Badge key={t.id} variant="outline">
            {t.tag_name}
          </Badge>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {book.publication_date && <p><strong>Published:</strong> {book.publication_date}</p>}
            {book.page_count && <p><strong>Pages:</strong> {book.page_count}</p>}
            {book.isbn && <p><strong>ISBN:</strong> {book.isbn}</p>}
            {book.wookieepedia_url && (
              <a
                href={book.wookieepedia_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary underline"
              >
                Wookieepedia <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {book.timeline_year_start !== null && book.timeline_year_end !== null && (
              <p><strong>Timeline span:</strong> {book.timeline_year_start} to {book.timeline_year_end}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground">Reading Status</label>
              <Select
                value={book.reading_status}
                onValueChange={(v) => statusMutation.mutate(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="reading">Reading</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant={book.owned ? "default" : "outline"}
              size="sm"
              onClick={() => ownedMutation.mutate(!book.owned)}
            >
              {book.owned ? "Owned" : "Not Owned"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {book.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-line">{book.description}</p>
          </CardContent>
        </Card>
      )}

      {book.series.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Series</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {book.series.map((s) => (
                <li key={s.id}>
                  <Link to={`/series/${s.id}`} className="text-sm underline">
                    {s.name}
                  </Link>
                  {s.order_in_series && (
                    <span className="text-muted-foreground text-sm"> (#{s.order_in_series})</span>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {book.characters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Characters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {book.characters.map((c) => (
                <Badge key={c.id} variant="secondary">
                  {c.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
