"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("prospecta-theme-change", onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener("prospecta-theme-change", onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getThemeSnapshot(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const theme = useSyncExternalStore(subscribe, getThemeSnapshot, () => null);

  const isDark = theme === "dark";
  const label = theme === null ? "Cambiar tema" : isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro";

  function toggleTheme() {
    const nextTheme: Theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
    localStorage.setItem("prospecta-theme", nextTheme);
    window.dispatchEvent(new CustomEvent<Theme>("prospecta-theme-change", { detail: nextTheme }));
  }

  return (
    <button
      className={compact ? "theme-toggle theme-toggle-compact" : "theme-toggle"}
      type="button"
      aria-label={label}
      title={label}
      onClick={toggleTheme}
    >
      {isDark ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
      {!compact && <span>{isDark ? "Modo claro" : "Modo oscuro"}</span>}
    </button>
  );
}
