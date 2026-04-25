// Light mode is intentionally removed in the fire theme. This stub remains
// only so any leftover imports continue to compile.
export function applyTheme(_theme: "light" | "dark") {
  document.documentElement.classList.add("dark");
  document.documentElement.style.colorScheme = "dark";
}

export function useTheme() {
  return { theme: "dark" as const, setTheme: (_t: "light" | "dark") => {} };
}

export default function ThemeToggle() {
  return null;
}
