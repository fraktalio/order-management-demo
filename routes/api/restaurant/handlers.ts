/**
 * Core restaurant API handler functions.
 *
 * Extracted from the Fresh route so they can be tested without pulling in
 * the Fresh framework (which reads env vars at module load time).
 */

import { z } from "zod";
import { EventSourcedCommandHandler } from "@fraktalio/fmodel-decider";
import { createRestaurantRepository } from "@/lib/createRestaurantRepository.ts";
import { createRestaurantDecider } from "@/lib/createRestaurantDecider.ts";
import { changeRestaurantMenuRepository } from "@/lib/changeRestaurantMenuRepository.ts";
import { changeRestaurantManuDecider } from "@/lib/changeRestaurantMenuDecider.ts";
import { restaurantViewQueryHandler } from "@/lib/restaurantViewEventLoader.ts";
import { generateId } from "@/utils/id.ts";
import {
  menuItemId,
  RestaurantAlreadyExistsError,
  restaurantId,
  type RestaurantMenuCuisine,
  restaurantMenuId,
  RestaurantNotFoundError,
} from "@/lib/api.ts";

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const cuisineSchema = z.enum([
  "GENERAL",
  "SERBIAN",
  "ITALIAN",
  "MEXICAN",
  "CHINESE",
  "INDIAN",
  "FRENCH",
]);

const menuItemSchema = z.object({
  menuItemId: z.string().optional(),
  name: z.string().min(1, "name is required"),
  price: z.string().min(1, "price is required"),
});

const menuSchema = z.object({
  menuId: z.string().min(1, "menu.menuId is required"),
  cuisine: cuisineSchema,
  menuItems: z.array(menuItemSchema).min(
    1,
    "menu.menuItems must be a non-empty array",
  ),
});

export const createRestaurantSchema = z.object({
  restaurantId: z.string().min(1, "restaurantId is required"),
  name: z.string().min(1, "name is required"),
  menu: menuSchema,
});

export const changeMenuSchema = z.object({
  restaurantId: z.string().min(1, "restaurantId is required"),
  menu: menuSchema,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function zodError(error: z.ZodError): Response {
  const message = error.issues.map((e) => e.message).join("; ");
  return Response.json({ error: message }, { status: 400 });
}

function buildMenu(menu: z.infer<typeof menuSchema>) {
  return {
    menuId: restaurantMenuId(menu.menuId),
    cuisine: menu.cuisine as RestaurantMenuCuisine,
    menuItems: menu.menuItems.map((item: z.infer<typeof menuItemSchema>) => ({
      menuItemId: menuItemId(item.menuItemId ?? generateId()),
      name: item.name,
      price: item.price,
    })),
  };
}

// ---------------------------------------------------------------------------
// Handler functions
// ---------------------------------------------------------------------------

export async function handlePost(req: Request): Promise<Response> {
  const parsed = createRestaurantSchema.safeParse(await req.json());
  if (!parsed.success) return zodError(parsed.error);

  const { restaurantId: rid, name, menu } = parsed.data;
  const kv = await Deno.openKv();
  try {
    const repository = createRestaurantRepository(kv);
    const cmdHandler = new EventSourcedCommandHandler(
      createRestaurantDecider,
      repository,
    );
    const events = await cmdHandler.handle({
      kind: "CreateRestaurantCommand",
      restaurantId: restaurantId(rid),
      name,
      menu: buildMenu(menu),
    });
    return Response.json(events, { status: 201 });
  } catch (error) {
    if (error instanceof RestaurantAlreadyExistsError) {
      return Response.json({ error: error.message }, { status: 409 });
    }
    throw error;
  } finally {
    kv.close();
  }
}

export async function handlePut(req: Request): Promise<Response> {
  const parsed = changeMenuSchema.safeParse(await req.json());
  if (!parsed.success) return zodError(parsed.error);

  const { restaurantId: rid, menu } = parsed.data;
  const kv = await Deno.openKv();
  try {
    const repository = changeRestaurantMenuRepository(kv);
    const cmdHandler = new EventSourcedCommandHandler(
      changeRestaurantManuDecider,
      repository,
    );
    const events = await cmdHandler.handle({
      kind: "ChangeRestaurantMenuCommand",
      restaurantId: restaurantId(rid),
      menu: buildMenu(menu),
    });
    return Response.json(events, { status: 200 });
  } catch (error) {
    if (error instanceof RestaurantNotFoundError) {
      return Response.json({ error: error.message }, { status: 404 });
    }
    throw error;
  } finally {
    kv.close();
  }
}

export async function handleGet(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  // If no id provided, list all restaurants
  if (!id || id.trim() === "") {
    return handleList();
  }

  const kv = await Deno.openKv();
  try {
    const qHandler = restaurantViewQueryHandler(kv);
    const state = await qHandler.handle([
      [`restaurantId:${id}`, "RestaurantCreatedEvent"],
      [`restaurantId:${id}`, "RestaurantMenuChangedEvent"],
    ]);
    if (state === null) {
      return Response.json({ error: `Restaurant ${id} does not exist` }, {
        status: 404,
      });
    }
    return Response.json(state, { status: 200 });
  } finally {
    kv.close();
  }
}

async function handleList(): Promise<Response> {
  const kv = await Deno.openKv();
  try {
    const restaurantIds = new Set<string>();
    const iter = kv.list({
      prefix: ["events_by_type", "RestaurantCreatedEvent"],
    });
    for await (const entry of iter) {
      for (const segment of entry.key) {
        if (
          typeof segment === "string" && segment.startsWith("restaurantId:")
        ) {
          restaurantIds.add(segment.replace("restaurantId:", ""));
        }
      }
    }

    const qHandler = restaurantViewQueryHandler(kv);
    const results = [];
    for (const rid of restaurantIds) {
      const view = await qHandler.handle([
        [`restaurantId:${rid}`, "RestaurantCreatedEvent"],
        [`restaurantId:${rid}`, "RestaurantMenuChangedEvent"],
      ]);
      if (view !== null) {
        results.push(view);
      }
    }

    return Response.json(results, { status: 200 });
  } finally {
    kv.close();
  }
}
