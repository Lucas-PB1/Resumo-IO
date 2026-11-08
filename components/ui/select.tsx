import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { fieldBase, fieldError } from "./input"

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  error?: string
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <div className="flex w-full flex-col gap-1.5">
        <div className="relative">
          <select
            aria-invalid={!!error || undefined}
            className={cn(
              fieldBase,
              "[&>option]:bg-card h-9 appearance-none pr-9 pl-3",
              error && fieldError,
              className
            )}
            ref={ref}
            {...props}
          >
            {children}
          </select>
          <ChevronDown
            size={16}
            className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2"
          />
        </div>
        {error && <span className="text-danger text-xs">{error}</span>}
      </div>
    )
  }
)
Select.displayName = "Select"

export { Select }
