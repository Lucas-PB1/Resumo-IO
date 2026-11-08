"use client"

import { cn } from "@/lib/utils"

interface SegmentedProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string }[]
  "aria-label": string
  className?: string
}

/** Grupo de opções exclusivas, compacto (ex.: Todos | PDF | Word). */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  ...props
}: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={props["aria-label"]}
      className={cn(
        "bg-muted inline-flex h-9 w-full items-center gap-0.5 rounded-lg p-0.5",
        className
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "text-muted-foreground hover:text-foreground h-full flex-1 rounded-md px-2.5 text-[13px] font-medium whitespace-nowrap transition-colors",
            value === option.value && "bg-card text-foreground shadow-xs"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
