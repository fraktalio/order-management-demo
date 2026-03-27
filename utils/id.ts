import { ulid } from "@std/ulid";

/** Generate a time-sortable ULID. Drop-in replacement for crypto.randomUUID(). */
export function generateId(): string {
  return ulid();
}
