/**
 * Renders a styled HTML error page that matches the app's look and feel.
 * Used by main.ts error handlers which run outside the Fresh route tree.
 */
export function renderErrorPage(
  status: number,
  title: string,
  message: string,
): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — restaurant</title>
  <style>
    :root {
      --background: 0 0% 100%;
      --foreground: 240 10% 3.9%;
      --muted-foreground: 240 3.8% 46.1%;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --background: 240 10% 3.9%;
        --foreground: 0 0% 98%;
        --muted-foreground: 240 5% 64.9%;
      }
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: hsl(var(--background));
      color: hsl(var(--foreground));
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    .container {
      text-align: center;
      max-width: 28rem;
    }
    .status {
      font-size: 7rem;
      font-weight: 800;
      line-height: 1;
      color: hsl(var(--muted-foreground));
      opacity: 0.3;
    }
    .title {
      font-size: 1.5rem;
      font-weight: 700;
      margin-top: 0.5rem;
    }
    .message {
      color: hsl(var(--muted-foreground));
      margin-top: 0.75rem;
      line-height: 1.6;
    }
    .home-link {
      display: inline-block;
      margin-top: 2rem;
      padding: 0.5rem 1.5rem;
      border: 1px solid hsl(var(--muted-foreground));
      border-radius: 0.375rem;
      color: hsl(var(--foreground));
      text-decoration: none;
      font-size: 0.875rem;
      transition: opacity 0.15s;
    }
    .home-link:hover { opacity: 0.7; }
  </style>
</head>
<body>
  <div class="container">
    <div class="status">${status}</div>
    <h1 class="title">${title}</h1>
    <p class="message">${message}</p>
    <a href="/" class="home-link">Back to home</a>
  </div>
</body>
</html>`;
}
