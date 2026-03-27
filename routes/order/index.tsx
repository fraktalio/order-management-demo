import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import PlaceOrderForm from "@/islands/PlaceOrderForm.tsx";
import OrderStatusTracker from "@/islands/OrderStatusTracker.tsx";

export default define.page(function OrderManagement() {
  return (
    <div class="px-4 py-8 mx-auto min-h-screen w-full max-w-3xl">
      <Head>
        <title>Order Management</title>
      </Head>
      <h1 class="text-2xl font-bold mb-8">Order Management</h1>
      <div class="space-y-12">
        <PlaceOrderForm />
        <hr class="border-gray-300 dark:border-gray-600" />
        <OrderStatusTracker />
      </div>
    </div>
  );
});
