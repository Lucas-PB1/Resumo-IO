"use client"

import * as React from "react"
import { AnimatePresence, motion } from "motion/react"
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react"
import { cn } from "@/lib/utils"

type ToastTone = "success" | "error" | "info"

interface ToastAction {
  label: string
  onClick: () => void
}

interface ToastItem {
  id: number
  tone: ToastTone
  title: string
  description?: string
  action?: ToastAction
  duration: number
}

type ToastInput = Omit<ToastItem, "id" | "tone" | "duration"> & {
  duration?: number
}

interface ToastApi {
  success: (title: string, opts?: Omit<ToastInput, "title">) => void
  error: (title: string, opts?: Omit<ToastInput, "title">) => void
  info: (title: string, opts?: Omit<ToastInput, "title">) => void
}

const ToastContext = React.createContext<ToastApi | null>(null)

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}

const ICON_COLORS = {
  success: "text-success",
  error: "text-danger",
  info: "text-primary",
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])
  const counter = React.useRef(0)

  const dismiss = React.useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = React.useCallback(
    (tone: ToastTone, title: string, opts: Omit<ToastInput, "title"> = {}) => {
      const id = ++counter.current
      const duration = opts.duration ?? (opts.action ? 6000 : 4000)
      setToasts((prev) => [
        ...prev.slice(-3),
        { id, tone, title, duration, ...opts },
      ])
      window.setTimeout(() => dismiss(id), duration)
    },
    [dismiss]
  )

  const api = React.useMemo<ToastApi>(
    () => ({
      success: (title, opts) => push("success", title, opts),
      error: (title, opts) => push("error", title, opts),
      info: (title, opts) => push("info", title, opts),
    }),
    [push]
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-100 flex flex-col items-center gap-2 px-4 md:right-6 md:bottom-6 md:left-auto md:items-end"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const Icon = ICONS[toast.tone]
            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.18 }}
                role={toast.tone === "error" ? "alert" : "status"}
                className="bg-card border-border pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border p-3.5 shadow-lg"
              >
                <Icon
                  size={18}
                  className={cn("mt-0.5 shrink-0", ICON_COLORS[toast.tone])}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{toast.title}</p>
                  {toast.description && (
                    <p className="text-muted-foreground mt-0.5 text-[13px]">
                      {toast.description}
                    </p>
                  )}
                </div>
                {toast.action && (
                  <button
                    type="button"
                    onClick={() => {
                      toast.action?.onClick()
                      dismiss(toast.id)
                    }}
                    className="text-primary shrink-0 text-sm font-medium hover:underline"
                  >
                    {toast.action.label}
                  </button>
                )}
                <button
                  type="button"
                  aria-label="Fechar"
                  onClick={() => dismiss(toast.id)}
                  className="text-subtle-foreground hover:text-foreground -mr-1 shrink-0"
                >
                  <X size={16} />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = React.useContext(ToastContext)
  if (!ctx) throw new Error("useToast deve ser usado dentro de ToastProvider")
  return ctx
}
