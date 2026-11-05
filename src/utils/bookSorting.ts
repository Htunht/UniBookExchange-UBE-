import type { Book } from "../services/api";

export type BookSort = "newest" | "price-asc" | "price-desc";

export function sortBooks(books: readonly Book[], sort: BookSort): Book[] {
  return [...books].sort((a, b) => {
    if (sort === "price-asc") {
      return a.price - b.price || b.createdAt.localeCompare(a.createdAt);
    }
    if (sort === "price-desc") {
      return b.price - a.price || b.createdAt.localeCompare(a.createdAt);
    }
    return b.createdAt.localeCompare(a.createdAt);
  });
}
