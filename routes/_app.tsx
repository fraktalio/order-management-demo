import { define } from "@/utils.ts";
import Header from "../components/Header.tsx";
import Footer from "../components/Footer.tsx";

export default define.page(function App({ Component, url }) {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>order-management-demo</title>
      </head>
      <body className="bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
        <div class="flex flex-col min-h-screen">
          <Header
            title="landing"
            isSticky
            isHome={false}
            currentPath={url.pathname}
          />

          <main class="grow flex flex-col justify-center items-center">
            <Component />
          </main>

          <Footer />
        </div>
      </body>
    </html>
  );
});
