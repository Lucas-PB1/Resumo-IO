import type { GeneratedDocument } from "./document.service"
import type { DocumentTemplate } from "./template.service"
import { fieldFormatService } from "./field-format.service"

/**
 * Filtros da lista de documentos. Funções puras: recebem os documentos já
 * carregados e devolvem o recorte — fáceis de testar e reutilizar.
 */

export type SortKey = "recent" | "oldest" | "name" | "template"
export type PeriodKey = "" | "hoje" | "7d" | "30d" | "mes" | "ano" | "custom"
export type FormatKey = "" | "pdf" | "docx"
export type AttachmentsKey = "" | "com" | "sem"

export interface DocumentFilters {
  q: string
  category: string
  subcategory: string
  author: string
  templateId: string
  format: FormatKey
  attachments: AttachmentsKey
  period: PeriodKey
  /** YYYY-MM-DD, usado quando period = "custom" */
  from: string
  to: string
  /** Chave de um campo do formulário (ex.: nome_autor) */
  field: string
  /** Valor procurado dentro desse campo */
  value: string
  sort: SortKey
}

export const EMPTY_FILTERS: DocumentFilters = {
  q: "",
  category: "",
  subcategory: "",
  author: "",
  templateId: "",
  format: "",
  attachments: "",
  period: "",
  from: "",
  to: "",
  field: "",
  value: "",
  sort: "recent",
}

export const PERIOD_LABELS: Record<Exclude<PeriodKey, "">, string> = {
  hoje: "Hoje",
  "7d": "Últimos 7 dias",
  "30d": "Últimos 30 dias",
  mes: "Este mês",
  ano: "Este ano",
  custom: "Personalizado",
}

export const SORT_LABELS: Record<SortKey, string> = {
  recent: "Mais recentes",
  oldest: "Mais antigos",
  name: "Nome (A–Z)",
  template: "Modelo (A–Z)",
}

/** Minúsculas e sem acento: "Petição" e "peticao" se encontram. */
export function normalize(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
}

/** Valores de campo que vale a pena indexar (ignora imagens em base64). */
function textValue(value: unknown): string | null {
  if (typeof value === "number") return String(value)
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  if (!trimmed || trimmed.startsWith("data:") || trimmed.length > 5000)
    return null
  return trimmed
}

/** Representações de um valor para busca: o bruto e o formatado (datas). */
function searchableForms(raw: string) {
  const display = fieldFormatService.formatDateForDisplay(raw)
  return display && display !== raw ? `${raw} ${display}` : raw
}

export function fileFormat(doc: GeneratedDocument): FormatKey {
  const name = doc.fileName.toLowerCase()
  if (name.endsWith(".pdf")) return "pdf"
  if (name.endsWith(".docx")) return "docx"
  return ""
}

/** Texto pré-normalizado de cada documento, para a busca livre. */
export function buildSearchIndex(documents: GeneratedDocument[]) {
  const index = new Map<string, string>()
  documents.forEach((doc) => {
    const parts = [
      doc.fileName,
      doc.templateName,
      doc.authorName ?? "",
      doc.category ?? "",
      doc.subcategory ?? "",
      ...(doc.evidence ?? []).map((e) => e.fileName),
      ...Object.values(doc.formData ?? {})
        .map(textValue)
        .filter((v): v is string => !!v)
        .map(searchableForms),
    ]
    index.set(doc.id!, normalize(parts.join(" \u0000 ")))
  })
  return index
}

/** Intervalo [início, fim) em ms para o período escolhido. */
export function periodRange(
  filters: Pick<DocumentFilters, "period" | "from" | "to">,
  now = new Date()
): [number, number] | null {
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const day = 86_400_000
  const end = startOfDay(now) + day

  switch (filters.period) {
    case "hoje":
      return [startOfDay(now), end]
    case "7d":
      return [end - 7 * day, end]
    case "30d":
      return [end - 30 * day, end]
    case "mes":
      return [new Date(now.getFullYear(), now.getMonth(), 1).getTime(), end]
    case "ano":
      return [new Date(now.getFullYear(), 0, 1).getTime(), end]
    case "custom": {
      const parse = (s: string) => {
        const [y, m, d] = s.split("-").map(Number)
        return y && m && d ? new Date(y, m - 1, d).getTime() : null
      }
      const from = parse(filters.from)
      const to = parse(filters.to)
      if (from === null && to === null) return null
      return [from ?? 0, to !== null ? to + day : Number.MAX_SAFE_INTEGER]
    }
    default:
      return null
  }
}

export function applyFilters(
  documents: GeneratedDocument[],
  filters: DocumentFilters,
  index: Map<string, string>,
  now = new Date()
) {
  const tokens = normalize(filters.q).split(/\s+/).filter(Boolean)
  const range = periodRange(filters, now)
  const fieldValue = normalize(filters.value.trim())

  const list = documents.filter((doc) => {
    if (tokens.length) {
      const text = index.get(doc.id!) ?? ""
      if (!tokens.every((t) => text.includes(t))) return false
    }
    if (filters.category && doc.category !== filters.category) return false
    if (filters.subcategory && doc.subcategory !== filters.subcategory)
      return false
    if (filters.author && doc.authorName !== filters.author) return false
    if (filters.templateId && doc.templateId !== filters.templateId)
      return false
    if (filters.format && fileFormat(doc) !== filters.format) return false
    if (filters.attachments) {
      const has = (doc.evidence?.length ?? 0) > 0
      if (filters.attachments === "com" ? !has : has) return false
    }
    if (range) {
      const ts = doc.createdAt.toMillis()
      if (ts < range[0] || ts >= range[1]) return false
    }
    if (filters.field) {
      const raw = textValue(doc.formData?.[filters.field])
      if (!raw) return false
      if (fieldValue && !normalize(searchableForms(raw)).includes(fieldValue))
        return false
    }
    return true
  })

  const ts = (d: GeneratedDocument) => d.createdAt.toMillis()
  const byText = (a: string, b: string) => a.localeCompare(b, "pt-BR")
  switch (filters.sort) {
    case "oldest":
      return list.sort((a, b) => ts(a) - ts(b))
    case "name":
      return list.sort((a, b) => byText(a.fileName, b.fileName))
    case "template":
      return list.sort(
        (a, b) => byText(a.templateName, b.templateName) || ts(b) - ts(a)
      )
    default:
      return list.sort((a, b) => ts(b) - ts(a))
  }
}

export interface FieldOption {
  key: string
  label: string
  /** Em quantos documentos o campo está preenchido */
  count: number
}

/**
 * Campos preenchidos nos documentos, com rótulo vindo do modelo.
 * Ordenados pelos mais usados — viram opções do filtro "Campo".
 */
export function fieldOptions(
  documents: GeneratedDocument[],
  templates: DocumentTemplate[]
): FieldOption[] {
  const labels = new Map<string, string>()
  const imageKeys = new Set<string>()
  templates.forEach((t) =>
    t.fields.forEach((f) => {
      if (f.type === "image") imageKeys.add(f.key)
      else if (!labels.has(f.key)) labels.set(f.key, f.label)
    })
  )

  const counts = new Map<string, number>()
  documents.forEach((doc) =>
    Object.entries(doc.formData ?? {}).forEach(([key, value]) => {
      if (imageKeys.has(key) || !textValue(value)) return
      counts.set(key, (counts.get(key) ?? 0) + 1)
    })
  )

  return [...counts.entries()]
    .map(([key, count]) => ({
      key,
      label:
        labels.get(key) ??
        key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " "),
      count,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

/** Valores mais frequentes de um campo — sugestões para o filtro. */
export function fieldValueSuggestions(
  documents: GeneratedDocument[],
  key: string,
  limit = 30
) {
  if (!key) return []
  const counts = new Map<string, number>()
  documents.forEach((doc) => {
    const raw = textValue(doc.formData?.[key])
    if (!raw || raw.length > 120) return
    const display = fieldFormatService.formatDateForDisplay(raw) || raw
    counts.set(display, (counts.get(display) ?? 0) + 1)
  })
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([v]) => v)
}

/** Quantos filtros (além da busca e da ordenação) estão ativos. */
export function activeFilterCount(filters: DocumentFilters) {
  return [
    filters.category,
    filters.subcategory,
    filters.author,
    filters.templateId,
    filters.format,
    filters.attachments,
    filters.period,
    filters.field,
  ].filter(Boolean).length
}
