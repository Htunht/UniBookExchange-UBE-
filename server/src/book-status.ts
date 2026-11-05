export type BookStatus = "AVAILABLE" | "SOLD";

export function canRequestBook(status: BookStatus): boolean {
  return status === "AVAILABLE";
}
