import { define } from "@/utils.ts";
import { handleCallback } from "@/utils/auth.ts";
import { createOrUpdateUser } from "@/utils/db.ts";
import type { User } from "@/utils/db.ts";

async function fetchUserFromProvider(accessToken: string): Promise<User> {
  const resp = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
    },
  });
  if (!resp.ok) {
    throw new Error(`Failed to fetch user from GitHub: ${resp.statusText}`);
  }
  const data = await resp.json();
  return {
    id: String(data.id),
    login: data.login,
    name: data.name ?? data.login,
    avatarUrl: data.avatar_url,
    email: data.email ?? null,
  };
}

export const handler = define.handlers({
  async GET(ctx) {
    const { response, sessionId, tokens } = await handleCallback(ctx.req);
    const user = await fetchUserFromProvider(tokens.accessToken);
    await createOrUpdateUser(user, sessionId);

    // Read redirect target from cookie, default to "/"
    const cookies = ctx.req.headers.get("cookie") ?? "";
    const match = cookies.match(/signin_redirect=([^;]+)/);
    const redirect = match ? decodeURIComponent(match[1]) : "/";

    // Clear the redirect cookie and redirect to the original URL
    const headers = new Headers(response.headers);
    headers.set("location", redirect);
    headers.append(
      "set-cookie",
      "signin_redirect=; Path=/; HttpOnly; Max-Age=0",
    );
    return new Response(null, { status: 302, headers });
  },
});
