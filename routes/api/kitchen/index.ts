import { define } from "@/utils.ts";
import { handleGet, handlePut } from "./handlers.ts";

export const handler = define.handlers({
  GET(ctx) {
    return handleGet(ctx.req);
  },
  PUT(ctx) {
    return handlePut(ctx.req);
  },
});
