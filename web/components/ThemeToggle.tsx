"use client";

import { useSyncExternalStore } from "react";

type ThemeMode = "light" | "dark";

const STORAGE_KEY = "lfdc-theme";

/**
 * Source de vérité : `document.documentElement.dataset.theme`
 * (positionné par le script inline dans <head> avant hydration React,
 * cf. `web/app/layout.tsx`). Les abonnés sont notifiés via un event
 * custom cross-composants pour garantir la synchronisation si plusieurs
 * `ThemeToggle` coexistent.
 */
const CHANGE_EVENT = "lfdc-theme-change";

function getSnapshot(): ThemeMode {
  const value = document.documentElement.dataset.theme;
  return value === "dark" ? "dark" : "light";
}

function getServerSnapshot(): ThemeMode {
  return "light";
}

function subscribe(notify: () => void) {
  const onChange = () => notify();
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) notify();
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function setThemeGlobal(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {}
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleTheme = () => {
    setThemeGlobal(theme === "light" ? "dark" : "light");
  };

  return (
    <button
      type="button"
      className="landing-theme-toggle"
      onClick={toggleTheme}
      aria-pressed={theme === "dark"}
      aria-label={
        theme === "dark" ? "Activer le mode clair" : "Activer le mode sombre"
      }
      title={theme === "dark" ? "Mode sombre" : "Mode clair"}
    >
      <span aria-hidden>{theme === "dark" ? "☀" : "☾"}</span>
    </button>
  );
}
