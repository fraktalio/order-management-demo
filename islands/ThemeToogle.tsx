// islands/ThemeToggle.tsx
import { useState } from "preact/hooks";
import { Dark, Light } from "../components/Icons.tsx";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

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
