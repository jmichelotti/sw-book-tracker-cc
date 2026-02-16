import axios from "axios";
import type {
  Author,
  AuthorWithBooks,
  BookRead,
  BookSearchFilters,
  CharacterBookFilters,
  CharacterDetail,
  CharacterSearchFilters,
  PaginatedBooks,
  PaginatedCharacters,
  Series,
  SeriesWithBooks,
  TagBrief,
} from "./types";

const api = axios.create({
  baseURL: "/api/v1",
});

// Books
export async function searchBooks(filters: BookSearchFilters): Promise<PaginatedBooks> {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== "")
  );
  const { data } = await api.get("/books", { params });
  return data;
}

export async function getBook(id: number): Promise<BookRead> {
  const { data } = await api.get(`/books/${id}`);
  return data;
}

export async function createBook(book: Record<string, unknown>): Promise<BookRead> {
  const { data } = await api.post("/books", book);
  return data;
}

export async function updateBook(id: number, book: Record<string, unknown>): Promise<BookRead> {
  const { data } = await api.put(`/books/${id}`, book);
  return data;
}

export async function deleteBook(id: number): Promise<void> {
  await api.delete(`/books/${id}`);
}

export async function updateBookStatus(id: number, reading_status: string): Promise<BookRead> {
  const { data } = await api.patch(`/books/${id}/status`, { reading_status });
  return data;
}

export async function updateBookOwned(id: number, owned: boolean): Promise<BookRead> {
  const { data } = await api.patch(`/books/${id}/owned`, { owned });
  return data;
}

// Authors
export async function listAuthors(): Promise<Author[]> {
  const { data } = await api.get("/authors");
  return data;
}

export async function getAuthor(id: number): Promise<AuthorWithBooks> {
  const { data } = await api.get(`/authors/${id}`);
  return data;
}

export async function createAuthor(author: { name: string; bio?: string }): Promise<Author> {
  const { data } = await api.post("/authors", author);
  return data;
}

// Series
export async function listSeries(): Promise<Series[]> {
  const { data } = await api.get("/series");
  return data;
}

export async function getSeries(id: number): Promise<SeriesWithBooks> {
  const { data } = await api.get(`/series/${id}`);
  return data;
}

export async function createSeries(series: { name: string; description?: string }): Promise<Series> {
  const { data } = await api.post("/series", series);
  return data;
}

// Characters
export async function searchCharacters(filters: CharacterSearchFilters): Promise<PaginatedCharacters> {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== "")
  );
  const { data } = await api.get("/characters/search", { params });
  return data;
}

export async function getCharacter(id: number, filters?: CharacterBookFilters): Promise<CharacterDetail> {
  const params = filters
    ? Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== undefined && v !== "")
      )
    : {};
  const { data } = await api.get(`/characters/${id}`, { params });
  return data;
}

// Tags
export async function listTags(category?: string): Promise<TagBrief[]> {
  const { data } = await api.get("/tags", { params: category ? { category } : {} });
  return data;
}

export default api;
