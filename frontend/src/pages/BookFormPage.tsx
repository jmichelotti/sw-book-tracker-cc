import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { createBook, getBook, listAuthors, updateBook } from "@/lib/api";
import type { CanonStatus, ReadingStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function BookFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    title: "",
    description: "",
    isbn: "",
    page_count: "",
    publication_date: "",
    cover_url: "",
    wookieepedia_url: "",
    canon_or_legends: "canon" as CanonStatus,
    reading_status: "unread" as ReadingStatus,
    owned: false,
    timeline_year: "",
    timeline_year_start: "",
    timeline_year_end: "",
    author_id: "",
  });

  const { data: existing } = useQuery({
    queryKey: ["book", id],
    queryFn: () => getBook(Number(id)),
    enabled: isEdit,
  });

  const { data: authors } = useQuery({
    queryKey: ["authors"],
    queryFn: listAuthors,
  });

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title,
        description: existing.description || "",
        isbn: existing.isbn || "",
        page_count: existing.page_count?.toString() || "",
        publication_date: existing.publication_date || "",
        cover_url: existing.cover_url || "",
        wookieepedia_url: existing.wookieepedia_url || "",
        canon_or_legends: existing.canon_or_legends,
        reading_status: existing.reading_status,
        owned: existing.owned,
        timeline_year: existing.timeline_year?.toString() || "",
        timeline_year_start: existing.timeline_year_start?.toString() || "",
        timeline_year_end: existing.timeline_year_end?.toString() || "",
        author_id: existing.author_id?.toString() || "",
      });
    }
  }, [existing]);

  const mutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      isEdit ? updateBook(Number(id), payload) : createBook(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      toast.success(isEdit ? "Book updated" : "Book created");
      navigate(`/books/${data.id}`);
    },
    onError: () => toast.error("Failed to save book"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      title: form.title,
      description: form.description || null,
      isbn: form.isbn || null,
      page_count: form.page_count ? Number(form.page_count) : null,
      publication_date: form.publication_date || null,
      cover_url: form.cover_url || null,
      wookieepedia_url: form.wookieepedia_url || null,
      canon_or_legends: form.canon_or_legends,
      reading_status: form.reading_status,
      owned: form.owned,
      timeline_year: form.timeline_year ? Number(form.timeline_year) : null,
      timeline_year_start: form.timeline_year_start ? Number(form.timeline_year_start) : null,
      timeline_year_end: form.timeline_year_end ? Number(form.timeline_year_end) : null,
      author_id: form.author_id ? Number(form.author_id) : null,
    };
    mutation.mutate(payload);
  };

  const set = (key: string, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Link to="/books">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{isEdit ? "Edit Book" : "Add Book"}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="title">Title *</Label>
          <Input id="title" value={form.title} onChange={(e) => set("title", e.target.value)} required />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" value={form.description} onChange={(e) => set("description", e.target.value)} rows={4} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Author</Label>
            <Select value={form.author_id} onValueChange={(v) => set("author_id", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select author" />
              </SelectTrigger>
              <SelectContent>
                {authors?.map((a) => (
                  <SelectItem key={a.id} value={a.id.toString()}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Canon Status</Label>
            <Select value={form.canon_or_legends} onValueChange={(v) => set("canon_or_legends", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="canon">Canon</SelectItem>
                <SelectItem value="legends">Legends</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="isbn">ISBN</Label>
            <Input id="isbn" value={form.isbn} onChange={(e) => set("isbn", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="page_count">Pages</Label>
            <Input id="page_count" type="number" value={form.page_count} onChange={(e) => set("page_count", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="publication_date">Publication Date</Label>
            <Input id="publication_date" value={form.publication_date} onChange={(e) => set("publication_date", e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="timeline_year">Timeline Year</Label>
            <Input id="timeline_year" type="number" value={form.timeline_year} onChange={(e) => set("timeline_year", e.target.value)} placeholder="BBY negative" />
          </div>
          <div>
            <Label htmlFor="timeline_year_start">Year Start</Label>
            <Input id="timeline_year_start" type="number" value={form.timeline_year_start} onChange={(e) => set("timeline_year_start", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="timeline_year_end">Year End</Label>
            <Input id="timeline_year_end" type="number" value={form.timeline_year_end} onChange={(e) => set("timeline_year_end", e.target.value)} />
          </div>
        </div>

        <div>
          <Label htmlFor="cover_url">Cover URL</Label>
          <Input id="cover_url" value={form.cover_url} onChange={(e) => set("cover_url", e.target.value)} />
        </div>

        <div>
          <Label htmlFor="wookieepedia_url">Wookieepedia URL</Label>
          <Input id="wookieepedia_url" value={form.wookieepedia_url} onChange={(e) => set("wookieepedia_url", e.target.value)} />
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : isEdit ? "Update Book" : "Create Book"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
