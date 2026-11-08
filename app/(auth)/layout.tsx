import React from "react"
import { Logo } from "@/components/brand/logo"
import { BRAND } from "@/lib/brand"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="grid min-h-dvh flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <aside className="bg-surface border-border relative hidden flex-col justify-between border-r p-12 lg:flex">
        <Logo />
        <div className="max-w-md space-y-6">
          <p className="font-serif text-[34px] leading-[1.15] font-medium tracking-[-0.015em]">
            O modelo é seu. O trabalho repetitivo, não.
          </p>
          <p className="text-muted-foreground text-[15px] leading-relaxed">
            {BRAND.description}
          </p>
          <PaperIllustration />
        </div>
        <p className="text-subtle-foreground text-xs">
          Seus modelos e documentos ficam privados na sua conta.
        </p>
      </aside>
      <main className="flex flex-col items-center justify-center px-4 py-10">
        <div className="mb-8 lg:hidden">
          <Logo />
        </div>
        {children}
      </main>
    </div>
  )
}

/** Folha estilizada com etiquetas sendo preenchidas. */
function PaperIllustration() {
  const line = "bg-border-strong h-1.5 rounded-full"
  return (
    <div
      aria-hidden
      className="bg-card border-border w-full max-w-sm rotate-[-1.5deg] space-y-2.5 rounded-md border p-6 shadow-md"
    >
      <div className={`${line} w-1/3`} />
      <div className="h-2" />
      <div className="flex flex-wrap items-center gap-1.5">
        <div className={`${line} w-16`} />
        <span className="bg-accent text-accent-foreground rounded px-1.5 py-0.5 font-mono text-[10px]">
          Maria A. Souza
        </span>
        <div className={`${line} w-20`} />
      </div>
      <div className={`${line} w-full`} />
      <div className="flex flex-wrap items-center gap-1.5">
        <div className={`${line} w-24`} />
        <span className="bg-warning-soft text-warning rounded px-1.5 py-0.5 font-mono text-[10px]">
          {"{numero_processo}"}
        </span>
      </div>
      <div className={`${line} w-5/6`} />
      <div className={`${line} w-2/3`} />
    </div>
  )
}
