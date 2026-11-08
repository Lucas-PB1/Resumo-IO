"use client"

import { useCallback, useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  EMPTY_FILTERS,
  PERIOD_LABELS,
  SORT_LABELS,
  type DocumentFilters,
} from "@/features/documents/services/document-filter.service"

/** Nome de cada filtro na URL (curto e em português). */
const PARAMS: Record<keyof DocumentFilters, string> = {
  q: "q",
  category: "categoria",
  subcategory: "sub",
  author: "autor",
  templateId: "modelo",
  format: "formato",
  attachments: "anexos",
  period: "periodo",
  from: "de",
  to: "ate",
  field: "campo",
  value: "valor",
  sort: "ordem",
}

function pick<T extends string>(value: string | null, allowed: readonly T[]) {
  return allowed.includes(value as T) ? (value as T) : ("" as T)
}

/**
 * Filtros da lista de documentos persistidos na URL:
 * sobrevivem a recarregar a página, ao "voltar" e podem ser compartilhados.
 */
export function useDocumentFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const filters = useMemo<DocumentFilters>(() => {
    const get = (k: keyof DocumentFilters) => params.get(PARAMS[k]) ?? ""
    return {
      q: get("q"),
      category: get("category"),
      subcategory: get("subcategory"),
      author: get("author"),
      templateId: get("templateId"),
      format: pick(get("format"), ["pdf", "docx"] as const),
      attachments: pick(get("attachments"), ["com", "sem"] as const),
      period: pick(
        get("period"),
        Object.keys(PERIOD_LABELS) as (keyof typeof PERIOD_LABELS)[]
      ),
      from: get("from"),
      to: get("to"),
      field: get("field"),
      value: get("value"),
      sort:
        pick(
          get("sort"),
          Object.keys(SORT_LABELS) as DocumentFilters["sort"][]
        ) || "recent",
    }
  }, [params])

  const set = useCallback(
    (patch: Partial<DocumentFilters>) => {
      const next = new URLSearchParams(params.toString())
      ;(Object.keys(patch) as (keyof DocumentFilters)[]).forEach((key) => {
        const value = patch[key]
        if (value && value !== EMPTY_FILTERS[key]) next.set(PARAMS[key], value)
        else next.delete(PARAMS[key])
      })
      const qs = next.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [params, pathname, router]
  )

  /** Limpa todos os filtros, mantendo a ordenação. */
  const reset = useCallback(() => {
    const { sort } = filters
    const next = new URLSearchParams()
    if (sort !== "recent") next.set(PARAMS.sort, sort)
    const qs = next.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [filters, pathname, router])

  return { filters, set, reset }
}
