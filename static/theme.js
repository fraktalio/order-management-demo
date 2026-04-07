(function () {
  try {
    var d = document.documentElement.classList;
    var t = localStorage.theme;
    if (
      t === "dark" ||
      (t == null && matchMedia("(prefers-color-scheme:dark)").matches)
    ) {
      d.add("dark");
    } else {
      d.remove("dark");
    }
  } catch (_) { /* localStorage may be unavailable */ }
})();
