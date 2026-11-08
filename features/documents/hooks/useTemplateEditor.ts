"use client"

import { useCallback, useEffect, useState } from "react"
import { useAuth } from "@/features/auth/hooks/useAuth"
import { useProfile } from "@/features/user/hooks/useProfile"
import {
  templateService,
  type DocumentTemplate,
  type TemplateField,
} from "@/features/documents/services/template.service"
import {
  taxonomyService,
  type Category,
} from "@/features/documents/services/taxonomy.service"
import { fileService } from "@/features/documents/services/file.service"
import { placeholderService } from "@/features/documents/services/placeholder.service"

/** Estado do cadastro/edição de um modelo. Sem `templateId` = novo modelo. */
export function useTemplateEditor(templateId?: string) {
  const { user, loading: authLoading } = useAuth()
  const { displayName } = useProfile()

  const [original, setOriginal] = useState<DocumentTemplate | null>(null)
  const [name, setName] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [fields, setFields] = useState<TemplateField[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [category, setCategoryState] = useState("")
  const [subcategory, setSubcategory] = useState("")
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) {
      if (!authLoading) setLoading(false)
      return
    }
    Promise.all([
      templateId ? templateService.getTemplateById(templateId) : null,
      taxonomyService.getCategories(user.uid),
    ])
      .then(([tpl, cats]) => {
        setCategories(cats)
        if (templateId && !tpl) setNotFound(true)
        if (tpl) {
          setOriginal(tpl)
          setName(tpl.name)
          setFields(tpl.fields)
          setCategoryState(tpl.category ?? "")
          setSubcategory(tpl.subcategory ?? "")
        }
      })
      .catch((err) => {
        console.error("Failed to fetch data", err)
        if (templateId) setNotFound(true)
      })
      .finally(() => setLoading(false))
  }, [user, authLoading, templateId])

  const setCategory = useCallback((value: string) => {
    setCategoryState(value)
    setSubcategory("")
  }, [])

  const subcategories =
    categories.find((c) => c.name === category)?.subcategories ?? []

  /** Valida e lê as etiquetas do .docx. Retorna mensagem de erro, se houver. */
  const selectFile = useCallback(
    async (selected: File): Promise<string | null> => {
      const validation = fileService.validateTemplateFile(selected)
      if (!validation.ok) return validation.message ?? "Arquivo inválido."
      setFile(selected)
      setName((prev) => prev || selected.name.replace(/\.docx$/i, ""))
      setScanning(true)
      try {
        setFields(await placeholderService.extractFields(selected, fields))
        return null
      } catch (err) {
        console.error("Scanning error", err)
        setFile(null)
        return err instanceof Error
          ? err.message
          : "Não foi possível ler o arquivo. Confira se é um .docx válido."
      } finally {
        setScanning(false)
      }
    },
    [fields]
  )

  const updateField = useCallback(
    (index: number, updates: Partial<TemplateField>) =>
      setFields((prev) =>
        prev.map((f, i) => (i === index ? { ...f, ...updates } : f))
      ),
    []
  )

  const removeField = useCallback(
    (index: number) => setFields((prev) => prev.filter((_, i) => i !== index)),
    []
  )

  const moveField = useCallback((index: number, delta: -1 | 1) => {
    setFields((prev) => {
      const target = index + delta
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }, [])

  const canSave =
    !!name.trim() && fields.length > 0 && (!!file || !!original) && !scanning

  /** Salva e retorna o id do modelo. */
  const save = useCallback(async (): Promise<string> => {
    if (!user) throw new Error("Sessão expirada")
    setSaving(true)
    try {
      let upload: { fileUrl: string; storagePath: string } | null = null
      if (file)
        upload = await templateService.uploadTemplateFile(file, user.uid)

      if (original?.id) {
        await templateService.updateTemplate(original.id, {
          name: name.trim(),
          fields,
          category,
          subcategory,
          ...(upload ?? {}),
        })
        return original.id
      }

      if (!upload) throw new Error("Envie o arquivo .docx do modelo")
      return await templateService.saveTemplate({
        name: name.trim(),
        ...upload,
        fields,
        ownerId: user.uid,
        category,
        subcategory,
        authorId: user.uid,
        authorName: displayName || user.email || "Autor desconhecido",
      })
    } finally {
      setSaving(false)
    }
  }, [user, file, original, name, fields, category, subcategory, displayName])

  return {
    isNew: !templateId,
    original,
    name,
    setName,
    file,
    fields,
    categories,
    category,
    setCategory,
    subcategory,
    setSubcategory,
    subcategories,
    loading: loading || authLoading,
    notFound,
    scanning,
    saving,
    canSave,
    selectFile,
    updateField,
    removeField,
    moveField,
    save,
  }
}
