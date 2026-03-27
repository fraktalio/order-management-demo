import { define } from "@/utils.ts";
import { handleGet, handlePost, handlePut } from "./handlers.ts";

export const handler = define.handlers({
  POST(ctx) {
    return handlePost(ctx.req);
  },
  PUT(ctx) {
    return handlePut(ctx.req);
  },
  GET(ctx) {
    return handleGet(ctx.req);
  },
});
