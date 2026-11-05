import * as React from "react"
import { cn } from "@/lib/utils"
import { fieldBase, fieldError } from "./input"

export type TextareaProps =
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    error?: string
  }

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="flex w-full flex-col gap-1.5">
        <textarea
          aria-invalid={!!error || undefined}
          className={cn(
            fieldBase,
            "min-h-28 resize-y px-3 py-2 leading-relaxed",
            error && fieldError,
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <span className="text-danger text-xs">{error}</span>}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
