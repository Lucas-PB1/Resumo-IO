"use client"

import * as React from "react"
import { Paperclip, X } from "lucide-react"
import type { Evidence } from "@/features/documents/services/document.service"
import { FileChip } from "@/components/ui/file-chip"
import { Button } from "@/components/ui/button"
import { formatBytes } from "@/lib/format"
import { cn } from "@/lib/utils"

interface EvidencePanelProps {
  existing: Evidence[]
  pending: File[]
  onAdd: (files: File[]) => void
  onRemove: (index: number) => void
}

/** Anexos que fundamentam o documento (provas, PDFs, fotos). */
export function EvidencePanel({
  existing,
  pending,
  onAdd,
  onRemove,
}: EvidencePanelProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = React.useState(false)

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-medium">Anexos</h2>
        <p className="text-muted-foreground text-[13px]">
          Provas e documentos de apoio. Ficam guardados junto com o documento no
          histórico.
        </p>
      </div>

      {(existing.length > 0 || pending.length > 0) && (
        <ul className="border-border divide-border divide-y rounded-lg border">
          {existing.map((ev) => (
            <li key={ev.storagePath} className="flex items-center gap-3 p-2.5">
              <FileChip fileName={ev.fileName} className="h-8 w-8" />
              <a
                href={ev.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 flex-1 truncate text-sm hover:underline"
              >
                {ev.fileName}
              </a>
              <span className="text-subtle-foreground text-xs">salvo</span>
            </li>
          ))}
          {pending.map((file, i) => (
            <li
              key={`${file.name}-${i}`}
              className="flex items-center gap-3 p-2.5"
            >
              <FileChip fileName={file.name} className="h-8 w-8" />
              <span className="min-w-0 flex-1 truncate text-sm">
                {file.name}
              </span>
              <span className="text-subtle-foreground tabular text-xs">
                {formatBytes(file.size)}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Remover ${file.name}`}
                onClick={() => onRemove(i)}
              >
                <X size={14} />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          onAdd(Array.from(e.dataTransfer.files))
        }}
        className={cn(
          "border-border-strong text-muted-foreground hover:bg-muted/60 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-3 text-sm transition-colors",
          dragging && "border-primary bg-accent"
        )}
      >
        <Paperclip size={16} />
        <span>
          <span className="text-foreground font-medium">Adicionar anexos</span>{" "}
          · PDF, DOCX ou imagens até 50 MB
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.docx,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          onAdd(Array.from(e.target.files || []))
          e.target.value = ""
        }}
      />
    </section>
  )
}
