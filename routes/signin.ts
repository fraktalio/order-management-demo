import { define } from "@/utils.ts";
import { signIn } from "@/utils/auth.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const redirect = new URL(ctx.req.url).searchParams.get("redirect") ?? "/";
    const response = await signIn(ctx.req);
    // Store the redirect target in a cookie so callback can read it
    response.headers.append(
      "set-cookie",
      `signin_redirect=${
        encodeURIComponent(redirect)
      }; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`,
    );
    return response;
  },
});
