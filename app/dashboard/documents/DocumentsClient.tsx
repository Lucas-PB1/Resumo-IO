"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import {
  Copy,
  Download,
  MoreHorizontal,
  Pencil,
  ScrollText,
  Search,
  Tag,
  Trash2,
} from "lucide-react"

import { useDocuments } from "@/features/documents/hooks/useDocuments"
import { useTemplates } from "@/features/documents/hooks/useTemplates"
import { useDocumentFilters } from "@/features/documents/hooks/useDocumentFilters"
import { DocumentFilterBar } from "@/features/documents/components/DocumentFilterBar"
import {
  applyFilters,
  buildSearchIndex,
} from "@/features/documents/services/document-filter.service"
import { useNewDocument } from "@/features/documents/components/NewDocumentPicker"
import {
  DocumentDetailsPanel,
  duplicateDocHref,
  editDocHref,
} from "@/features/documents/components/DocumentDetailsPanel"
import type { GeneratedDocument } from "@/features/documents/services/document.service"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Dialog } from "@/components/ui/dialog"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { FileChip } from "@/components/ui/file-chip"
import { useToast } from "@/components/ui/toast"
import { useConfirm } from "@/components/ui/confirm"
import { formatDate, formatRelative } from "@/lib/format"
import { cn } from "@/lib/utils"

export default function DocumentsClient() {
  const { documents, categories, loading, remove, update } = useDocuments()
  const { templates } = useTemplates()
  const { filters, set, reset } = useDocumentFilters()
  const { open: openPicker } = useNewDocument()
  const toast = useToast()
  const confirm = useConfirm()

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [detailsDoc, setDetailsDoc] = useState<GeneratedDocument | null>(null)
  const [metaDoc, setMetaDoc] = useState<GeneratedDocument | null>(null)

  const searchIndex = useMemo(() => buildSearchIndex(documents), [documents])
  const visible = useMemo(
    () => applyFilters(documents, filters, searchIndex),
    [documents, filters, searchIndex]
  )

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const allVisibleSelected =
    visible.length > 0 && visible.every((d) => selected.has(d.id!))

  const toggleAll = () =>
    setSelected(
      allVisibleSelected ? new Set() : new Set(visible.map((d) => d.id!))
    )

  const handleDelete = async (docs: GeneratedDocument[]) => {
    const ok = await confirm({
      title:
        docs.length === 1
          ? "Excluir documento?"
          : `Excluir ${docs.length} documentos?`,
      description:
        docs.length === 1
          ? `"${docs[0].fileName}" e seus anexos serão apagados. Isso não pode ser desfeito.`
          : "Os arquivos e anexos serão apagados. Isso não pode ser desfeito.",
      confirmLabel: "Excluir",
      tone: "danger",
    })
    if (!ok) return
    try {
      await remove(docs)
      setSelected(new Set())
      if (detailsDoc && docs.some((d) => d.id === detailsDoc.id))
        setDetailsDoc(null)
      toast.success(
        docs.length === 1
          ? "Documento excluído"
          : `${docs.length} documentos excluídos`
      )
    } catch (err) {
      console.error("Delete error", err)
      toast.error("Não foi possível excluir", {
        description: "Tente novamente em instantes.",
      })
    }
  }

  const selectedDocs = visible.filter((d) => selected.has(d.id!))

  return (
    <div>
      <PageHeader
        title="Documentos"
        description={
          loading
            ? "Tudo o que você já gerou."
            : `${documents.length} ${documents.length === 1 ? "documento gerado" : "documentos gerados"}. Busque também pelo conteúdo preenchido — nome do cliente, número do processo…`
        }
        actions={
          <Button onClick={openPicker}>
            <ScrollText size={16} /> Novo documento
          </Button>
        }
      />

      {!loading && documents.length > 0 && (
        <DocumentFilterBar
          filters={filters}
          onChange={set}
          onReset={reset}
          documents={documents}
          templates={templates}
          categories={categories}
          resultCount={visible.length}
        />
      )}

      {/* Barra de seleção em lote */}
      {selected.size > 0 && (
        <div className="bg-foreground text-background mb-3 flex items-center gap-3 rounded-lg px-4 py-2 text-sm">
          <span className="font-medium">
            {selected.size} selecionado{selected.size > 1 ? "s" : ""}
          </span>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="opacity-70 hover:opacity-100"
          >
            Limpar
          </button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => handleDelete(selectedDocs)}
            className="inline-flex items-center gap-1.5 font-medium hover:underline"
          >
            <Trash2 size={14} /> Excluir
          </button>
        </div>
      )}

      {loading ? (
        <ListSkeleton />
      ) : documents.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="Nenhum documento gerado"
          description="Escolha um modelo, preencha os campos e o documento aparece aqui."
          action={<Button onClick={openPicker}>Novo documento</Button>}
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Nada encontrado"
          description="Nenhum documento corresponde aos filtros atuais."
          action={
            <Button variant="outline" onClick={reset}>
              Limpar filtros
            </Button>
          }
        />
      ) : (
        <div className="bg-card border-border overflow-hidden rounded-xl border shadow-xs">
          <table className="w-full text-sm">
            <thead className="bg-surface border-border text-muted-foreground hidden border-b text-left text-xs md:table-header-group">
              <tr>
                <th className="w-10 py-2.5 pl-4">
                  <input
                    type="checkbox"
                    aria-label="Selecionar todos"
                    checked={allVisibleSelected}
                    onChange={toggleAll}
                    className="accent-primary h-4 w-4"
                  />
                </th>
                <th className="py-2.5 pr-4 font-medium">Documento</th>
                <th className="py-2.5 pr-4 font-medium">Categoria</th>
                <th className="hidden py-2.5 pr-4 font-medium lg:table-cell">
                  Autor
                </th>
                <th className="py-2.5 pr-4 font-medium">Data</th>
                <th className="w-28" />
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {visible.map((doc) => (
                <DocumentRow
                  key={doc.id}
                  doc={doc}
                  selected={selected.has(doc.id!)}
                  onToggle={() => toggle(doc.id!)}
                  onOpen={() => setDetailsDoc(doc)}
                  onEditMeta={() => setMetaDoc(doc)}
                  onDelete={() => handleDelete([doc])}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DocumentDetailsPanel
        doc={detailsDoc}
        onClose={() => setDetailsDoc(null)}
      />

      <DocumentMetaDialog
        doc={metaDoc}
        categories={categories}
        onClose={() => setMetaDoc(null)}
        onSave={async (updates) => {
          if (!metaDoc) return
          try {
            await update(metaDoc.id!, updates)
            toast.success("Documento atualizado")
            setMetaDoc(null)
          } catch (err) {
            console.error("Update error", err)
            toast.error("Não foi possível salvar as alterações")
          }
        }}
      />
    </div>
  )
}

function DocumentRow({
  doc,
  selected,
  onToggle,
  onOpen,
  onEditMeta,
  onDelete,
}: {
  doc: GeneratedDocument
  selected: boolean
  onToggle: () => void
  onOpen: () => void
  onEditMeta: () => void
  onDelete: () => void
}) {
  const date = doc.createdAt.toDate()
  return (
    <tr
      className={cn(
        "group hover:bg-muted/50 flex cursor-pointer items-center gap-3 px-4 py-3 md:table-row md:p-0",
        selected && "bg-accent/50"
      )}
      onClick={onOpen}
    >
      <td
        className="hidden w-10 py-3 pl-4 md:table-cell"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          aria-label={`Selecionar ${doc.fileName}`}
          checked={selected}
          onChange={onToggle}
          className="accent-primary h-4 w-4"
        />
      </td>
      <td className="min-w-0 flex-1 md:py-3 md:pr-4">
        <div className="flex min-w-0 items-center gap-3">
          <FileChip fileName={doc.fileName} />
          <div className="min-w-0">
            <p className="truncate font-medium">{doc.fileName}</p>
            <p className="text-muted-foreground truncate text-xs">
              {doc.templateName}
              <span className="md:hidden">
                {" · "}
                {formatRelative(date)}
              </span>
            </p>
          </div>
        </div>
      </td>
      <td className="text-muted-foreground hidden py-3 pr-4 md:table-cell">
        {doc.category ? (
          <span>
            {doc.category}
            {doc.subcategory && (
              <span className="text-subtle-foreground">
                {" "}
                › {doc.subcategory}
              </span>
            )}
          </span>
        ) : (
          <span className="text-subtle-foreground">—</span>
        )}
      </td>
      <td className="text-muted-foreground hidden max-w-40 truncate py-3 pr-4 lg:table-cell">
        {doc.authorName || "—"}
      </td>
      <td
        className="text-muted-foreground tabular hidden py-3 pr-4 whitespace-nowrap md:table-cell"
        title={formatDate(date)}
      >
        {formatRelative(date)}
      </td>
      <td className="py-3 md:pr-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-0.5">
          <a
            href={doc.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Baixar ${doc.fileName}`}
            title="Baixar"
            className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
          >
            <Download size={15} />
          </a>
          <Link
            href={editDocHref(doc)}
            aria-label="Editar e regerar"
            title="Editar e regerar"
            className={buttonVariants({
              variant: "ghost",
              size: "icon-sm",
              className: "hidden sm:inline-flex",
            })}
          >
            <Pencil size={15} />
          </Link>
          <RowMenu doc={doc} onEditMeta={onEditMeta} onDelete={onDelete} />
        </div>
      </td>
    </tr>
  )
}

function RowMenu({
  doc,
  onEditMeta,
  onDelete,
}: {
  doc: GeneratedDocument
  onEditMeta: () => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) =>
      !ref.current?.contains(e.target as Node) && setOpen(false)
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    document.addEventListener("mousedown", close)
    document.addEventListener("keydown", esc)
    return () => {
      document.removeEventListener("mousedown", close)
      document.removeEventListener("keydown", esc)
    }
  }, [open])

  const item =
    "hover:bg-muted flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-sm"

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Mais ações"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <MoreHorizontal size={16} />
      </Button>
      {open && (
        <div
          role="menu"
          className="bg-card border-border absolute top-full right-0 z-30 mt-1 w-48 rounded-lg border p-1 shadow-lg"
        >
          <Link role="menuitem" href={duplicateDocHref(doc)} className={item}>
            <Copy size={15} className="text-muted-foreground" /> Duplicar
          </Link>
          <Link
            role="menuitem"
            href={editDocHref(doc)}
            className={cn(item, "sm:hidden")}
          >
            <Pencil size={15} className="text-muted-foreground" /> Editar e
            regerar
          </Link>
          <button
            role="menuitem"
            type="button"
            className={item}
            onClick={() => {
              setOpen(false)
              onEditMeta()
            }}
          >
            <Tag size={15} className="text-muted-foreground" /> Renomear / mover
          </button>
          <div className="border-border my-1 border-t" />
          <button
            role="menuitem"
            type="button"
            className={cn(item, "text-danger hover:bg-danger-soft")}
            onClick={() => {
              setOpen(false)
              onDelete()
            }}
          >
            <Trash2 size={15} /> Excluir
          </button>
        </div>
      )}
    </div>
  )
}

function DocumentMetaDialog({
  doc,
  categories,
  onClose,
  onSave,
}: {
  doc: GeneratedDocument | null
  categories: ReturnType<typeof useDocuments>["categories"]
  onClose: () => void
  onSave: (updates: {
    fileName: string
    category: string
    subcategory: string
  }) => Promise<void>
}) {
  const [form, setForm] = useState({
    fileName: "",
    category: "",
    subcategory: "",
  })
  const [saving, setSaving] = useState(false)

  React.useEffect(() => {
    if (doc)
      setForm({
        fileName: doc.fileName,
        category: doc.category ?? "",
        subcategory: doc.subcategory ?? "",
      })
  }, [doc])

  const subs =
    categories.find((c) => c.name === form.category)?.subcategories ?? []

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <Dialog
      open={!!doc}
      onClose={onClose}
      title="Renomear ou mover"
      description="Altera só o registro no histórico; o conteúdo do arquivo continua o mesmo."
    >
      <form id="doc-meta-form" onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="doc-name">Nome do arquivo</Label>
          <Input
            id="doc-name"
            value={form.fileName}
            onChange={(e) =>
              setForm((f) => ({ ...f, fileName: e.target.value }))
            }
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="doc-cat">Categoria</Label>
            <Select
              id="doc-cat"
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  category: e.target.value,
                  subcategory: "",
                }))
              }
            >
              <option value="">Sem categoria</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="doc-sub">Subcategoria</Label>
            <Select
              id="doc-sub"
              value={form.subcategory}
              disabled={subs.length === 0}
              onChange={(e) =>
                setForm((f) => ({ ...f, subcategory: e.target.value }))
              }
            >
              <option value="">—</option>
              {subs.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            isLoading={saving}
            disabled={!form.fileName.trim()}
          >
            Salvar
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

function ListSkeleton() {
  return (
    <div className="bg-card border-border divide-border divide-y rounded-xl border">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4">
          <Skeleton className="h-9 w-9" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-1/5" />
          </div>
          <Skeleton className="hidden h-3 w-20 md:block" />
        </div>
      ))}
    </div>
  )
}
