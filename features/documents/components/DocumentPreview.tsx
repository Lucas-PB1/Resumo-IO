"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import type { TemplateField } from "@/features/documents/services/template.service"
import type { TemplateFormData } from "@/features/documents/services/field-format.service"
import { previewService } from "@/features/documents/services/preview.service"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const DEBOUNCE = 450

interface DocumentPreviewProps {
  templateBuffer: ArrayBuffer | null
  formData: TemplateFormData
  fields: TemplateField[]
  activeField?: string | null
  onFieldClick?: (key: string) => void
  className?: string
}

/** Folha de papel com a prévia do documento, atualizada enquanto se digita. */
export function DocumentPreview({
  templateBuffer,
  formData,
  fields,
  activeField,
  onFieldClick,
  className,
}: DocumentPreviewProps) {
  const [html, setHtml] = React.useState<string | null>(null)
  const [rendering, setRendering] = React.useState(false)
  const [error, setError] = React.useState(false)
  const paperRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!templateBuffer) return
    let cancelled = false
    const t = window.setTimeout(
      async () => {
        setRendering(true)
        try {
          const result = await previewService.render(
            templateBuffer,
            formData,
            fields
          )
          if (!cancelled) {
            setHtml(result)
            setError(false)
          }
        } catch (err) {
          console.error("Preview error", err)
          if (!cancelled) setError(true)
        } finally {
          if (!cancelled) setRendering(false)
        }
      },
      html === null ? 0 : DEBOUNCE
    )
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateBuffer, formData, fields])

  // Destaca e rola até o campo em foco
  React.useEffect(() => {
    const root = paperRef.current
    if (!root) return
    root
      .querySelectorAll("mark[data-active]")
      .forEach((m) => m.removeAttribute("data-active"))
    if (!activeField) return
    const mark = root.querySelector<HTMLElement>(
      `mark[data-field="${CSS.escape(activeField)}"]`
    )
    if (mark) {
      mark.setAttribute("data-active", "")
      mark.scrollIntoView({ block: "center", behavior: "smooth" })
    }
  }, [activeField, html])

  const onClick = (e: React.MouseEvent) => {
    const mark = (e.target as HTMLElement).closest<HTMLElement>(
      "mark[data-field]"
    )
    if (mark?.dataset.field) onFieldClick?.(mark.dataset.field)
  }

  return (
    <div className={cn("relative", className)}>
      <div className="text-subtle-foreground mb-2 flex h-5 items-center justify-between text-xs">
        <span>Prévia do documento</span>
        {rendering && (
          <span className="flex items-center gap-1">
            <Loader2 size={12} className="animate-spin" /> atualizando
          </span>
        )}
      </div>
      <div
        ref={paperRef}
        onClick={onClick}
        className="bg-paper border-border mx-auto min-h-[60vh] w-full rounded-sm border px-[8%] py-[9%] shadow-md [&_mark]:cursor-pointer [&_mark[data-active]]:outline-2 [&_mark[data-active]]:outline-offset-1 [&_mark[data-active]]:outline-[#4d719c]"
      >
        {error ? (
          <p className="text-sm text-[#625f57]">
            Não foi possível montar a prévia deste modelo. A geração do arquivo
            continua funcionando normalmente.
          </p>
        ) : html === null ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-2/3 bg-[#eceae4]" />
            <Skeleton className="h-3 w-full bg-[#eceae4]" />
            <Skeleton className="h-3 w-full bg-[#eceae4]" />
            <Skeleton className="h-3 w-5/6 bg-[#eceae4]" />
            <Skeleton className="mt-6 h-3 w-full bg-[#eceae4]" />
            <Skeleton className="h-3 w-4/6 bg-[#eceae4]" />
          </div>
        ) : (
          <div
            className="doc-preview"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
      </div>
    </div>
  )
}
