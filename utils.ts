import { createDefine } from "fresh";
import type { User } from "@/utils/db.ts";

// This specifies the type of "ctx.state" which is used to share
// data among middlewares, layouts and routes.
export interface State {
  shared: string;
  sessionUser: User | null;
  sessionId: string | null;
}

export const define = createDefine<State>();
