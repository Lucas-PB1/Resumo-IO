import * as React from "react"
import { cn } from "@/lib/utils"

export type TextareaProps =
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    error?: string
  }

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="relative flex w-full flex-col gap-1">
        <textarea
          className={cn(
            "border-border bg-muted/40 placeholder:text-muted-foreground focus-visible:ring-primary/20 focus-visible:border-primary flex min-h-32 w-full resize-y rounded-xl border px-4 py-3 text-sm shadow-inner transition-all focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
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
Textarea.displayName = "Textarea"

export { Textarea }
