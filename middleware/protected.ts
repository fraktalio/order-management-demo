import { define } from "@/utils.ts";
import { UnauthorizedError } from "@/utils/errors.ts";

export const protectedMiddleware = define.middleware((ctx) => {
  if (!ctx.state.sessionUser) {
    throw new UnauthorizedError();
  }
  return ctx.next();
});
