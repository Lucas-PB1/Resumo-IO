import * as React from "react"
import { cn } from "@/lib/utils"

export const fieldBase =
  "w-full rounded-lg border border-border-strong bg-input text-foreground text-sm placeholder:text-subtle-foreground transition-[border-color,box-shadow] outline-none focus-visible:outline-none focus:border-primary focus:ring-3 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"

export const fieldError =
  "border-danger focus:border-danger focus:ring-danger/20"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, id, ...props }, ref) => {
    const errorId = error && id ? `${id}-error` : undefined
    return (
      <div className="flex w-full flex-col gap-1.5">
        <input
          id={id}
          type={type}
          aria-invalid={!!error || undefined}
          aria-describedby={errorId}
          className={cn(fieldBase, "h-9 px-3", error && fieldError, className)}
          ref={ref}
          {...props}
        />
        {error && (
          <span id={errorId} className="text-danger text-xs">
            {error}
          </span>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
