"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "motion/react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface DialogProps {
  open: boolean
  onClose: () => void
  title?: React.ReactNode
  description?: React.ReactNode
  children?: React.ReactNode
  footer?: React.ReactNode
  /** "center" = modal; "side" = painel lateral à direita */
  variant?: "center" | "side"
  className?: string
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  variant = "center",
  className,
}: DialogProps) {
  const panelRef = React.useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = React.useState(false)
  const titleId = React.useId()

  React.useEffect(() => setMounted(true), [])

  React.useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    const t = window.setTimeout(() => {
      const el = panelRef.current?.querySelector<HTMLElement>(
        "[data-autofocus], input, textarea, select, button:not([data-close])"
      )
      ;(el ?? panelRef.current)?.focus()
    }, 30)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
      window.clearTimeout(t)
      previous?.focus?.()
    }
  }, [open, onClose])

  if (!mounted) return null

  const side = variant === "side"

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          className={cn(
            "fixed inset-0 z-90 flex",
            side ? "justify-end" : "items-end justify-center sm:items-center"
          )}
        >
          <motion.div
            className="absolute inset-0 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            tabIndex={-1}
            initial={side ? { x: 40, opacity: 0 } : { y: 16, opacity: 0 }}
            animate={side ? { x: 0, opacity: 1 } : { y: 0, opacity: 1 }}
            exit={side ? { x: 40, opacity: 0 } : { y: 8, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
            className={cn(
              "bg-card border-border relative flex flex-col border shadow-lg outline-none",
              side
                ? "h-full w-full max-w-lg border-y-0 border-r-0"
                : "max-h-[90dvh] w-full rounded-t-2xl sm:max-w-md sm:rounded-2xl",
              className
            )}
          >
            {(title || description) && (
              <div className="flex items-start justify-between gap-4 p-5 pb-3">
                <div className="space-y-1">
                  {title && (
                    <h2 id={titleId} className="text-base font-semibold">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="text-muted-foreground text-sm">
                      {description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  data-close
                  aria-label="Fechar"
                  onClick={onClose}
                  className="text-subtle-foreground hover:text-foreground hover:bg-muted -m-1 rounded-md p-1"
                >
                  <X size={18} />
                </button>
              </div>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
              {children}
            </div>
            {footer && (
              <div className="border-border flex flex-col-reverse gap-2 border-t px-5 py-3 sm:flex-row sm:justify-end">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
