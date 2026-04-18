---
name: fmodel-dcb-deno-fresh
description: >-
  Build event-sourced applications using the fmodel-decider library with
  Dynamic Consistency Boundary (DCB) pattern, Deno KV, and Fresh v2.
  Use when creating deciders, repositories, views, event loaders, domain
  types, branded IDs, commands, events, Given-When-Then tests, or
  Deno Fresh islands and routes for an event-sourced domain.
compatibility: >-
  Deno runtime with --unstable-kv flag. Requires jsr:@fraktalio/fmodel-decider,
  jsr:@fresh/core v2, Preact, Tailwind CSS v4, fast-check for PBT.
metadata:
  version: "1.0.0"
  author: workspace
  spec-source: https://github.com/fraktalio/fmodel-decider
---

# fmodel DCB + Deno Fresh Skill

You are building an event-sourced application using the **Dynamic Consistency
Boundary (DCB)** pattern from `@fraktalio/fmodel-decider` on **Deno** with
**Fresh v2** (Preact islands architecture) and **Deno KV** as the event store.

## Key Concept: Slice = Command = Use Case

In the DCB pattern, the fundamental unit of work is a **slice**. These three
terms are interchangeable:

- **Slice** — a vertical slice through the system handling one command
- **Command** — the single command type the slice handles
- **Use case** — the business capability the slice implements

Each slice gets its own decider, repository, test file, and requirements doc. A
slice defines its own consistency boundary by declaring which input events it
reads — it can span multiple entities (e.g., `PlaceOrder` reads both restaurant
and order events).

Examples: `CreateRestaurant`, `PlaceOrder`, `MarkOrderAsPrepared` are each a
slice.

## Core Principles

1. **Requirements as Given-When-Then / Given-Then scenarios**: every slice
   starts with a `REQUIREMENTS-{Command}.md` document that captures behavior as
   GWT scenarios. For deciders: Given = input events, When = command, Then =
   output events or domain error. For views: Given = input events, Then =
   projected state (no command). Each scenario becomes one executable test
   (`DeciderEventSourcedSpec` or `ViewSpecification`). Write requirements first,
   then generate tests, then implement.
2. **Type system as formal specification**: the `DcbDecider`, `Projection`, and
   `DenoKvEventRepository` interfaces from fmodel-decider are executable
   specifications that constrain implementations. The type system encodes domain
   rules — impossible states become compile errors, not runtime bugs.
3. **One decider per slice**: each decider handles exactly one command type and
   declares which input events it needs. One slice = one decider = one command
   handler.
4. **Pure domain logic**: deciders and views are pure functions with zero I/O.
   Side effects live only in repositories and route handlers.
5. **Branded types for IDs**: use `Brand<T, Tag>` pattern with factory functions
   to prevent mixing IDs at compile time.
6. **Discriminated unions**: every command and event has a `kind` field for
   exhaustive `switch` matching.
7. **Immutability**: all domain types use `readonly` properties.
8. **Snapshot-style events**: each event carries the full truth about its
   dimension of state, enabling O(1) reads via last-event pointers.

## Architecture Overview

```
Commands ──► Decider (decide + evolve) ──► Events
                                              │
                                              ▼
Events ──► View/Projection (evolve) ──► Read Model State
                                              │
                                              ▼
Events ──► DenoKvEventRepository ──► Deno KV (event store)
```

## When to Use This Skill

- Writing **Given-When-Then requirements** for a new slice (command handler)
- Adding a new **slice** (requirements + command + decider + repository + tests)
- Adding a new **read model** (view + event loader + tests)
- Defining new **domain types** (commands, events, branded IDs, errors)
- Creating **API routes** that dispatch commands or query views
- Building **islands** (interactive Preact components) for the dashboard
- Writing **Given-When-Then** specification tests or **property-based tests**

## File Naming Conventions

| Artifact               | Pattern                           | Location      |
| ---------------------- | --------------------------------- | ------------- |
| Slice requirements     | `REQUIREMENTS-{Command}.md`       | docs/         |
| View requirements      | `REQUIREMENTS-VIEW-{View}.md`     | docs/         |
| Domain types           | `api.ts`                          | `lib/`        |
| Decider (per slice)    | `{command}Decider.ts`             | `lib/`        |
| Repository (per slice) | `{command}Repository.ts`          | `lib/`        |
| View / Projection      | `{domain}View.ts`                 | `lib/`        |
| View event loader      | `{domain}ViewEventLoader.ts`      | `lib/`        |
| Unit tests             | `{module}_test.ts`                | `lib/`        |
| API routes             | `routes/api/{domain}/handlers.ts` | `routes/`     |
| Islands                | `{FeatureName}.tsx`               | `islands/`    |
| Static components      | `{Name}.tsx`                      | `components/` |

## Workflow: Requirements → Tests → Implementation

The recommended workflow for adding a new slice:

1. **Write requirements** in Given-When-Then format →
   `REQUIREMENTS-{CommandName}.md`
2. **Generate tests** from the scenarios → `{command}Decider_test.ts`
3. **Implement the decider** to make tests pass → `{command}Decider.ts`
4. **Wire the repository** → `{command}Repository.ts`

See [references/requirements-gwt.md](references/requirements-gwt.md) for the
full guide on writing Given-When-Then requirements, with the template and rules.

Example requirements from a restaurant domain (adapt to your domain):

- [references/REQUIREMENTS-CreateRestaurant.md](references/REQUIREMENTS-CreateRestaurant.md)
- [references/REQUIREMENTS-ChangeRestaurantMenu.md](references/REQUIREMENTS-ChangeRestaurantMenu.md)
- [references/REQUIREMENTS-PlaceOrder.md](references/REQUIREMENTS-PlaceOrder.md)
  — cross-boundary slice
- [references/REQUIREMENTS-MarkOrderAsPrepared.md](references/REQUIREMENTS-MarkOrderAsPrepared.md)

## Step-by-Step: Adding a New Slice

See [references/new-slice.md](references/new-slice.md) for the full walkthrough
with code templates.

## Step-by-Step: Adding a New Read Model

See [references/new-view.md](references/new-view.md) for the view and event
loader pattern.

Example view requirements from a restaurant domain (adapt to your domain):

- [references/REQUIREMENTS-VIEW-RestaurantView.md](references/REQUIREMENTS-VIEW-RestaurantView.md)
- [references/REQUIREMENTS-VIEW-OrderView.md](references/REQUIREMENTS-VIEW-OrderView.md)

## Domain Type Patterns

See [references/domain-types.md](references/domain-types.md) for branded IDs,
commands, events with `TypeSafeEventShape`, and domain errors.

## Testing Patterns

See [references/testing.md](references/testing.md) for Given-When-Then specs,
view specifications, integration tests, and property-based testing guidance.

## Common Commands

```bash
deno task dev                                    # Dev server
deno task build                                  # Production build
deno task check                                  # Lint + format + type check
deno test --allow-all --unstable-kv              # Run all tests
deno test --allow-all --unstable-kv lib/myDecider_test.ts  # Single file
```

## Import Convention

Always use the `@/` path alias (maps to project root):

```ts
import { define } from "@/utils.ts";
import { restaurantId } from "@/lib/api.ts";
```

## Reference Implementation

For a complete working example, see
[fraktalio/order-management-demo](https://github.com/fraktalio/order-management-demo)
— a restaurant and order management app built with this exact stack and
patterns.
