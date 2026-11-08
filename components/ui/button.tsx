import * as React from "react"
import { cn } from "@/lib/utils"
import { motion, HTMLMotionProps } from "motion/react"
import { Loader2 } from "lucide-react"

export type ButtonVariant =
  | "default"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "link"
export type ButtonSize = "sm" | "default" | "lg" | "icon" | "icon-sm"

const VARIANTS: Record<ButtonVariant, string> = {
  default:
    "bg-primary text-primary-foreground hover:bg-primary-hover shadow-xs",
  secondary: "bg-muted text-foreground hover:bg-border/70",
  outline:
    "border border-border-strong bg-card text-foreground hover:bg-muted shadow-xs",
  ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
  danger: "bg-danger text-white hover:brightness-95 shadow-xs",
  link: "text-primary underline-offset-4 hover:underline px-0 h-auto",
}

const SIZES: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 rounded-md px-3 text-[13px]",
  default: "h-9 gap-2 rounded-lg px-3.5 text-sm",
  lg: "h-11 gap-2 rounded-lg px-5 text-[15px]",
  icon: "h-9 w-9 rounded-lg",
  "icon-sm": "h-7 w-7 rounded-md",
}

/** Classes de botão para usar em <Link> ou <a> sem aninhar <button>. */
export function buttonVariants({
  variant = "default",
  size = "default",
  className,
}: {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
} = {}) {
  return cn(
    "inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap transition-colors select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
    VARIANTS[variant],
    variant !== "link" && SIZES[size],
    className
  )
}

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: ButtonVariant
  size?: ButtonSize
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
      type = "button",
      ...props
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        type={type}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
        className={buttonVariants({ variant, size, className })}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </motion.button>
    )
  }
)
Button.displayName = "Button"

export { Button }
