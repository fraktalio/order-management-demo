# Writing Given-When-Then Requirements for Deciders

This guide explains how to write `REQUIREMENTS-{Command}.md` documents that
serve as the single source of truth for a use case. These docs drive both the
decider implementation and the Given-When-Then test suite.

## Why Given-When-Then for Requirements?

In event-sourced systems with the DCB pattern, the Given-When-Then format is a
natural fit because it maps directly to the decider's computation model:

| GWT Clause | Decider Concept | Meaning                              |
| ---------- | --------------- | ------------------------------------ |
| **Given**  | Input events    | Past events that build current state |
| **When**   | Command         | The action being requested           |
| **Then**   | Output events   | Events produced (or error thrown)    |

Requirements written this way are _executable specifications_ — each scenario
translates 1:1 into a `DeciderEventSourcedSpec` test.

## File Naming Convention

```
REQUIREMENTS-{CommandName}.md
```

Examples:

- `REQUIREMENTS-CreateRestaurant.md`
- `REQUIREMENTS-PlaceOrder.md`
- `REQUIREMENTS-MarkOrderAsPrepared.md`

Place these in the skill's `references/` directory as examples, or in your
project's docs directory for project-specific requirements.

## Document Structure

Every requirements doc follows this template:

````markdown
# Requirements: {CommandName}

Command: `{CommandName}Command` Decider: `{commandName}Decider` Slice: {brief
description of the use case}

## Description

{1-2 sentences explaining what this use case does and why it exists.}

## Input Events (Consistency Boundary)

| Event       | Tag Field  | Purpose                  |
| ----------- | ---------- | ------------------------ |
| `SomeEvent` | `entityId` | Why this event is loaded |

## Output Events

| Event           | Tag Fields |
| --------------- | ---------- |
| `ProducedEvent` | `entityId` |

## Scenarios

### Scenario N: {descriptive name}

\```gherkin Given {precondition events or "no prior events"} When
{CommandName}Command is issued with {field} "{value}" Then {expected outcome:
event produced or error thrown} \```

## Domain Errors

| Error       | Condition                       |
| ----------- | ------------------------------- |
| `SomeError` | When this invariant is violated |

## State Shape

\```ts { field: Type; } \```

{Brief explanation of what each field means for the decide logic.}
````

## Writing Scenarios

### Rule 1: One scenario per behavior

Each scenario tests exactly one path through the decider's `decide` function:

- One happy path (command succeeds, events produced)
- One scenario per domain error (guard clause)
- One scenario per interesting state transition (e.g., menu changed before
  order)

### Rule 2: Given = input events that build state

The "Given" clause lists the events that have occurred before the command. These
correspond to the decider's input event types (`Ei`).

```gherkin
Given RestaurantCreatedEvent occurred
  with restaurantId "restaurant-1"
  and name "Italian Bistro"
  and menu containing [Pizza ($10.00)]
```

For the initial state (no prior events):

```gherkin
Given no prior events
```

For multiple prior events, use `And`:

```gherkin
Given RestaurantCreatedEvent occurred
  with restaurantId "restaurant-1"
And RestaurantMenuChangedEvent occurred
  with restaurantId "restaurant-1"
  and new menu containing [Tacos ($8.00)]
```

### Rule 3: When = the command under test

The "When" clause is always a single command with its fields:

```gherkin
When PlaceOrderCommand is issued
  with restaurantId "restaurant-1"
  and orderId "order-1"
  and menuItems [Pizza ($10.00)]
```

### Rule 4: Then = output events or domain error

For success cases, list the expected output events:

```gherkin
Then RestaurantOrderPlacedEvent is produced
  with restaurantId "restaurant-1"
  and orderId "order-1"
```

For error cases, name the domain error:

```gherkin
Then RestaurantNotFoundError is thrown
```

### Rule 5: Scenarios map 1:1 to tests

Each scenario becomes one `Deno.test` using `DeciderEventSourcedSpec`:

```ts
// Scenario: "Successfully place an order"
DeciderEventSourcedSpec.for(placeOrderDecider)
  .given([restaurantCreatedEvent]) // Given
  .when(placeOrderCommand) // When
  .then([orderPlacedEvent]); // Then

// Scenario: "Reject when restaurant does not exist"
DeciderEventSourcedSpec.for(placeOrderDecider)
  .given([]) // Given no prior events
  .when(placeOrderCommand) // When
  .thenThrows((e) => e instanceof RestaurantNotFoundError); // Then error
```

## Identifying Scenarios from Domain Rules

To find all scenarios for a use case, ask these questions:

1. **What must exist?** → "Given no prior events" + error scenario
2. **What must NOT exist?** → "Given it already exists" + error scenario
3. **What invariants must hold?** → One error scenario per violated invariant
4. **What state transitions affect this?** → Scenarios with prior state changes
5. **What's the happy path?** → The success scenario with all preconditions met

## Cross-Boundary Use Cases

When a decider reads events from multiple entity types (like `PlaceOrder`
reading both restaurant and order events), document each boundary in the Input
Events table:

```markdown
## Input Events (Consistency Boundary)

| Event                        | Tag Field      | Purpose                             |
| ---------------------------- | -------------- | ----------------------------------- |
| `RestaurantCreatedEvent`     | `restaurantId` | Verify restaurant exists + get menu |
| `RestaurantMenuChangedEvent` | `restaurantId` | Get latest menu                     |
| `RestaurantOrderPlacedEvent` | `orderId`      | Check if this order already exists  |
```

This makes the DCB boundary explicit — the reader can see exactly which events
from which entities this use case depends on.

## Example Requirements Documents

The following examples are from a restaurant management domain. Adapt the
patterns and structure to your own domain:

### Slices (Deciders) — Given-When-Then

- [REQUIREMENTS-CreateRestaurant.md](REQUIREMENTS-CreateRestaurant.md) — simple
  single-entity slice
- [REQUIREMENTS-ChangeRestaurantMenu.md](REQUIREMENTS-ChangeRestaurantMenu.md) —
  depends on another slice's event
- [REQUIREMENTS-PlaceOrder.md](REQUIREMENTS-PlaceOrder.md) — cross-boundary
  slice (spans two entities)
- [REQUIREMENTS-MarkOrderAsPrepared.md](REQUIREMENTS-MarkOrderAsPrepared.md) —
  state lifecycle (created → prepared)

### Views (Projections) — Given-Then

Views have no command, so they use **Given-Then** format (events in, state out):

- [REQUIREMENTS-VIEW-RestaurantView.md](REQUIREMENTS-VIEW-RestaurantView.md) —
  multi-event projection
- [REQUIREMENTS-VIEW-OrderView.md](REQUIREMENTS-VIEW-OrderView.md) — status
  lifecycle projection
