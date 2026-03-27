import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import CreateRestaurantForm from "@/islands/CreateRestaurantForm.tsx";
import ChangeMenuForm from "@/islands/ChangeMenuForm.tsx";

export default define.page(function RestaurantManagement() {
  return (
    <div class="px-4 py-8 mx-auto min-h-screen w-full max-w-3xl">
      <Head>
        <title>Restaurant Management</title>
      </Head>
      <h1 class="text-2xl font-bold mb-8">Restaurant Management</h1>
      <div class="space-y-12">
        <CreateRestaurantForm />
        <hr class="border-gray-300 dark:border-gray-600" />
        <ChangeMenuForm />
      </div>
    </div>
  );
});
