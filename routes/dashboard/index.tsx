import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";

export default define.page(function Dashboard(ctx) {
  const user = ctx.state.sessionUser!;

  return (
    <div class="px-4 py-8 mx-auto min-h-screen">
      <Head>
        <title>Dashboard</title>
      </Head>
      <div class="max-w-3xl mx-auto">
        <div class="flex items-center gap-4 mb-8">
          <img
            src={user.avatarUrl}
            width="48"
            height="48"
            alt={`${user.name}'s avatar`}
            class="rounded-full"
          />
          <div>
            <h1 class="text-2xl font-bold">Welcome, {user.name}</h1>
            <p class="text-gray-600">@{user.login}</p>
          </div>
        </div>
        <p>This is a protected page. Only signed-in users can see this.</p>
        <a
          href="/signout"
          f-client-nav={false}
          class="text-blue-600 underline mt-4 inline-block"
        >
          Sign out
        </a>
      </div>
    </div>
  );
});
