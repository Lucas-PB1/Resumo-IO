import * as React from "react"
import { cn } from "@/lib/utils"
import { motion, HTMLMotionProps } from "motion/react"
import { Loader2 } from "lucide-react"

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: "default" | "outline" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  isLoading?: boolean
  children?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      isLoading,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.96 }}
        className={cn(
          "focus-visible:ring-primary inline-flex items-center justify-center text-sm font-semibold whitespace-nowrap transition-all focus-visible:ring-1 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
          {
            "from-brand-600 to-brand-400 text-primary-foreground hover:shadow-brand-500/20 bg-linear-to-tr hover:shadow-lg active:brightness-95":
              variant === "default",
            "border-input hover:bg-muted hover:text-accent-foreground border bg-transparent shadow-sm":
              variant === "outline",
            "hover:bg-muted/80 hover:text-accent-foreground":
              variant === "ghost",
            "text-primary underline-offset-4 hover:underline":
              variant === "link",
            "h-11 rounded-full px-6": size === "default",
            "h-9 rounded-full px-4 text-xs": size === "sm",
            "h-14 rounded-2xl px-10 text-base": size === "lg",
            "h-10 w-10 rounded-full": size === "icon",
          },
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </motion.button>
    )
  }
)
Button.displayName = "Button"

export { Button }
