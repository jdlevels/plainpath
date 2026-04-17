import { useState, useEffect } from "react"

export type Theme = "light" | "dark" | "system"

const STORAGE_KEY = "plainpath-theme"

function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  }
  return theme
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", resolveTheme(theme) === "dark")
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      return (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "system"
    } catch {
      return "system"
    }
  })

  useEffect(() => {
    applyTheme(theme)
    if (theme !== "system") return
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => applyTheme("system")
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [theme])

  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key !== STORAGE_KEY || e.newValue === null) return
      const incoming = e.newValue as Theme
      setThemeState(incoming)
      applyTheme(incoming)
    }
    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [])

  function setTheme(t: Theme) {
    try { localStorage.setItem(STORAGE_KEY, t) } catch { }
    setThemeState(t)
  }

  return { theme, setTheme }
}
