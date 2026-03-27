import { define } from "@/utils.ts";
import { handleGet, handlePost } from "./handlers.ts";

export const handler = define.handlers({
  POST(ctx) {
    return handlePost(ctx.req);
  },
  GET(ctx) {
    return handleGet(ctx.req);
  },
});
