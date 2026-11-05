"use client"

import { ArrowDown, ArrowUp, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import type { TemplateField } from "@/features/documents/services/template.service"

interface TemplateFieldListProps {
  fields: TemplateField[]
  isScanning: boolean
  emptyMessage: string
  onChange: (index: number, updates: Partial<TemplateField>) => void
  onRemove: (index: number) => void
  onMove?: (index: number, delta: -1 | 1) => void
}

export const FIELD_TYPE_LABELS: Record<TemplateField["type"], string> = {
  text: "Texto curto",
  textarea: "Texto longo",
  date: "Data",
  phone: "Telefone",
  image: "Imagem",
}

export function TemplateFieldList({
  fields,
  isScanning,
  emptyMessage,
  onChange,
  onRemove,
  onMove,
}: TemplateFieldListProps) {
  return (
    <div className="bg-card border-border rounded-xl border shadow-xs">
      <div className="border-border flex items-center justify-between border-b px-5 py-3.5">
        <div>
          <h2 className="text-sm font-medium">Campos do formulário</h2>
          <p className="text-muted-foreground text-[13px]">
            Encontrados no arquivo. Ajuste o nome que aparece no formulário, o
            tipo e a ordem.
          </p>
        </div>
        {fields.length > 0 && (
          <span className="text-muted-foreground tabular text-sm">
            {fields.length}
          </span>
        )}
      </div>

      {isScanning ? (
        <div className="divide-border divide-y">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3 px-5 py-3">
              <Skeleton className="h-9 flex-1" />
              <Skeleton className="h-9 w-36" />
            </div>
          ))}
        </div>
      ) : fields.length === 0 ? (
        <p className="text-muted-foreground px-5 py-14 text-center text-sm">
          {emptyMessage}
        </p>
      ) : (
        <ol className="divide-border divide-y">
          {fields.map((field, index) => (
            <li
              key={field.key}
              className="group flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <code className="text-subtle-foreground block truncate font-mono text-[11px]">
                  {`{${field.key}}`}
                </code>
                <Input
                  aria-label={`Rótulo de ${field.key}`}
                  value={field.label}
                  onChange={(e) => onChange(index, { label: e.target.value })}
                  placeholder="Nome no formulário"
                />
              </div>
              <div className="flex items-end gap-1 sm:pt-4">
                <Select
                  aria-label={`Tipo de ${field.key}`}
                  value={field.type}
                  onChange={(e) =>
                    onChange(index, {
                      type: e.target.value as TemplateField["type"],
                    })
                  }
                  className="sm:w-36"
                >
                  {Object.entries(FIELD_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
                {onMove && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Mover para cima"
                      disabled={index === 0}
                      onClick={() => onMove(index, -1)}
                    >
                      <ArrowUp size={15} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Mover para baixo"
                      disabled={index === fields.length - 1}
                      onClick={() => onMove(index, 1)}
                    >
                      <ArrowDown size={15} />
                    </Button>
                  </>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remover ${field.key}`}
                  onClick={() => onRemove(index)}
                  className="hover:text-danger"
                >
                  <Trash2 size={15} />
                </Button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
