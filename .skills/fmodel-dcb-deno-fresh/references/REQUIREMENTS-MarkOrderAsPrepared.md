# Requirements: MarkOrderAsPrepared

> **Domain example**: This is from a restaurant management domain. Adapt the
> patterns and structure to your own domain.

Command: `MarkOrderAsPreparedCommand` Decider: `markOrderAsPreparedDecider`
Slice: Order preparation

## Description

Marks an existing order as prepared. The order must exist and must not have been
prepared already.

## Input Events (Consistency Boundary)

| Event                        | Tag Field | Purpose                   |
| ---------------------------- | --------- | ------------------------- |
| `RestaurantOrderPlacedEvent` | `orderId` | Verify order exists       |
| `OrderPreparedEvent`         | `orderId` | Check if already prepared |

## Output Events

| Event                | Tag Fields |
| -------------------- | ---------- |
| `OrderPreparedEvent` | `orderId`  |

## Scenarios

### Scenario 1: Successfully mark order as prepared

```gherkin
Given RestaurantOrderPlacedEvent occurred
  with restaurantId "restaurant-1"
  and orderId "order-1"
  and menuItems [Pizza ($10.00)]
When MarkOrderAsPreparedCommand is issued
  with orderId "order-1"
Then OrderPreparedEvent is produced
  with orderId "order-1"
```

### Scenario 2: Reject when order does not exist

```gherkin
Given no prior events
When MarkOrderAsPreparedCommand is issued
  with orderId "order-1"
Then OrderNotFoundError is thrown
```

### Scenario 3: Reject when order already prepared

```gherkin
Given RestaurantOrderPlacedEvent occurred
  with orderId "order-1"
And OrderPreparedEvent occurred
  with orderId "order-1"
When MarkOrderAsPreparedCommand is issued
  with orderId "order-1"
Then OrderAlreadyPreparedError is thrown
```

## Domain Errors

| Error                       | Condition                       |
| --------------------------- | ------------------------------- |
| `OrderNotFoundError`        | Order does not exist            |
| `OrderAlreadyPreparedError` | Order has already been prepared |

## State Shape

```ts
{
  orderId: OrderId | null;
  prepared: boolean;
}
```

- `orderId === null` → order does not exist (initial state)
- `prepared === true` → order already prepared
