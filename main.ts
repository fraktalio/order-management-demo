import { App, HttpError, staticFiles } from "fresh";
import { type State } from "@/utils.ts";
import { sessionMiddleware } from "@/middleware/session.ts";
import { UnauthorizedError } from "@/utils/errors.ts";
import { renderErrorPage } from "@/utils/errorPage.ts";

export const app = new App<State>();

// 1. Static files
app.use(staticFiles());

// Top level error page
app.notFound((_ctx) => {
  const html = renderErrorPage(
    404,
    "Page not found",
    "The page you're looking for doesn't exist or has been moved.",
  );
  return new Response(html, {
    status: 404,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
});

// 2. Error handling
app.onError("*", (ctx) => {
  const isApiRoute = new URL(ctx.req.url).pathname.startsWith("/api");

  if (ctx.error instanceof UnauthorizedError) {
    if (isApiRoute) {
      return new Response(JSON.stringify({ error: ctx.error.message }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(null, {
      status: 302,
      headers: {
        Location: `/signin?redirect=${
          encodeURIComponent(new URL(ctx.req.url).pathname)
        }`,
      },
    });
  }

  if (isApiRoute) {
    const status = ctx.error instanceof HttpError ? ctx.error.status : 500;
    const message = ctx.error instanceof Error
      ? ctx.error.message
      : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const status = ctx.error instanceof HttpError ? ctx.error.status : 500;
  const html = renderErrorPage(
    status,
    status === 500 ? "Something went wrong" : "Error",
    status === 500
      ? "An unexpected error occurred. Please try again later."
      : (ctx.error instanceof Error ? ctx.error.message : "An error occurred."),
  );
  return new Response(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
});

// 3. Session resolution (populates ctx.state on every request)
app.use(sessionMiddleware);

// 4. File-system routes (includes /signin, /callback, /signout)
// Protected routes use filesystem-based _middleware.ts files
app.fsRoutes();

app.use(staticFiles());
