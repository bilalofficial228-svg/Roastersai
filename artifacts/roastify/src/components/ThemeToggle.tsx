import { useState, useEffect } from "react";

function getStoredTheme(): "dark" | "light" {
  try {
    const stored = localStorage.getItem("roastify:theme");
    if (stored === "light" || stored === "dark") return stored;
  } catch {}
  return "dark";
}

function applyTheme(theme: "dark" | "light") {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
    root.style.colorScheme = "dark";
  } else {
    root.classList.remove("dark");
    root.style.colorScheme = "light";
  }
}

export function useThemeInit() {
  useEffect(() => {
    const theme = getStoredTheme();
    applyTheme(theme);
  }, []);
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">(getStoredTheme);

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem("roastify:theme", theme);
    } catch {}
  }, [theme]);

  const toggle = () => setTheme(prev => (prev === "dark" ? "light" : "dark"));

  return (
    <button
      data-testid="button-theme-toggle"
      onClick={toggle}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="p-3 rounded-full border border-border bg-muted/50 hover:bg-muted text-xl transition-all hover:scale-110 active:scale-95"
      style={{ lineHeight: 1 }}
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
