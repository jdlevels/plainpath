import { useState, useEffect } from "react"

type Theme = "light" | "dark" | "system"

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function applyTheme(theme: Theme) {
  const resolved = theme === "system" ? getSystemTheme() : theme
  document.documentElement.classList.toggle("dark", resolved === "dark")
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      return (localStorage.getItem("plainpath-marketing-theme") as Theme) ?? "system"
    } catch {
      return "system"
    }
  })

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    if (theme !== "system") return
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => applyTheme("system")
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [theme])

  const setTheme = (t: Theme) => {
    setThemeState(t)
    try { localStorage.setItem("plainpath-marketing-theme", t) } catch {}
  }

  const isDark = theme === "dark" || (theme === "system" && getSystemTheme() === "dark")

  return { theme, setTheme, isDark }
}
