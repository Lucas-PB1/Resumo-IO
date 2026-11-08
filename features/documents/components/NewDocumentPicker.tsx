"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { FileText, Plus, Search } from "lucide-react"
import { Dialog } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { buttonVariants } from "@/components/ui/button"
import { useTemplates } from "@/features/documents/hooks/useTemplates"
import { cn } from "@/lib/utils"

interface PickerContextValue {
  open: () => void
}

const PickerContext = React.createContext<PickerContextValue>({
  open: () => {},
})

export const useNewDocument = () => React.useContext(PickerContext)

function isTypingTarget(target: EventTarget | null) {
  const el = target as HTMLElement | null
  return (
    !!el &&
    (el.tagName === "INPUT" ||
      el.tagName === "TEXTAREA" ||
      el.tagName === "SELECT" ||
      el.isContentEditable)
  )
}

/**
 * Seletor de modelo para iniciar um novo documento.
 * Atalhos: ⌘K / Ctrl+K ou "N" fora de campos de texto.
 */
export function NewDocumentProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = React.useState(false)
  const open = React.useCallback(() => setIsOpen(true), [])

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setIsOpen((v) => !v)
        return
      }
      if (
        e.key.toLowerCase() === "n" &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !isTypingTarget(e.target)
      ) {
        e.preventDefault()
        setIsOpen(true)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const value = React.useMemo(() => ({ open }), [open])

  return (
    <PickerContext.Provider value={value}>
      {children}
      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        className="sm:max-w-lg"
      >
        {isOpen && <PickerBody onDone={() => setIsOpen(false)} />}
      </Dialog>
    </PickerContext.Provider>
  )
}

function PickerBody({ onDone }: { onDone: () => void }) {
  const router = useRouter()
  const { templates, loading } = useTemplates()
  const [query, setQuery] = React.useState("")
  const [active, setActive] = React.useState(0)
  const listRef = React.useRef<HTMLUListElement>(null)

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return templates.filter(
      (t) =>
        !q ||
        t.name.toLowerCase().includes(q) ||
        (t.category ?? "").toLowerCase().includes(q) ||
        (t.subcategory ?? "").toLowerCase().includes(q)
    )
  }, [templates, query])

  React.useEffect(() => setActive(0), [query])

  const go = (id?: string) => {
    if (!id) return
    onDone()
    router.push(`/dashboard/templates/${id}/fill`)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      go(results[active]?.id)
    }
  }

  React.useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" })
  }, [active])

  return (
    <div className="-mx-5 -mb-5" onKeyDown={onKeyDown}>
      <div className="border-border flex items-center gap-2 border-b px-5 pt-5 pb-3">
        <Search size={18} className="text-subtle-foreground shrink-0" />
        <input
          data-autofocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Qual modelo você quer preencher?"
          className="placeholder:text-subtle-foreground w-full bg-transparent text-[15px] outline-none"
          aria-label="Buscar modelo"
          role="combobox"
          aria-expanded
          aria-controls="template-picker-list"
        />
      </div>

      <ul
        id="template-picker-list"
        ref={listRef}
        role="listbox"
        className="max-h-[50dvh] overflow-y-auto p-2"
      >
        {loading &&
          Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="flex items-center gap-3 px-3 py-2.5">
              <Skeleton className="h-8 w-8" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-1/2" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </li>
          ))}

        {!loading &&
          results.map((t, i) => (
            <li
              key={t.id}
              data-index={i}
              role="option"
              aria-selected={i === active}
            >
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => go(t.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left",
                  i === active && "bg-muted"
                )}
              >
                <span className="bg-accent text-accent-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
                  <FileText size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {t.name}
                  </span>
                  <span className="text-muted-foreground block truncate text-xs">
                    {[t.category, t.subcategory].filter(Boolean).join(" › ") ||
                      "Sem categoria"}
                    {" · "}
                    {t.fields.length} campos
                  </span>
                </span>
                {i === active && (
                  <kbd className="text-subtle-foreground hidden text-xs sm:block">
                    ↵
                  </kbd>
                )}
              </button>
            </li>
          ))}

        {!loading && results.length === 0 && (
          <li className="px-3 py-8 text-center">
            <p className="text-sm font-medium">
              {templates.length === 0
                ? "Você ainda não tem modelos"
                : "Nenhum modelo encontrado"}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              {templates.length === 0
                ? "Envie um .docx com {etiquetas} para começar."
                : "Tente outro termo de busca."}
            </p>
          </li>
        )}
      </ul>

      <div className="border-border bg-surface flex items-center justify-between rounded-b-2xl border-t px-5 py-2.5">
        <span className="text-subtle-foreground hidden text-xs sm:block">
          ↑↓ navegar · ↵ abrir · esc fechar
        </span>
        <Link
          href="/dashboard/templates/new"
          onClick={onDone}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <Plus size={14} /> Novo modelo
        </Link>
      </div>
    </div>
  )
}
