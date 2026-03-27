import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import KitchenDashboard from "@/islands/KitchenDashboard.tsx";

export default define.page(function KitchenManagement() {
  return (
    <div class="px-4 py-8 mx-auto min-h-screen w-full max-w-3xl">
      <Head>
        <title>Kitchen Management</title>
      </Head>
      <h1 class="text-2xl font-bold mb-8">Kitchen Management</h1>
      <KitchenDashboard />
    </div>
  );
});
