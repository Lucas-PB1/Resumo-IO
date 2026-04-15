import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "motion/react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  isLoading?: boolean;
  children?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", isLoading, children, disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.96 }}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-linear-to-tr from-brand-600 to-brand-400 text-primary-foreground hover:shadow-lg hover:shadow-brand-500/20 active:brightness-95": variant === "default",
            "border border-input bg-transparent hover:bg-muted hover:text-accent-foreground shadow-sm": variant === "outline",
            "hover:bg-muted/80 hover:text-accent-foreground": variant === "ghost",
            "text-primary underline-offset-4 hover:underline": variant === "link",
            "h-11 px-6 rounded-full": size === "default",
            "h-9 px-4 rounded-full text-xs": size === "sm",
            "h-14 px-10 rounded-2xl text-base": size === "lg",
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
    );
  }
);
Button.displayName = "Button";

export { Button };
