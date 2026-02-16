import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { BookSearchPage } from "@/pages/BookSearchPage";
import { BookDetailPage } from "@/pages/BookDetailPage";
import { BookFormPage } from "@/pages/BookFormPage";
import { CharactersPage } from "@/pages/CharactersPage";
import { CharacterDetailPage } from "@/pages/CharacterDetailPage";
import { SeriesListPage } from "@/pages/SeriesListPage";
import { SeriesDetailPage } from "@/pages/SeriesDetailPage";
import { AuthorsListPage } from "@/pages/AuthorsListPage";
import { AuthorDetailPage } from "@/pages/AuthorDetailPage";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/books" replace />} />
        <Route path="/books" element={<BookSearchPage />} />
        <Route path="/books/new" element={<BookFormPage />} />
        <Route path="/books/:id" element={<BookDetailPage />} />
        <Route path="/books/:id/edit" element={<BookFormPage />} />
        <Route path="/characters" element={<CharactersPage />} />
        <Route path="/characters/:id" element={<CharacterDetailPage />} />
        <Route path="/series" element={<SeriesListPage />} />
        <Route path="/series/:id" element={<SeriesDetailPage />} />
        <Route path="/authors" element={<AuthorsListPage />} />
        <Route path="/authors/:id" element={<AuthorDetailPage />} />
      </Route>
    </Routes>
  );
}

export default App;
