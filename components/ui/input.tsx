import * as React from "react"
import { cn } from "@/lib/utils"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <div className="relative flex w-full flex-col gap-1">
        <input
          type={type}
          className={cn(
            "border-border bg-muted/40 placeholder:text-muted-foreground focus-visible:ring-primary/20 focus-visible:border-primary flex h-11 w-full rounded-xl border px-4 py-2 text-sm shadow-inner transition-all focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500 focus-visible:ring-red-500",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <span className="animate-in fade-in slide-in-from-top-1 text-xs text-red-500">
            {error}
          </span>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
