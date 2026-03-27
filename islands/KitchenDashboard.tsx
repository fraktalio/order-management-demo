import { useSignal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";
import { FancyButton } from "@/components/FancyButton.tsx";

type MenuItem = { menuItemId: string; name: string; price: string };
type OrderView = {
  orderId: string;
  restaurantId: string;
  menuItems: MenuItem[];
  status: "NOT_CREATED" | "CREATED" | "PREPARED";
};

const POLL_INTERVAL = 10_000;

export default function KitchenDashboard() {
  const createdOrders = useSignal<OrderView[]>([]);
  const preparedOrders = useSignal<OrderView[]>([]);
  const autoRefresh = useSignal(true);
  const status = useSignal<
    { type: "idle" | "loading" | "error"; message?: string }
  >({ type: "idle" });
  const markingOrderId = useSignal<string | null>(null);
  const intervalRef = useRef<number | undefined>(undefined);

  const fetchOrders = async () => {
    status.value = { type: "loading" };
    try {
      const [createdRes, preparedRes] = await Promise.all([
        fetch("/api/kitchen?status=CREATED"),
        fetch("/api/kitchen?status=PREPARED"),
      ]);
      if (!createdRes.ok || !preparedRes.ok) {
        status.value = { type: "error", message: "Failed to fetch orders" };
        return;
      }
      createdOrders.value = await createdRes.json();
      preparedOrders.value = await preparedRes.json();
      status.value = { type: "idle" };
    } catch {
      status.value = { type: "error", message: "Failed to fetch orders" };
    }
  };

  const startPolling = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(
      fetchOrders,
      POLL_INTERVAL,
    ) as unknown as number;
  };

  const stopPolling = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = undefined;
  };

  useEffect(() => {
    fetchOrders();
    startPolling();
    return () => stopPolling();
  }, []);

  useEffect(() => {
    if (autoRefresh.value) {
      startPolling();
    } else {
      stopPolling();
    }
    return () => stopPolling();
  }, [autoRefresh.value]);

  const markAsPrepared = async (oid: string) => {
    markingOrderId.value = oid;
    try {
      const res = await fetch("/api/kitchen", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: oid }),
      });
      if (!res.ok) {
        const err = await res.json();
        status.value = {
          type: "error",
          message: err.error ?? "Failed to mark order as prepared",
        };
        return;
      }
      // Move order from created to prepared locally
      const order = createdOrders.value.find((o) => o.orderId === oid);
      if (order) {
        createdOrders.value = createdOrders.value.filter(
          (o) => o.orderId !== oid,
        );
        preparedOrders.value = [
          ...preparedOrders.value,
          { ...order, status: "PREPARED" },
        ];
      }
      status.value = { type: "idle" };
    } catch {
      status.value = {
        type: "error",
        message: "Failed to mark order as prepared",
      };
    } finally {
      markingOrderId.value = null;
    }
  };

  return (
    <div class="space-y-8">
      {/* Controls */}
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <label for="auto-refresh-toggle" class="text-sm font-medium">
            Auto-refresh
          </label>
          <button
            id="auto-refresh-toggle"
            type="button"
            role="switch"
            aria-checked={autoRefresh.value}
            onClick={() => (autoRefresh.value = !autoRefresh.value)}
            class={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              autoRefresh.value ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
            }`}
          >
            <span
              class={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                autoRefresh.value ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
        <FancyButton
          variant="secondary"
          size="sm"
          onClick={fetchOrders}
          disabled={status.value.type === "loading"}
        >
          {status.value.type === "loading" ? "Refreshing…" : "Refresh"}
        </FancyButton>
      </div>

      {/* Error indicator */}
      {status.value.type === "error" && (
        <p class="text-red-600 text-sm" role="alert">{status.value.message}</p>
      )}

      {/* Created Orders */}
      <section>
        <h2 class="text-xl font-semibold mb-4">Orders Awaiting Preparation</h2>
        {createdOrders.value.length === 0
          ? (
            <p class="text-gray-500 dark:text-gray-400">
              No orders awaiting preparation
            </p>
          )
          : (
            <div class="space-y-3">
              {createdOrders.value.map((order) => (
                <div
                  key={order.orderId}
                  class="rounded border border-gray-300 p-4 dark:border-gray-600"
                >
                  <div class="flex items-start justify-between gap-4">
                    <dl class="space-y-1 text-sm flex-1">
                      <div>
                        <dt class="font-medium inline">Order ID:</dt>
                        <dd class="inline">{order.orderId}</dd>
                      </div>
                      <div>
                        <dt class="font-medium inline">Restaurant ID:</dt>
                        <dd class="inline">{order.restaurantId}</dd>
                      </div>
                      <div>
                        <dt class="font-medium">Menu Items</dt>
                        <dd>
                          <ul class="list-disc pl-5">
                            {order.menuItems.map((item) => (
                              <li key={item.menuItemId}>
                                {item.name} — {item.price}
                              </li>
                            ))}
                          </ul>
                        </dd>
                      </div>
                    </dl>
                    <FancyButton
                      size="sm"
                      arrow
                      onClick={() => markAsPrepared(order.orderId)}
                      disabled={markingOrderId.value === order.orderId}
                    >
                      {markingOrderId.value === order.orderId
                        ? "Marking…"
                        : "Mark as Prepared"}
                    </FancyButton>
                  </div>
                </div>
              ))}
            </div>
          )}
      </section>

      {/* Prepared Orders */}
      <section>
        <h2 class="text-xl font-semibold mb-4">Prepared Orders</h2>
        {preparedOrders.value.length === 0
          ? (
            <p class="text-gray-500 dark:text-gray-400">
              No orders have been prepared
            </p>
          )
          : (
            <div class="space-y-3">
              {preparedOrders.value.map((order) => (
                <div
                  key={order.orderId}
                  class="rounded border border-gray-300 p-4 dark:border-gray-600"
                >
                  <dl class="space-y-1 text-sm">
                    <div>
                      <dt class="font-medium inline">Order ID:</dt>
                      <dd class="inline">{order.orderId}</dd>
                    </div>
                    <div>
                      <dt class="font-medium inline">Restaurant ID:</dt>
                      <dd class="inline">{order.restaurantId}</dd>
                    </div>
                    <div>
                      <dt class="font-medium">Menu Items</dt>
                      <dd>
                        <ul class="list-disc pl-5">
                          {order.menuItems.map((item) => (
                            <li key={item.menuItemId}>
                              {item.name} — {item.price}
                            </li>
                          ))}
                        </ul>
                      </dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
          )}
      </section>
    </div>
  );
}
