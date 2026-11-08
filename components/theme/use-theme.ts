"use client"

import { useCallback, useEffect, useState } from "react"

export type ThemePreference = "light" | "dark" | "system"

const STORAGE_KEY = "theme"

function readPreference(): ThemePreference {
  if (typeof window === "undefined") return "system"
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (value === "light" || value === "dark") return value
  } catch {}
  return "system"
}

function apply(preference: ThemePreference) {
  const dark =
    preference === "dark" ||
    (preference === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
  document.documentElement.classList.toggle("dark", dark)
}

export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>(readPreference)

  useEffect(() => {
    if (preference !== "system") return
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => apply("system")
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [preference])

  const setTheme = useCallback((next: ThemePreference) => {
    setPreference(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {}
    apply(next)
  }, [])

  return { theme: preference, setTheme }
}
