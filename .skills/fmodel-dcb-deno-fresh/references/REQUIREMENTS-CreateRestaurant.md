# Requirements: CreateRestaurant

> **Domain example**: This is from a restaurant management domain. Adapt the
> patterns and structure to your own domain.

Command: `CreateRestaurantCommand` Decider: `createRestaurantDecider` Slice:
Restaurant creation

## Description

Registers a new restaurant with a name and initial menu. The system must prevent
duplicate restaurant creation.

## Input Events (Consistency Boundary)

| Event                    | Tag Field      | Purpose                    |
| ------------------------ | -------------- | -------------------------- |
| `RestaurantCreatedEvent` | `restaurantId` | Check if restaurant exists |

## Output Events

| Event                    | Tag Fields     |
| ------------------------ | -------------- |
| `RestaurantCreatedEvent` | `restaurantId` |

## Scenarios

### Scenario 1: Successfully create a restaurant

```gherkin
Given no prior events
When CreateRestaurantCommand is issued
  with restaurantId "restaurant-1"
  and name "Italian Bistro"
  and menu containing [Pizza ($10.00), Pasta ($12.00)]
Then RestaurantCreatedEvent is produced
  with restaurantId "restaurant-1"
  and name "Italian Bistro"
  and menu containing [Pizza ($10.00), Pasta ($12.00)]
```

### Scenario 2: Reject duplicate restaurant creation

```gherkin
Given RestaurantCreatedEvent occurred
  with restaurantId "restaurant-1"
When CreateRestaurantCommand is issued
  with restaurantId "restaurant-1"
Then RestaurantAlreadyExistsError is thrown
```

## Domain Errors

| Error                          | Condition                              |
| ------------------------------ | -------------------------------------- |
| `RestaurantAlreadyExistsError` | Restaurant with same ID already exists |

## State Shape

```
RestaurantId | null
```

- `null` → restaurant does not exist (initial state)
- `RestaurantId` → restaurant exists
