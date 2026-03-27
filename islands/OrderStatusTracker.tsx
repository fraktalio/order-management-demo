import { useSignal } from "@preact/signals";
import { FancyButton } from "@/components/FancyButton.tsx";

type MenuItem = { menuItemId: string; name: string; price: string };
type OrderView = {
  orderId: string;
  restaurantId: string;
  menuItems: MenuItem[];
  status: "NOT_CREATED" | "CREATED" | "PREPARED";
};

export default function OrderStatusTracker() {
  const orderId = useSignal("");
  const orderView = useSignal<OrderView | null>(null);
  const status = useSignal<
    { type: "idle" | "loading" | "success" | "error"; message?: string }
  >({ type: "idle" });

  const trackOrder = async () => {
    if (!orderId.value.trim()) return;
    status.value = { type: "loading" };
    orderView.value = null;
    try {
      const res = await fetch(
        `/api/order?orderId=${encodeURIComponent(orderId.value)}`,
      );
      if (!res.ok) {
        const err = await res.json();
        status.value = {
          type: "error",
          message: err.error ?? "Request failed",
        };
        return;
      }
      const data: OrderView = await res.json();
      orderView.value = data;
      status.value = { type: "success" };
    } catch {
      status.value = { type: "error", message: "Request failed" };
    }
  };

  return (
    <div class="space-y-4">
      <h2 class="text-xl font-semibold">Track Order</h2>

      {status.value.type === "error" && (
        <p class="text-red-600" role="alert">{status.value.message}</p>
      )}

      <div class="flex items-end gap-2">
        <div class="flex-1">
          <label for="track-order-id" class="block text-sm font-medium">
            Order ID
          </label>
          <input
            id="track-order-id"
            type="text"
            value={orderId.value}
            onInput={(
              e,
            ) => (orderId.value = (e.target as HTMLInputElement).value)}
            class="mt-1 block w-full rounded border border-gray-300 px-3 py-2 dark:bg-gray-800 dark:border-gray-600"
          />
        </div>
        <FancyButton
          onClick={trackOrder}
          disabled={status.value.type === "loading"}
        >
          {status.value.type === "loading" ? "Loading…" : "Track Order"}
        </FancyButton>
      </div>

      {orderView.value && (
        <div class="rounded border border-gray-300 p-4 dark:border-gray-600">
          <dl class="space-y-2 text-sm">
            <div>
              <dt class="font-medium">Order ID</dt>
              <dd>{orderView.value.orderId}</dd>
            </div>
            <div>
              <dt class="font-medium">Restaurant ID</dt>
              <dd>{orderView.value.restaurantId}</dd>
            </div>
            <div>
              <dt class="font-medium">Status</dt>
              <dd>
                <span
                  class={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                    orderView.value.status === "PREPARED"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                  }`}
                >
                  {orderView.value.status}
                </span>
              </dd>
            </div>
            <div>
              <dt class="font-medium">Menu Items</dt>
              <dd>
                <ul class="list-disc pl-5">
                  {orderView.value.menuItems.map((item) => (
                    <li key={item.menuItemId}>
                      {item.name} — {item.price}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
