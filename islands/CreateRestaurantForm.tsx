import { useSignal } from "@preact/signals";
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

export default function CreateRestaurantForm() {
  const restaurantId = useSignal("");
  const name = useSignal("");
  const cuisine = useSignal<RestaurantMenuCuisine>("GENERAL");
  const menuItems = useSignal<MenuItemRow[]>([
    { menuItemId: generateId(), name: "", price: "" },
  ]);
  const status = useSignal<
    { type: "idle" | "loading" | "success" | "error"; message?: string }
  >({ type: "idle" });

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

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    status.value = { type: "loading" };
    try {
      const res = await fetch("/api/restaurant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: restaurantId.value,
          name: name.value,
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
      status.value = {
        type: "success",
        message: "Restaurant created successfully",
      };
      // Notify sibling islands to refresh their restaurant lists
      new BroadcastChannel("restaurant-created").postMessage("refresh");
      restaurantId.value = "";
      name.value = "";
      cuisine.value = "GENERAL";
      menuItems.value = [{
        menuItemId: generateId(),
        name: "",
        price: "",
      }];
    } catch {
      status.value = { type: "error", message: "Request failed" };
    }
  };

  return (
    <form onSubmit={handleSubmit} class="space-y-4">
      <h2 class="text-xl font-semibold">Create Restaurant</h2>

      {status.value.type === "success" && (
        <p class="text-green-600" role="status">{status.value.message}</p>
      )}
      {status.value.type === "error" && (
        <p class="text-red-600" role="alert">{status.value.message}</p>
      )}

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label for="create-name" class="block text-sm font-medium">
            Restaurant Name
          </label>
          <input
            id="create-name"
            type="text"
            value={name.value}
            onInput={(e) => (name.value = (e.target as HTMLInputElement).value)}
            required
            class="mt-1 block w-full rounded border border-gray-300 px-3 py-2 dark:bg-gray-800 dark:border-gray-600"
          />
        </div>
        <div>
          <label for="create-id" class="block text-sm font-medium">
            Restaurant ID
          </label>
          <input
            id="create-id"
            type="text"
            value={restaurantId.value}
            onInput={(
              e,
            ) => (restaurantId.value = (e.target as HTMLInputElement).value)}
            required
            class="mt-1 block w-full rounded border border-gray-300 px-3 py-2 dark:bg-gray-800 dark:border-gray-600"
          />
        </div>
      </div>

      <div>
        <label for="create-cuisine" class="block text-sm font-medium">
          Cuisine
        </label>
        <select
          id="create-cuisine"
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
              <label for={`create-item-name-${i}`} class="block text-xs">
                Name
              </label>
              <input
                id={`create-item-name-${i}`}
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
              <label for={`create-item-price-${i}`} class="block text-xs">
                Price
              </label>
              <input
                id={`create-item-price-${i}`}
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
        {status.value.type === "loading" ? "Creating…" : "Create Restaurant"}
      </FancyButton>
    </form>
  );
}
