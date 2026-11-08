"use client"

import { Monitor, Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme, type ThemePreference } from "./use-theme"

const OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
]

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()

  return (
    <div
      role="radiogroup"
      aria-label="Tema"
      className={cn(
        "bg-muted inline-flex items-center gap-0.5 rounded-lg p-0.5",
        className
      )}
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          title={label}
          onClick={() => setTheme(value)}
          className={cn(
            "text-muted-foreground hover:text-foreground flex h-7 flex-1 items-center justify-center rounded-md px-2 transition-colors",
            theme === value && "bg-card text-foreground shadow-xs"
          )}
        >
          <Icon size={14} />
          <span className="sr-only">{label}</span>
        </button>
      ))}
    </div>
  )
}
