# Requirements: PlaceOrder

> **Domain example**: This is from a restaurant management domain. Adapt the
> patterns and structure to your own domain. This slice is notable because it
> spans two entity boundaries (Restaurant + Order).

Command: `PlaceOrderCommand` Decider: `placeOrderDecider` Slice: Order placement
(cross-boundary: Restaurant + Order)

## Description

Places an order at a restaurant. This use case spans two entity boundaries — it
reads restaurant state (existence, menu) and order state (duplicate check). All
ordered menu items must exist on the restaurant's current menu.

## Input Events (Consistency Boundary)

| Event                        | Tag Field      | Purpose                             |
| ---------------------------- | -------------- | ----------------------------------- |
| `RestaurantCreatedEvent`     | `restaurantId` | Verify restaurant exists + get menu |
| `RestaurantMenuChangedEvent` | `restaurantId` | Get latest menu                     |
| `RestaurantOrderPlacedEvent` | `orderId`      | Check if this order already exists  |

## Output Events

| Event                        | Tag Fields                |
| ---------------------------- | ------------------------- |
| `RestaurantOrderPlacedEvent` | `restaurantId`, `orderId` |

## Scenarios

### Scenario 1: Successfully place an order

```gherkin
Given RestaurantCreatedEvent occurred
  with restaurantId "restaurant-1"
  and menu containing [Pizza ($10.00), Pasta ($12.00)]
When PlaceOrderCommand is issued
  with restaurantId "restaurant-1"
  and orderId "order-1"
  and menuItems [Pizza ($10.00)]
Then RestaurantOrderPlacedEvent is produced
  with restaurantId "restaurant-1"
  and orderId "order-1"
  and menuItems [Pizza ($10.00)]
```

### Scenario 2: Reject order when restaurant does not exist

```gherkin
Given no prior events
When PlaceOrderCommand is issued
  with restaurantId "restaurant-1"
  and orderId "order-1"
Then RestaurantNotFoundError is thrown
```

### Scenario 3: Reject duplicate order

```gherkin
Given RestaurantCreatedEvent occurred
  with restaurantId "restaurant-1"
And RestaurantOrderPlacedEvent occurred
  with orderId "order-1"
When PlaceOrderCommand is issued
  with restaurantId "restaurant-1"
  and orderId "order-1"
Then OrderAlreadyExistsError is thrown
```

### Scenario 4: Reject order with unavailable menu items

```gherkin
Given RestaurantCreatedEvent occurred
  with restaurantId "restaurant-1"
  and menu containing [Pizza ($10.00), Pasta ($12.00)]
When PlaceOrderCommand is issued
  with restaurantId "restaurant-1"
  and orderId "order-1"
  and menuItems [InvalidItem ($99.00)]
Then MenuItemsNotAvailableError is thrown
```

### Scenario 5: Place order after menu change

```gherkin
Given RestaurantCreatedEvent occurred
  with restaurantId "restaurant-1"
  and menu containing [Pizza ($10.00), Pasta ($12.00)]
And RestaurantMenuChangedEvent occurred
  with restaurantId "restaurant-1"
  and new menu containing [Tacos ($8.00)] cuisine MEXICAN
When PlaceOrderCommand is issued
  with restaurantId "restaurant-1"
  and orderId "order-1"
  and menuItems [Tacos ($8.00)]
Then RestaurantOrderPlacedEvent is produced
  with restaurantId "restaurant-1"
  and orderId "order-1"
  and menuItems [Tacos ($8.00)]
```

## Domain Errors

| Error                        | Condition                                  |
| ---------------------------- | ------------------------------------------ |
| `RestaurantNotFoundError`    | Restaurant does not exist                  |
| `OrderAlreadyExistsError`    | Order with same ID already placed          |
| `MenuItemsNotAvailableError` | One or more menu items not on current menu |

## State Shape

```ts
{
  restaurantId: RestaurantId | null;
  menu: RestaurantMenu | null;
  orderPlaced: boolean;
}
```

- `restaurantId === null` → restaurant does not exist
- `orderPlaced === true` → this specific order already placed
- `menu` → latest menu (updated by `RestaurantMenuChangedEvent`)
