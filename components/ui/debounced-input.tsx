"use client"

import * as React from "react"
import { Input, type InputProps } from "./input"

type DebouncedInputProps = Omit<InputProps, "value" | "onChange"> & {
  value: string
  onCommit: (value: string) => void
  delay?: number
}

/**
 * Input que responde na hora ao digitar, mas só "confirma" o valor
 * (ex.: na URL) depois de uma pausa. Acompanha mudanças externas do valor.
 */
export function DebouncedInput({
  value,
  onCommit,
  delay = 250,
  ...props
}: DebouncedInputProps) {
  const [local, setLocal] = React.useState(value)
  const [external, setExternal] = React.useState(value)

  // Valor mudou por fora (ex.: "Limpar filtros"): sincroniza.
  if (value !== external) {
    setExternal(value)
    setLocal(value)
  }

  const commit = React.useRef(onCommit)
  React.useEffect(() => {
    commit.current = onCommit
  })

  React.useEffect(() => {
    if (local === value) return
    const t = window.setTimeout(() => commit.current(local), delay)
    return () => window.clearTimeout(t)
  }, [local, value, delay])

  return (
    <Input
      {...props}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
    />
  )
}
