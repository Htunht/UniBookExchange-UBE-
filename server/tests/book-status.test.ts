import { describe, expect, it } from "vitest";
import { canRequestBook } from "../src/book-status.js";
import { shouldLogDevelopmentOtp } from "../src/dev-otp.js";
import {
  getCourseYearRule,
  validateCommonCourseListing,
} from "../src/course-rules.js";

describe("canRequestBook", () => {
  it("allows requests for available books", () => {
    expect(canRequestBook("AVAILABLE")).toBe(true);
  });

  describe("validateCommonCourseListing", () => {
    it("recognizes all specified shared subjects", () => {
      for (const title of ["Myanmar", "Physics", "Chemistry", "Drawing"]) {
        expect(getCourseYearRule(title)).toBe("first-year-only");
      }
      for (const title of ["English", "Math"]) {
        expect(getCourseYearRule(title)).toBe("through-fourth-year");
      }
    });

    it("requires first-year common subjects for all majors", () => {
      expect(validateCommonCourseListing("Physics", "All Majors", "1st Year")).toBeNull();
      expect(validateCommonCourseListing("Physics", "CEIT", "1st Year")).toBe("major");
      expect(validateCommonCourseListing("Physics", "All Majors", "2nd Year")).toBe("year");
    });

    it("allows English and Math through fourth year for all majors", () => {
      expect(validateCommonCourseListing("Math", "All Majors", "4th Year")).toBeNull();
      expect(validateCommonCourseListing("English", "All Majors", "5th Year")).toBe("year");
    });

    it("leaves other book titles unrestricted", () => {
      expect(validateCommonCourseListing("Civil Engineering", "Civil", "5th Year")).toBeNull();
    });
  });

  describe("shouldLogDevelopmentOtp", () => {
    it("requires explicit opt-in outside production", () => {
      expect(shouldLogDevelopmentOtp("development", "true")).toBe(true);
      expect(shouldLogDevelopmentOtp(undefined, "true")).toBe(true);
      expect(shouldLogDevelopmentOtp("development", undefined)).toBe(false);
      expect(shouldLogDevelopmentOtp("development", "false")).toBe(false);
    });

    it("never enables OTP logging in production", () => {
      expect(shouldLogDevelopmentOtp("production", "true")).toBe(false);
    });
  });

  it("rejects requests for sold books", () => {
    expect(canRequestBook("SOLD")).toBe(false);
  });
});
