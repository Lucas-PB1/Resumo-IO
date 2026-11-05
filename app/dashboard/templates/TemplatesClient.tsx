"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  Download,
  FileStack,
  Pencil,
  Search,
  Trash2,
  Upload,
} from "lucide-react"

import { useTemplates } from "@/features/documents/hooks/useTemplates"
import {
  templateService,
  type DocumentTemplate,
} from "@/features/documents/services/template.service"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/toast"
import { useConfirm } from "@/components/ui/confirm"
import { formatRelative } from "@/lib/format"
import { cn } from "@/lib/utils"

const ALL = "__all__"
const NONE = "Sem categoria"

export default function TemplatesClient() {
  const { templates, setTemplates, loading } = useTemplates()
  const toast = useToast()
  const confirm = useConfirm()
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState(ALL)

  const categories = useMemo(() => {
    const counts = new Map<string, number>()
    templates.forEach((t) => {
      const c = t.category || NONE
      counts.set(c, (counts.get(c) ?? 0) + 1)
    })
    return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b, "pt-BR"))
  }, [templates])

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = templates.filter(
      (t) =>
        (category === ALL || (t.category || NONE) === category) &&
        (!q ||
          t.name.toLowerCase().includes(q) ||
          (t.subcategory ?? "").toLowerCase().includes(q) ||
          t.fields.some((f) => f.label.toLowerCase().includes(q)))
    )
    const map = new Map<string, DocumentTemplate[]>()
    list
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
      .forEach((t) => {
        const c = t.category || NONE
        map.set(c, [...(map.get(c) ?? []), t])
      })
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b, "pt-BR"))
  }, [templates, query, category])

  const handleDelete = async (template: DocumentTemplate) => {
    const ok = await confirm({
      title: "Excluir modelo?",
      description: `"${template.name}" será removido. Documentos já gerados com ele continuam no histórico.`,
      confirmLabel: "Excluir modelo",
      tone: "danger",
    })
    if (!ok) return
    try {
      await templateService.deleteTemplate(template.id!, template.storagePath)
      setTemplates((prev) => prev.filter((t) => t.id !== template.id))
      toast.success("Modelo excluído")
    } catch (err) {
      console.error("Failed to delete template", err)
      toast.error("Não foi possível excluir o modelo")
    }
  }

  return (
    <div>
      <PageHeader
        title="Modelos"
        description="Arquivos Word com etiquetas entre chaves. Cada modelo vira um formulário."
        actions={
          <Link href="/dashboard/templates/new" className={buttonVariants()}>
            <Upload size={16} /> Enviar modelo
          </Link>
        }
      />

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <EmptyState
          icon={FileStack}
          title="Nenhum modelo ainda"
          description={
            <>
              Abra um documento no Word, troque o que muda por etiquetas como{" "}
              <code className="font-mono text-[12px]">{"{nome_cliente}"}</code>{" "}
              e envie o .docx.
            </>
          }
          action={
            <Link href="/dashboard/templates/new" className={buttonVariants()}>
              <Upload size={16} /> Enviar primeiro modelo
            </Link>
          }
        />
      ) : (
        <>
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative md:w-72">
              <Search
                size={16}
                className="text-subtle-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
              />
              <Input
                aria-label="Buscar modelos"
                placeholder="Buscar modelo ou campo"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {categories.length > 1 && (
              <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
                {[[ALL, templates.length] as const, ...categories].map(
                  ([name, count]) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setCategory(name)}
                      aria-pressed={category === name}
                      className={cn(
                        "border-border text-muted-foreground hover:text-foreground h-8 shrink-0 rounded-full border px-3 text-[13px] transition-colors",
                        category === name &&
                          "border-foreground bg-foreground text-background hover:text-background"
                      )}
                    >
                      {name === ALL ? "Todos" : name}{" "}
                      <span className="opacity-60">{count}</span>
                    </button>
                  )
                )}
              </div>
            )}
          </div>

          {grouped.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Nenhum modelo encontrado"
              description="Tente outro termo ou categoria."
            />
          ) : (
            <div className="space-y-8">
              {grouped.map(([cat, items]) => (
                <section key={cat} className="space-y-3">
                  {category === ALL && categories.length > 1 && (
                    <h2 className="text-muted-foreground text-sm font-medium">
                      {cat}
                    </h2>
                  )}
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((t) => (
                      <TemplateCard
                        key={t.id}
                        template={t}
                        onDelete={() => handleDelete(t)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function TemplateCard({
  template,
  onDelete,
}: {
  template: DocumentTemplate
  onDelete: () => void
}) {
  const iconBtn = buttonVariants({ variant: "ghost", size: "icon-sm" })
  const imageCount = template.fields.filter((f) => f.type === "image").length

  return (
    <div className="bg-card border-border hover:border-border-strong group flex flex-col rounded-xl border shadow-xs transition-colors">
      <div className="flex-1 p-4">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/dashboard/templates/${template.id}/fill`}
            className="line-clamp-2 text-[15px] font-medium hover:underline"
          >
            {template.name}
          </Link>
          <div className="-mt-1 -mr-1 flex shrink-0 opacity-100 transition-opacity md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
            <Link
              href={`/dashboard/templates/${template.id}/edit`}
              className={iconBtn}
              aria-label="Editar modelo"
              title="Editar modelo"
            >
              <Pencil size={15} />
            </Link>
            <a
              href={template.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={iconBtn}
              aria-label="Baixar .docx original"
              title="Baixar .docx original"
            >
              <Download size={15} />
            </a>
            <button
              type="button"
              onClick={onDelete}
              className={cn(iconBtn, "hover:text-danger")}
              aria-label="Excluir modelo"
              title="Excluir"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
        <p className="text-muted-foreground mt-1 text-xs">
          {template.subcategory ? `${template.subcategory} · ` : ""}
          {template.fields.length} campos
          {imageCount > 0 &&
            ` · ${imageCount} ${imageCount === 1 ? "imagem" : "imagens"}`}
          {template.createdAt &&
            ` · ${formatRelative(template.createdAt.toDate())}`}
        </p>
        {template.fields.length > 0 && (
          <p className="text-subtle-foreground mt-3 line-clamp-2 text-xs">
            {template.fields.map((f) => f.label).join(" · ")}
          </p>
        )}
      </div>
      <Link
        href={`/dashboard/templates/${template.id}/fill`}
        className="border-border text-primary hover:bg-muted flex items-center justify-between rounded-b-xl border-t px-4 py-2.5 text-sm font-medium"
      >
        Preencher
        <ArrowRight
          size={15}
          className="transition-transform group-hover:translate-x-0.5"
        />
      </Link>
    </div>
  )
}
