(() => {
  try {
    const cl = document.documentElement.classList;
    const theme = localStorage.theme;
    if (
      theme === "dark" ||
      (theme == null && matchMedia("(prefers-color-scheme:dark)").matches)
    ) {
      cl.add("dark");
    } else {
      cl.remove("dark");
    }
  } catch (_) { /* localStorage may be unavailable */ }
})();
