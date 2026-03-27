import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import type { RestaurantMenuCuisine } from "@/lib/api.ts";
import { FancyButton } from "@/components/FancyButton.tsx";
import { generateId } from "@/utils/id.ts";

const CUISINE_OPTIONS: RestaurantMenuCuisine[] = [
  "GENERAL",
  "SERBIAN",
  "ITALIAN",
  "MEXICAN",
  "CHINESE",
  "INDIAN",
  "FRENCH",
];

type MenuItemRow = { menuItemId: string; name: string; price: string };
type RestaurantSummary = { restaurantId: string; name: string };

export default function ChangeMenuForm() {
  const restaurants = useSignal<RestaurantSummary[]>([]);
  const restaurantsLoading = useSignal(true);
  const restaurantId = useSignal("");
  const cuisine = useSignal<RestaurantMenuCuisine>("GENERAL");
  const menuItems = useSignal<MenuItemRow[]>([
    { menuItemId: generateId(), name: "", price: "" },
  ]);
  const status = useSignal<
    { type: "idle" | "loading" | "success" | "error"; message?: string }
  >({ type: "idle" });

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

  const addMenuItem = () => {
    menuItems.value = [
      ...menuItems.value,
      { menuItemId: generateId(), name: "", price: "" },
    ];
  };

  const removeMenuItem = (index: number) => {
    menuItems.value = menuItems.value.filter((_, i) => i !== index);
  };

  const updateMenuItem = (
    index: number,
    field: "name" | "price",
    value: string,
  ) => {
    menuItems.value = menuItems.value.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
  };

  const onRestaurantChange = async (rid: string) => {
    restaurantId.value = rid;
    if (!rid) {
      cuisine.value = "GENERAL";
      menuItems.value = [{ menuItemId: generateId(), name: "", price: "" }];
      return;
    }
    status.value = { type: "loading" };
    try {
      const res = await fetch(
        `/api/restaurant?id=${encodeURIComponent(rid)}`,
      );
      if (!res.ok) {
        const err = await res.json();
        status.value = {
          type: "error",
          message: err.error ?? "Failed to load restaurant",
        };
        return;
      }
      const data = await res.json();
      cuisine.value = data.menu.cuisine;
      menuItems.value = data.menu.menuItems.map((item: MenuItemRow) => ({
        menuItemId: item.menuItemId,
        name: item.name,
        price: item.price,
      }));
      status.value = { type: "idle" };
    } catch {
      status.value = { type: "error", message: "Request failed" };
    }
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    status.value = { type: "loading" };
    try {
      const res = await fetch("/api/restaurant", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: restaurantId.value,
          menu: {
            menuId: generateId(),
            cuisine: cuisine.value,
            menuItems: menuItems.value,
          },
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
      status.value = { type: "success", message: "Menu updated successfully" };
    } catch {
      status.value = { type: "error", message: "Request failed" };
    }
  };

  return (
    <form onSubmit={handleSubmit} class="space-y-4">
      <h2 class="text-xl font-semibold">Change Restaurant Menu</h2>

      {status.value.type === "success" && (
        <p class="text-green-600" role="status">{status.value.message}</p>
      )}
      {status.value.type === "error" && (
        <p class="text-red-600" role="alert">{status.value.message}</p>
      )}

      <div>
        <label for="change-id" class="block text-sm font-medium">
          Restaurant
        </label>
        <select
          id="change-id"
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
        <label for="change-cuisine" class="block text-sm font-medium">
          Cuisine
        </label>
        <select
          id="change-cuisine"
          value={cuisine.value}
          onChange={(
            e,
          ) => (cuisine.value = (e.target as HTMLSelectElement)
            .value as RestaurantMenuCuisine)}
          class="mt-1 block w-full rounded border border-gray-300 px-3 py-2 dark:bg-gray-800 dark:border-gray-600"
        >
          {CUISINE_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <fieldset class="space-y-2">
        <legend class="text-sm font-medium">Menu Items</legend>
        {menuItems.value.map((item, i) => (
          <div key={item.menuItemId} class="flex items-end gap-2">
            <div class="flex-1">
              <label for={`change-item-name-${i}`} class="block text-xs">
                Name
              </label>
              <input
                id={`change-item-name-${i}`}
                type="text"
                value={item.name}
                onInput={(e) =>
                  updateMenuItem(
                    i,
                    "name",
                    (e.target as HTMLInputElement).value,
                  )}
                required
                class="mt-1 block w-full rounded border border-gray-300 px-3 py-2 dark:bg-gray-800 dark:border-gray-600"
              />
            </div>
            <div class="w-28">
              <label for={`change-item-price-${i}`} class="block text-xs">
                Price
              </label>
              <input
                id={`change-item-price-${i}`}
                type="text"
                value={item.price}
                onInput={(e) =>
                  updateMenuItem(
                    i,
                    "price",
                    (e.target as HTMLInputElement).value,
                  )}
                required
                class="mt-1 block w-full rounded border border-gray-300 px-3 py-2 dark:bg-gray-800 dark:border-gray-600"
              />
            </div>
            <FancyButton
              variant="destructive"
              size="sm"
              onClick={() =>
                removeMenuItem(i)}
              disabled={menuItems.value.length <= 1}
            >
              Remove
            </FancyButton>
          </div>
        ))}
        <FancyButton
          variant="ghost"
          size="sm"
          onClick={addMenuItem}
        >
          Add Menu Item
        </FancyButton>
      </fieldset>

      <FancyButton
        type="submit"
        arrow
        disabled={status.value.type === "loading"}
      >
        {status.value.type === "loading" ? "Updating…" : "Update Menu"}
      </FancyButton>
    </form>
  );
}
