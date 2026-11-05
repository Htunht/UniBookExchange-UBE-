import { describe, expect, it } from "vitest";
import type { Book } from "../services/api";
import { sortBooks } from "./bookSorting";

const makeBook = (id: string, price: number, createdAt: string): Book => ({
  id,
  title: id,
  author: null,
  major: "CEIT",
  year: "1st Year",
  price,
  condition: "Used",
  status: "AVAILABLE",
  description: null,
  imageUrl: null,
  sellerId: "seller",
  createdAt,
});

describe("sortBooks", () => {
  const books = [
    makeBook("older", 100, "2026-01-01T00:00:00.000Z"),
    makeBook("newer", 100, "2026-02-01T00:00:00.000Z"),
    makeBook("cheapest", 50, "2026-01-15T00:00:00.000Z"),
  ];

  it("sorts newest first by default", () => {
    expect(sortBooks(books, "newest").map((book) => book.id)).toEqual([
      "newer",
      "cheapest",
      "older",
    ]);
  });

  it("sorts by price and uses newest listings to break ties", () => {
    expect(sortBooks(books, "price-asc").map((book) => book.id)).toEqual([
      "cheapest",
      "newer",
      "older",
    ]);
    expect(sortBooks(books, "price-desc").map((book) => book.id)).toEqual([
      "newer",
      "older",
      "cheapest",
    ]);
  });

  it("does not mutate the source list", () => {
    const originalOrder = books.map((book) => book.id);
    sortBooks(books, "price-asc");
    expect(books.map((book) => book.id)).toEqual(originalOrder);
  });
});
