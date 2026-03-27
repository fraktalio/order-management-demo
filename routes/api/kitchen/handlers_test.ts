/**
 * Property-based and unit tests for the Kitchen API handlers.
 *
 * Uses fast-check generators to verify correctness properties from the design doc.
 * Each test uses an in-memory Deno KV instance for isolation.
 *
 * Imports the extracted handleGet/handlePut functions directly
 * (no Fresh dependency) so tests run without --allow-env.
 */

import { assertEquals } from "@std/assert";
import fc from "fast-check";
import { handleGet, handlePut } from "./handlers.ts";
import { handlePost as restaurantHandlePost } from "@/routes/api/restaurant/handlers.ts";
import { handlePost as orderHandlePost } from "@/routes/api/order/handlers.ts";

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/** Arbitrary valid order ID (UUID) */
export const arbOrderId = fc.uuid();

/** Arbitrary valid restaurant ID (UUID) */
export const arbRestaurantId = fc.uuid();

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

/** Arbitrary valid status filter */
export const arbStatus = fc.constantFrom(
  "CREATED" as const,
  "PREPARED" as const,
);

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function jsonReq(method: string, url: string, body: unknown): Request {
  return new Request(url, {
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

/**
 * Creates a restaurant with the given ID and menu items via the restaurant
 * handlePost, seeding prerequisite state for kitchen tests.
 */
async function createTestRestaurant(
  restaurantId: string,
  menuItems: Array<{ menuItemId: string; name: string; price: string }>,
): Promise<Response> {
  return await restaurantHandlePost(
    jsonReq("POST", "http://localhost/api/restaurant", {
      restaurantId,
      name: "Test Restaurant",
      menu: {
        menuId: crypto.randomUUID(),
        cuisine: "ITALIAN",
        menuItems,
      },
    }),
  );
}

/**
 * Places an order for the given restaurant and menu items via the order
 * handlePost, seeding prerequisite state for kitchen tests.
 */
async function placeTestOrder(
  orderId: string,
  restaurantId: string,
  menuItems: Array<{ menuItemId: string; name: string; price: string }>,
): Promise<Response> {
  return await orderHandlePost(
    jsonReq("POST", "http://localhost/api/order", {
      orderId,
      restaurantId,
      menuItems,
    }),
  );
}

// ---------------------------------------------------------------------------
// Smoke tests — verify scaffolding works
// ---------------------------------------------------------------------------

Deno.test("Kitchen API scaffolding - GET with valid status returns 200", async () => {
  await withMemoryKv(async () => {
    const res = await handleGet(
      new Request("http://localhost/api/kitchen?status=CREATED"),
    );
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(body, []);
  });
});

Deno.test("Kitchen API scaffolding - GET with missing status returns 400", async () => {
  await withMemoryKv(async () => {
    const res = await handleGet(
      new Request("http://localhost/api/kitchen"),
    );
    assertEquals(res.status, 400);
  });
});

Deno.test("Kitchen API scaffolding - PUT with empty body returns 400", async () => {
  await withMemoryKv(async () => {
    const res = await handlePut(
      jsonReq("PUT", "http://localhost/api/kitchen", {}),
    );
    assertEquals(res.status, 400);
  });
});

Deno.test("Kitchen API scaffolding - PUT with valid orderId for existing created order returns 200", async () => {
  await withMemoryKv(async () => {
    const rid = crypto.randomUUID();
    const oid = crypto.randomUUID();
    const menuItem = {
      menuItemId: crypto.randomUUID(),
      name: "Margherita",
      price: "9.99",
    };

    // Seed restaurant and order
    const createRes = await createTestRestaurant(rid, [menuItem]);
    assertEquals(createRes.status, 201);

    const orderRes = await placeTestOrder(oid, rid, [menuItem]);
    assertEquals(orderRes.status, 201);

    // Mark as prepared
    const res = await handlePut(
      jsonReq("PUT", "http://localhost/api/kitchen", { orderId: oid }),
    );
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(body.length, 1);
    assertEquals(body[0].kind, "OrderPreparedEvent");
  });
});
