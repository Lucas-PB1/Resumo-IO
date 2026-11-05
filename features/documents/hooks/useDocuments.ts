"use client"

import { useCallback, useEffect, useState } from "react"
import { useAuth } from "@/features/auth/hooks/useAuth"
import {
  documentService,
  type GeneratedDocument,
} from "@/features/documents/services/document.service"
import {
  taxonomyService,
  type Category,
} from "@/features/documents/services/taxonomy.service"

/** Documentos gerados + categorias cadastradas do usuário logado. */
export function useDocuments() {
  const { user, loading: authLoading } = useAuth()
  const [documents, setDocuments] = useState<GeneratedDocument[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([
      documentService.getDocuments(user.uid),
      taxonomyService.getCategories(user.uid),
    ])
      .then(([docs, cats]) => {
        setDocuments(docs)
        setCategories(cats)
      })
      .catch((err) => console.error("Failed to fetch documents", err))
      .finally(() => setLoading(false))
  }, [user, authLoading])

  const remove = useCallback(async (docs: GeneratedDocument[]) => {
    await Promise.all(
      docs.map((d) =>
        documentService.deleteDocument(d.id!, d.storagePath, d.evidence)
      )
    )
    const ids = new Set(docs.map((d) => d.id))
    setDocuments((prev) => prev.filter((d) => !ids.has(d.id)))
  }, [])

  const update = useCallback(
    async (id: string, updates: Partial<GeneratedDocument>) => {
      await documentService.updateDocument(id, updates)
      setDocuments((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...updates } : d))
      )
    },
    []
  )

  return {
    documents,
    categories,
    loading: authLoading || (!!user && loading),
    remove,
    update,
  }
}
