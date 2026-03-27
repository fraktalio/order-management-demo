/**
 * Core order API handler functions.
 *
 * Extracted from the Fresh route so they can be tested without pulling in
 * the Fresh framework (which reads env vars at module load time).
 */

import { z } from "zod";
import { EventSourcedCommandHandler } from "@fraktalio/fmodel-decider";
import { placeOrderRepository } from "@/lib/placeOrderRepository.ts";
import { placeOrderDecider } from "@/lib/placeOrderDecider.ts";
import { orderViewQueryHandler } from "@/lib/orderViewEventLoader.ts";
import {
  menuItemId,
  MenuItemsNotAvailableError,
  OrderAlreadyExistsError,
  orderId,
  restaurantId,
  RestaurantNotFoundError,
} from "@/lib/api.ts";

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const menuItemSchema = z.object({
  menuItemId: z.string().min(1, "menuItemId is required"),
  name: z.string().min(1, "name is required"),
  price: z.string().min(1, "price is required"),
});

export const orderIdQuerySchema = z.string().min(
  1,
  "orderId query parameter is required",
);

export const placeOrderSchema = z.object({
  restaurantId: z.string().min(1, "restaurantId is required"),
  orderId: z.string().min(1, "orderId is required"),
  menuItems: z
    .array(menuItemSchema)
    .min(1, "menuItems must be a non-empty array"),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function zodError(error: z.ZodError): Response {
  const message = error.issues.map((e) => e.message).join("; ");
  return Response.json({ error: message }, { status: 400 });
}

// ---------------------------------------------------------------------------
// Handler functions
// ---------------------------------------------------------------------------

export async function handlePost(req: Request): Promise<Response> {
  const parsed = placeOrderSchema.safeParse(await req.json());
  if (!parsed.success) return zodError(parsed.error);

  const { restaurantId: rid, orderId: oid, menuItems } = parsed.data;
  const kv = await Deno.openKv();
  try {
    const repository = placeOrderRepository(kv);
    const cmdHandler = new EventSourcedCommandHandler(
      placeOrderDecider,
      repository,
    );
    const events = await cmdHandler.handle({
      kind: "PlaceOrderCommand",
      restaurantId: restaurantId(rid),
      orderId: orderId(oid),
      menuItems: menuItems.map((item) => ({
        menuItemId: menuItemId(item.menuItemId),
        name: item.name,
        price: item.price,
      })),
    });
    return Response.json(events, { status: 201 });
  } catch (error) {
    if (error instanceof OrderAlreadyExistsError) {
      return Response.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof RestaurantNotFoundError) {
      return Response.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof MenuItemsNotAvailableError) {
      return Response.json({ error: error.message }, { status: 422 });
    }
    throw error;
  } finally {
    kv.close();
  }
}

export async function handleGet(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const id = url.searchParams.get("orderId");
  const parsed = orderIdQuerySchema.safeParse(id);
  if (!parsed.success) {
    return Response.json({ error: "orderId query parameter is required" }, {
      status: 400,
    });
  }

  const kv = await Deno.openKv();
  try {
    const qHandler = orderViewQueryHandler(kv);
    const state = await qHandler.handle([
      [`orderId:${parsed.data}`, "RestaurantOrderPlacedEvent"],
      [`orderId:${parsed.data}`, "OrderPreparedEvent"],
    ]);
    if (state === null) {
      return Response.json({ error: `Order ${parsed.data} does not exist` }, {
        status: 404,
      });
    }
    return Response.json(state, { status: 200 });
  } finally {
    kv.close();
  }
}
