# Adding a New Read Model (View + Event Loader)

Views are pure projections that fold events into queryable read-model state.

## 1. Create the View — `lib/{domain}View.ts`

```ts
import { Projection } from "@fraktalio/fmodel-decider";
import type { SomeEvent, AnotherEvent, MyEntityId } from "./api.ts";

// Union of events this view handles
export type {Domain}Event = SomeEvent | AnotherEvent;

// Read-model state shape
export type {Domain}View = {
  readonly myEntityId: MyEntityId;
  readonly someField: string;
  readonly status: "ACTIVE" | "INACTIVE";
};

export const {domain}View: Projection<{Domain}View | null, {Domain}Event> =
  new Projection<{Domain}View | null, {Domain}Event>(
    (currentState, event) => {
      switch (event.kind) {
        case "SomeEvent":
          return {
            myEntityId: event.myEntityId,
            someField: event.someField,
            status: "ACTIVE",
          };
        case "AnotherEvent":
          return currentState !== null
            ? { ...currentState, status: "INACTIVE" }
            : currentState;
        default: {
          // Exhaustive matching
          const _exhaustiveCheck: never = event;
          return currentState;
        }
      }
    },
    null, // initial state
  );
```

### Key Rules for Views

- Views are **pure** — no I/O, no side effects.
- Initial state is typically `null` (no entity yet).
- Use exhaustive `switch` with `never` check on the default branch.
- When an event arrives for a state that doesn't exist yet
  (`currentState ===
  null`), return `null` — don't create partial state.
- The `{Domain}Event` union should only include events this view cares about.

## 2. Create the Event Loader — `lib/{domain}ViewEventLoader.ts`

The event loader wires the view to Deno KV for on-demand projection.

```ts
import { DenoKvEventLoader, EventSourcedQueryHandler } from "@fraktalio/fmodel-decider";
import { type {Domain}Event, {domain}View } from "./{domain}View.ts";

export const {domain}ViewQueryHandler = (kv: Deno.Kv) =>
  new EventSourcedQueryHandler(
    {domain}View,
    new DenoKvEventLoader<{Domain}Event>(kv),
  );
```

### Querying the View

```ts
const queryHandler = {domain}ViewQueryHandler(kv);

// Pass query tuples — same format as repository tuples
const state = await queryHandler.handle([
  ["myEntityId:e1", "SomeEvent"],
  ["myEntityId:e1", "AnotherEvent"],
]);
// state is {Domain}View | null
```

## 3. Write Tests

### Unit Test — `lib/{domain}View_test.ts`

```ts
import { ViewSpecification } from "./test_specs.ts";
import { {domain}View } from "./{domain}View.ts";

Deno.test("{Domain} View - SomeEvent creates state", () => {
  ViewSpecification.for({domain}View)
    .given([{
      kind: "SomeEvent",
      myEntityId: myEntityId("e1"),
      someField: "value",
      final: false,
      tagFields: ["myEntityId"],
    }])
    .then({
      myEntityId: myEntityId("e1"),
      someField: "value",
      status: "ACTIVE",
    });
});

Deno.test("{Domain} View - AnotherEvent on null state returns null", () => {
  ViewSpecification.for({domain}View)
    .given([{
      kind: "AnotherEvent",
      myEntityId: myEntityId("e1"),
      final: false,
      tagFields: ["myEntityId"],
    }])
    .then(null);
});
```

### Integration Test — `lib/{domain}ViewEventLoader_test.ts`

```ts
import { assertEquals } from "@std/assert";
import { EventSourcedCommandHandler } from "@fraktalio/fmodel-decider";
import { {domain}ViewQueryHandler } from "./{domain}ViewEventLoader.ts";

Deno.test("{Domain}ViewEventLoader - project state from events", async () => {
  const kv = await Deno.openKv(":memory:");
  try {
    // 1. Persist events via a command handler
    // 2. Query the view
    const queryHandler = {domain}ViewQueryHandler(kv);
    const state = await queryHandler.handle([
      ["myEntityId:e1", "SomeEvent"],
    ]);
    assertEquals(state?.myEntityId, myEntityId("e1"));
  } finally {
    await kv.close();
  }
});
```

## Checklist

- [ ] View created in `lib/{domain}View.ts` with `Projection`
- [ ] Event loader created in `lib/{domain}ViewEventLoader.ts`
- [ ] Unit tests in `lib/{domain}View_test.ts` using `ViewSpecification`
- [ ] Integration tests in `lib/{domain}ViewEventLoader_test.ts`
- [ ] All tests pass: `deno test --allow-all --unstable-kv`
