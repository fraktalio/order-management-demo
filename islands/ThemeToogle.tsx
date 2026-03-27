// islands/ThemeToggle.tsx
import { useEffect, useState } from "preact/hooks";
import { Dark, Light } from "../components/Icons.tsx";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    //setIsDark(true);
    // Check initial theme
    if (
      localStorage.theme === "dark" ||
      (!("theme" in localStorage) &&
        globalThis.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.theme = "light";
    } else {
      document.documentElement.classList.add("dark");
      localStorage.theme = "dark";
    }
    setIsDark(!isDark);
  };

  return (
    <button
      class="hover:text-yellow-500 inline-block transition"
      type="button"
      onClick={toggleTheme}
    >
      {isDark ? <Dark /> : <Light />}
    </button>
  );
}
