"use client"

import React, { useEffect, useState, use } from "react"
import {
  ArrowLeft,
  AlignLeft,
  FileDown,
  Loader2,
  Image as ImageIcon,
  CheckCircle2,
  CalendarDays,
  FileType,
  Plus,
  X,
  Sparkles,
  Paperclip,
  Phone,
  HardDrive,
  FileText,
} from "lucide-react"
import { motion } from "motion/react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/features/auth/hooks/useAuth"
import { templateService } from "@/features/documents/services/template.service"
import type { DocumentTemplate } from "@/features/documents/services/template.service"
import { generatorService } from "@/features/documents/services/generator.service"
import { documentService } from "@/features/documents/services/document.service"
import type {
  Evidence,
  GeneratedDocument,
} from "@/features/documents/services/document.service"
import { pdfService } from "@/features/documents/services/pdf.service"
import { fileService } from "@/features/documents/services/file.service"
import { fieldFormatService } from "@/features/documents/services/field-format.service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

export default function FillReportPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>
}) {
  const params = use(paramsPromise)
  const searchParams = useSearchParams()
  const editDocId = searchParams.get("editDocId")

  const { user, loading: authLoading } = useAuth()
  const [template, setTemplate] = useState<DocumentTemplate | null>(null)
  const [editingDoc, setEditingDoc] = useState<GeneratedDocument | null>(null)
  const [formData, setFormData] = useState<
    Record<string, string | number | boolean | null>
  >({})
  const [dataLoading, setDataLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [authorName, setAuthorName] = useState("")
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([])
  const [showTips, setShowTips] = useState(true)

  // Fetch user profile to get author name
  useEffect(() => {
    async function fetchProfile() {
      if (!user) return
      try {
        const { userService } =
          await import("@/features/user/services/user.service")
        const profile = await userService.getUserProfile(user.uid)
        if (profile) {
          setAuthorName(`${profile.firstName} ${profile.lastName}`)
        } else if (user.displayName) {
          setAuthorName(user.displayName)
        }
      } catch (err) {
        console.error("Failed to fetch profile", err)
      }
    }
    fetchProfile()
  }, [user])

  useEffect(() => {
    async function fetchData() {
      if (!user) {
        if (!authLoading) setDataLoading(false)
        return
      }
      try {
        const [tplData, docs] = await Promise.all([
          templateService.getTemplateById(params.id),
          editDocId
            ? documentService.getDocuments(user.uid)
            : Promise.resolve([]),
        ])

        if (tplData) {
          setTemplate(tplData)

          const editData = docs.find((d) => d.id === editDocId)

          if (editData && editData.formData) {
            setEditingDoc(editData)
            setFormData(editData.formData)
          } else {
            const initialData: Record<
              string,
              string | number | boolean | null
            > = {}
            tplData.fields.forEach((f) => {
              initialData[f.key] = ""
            })
            setFormData(initialData)
          }
        }
      } catch (err) {
        console.error("Fetch error", err)
      } finally {
        setDataLoading(false)
      }
    }
    fetchData()
  }, [params.id, editDocId, user, authLoading])

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleImageChange = async (key: string, file: File) => {
    const validation = fileService.validateImageFile(file)
    if (!validation.ok) {
      alert(validation.message)
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, [key]: reader.result as string }))
    }
    reader.readAsDataURL(file)
  }

  const processGeneration = async (mode: "docx" | "pdf") => {
    if (!template || !user) return

    if (mode === "docx") setIsGenerating(true)
    else setIsGeneratingPdf(true)

    try {
      const templateBuffer = await generatorService.fetchBuffer(
        template.fileUrl
      )
      const fieldTypes: Record<string, string> = {}
      template.fields.forEach((f) => (fieldTypes[f.key] = f.type))

      const docxBlob = await generatorService.generateDocx(
        templateBuffer,
        fieldFormatService.prepareTemplateData(formData, template.fields),
        fieldTypes
      )

      const baseName = editingDoc
        ? fileService.sanitizeFileName(
            editingDoc.fileName.replace(/\.(docx|pdf)$/, "")
          )
        : fileService.sanitizeFileName(`${template.name}_${Date.now()}`)
      const wordName = `${baseName}.docx`

      let finalFileUrl = ""
      let finalStoragePath = ""
      let finalFileName = wordName

      if (mode === "docx") {
        const { fileUrl, storagePath } =
          await templateService.uploadGeneratedFile(
            docxBlob,
            wordName,
            user.uid
          )
        finalFileUrl = fileUrl
        finalStoragePath = storagePath
        await generatorService.downloadBlob(docxBlob, wordName)
      } else {
        const pdfBlob = await pdfService.convertDocxToPdf(docxBlob, wordName)
        const pdfName = `${baseName}.pdf`
        const { fileUrl, storagePath } =
          await templateService.uploadGeneratedFile(pdfBlob, pdfName, user.uid)
        finalFileUrl = fileUrl
        finalStoragePath = storagePath
        finalFileName = pdfName
        await generatorService.downloadBlob(pdfBlob, pdfName)
      }

      // Upload evidence if any
      let uploadedEvidence: Evidence[] = []
      if (evidenceFiles.length > 0) {
        uploadedEvidence = await documentService.uploadEvidence(
          evidenceFiles,
          user.uid
        )
      }

      const docPayload = {
        templateId: template.id!,
        templateName: template.name,
        fileName: finalFileName,
        fileUrl: finalFileUrl,
        storagePath: finalStoragePath,
        ownerId: user.uid,
        category: template.category,
        subcategory: template.subcategory,
        authorId: user.uid,
        authorName:
          authorName || user.displayName || user.email || "Autor Desconhecido",
        formData: formData,
        evidence: uploadedEvidence,
      }

      if (editingDoc) {
        await documentService.updateDocument(editingDoc.id!, docPayload)
      } else {
        await documentService.saveGeneratedDocument(docPayload)
      }

      setIsDone(true)
      setTimeout(() => setIsDone(false), 3000)
    } catch (err) {
      console.error("Generation error", err)
      alert(`Erro ao gerar o arquivo ${mode.toUpperCase()}.`)
    } finally {
      setIsGenerating(false)
      setIsGeneratingPdf(false)
    }
  }

  if (authLoading || (dataLoading && user))
    return (
      <div className="text-muted-foreground animate-pulse p-20 text-center text-lg font-medium">
        Preparando formulário...
      </div>
    )

  if (!template)
    return (
      <div className="p-20 text-center text-red-500">
        Modelo não encontrado.
      </div>
    )

  return (
    <div className="mx-auto max-w-5xl space-y-12 pb-20">
      <div className="flex items-center gap-6">
        <Link href="/dashboard/templates">
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-brand-500/10 text-brand-500 rounded-2xl"
          >
            <ArrowLeft />
          </Button>
        </Link>
        <div className="space-y-1">
          <h1 className="text-foreground text-5xl font-black tracking-tighter">
            {template.name}
          </h1>
          <p className="text-muted-foreground text-xl font-medium">
            Preencha os dados e gere seu relatório premium.
          </p>
        </div>
      </div>

      <Card className="bg-card/60 overflow-hidden border-none shadow-2xl backdrop-blur-2xl">
        <div className="bg-brand-500 h-3" />
        <CardHeader className="p-12 pb-6">
          <CardTitle className="text-2xl">Dados do Relatório</CardTitle>
          <CardDescription className="text-base font-medium">
            As informações abaixo serão injetadas diretamente no modelo Word.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-12 p-12 pt-0">
          <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2">
            {template.fields.map((field) => (
              <div
                key={field.key}
                className={cn(
                  "min-w-0 space-y-3",
                  (field.type === "image" || field.type === "textarea") &&
                    "md:col-span-2"
                )}
              >
                <Label className="text-muted-foreground ml-1 flex items-center gap-2 text-xs font-black tracking-widest uppercase">
                  {field.label}{" "}
                  {field.type === "image" && (
                    <ImageIcon size={16} className="text-brand-500" />
                  )}
                  {field.type === "date" && (
                    <CalendarDays size={16} className="text-brand-500" />
                  )}
                  {field.type === "textarea" && (
                    <AlignLeft size={16} className="text-brand-500" />
                  )}
                  {field.type === "phone" && (
                    <Phone size={16} className="text-brand-500" />
                  )}
                </Label>

                {field.type === "text" && (
                  <div className="md:grid">
                    <Input
                      value={
                        typeof formData[field.key] === "string" ||
                        typeof formData[field.key] === "number"
                          ? (formData[field.key] as string | number)
                          : ""
                      }
                      onChange={(e) =>
                        handleInputChange(field.key, e.target.value)
                      }
                      placeholder={`Ex: Informe o ${field.label.toLowerCase()}`}
                      className="bg-muted/30 focus-visible:ring-brand-500/30 h-12 rounded-xl border-white/10 text-base font-medium"
                    />
                  </div>
                )}

                {field.type === "phone" && (
                  <Input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={fieldFormatService.formatPhoneForInput(
                      formData[field.key]
                    )}
                    onChange={(e) =>
                      handleInputChange(
                        field.key,
                        fieldFormatService.formatPhoneForInput(e.target.value)
                      )
                    }
                    placeholder="(00) 00000-0000"
                    className="bg-muted/30 focus-visible:ring-brand-500/30 h-12 rounded-xl border-white/10 text-base font-medium"
                  />
                )}

                {field.type === "textarea" && (
                  <Textarea
                    value={
                      typeof formData[field.key] === "string" ||
                      typeof formData[field.key] === "number"
                        ? (formData[field.key] as string | number)
                        : ""
                    }
                    onChange={(e) =>
                      handleInputChange(field.key, e.target.value)
                    }
                    placeholder={`Escreva ${field.label.toLowerCase()}...`}
                    className="bg-muted/30 focus-visible:ring-brand-500/30 min-h-40 rounded-xl border-white/10 text-base leading-relaxed font-medium"
                  />
                )}

                {field.type === "date" && (
                  <Input
                    type="date"
                    value={fieldFormatService.toDateInputValue(
                      formData[field.key]
                    )}
                    onChange={(e) =>
                      handleInputChange(field.key, e.target.value)
                    }
                    className="bg-muted/30 focus-visible:ring-brand-500/30 h-12 rounded-xl border-white/10 text-base font-medium"
                  />
                )}

                {field.type === "image" && (
                  <div className="space-y-5">
                    <div
                      className="bg-muted/20 hover:border-brand-500/30 group relative cursor-pointer rounded-2xl border-2 border-dashed border-white/5 p-6 text-center transition-all"
                      onClick={() =>
                        document.getElementById(`file-${field.key}`)?.click()
                      }
                    >
                      <ImageIcon
                        size={32}
                        className="group-hover:text-brand-500 mx-auto mb-2 opacity-30 transition-all group-hover:scale-110"
                      />
                      <p className="text-sm font-bold opacity-60">
                        Escolher Imagem
                      </p>
                      <input
                        id={`file-${field.key}`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleImageChange(field.key, file)
                        }}
                      />
                    </div>

                    <div className="bg-brand-500/5 border-brand-500/10 rounded-xl border p-3">
                      <p className="text-brand-400 flex items-center gap-2 text-[10px] font-black tracking-widest uppercase">
                        <Sparkles size={12} /> Inteligência Automática
                      </p>
                      <p className="text-muted-foreground mt-1 text-xs font-medium">
                        Campo configurado como{" "}
                        <span className="text-brand-500 font-bold">Imagem</span>
                        . O sistema converterá as etiquetas no Word
                        automaticamente durante a geração.
                      </p>
                    </div>

                    {formData[field.key] && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="border-background relative h-40 w-40 overflow-hidden rounded-3xl border-4 shadow-2xl"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={
                            typeof formData[field.key] === "string"
                              ? (formData[field.key] as string)
                              : ""
                          }
                          alt="Preview"
                          className="h-full w-full object-cover"
                        />
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Evidence Section */}
          <div className="border-t border-white/5 pt-12">
            <div className="mb-6 flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-brand-400 flex items-center gap-2 text-xs font-black tracking-widest uppercase">
                  <Paperclip size={14} /> Evidências (Anexos)
                </Label>
                <p className="text-muted-foreground text-sm font-medium">
                  Anexe arquivos que serviram de base para este relatório (PDFs,
                  Imagens, Documentos).
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  document.getElementById("evidence-upload")?.click()
                }
                className="border-brand-500/20 text-brand-400 h-10 gap-2 rounded-xl"
              >
                <Plus size={16} /> Adicionar Arquivo
              </Button>
              <input
                id="evidence-upload"
                type="file"
                multiple
                accept=".pdf,.docx,image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files || [])
                  const invalidFile = files.find(
                    (file) => !fileService.validateEvidenceFile(file).ok
                  )

                  if (invalidFile) {
                    alert(fileService.validateEvidenceFile(invalidFile).message)
                    e.target.value = ""
                    return
                  }

                  setEvidenceFiles((prev) => [...prev, ...files])
                  e.target.value = ""
                }}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {evidenceFiles.map((file, i) => (
                <motion.div
                  key={`${file.name}-${i}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-brand-500/5 group hover:bg-brand-500/10 flex items-center justify-between rounded-2xl border border-white/5 p-4 transition-all"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="bg-brand-500/20 text-brand-500 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                      <FileText size={18} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-foreground truncate text-sm font-bold">
                        {file.name}
                      </p>
                      <p className="text-muted-foreground text-[10px] font-medium uppercase">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setEvidenceFiles((prev) =>
                        prev.filter((_, idx) => idx !== i)
                      )
                    }
                    className="h-8 w-8 rounded-lg text-red-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-500/10"
                  >
                    <X size={16} />
                  </Button>
                </motion.div>
              ))}
              {evidenceFiles.length === 0 && (
                <div className="bg-muted/10 col-span-full flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/5 py-10 opacity-50">
                  <HardDrive size={32} className="mb-2" />
                  <p className="text-sm font-medium italic">
                    Nenhum anexo de evidência adicionado.
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/20 flex flex-col gap-8 p-12 pt-6 sm:flex-row">
          <Button
            onClick={() => processGeneration("docx")}
            disabled={isGenerating || isGeneratingPdf}
            size="lg"
            className="shadow-brand-500/40 h-20 flex-1 gap-4 rounded-4xl text-xl font-black shadow-2xl"
          >
            {isGenerating ? (
              <Loader2 className="animate-spin" size={32} />
            ) : isDone ? (
              <CheckCircle2 size={32} />
            ) : (
              <FileDown size={32} />
            )}
            {isGenerating
              ? "Processando..."
              : isDone
                ? "Pronto!"
                : "Baixar Word"}
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="border-brand-500/20 text-brand-400 hover:bg-brand-500 h-20 flex-1 gap-4 rounded-4xl border-2 text-xl font-black shadow-xl transition-all hover:text-white"
            onClick={() => processGeneration("pdf")}
            disabled={isGenerating || isGeneratingPdf}
          >
            {isGeneratingPdf ? (
              <Loader2 className="animate-spin" size={32} />
            ) : (
              <FileType size={32} />
            )}
            {isGeneratingPdf ? "Convertendo..." : "Gerar PDF"}
          </Button>
        </CardFooter>
      </Card>

      {showTips && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-brand-500/5 border-brand-500/10 relative flex items-start gap-4 rounded-[2.5rem] border p-8"
        >
          <div className="bg-brand-500/20 text-brand-500 shrink-0 rounded-2xl p-3">
            <CheckCircle2 size={24} />
          </div>
          <div className="space-y-1 pr-8">
            <h4 className="text-foreground text-lg font-bold">
              Dica de Exportação
            </h4>
            <p className="text-muted-foreground font-medium">
              Os arquivos gerados são salvos automaticamente no seu histórico de
              **Documentos**. Você pode acessá-los a qualquer momento.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowTips(false)}
            className="absolute top-4 right-4 h-8 w-8 rounded-full hover:bg-white/5"
          >
            <X size={16} />
          </Button>
        </motion.div>
      )}
    </div>
  )
}
