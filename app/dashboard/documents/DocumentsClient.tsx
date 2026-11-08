"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  Copy,
  Download,
  MoreHorizontal,
  Pencil,
  ScrollText,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react"

import { useDocuments } from "@/features/documents/hooks/useDocuments"
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

type SortKey = "recent" | "oldest" | "name"

/** Filtros persistidos na URL (dá para voltar, recarregar e compartilhar). */
function useUrlFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const filters = {
    q: params.get("q") ?? "",
    category: params.get("categoria") ?? "",
    subcategory: params.get("sub") ?? "",
    author: params.get("autor") ?? "",
    sort: (params.get("ordem") as SortKey) || "recent",
  }

  const set = (
    patch: Partial<
      Record<"q" | "categoria" | "sub" | "autor" | "ordem", string>
    >
  ) => {
    const next = new URLSearchParams(params.toString())
    Object.entries(patch).forEach(([k, v]) => {
      if (v) next.set(k, v)
      else next.delete(k)
    })
    const qs = next.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  return { filters, set }
}

export default function DocumentsClient() {
  const { documents, categories, loading, remove, update } = useDocuments()
  const { filters, set } = useUrlFilters()
  const { open: openPicker } = useNewDocument()
  const toast = useToast()
  const confirm = useConfirm()

  const [query, setQuery] = useState(filters.q)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [detailsDoc, setDetailsDoc] = useState<GeneratedDocument | null>(null)
  const [metaDoc, setMetaDoc] = useState<GeneratedDocument | null>(null)

  // Busca com pequeno atraso para não reescrever a URL a cada tecla
  React.useEffect(() => {
    const t = window.setTimeout(() => {
      if (query !== filters.q) set({ q: query })
    }, 250)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const options = useMemo(() => {
    const cats = new Set<string>()
    categories.forEach((c) => cats.add(c.name))
    documents.forEach((d) => d.category && cats.add(d.category))
    const subs = new Set<string>()
    categories
      .find((c) => c.name === filters.category)
      ?.subcategories.forEach((s) => subs.add(s))
    documents
      .filter((d) => !filters.category || d.category === filters.category)
      .forEach((d) => d.subcategory && subs.add(d.subcategory))
    const authors = new Set<string>()
    documents.forEach((d) => d.authorName && authors.add(d.authorName))
    return {
      categories: [...cats].sort(),
      subcategories: [...subs].sort(),
      authors: [...authors].sort(),
    }
  }, [documents, categories, filters.category])

  const visible = useMemo(() => {
    const q = filters.q.trim().toLowerCase()
    const list = documents.filter(
      (d) =>
        (!q ||
          d.fileName.toLowerCase().includes(q) ||
          d.templateName.toLowerCase().includes(q) ||
          (d.authorName ?? "").toLowerCase().includes(q) ||
          Object.values(d.formData ?? {}).some(
            (v) =>
              typeof v === "string" &&
              v.length < 2000 &&
              v.toLowerCase().includes(q)
          )) &&
        (!filters.category || d.category === filters.category) &&
        (!filters.subcategory || d.subcategory === filters.subcategory) &&
        (!filters.author || d.authorName === filters.author)
    )
    const ts = (d: GeneratedDocument) => d.createdAt.toMillis()
    if (filters.sort === "oldest") list.sort((a, b) => ts(a) - ts(b))
    else if (filters.sort === "name")
      list.sort((a, b) => a.fileName.localeCompare(b.fileName, "pt-BR"))
    else list.sort((a, b) => ts(b) - ts(a))
    return list
  }, [documents, filters])

  const hasFilters =
    !!filters.q ||
    !!filters.category ||
    !!filters.subcategory ||
    !!filters.author

  const clearFilters = () => {
    setQuery("")
    set({ q: "", categoria: "", sub: "", autor: "" })
  }

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

      {/* Barra de filtros */}
      <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search
            size={16}
            className="text-subtle-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
          />
          <Input
            aria-label="Buscar documentos"
            placeholder="Buscar por nome, modelo, autor ou conteúdo"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Select
            aria-label="Categoria"
            value={filters.category}
            onChange={(e) => set({ categoria: e.target.value, sub: "" })}
            className="sm:w-40"
          >
            <option value="">Todas as categorias</option>
            {options.categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Subcategoria"
            value={filters.subcategory}
            onChange={(e) => set({ sub: e.target.value })}
            disabled={options.subcategories.length === 0}
            className="sm:w-40"
          >
            <option value="">Subcategorias</option>
            {options.subcategories.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          {options.authors.length > 1 && (
            <Select
              aria-label="Autor"
              value={filters.author}
              onChange={(e) => set({ autor: e.target.value })}
              className="sm:w-36"
            >
              <option value="">Todos os autores</option>
              {options.authors.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </Select>
          )}
          <Select
            aria-label="Ordenar"
            value={filters.sort}
            onChange={(e) =>
              set({ ordem: e.target.value === "recent" ? "" : e.target.value })
            }
            className="sm:w-36"
          >
            <option value="recent">Mais recentes</option>
            <option value="oldest">Mais antigos</option>
            <option value="name">Nome (A–Z)</option>
          </Select>
        </div>
      </div>

      {hasFilters && !loading && (
        <div className="text-muted-foreground mb-3 flex items-center gap-2 text-sm">
          {visible.length} de {documents.length}
          <button
            type="button"
            onClick={clearFilters}
            className="text-foreground inline-flex items-center gap-1 font-medium hover:underline"
          >
            <X size={14} /> Limpar filtros
          </button>
        </div>
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
            <Button variant="outline" onClick={clearFilters}>
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
