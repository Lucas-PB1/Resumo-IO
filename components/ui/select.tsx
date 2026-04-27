import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  error?: string
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <div className="relative flex w-full flex-col gap-1">
        <select
          className={cn(
            "border-border bg-input placeholder:text-muted-foreground focus-visible:ring-primary/20 focus-visible:border-primary text-foreground [&>option]:bg-card [&>option]:text-foreground flex h-11 w-full appearance-none rounded-xl border px-4 py-2 pr-10 text-sm shadow-inner transition-all focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500 focus-visible:ring-red-500",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute top-3 right-3">
          <ChevronDown className="text-muted-foreground h-4 w-4" />
        </div>
        {error && (
          <span className="animate-in fade-in slide-in-from-top-1 text-xs text-red-500">
            {error}
          </span>
        )}
      </div>
    )
  }
)
Select.displayName = "Select"

export { Select }
