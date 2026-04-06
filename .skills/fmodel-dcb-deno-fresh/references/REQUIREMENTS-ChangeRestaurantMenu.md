# Requirements: ChangeRestaurantMenu

> **Domain example**: This is from a restaurant management domain. Adapt the
> patterns and structure to your own domain.

Command: `ChangeRestaurantMenuCommand` Decider: `changeRestaurantManuDecider`
Slice: Restaurant menu update

## Description

Changes the menu of an existing restaurant. The restaurant must exist before its
menu can be changed.

## Input Events (Consistency Boundary)

| Event                    | Tag Field      | Purpose                  |
| ------------------------ | -------------- | ------------------------ |
| `RestaurantCreatedEvent` | `restaurantId` | Verify restaurant exists |

## Output Events

| Event                        | Tag Fields     |
| ---------------------------- | -------------- |
| `RestaurantMenuChangedEvent` | `restaurantId` |

## Scenarios

### Scenario 1: Successfully change restaurant menu

```gherkin
Given RestaurantCreatedEvent occurred
  with restaurantId "restaurant-1"
  and name "Italian Bistro"
  and menu containing [Pizza ($10.00), Pasta ($12.00)]
When ChangeRestaurantMenuCommand is issued
  with restaurantId "restaurant-1"
  and new menu containing [Tacos ($8.00)] cuisine MEXICAN
Then RestaurantMenuChangedEvent is produced
  with restaurantId "restaurant-1"
  and menu containing [Tacos ($8.00)] cuisine MEXICAN
```

### Scenario 2: Reject menu change for non-existent restaurant

```gherkin
Given no prior events
When ChangeRestaurantMenuCommand is issued
  with restaurantId "restaurant-1"
Then RestaurantNotFoundError is thrown
```

## Domain Errors

| Error                     | Condition                 |
| ------------------------- | ------------------------- |
| `RestaurantNotFoundError` | Restaurant does not exist |

## State Shape

```
RestaurantId | null
```

- `null` → restaurant does not exist (initial state)
- `RestaurantId` → restaurant exists
