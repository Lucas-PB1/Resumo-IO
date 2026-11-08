"use client"

import { useCallback, useEffect, useState } from "react"
import { useAuth } from "@/features/auth/hooks/useAuth"
import {
  templateService,
  type DocumentTemplate,
} from "@/features/documents/services/template.service"

/** Lista de modelos do usuário logado. */
export function useTemplates() {
  const { user, loading: authLoading } = useAuth()
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      setTemplates(await templateService.getTemplates(user.uid))
      setError(null)
    } catch (err) {
      console.error("Failed to fetch templates", err)
      setError("Não foi possível carregar os modelos.")
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) reload()
    else if (!authLoading) setLoading(false)
  }, [user, authLoading, reload])

  return {
    templates,
    setTemplates,
    loading: loading || authLoading,
    error,
    reload,
  }
}
