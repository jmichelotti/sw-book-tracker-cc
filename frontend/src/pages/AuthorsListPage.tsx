import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listAuthors } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export function AuthorsListPage() {
  const { data: authors, isLoading } = useQuery({
    queryKey: ["authors"],
    queryFn: listAuthors,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Authors</h1>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Bio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {authors?.map((a) => (
              <TableRow key={a.id}>
                <TableCell>
                  <Link to={`/authors/${a.id}`} className="font-medium underline">
                    {a.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground truncate max-w-md">
                  {a.bio || "-"}
                </TableCell>
              </TableRow>
            ))}
            {authors?.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground">
                  No authors yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
