"use client"

import * as React from "react"
import Link from "next/link"
import { Copy, Download, Pencil } from "lucide-react"
import type { GeneratedDocument } from "@/features/documents/services/document.service"
import {
  templateService,
  type DocumentTemplate,
} from "@/features/documents/services/template.service"
import { fieldFormatService } from "@/features/documents/services/field-format.service"
import { Dialog } from "@/components/ui/dialog"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { FileChip } from "@/components/ui/file-chip"
import { formatDate } from "@/lib/format"

export const editDocHref = (doc: GeneratedDocument) =>
  `/dashboard/templates/${doc.templateId}/fill?editDocId=${doc.id}`
export const duplicateDocHref = (doc: GeneratedDocument) =>
  `/dashboard/templates/${doc.templateId}/fill?fromDocId=${doc.id}`

function displayValue(
  type: string,
  value: string | number | boolean | null | undefined
) {
  if (type === "date") return fieldFormatService.formatDateForDisplay(value)
  if (type === "phone") return fieldFormatService.formatPhoneForInput(value)
  return value === null || value === undefined ? "" : String(value)
}

export function DocumentDetailsPanel({
  doc,
  onClose,
}: {
  doc: GeneratedDocument | null
  onClose: () => void
}) {
  const [template, setTemplate] = React.useState<DocumentTemplate | null>(null)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (!doc) return
    setLoading(true)
    setTemplate(null)
    templateService
      .getTemplateById(doc.templateId)
      .then(setTemplate)
      .catch((err) => console.error("Failed to fetch template", err))
      .finally(() => setLoading(false))
  }, [doc])

  return (
    <Dialog
      open={!!doc}
      onClose={onClose}
      variant="side"
      title={doc?.fileName}
      description={
        doc &&
        `${doc.templateName} · gerado em ${formatDate(doc.createdAt.toDate())}${doc.authorName ? ` por ${doc.authorName}` : ""}`
      }
    >
      {doc && (
        <div className="space-y-7">
          <div className="flex flex-wrap gap-2">
            <a
              href={doc.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants()}
            >
              <Download size={16} /> Baixar
            </a>
            <Link
              href={editDocHref(doc)}
              className={buttonVariants({ variant: "outline" })}
            >
              <Pencil size={16} /> Editar e regerar
            </Link>
            <Link
              href={duplicateDocHref(doc)}
              className={buttonVariants({ variant: "outline" })}
            >
              <Copy size={16} /> Duplicar
            </Link>
          </div>

          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground text-xs">Categoria</dt>
              <dd className="mt-0.5">{doc.category || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Subcategoria</dt>
              <dd className="mt-0.5">{doc.subcategory || "—"}</dd>
            </div>
          </dl>

          {doc.evidence && doc.evidence.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-sm font-medium">
                Anexos{" "}
                <span className="text-muted-foreground font-normal">
                  ({doc.evidence.length})
                </span>
              </h3>
              <ul className="border-border divide-border divide-y rounded-lg border">
                {doc.evidence.map((ev) => (
                  <li key={ev.storagePath}>
                    <a
                      href={ev.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:bg-muted flex items-center gap-3 p-2.5 text-sm"
                    >
                      <FileChip fileName={ev.fileName} className="h-8 w-8" />
                      <span className="min-w-0 flex-1 truncate">
                        {ev.fileName}
                      </span>
                      <Download size={14} className="text-subtle-foreground" />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="space-y-3">
            <h3 className="text-sm font-medium">Dados preenchidos</h3>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ))}
              </div>
            ) : !template ? (
              <p className="text-muted-foreground text-sm">
                O modelo original não está mais disponível.
              </p>
            ) : (
              <dl className="border-border divide-border divide-y rounded-lg border">
                {template.fields.map((field) => {
                  const raw = doc.formData?.[field.key]
                  const value = displayValue(field.type, raw)
                  return (
                    <div key={field.key} className="space-y-1 p-3">
                      <dt className="text-muted-foreground text-xs">
                        {field.label}
                      </dt>
                      <dd className="text-sm whitespace-pre-wrap">
                        {field.type === "image" &&
                        typeof raw === "string" &&
                        raw ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={raw}
                            alt={field.label}
                            className="max-h-40 rounded-md"
                          />
                        ) : (
                          value || (
                            <span className="text-subtle-foreground">
                              Não preenchido
                            </span>
                          )
                        )}
                      </dd>
                    </div>
                  )
                })}
              </dl>
            )}
          </section>
        </div>
      )}
    </Dialog>
  )
}
