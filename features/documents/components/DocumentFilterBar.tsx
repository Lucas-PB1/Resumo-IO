"use client"

import * as React from "react"
import { ListFilter, Search, X } from "lucide-react"
import type { GeneratedDocument } from "@/features/documents/services/document.service"
import type { DocumentTemplate } from "@/features/documents/services/template.service"
import type { Category } from "@/features/documents/services/taxonomy.service"
import {
  PERIOD_LABELS,
  SORT_LABELS,
  activeFilterCount,
  fieldOptions,
  fieldValueSuggestions,
  type DocumentFilters,
  type PeriodKey,
} from "@/features/documents/services/document-filter.service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Segmented } from "@/components/ui/segmented"
import { DebouncedInput } from "@/components/ui/debounced-input"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"

interface DocumentFilterBarProps {
  filters: DocumentFilters
  onChange: (patch: Partial<DocumentFilters>) => void
  onReset: () => void
  documents: GeneratedDocument[]
  templates: DocumentTemplate[]
  categories: Category[]
  resultCount: number
}

export function DocumentFilterBar({
  filters,
  onChange,
  onReset,
  documents,
  templates,
  categories,
  resultCount,
}: DocumentFilterBarProps) {
  const activeCount = activeFilterCount(filters)
  const [open, setOpen] = React.useState(activeCount > 0)

  const options = React.useMemo(() => {
    const sorted = (set: Set<string>) =>
      [...set].sort((a, b) => a.localeCompare(b, "pt-BR"))

    const cats = new Set<string>()
    categories.forEach((c) => cats.add(c.name))
    documents.forEach((d) => d.category && cats.add(d.category))

    const subs = new Set<string>()
    categories
      .filter((c) => !filters.category || c.name === filters.category)
      .forEach((c) => c.subcategories.forEach((s) => subs.add(s)))
    documents
      .filter((d) => !filters.category || d.category === filters.category)
      .forEach((d) => d.subcategory && subs.add(d.subcategory))

    const authors = new Set<string>()
    documents.forEach((d) => d.authorName && authors.add(d.authorName))

    // Modelos que têm documentos (inclusive modelos já excluídos)
    const tpl = new Map<string, string>()
    documents.forEach((d) => tpl.set(d.templateId, d.templateName))

    return {
      categories: sorted(cats),
      subcategories: sorted(subs),
      authors: sorted(authors),
      templates: [...tpl.entries()].sort(([, a], [, b]) =>
        a.localeCompare(b, "pt-BR")
      ),
      fields: fieldOptions(
        filters.templateId
          ? documents.filter((d) => d.templateId === filters.templateId)
          : documents,
        templates
      ),
    }
  }, [documents, categories, templates, filters.category, filters.templateId])

  const suggestions = React.useMemo(
    () => fieldValueSuggestions(documents, filters.field),
    [documents, filters.field]
  )

  const fieldLabel =
    options.fields.find((f) => f.key === filters.field)?.label ?? filters.field
  const templateName = options.templates.find(
    ([id]) => id === filters.templateId
  )?.[1]

  /** Filtros ativos como "chips" removíveis. */
  const chips: { label: string; clear: Partial<DocumentFilters> }[] = []
  if (filters.period) {
    const label =
      filters.period === "custom"
        ? customPeriodLabel(filters.from, filters.to)
        : PERIOD_LABELS[filters.period]
    chips.push({ label, clear: { period: "", from: "", to: "" } })
  }
  if (filters.templateId)
    chips.push({
      label: `Modelo: ${templateName ?? "—"}`,
      clear: { templateId: "" },
    })
  if (filters.category)
    chips.push({
      label: filters.category,
      clear: { category: "", subcategory: "" },
    })
  if (filters.subcategory)
    chips.push({ label: filters.subcategory, clear: { subcategory: "" } })
  if (filters.author)
    chips.push({ label: `Autor: ${filters.author}`, clear: { author: "" } })
  if (filters.format)
    chips.push({
      label: filters.format === "pdf" ? "PDF" : "Word",
      clear: { format: "" },
    })
  if (filters.attachments)
    chips.push({
      label: filters.attachments === "com" ? "Com anexos" : "Sem anexos",
      clear: { attachments: "" },
    })
  if (filters.field)
    chips.push({
      label: filters.value
        ? `${fieldLabel}: “${filters.value}”`
        : `${fieldLabel} preenchido`,
      clear: { field: "", value: "" },
    })

  const hasAnything = chips.length > 0 || !!filters.q

  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={16}
            className="text-subtle-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
          />
          <DebouncedInput
            aria-label="Buscar documentos"
            placeholder="Buscar por nome, modelo, cliente, nº do processo…"
            value={filters.q}
            onCommit={(q) => onChange({ q })}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={open ? "secondary" : "outline"}
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="document-filters"
            className="flex-1 sm:flex-none"
          >
            <ListFilter size={16} />
            Filtros
            {activeCount > 0 && (
              <span className="bg-primary text-primary-foreground tabular flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px]">
                {activeCount}
              </span>
            )}
          </Button>
          <div className="flex-1 sm:w-40 sm:flex-none">
            <Select
              aria-label="Ordenar"
              value={filters.sort}
              onChange={(e) =>
                onChange({ sort: e.target.value as DocumentFilters["sort"] })
              }
            >
              {Object.entries(SORT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {open && (
        <div
          id="document-filters"
          className="bg-card border-border grid grid-cols-2 gap-x-3 gap-y-4 rounded-xl border p-4 shadow-xs sm:gap-x-4 lg:grid-cols-4"
        >
          <FilterField label="Período" htmlFor="f-period">
            <Select
              id="f-period"
              value={filters.period}
              onChange={(e) => {
                const period = e.target.value as PeriodKey
                onChange(
                  period === "custom"
                    ? { period }
                    : { period, from: "", to: "" }
                )
              }}
            >
              <option value="">Qualquer data</option>
              {Object.entries(PERIOD_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </FilterField>

          {filters.period === "custom" ? (
            <div className="col-span-2 grid grid-cols-2 gap-2 sm:col-span-1">
              <FilterField label="De" htmlFor="f-from">
                <Input
                  id="f-from"
                  type="date"
                  value={filters.from}
                  max={filters.to || undefined}
                  onChange={(e) => onChange({ from: e.target.value })}
                />
              </FilterField>
              <FilterField label="Até" htmlFor="f-to">
                <Input
                  id="f-to"
                  type="date"
                  value={filters.to}
                  min={filters.from || undefined}
                  onChange={(e) => onChange({ to: e.target.value })}
                />
              </FilterField>
            </div>
          ) : null}

          <FilterField label="Modelo" htmlFor="f-template">
            <Select
              id="f-template"
              value={filters.templateId}
              onChange={(e) =>
                onChange({ templateId: e.target.value, field: "", value: "" })
              }
              disabled={options.templates.length === 0}
            >
              <option value="">Todos os modelos</option>
              {options.templates.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </Select>
          </FilterField>

          <FilterField label="Categoria" htmlFor="f-category">
            <Select
              id="f-category"
              value={filters.category}
              onChange={(e) =>
                onChange({ category: e.target.value, subcategory: "" })
              }
            >
              <option value="">Todas</option>
              {options.categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </FilterField>

          <FilterField label="Subcategoria" htmlFor="f-sub">
            <Select
              id="f-sub"
              value={filters.subcategory}
              onChange={(e) => onChange({ subcategory: e.target.value })}
              disabled={options.subcategories.length === 0}
            >
              <option value="">Todas</option>
              {options.subcategories.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </FilterField>

          {options.authors.length > 1 && (
            <FilterField label="Autor" htmlFor="f-author">
              <Select
                id="f-author"
                value={filters.author}
                onChange={(e) => onChange({ author: e.target.value })}
              >
                <option value="">Todos</option>
                {options.authors.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </Select>
            </FilterField>
          )}

          <FilterField label="Formato" className="col-span-2 sm:col-span-1">
            <Segmented
              aria-label="Formato"
              value={filters.format}
              onChange={(format) => onChange({ format })}
              options={[
                { value: "", label: "Todos" },
                { value: "pdf", label: "PDF" },
                { value: "docx", label: "Word" },
              ]}
            />
          </FilterField>

          <FilterField label="Anexos" className="col-span-2 sm:col-span-1">
            <Segmented
              aria-label="Anexos"
              value={filters.attachments}
              onChange={(attachments) => onChange({ attachments })}
              options={[
                { value: "", label: "Todos" },
                { value: "com", label: "Com" },
                { value: "sem", label: "Sem" },
              ]}
            />
          </FilterField>

          <div className="border-border col-span-2 grid gap-x-3 gap-y-4 border-t pt-4 sm:grid-cols-2 lg:col-span-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <FilterField
              label="Campo do formulário"
              htmlFor="f-field"
              hint="Ex.: só os documentos de um cliente ou de uma vara."
            >
              <Select
                id="f-field"
                value={filters.field}
                onChange={(e) => onChange({ field: e.target.value, value: "" })}
                disabled={options.fields.length === 0}
              >
                <option value="">Escolha um campo</option>
                {options.fields.map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label} ({f.count})
                  </option>
                ))}
              </Select>
            </FilterField>
            <FilterField label="Contém" htmlFor="f-value">
              <DebouncedInput
                id="f-value"
                list="f-value-suggestions"
                placeholder={
                  filters.field
                    ? `Valor de “${fieldLabel}”`
                    : "Escolha um campo primeiro"
                }
                disabled={!filters.field}
                value={filters.value}
                onCommit={(value) => onChange({ value })}
              />
              <datalist id="f-value-suggestions">
                {suggestions.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </FilterField>
          </div>
        </div>
      )}

      {hasAnything && (
        <div className="flex flex-wrap items-center gap-1.5 text-sm">
          <span className="text-muted-foreground tabular mr-1">
            {resultCount} de {documents.length}
          </span>
          {chips.map((chip) => (
            <span
              key={chip.label}
              className="bg-accent text-accent-foreground inline-flex h-7 items-center gap-1 rounded-md pr-1 pl-2.5 text-[13px]"
            >
              <span className="max-w-60 truncate">{chip.label}</span>
              <button
                type="button"
                aria-label={`Remover filtro ${chip.label}`}
                onClick={() => onChange(chip.clear)}
                className="hover:bg-background/60 rounded p-0.5"
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={onReset}
            className="text-muted-foreground hover:text-foreground ml-1 text-[13px] font-medium hover:underline"
          >
            Limpar tudo
          </button>
        </div>
      )}
    </div>
  )
}

function FilterField({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: string
  htmlFor?: string
  hint?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("min-w-0 space-y-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-muted-foreground text-xs">
        {label}
      </Label>
      {children}
      {hint && <p className="text-subtle-foreground text-xs">{hint}</p>}
    </div>
  )
}

function customPeriodLabel(from: string, to: string) {
  const fmt = (s: string) => {
    const [y, m, d] = s.split("-").map(Number)
    return y ? formatDate(new Date(y, m - 1, d)) : ""
  }
  if (from && to) return `${fmt(from)} – ${fmt(to)}`
  if (from) return `Desde ${fmt(from)}`
  if (to) return `Até ${fmt(to)}`
  return "Período personalizado"
}
