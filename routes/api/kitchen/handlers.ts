/**
 * Core kitchen API handler functions.
 *
 * Extracted from the Fresh route so they can be tested without pulling in
 * the Fresh framework (which reads env vars at module load time).
 */

import { z } from "zod";
import { EventSourcedCommandHandler } from "@fraktalio/fmodel-decider";
import { markOrderAsPreparedRepository } from "@/lib/markOrderAsPreparedRepository.ts";
import { markOrderAsPreparedDecider } from "@/lib/markOrderAsPreparedDecider.ts";
import { orderViewQueryHandler } from "@/lib/orderViewEventLoader.ts";
import {
  OrderAlreadyPreparedError,
  orderId,
  OrderNotFoundError,
} from "@/lib/api.ts";

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

export const statusQuerySchema = z.enum(["CREATED", "PREPARED"]);

export const markAsPreparedSchema = z.object({
  orderId: z.string().min(1, "orderId is required"),
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

export async function handleGet(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const parsed = statusQuerySchema.safeParse(status);
  if (!parsed.success) {
    return Response.json(
      { error: "status query parameter must be CREATED or PREPARED" },
      { status: 400 },
    );
  }

  const requestedStatus = parsed.data;
  const kv = await Deno.openKv();
  try {
    // Scan all RestaurantOrderPlacedEvent entries to discover unique order IDs
    // Track the ULID (4th key segment) for time-based sorting
    const orderMap = new Map<string, string>(); // orderId -> earliest ULID
    const iter = kv.list({
      prefix: ["events_by_type", "RestaurantOrderPlacedEvent"],
    });
    for await (const entry of iter) {
      let oid = "";
      let ulid = "";
      for (const segment of entry.key) {
        if (typeof segment === "string") {
          if (segment.startsWith("orderId:")) {
            oid = segment.replace("orderId:", "");
          } else if (!segment.includes(":") && segment.length === 26) {
            // ULID is 26 chars, no colons
            ulid = segment;
          }
        }
      }
      if (oid && !orderMap.has(oid)) {
        orderMap.set(oid, ulid);
      }
    }

    // Sort by ULID (time-sortable) so oldest orders come first
    const orderIds = [...orderMap.entries()]
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([oid]) => oid);

    // Project each order's current state and filter by requested status
    const qHandler = orderViewQueryHandler(kv);
    const results = [];
    for (const oid of orderIds) {
      const view = await qHandler.handle([
        [`orderId:${oid}`, "RestaurantOrderPlacedEvent"],
        [`orderId:${oid}`, "OrderPreparedEvent"],
      ]);
      if (view !== null && view.status === requestedStatus) {
        results.push(view);
      }
    }

    return Response.json(results, { status: 200 });
  } finally {
    kv.close();
  }
}

export async function handlePut(req: Request): Promise<Response> {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = markAsPreparedSchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  const { orderId: oid } = parsed.data;
  const kv = await Deno.openKv();
  try {
    const repository = markOrderAsPreparedRepository(kv);
    const cmdHandler = new EventSourcedCommandHandler(
      markOrderAsPreparedDecider,
      repository,
    );
    const events = await cmdHandler.handle({
      kind: "MarkOrderAsPreparedCommand",
      orderId: orderId(oid),
    });
    return Response.json(events, { status: 200 });
  } catch (error) {
    if (error instanceof OrderNotFoundError) {
      return Response.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof OrderAlreadyPreparedError) {
      return Response.json({ error: error.message }, { status: 409 });
    }
    throw error;
  } finally {
    kv.close();
  }
}
