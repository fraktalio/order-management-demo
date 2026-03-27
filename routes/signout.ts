import { define } from "@/utils.ts";
import { signOut } from "@/utils/auth.ts";
import { deleteSessionUser } from "@/utils/db.ts";

export const handler = define.handlers({
  async GET(ctx) {
    // Clean up our session-to-user mapping before kv_oauth clears the session
    if (ctx.state.sessionId) {
      await deleteSessionUser(ctx.state.sessionId);
    }

    const response = await signOut(ctx.req);
    // Override redirect to go home instead of back to referrer
    return new Response(null, {
      status: 302,
      headers: {
        location: "/",
        "set-cookie": response.headers.get("set-cookie") ?? "",
      },
    });
  },
});
