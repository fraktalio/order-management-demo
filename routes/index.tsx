import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";

export default define.page(function Home(_ctx) {
  return (
    <div class="px-4 py-8 mx-auto fresh-gradient grow">
      <Head>
        <title>Demo</title>
      </Head>
      <div class="max-w-3xl mx-auto flex flex-col items-center justify-center">
        <h1 class="text-4xl font-bold text-center">
          Restaurant Order Management
        </h1>

        <p class="text-base mt-3 max-w-2xl text-gray-600 dark:text-gray-400">
          Create restaurants, manage menus, place orders, and track preparation.
        </p>

        <img
          class="my-6"
          src="/logo.png"
          width="1024"
          height="450"
          alt="order"
        />

        <p class="text-lg mt-4 max-w-2xl text-gray-700 dark:text-gray-300">
          A demo application showcasing the{" "}
          <a
            href="https://github.com/fraktalio/fmodel-decider"
            class="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300"
            target="_blank"
            rel="noopener noreferrer"
          >
            fmodel-decider
          </a>{" "}
          library and the{" "}
          <a
            href="https://dcb.events/"
            class="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300"
            target="_blank"
            rel="noopener noreferrer"
          >
            Dynamic Consistency Boundary (DCB)
          </a>{" "}
          pattern for event-sourced systems. Built with{" "}
          <a
            href="https://fresh.deno.dev"
            class="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300"
            target="_blank"
            rel="noopener noreferrer"
          >
            Deno Fresh
          </a>, Preact, and{" "}
          <a
            href="https://deno.com/kv"
            class="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300"
            target="_blank"
            rel="noopener noreferrer"
          >
            Deno KV
          </a>.
        </p>
      </div>
    </div>
  );
});
