/**
 * Property-based and unit tests for the Restaurant API handler.
 *
 * Uses fast-check generators to verify correctness properties from the design doc.
 * Each test uses an in-memory Deno KV instance for isolation.
 *
 * Imports the extracted handlePost/handlePut/handleGet functions directly
 * (no Fresh dependency) so tests run without --allow-env.
 */

import { assertEquals } from "@std/assert";
import fc from "fast-check";
import { handleGet, handlePost, handlePut } from "./handlers.ts";

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/** Arbitrary valid restaurant ID (UUID) */
export const arbRestaurantId = fc.uuid();

/** Arbitrary valid restaurant name (non-empty) */
export const arbRestaurantName = fc.string({ minLength: 1, maxLength: 100 });

/** Arbitrary valid cuisine value */
export const arbCuisine = fc.constantFrom(
  "GENERAL" as const,
  "SERBIAN" as const,
  "ITALIAN" as const,
  "MEXICAN" as const,
  "CHINESE" as const,
  "INDIAN" as const,
  "FRENCH" as const,
);

/** Arbitrary valid menu item */
export const arbMenuItem = fc.record({
  menuItemId: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  price: fc.stringMatching(/^\d+\.\d{2}$/),
});

/** Arbitrary non-empty array of valid menu items */
export const arbMenuItems = fc.array(arbMenuItem, {
  minLength: 1,
  maxLength: 10,
});

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function jsonReq(method: string, body: unknown): Request {
  return new Request("http://localhost/api/restaurant", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/**
 * Wraps a test body so that `Deno.openKv()` (no args) returns the same
 * in-memory KV instance, keeping the handler's internal KV isolated.
 */
async function withMemoryKv(
  fn: (kv: Deno.Kv) => Promise<void>,
): Promise<void> {
  const kv = await Deno.openKv(":memory:");
  const original = Deno.openKv;
  const kvProxy = new Proxy(kv, {
    get(target, prop) {
      if (prop === "close") return () => {};
      // deno-lint-ignore no-explicit-any
      const val = (target as any)[prop];
      return typeof val === "function" ? val.bind(target) : val;
    },
  });
  // deno-lint-ignore no-explicit-any
  (Deno as any).openKv = () => Promise.resolve(kvProxy);
  try {
    await fn(kv);
  } finally {
    // deno-lint-ignore no-explicit-any
    (Deno as any).openKv = original;
    kv.close();
  }
}

/** Helper: POST create restaurant */
async function createRestaurant(payload: unknown): Promise<Response> {
  return await handlePost(jsonReq("POST", payload));
}

/** Helper: PUT change menu */
async function _changeMenu(payload: unknown): Promise<Response> {
  return await handlePut(jsonReq("PUT", payload));
}

/** Helper: GET view restaurant */
async function _viewRestaurant(id: string): Promise<Response> {
  return await handleGet(
    new Request(`http://localhost/api/restaurant?id=${encodeURIComponent(id)}`),
  );
}

// ---------------------------------------------------------------------------
// Smoke tests — verify scaffolding works
// ---------------------------------------------------------------------------

Deno.test("API handler scaffolding - POST create returns 201 for valid payload", async () => {
  await withMemoryKv(async () => {
    const res = await createRestaurant({
      restaurantId: crypto.randomUUID(),
      name: "Test Bistro",
      menu: {
        menuId: crypto.randomUUID(),
        cuisine: "ITALIAN",
        menuItems: [
          { menuItemId: crypto.randomUUID(), name: "Pizza", price: "12.99" },
        ],
      },
    });
    assertEquals(res.status, 201);
    const body = await res.json();
    assertEquals(body.length, 1);
    assertEquals(body[0].kind, "RestaurantCreatedEvent");
  });
});

Deno.test("API handler scaffolding - GET without id lists all restaurants", async () => {
  await withMemoryKv(async () => {
    const res = await handleGet(
      new Request("http://localhost/api/restaurant"),
    );
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(Array.isArray(body), true);
  });
});

Deno.test("API handler scaffolding - POST returns 400 for empty body fields", async () => {
  await withMemoryKv(async () => {
    const res = await createRestaurant({});
    assertEquals(res.status, 400);
  });
});
