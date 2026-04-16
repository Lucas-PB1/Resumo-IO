"use client"

import React, { useEffect, useState, use } from "react"
import {
  ArrowLeft,
  FileDown,
  Loader2,
  Image as ImageIcon,
  CheckCircle2,
  FileType,
  Plus,
  Trash2,
  X,
  PlusCircle,
  Sparkles,
} from "lucide-react"
import { motion } from "motion/react"
import Link from "next/link"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { useAuth } from "@/features/auth/hooks/useAuth"
import {
  templateService,
  DocumentTemplate,
} from "@/features/documents/services/template.service"
import { generatorService } from "@/features/documents/services/generator.service"
import {
  documentService,
  GeneratedDocument,
} from "@/features/documents/services/document.service"
import { pdfService } from "@/features/documents/services/pdf.service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"

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
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [dataLoading, setDataLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [authorName, setAuthorName] = useState("")

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
            const initialData: Record<string, any> = {}
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
        formData,
        fieldTypes
      )

      const baseName = editingDoc
        ? editingDoc.fileName.replace(/\.(docx|pdf)$/, "")
        : `${template.name}_${Date.now()}`
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
          <div className="grid grid-cols-1 gap-x-12 gap-y-10">
            {template.fields.map((field) => (
              <div key={field.key} className="space-y-4 md:col-span-1">
                <Label className="text-muted-foreground ml-1 flex items-center gap-2 text-xs font-black tracking-widest uppercase">
                  {field.label}{" "}
                  {field.type === "image" && (
                    <ImageIcon size={16} className="text-brand-500" />
                  )}
                </Label>

                {field.type === "text" && (
                  <div className="md:grid">
                    <Input
                      value={formData[field.key]}
                      onChange={(e) =>
                        handleInputChange(field.key, e.target.value)
                      }
                      placeholder={`Ex: Informe o ${field.label.toLowerCase()}`}
                      className="bg-muted/30 focus-visible:ring-brand-500/30 h-14 rounded-2xl border-none text-lg font-medium"
                    />
                  </div>
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
                          src={formData[field.key]}
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

      <div className="bg-brand-500/5 border-brand-500/10 flex items-start gap-4 rounded-[2.5rem] border p-8">
        <div className="bg-brand-500/20 text-brand-500 rounded-2xl p-3">
          <CheckCircle2 size={24} />
        </div>
        <div className="space-y-1">
          <h4 className="text-foreground text-lg font-bold">
            Dica de Exportação
          </h4>
          <p className="text-muted-foreground font-medium">
            Os arquivos gerados são salvos automaticamente no seu histórico de
            **Documentos**. Você pode acessá-los a qualquer momento.
          </p>
        </div>
      </div>
    </div>
  )
}
