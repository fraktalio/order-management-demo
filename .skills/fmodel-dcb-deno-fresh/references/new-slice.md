# Adding a New Slice (Decider + Repository)

This guide walks through adding a complete slice following the DCB pattern.
Replace `{Command}` with your command name (e.g., `CancelOrder`).

## 0. Write Given-When-Then Requirements

Before writing any code, create a `REQUIREMENTS-{UseCase}.md` document that
captures the use case behavior as Given-When-Then scenarios.

See [requirements-gwt.md](requirements-gwt.md) for the full template and rules.

At minimum, your requirements doc should have:

- Description of the use case
- Input events table (what the decider reads)
- Output events table (what the decider produces)
- One scenario per behavior path (happy path + one per domain error)
- Domain errors table
- State shape

These scenarios will drive your test file in step 4.

## 1. Define Domain Types in `lib/api.ts`

### Branded ID (if new entity)

```ts
export type MyEntityId = Brand<string, "MyEntityId">;
export const myEntityId = (id: string): MyEntityId => id as MyEntityId;
```

### Command

```ts
export type {UseCase}Command = {
  readonly kind: "{UseCase}Command";
  readonly myEntityId: MyEntityId;
  // ... other fields
};
```

Add to the `Command` union:

```ts
export type Command = /* existing */ | {UseCase}Command;
```

### Event with TypeSafeEventShape

```ts
export type { UseCase };
Event = TypeSafeEventShape<
  {
    readonly kind: "{UseCase}Event";
    readonly myEntityId: MyEntityId;
    // ... other fields carrying full state dimension
    readonly final: boolean;
  },
  ["myEntityId"] // ← tag fields for indexing (compile-time validated)
>;
```

Add to the `Event` union:

```ts
export type Event = /* existing */ | {UseCase}Event;
```

### Domain Error

```ts
export class MyDomainError extends DomainError {
  constructor(public readonly myEntityId: MyEntityId) {
    super(`Descriptive message ${myEntityId}`);
  }
}
```

## 2. Create the Decider — `lib/{useCase}Decider.ts`

A decider is a pure function pair: `decide` (command → events) and `evolve`
(state + event → state).

```ts
import { DcbDecider } from "@fraktalio/fmodel-decider";
import {
  type {UseCase}Command,
  type SomeInputEvent,
  type {UseCase}Event,
  MyDomainError,
} from "./api.ts";

// State tracks only what this use case needs for its decision
type {UseCase}State = {
  readonly exists: boolean;
  // ... minimal fields needed for decide logic
};

export const {useCase}Decider: DcbDecider<
  {UseCase}Command,       // Command type
  {UseCase}State,         // State type (Si = So)
  SomeInputEvent,         // Input events (what we read)
  {UseCase}Event          // Output events (what we produce)
> = new DcbDecider<
  {UseCase}Command,
  {UseCase}State,
  SomeInputEvent,
  {UseCase}Event
>(
  // decide: (command, currentState) => events[]
  (command, currentState) => {
    switch (command?.kind) {
      case "{UseCase}Command": {
        // Guard clauses — throw domain errors
        if (!currentState.exists) {
          throw new MyDomainError(command.myEntityId);
        }
        // Produce events
        return [{
          kind: "{UseCase}Event",
          myEntityId: command.myEntityId,
          final: false,
          tagFields: ["myEntityId"],
        }];
      }
      default:
        return [];
    }
  },
  // evolve: (currentState, event) => newState
  (currentState, event) => {
    switch (event?.kind) {
      case "SomeInputEvent":
        return { exists: true };
      default:
        return currentState;
    }
  },
  // initialState
  { exists: false },
);
```

### Key Rules for Deciders

- **Input events (Ei)** are what the decider reads to build state. They can come
  from other use cases (cross-boundary reads).
- **Output events (Eo)** are what this decider produces. They are a subset of or
  different from input events.
- The `decide` function must be **pure** — no I/O, no side effects.
- The `evolve` function must be **pure** — deterministic state transitions.
- Always handle `null`/`undefined` command and event gracefully (return `[]` or
  `currentState`).
- State should be **minimal** — only what `decide` needs for its guards.

## 3. Create the Repository — `lib/{useCase}Repository.ts`

The repository wires the decider to Deno KV storage via tuple-based queries.

```ts
import { DenoKvEventRepository } from "@fraktalio/fmodel-decider";
import type {
  {UseCase}Command,
  SomeInputEvent,
  {UseCase}Event,
} from "./api.ts";

export const {useCase}Repository = (kv: Deno.Kv) =>
  new DenoKvEventRepository<
    {UseCase}Command,    // Command
    SomeInputEvent,      // Input events (loaded from KV)
    {UseCase}Event       // Output events (persisted to KV)
  >(
    kv,
    // Query tuples: [...tags, eventType]
    (cmd) => [
      ["myEntityId:" + cmd.myEntityId, "SomeInputEvent"],
      // Add more tuples for cross-boundary event loading
    ],
  );
```

### Query Tuple Pattern

Each tuple is `[...tagValues, eventTypeName]`:

- `["restaurantId:r1", "RestaurantCreatedEvent"]` — load by restaurant ID
- `["orderId:o1", "RestaurantOrderPlacedEvent"]` — load by order ID

This enables **cross-boundary queries**: a single decider can load events from
multiple entity types in one operation.

## 4. Write Tests — `lib/{useCase}Decider_test.ts`

Use the Given-When-Then DSL for specification by example:

```ts
import { DeciderEventSourcedSpec } from "./test_specs.ts";
import { {useCase}Decider } from "./{useCase}Decider.ts";
import { type {UseCase}Command, myEntityId, MyDomainError } from "./api.ts";

Deno.test("{UseCase} - Success", () => {
  const command: {UseCase}Command = {
    kind: "{UseCase}Command",
    myEntityId: myEntityId("e1"),
  };

  DeciderEventSourcedSpec.for({useCase}Decider)
    .given([/* prerequisite events */])
    .when(command)
    .then([/* expected output events */]);
});

Deno.test("{UseCase} - Error case (throws)", () => {
  DeciderEventSourcedSpec.for({useCase}Decider)
    .given([])
    .when(command)
    .thenThrows((error) => error instanceof MyDomainError);
});
```

## 5. Wire to API Route — `routes/api/{domain}/handlers.ts`

```ts
import { EventSourcedCommandHandler } from "@fraktalio/fmodel-decider";
import { {useCase}Decider } from "@/lib/{useCase}Decider.ts";
import { {useCase}Repository } from "@/lib/{useCase}Repository.ts";

export async function handle{UseCase}(kv: Deno.Kv, command: {UseCase}Command) {
  const repo = {useCase}Repository(kv);
  const handler = new EventSourcedCommandHandler({useCase}Decider, repo);
  return await handler.handle(command);
}
```

## Checklist

- [ ] Requirements written in `REQUIREMENTS-{UseCase}.md` with GWT scenarios
- [ ] Domain types added to `lib/api.ts` (command, event, error, branded ID)
- [ ] Decider created in `lib/{useCase}Decider.ts`
- [ ] Repository created in `lib/{useCase}Repository.ts`
- [ ] Given-When-Then tests in `lib/{useCase}Decider_test.ts`
- [ ] Integration test in `lib/{useCase}Repository_test.ts`
- [ ] API route handler wired up
- [ ] All tests pass: `deno test --allow-all --unstable-kv`
