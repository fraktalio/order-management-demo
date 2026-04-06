# Domain Type Patterns

All domain types live in `lib/api.ts`. This file is the single source of truth
for commands, events, branded IDs, and domain errors.

## Branded IDs

Branded types prevent accidentally passing one ID type where another is
expected.

```ts
type Brand<T, B> = T & { readonly __brand: B };

// Define the branded type
export type RestaurantId = Brand<string, "RestaurantId">;

// Factory function (used in application code and tests)
export const restaurantId = (id: string): RestaurantId => id as RestaurantId;
```

Use `generateId()` from `@/utils/id.ts` (ULID-based) for runtime ID generation
instead of `crypto.randomUUID()`.

## Commands

Commands use discriminated unions with a `kind` field. All properties are
`readonly`.

```ts
export type CreateRestaurantCommand = {
  readonly kind: "CreateRestaurantCommand";
  readonly restaurantId: RestaurantId;
  readonly name: RestaurantName;
  readonly menu: RestaurantMenu;
};
```

Maintain a union of all commands:

```ts
export type Command =
  | CreateRestaurantCommand
  | ChangeRestaurantMenuCommand
  | PlaceOrderCommand
  | MarkOrderAsPreparedCommand;
```

## Events with TypeSafeEventShape

Events use `TypeSafeEventShape` from fmodel-decider to declare tag fields at the
type level. This enables compile-time validation of indexing configuration.

```ts
import type { TypeSafeEventShape } from "@fraktalio/fmodel-decider";

export type RestaurantCreatedEvent = TypeSafeEventShape<
  {
    readonly kind: "RestaurantCreatedEvent";
    readonly restaurantId: RestaurantId;
    readonly name: RestaurantName;
    readonly menu: RestaurantMenu;
    readonly final: boolean;
  },
  ["restaurantId"] // tag fields — only string fields allowed
>;
```

### Tag Fields

- Tag fields determine how events are indexed in Deno KV.
- Only `string`-typed fields can be tag fields.
- The repository generates all non-empty subsets of tags for flexible querying.
- Keep tag fields minimal (max 5 recommended) to limit write amplification.

### Multi-Entity Events

Events that span multiple entities declare multiple tag fields:

```ts
export type RestaurantOrderPlacedEvent = TypeSafeEventShape<
  {
    readonly kind: "RestaurantOrderPlacedEvent";
    readonly restaurantId: RestaurantId;
    readonly orderId: OrderId;
    readonly menuItems: MenuItem[];
    readonly final: boolean;
  },
  ["restaurantId", "orderId"] // indexed by both
>;
```

### The `final` Field

Every event includes `readonly final: boolean`. This signals whether the event
represents a terminal state. Typically `false` for most events.

## Domain Errors

Domain errors extend a base `DomainError` class and carry the relevant ID for
context.

```ts
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class RestaurantAlreadyExistsError extends DomainError {
  constructor(public readonly restaurantId: RestaurantId) {
    super(`Restaurant ${restaurantId} already exists`);
  }
}
```

### Error Naming Convention

`{Entity}{Condition}Error` — e.g., `OrderNotFoundError`,
`MenuItemsNotAvailableError`, `OrderAlreadyPreparedError`.

## Value Objects

Use plain readonly types for value objects:

```ts
export type MenuItem = {
  readonly menuItemId: MenuItemId;
  readonly name: MenuItemName;
  readonly price: MenuItemPrice;
};

export type RestaurantMenu = {
  readonly menuItems: MenuItem[];
  readonly menuId: RestaurantMenuId;
  readonly cuisine: RestaurantMenuCuisine;
};
```

## Event Union

Maintain a union of all events:

```ts
export type Event =
  | RestaurantCreatedEvent
  | RestaurantMenuChangedEvent
  | RestaurantOrderPlacedEvent
  | OrderPreparedEvent;
```
