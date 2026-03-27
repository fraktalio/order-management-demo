import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { FancyButton } from "@/components/FancyButton.tsx";
import { generateId } from "@/utils/id.ts";

type MenuItemRow = { menuItemId: string; name: string; price: string };
type RestaurantSummary = { restaurantId: string; name: string };

export default function PlaceOrderForm() {
  const restaurants = useSignal<RestaurantSummary[]>([]);
  const restaurantsLoading = useSignal(true);
  const restaurantId = useSignal("");
  const orderId = useSignal<string>(generateId());
  const availableMenu = useSignal<MenuItemRow[]>([]);
  const selectedItems = useSignal<Set<string>>(new Set());
  const menuStatus = useSignal<
    { type: "idle" | "loading" | "success" | "error"; message?: string }
  >({ type: "idle" });
  const status = useSignal<
    { type: "idle" | "loading" | "success" | "error"; message?: string }
  >({ type: "idle" });
  const copied = useSignal(false);

  const fetchRestaurants = async () => {
    try {
      const res = await fetch("/api/restaurant");
      if (res.ok) {
        restaurants.value = await res.json();
      }
    } catch { /* ignore */ }
    restaurantsLoading.value = false;
  };

  // Fetch restaurant list on mount + listen for new restaurants
  useEffect(() => {
    fetchRestaurants();
    const bc = new BroadcastChannel("restaurant-created");
    bc.onmessage = () => fetchRestaurants();
    return () => bc.close();
  }, []);

  const copyOrderId = async () => {
    await navigator.clipboard.writeText(orderId.value);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1500);
  };

  const onRestaurantChange = async (rid: string) => {
    restaurantId.value = rid;
    availableMenu.value = [];
    selectedItems.value = new Set();
    if (!rid) {
      menuStatus.value = { type: "idle" };
      return;
    }
    menuStatus.value = { type: "loading" };
    try {
      const res = await fetch(
        `/api/restaurant?id=${encodeURIComponent(rid)}`,
      );
      if (!res.ok) {
        const err = await res.json();
        menuStatus.value = {
          type: "error",
          message: err.error ?? "Failed to load menu",
        };
        return;
      }
      const data = await res.json();
      availableMenu.value = (data.menu?.menuItems ?? []).map(
        (item: MenuItemRow) => ({
          menuItemId: item.menuItemId,
          name: item.name,
          price: item.price,
        }),
      );
      menuStatus.value = { type: "success" };
    } catch {
      menuStatus.value = { type: "error", message: "Failed to load menu" };
    }
  };

  const toggleItem = (menuItemId: string) => {
    const next = new Set(selectedItems.value);
    if (next.has(menuItemId)) {
      next.delete(menuItemId);
    } else {
      next.add(menuItemId);
    }
    selectedItems.value = next;
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const chosen = availableMenu.value.filter((item) =>
      selectedItems.value.has(item.menuItemId)
    );
    if (chosen.length === 0) {
      status.value = {
        type: "error",
        message: "Select at least one menu item",
      };
      return;
    }
    status.value = { type: "loading" };
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: restaurantId.value,
          orderId: orderId.value,
          menuItems: chosen,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        status.value = {
          type: "error",
          message: err.error ?? "Request failed",
        };
        return;
      }
      status.value = {
        type: "success",
        message: "Order placed successfully",
      };
      restaurantId.value = "";
      orderId.value = generateId();
      availableMenu.value = [];
      selectedItems.value = new Set();
      menuStatus.value = { type: "idle" };
    } catch {
      status.value = { type: "error", message: "Request failed" };
    }
  };

  return (
    <form onSubmit={handleSubmit} class="space-y-4">
      <h2 class="text-xl font-semibold">Place Order</h2>

      {status.value.type === "success" && (
        <p class="text-green-600" role="status">{status.value.message}</p>
      )}
      {status.value.type === "error" && (
        <p class="text-red-600" role="alert">{status.value.message}</p>
      )}

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label for="order-restaurant-id" class="block text-sm font-medium">
            Restaurant
          </label>
          <select
            id="order-restaurant-id"
            value={restaurantId.value}
            onChange={(e) =>
              onRestaurantChange((e.target as HTMLSelectElement).value)}
            required
            class="mt-1 block w-full rounded border border-gray-300 px-3 py-2 dark:bg-gray-800 dark:border-gray-600"
          >
            <option value="">
              {restaurantsLoading.value
                ? "Loading restaurants…"
                : "Select a restaurant"}
            </option>
            {restaurants.value.map((r) => (
              <option key={r.restaurantId} value={r.restaurantId}>
                {r.name} ({r.restaurantId})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label for="order-id" class="block text-sm font-medium">
            Order ID
          </label>
          <div class="mt-1 flex gap-2">
            <input
              id="order-id"
              type="text"
              value={orderId.value}
              onInput={(
                e,
              ) => (orderId.value = (e.target as HTMLInputElement).value)}
              required
              class="block w-full rounded border border-gray-300 px-3 py-2 dark:bg-gray-800 dark:border-gray-600"
            />
            <FancyButton
              variant="ghost"
              size="sm"
              onClick={copyOrderId}
            >
              {copied.value ? "✓" : "📋"}
            </FancyButton>
          </div>
        </div>
      </div>

      {menuStatus.value.type === "error" && (
        <p class="text-red-600 text-sm" role="alert">
          {menuStatus.value.message}
        </p>
      )}

      {availableMenu.value.length > 0 && (
        <fieldset class="space-y-2">
          <legend class="text-sm font-medium">
            Select Menu Items
          </legend>
          <table class="w-full text-sm border border-gray-300 dark:border-gray-600">
            <thead>
              <tr class="bg-gray-100 dark:bg-gray-800">
                <th class="px-3 py-2 text-left w-10"></th>
                <th class="px-3 py-2 text-left">Name</th>
                <th class="px-3 py-2 text-left">Price</th>
              </tr>
            </thead>
            <tbody>
              {availableMenu.value.map((item) => (
                <tr
                  key={item.menuItemId}
                  class="border-t border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => toggleItem(item.menuItemId)}
                >
                  <td class="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selectedItems.value.has(item.menuItemId)}
                      onChange={() => toggleItem(item.menuItemId)}
                      aria-label={`Select ${item.name}`}
                    />
                  </td>
                  <td class="px-3 py-2">{item.name}</td>
                  <td class="px-3 py-2">{item.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </fieldset>
      )}

      <FancyButton
        type="submit"
        arrow
        disabled={status.value.type === "loading" ||
          selectedItems.value.size === 0}
      >
        {status.value.type === "loading" ? "Placing…" : "Place Order"}
      </FancyButton>
    </form>
  );
}
