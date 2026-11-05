import { describe, expect, it } from "vitest";
import { canRequestBook } from "../src/book-status.js";
import { shouldLogDevelopmentOtp } from "../src/dev-otp.js";

describe("canRequestBook", () => {
  it("allows requests for available books", () => {
    expect(canRequestBook("AVAILABLE")).toBe(true);
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
