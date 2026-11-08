"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useAuth } from "@/features/auth/hooks/useAuth"
import { useProfile } from "@/features/user/hooks/useProfile"
import {
  templateService,
  type DocumentTemplate,
} from "@/features/documents/services/template.service"
import {
  documentService,
  type Evidence,
  type GeneratedDocument,
} from "@/features/documents/services/document.service"
import { generatorService } from "@/features/documents/services/generator.service"
import { pdfService } from "@/features/documents/services/pdf.service"
import { fileService } from "@/features/documents/services/file.service"
import {
  fieldFormatService,
  type TemplateFormData,
} from "@/features/documents/services/field-format.service"
import {
  countFilled,
  draftService,
} from "@/features/documents/services/draft.service"

export type OutputFormat = "docx" | "pdf"

export type SaveState =
  | { kind: "idle" }
  | { kind: "draft"; at: number }
  | { kind: "restored"; at: number }
  | { kind: "copied"; from: string }

const AUTOSAVE_DELAY = 800

/**
 * Estado e ações da tela de preenchimento:
 * carrega o modelo (e o documento em edição), mantém o formulário,
 * faz autosave local e gera o arquivo final.
 */
export function useDocumentForm(
  templateId: string,
  {
    editDocId,
    fromDocId,
  }: { editDocId: string | null; fromDocId: string | null }
) {
  const { user, loading: authLoading } = useAuth()
  const { displayName } = useProfile()

  const [template, setTemplate] = useState<DocumentTemplate | null>(null)
  const [editingDoc, setEditingDoc] = useState<GeneratedDocument | null>(null)
  const [formData, setFormData] = useState<TemplateFormData>({})
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([])
  const [templateBuffer, setTemplateBuffer] = useState<ArrayBuffer | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [generating, setGenerating] = useState<OutputFormat | null>(null)
  const [saveState, setSaveState] = useState<SaveState>({ kind: "idle" })
  const dirty = useRef(false)

  // Carregamento inicial
  useEffect(() => {
    if (!user) {
      if (!authLoading) setLoading(false)
      return
    }
    let active = true

    async function load() {
      try {
        const sourceId = editDocId ?? fromDocId
        const [tpl, doc] = await Promise.all([
          templateService.getTemplateById(templateId),
          sourceId
            ? documentService.getDocumentById(sourceId)
            : Promise.resolve(null),
        ])
        if (!active) return
        if (!tpl) {
          setNotFound(true)
          return
        }
        setTemplate(tpl)

        const empty = Object.fromEntries(tpl.fields.map((f) => [f.key, ""]))

        if (doc?.formData && editDocId) {
          setEditingDoc(doc)
          setFormData({ ...empty, ...doc.formData })
        } else if (doc?.formData) {
          // Duplicar: novo documento partindo dos dados de um anterior
          dirty.current = true
          setFormData({ ...empty, ...doc.formData })
          setSaveState({ kind: "copied", from: doc.fileName })
        } else {
          const draft = draftService.get(user!.uid, templateId)
          if (draft) {
            setFormData({ ...empty, ...draft.formData })
            setSaveState({ kind: "restored", at: draft.updatedAt })
          } else {
            setFormData(empty)
          }
        }

        // O buffer do modelo alimenta a prévia e a geração.
        generatorService
          .fetchBuffer(tpl.fileUrl)
          .then((buf) => active && setTemplateBuffer(buf))
          .catch((err) => console.error("Template fetch error", err))
      } catch (err) {
        console.error("Fetch error", err)
        if (active) setNotFound(true)
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [templateId, editDocId, fromDocId, user, authLoading])

  const fieldKeys = useMemo(
    () => template?.fields.map((f) => f.key) ?? [],
    [template]
  )
  const filled = countFilled(formData, fieldKeys)
  const total = fieldKeys.length

  // Autosave (apenas para documentos novos; edições têm o registro salvo)
  useEffect(() => {
    if (!user || !template || editingDoc || !dirty.current) return
    const t = window.setTimeout(() => {
      draftService.save(user.uid, {
        templateId: template.id!,
        templateName: template.name,
        formData,
        filled,
        total,
      })
      setSaveState((prev) =>
        prev.kind === "copied" ? prev : { kind: "draft", at: Date.now() }
      )
    }, AUTOSAVE_DELAY)
    return () => window.clearTimeout(t)
  }, [formData, user, template, editingDoc, filled, total])

  const setField = useCallback((key: string, value: string | null) => {
    dirty.current = true
    setFormData((prev) => ({ ...prev, [key]: value }))
  }, [])

  const setImage = useCallback(
    (key: string, file: File): string | null => {
      const validation = fileService.validateImageFile(file)
      if (!validation.ok) return validation.message ?? "Imagem inválida."
      const reader = new FileReader()
      reader.onloadend = () => setField(key, reader.result as string)
      reader.readAsDataURL(file)
      return null
    },
    [setField]
  )

  const addEvidence = useCallback((files: File[]): string | null => {
    const invalid = files.find((f) => !fileService.validateEvidenceFile(f).ok)
    if (invalid) return fileService.validateEvidenceFile(invalid).message ?? ""
    setEvidenceFiles((prev) => [...prev, ...files])
    return null
  }, [])

  const removeEvidence = useCallback((index: number) => {
    setEvidenceFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const discardDraft = useCallback(() => {
    if (!user || !template) return
    draftService.remove(user.uid, template.id!)
    dirty.current = false
    setFormData(Object.fromEntries(template.fields.map((f) => [f.key, ""])))
    setSaveState({ kind: "idle" })
  }, [user, template])

  /** Gera o arquivo, faz o download, salva no histórico. Retorna o documento salvo. */
  const generate = useCallback(
    async (format: OutputFormat): Promise<GeneratedDocument> => {
      if (!template || !user) throw new Error("Modelo não carregado")
      setGenerating(format)
      try {
        const buffer =
          templateBuffer ??
          (await generatorService.fetchBuffer(template.fileUrl))
        const fieldTypes = Object.fromEntries(
          template.fields.map((f) => [f.key, f.type])
        )
        const docxBlob = await generatorService.generateDocx(
          buffer,
          fieldFormatService.prepareTemplateData(formData, template.fields),
          fieldTypes
        )

        const baseName = editingDoc
          ? fileService.sanitizeFileName(
              editingDoc.fileName.replace(/\.(docx|pdf)$/, "")
            )
          : fileService.sanitizeFileName(
              `${template.name}_${new Date().toISOString().slice(0, 10)}_${Date.now().toString().slice(-4)}`
            )

        let blob: Blob = docxBlob
        let fileName = `${baseName}.docx`
        if (format === "pdf") {
          blob = await pdfService.convertDocxToPdf(docxBlob, fileName)
          fileName = `${baseName}.pdf`
        }

        const { fileUrl, storagePath } =
          await templateService.uploadGeneratedFile(blob, fileName, user.uid)
        await generatorService.downloadBlob(blob, fileName)

        const uploaded: Evidence[] = evidenceFiles.length
          ? await documentService.uploadEvidence(evidenceFiles, user.uid)
          : []

        const payload = {
          templateId: template.id!,
          templateName: template.name,
          fileName,
          fileUrl,
          storagePath,
          ownerId: user.uid,
          category: template.category ?? "",
          subcategory: template.subcategory ?? "",
          authorId: user.uid,
          authorName: displayName || user.email || "Autor desconhecido",
          formData,
          // Mantém os anexos já existentes ao regerar um documento
          evidence: [...(editingDoc?.evidence ?? []), ...uploaded],
        }

        let saved: GeneratedDocument
        if (editingDoc?.id) {
          await documentService.updateDocument(editingDoc.id, payload)
          saved = { ...editingDoc, ...payload }
        } else {
          const { id, createdAt } =
            await documentService.saveGeneratedDocument(payload)
          saved = { ...payload, id, createdAt }
          draftService.remove(user.uid, template.id!)
        }

        // A partir daqui, novas gerações atualizam o mesmo registro.
        setEditingDoc(saved)
        setEvidenceFiles([])
        setSaveState({ kind: "idle" })
        dirty.current = false
        return saved
      } finally {
        setGenerating(null)
      }
    },
    [
      template,
      user,
      templateBuffer,
      formData,
      editingDoc,
      evidenceFiles,
      displayName,
    ]
  )

  return {
    template,
    editingDoc,
    formData,
    templateBuffer,
    evidenceFiles,
    loading: loading || authLoading,
    notFound,
    generating,
    saveState,
    filled,
    total,
    setField,
    setImage,
    addEvidence,
    removeEvidence,
    discardDraft,
    generate,
  }
}
