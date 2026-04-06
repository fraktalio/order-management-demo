# Requirements: RestaurantView

> **Domain example**: This is from a restaurant management domain. Adapt the
> patterns and structure to your own domain.

View: `restaurantView` Projection:
`Projection<RestaurantView | null, RestaurantEvent>`

## Description

A read-model projection that builds a denormalized restaurant state from
restaurant-related events. Used for querying restaurant details including
current name and menu.

## Input Events

| Event                        | Purpose                       |
| ---------------------------- | ----------------------------- |
| `RestaurantCreatedEvent`     | Initialize restaurant state   |
| `RestaurantMenuChangedEvent` | Update menu to latest version |

## View State Shape

```ts
type RestaurantView = {
  readonly restaurantId: RestaurantId;
  readonly name: RestaurantName;
  readonly menu: RestaurantMenu;
} | null;
```

- `null` → no restaurant created yet (initial state)

## Scenarios

Views use **Given-Then** format (no "When" — there is no command, only events
folded into state).

### Scenario 1: Restaurant created

```gherkin
Given RestaurantCreatedEvent occurred
  with restaurantId "restaurant-1"
  and name "Italian Bistro"
  and menu containing [Pizza ($10.00), Pasta ($12.00)]
Then view state is
  restaurantId "restaurant-1"
  name "Italian Bistro"
  menu containing [Pizza ($10.00), Pasta ($12.00)]
```

### Scenario 2: Menu changed after creation

```gherkin
Given RestaurantCreatedEvent occurred
  with restaurantId "restaurant-1"
  and name "Italian Bistro"
  and menu containing [Pizza ($10.00), Pasta ($12.00)]
And RestaurantMenuChangedEvent occurred
  with restaurantId "restaurant-1"
  and menu containing [Tacos ($8.00)] cuisine MEXICAN
Then view state is
  restaurantId "restaurant-1"
  name "Italian Bistro"
  menu containing [Tacos ($8.00)] cuisine MEXICAN
```

### Scenario 3: Menu changed without prior creation (null state)

```gherkin
Given RestaurantMenuChangedEvent occurred
  with restaurantId "restaurant-1"
  and menu containing [Tacos ($8.00)]
Then view state is null
```

### Scenario 4: Only restaurant events affect state

```gherkin
Given RestaurantCreatedEvent occurred
  with restaurantId "restaurant-1"
  and name "Italian Bistro"
  and menu containing [Pizza ($10.00), Pasta ($12.00)]
Then view state is
  restaurantId "restaurant-1"
  name "Italian Bistro"
  menu containing [Pizza ($10.00), Pasta ($12.00)]
```

> Note: `RestaurantOrderPlacedEvent` is not part of the `RestaurantEvent` union
> — the view only handles events it declares in its event type.

## Key Design Decisions

- Menu change on null state returns null (no partial state creation)
- The view preserves the original restaurant name even after menu changes
- Exhaustive `switch` with `never` check ensures all event types are handled
