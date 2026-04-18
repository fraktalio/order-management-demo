# Testing Patterns

## Given-When-Then Specification Tests

The primary testing approach uses `DeciderEventSourcedSpec` and
`ViewSpecification` from fmodel-decider. These are executable specifications
that serve as living documentation.

### Decider Tests — `DeciderEventSourcedSpec`

```ts
import { DeciderEventSourcedSpec } from "./test_specs.ts";

// Success case: given preconditions, when command, then expected events
Deno.test("Place Order - Success", () => {
  DeciderEventSourcedSpec.for(placeOrderDecider)
    .given([restaurantCreatedEvent]) // prerequisite events
    .when(placeOrderCommand) // command under test
    .then([orderPlacedEvent]); // expected output events
});

// Error case: given preconditions, when command, then throws
Deno.test("Place Order - Restaurant Not Found", () => {
  DeciderEventSourcedSpec.for(placeOrderDecider)
    .given([]) // no restaurant exists
    .when(placeOrderCommand)
    .thenThrows((error) => error instanceof RestaurantNotFoundError);
});
```

### Test Structure

Each decider test file should cover:

1. **Happy path** — command succeeds, correct events produced
2. **Each guard clause** — one test per domain error
3. **State transitions** — events from other use cases affect this decider's
   state (e.g., menu change before order placement)

### View Tests — `ViewSpecification`

```ts
import { ViewSpecification } from "./test_specs.ts";

Deno.test("Restaurant View - Created", () => {
  ViewSpecification.for(restaurantView)
    .given([restaurantCreatedEvent])
    .then({
      restaurantId: restaurantId("r1"),
      name: "Italian Bistro",
      menu: testMenu,
    });
});

// Null state handling
Deno.test("View - Event on null state returns null", () => {
  ViewSpecification.for(restaurantView)
    .given([menuChangedEvent]) // no create event first
    .then(null);
});
```

## Integration Tests (Repository)

Integration tests verify the full round-trip through Deno KV using in-memory
storage.

```ts
Deno.test("Repository - round trip", async () => {
  const kv = await Deno.openKv(":memory:");
  try {
    const repo = createRestaurantRepository(kv);
    const handler = new EventSourcedCommandHandler(
      createRestaurantDecider,
      repo,
    );
    const events = await handler.handle(command);
    assertEquals(events.length, 1);
  } finally {
    await kv.close(); // always close KV in finally block
  }
});
```

### Integration Test Pattern

1. Open in-memory KV: `Deno.openKv(":memory:")`
2. Create repository and command handler
3. Execute commands via `handler.handle(command)`
4. Query views via `queryHandler.handle(tuples)`
5. Assert results
6. Close KV in `finally` block

## Property-Based Testing with fast-check

For invariants that should hold across all valid inputs, use `fast-check`:

```ts
import fc from "fast-check";
import { DeciderEventSourcedSpec } from "./test_specs.ts";

Deno.test("Property: creating a restaurant always produces exactly one event", () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 1 }), // restaurant name
      (name) => {
        const command: CreateRestaurantCommand = {
          kind: "CreateRestaurantCommand",
          restaurantId: restaurantId("r1"),
          name,
          menu: testMenu,
        };
        // This should not throw and should produce exactly 1 event
        DeciderEventSourcedSpec.for(createRestaurantDecider)
          .given([])
          .when(command)
          .then([{
            kind: "RestaurantCreatedEvent",
            restaurantId: restaurantId("r1"),
            name,
            menu: testMenu,
            final: false,
            tagFields: ["restaurantId"],
          }]);
      },
    ),
  );
});
```

### Useful Properties to Test

- **Idempotency**: applying the same event twice yields the same state
- **Completeness**: every valid command on a valid state produces events
- **Error coverage**: every invalid command on an invalid state throws the
  correct domain error
- **View consistency**: folding events then querying equals direct construction

## Running Tests

```bash
# All tests
deno test --allow-all --unstable-kv

# Single file
deno test --allow-all --unstable-kv lib/placeOrderDecider_test.ts

# With filter
deno test --allow-all --unstable-kv --filter "Place Order"
```
