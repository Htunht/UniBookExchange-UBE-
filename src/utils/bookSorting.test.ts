import { describe, expect, it } from "vitest";
import type { Book } from "../services/api";
import { sortBooks } from "./bookSorting";
import {
  ALL_MAJORS_VALUE,
  getAllowedBookYears,
  getCourseYearRule,
} from "./courseRules";

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

  describe("course rules", () => {
    it("recognizes first-year common subjects in English and Burmese", () => {
      for (const title of [
        "Myanmar textbook",
        "Physics",
        "Chemistry",
        "Drawing",
        "မြန်မာစာ",
        "ရူပဗေဒ",
        "ဓာတုဗေဒ",
        "ပုံဆွဲ",
      ]) {
        expect(getCourseYearRule(title)).toBe("first-year-only");
      }
      expect(getAllowedBookYears("first-year-only")).toEqual(["1st Year"]);
    });

    it("allows English and Math books through fourth year", () => {
      for (const title of ["English", "Mathematics", "Math", "အင်္ဂလိပ်စာ", "သင်္ချာ"]) {
        expect(getCourseYearRule(title)).toBe("through-fourth-year");
      }
      expect(getAllowedBookYears("through-fourth-year")).toEqual([
        "1st Year",
        "2nd Year",
        "3rd Year",
        "4th Year",
      ]);
    });

    it("does not apply common-course rules to other titles", () => {
      expect(getCourseYearRule("Civil Engineering Handbook")).toBeNull();
      expect(getAllowedBookYears(null)).toHaveLength(6);
      expect(ALL_MAJORS_VALUE).toBe("All Majors");
    });
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
