export type CanonStatus = "canon" | "legends";
export type ReadingStatus = "unread" | "reading" | "read";

export interface BookBrief {
  id: number;
  title: string;
  canon_or_legends: CanonStatus;
  reading_status: ReadingStatus;
  owned: boolean;
  timeline_year: number | null;
  author_name: string | null;
  cover_url: string | null;
  matched_characters: string[];
}

export interface BookRead {
  id: number;
  title: string;
  description: string | null;
  isbn: string | null;
  page_count: number | null;
  publication_date: string | null;
  cover_url: string | null;
  wookieepedia_url: string | null;
  canon_or_legends: CanonStatus;
  reading_status: ReadingStatus;
  owned: boolean;
  timeline_year: number | null;
  timeline_year_start: number | null;
  timeline_year_end: number | null;
  author_id: number | null;
  author_name: string | null;
  series: SeriesBrief[];
  characters: CharacterBrief[];
  tags: TagBrief[];
}

export interface PaginatedBooks {
  items: BookBrief[];
  total: number;
  page: number;
  page_size: number;
}

export interface Author {
  id: number;
  name: string;
  bio: string | null;
}

export interface AuthorWithBooks extends Author {
  books: BookBrief[];
}

export interface Series {
  id: number;
  name: string;
  description: string | null;
}

export interface SeriesBrief {
  id: number;
  name: string;
  order_in_series: number | null;
}

export interface SeriesWithBooks extends Series {
  books: BookBrief[];
}

export interface CharacterBrief {
  id: number;
  name: string;
}

export interface Character {
  id: number;
  name: string;
  description: string | null;
}

export interface CharacterWithBooks extends Character {
  books: BookBrief[];
}

export interface TagBrief {
  id: number;
  tag_name: string;
  category: string | null;
}

export interface NetworkGraph {
  nodes: { id: number; name: string; val: number }[];
  links: { source: number; target: number; value: number }[];
}

export interface BookSearchFilters {
  q?: string;
  author_name?: string;
  character_name?: string;
  series_name?: string;
  canon_status?: CanonStatus;
  reading_status?: ReadingStatus;
  owned?: boolean;
  timeline_year_min?: number;
  timeline_year_max?: number;
  page?: number;
  page_size?: number;
  order_by?: string;
  order_dir?: string;
}
