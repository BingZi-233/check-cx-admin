"use client"

import * as React from "react"

export type ThemePreference = "light" | "dark" | "system"
export type ResolvedTheme = "light" | "dark"

const THEME_STORAGE_KEY = "check-cx-admin:theme"

type ThemeContextValue = {
  theme: ThemePreference
  resolvedTheme: ResolvedTheme
  setTheme: (theme: ThemePreference) => void
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null)

function normalizeThemePreference(value: string | null): ThemePreference {
  if (value === "light" || value === "dark" || value === "system") return value
  return "system"
}

function getSystemResolvedTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function resolveTheme(theme: ThemePreference): ResolvedTheme {
  return theme === "system" ? getSystemResolvedTheme() : theme
}

function applyResolvedTheme(resolvedTheme: ResolvedTheme, theme: ThemePreference) {
  const root = document.documentElement
  const isDark = resolvedTheme === "dark"

  root.classList.toggle("dark", isDark)
  root.style.colorScheme = isDark ? "dark" : "light"
  root.dataset.theme = theme
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = React.useState<ThemePreference>("system")
  const [initialized, setInitialized] = React.useState(false)
  const [resolvedTheme, setResolvedTheme] =
    React.useState<ResolvedTheme>(() => {
      if (typeof document === "undefined") return "light"
      return document.documentElement.classList.contains("dark") ? "dark" : "light"
    })

  React.useEffect(() => {
    const stored = normalizeThemePreference(localStorage.getItem(THEME_STORAGE_KEY))
    setTheme(stored)
    setResolvedTheme(resolveTheme(stored))
    setInitialized(true)
  }, [])

  React.useEffect(() => {
    if (!initialized) return
    const resolved = resolveTheme(theme)
    setResolvedTheme(resolved)
    applyResolvedTheme(resolved, theme)
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme, initialized])

  React.useEffect(() => {
    if (theme !== "system") return

    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => {
      const resolved = resolveTheme("system")
      setResolvedTheme(resolved)
      applyResolvedTheme(resolved, "system")
    }

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", onChange)
      return () => media.removeEventListener("change", onChange)
    }

    media.addListener(onChange)
    return () => media.removeListener(onChange)
  }, [theme])

  React.useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) return
      const next = normalizeThemePreference(event.newValue)
      setTheme(next)
    }

    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  const value = React.useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
  return ctx
}
