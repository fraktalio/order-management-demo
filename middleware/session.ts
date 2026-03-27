import { define } from "@/utils.ts";
import { getSessionId } from "@/utils/auth.ts";
import { getUserBySession } from "@/utils/db.ts";

export const sessionMiddleware = define.middleware(async (ctx) => {
  try {
    const sessionId = await getSessionId(ctx.req);
    if (sessionId) {
      const user = await getUserBySession(sessionId);
      ctx.state.sessionUser = user;
      ctx.state.sessionId = sessionId;
    } else {
      ctx.state.sessionUser = null;
      ctx.state.sessionId = null;
    }
  } catch (error) {
    console.error("Session resolution error:", error);
    ctx.state.sessionUser = null;
    ctx.state.sessionId = null;
  }
  return await ctx.next();
});
