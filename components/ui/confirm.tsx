"use client"

import * as React from "react"
import { Dialog } from "./dialog"
import { Button } from "./button"

interface ConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: "default" | "danger"
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>

const ConfirmContext = React.createContext<ConfirmFn | null>(null)

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = React.useState<ConfirmOptions | null>(null)
  const resolver = React.useRef<((value: boolean) => void) | null>(null)

  const confirm = React.useCallback<ConfirmFn>((opts) => {
    setOptions(opts)
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve
    })
  }, [])

  const close = React.useCallback((value: boolean) => {
    resolver.current?.(value)
    resolver.current = null
    setOptions(null)
  }, [])

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog
        open={!!options}
        onClose={() => close(false)}
        title={options?.title}
        description={options?.description}
        footer={
          <>
            <Button variant="outline" onClick={() => close(false)}>
              {options?.cancelLabel ?? "Cancelar"}
            </Button>
            <Button
              data-autofocus
              variant={options?.tone === "danger" ? "danger" : "default"}
              onClick={() => close(true)}
            >
              {options?.confirmLabel ?? "Confirmar"}
            </Button>
          </>
        }
      />
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = React.useContext(ConfirmContext)
  if (!ctx)
    throw new Error("useConfirm deve ser usado dentro de ConfirmProvider")
  return ctx
}
